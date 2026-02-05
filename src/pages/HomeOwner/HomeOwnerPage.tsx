import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Button, Box, Text, Input, Spinner } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";
import { Building } from "@dts";
import { API_BASE_URL } from "@constants/common";
import BankSelect from "@components/common/BankSelect";

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
          setPhoneNumber(data.phone_number || "");
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
          phone_number: phoneNumber,
        }),
      });

      if (res.ok) {
        setShowBankForm(false);
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
              type="highlight"
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

        {/* Quản lý tài khoản ngân hàng & Thông tin cá nhân */}
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
              👤 Thông tin cá nhân & Ngân hàng
            </Text>
            <Button
              onClick={() => setShowBankForm(!showBankForm)}
              type="neutral"
              size="small"
            >
              {showBankForm ? "✕" : bankAccount ? "✏️ Sửa" : "+ Thêm"}
            </Button>
          </Box>

          {!showBankForm && (
            <Box flex flexDirection="column" style={{ gap: 8 }}>
              {user?.name && (
                <Text style={{ fontSize: 14 }}>
                  <Text style={{ fontWeight: "bold" }}>Họ tên:</Text> {user.name}
                </Text>
              )}
              {phoneNumber && (
                <Text style={{ fontSize: 14 }}>
                  <Text style={{ fontWeight: "bold" }}>SĐT:</Text> {phoneNumber}
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
                value={user?.name || ""}
                disabled
                label="Họ tên (từ Zalo)"
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
                placeholder="Số tài khoản ngân hàng (0-9) *"
                type="text"
                inputMode="numeric"
                label="Số tài khoản"
              />
              <BankSelect
                value={bankName}
                onChange={(val) => setBankName(val)}
                placeholder="Chọn ngân hàng *"
              />
              <Box flex flexDirection="column" style={{ gap: 8 }}>
                <Text size="small" style={{ fontWeight: 600 }}>Ảnh QR Code (Để người thuê quét chuyển khoản)</Text>
                {qrCodeUrl ? (
                  <Box style={{ position: "relative", width: 150, height: 150 }}>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                      }}
                    />
                    <Button
                      onClick={() => setQrCodeUrl("")}
                      size="small"
                      type="danger"
                      style={{ position: "absolute", top: -10, right: -10, padding: 0, width: 24, height: 24, minWidth: 24 }}
                    >
                      ✕
                    </Button>
                  </Box>
                ) : (
                  <Button
                    onClick={() => {
                      // Import dynamically to avoid SSR issues if any, or just use global zmp
                      import("zmp-sdk/apis").then(({ chooseImage }) => {
                        chooseImage({
                          sourceType: ["album", "camera"],
                          count: 1,
                          success: (res) => {
                            const { filePaths, tempFiles } = res;
                            // Use path or base64. 
                            // For simplicity in this demo, we assume tempFiles[0].path works or need base64
                            // ZMPs chooseImage often returns a path we can't directly use in standard <img src> 
                            // without converting or uploading. 
                            // But newer SDKs support it. 
                            // Let's use the first result.
                            if (filePaths && filePaths.length > 0) {
                              // Mock: In real app, must upload filePaths[0] to server -> get URL.
                              // Since we lack upload server, we'll try to use the blob/path directly if supported 
                              // or just a placeholder for now.
                              // Actually, let's warn user about Upload.

                              alert("Đã chọn ảnh! (Lưu ý: Cần server upload để lưu ảnh lâu dài. Tạm thời dùng đường dẫn này)");
                              setQrCodeUrl(filePaths[0]);
                            }
                          },
                          fail: (err) => {
                            console.error(err);
                          }
                        });
                      });
                    }}
                    type="neutral"
                    icon={<Text>📷</Text>}
                  >
                    Chọn ảnh QR từ thư viện/camera
                  </Button>
                )}
              </Box>
              <Box flex style={{ gap: 8 }}>
                <Button
                  onClick={handleSaveBankInfo}
                  type="highlight"
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
                  type="neutral"
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
