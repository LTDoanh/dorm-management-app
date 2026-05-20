import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { HomeIcon, HomeFillIcon, BuildingIcon, BuildingFillIcon, NotificationOutlineIcon, NotificationFillIcon } from "../../components/icons";
import { Box, Text, Button, Input, Spinner } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";
import { API_BASE_URL } from "@constants/common";

interface Notification {
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

/** Component hiển thị từng thông báo của chủ trọ */
const NotificationItem: React.FC<{
  notification: Notification;
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
          {notification.type === "unknown_plate" ? (
            <Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Cảnh báo an ninh
            </Text>
          ) : (
            <>
              <Text style={{ fontSize: 12, color: "#999" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h-2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" /></svg>
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
            </>
          )}
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
            Số tiền cần thanh toán:{" "}
            <Text style={{ fontWeight: "bold", color: "#d10000" }}>
              {formatPrice(totalAmount)} VNĐ
            </Text>
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

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
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
      console.error("Lỗi tải thông báo:", error);
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
        await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
          method: "PUT",
        });

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

  if (loading) {
    return (
      <PageLayout
        id="notifications-page"
        customHeader={<HomeHeader title="Thông báo" onBack={() => navigate("/home-owner")} />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="notifications-page"
      customHeader={<HomeHeader title="Thông báo" onBack={() => navigate("/home-owner")} />}
    >
      <Box p={4} flex flexDirection="column" style={{ paddingBottom: 80, gap: 16 }}>
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
          paddingBottom: "env(safe-area-inset-bottom)",
          zIndex: 9999,
        }}
      >
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer" }}
          onClick={() => navigate("/home-owner")}
        >
          <HomeIcon size={24} color="black" />
          <Text style={{ fontSize: 11, color: "black", marginTop: 4 }}>
            Trang chủ
          </Text>
        </Box>

        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer" }}
          onClick={() => navigate("/home-owner", { state: { tab: 'management' } })}
        >
          <BuildingIcon size={24} color="black" />
          <Text style={{ fontSize: 11, color: "black", marginTop: 4 }}>
            Quản lý
          </Text>
        </Box>

        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ width: "33%", cursor: "pointer", position: "relative" }}
        >
          <NotificationFillIcon size={24} color="#007AFF" />
          <Text style={{ fontSize: 11, color: "#007AFF", marginTop: 4, fontWeight: "bold" }}>
            Thông báo
          </Text>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default NotificationsPage;

