import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Button, Box, Text, Input, Spinner } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";
import { Building } from "@dts";
import { API_BASE_URL } from "@constants/common";

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
  const [savingBank, setSavingBank] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const user = useStore(state => state.user);

  useEffect(() => {
    loadBuildings();
    loadBankInfo();
    loadNotificationCount();

    // Polling để cập nhật số thông báo
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 5000); // Check mỗi 5 giây

    return () => clearInterval(interval);
  }, []);

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

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/bank-account`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_account: bankAccount,
          bank_name: bankName,
          qr_code_url: qrCodeUrl,
        }),
      });

      if (res.ok) {
        setShowBankForm(false);
        alert("Đã lưu thông tin tài khoản ngân hàng");
      } else {
        alert("Không thể lưu thông tin tài khoản");
      }
    } catch (error) {
      console.error("Lỗi lưu thông tin ngân hàng:", error);
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
      customHeader={<HomeHeader title="QUẢN LÝ TRỌ" />}
    >
      <Box p={4} flex flexDirection="column" style={{ gap: 16 }}>
        <Box flex justifyContent="space-between" alignItems="center">
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Danh sách tòa nhà
          </Text>
          <Box flex style={{ gap: 8 }}>
            <Box
              onClick={() => navigate("/notifications")}
              style={{
                position: "relative",
                cursor: "pointer",
                padding: "8px",
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
              {notificationCount > 0 && (
                <Box
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "#d10000",
                    color: "#fff",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                    padding: "0 6px",
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Box>
              )}
            </Box>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              type="primary"
              size="small"
            >
              {showAddForm ? "✕" : "+"}
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
                type="primary"
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
                type="secondary"
                style={{ flex: 1 }}
              >
                Hủy
              </Button>
            </Box>
          </Box>
        )}

        {/* Quản lý tài khoản ngân hàng */}
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
              🏦 Tài khoản ngân hàng
            </Text>
            <Button
              onClick={() => setShowBankForm(!showBankForm)}
              type="secondary"
              size="small"
            >
              {showBankForm ? "✕" : bankAccount ? "✏️ Sửa" : "+ Thêm"}
            </Button>
          </Box>

          {!showBankForm && bankAccount && (
            <Box flex flexDirection="column" style={{ gap: 8 }}>
              <Text style={{ fontSize: 14 }}>
                <Text style={{ fontWeight: "bold" }}>Số tài khoản:</Text> {bankAccount}
              </Text>
              {bankName && (
                <Text style={{ fontSize: 14 }}>
                  <Text style={{ fontWeight: "bold" }}>Ngân hàng:</Text> {bankName}
                </Text>
              )}
              {qrCodeUrl && (
                <Box mt={2}>
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
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.toString())}
                placeholder="Số tài khoản ngân hàng *"
              />
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value.toString())}
                placeholder="Tên ngân hàng (tùy chọn)"
              />
              <Input
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value.toString())}
                placeholder="URL ảnh QR Code (tùy chọn)"
              />
              <Text style={{ fontSize: 12, color: "#666" }}>
                💡 Bạn có thể upload ảnh QR Code lên hosting và dán link vào đây, hoặc để trống nếu chỉ cần số tài khoản
              </Text>
              <Box flex style={{ gap: 8 }}>
                <Button
                  onClick={handleSaveBankInfo}
                  type="primary"
                  style={{ flex: 1 }}
                  disabled={savingBank || !bankAccount.trim()}
                >
                  {savingBank ? "Đang lưu..." : "💾 Lưu"}
                </Button>
                <Button
                  onClick={() => {
                    setShowBankForm(false);
                    loadBankInfo(); // Reset form
                  }}
                  type="secondary"
                  style={{ flex: 1 }}
                >
                  Hủy
                </Button>
              </Box>
            </Box>
          )}
        </Box>

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
                    🏢 {building.name}
                  </Text>
                  {building.address && (
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      📍 {building.address}
                    </Text>
                  )}
                </Box>
                <Button
                  type="danger"
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
                  🗑️
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </PageLayout>
  );
};

export default HomeOwnerPage;
