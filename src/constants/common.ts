// @ts-nocheck
// Sử dụng try-catch để tránh lỗi import.meta trong một số môi trường
let BASE_URL_VALUE = "";
let MINI_APP_ID_VALUE = "";

try {
    BASE_URL_VALUE = import.meta.env?.VITE_BASE_URL || "";
    MINI_APP_ID_VALUE = (window as any).APP_ID || import.meta.env?.VITE_MINI_APP_ID || "";
} catch (e) {
    BASE_URL_VALUE = "";
    MINI_APP_ID_VALUE = (window as any).APP_ID || "";
}

export const BASE_URL = BASE_URL_VALUE;
export const MINI_APP_ID = MINI_APP_ID_VALUE;

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
