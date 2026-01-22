import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Box, Text, Button, Spinner } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { useStore } from "@store";
import {
  getTenantNotifications,
  markTenantNotificationAsRead,
  markAllTenantNotificationsAsRead,
  confirmTenantPayment,
  TenantNotification,
} from "@service/services";
import zmp from "zmp-sdk";

// Component cho mỗi notification item
const TenantNotificationItem: React.FC<{
  notification: TenantNotification;
  onConfirmPayment: (notificationId: number, tenantId: number) => Promise<void>;
  onMarkAsRead: (notificationId: number) => void;
}> = ({ notification, onConfirmPayment, onMarkAsRead }) => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const data = notification.data || {};
  const totalAmount = (notification.current_bill || 0) + (notification.debt || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleViewBill = () => {
    navigate("/payment");
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleConfirmPayment = async () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    setConfirming(true);
    try {
      await onConfirmPayment(notification.id, notification.tenant_id);
    } finally {
      setConfirming(false);
    }
  };

  const handlePay = async () => {
    if (!notification.bank_account) {
      alert("Chủ trọ chưa cập nhật số tài khoản ngân hàng");
      return;
    }

    const bankCode = "13"; // ZaloPay
    const accountName = notification.owner_name || "CHU TRO";
    const description = encodeURIComponent(
      `Thanh toan tien tro - ${notification.room_name}`
    );

    const transferUrl = `https://social.zalopay.vn/transfer?accountno=${notification.bank_account}&bankcode=${bankCode}&amount=${totalAmount}&accountname=${accountName}&desc=${description}`;

    await zmp.openWebview({
      url: transferUrl,
    });
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
        marginBottom: 12,
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
            🏢 {notification.building_name} - 🚪 Phòng {notification.room_name}
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

      {notification.type === "new_bill" && (
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
            📋 Chi tiết hóa đơn
          </Text>
          <Box flex flexDirection="column" style={{ gap: 6, marginBottom: 12 }}>
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 12, color: "#666" }}>Tiền phòng:</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                {formatPrice(data.roomPrice || 0)} VNĐ
              </Text>
            </Box>
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 12, color: "#666" }}>Tiền điện:</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                {formatPrice(data.electricityAmount || 0)} VNĐ
              </Text>
            </Box>
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 12, color: "#666" }}>Tiền nước:</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                {formatPrice(data.waterAmount || 0)} VNĐ
              </Text>
            </Box>
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 12, color: "#666" }}>Dịch vụ:</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                {formatPrice(data.serviceFee || 0)} VNĐ
              </Text>
            </Box>
            {data.penalty > 0 && (
              <Box flex justifyContent="space-between">
                <Text style={{ fontSize: 12, color: "#666" }}>Tiền phạt:</Text>
                <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                  {formatPrice(data.penalty || 0)} VNĐ
                </Text>
              </Box>
            )}
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 12, color: "#666" }}>Tiền nợ:</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                {formatPrice(notification.debt || 0)} VNĐ
              </Text>
            </Box>
            <Box
              flex
              justifyContent="space-between"
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>Tổng cộng:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#007AFF" }}>
                {formatPrice(totalAmount)} VNĐ
              </Text>
            </Box>
          </Box>

          {notification.bank_account && (
            <Box
              p={2}
              style={{
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
                🏦 Thông tin chuyển khoản
              </Text>
              {notification.qr_code_url && (
                <Box flex justifyContent="center" style={{ marginBottom: 8 }}>
                  <img
                    src={notification.qr_code_url}
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
              <Text style={{ fontSize: 12, color: "#666" }}>
                STK: {notification.bank_account}
              </Text>
              {notification.bank_name && (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Ngân hàng: {notification.bank_name}
                </Text>
              )}
            </Box>
          )}

          <Box flex flexDirection="column" style={{ gap: 8 }}>
            <Button
              onClick={handlePay}
              type="primary"
              style={{ width: "100%" }}
              disabled={notification.payment_status === "paid" || notification.payment_status === "waiting_confirmation"}
            >
              💳 Chuyển khoản
            </Button>

            {notification.payment_status === "pending" && (
              <Button
                onClick={handleConfirmPayment}
                type="secondary"
                style={{ width: "100%" }}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <Spinner size="small" style={{ marginRight: 8 }} />
                    Đang xác nhận...
                  </>
                ) : (
                  "✔️ Xác nhận chuyển khoản thành công"
                )}
              </Button>
            )}

            {notification.payment_status === "waiting_confirmation" && (
              <Box
                p={2}
                style={{
                  backgroundColor: "#fff3cd",
                  borderRadius: 8,
                  border: "1px solid #ffc107",
                }}
              >
                <Box flex alignItems="center" justifyContent="center" style={{ gap: 8 }}>
                  <Spinner size="small" />
                  <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                    Đang chờ chủ trọ xác nhận...
                  </Text>
                </Box>
              </Box>
            )}

            {(notification.payment_status === "paid" ||
              notification.payment_status === "partial" ||
              notification.payment_status === "overpaid") && (
              <Box
                p={2}
                style={{
                  backgroundColor: "#d4edda",
                  borderRadius: 8,
                  border: "1px solid #28a745",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "bold", textAlign: "center" }}>
                  {notification.payment_status === "paid" && "✅ Chuyển khoản thành công"}
                  {notification.payment_status === "partial" && "⚠️ Thiếu tiền"}
                  {notification.payment_status === "overpaid" && "💰 Thừa tiền"}
                </Text>
              </Box>
            )}

            <Button
              onClick={handleViewBill}
              type="secondary"
              style={{ width: "100%" }}
            >
              📄 Xem chi tiết hóa đơn
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const TenantNotificationsPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const data = await getTenantNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markTenantNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const handleConfirmPayment = async (notificationId: number, tenantId: number) => {
    try {
      await confirmTenantPayment(tenantId);
      await loadNotifications();
      alert("Đã xác nhận chuyển khoản. Đang chờ chủ trọ xác nhận.");
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert("Không thể xác nhận thanh toán");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      await markAllTenantNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả:", error);
    }
  };

  if (loading) {
    return (
      <PageLayout
        id="tenant-notifications-page"
        customHeader={<HomeHeader title="Thông báo" />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="tenant-notifications-page"
      customHeader={<HomeHeader title="Thông báo" />}
    >
      <Box p={3}>
        {notifications.length > 0 && (
          <Box flex justifyContent="flex-end" style={{ marginBottom: 12 }}>
            <Button
              onClick={handleMarkAllAsRead}
              type="secondary"
              size="small"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </Box>
        )}

        {notifications.length === 0 ? (
          <Box flex justifyContent="center" alignItems="center" p={4}>
            <Text style={{ fontSize: 14, color: "#999" }}>
              Chưa có thông báo nào
            </Text>
          </Box>
        ) : (
          notifications.map((notification) => (
            <TenantNotificationItem
              key={notification.id}
              notification={notification}
              onConfirmPayment={handleConfirmPayment}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </Box>
    </PageLayout>
  );
};

export default TenantNotificationsPage;

