/**
 * Zalo Notification Service
 * 
 * Service này được tạo để chuẩn bị tích hợp Zalo Official Account (OA) API
 * để gửi thông báo qua Zalo Notification Service (ZNS).
 * 
 * ĐIỀU KIỆN CẦN THIẾT:
 * 1. Cần có Zalo Official Account (OA) đã xác thực
 * 2. Mini App phải được liên kết với OA
 * 3. Người dùng phải follow OA và cấp quyền nhận thông báo
 * 4. Cần có OA Access Token để gọi API
 * 
 * TÀI LIỆU THAM KHẢO:
 * - Zalo OA API: https://developers.zalo.me/docs/api/official-account-api
 * - Zalo Notification Service: https://developers.zalo.me/docs/api/zns-api
 */

interface ZaloOAMessage {
  recipient: {
    user_id: string; // Zalo user ID
  };
  message: {
    text?: string;
    attachment?: {
      type: string;
      payload: {
        template_type?: string;
        text?: string;
        buttons?: Array<{
          type: string;
          title: string;
          url?: string;
          payload?: string;
        }>;
      };
    };
  };
}

interface ZaloNotificationConfig {
  oaId: string; // Official Account ID
  accessToken: string; // OA Access Token
  apiEndpoint?: string; // Default: https://openapi.zalo.me/v2.0/oa
}

/**
 * Gửi thông báo hóa đơn mới đến người thuê trọ qua Zalo OA
 * 
 * @param config - Cấu hình Zalo OA
 * @param userId - Zalo user ID của người thuê trọ
 * @param billData - Dữ liệu hóa đơn
 */
export const sendBillNotification = async (
  config: ZaloNotificationConfig,
  userId: string,
  billData: {
    totalAmount: number;
    roomName: string;
    buildingName: string;
    month: number;
    year: number;
    bankAccount?: string;
    qrCodeUrl?: string;
  }
): Promise<void> => {
  // TODO: Implement khi đã có OA
  // Ví dụ implementation:
  /*
  const message: ZaloOAMessage = {
    recipient: {
      user_id: userId,
    },
    message: {
      text: `Hóa đơn tiền trọ tháng ${billData.month}/${billData.year}\nPhòng: ${billData.roomName}\nTổng tiền: ${billData.totalAmount.toLocaleString('vi-VN')} VNĐ`,
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: `Hóa đơn tiền trọ tháng ${billData.month}/${billData.year}\nPhòng: ${billData.roomName}\nTổng tiền: ${billData.totalAmount.toLocaleString('vi-VN')} VNĐ`,
          buttons: [
            {
              type: "web_url",
              title: "Xem hóa đơn",
              url: `https://mini.zalo.me/YOUR_APP_ID/payment`, // Deep link vào Mini App
            },
            {
              type: "postback",
              title: "Xác nhận thanh toán",
              payload: JSON.stringify({
                action: "confirm_payment",
                tenantId: userId,
              }),
            },
          ],
        },
      },
    },
  };

  const apiEndpoint = config.apiEndpoint || "https://openapi.zalo.me/v2.0/oa/message";
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": config.accessToken,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error("Không thể gửi thông báo qua Zalo");
  }
  */
  
  console.log("Zalo OA notification service chưa được tích hợp. Cần có OA để sử dụng.");
};

/**
 * Gửi thông báo xác nhận thanh toán đến chủ trọ qua Zalo OA
 * 
 * @param config - Cấu hình Zalo OA
 * @param ownerId - Zalo user ID của chủ trọ
 * @param paymentData - Dữ liệu thanh toán
 */
export const sendPaymentConfirmationNotification = async (
  config: ZaloNotificationConfig,
  ownerId: string,
  paymentData: {
    tenantName: string;
    roomName: string;
    buildingName: string;
    totalAmount: number;
  }
): Promise<void> => {
  // TODO: Implement khi đã có OA
  console.log("Zalo OA notification service chưa được tích hợp. Cần có OA để sử dụng.");
};

/**
 * Kiểm tra xem người dùng có cấp quyền nhận thông báo từ OA không
 * 
 * @param config - Cấu hình Zalo OA
 * @param userId - Zalo user ID
 */
export const checkNotificationPermission = async (
  config: ZaloNotificationConfig,
  userId: string
): Promise<boolean> => {
  // TODO: Implement khi đã có OA
  return false;
};

/**
 * Yêu cầu người dùng cấp quyền nhận thông báo
 * 
 * @param config - Cấu hình Zalo OA
 * @param userId - Zalo user ID
 */
export const requestNotificationPermission = async (
  config: ZaloNotificationConfig,
  userId: string
): Promise<void> => {
  // TODO: Implement khi đã có OA
  console.log("Yêu cầu cấp quyền nhận thông báo chưa được tích hợp.");
};

