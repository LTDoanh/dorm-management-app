/**
 * Dịch vụ tích hợp gửi thông báo qua Zalo Official Account (OA) và Zalo Notification Service (ZNS).
 */

interface ZaloOAMessage {
  recipient: {
    user_id: string;
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
  oaId: string;
  accessToken: string;
  apiEndpoint?: string;
}

/**
 * Gửi thông báo hóa đơn mới đến người thuê trọ qua Zalo OA
 * @param config Cấu hình Zalo OA
 * @param userId ID người dùng Zalo
 * @param billData Dữ liệu hóa đơn gửi đi
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
  console.log("Zalo OA notification service chưa được tích hợp. Cần có OA để sử dụng.");
};

/**
 * Gửi thông báo xác nhận thanh toán đến chủ trọ qua Zalo OA
 * @param config Cấu hình Zalo OA
 * @param ownerId ID chủ trọ Zalo
 * @param paymentData Dữ liệu thông tin thanh toán
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
  console.log("Zalo OA notification service chưa được tích hợp. Cần có OA để sử dụng.");
};

/**
 * Kiểm tra xem người dùng có cấp quyền nhận thông báo từ OA không
 * @param config Cấu hình Zalo OA
 * @param userId ID người dùng Zalo
 */
export const checkNotificationPermission = async (
  config: ZaloNotificationConfig,
  userId: string
): Promise<boolean> => {
  return false;
};

/**
 * Yêu cầu người dùng cấp quyền nhận thông báo
 * @param config Cấu hình Zalo OA
 * @param userId ID người dùng Zalo
 */
export const requestNotificationPermission = async (
  config: ZaloNotificationConfig,
  userId: string
): Promise<void> => {
  console.log("Yêu cầu cấp quyền nhận thông báo chưa được tích hợp.");
};

