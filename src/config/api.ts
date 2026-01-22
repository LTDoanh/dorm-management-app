// API Configuration
// Thay YOUR_RENDER_URL bằng URL thực từ Render.com sau khi deploy
// Ví dụ: https://my-rental-api.onrender.com

const isDevelopment = import.meta.env.DEV;

// Trong development, dùng localhost. Trong production, dùng URL từ Render
export const API_BASE_URL = isDevelopment
    ? "http://localhost:4000"
    : "https://YOUR_RENDER_URL.onrender.com"; // <-- THAY URL NÀY

// Helper function để tạo API URL
export const createApiUrl = (path: string) => `${API_BASE_URL}${path}`;
