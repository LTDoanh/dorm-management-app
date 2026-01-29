import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { Box, Text, Button, Spinner } from "zmp-ui";
import { useStore } from "@store";
import zmp from "zmp-sdk";
import { API_BASE_URL } from "@constants/common";

interface PaymentData {
  tenant: {
    id: number;
    roomName: string;
    buildingName: string;
    currentBill: number;
    debt: number;
    paymentStatus: string;
    ownerConfirmedAmount: number;
  };
  details: {
    roomPrice: number;
    serviceFee: number;
    electricityAmount: number;
    waterAmount: number;
    penalty: number;
    debtAmount: number;
    totalAmount: number;
  };
  ownerBankInfo: {
    bankAccount: string;
    bankName: string;
    qrCodeUrl: string;
  };
}

const PaymentPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  useEffect(() => {
    loadPaymentData();
  }, []);

  useEffect(() => {
    // Polling để cập nhật trạng thái thanh toán (đồng bộ với các tenant khác trong phòng)
    const interval = setInterval(() => {
      if (user?.idByOA || user?.id) {
        checkPaymentStatus();
        loadPaymentData(); // Reload để đảm bảo đồng bộ với các tenant khác trong phòng
      }
    }, 3000); // Check mỗi 3 giây

    return () => clearInterval(interval);
  }, [user]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(`${API_BASE_URL}/api/payments/tenant/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentData(data);
        setPaymentStatus(data.tenant.paymentStatus);
      }
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const userId = user?.idByOA || user?.id;
      if (!userId) return;

      const res = await fetch(`${API_BASE_URL}/api/payments/tenant/${userId}/status`);
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data.paymentStatus);

        // Cập nhật lại paymentData nếu có thay đổi
        if (data.paymentStatus !== paymentStatus) {
          await loadPaymentData();
        }
      }
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái:", error);
    }
  };

  const handlePay = async () => {
    if (!paymentData) return;

    try {
      const total = paymentData.details.totalAmount;
      const bankAccount = paymentData.ownerBankInfo.bankAccount;

      if (!bankAccount) {
        alert("Chủ trọ chưa cập nhật số tài khoản ngân hàng");
        return;
      }

      // Giả sử bank code là 13 (ZaloPay) - có thể lấy từ ownerBankInfo sau
      const bankCode = "13";
      const accountName = "CHU TRO"; // Có thể lấy từ ownerBankInfo
      const description = encodeURIComponent(`Thanh toan tien tro - ${paymentData.tenant.roomName}`);

      const transferUrl = `https://social.zalopay.vn/transfer?accountno=${bankAccount}&bankcode=${bankCode}&amount=${total}&accountname=${accountName}&desc=${description}`;

      await zmp.openWebview({
        url: transferUrl,
      });

      // Sau khi mở webview, tự động back về trang này
      // (Zalo sẽ tự động back khi thanh toán xong)
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Không thể mở trang thanh toán");
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData) return;

    try {
      setConfirming(true);
      const res = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: paymentData.tenant.id,
        }),
      });

      if (res.ok) {
        // Tất cả tenant trong phòng sẽ có cùng trạng thái
        setPaymentStatus("waiting_confirmation");
        await loadPaymentData();
        alert("Đã xác nhận chuyển khoản. Tất cả người thuê trọ trong phòng đang chờ chủ trọ xác nhận.");
      } else {
        const error = await res.json();
        alert(error.error || "Không thể xác nhận thanh toán");
      }
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert("Có lỗi xảy ra khi xác nhận thanh toán");
    } finally {
      setConfirming(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const getStatusMessage = () => {
    if (!paymentData) return "";

    const totalAmount = paymentData.details.totalAmount;
    const received = paymentData.tenant.ownerConfirmedAmount;
    const difference = totalAmount - received;

    if (paymentStatus === "paid") {
      return "✅ Chuyển khoản thành công";
    } else if (paymentStatus === "partial") {
      return `⚠️ Thiếu: ${formatPrice(difference)} VNĐ`;
    } else if (paymentStatus === "overpaid") {
      return `💰 Thừa: ${formatPrice(-difference)} VNĐ`;
    } else if (paymentStatus === "waiting_confirmation") {
      return "⏳ Đang chờ chủ trọ xác nhận...";
    }
    return "";
  };

  if (loading) {
    return (
      <PageLayout
        id="payment-page"
        customHeader={<HomeHeader title="Thanh toán tiền trọ" />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  if (!paymentData) {
    return (
      <PageLayout
        id="payment-page"
        customHeader={<HomeHeader title="Thanh toán tiền trọ" />}
      >
        <Box p={4}>
          <Text style={{ color: "#999", textAlign: "center" }}>
            Chưa có hóa đơn để thanh toán.
          </Text>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="payment-page"
      customHeader={<HomeHeader title="Thanh toán tiền trọ" />}
    >
      <Box p={4} flex flexDirection="column" style={{ gap: 16 }}>
        {/* Thông tin phòng */}
        <Box
          p={3}
          style={{
            backgroundColor: "#f0f7ff",
            borderRadius: 8,
            border: "1px solid #007AFF",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
            🏢 {paymentData.tenant.buildingName}
          </Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            🚪 {paymentData.tenant.roomName}
          </Text>
        </Box>

        {/* Chi tiết hóa đơn */}
        <Box
          p={3}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
            📋 Chi tiết hóa đơn
          </Text>

          <Box flex flexDirection="column" style={{ gap: 12 }}>
            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>🏠 Tiền phòng:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {formatPrice(paymentData.details.roomPrice)} VNĐ
              </Text>
            </Box>

            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>🛠️ Phí dịch vụ:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {formatPrice(paymentData.details.serviceFee)} VNĐ
              </Text>
            </Box>

            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>💡 Tiền điện:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {formatPrice(paymentData.details.electricityAmount)} VNĐ
              </Text>
            </Box>

            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>🚰 Tiền nước:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {formatPrice(paymentData.details.waterAmount)} VNĐ
              </Text>
            </Box>

            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>⚠️ Tiền phạt:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                {formatPrice(paymentData.details.penalty)} VNĐ
              </Text>
            </Box>

            <Box flex justifyContent="space-between">
              <Text style={{ fontSize: 14, color: "#666" }}>📊 Tiền nợ:</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#d10000" }}>
                {formatPrice(paymentData.details.debtAmount)} VNĐ
              </Text>
            </Box>

            <Box
              style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: 12,
                marginTop: 8,
              }}
            >
              <Box flex justifyContent="space-between">
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>Tổng cộng:</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#d10000" }}>
                  {formatPrice(paymentData.details.totalAmount)} VNĐ
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Thông tin tài khoản ngân hàng */}
        {paymentData.ownerBankInfo.bankAccount && (
          <Box
            p={3}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
              🏦 Thông tin chuyển khoản
            </Text>

            {paymentData.ownerBankInfo.qrCodeUrl && (
              <Box
                flex
                justifyContent="center"
                style={{ marginBottom: 16 }}
              >
                <img
                  src={paymentData.ownerBankInfo.qrCodeUrl}
                  alt="QR Code"
                  style={{
                    width: 200,
                    height: 200,
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                  }}
                />
              </Box>
            )}

            <Box flex flexDirection="column" style={{ gap: 8 }}>
              <Box flex justifyContent="space-between">
                <Text style={{ fontSize: 14, color: "#666" }}>Số tài khoản:</Text>
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                  {paymentData.ownerBankInfo.bankAccount}
                </Text>
              </Box>
              {paymentData.ownerBankInfo.bankName && (
                <Box flex justifyContent="space-between">
                  <Text style={{ fontSize: 14, color: "#666" }}>Ngân hàng:</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                    {paymentData.ownerBankInfo.bankName}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Trạng thái thanh toán - hiển thị cho tất cả tenant trong phòng */}
        {paymentStatus !== "pending" && (
          <Box
            p={3}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
              {getStatusMessage()}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 4 }}>
              (Trạng thái chung cho tất cả người thuê trọ trong phòng)
            </Text>
          </Box>
        )}

        {/* Nút thanh toán */}
        <Box flex flexDirection="column" style={{ gap: 12 }}>
          <Button
            onClick={handlePay}
            type="primary"
            style={{ width: "100%" }}
            disabled={paymentStatus === "paid" || paymentStatus === "waiting_confirmation"}
          >
            💳 Chuyển khoản
          </Button>

          {paymentStatus === "pending" && (
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

          {paymentStatus === "waiting_confirmation" && (
            <Box
              p={3}
              style={{
                backgroundColor: "#fff3cd",
                borderRadius: 8,
                border: "1px solid #ffc107",
              }}
            >
              <Box flex alignItems="center" justifyContent="center" style={{ gap: 8 }}>
                <Spinner size="small" />
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                  Đang chờ chủ trọ xác nhận...
                </Text>
              </Box>
              <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 8 }}>
                Một người thuê trọ trong phòng đã xác nhận. Tất cả đang chờ chủ trọ xác nhận.
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default PaymentPage;
