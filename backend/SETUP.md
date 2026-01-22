# Hướng dẫn Setup Backend

## Bước 1: Cài đặt Dependencies

```bash
cd backend
npm install
```

## Bước 2: Cấu hình Database

### Tạo file .env

Tạo file `.env` trong thư mục `backend` với nội dung sau:

```env
# Environment
NODE_ENV=development

# Server Configuration
PORT=4000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

# Database Configuration
# Option 1: Sử dụng connection string (cho Supabase)
# DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Sử dụng PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rental_management
DB_USER=postgres
DB_PASSWORD=postgres
```

### Setup Database

**Nếu dùng PostgreSQL local:**

1. Tạo database:
```bash
psql -U postgres
CREATE DATABASE rental_management;
\q
```

2. Chạy script setup:
```bash
npm run setup-db
```

**Nếu dùng Supabase:**

1. Lấy connection string từ Supabase dashboard
2. Thêm vào file `.env`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

3. Chạy script setup:
```bash
npm run setup-db
```

## Bước 3: Chạy Server

### Development mode (với auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server sẽ chạy ở `http://localhost:4000`

## Kiểm tra

1. Mở browser và truy cập: `http://localhost:4000/health`
2. Nếu thấy `{"status":"healthy","database":"connected"}` thì setup thành công!

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL đang chạy: `sudo systemctl status postgresql` (Linux) hoặc Services (Windows)
- Kiểm tra thông tin trong file `.env`
- Test connection: `npm run test-db`

### Port đã được sử dụng
- Thay đổi PORT trong file `.env`
- Hoặc kill process: `lsof -ti:4000 | xargs kill` (Mac/Linux)

