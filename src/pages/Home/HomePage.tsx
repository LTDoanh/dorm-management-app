import React, { useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Button, Box, Text, Spinner } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [saveUserRole, user] = useStore(state => [
    state.saveUserRole,
    state.user,
  ]);

  const chooseRole = async (role: "chu-tro" | "nguoi-thue") => {
    try {
      setLoading(true);
      await saveUserRole(role);
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
          <Text 
            style={{ 
              fontSize: 20, 
              fontWeight: "bold",
              marginBottom: 8
            }}
          >
            Chào mừng bạn đến với ứng dụng quản lý trọ!
          </Text>
          <Text 
            style={{ 
              fontSize: 14, 
              color: "#666",
              marginBottom: 24
            }}
          >
            Vui lòng chọn vai trò của bạn để tiếp tục
          </Text>

          {loading ? (
            <Box flex justifyContent="center" alignItems="center" p={4}>
              <Spinner />
              <Text style={{ marginLeft: 12 }}>Đang xử lý...</Text>
            </Box>
          ) : (
            <>
              <Button
                onClick={() => chooseRole("chu-tro")}
                type="primary"
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
                type="secondary"
                style={{
                  width: "100%",
                  height: 56,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                🏡 Tôi là Người thuê trọ
              </Button>
            </>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default HomePage;
