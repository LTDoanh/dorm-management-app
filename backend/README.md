# Backend API - Rental Management System

Backend server cho ứng dụng quản lý nhà trọ Zalo Mini App.

## 🚀 Tính năng

- RESTful API cho quản lý users, buildings, rooms, tenants, bills
- Hỗ trợ PostgreSQL (local hoặc Supabase)
- Health check endpoint
- Error handling và logging
- CORS configuration
- Graceful shutdown

## 📋 Yêu cầu

- Node.js >= 16.x
- PostgreSQL >= 12.x (hoặc Supabase account)
- npm hoặc yarn

## 🛠️ Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình Database

#### Option A: Sử dụng PostgreSQL Local

1. Cài đặt PostgreSQL trên máy local
2. Tạo database:
```sql
CREATE DATABASE rental_management;
```

3. Chạy script setup database:
```bash
npm run setup-db
```

Script này sẽ tự động tạo tất cả các bảng và index cần thiết.

Hoặc chạy thủ công:
```bash
psql -U postgres -d rental_management -f schema.sql
```

#### Option B: Sử dụng Supabase

1. Tạo project trên [Supabase](https://supabase.com)
2. Lấy connection string từ Supabase dashboard
3. Sử dụng connection string trong file `.env`

### 3. Cấu hình Environment Variables

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env` với thông tin của bạn:

**Cho PostgreSQL Local:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rental_management
DB_USER=postgres
DB_PASSWORD=your_password
```

**Cho Supabase:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🏃 Chạy Server

### Test database connection:
```bash
npm run test-db
```

### Setup database (tạo tables):
```bash
npm run setup-db
```

### Development Mode (với auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server sẽ chạy ở `http://localhost:4000` (hoặc PORT bạn đã cấu hình).

## 📡 API Endpoints

### Health Check
- `GET /health` - Kiểm tra trạng thái server và database

### Users
- `GET /api/users` - Lấy danh sách users
- `GET /api/users/:id` - Lấy thông tin một user
- `POST /api/users` - Tạo/cập nhật user

### Buildings
- `GET /api/buildings/owner/:ownerId` - Lấy danh sách tòa nhà của chủ trọ
- `GET /api/buildings/:id` - Lấy thông tin một tòa nhà
- `POST /api/buildings` - Tạo tòa nhà mới
- `PUT /api/buildings/:id` - Cập nhật tòa nhà
- `DELETE /api/buildings/:id` - Xóa tòa nhà

### Rooms
- `GET /api/rooms/building/:buildingId` - Lấy danh sách phòng trong tòa nhà
- `GET /api/rooms/:id` - Lấy thông tin một phòng
- `POST /api/rooms` - Tạo phòng mới
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng

### Tenants
- `GET /api/tenants/room/:roomId` - Lấy danh sách người thuê trọ trong phòng
- `POST /api/tenants` - Thêm người thuê trọ vào phòng
- `DELETE /api/tenants/:id` - Xóa người thuê trọ khỏi phòng

### Bills
- Các endpoint cho quản lý hóa đơn (xem trong `routes/bills.js`)

## 🔧 Cấu hình

### Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Port server chạy | `4000` |
| `HOST` | Host server | `0.0.0.0` |
| `FRONTEND_URL` | URL frontend (cho CORS) | `*` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `rental_management` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |

## 📦 Deploy

### Deploy lên VPS/Server

1. Clone repository lên server
2. Cài đặt dependencies: `npm install`
3. Cấu hình `.env` file
4. Chạy migrations (nếu có)
5. Sử dụng PM2 hoặc systemd để chạy server:

**Với PM2:**
```bash
npm install -g pm2
pm2 start server.js --name rental-api
pm2 save
pm2 startup
```

**Với systemd:**
Tạo file `/etc/systemd/system/rental-api.service`:
```ini
[Unit]
Description=Rental Management API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Sau đó:
```bash
sudo systemctl enable rental-api
sudo systemctl start rental-api
```

### Deploy lên Heroku/Railway/Render

1. Tạo account và project mới
2. Kết nối GitHub repository
3. Cấu hình environment variables
4. Deploy tự động sẽ chạy `npm start`

## 🐛 Troubleshooting

### Lỗi kết nối database

- Kiểm tra PostgreSQL đang chạy: `sudo systemctl status postgresql`
- Kiểm tra thông tin trong file `.env`
- Test connection: `psql -U postgres -d rental_management`

### Port đã được sử dụng

- Thay đổi PORT trong file `.env`
- Hoặc kill process đang dùng port: `lsof -ti:4000 | xargs kill`

### CORS errors

- Kiểm tra `FRONTEND_URL` trong file `.env`
- Đảm bảo frontend URL đúng format

## 📝 Notes

- Server tự động test database connection khi khởi động
- Health check endpoint có thể dùng để monitor server
- Logs được hiển thị trong console (có thể cấu hình thêm logging service)

## 🔐 Security

- Không commit file `.env` lên Git
- Sử dụng environment variables cho sensitive data
- Cấu hình CORS đúng cho production
- Sử dụng HTTPS trong production

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên repository.

