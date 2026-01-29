// Constants cho ứng dụng
// Không sử dụng import.meta để tránh lỗi trong Zalo Mini App

export const BASE_URL = "";
export const MINI_APP_ID = (window as any).APP_ID || "";
export const API_BASE_URL = "https://dorm-management-app.onrender.com";

export const API = {
    GET_ORGANIZATION: "/get_organization_api",
    SEARCH_PROFILES: "/search_profiles_api",
    GET_ARTICLES: "/get_articles_api",
    FEEDBACK: "/feedback_api",
    FEEDBACK_TYPES: "/feedback_types_api",
    INFORMATION_GUIDE: "/information_guide_api",
    UPLOAD_IMAGE: "/upload_image_api",
    CREATE_SCHEDULE: "/create_schedule_api",
    GET_SCHEDULE: "/get_schedule_api",
};
export const SEARCH_NOT_FOUND = "Không tìm thấy thông tin";

export const TOTAL_ARTICLES_PER_PAGE = 10;
export const TOTAL_FEEDBACKS_PER_PAGE = 10;
export const TOTAL_INFORMATION_GUIDE_PER_PAGE = 10;

export const SCHEDULE_APPOINTMENT_STATUS = {
    PENDING: "pending",
    REJECTED: "rejected",
    APPROVED: "approved",
};

export const MAX_FEEDBACK_IMAGES = 4;
