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
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form values
  const [roomPrice, setRoomPrice] = useState<string>("");
  const [serviceFee, setServiceFee] = useState<string>("");
  const [electricityPrice, setElectricityPrice] = useState<string>("");
  const [waterPrice, setWaterPrice] = useState<string>("");
  const [newTenantPhone, setNewTenantPhone] = useState<string>("");
  const [addingTenant, setAddingTenant] = useState(false);
  const [waterUsage, setWaterUsage] = useState<string>("");
  const [electricUsage, setElectricUsage] = useState<string>("");
  const [penalty, setPenalty] = useState<string>("");

  useEffect(() => {
    if (roomId) {
      loadRoom();
      loadTenants();
      // Nếu có edit=1 trên URL, bật edit mode
      if (searchParams.get("edit") === "1") {
        setIsEditMode(true);
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
        setIsEditMode(false);
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
    setIsEditMode(false);
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
    return waterUsage.trim() !== "" && electricUsage.trim() !== "";
  }, [waterUsage, electricUsage]);

  const handleCreateBill = async () => {
    if (!canSubmitBill) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/room/${roomId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          water_usage: Number(waterUsage),
          electricity_usage: Number(electricUsage),
          penalty: penalty ? Number(penalty) : 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Đã tính tiền: ${new Intl.NumberFormat("vi-VN").format(data.total)} VNĐ`);
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
              {!isEditMode && (
                <Button
                  onClick={() => setIsEditMode(true)}
                  type="primary"
                  size="small"
                >
                  ✏️ Chỉnh sửa
                </Button>
              )}
            </Box>
          </Box>
        )}

        {isEditMode ? (
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
                {tenants.length > 0 && (
                  <Button
                    onClick={handleDeleteAllTenants}
                    type="danger"
                    size="small"
                  >
                    🗑️ Xóa tất cả
                  </Button>
                )}
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
                  type="primary"
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
                <Input
                  type="number"
                  value={waterUsage}
                  onChange={(e) => setWaterUsage(e.target.value.toString())}
                  placeholder="Số nước (khối) *"
                />
                <Input
                  type="number"
                  value={electricUsage}
                  onChange={(e) => setElectricUsage(e.target.value.toString())}
                  placeholder="Số điện (số) *"
                />
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

                <Button
                  onClick={handleCreateBill}
                  type="primary"
                  disabled={!canSubmitBill}
                >
                  ✔️ Chấp nhận & tính tiền
                </Button>
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

