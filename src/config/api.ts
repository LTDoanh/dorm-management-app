/** Cấu hình API endpoint */
export const API_BASE_URL = "https://dorm-management-app.onrender.com";

/** Tạo URL API đầy đủ từ path */
export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;
