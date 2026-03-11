import React, { useState, useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Button, Box, Text, Spinner, Input } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true); // Bắt đầu với loading = true
  const [checkingRole, setCheckingRole] = useState(true);
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmedInfo, setConfirmedInfo] = useState(false);
  const navigate = useNavigate();
  const [saveUserRole, user, checkUserRole, setUser] = useStore(state => [
    state.saveUserRole,
    state.user,
    state.checkUserRole,
    state.setUser,
  ]);

  // Pre-fill tên từ Zalo nếu có
  useEffect(() => {
    if (user?.name && !userName) {
      setUserName(user.name);
    }
  }, [user?.name]);

  // Kiểm tra role khi vào trang
  useEffect(() => {
    const checkRole = async () => {
      try {
        setCheckingRole(true);
        // Đợi user info được load từ Auth component
        if (!user) {
          // Chờ 500ms rồi thử lại
          setTimeout(() => setCheckingRole(false), 500);
          return;
        }

        // Kiểm tra role trong database
        const role = await checkUserRole();

        if (role) {
          // Nếu đã có role, redirect đến trang home tương ứng
          if (role === "chu-tro") {
            navigate("/home-owner", { replace: true });
          } else if (role === "nguoi-thue") {
            navigate("/home-tenant", { replace: true });
          }
        } else {
          // Nếu chưa có role, hiển thị trang chọn role
          setLoading(false);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra role:", error);
        setLoading(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkRole();
  }, [user, checkUserRole, navigate]);

  const chooseRole = async (role: "chu-tro" | "nguoi-thue") => {
    try {
      setLoading(true);
      // Cập nhật tên nếu user đã sửa
      if (user && userName && userName !== user.name) {
        setUser({ ...user, name: userName });
      }
      await saveUserRole(role, phoneNumber);
      // Chuyển đến trang home tương ứng
      if (role === "chu-tro") {
        navigate("/home-owner", { replace: true });
      } else {
        navigate("/home-tenant", { replace: true });
      }
    } catch (error) {
      console.error("Lỗi lưu role:", error);
      setLoading(false);
    }
  };

  const handleOkClick = async () => {
    try {
      setLoading(true);
      // Query the API using find-by-phone
      // Note: Because the app uses API_BASE_URL we need to import it or declare it
      // if not already imported. We can just use the absolute path variable used in other files
      const API_BASE_URL = "https://dorm-management-app.onrender.com";

      const res = await fetch(`${API_BASE_URL}/api/tenants/find-by-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber })
      });

      if (res.ok) {
        const data = await res.json();
        // If the user already has a role, auto-redirect them mapping "chu-tro" and "nguoi-thue"
        if (data.role && (data.role === "chu-tro" || data.role === "nguoi-thue")) {
          // Sync name changes to User state
          if (user && userName && userName !== user.name) {
            setUser({ ...user, name: userName });
          }
          // The saveUserRole acts as an upsert to the database which updates their name if changed
          await saveUserRole(data.role as "chu-tro" | "nguoi-thue", phoneNumber);
          navigate(data.role === "chu-tro" ? "/home-owner" : "/home-tenant", { replace: true });
          return;
        }
      }
      
      // If NOT OK or user doesn't have a role, show the role selection
      setLoading(false);
      setConfirmedInfo(true);

    } catch (err) {
      console.error(err);
      setLoading(false);
      setConfirmedInfo(true);
    }
  };

  // Hiển thị loading khi đang kiểm tra role
  if (checkingRole || loading) {
    return (
      <PageLayout
        id="home-page"
        customHeader={<HomeHeader title="QUẢN LÝ TRỌ" />}
      >
        <Box
          flex
          flexDirection="column"
          p={4}
          style={{
            minHeight: "60vh",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Spinner />
          <Text style={{ marginTop: 12, color: "#666" }}>Đang tải...</Text>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="home-page"
      customHeader={<HomeHeader title="QUẢN LÝ TRỌ" />}
    >
      <Box
        flex
        flexDirection="column"
        p={4}
        style={{
          gap: 24,
          minHeight: "60vh",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Box
          flex
          flexDirection="column"
          style={{
            gap: 16,
            width: "100%",
            maxWidth: "400px",
            textAlign: "center"
          }}
        >
          {/* Welcome Message at ~1/5 screen height */}
          <Box style={{ marginTop: "10vh", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#006AF5"
              }}
            >
              Xin chào{userName ? `, ${userName}` : ""}! 👋
            </Text>
          </Box>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 8
            }}
          >
            Vui lòng nhập thông tin để tiếp tục
          </Text>

          <Box flex flexDirection="column" style={{ gap: 10 }}>
            <Input
              placeholder="Tên người dùng *"
              value={userName}
              onChange={(e) => setUserName(e.target.value.toString())}
              type="text"
              clearable
              style={{ width: "100%" }}
            />

            <Input
              placeholder="Số điện thoại của bạn *"
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.toString();
                if (/^\d*$/.test(val)) setPhoneNumber(val);
              }}
              type="text"
              inputMode="numeric"
              clearable
              style={{ width: "100%" }}
            />

            {userName.trim().length >= 2 && phoneNumber.length >= 9 && !confirmedInfo && (
              <Button
                onClick={handleOkClick}
                type="highlight"
                style={{ width: "100%", marginTop: 4 }}
              >
                OK ✓
              </Button>
            )}
          </Box>

          {confirmedInfo && (
            <Box flex flexDirection="column" style={{ gap: 16, marginTop: 16, animation: "fadeIn 0.5s ease-in" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666",
                  marginBottom: 8
                }}
              >
                Chọn vai trò của bạn:
              </Text>

              <Button
                onClick={() => chooseRole("chu-tro")}
                type="highlight"
                style={{
                  width: "100%",
                  height: 56,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                🏠 Tôi là Chủ trọ
              </Button>

              <Button
                onClick={() => chooseRole("nguoi-thue")}
                type="neutral"
                style={{
                  width: "100%",
                  height: 56,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                🏡 Tôi là Người thuê trọ
              </Button>

              <Button
                onClick={() => setConfirmedInfo(false)}
                size="small"
                type="neutral"
                variant="tertiary"
                style={{ marginTop: 8 }}
              >
                ← Nhập lại thông tin
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default HomePage;

