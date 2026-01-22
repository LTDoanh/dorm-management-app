// API Configuration
// Production: https://dorm-management-app.onrender.com
// Development: http://localhost:4000

const isDevelopment = import.meta.env.DEV;

// Trong development, dùng localhost. Trong production, dùng URL từ Render
export const API_BASE_URL = isDevelopment
    ? "http://localhost:4000"
    : "https://dorm-management-app.onrender.com";

// Helper function để tạo API URL
export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;
