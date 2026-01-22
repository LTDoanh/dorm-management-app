// API Configuration
// Luôn dùng production URL cho Zalo Mini App

export const API_BASE_URL = "https://dorm-management-app.onrender.com";

// Helper function để tạo API URL
export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;
