import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { HomeIcon, HomeFillIcon, BuildingIcon, BuildingFillIcon, NotificationOutlineIcon, NotificationFillIcon, PenIcon, EditIcon } from "../../components/icons";
import { Button, Box, Text, Input, Spinner } from "zmp-ui";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@store";
import { Building } from "@dts";
import { API_BASE_URL } from "@constants/common";
import BankSelect, { BANKS } from "@components/common/BankSelect";

export interface AppNotification {
  id: number;
  tenant_id: number;
  room_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  tenant_name: string;
  tenant_avatar?: string;
  room_name: string;
  building_name: string;
  current_bill: number;
  debt: number;
}

const NotificationItem: React.FC<{
  notification: AppNotification;
  onConfirm: (notificationId: number, tenantId: number, receivedAmount: number) => Promise<void>;
  onRemove: (notificationId: number) => void;
}> = ({ notification, onConfirm, onRemove }) => {
  const totalAmount = (notification.current_bill || 0) + (notification.debt || 0);
  const defaultReceived = totalAmount;
  const [receivedAmount, setReceivedAmount] = useState<string>(defaultReceived.toString());
  const [confirming, setConfirming] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm(notification.id, notification.tenant_id, parseFloat(receivedAmount || "0"));
    setConfirming(false);
    onRemove(notification.id);
  };

  return (
    <Box
      p={3}
      style={{
        border: notification.is_read
          ? "1px solid #e0e0e0"
          : "2px solid #007AFF",
        borderRadius: 8,
        backgroundColor: notification.is_read ? "#fff" : "#f0f7ff",
      }}
    >
      <Box flex justifyContent="space-between" alignItems="flex-start" style={{ marginBottom: 12 }}>
        <Box flex flexDirection="column" style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
            {notification.title}
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            {notification.message}
          </Text>
          <Text style={{ fontSize: 12, color: "#999" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" /></svg>
            {notification.building_name} -
            <HomeFillIcon size={12} color="currentColor" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 2px" }} />
            Phòng {notification.room_name}
          </Text>
          <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {notification.tenant_name}
          </Text>
        </Box>
        {!notification.is_read && (
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#007AFF",
            }}
          />
        )}
      </Box>

      {notification.type === "payment_confirmation" && (
        <Box
          p={2}
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>
            💰 Xác nhận thanh toán
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            Số tiền cần thanh toán: <Text style={{ fontWeight: "bold", color: "#d10000" }}>{formatPrice(totalAmount)} VNĐ</Text>
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            Số tiền đã nhận (mặc định: {formatPrice(defaultReceived)} VNĐ):
          </Text>
          <Input
            type="number"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value.toString())}
            placeholder="Nhập số tiền đã nhận"
            style={{ marginBottom: 12 }}
          />
          <Button
            onClick={handleConfirm}
            type="highlight"
            style={{ width: "100%" }}
            disabled={confirming || !receivedAmount}
          >
            {confirming ? "Đang xác nhận..." : "✅ Xác nhận đã nhận tiền"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

const HomeOwnerPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingAddress, setNewBuildingAddress] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'home' | 'management' | 'notifications'>(
    (location.state as any)?.tab || 'home'
  );
  const user = useStore(state => state.user);

  useEffect(() => {
    loadBuildings();
    loadBankInfo();
    loadNotificationCount();
    if (activeTab === 'notifications') {
      loadNotificationsList();
    }

    // Polling để cập nhật số thông báo
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 5000); // Check mỗi 5 giây

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications' && notifications.length === 0) {
      loadNotificationsList();
    }
  }, [activeTab]);

  const loadBankInfo = async () => {
    try {
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBankAccount(data.bank_account || "");
          setBankName(data.bank_name || "");
          setQrCodeUrl(data.qr_code_url || "");
          setPhoneNumber(data.phone_number || "");
          setOwnerName(data.name || "");
        }
      }
    } catch (error) {
      console.error("Lỗi tải thông tin ngân hàng:", error);
    }
  };

  const handleSaveBankInfo = async () => {
    try {
      setSavingBank(true);
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      // Recalculate QR URL to ensure it matches current inputs
      const bin = BANKS.find(b => b.name === bankName)?.bin || "970436";
      const finalQrUrl = `https://img.vietqr.io/image/${bin}-${bankAccount}-compact.jpg?accountName=${encodeURIComponent(ownerName || user?.name || "")}`;

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/bank-account`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_account: bankAccount,
          bank_name: bankName,
          qr_code_url: finalQrUrl,
          phone_number: phoneNumber,
        }),
      });

      if (res.ok) {
        setShowBankForm(false);
        setQrCodeUrl(finalQrUrl);
        alert("Đã lưu thông tin cá nhân");
      } else {
        alert("Không thể lưu thông tin");
      }
    } catch (error) {
      console.error("Lỗi lưu thông tin cá nhân:", error);
      alert("Có lỗi xảy ra khi lưu thông tin");
    } finally {
      setSavingBank(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(`${API_BASE_URL}/api/notifications/owner/${userId}/count`);
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error("Lỗi tải số thông báo:", error);
    }
  };

  const loadNotificationsList = async () => {
    try {
      setLoading(true);
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(
        `${API_BASE_URL}/api/notifications/owner/${userId}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (
    notificationId: number,
    tenantId: number,
    receivedAmount: number
  ) => {
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
        // Đánh dấu thông báo đã đọc
        await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
          method: "PUT",
        });

        // Xóa thông báo khỏi danh sách
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
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

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(
        `${API_BASE_URL}/api/buildings/owner/${userId}`
      );
      const data = await res.json();
      setBuildings(data);
    } catch (error) {
      console.error("Lỗi tải danh sách tòa nhà:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBuilding = async () => {
    if (!newBuildingName.trim()) return;

    try {
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(`${API_BASE_URL}/api/buildings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBuildingName,
          address: newBuildingAddress || null,
          ownerId: userId,
        }),
      });

      if (res.ok) {
        const building = await res.json();
        setBuildings([...buildings, building]);
        setNewBuildingName("");
        setNewBuildingAddress("");
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Lỗi thêm tòa nhà:", error);
    }
  };

  const handleBuildingClick = (buildingId: string) => {
    navigate(`/building/${buildingId}`);
  };

  if (loading) {
    return (
      <PageLayout
        id="home-owner-page"
        customHeader={<HomeHeader title="QUẢN LÝ TRỌ" />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="home-owner-page"
      customHeader={
        <HomeHeader title={activeTab === 'home' ? "TRANG CHỦ" : activeTab === 'management' ? "QUẢN LÝ" : "THÔNG BÁO"} />
      }
    >
      <Box p={4} flex flexDirection="column" style={{ paddingBottom: 80, gap: 16 }}>
        {activeTab === 'management' && (
          <>
            <Box flex justifyContent="space-between" alignItems="center">
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                Danh sách tòa nhà
              </Text>
              <Box flex style={{ gap: 8 }}>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0, minWidth: "auto", height: "auto" }}
                  size="small"
                >
                  {showAddForm ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  )}
                </Button>
              </Box>
            </Box>

            {showAddForm && (
              <Box
                p={3}
                flex
                flexDirection="column"
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  backgroundColor: "#f9f9f9",
                  gap: 12,
                }}
              >
                <Input
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value.toString())}
                  placeholder="Tên tòa nhà *"
                />
                <Input
                  value={newBuildingAddress}
                  onChange={(e) => setNewBuildingAddress(e.target.value.toString())}
                  placeholder="Địa chỉ (tùy chọn)"
                />
                <Box flex style={{ gap: 8 }}>
                  <Button
                    onClick={addBuilding}
                    type="highlight"
                    style={{ flex: 1 }}
                  >
                    Thêm
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBuildingName("");
                      setNewBuildingAddress("");
                    }}
                    type="neutral"
                    style={{ flex: 1 }}
                  >
                    Hủy
                  </Button>
                </Box>
              </Box>
            )}

            {buildings.length === 0 ? (
              <Box
                p={4}
                flex
                flexDirection="column"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <Text style={{ color: "#999", textAlign: "center" }}>
                  Chưa có tòa nhà nào. Nhấn nút + để thêm tòa nhà mới.
                </Text>
              </Box>
            ) : (
              buildings.map((building) => (
                <Box
                  key={building.id}
                  p={3}
                  onClick={() => handleBuildingClick(building.id)}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                    e.currentTarget.style.borderColor = "#007AFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.borderColor = "#e0e0e0";
                  }}
                >
                  <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 8 }}>
                    <Box flex flexDirection="column" style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
                        <BuildingFillIcon size={16} color="black" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }} />
                        {building.name}
                      </Text>
                      {building.address && (
                        <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          {building.address}
                        </Text>
                      )}
                    </Box>
                    <Button
                      style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0, minWidth: "auto", height: "auto" }}
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Bạn có chắc muốn xóa tòa nhà này?")) return;
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/buildings/${building.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            setBuildings(prev => prev.filter(b => b.id !== building.id));
                          }
                        } catch (error) {
                          console.error("Lỗi xóa tòa nhà:", error);
                        }
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#d10000" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </>
        )}

        {/* Home Tab: Thông tin cá nhân */}
        {activeTab === 'home' && (
          <Box
            p={3}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              backgroundColor: "#fff",
            }}
          >
            <Box flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Thông tin cá nhân
              </Text>
              <Button
                onClick={() => setShowBankForm(!showBankForm)}
                style={bankAccount && !showBankForm ? { background: "transparent", border: "none", boxShadow: "none", padding: 0, minWidth: "auto", height: "auto" } : {}}
                type={bankAccount && !showBankForm ? undefined : "neutral"}
                size="small"
              >
                {showBankForm ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : bankAccount ? (
                  <EditIcon size={18} color="black" style={{ display: "block" }} />
                ) : (
                  <Box flex alignItems="center" style={{ gap: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Thêm
                  </Box>
                )}
              </Button>
            </Box>

            {!showBankForm && (
              <Box flex flexDirection="column" style={{ gap: 8 }}>
                {(ownerName || user?.name) && (
                  <Text style={{ fontSize: 14 }}>
                    <Text style={{ fontWeight: "bold" }}>Họ và tên:</Text> {ownerName || user?.name}
                  </Text>
                )}
                {phoneNumber && (
                  <Text style={{ fontSize: 14 }}>
                    <Text style={{ fontWeight: "bold" }}>Số điện thoại:</Text> {phoneNumber}
                  </Text>
                )}
                {bankAccount && (
                  <>
                    <Text style={{ fontSize: 14 }}>
                      <Text style={{ fontWeight: "bold" }}>Số tài khoản:</Text> {bankAccount}
                    </Text>
                    {bankName && (
                      <Text style={{ fontSize: 14 }}>
                        <Text style={{ fontWeight: "bold" }}>Ngân hàng:</Text> {bankName}
                      </Text>
                    )}
                  </>
                )}

                {qrCodeUrl && (
                  <Box mt={2} flex flexDirection="column" alignItems="center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      style={{
                        width: 150,
                        height: 150,
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {showBankForm && (
              <Box flex flexDirection="column" style={{ gap: 12 }}>
                <Input
                  value={ownerName || user?.name || ""}
                  disabled
                  label="Họ và tên"
                />

                <BankSelect
                  value={bankName}
                  onChange={(val, bin) => {
                    setBankName(val);
                  }}
                  placeholder="Chọn ngân hàng *"
                />

                <Input
                  value={bankAccount}
                  onChange={(e) => {
                    const val = e.target.value.toString();
                    // Chỉ cho phép nhập số
                    if (/^\d*$/.test(val)) {
                      setBankAccount(val);
                    }
                  }}
                  placeholder="Số tài khoản (0-9) *"
                  type="text"
                  inputMode="numeric"
                  label="Số tài khoản"
                  disabled={!bankName}
                />
                {!bankName && <Text size="xSmall" className="text-red-500" style={{ color: 'red', fontSize: 12 }}>Vui lòng chọn ngân hàng trước</Text>}

                <Box flex flexDirection="column" style={{ gap: 8 }}>

                  {(bankName && bankAccount) ? (
                    <Box flex flexDirection="column" alignItems="center" style={{ gap: 8 }}>
                      <img
                        src={`https://img.vietqr.io/image/${BANKS.find(b => b.name === bankName)?.bin || "970436"}-${bankAccount}-compact.jpg?accountName=${encodeURIComponent(user?.name || "")}`}
                        alt="QR Code"
                        style={{
                          width: 200,
                          height: 200,
                          objectFit: "contain",
                          border: "1px solid #e0e0e0",
                          borderRadius: 8,
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </Box>
                  ) : (
                    <Box p={4} style={{ backgroundColor: "#f5f5f5", borderRadius: 8, textAlign: "center" }}>
                      <Text size="small" className="text-gray-400">Nhập Ngân hàng & STK để hiện QR</Text>
                    </Box>
                  )}
                </Box>

                <Box flex style={{ gap: 8 }}>
                  <Button
                    onClick={handleSaveBankInfo}
                    type="highlight"
                    style={{ flex: 1 }}
                    disabled={savingBank || !bankAccount.trim() || !bankName}
                  >
                    {savingBank ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowBankForm(false);
                      loadBankInfo(); // Reset form
                    }}
                    type="neutral"
                    style={{ flex: 1 }}
                  >
                    Hủy
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Cụm render cho Tab Thông báo */}
        {activeTab === 'notifications' && (
          <Box flex flexDirection="column" style={{ gap: 16 }}>
            {notifications.length === 0 ? (
              <Box
                p={4}
                flex
                flexDirection="column"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <Text style={{ color: "#999", textAlign: "center" }}>
                  Chưa có thông báo nào.
                </Text>
              </Box>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onConfirm={handleConfirmPayment}
                  onRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
                />
              ))
            )}
          </Box>
        )}
      </Box>

      {/* Bottom Navigation */}
      <Box
        flex
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 65,
          backgroundColor: "#fff",
          borderTop: "1px solid #e0e0e0",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: "env(safe-area-inset-bottom)", // Fix cho iPhone tai thỏ
          zIndex: 9999,
        }}
      >
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer" }}
          onClick={() => setActiveTab('home')}
        >
          {activeTab === 'home' ? (
            <HomeFillIcon size={24} color="#007AFF" />
          ) : (
            <HomeIcon size={24} color="black" />
          )}
          <Text style={{ fontSize: 11, color: activeTab === 'home' ? "#007AFF" : "black", marginTop: 4, fontWeight: activeTab === 'home' ? "bold" : "normal" }}>
            Trang chủ
          </Text>
        </Box>

        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer" }}
          onClick={() => setActiveTab('management')}
        >
          {activeTab === 'management' ? (
            <BuildingFillIcon size={24} color="#007AFF" />
          ) : (
            <BuildingIcon size={24} color="black" />
          )}
          <Text style={{ fontSize: 11, color: activeTab === 'management' ? "#007AFF" : "black", marginTop: 4, fontWeight: activeTab === 'management' ? "bold" : "normal" }}>
            Quản lý
          </Text>
        </Box>

        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer", position: "relative" }}
          onClick={() => setActiveTab('notifications')}
        >
          {activeTab === 'notifications' ? (
            <NotificationFillIcon size={24} color="#007AFF" />
          ) : (
            <NotificationOutlineIcon size={24} color="black" />
          )}
          {notificationCount > 0 && (
            <Box
              style={{
                position: "absolute",
                top: 2,
                right: "26%",
                backgroundColor: "#d10000",
                color: "#fff",
                borderRadius: 10,
                minWidth: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: "bold",
                padding: "0 4px",
              }}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </Box>
          )}
          <Text style={{ fontSize: 11, color: activeTab === 'notifications' ? "#007AFF" : "black", marginTop: 4, fontWeight: activeTab === 'notifications' ? "bold" : "normal" }}>
            Thông báo
          </Text>
        </Box>
      </Box>

    </PageLayout>
  );
};

export default HomeOwnerPage;
