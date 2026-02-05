import React, { useState, useEffect } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Button, Box, Text, Spinner, Input } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true); // Bắt đầu với loading = true
  const [checkingRole, setCheckingRole] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState(false);
  const navigate = useNavigate();
  const [saveUserRole, user, checkUserRole] = useStore(state => [
    state.saveUserRole,
    state.user,
    state.checkUserRole,
  ]);

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
              Xin chào, {user?.name || "Bạn"}! 👋
            </Text>
          </Box>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 8
            }}
          >
            Vui lòng nhập số điện thoại để tiếp tục
          </Text>

          <Box flex style={{ gap: 8 }}>
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
              style={{ flex: 1 }}
            />
            {phoneNumber.length >= 9 && !confirmedPhone && (
              <Button
                onClick={() => setConfirmedPhone(true)}
                size="small"
                type="primary"
                style={{ minWidth: 80 }}
              >
                OK
              </Button>
            )}
          </Box>

          {confirmedPhone && (
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
                onClick={() => setConfirmedPhone(false)}
                size="small"
                type="neutral"
                variant="tertiary"
                style={{ marginTop: 8 }}
              >
                Nhập lại SĐT
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default HomePage;

