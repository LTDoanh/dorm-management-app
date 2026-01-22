# Quick Start Guide

## Setup nhanh trong 3 bước

### 1. Cài đặt
```bash
cd backend
npm install
```

### 2. Cấu hình .env
Tạo file `.env` với nội dung:
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rental_management
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Chạy
```bash
# Tạo database tables
npm run setup-db

# Chạy server
npm run dev
```

✅ Xong! Server đang chạy ở `http://localhost:4000`

Kiểm tra: Mở `http://localhost:4000/health` trong browser.

