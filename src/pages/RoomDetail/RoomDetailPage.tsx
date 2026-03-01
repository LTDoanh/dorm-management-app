import React, { useEffect, useMemo, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Box, Text, Spinner, Button, Input } from "zmp-ui";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Room } from "@dts";
import { API_BASE_URL } from "@constants/common";

// Component để xác nhận thanh toán cho từng tenant
const TenantPaymentConfirmation: React.FC<{
  tenant: Tenant;
  onConfirm: (tenantId: string, receivedAmount: number) => Promise<void>;
}> = ({ tenant, onConfirm }) => {
  const totalAmount = (tenant.current_bill || 0) + (tenant.debt || 0);
  const defaultReceived = totalAmount;
  const [receivedAmount, setReceivedAmount] = useState<string>(defaultReceived.toString());
  const [confirming, setConfirming] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <Box
      p={2}
      style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        border: "1px solid #ffc107",
        marginTop: 8,
      }}
    >
      <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        Số tiền đã nhận (mặc định: {formatPrice(defaultReceived)} VNĐ):
      </Text>
      <Input
        type="number"
        value={receivedAmount}
        onChange={(e) => setReceivedAmount(e.target.value.toString())}
        placeholder="Nhập số tiền đã nhận"
        style={{ marginBottom: 8 }}
      />
      <Button
        onClick={async () => {
          setConfirming(true);
          await onConfirm(tenant.id, parseFloat(receivedAmount || "0"));
          setConfirming(false);
        }}
        type="primary"
        style={{ width: "100%" }}
        disabled={confirming || !receivedAmount}
      >
        {confirming ? "Đang xác nhận..." : "✅ Xác nhận đã nhận tiền"}
      </Button>
    </Box>
  );
};

interface Tenant {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  avatar?: string;
  created_at?: string;
  current_bill?: number;
  debt?: number;
  payment_status?: string;
  owner_confirmed_amount?: number;
}

const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<"price" | "tenant" | null>(null);
  const [saving, setSaving] = useState(false);
  const [billingStatus, setBillingStatus] = useState<string>("");

  // Form values
  const [roomPrice, setRoomPrice] = useState<string>("");
  const [serviceFee, setServiceFee] = useState<string>("");
  const [electricityPrice, setElectricityPrice] = useState<string>("");
  const [waterPrice, setWaterPrice] = useState<string>("");
  const [newTenantPhone, setNewTenantPhone] = useState<string>("");
  const [addingTenant, setAddingTenant] = useState(false);
  const [prevWaterIndex, setPrevWaterIndex] = useState<string>("");
  const [currentWaterIndex, setCurrentWaterIndex] = useState<string>("");
  const [prevElectricIndex, setPrevElectricIndex] = useState<string>("");
  const [currentElectricIndex, setCurrentElectricIndex] = useState<string>("");
  const [parsingWater, setParsingWater] = useState(false);
  const [parsingElectric, setParsingElectric] = useState(false);
  const [penalty, setPenalty] = useState<string>("");
  const [waterImage, setWaterImage] = useState<string>("");
  const [electricImage, setElectricImage] = useState<string>("");

  const waterUsage = useMemo(() => {
    const p = Number(prevWaterIndex || 0);
    const c = Number(currentWaterIndex || 0);
    return c > p ? c - p : 0;
  }, [prevWaterIndex, currentWaterIndex]);

  const electricUsage = useMemo(() => {
    const p = Number(prevElectricIndex || 0);
    const c = Number(currentElectricIndex || 0);
    return c > p ? c - p : 0;
  }, [prevElectricIndex, currentElectricIndex]);

  useEffect(() => {
    if (roomId) {
      loadRoom();
      loadTenants();
      // Nếu có edit=1 trên URL, bật edit mode
      if (searchParams.get("edit") === "1") {
        setEditSection("price");
      }
    }
  }, [roomId, searchParams]);

  const loadRoom = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        // Map snake_case từ backend sang camelCase
        const roomData: Room = {
          ...data,
          buildingId: data.building_id,
          ownerId: data.owner_id,
          roomPrice: data.room_price,
          serviceFee: data.service_fee,
          electricityPrice: data.electricity_price,
          waterPrice: data.water_price,
        };
        setRoom(roomData);
        // Set form values
        setRoomPrice(data.room_price?.toString() || "");
        setServiceFee(data.service_fee?.toString() || "");
        setElectricityPrice(data.electricity_price?.toString() || "");
        setWaterPrice(data.water_price?.toString() || "");
        setPrevWaterIndex(data.prev_water_index?.toString() || "");
        setPrevElectricIndex(data.prev_electricity_index?.toString() || "");
      }
    } catch (error) {
      console.error("Lỗi tải thông tin phòng:", error);
    }
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/tenants/room/${roomId}`
      );
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách người thuê trọ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_price: roomPrice ? parseFloat(roomPrice) : null,
          service_fee: serviceFee ? parseFloat(serviceFee) : null,
          electricity_price: electricityPrice ? parseFloat(electricityPrice) : null,
          water_price: waterPrice ? parseFloat(waterPrice) : null,
        }),
      });

      if (res.ok) {
        await loadRoom();
        setEditSection(null);
      }
    } catch (error) {
      console.error("Lỗi lưu thông tin phòng:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form values
    if (room) {
      setRoomPrice(room.roomPrice?.toString() || "");
      setServiceFee(room.serviceFee?.toString() || "");
      setElectricityPrice(room.electricityPrice?.toString() || "");
      setWaterPrice(room.waterPrice?.toString() || "");
    }
    setEditSection(null);
    setNewTenantPhone("");
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Bạn có chắc muốn xóa người thuê trọ này?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadTenants();
      }
    } catch (error) {
      console.error("Lỗi xóa người thuê trọ:", error);
    }
  };

  const handleDeleteAllTenants = async () => {
    if (!confirm("Bạn có chắc muốn xóa TẤT CẢ người thuê trọ trong phòng này?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tenants/room/${roomId}/all`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await loadTenants();
      }
    } catch (error) {
      console.error("Lỗi xóa tất cả người thuê trọ:", error);
    }
  };

  const handleAddTenant = async () => {
    if (!newTenantPhone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    try {
      setAddingTenant(true);
      // Tìm user bằng số điện thoại
      const findRes = await fetch(`${API_BASE_URL}/api/tenants/find-by-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newTenantPhone.trim() }),
      });

      if (!findRes.ok) {
        alert("Không tìm thấy người dùng với số điện thoại này");
        return;
      }

      const user = await findRes.json();

      // Thêm tenant vào phòng
      const addRes = await fetch(`${API_BASE_URL}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId,
          userId: user.id,
        }),
      });

      if (addRes.ok) {
        await loadTenants();
        setNewTenantPhone("");
      } else {
        const error = await addRes.json();
        alert(error.error || "Không thể thêm người thuê trọ");
      }
    } catch (error) {
      console.error("Lỗi thêm người thuê trọ:", error);
      alert("Có lỗi xảy ra khi thêm người thuê trọ");
    } finally {
      setAddingTenant(false);
    }
  };

  const handleConfirmPayment = async (tenantId: string, receivedAmount: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/owner-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenantId,
          receivedAmount: receivedAmount,
        }),
      });

      if (res.ok) {
        await loadTenants();
        alert("Đã xác nhận nhận tiền thành công");
      } else {
        const error = await res.json();
        alert(error.error || "Không thể xác nhận nhận tiền");
      }
    } catch (error) {
      console.error("Lỗi xác nhận nhận tiền:", error);
      alert("Có lỗi xảy ra khi xác nhận nhận tiền");
    }
  };

  // Tính tổng tiền preview
  const totalPreview = useMemo(() => {
    const rp = roomPrice ? Number(roomPrice) : Number(room?.roomPrice || 0);
    const sf = serviceFee ? Number(serviceFee) : Number(room?.serviceFee || 0);
    const ep =
      electricityPrice !== "" ? Number(electricityPrice) : Number(room?.electricityPrice || 0);
    const wp = waterPrice !== "" ? Number(waterPrice) : Number(room?.waterPrice || 0);
    const wu = waterUsage ? Number(waterUsage) : 0;
    const eu = electricUsage ? Number(electricUsage) : 0;
    const pn = penalty ? Number(penalty) : 0;

    return rp + sf + ep * eu + wp * wu + pn;
  }, [roomPrice, serviceFee, electricityPrice, waterPrice, waterUsage, electricUsage, penalty, room]);

  const canSubmitBill = useMemo(() => {
    return currentWaterIndex.toString().trim() !== "" && currentElectricIndex.toString().trim() !== "";
  }, [currentWaterIndex, currentElectricIndex]);

  const handleCreateBill = async () => {
    if (!canSubmitBill) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/room/${roomId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          water_usage: waterUsage,
          electricity_usage: electricUsage,
          current_water_index: Number(currentWaterIndex),
          current_electricity_index: Number(currentElectricIndex),
          penalty: penalty ? Number(penalty) : 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Đã tính tiền: ${new Intl.NumberFormat("vi-VN").format(data.total)} VNĐ`);
        setBillingStatus("unpaid");
        // Làm mới danh sách tenants để hiển thị current_bill / debt
        await loadTenants();
      } else {
        const err = await res.json();
        alert(err.error || "Không tạo được hóa đơn");
      }
    } catch (error) {
      console.error("Lỗi tạo hóa đơn:", error);
      alert("Có lỗi xảy ra khi tạo hóa đơn");
    }
  };

  const processMeterImage = async (filePath: string, type: 'water' | 'electric') => {
    try {
      if (type === 'water') setParsingWater(true);
      else setParsingElectric(true);

      const response = await fetch(filePath);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const API_KEY = "9MSjoRWOeYUHu9KJBbIY";
      const MODEL_ENDPOINT = "https://serverless.roboflow.com/combined_ad_v2/4";

      const rfRes = await fetch(`${MODEL_ENDPOINT}?api_key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: base64data
      });

      if (!rfRes.ok) throw new Error("Lỗi API nhận diện");

      const rfData = await rfRes.json();
      let predictions = rfData.predictions || [];
      predictions = predictions.filter((p: any) => !["10", "11"].includes(p.class));
      predictions.sort((a: any, b: any) => a.x - b.x);

      if (predictions.length > 0) {
        const finalNumber = predictions.map((p: any) => p.class).join("");
        if (type === 'water') {
          setCurrentWaterIndex(finalNumber);
        } else {
          setCurrentElectricIndex(finalNumber);
        }
      } else {
        alert("Không nhận diện được số từ ảnh.");
      }
    } catch (error) {
      console.error("Lỗi nhận diện ảnh:", error);
      alert("Đã xảy ra lỗi khi đọc số từ ảnh.");
    } finally {
      if (type === 'water') setParsingWater(false);
      else setParsingElectric(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        id="room-detail-page"
        customHeader={<HomeHeader title="Danh sách người thuê trọ" />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  const formatPrice = (price: number | undefined) => {
    if (!price) return "0";
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <PageLayout
      id="room-detail-page"
      customHeader={
        <HomeHeader
          title={room?.name || "Chi tiết phòng"}
          onBack={() => {
            window.history.back();
          }}
        />
      }
    >
      <Box p={4} flex flexDirection="column" style={{ gap: 16 }}>
        {room && (
          <Box
            p={3}
            style={{
              backgroundColor: "#f0f7ff",
              borderRadius: 8,
              border: "1px solid #007AFF",
            }}
          >
            <Box flex justifyContent="space-between" alignItems="center">
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                🚪 {room.name}
              </Text>
              {!editSection && (
                <Box flex style={{ gap: 6 }}>
                  <Button
                    onClick={() => setEditSection("price")}
                    type="highlight"
                    size="small"
                  >
                    💰 Sửa giá
                  </Button>
                  <Button
                    onClick={() => setEditSection("tenant")}
                    type="neutral"
                    size="small"
                  >
                    👥 Quản lý
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {editSection === "price" ? (
          <>
            {/* Form chỉnh sửa giá */}
            <Box
              p={3}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
                ⚙️ Cài đặt giá phòng
              </Text>

              <Box flex flexDirection="column" style={{ gap: 12 }}>
                <Box>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                    Giá phòng (VNĐ/tháng)
                  </Text>
                  <Input
                    type="number"
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value.toString())}
                    placeholder="Ví dụ: 4000000"
                  />
                </Box>

                <Box>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                    Phí dịch vụ (VNĐ/tháng)
                  </Text>
                  <Input
                    type="number"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value.toString())}
                    placeholder="Ví dụ: 500000"
                  />
                </Box>

                <Box>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                    Giá điện (VNĐ/số)
                  </Text>
                  <Input
                    type="number"
                    value={electricityPrice}
                    onChange={(e) => setElectricityPrice(e.target.value.toString())}
                    placeholder="Ví dụ: 3000"
                  />
                </Box>

                <Box>
                  <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                    Giá nước (VNĐ/khối)
                  </Text>
                  <Input
                    type="number"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(e.target.value.toString())}
                    placeholder="Ví dụ: 30"
                  />
                </Box>
              </Box>

              <Box flex style={{ gap: 8, marginTop: 16 }}>
                <Button
                  onClick={handleSave}
                  type="primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "💾 Lưu"}
                </Button>
                <Button
                  onClick={handleCancel}
                  type="secondary"
                  style={{ flex: 1 }}
                >
                  Hủy
                </Button>
              </Box>
            </Box>
          </>
        ) : editSection === "tenant" ? (
          <>
            {/* Quản lý người thuê trọ */}
            <Box
              p={3}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: "#fff",
              }}
            >
              <Box flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  👥 Quản lý người thuê trọ
                </Text>
                <Box flex style={{ gap: 6 }}>
                  {tenants.length > 0 && (
                    <Button
                      onClick={handleDeleteAllTenants}
                      type="danger"
                      size="small"
                    >
                      🗑️ Xóa tất cả
                    </Button>
                  )}
                  <Button
                    onClick={() => setEditSection(null)}
                    type="neutral"
                    size="small"
                  >
                    ✕ Đóng
                  </Button>
                </Box>
              </Box>

              {/* Form thêm tenant mới */}
              <Box flex style={{ gap: 8, marginBottom: 16 }}>
                <Input
                  value={newTenantPhone}
                  onChange={(e) => setNewTenantPhone(e.target.value.toString())}
                  placeholder="Nhập số điện thoại người thuê trọ"
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={handleAddTenant}
                  type="highlight"
                  disabled={addingTenant}
                >
                  {addingTenant ? "..." : "+"}
                </Button>
              </Box>

              {/* Danh sách tenants */}
              {tenants.length === 0 ? (
                <Text style={{ color: "#999", textAlign: "center", padding: 16 }}>
                  Chưa có người thuê trọ
                </Text>
              ) : (
                <Box flex flexDirection="column" style={{ gap: 8 }}>
                  {tenants.map((tenant) => {
                    const totalOwed = (tenant.current_bill || 0) + (tenant.debt || 0);
                    const needsConfirmation = tenant.payment_status === "waiting_confirmation" || totalOwed > 0;

                    let statusText = "";
                    let statusColor = "#666";

                    if (totalOwed > 0) {
                      statusText = "Chưa thanh toán";
                      statusColor = "#d10000";
                    } else {
                      statusText = "Đã thanh toán";
                      statusColor = "green";
                    }
                    if (tenant.payment_status === "waiting_confirmation") {
                      statusText = "Chờ xác nhận";
                      statusColor = "#ff9800";
                    }

                    return (
                      <Box
                        key={tenant.id}
                        p={2}
                        style={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 8,
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <Box
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box flex alignItems="center" style={{ gap: 12, flex: 1 }}>
                            {tenant.avatar ? (
                              <Box
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundImage: `url(${tenant.avatar})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              />
                            ) : (
                              <Box
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: "#007AFF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                                  {tenant.nickname?.charAt(0).toUpperCase() || "?"}
                                </Text>
                              </Box>
                            )}
                            <Box flex flexDirection="column" style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                                {tenant.nickname || "Người dùng Zalo"}
                              </Text>
                              <Text style={{ fontSize: 12, color: "#666" }}>
                                ID: {tenant.user_id}
                              </Text>

                              <Text style={{ fontSize: 12, fontWeight: "bold", color: statusColor, marginTop: 4 }}>
                                Trạng thái: {statusText}
                              </Text>

                              {totalOwed > 0 && (
                                <Text style={{ fontSize: 12, color: "#d10000", marginTop: 2 }}>
                                  Cần thu: {formatPrice(totalOwed)} VNĐ
                                </Text>
                              )}
                            </Box>
                          </Box>
                          <Box flex flexDirection="column" style={{ gap: 4 }}>
                            <Button
                              onClick={() => handleDeleteTenant(tenant.id)}
                              type="danger"
                              size="small"
                            >
                              🗑️
                            </Button>
                          </Box>
                        </Box>
                        {needsConfirmation && (
                          <TenantPaymentConfirmation
                            tenant={tenant}
                            onConfirm={handleConfirmPayment}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </>
        ) : (
          <>
            {/* Hiển thị thông tin giá phòng + tính tiền nhanh */}
            <Box
              p={3}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
                💰 Thông tin giá phòng
              </Text>
              <Box flex flexDirection="column" style={{ gap: 8 }}>
                <Box flex justifyContent="space-between">
                  <Text style={{ fontSize: 14, color: "#666" }}>Giá phòng:</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                    {formatPrice(room?.roomPrice || 0)} VNĐ/tháng
                  </Text>
                </Box>
                <Box flex justifyContent="space-between">
                  <Text style={{ fontSize: 14, color: "#666" }}>Phí dịch vụ:</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                    {formatPrice(room?.serviceFee || 0)} VNĐ/tháng
                  </Text>
                </Box>
                <Box flex justifyContent="space-between">
                  <Text style={{ fontSize: 14, color: "#666" }}>Giá điện:</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                    {formatPrice(room?.electricityPrice || 0)} VNĐ/số
                  </Text>
                </Box>
                <Box flex justifyContent="space-between">
                  <Text style={{ fontSize: 14, color: "#666" }}>Giá nước:</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                    {formatPrice(room?.waterPrice || 0)} VNĐ/khối
                  </Text>
                </Box>
              </Box>

              {/* Nhập số điện/nước và phạt để tính tiền tháng */}
              <Box flex flexDirection="column" style={{ gap: 12, marginTop: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>🧾 Tính tiền tháng</Text>

                {/* Nước */}
                {/* Nước */}
                <Box flex flexDirection="column" style={{ gap: 8, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                  <Text style={{ fontWeight: "bold", color: "#007AFF" }}>💧 Nước</Text>
                  <Box flex justifyContent="space-between" style={{ gap: 8 }}>
                    <Input
                      type="number"
                      value={prevWaterIndex}
                      onChange={(e) => setPrevWaterIndex(e.target.value.toString())}
                      placeholder="Chỉ số cũ"
                      style={{ flex: 1 }}
                      label="Chỉ số cũ"
                    />
                    <Input
                      type="number"
                      value={currentWaterIndex}
                      onChange={(e) => setCurrentWaterIndex(e.target.value.toString())}
                      placeholder="Chỉ số mới *"
                      style={{ flex: 1 }}
                      label="Chỉ số mới"
                    />
                  </Box>
                  <Box flex alignItems="center" justifyContent="space-between">
                    <Text style={{ fontSize: 13, color: "#666" }}>
                      Sử dụng: <Text style={{ fontWeight: "bold", color: "#333" }}>{waterUsage} khối</Text>
                    </Text>
                    <Box flex style={{ gap: 8 }}>
                      <Button
                        onClick={() => {
                          import("zmp-sdk/apis").then(({ chooseImage }) => {
                            chooseImage({
                              sourceType: ["camera", "album"],
                              count: 1,
                              success: (res) => {
                                if (res.filePaths && res.filePaths.length > 0) {
                                  setWaterImage(res.filePaths[0]);
                                  processMeterImage(res.filePaths[0], 'water');
                                }
                              },
                              fail: (err) => console.error(err)
                            });
                          });
                        }}
                        type={waterImage ? "highlight" : "neutral"}
                        icon={parsingWater ? <Spinner /> : <Text>🤖 Đọc số</Text>}
                        size="small"
                        disabled={parsingWater}
                      />
                    </Box>
                  </Box>
                  {waterImage && (
                    <Box mt={1} style={{ position: "relative", width: 80, height: 80 }}>
                      <img src={waterImage} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                      <Button
                        size="small"
                        type="danger"
                        style={{ position: "absolute", top: -5, right: -5, padding: 0, width: 20, height: 20, minWidth: 20 }}
                        onClick={() => setWaterImage("")}
                      >
                        ✕
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Điện */}
                {/* Điện */}
                <Box flex flexDirection="column" style={{ gap: 8, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                  <Text style={{ fontWeight: "bold", color: "#FF9800" }}>⚡ Điện</Text>
                  <Box flex justifyContent="space-between" style={{ gap: 8 }}>
                    <Input
                      type="number"
                      value={prevElectricIndex}
                      onChange={(e) => setPrevElectricIndex(e.target.value.toString())}
                      placeholder="Chỉ số cũ"
                      style={{ flex: 1 }}
                      label="Chỉ số cũ"
                    />
                    <Input
                      type="number"
                      value={currentElectricIndex}
                      onChange={(e) => setCurrentElectricIndex(e.target.value.toString())}
                      placeholder="Chỉ số mới *"
                      style={{ flex: 1 }}
                      label="Chỉ số mới"
                    />
                  </Box>
                  <Box flex alignItems="center" justifyContent="space-between">
                    <Text style={{ fontSize: 13, color: "#666" }}>
                      Sử dụng: <Text style={{ fontWeight: "bold", color: "#333" }}>{electricUsage} số</Text>
                    </Text>
                    <Box flex style={{ gap: 8 }}>
                      <Button
                        onClick={() => {
                          import("zmp-sdk/apis").then(({ chooseImage }) => {
                            chooseImage({
                              sourceType: ["camera", "album"],
                              count: 1,
                              success: (res) => {
                                if (res.filePaths && res.filePaths.length > 0) {
                                  setElectricImage(res.filePaths[0]);
                                  processMeterImage(res.filePaths[0], 'electric');
                                }
                              },
                              fail: (err) => console.error(err)
                            });
                          });
                        }}
                        type={electricImage ? "highlight" : "neutral"}
                        icon={parsingElectric ? <Spinner /> : <Text>🤖 Đọc số</Text>}
                        size="small"
                        disabled={parsingElectric}
                      />
                    </Box>
                  </Box>
                  {electricImage && (
                    <Box mt={1} style={{ position: "relative", width: 80, height: 80 }}>
                      <img src={electricImage} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                      <Button
                        size="small"
                        type="danger"
                        style={{ position: "absolute", top: -5, right: -5, padding: 0, width: 20, height: 20, minWidth: 20 }}
                        onClick={() => setElectricImage("")}
                      >
                        ✕
                      </Button>
                    </Box>
                  )}
                </Box>

                <Input
                  type="number"
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value.toString())}
                  placeholder="Tiền phạt (VNĐ, tùy chọn, mặc định 0)"
                />

                <Box
                  flex
                  justifyContent="space-between"
                  alignItems="center"
                  style={{
                    padding: 12,
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#666" }}>Tổng tiền dự kiến:</Text>
                  <Text style={{ fontSize: 16, fontWeight: "bold", color: "#d10000" }}>
                    {formatPrice(totalPreview)} VNĐ
                  </Text>
                </Box>

                {/* Trạng thái thanh toán */}
                {billingStatus && (
                  <Box
                    flex
                    justifyContent="center"
                    alignItems="center"
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: billingStatus === "confirmed" ? "#e8f5e9" : "#fff3e0",
                      border: `1px solid ${billingStatus === "confirmed" ? "#4caf50" : "#ff9800"}`,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: billingStatus === "confirmed" ? "#2e7d32" : "#e65100",
                    }}>
                      {billingStatus === "unpaid" ? "🔴 Chưa thanh toán" : "✅ Đã xác nhận thanh toán"}
                    </Text>
                  </Box>
                )}

                <Button
                  onClick={handleCreateBill}
                  type="highlight"
                  disabled={!canSubmitBill}
                >
                  ✔️ Chấp nhận & tính tiền
                </Button>

                {billingStatus === "unpaid" && (
                  <Button
                    onClick={() => {
                      setBillingStatus("confirmed");
                      alert("Đã xác nhận thanh toán!");
                    }}
                    type="neutral"
                    style={{
                      border: "1px solid #4caf50",
                      color: "#2e7d32",
                    }}
                  >
                    💵 Xác nhận thanh toán
                  </Button>
                )}
              </Box>
            </Box>

            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              👥 Danh sách người thuê trọ
            </Text>

            {tenants.length === 0 ? (
              <Box
                p={4}
                flex
                flexDirection="column"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <Text style={{ color: "#999", textAlign: "center" }}>
                  Phòng này chưa có người thuê trọ.
                </Text>
              </Box>
            ) : (
              tenants.map((tenant) => (
                <Box
                  key={tenant.id}
                  p={3}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {tenant.avatar ? (
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundImage: `url(${tenant.avatar})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "#007AFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                        {tenant.nickname?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </Box>
                  )}
                  <Box flex flexDirection="column" style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                      {tenant.nickname || "Người dùng Zalo"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      ID: {tenant.user_id}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#d10000", marginTop: 4 }}>
                      Công nợ: {formatPrice(tenant.debt || 0)} VNĐ
                    </Text>
                    <Text style={{ fontSize: 12, color: "#007AFF" }}>
                      Hóa đơn hiện tại: {formatPrice(tenant.current_bill || 0)} VNĐ
                    </Text>
                  </Box>
                </Box>
              ))
            )}
          </>
        )}
      </Box>
    </PageLayout>
  );
};

export default RoomDetailPage;

