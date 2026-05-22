# Backend API - Dorm Management System

Backend server cho ứng dụng quản lý nhà trọ Zalo Mini App.

## Tính năng

- RESTful API cho quản lý users, buildings, rooms, tenants, payments, notifications
- Hệ thống tạo hóa đơn hàng tháng (billing engine)
- Xác nhận thanh toán 2 chiều (người thuê ↔ chủ trọ)
- Hỗ trợ PostgreSQL (local hoặc Supabase)
- Health check endpoint
- Config endpoint cho go2rtc (camera RTSP relay)
- Error handling và request logging (dev mode)
- CORS configuration
- Graceful shutdown (SIGTERM, SIGINT)

## Yêu cầu

- Node.js >= 16.x
- PostgreSQL >= 12.x (hoặc Supabase account)
- npm

## Cấu trúc thư mục

```
backend/
├── server.js               # Entry point, middleware, route mounting
├── db.js                   # PostgreSQL connection pool (pg)
├── schema.sql              # DDL tạo bảng + index (bản đầy đủ)
├── routes/
│   ├── users.js            # CRUD user, cập nhật bank info
│   ├── buildings.js        # CRUD tòa nhà
│   ├── rooms.js            # CRUD phòng
│   ├── tenants.js          # CRUD người thuê + tạo hóa đơn (billing)
│   ├── payments.js         # Xác nhận thanh toán (tenant + owner)
│   ├── notifications.js    # Thông báo cho owner & tenant
│   ├── bills.js            # Hỗ trợ truy vấn payment_details
│   └── plate-detection.js  # Nhận diện biển số xe
├── migrations/             # DB migration scripts (chạy thủ công)
│   ├── add-room-prices.sql
│   ├── add-tenant-billing-columns.sql
│   ├── add-payment-fields.sql
│   ├── add-notifications-table.sql
│   ├── add-penalty-details.sql
│   ├── add_camera_rtsp.sql
│   └── add_license_plate.sql
├── package.json
└── .env                    # Environment variables (không commit)
```

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình Database

#### Option A: PostgreSQL Local

1. Cài đặt PostgreSQL trên máy local
2. Tạo database:
```sql
CREATE DATABASE rental_management;
```

3. Chạy script setup database:
```bash
npm run setup-db
```

Hoặc chạy thủ công:
```bash
psql -U postgres -d rental_management -f schema.sql
```

#### Option B: Supabase (Production)

1. Tạo project trên [Supabase](https://supabase.com)
2. Lấy connection string từ Supabase dashboard
3. Sử dụng connection string trong file `.env`
4. Copy nội dung `schema.sql` vào SQL Editor của Supabase để tạo bảng

### 3. Cấu hình Environment Variables

Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

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

## Chạy Server

### Development Mode (có request logging)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server sẽ chạy ở `http://localhost:4000` (hoặc PORT đã cấu hình).

### Test database connection
```bash
npm run test-db
```

## API Endpoints

### Health Check & Config
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/health` | Kiểm tra trạng thái server và database |
| `GET` | `/api/config/go2rtc` | Lấy URL go2rtc relay (cho camera RTSP) |
| `GET` | `/` | Thông tin API (tên, version, danh sách endpoint) |

### Users (`/api/users`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/users` | Tạo/cập nhật user (upsert bằng ON CONFLICT) |
| `GET` | `/api/users` | Lấy danh sách tất cả users |
| `GET` | `/api/users/:id` | Lấy thông tin một user theo Zalo ID |
| `PUT` | `/api/users/:id/bank-account` | Cập nhật thông tin ngân hàng & SĐT |

### Buildings (`/api/buildings`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/buildings/owner/:ownerId` | Danh sách tòa nhà của chủ trọ |
| `GET` | `/api/buildings/:id` | Chi tiết một tòa nhà |
| `POST` | `/api/buildings` | Tạo tòa nhà mới (có camera RTSP URL) |
| `PUT` | `/api/buildings/:id` | Cập nhật tòa nhà |
| `DELETE` | `/api/buildings/:id` | Xóa tòa nhà (cascade) |

### Rooms (`/api/rooms`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/rooms/building/:buildingId` | Danh sách phòng trong tòa nhà |
| `GET` | `/api/rooms/:id` | Chi tiết một phòng |
| `POST` | `/api/rooms` | Tạo phòng mới |
| `PUT` | `/api/rooms/:id` | Cập nhật phòng (giá, chỉ số điện/nước) |
| `DELETE` | `/api/rooms/:id` | Xóa phòng |

### Tenants (`/api/tenants`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/tenants/room/:roomId` | Danh sách tenant trong phòng (JOIN users) |
| `POST` | `/api/tenants` | Thêm tenant vào phòng |
| `DELETE` | `/api/tenants/:id` | Xóa một tenant |
| `DELETE` | `/api/tenants/room/:roomId/all` | Xóa tất cả tenant trong phòng |
| `POST` | `/api/tenants/find-by-phone` | Tìm user bằng SĐT |
| `POST` | `/api/tenants/room/:roomId/billing` | Tạo hóa đơn tháng (tính tiền, lưu payment_details, tạo notification) |

### Payments (`/api/payments`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/payments/tenant/:userId` | Lấy chi tiết hóa đơn + bank info chủ trọ |
| `GET` | `/api/payments/tenant/:userId/status` | Lấy trạng thái thanh toán |
| `POST` | `/api/payments/confirm` | Người thuê xác nhận đã chuyển khoản |
| `POST` | `/api/payments/owner-confirm` | Chủ trọ xác nhận đã nhận tiền (tính partial/paid/overpaid) |

### Notifications (`/api/notifications`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/notifications/owner/:ownerId` | Thông báo của chủ trọ |
| `GET` | `/api/notifications/owner/:ownerId/count` | Đếm thông báo chưa đọc (chủ trọ) |
| `GET` | `/api/notifications/tenant/:userId` | Thông báo của người thuê |
| `GET` | `/api/notifications/tenant/:userId/count` | Đếm thông báo chưa đọc (tenant) |
| `PUT` | `/api/notifications/:id/read` | Đánh dấu đã đọc một thông báo |
| `PUT` | `/api/notifications/owner/:ownerId/read-all` | Đánh dấu tất cả đã đọc (chủ trọ) |
| `PUT` | `/api/notifications/tenant/:userId/read-all` | Đánh dấu tất cả đã đọc (tenant) |
| `DELETE` | `/api/notifications/:id` | Xóa thông báo |

### Plate Detection (`/api/plate-detection`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| - | `/api/plate-detection/...` | Nhận diện biển số xe (đang phát triển) |

## Database Migrations

Các migration script nằm trong thư mục `migrations/`. Chạy thủ công bằng cách copy nội dung vào psql hoặc Supabase SQL Editor.

**Thứ tự chạy migration (nếu DB đã có schema cũ):**

1. `add-room-prices.sql` — Thêm cột giá phòng, phí dịch vụ, giá điện/nước vào `rooms`
2. `add-tenant-billing-columns.sql` — Thêm cột `current_bill`, `debt`, `last_bill_at` vào `tenants`
3. `add-payment-fields.sql` — Thêm bank info vào `users`, payment status vào `tenants`, tạo bảng `payment_details`
4. `add-notifications-table.sql` — Tạo bảng `notifications` + index
5. `add-penalty-details.sql` — Thêm cột `penalty_details` (JSONB) vào `payment_details`
6. `add_camera_rtsp.sql` — Thêm cột `camera_rtsp` vào `buildings`
7. `add_license_plate.sql` — Thêm cột `license_plate` vào `tenants`, nullable FK notifications

> **Lưu ý:** Nếu setup DB mới từ đầu, chỉ cần chạy `schema.sql` — file này đã bao gồm toàn bộ cấu trúc bảng. Các migration chỉ cần thiết khi nâng cấp DB cũ.

Tất cả migration đều **idempotent** (chạy lại nhiều lần không lỗi) nhờ sử dụng `IF NOT EXISTS`.

## Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Port server chạy | `4000` |
| `HOST` | Host server | `0.0.0.0` |
| `FRONTEND_URL` | URL frontend (cho CORS) | `*` |
| `DATABASE_URL` | PostgreSQL connection string (production) | - |
| `DB_HOST` | Database host (local) | `localhost` |
| `DB_PORT` | Database port (local) | `5432` |
| `DB_NAME` | Database name (local) | `rental_management` |
| `DB_USER` | Database user (local) | `postgres` |
| `DB_PASSWORD` | Database password (local) | `postgres` |
| `GO2RTC_URL` | URL go2rtc relay server (cho camera RTSP) | - |

## Deploy

### Deploy lên Render.com (Production hiện tại)

1. Tạo Web Service trên [Render](https://render.com)
2. Kết nối GitHub repository, chọn thư mục `backend/`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Cấu hình environment variables (`DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV=production`)

### Deploy lên VPS/Server

1. Clone repository lên server
2. Cài đặt dependencies: `npm install`
3. Cấu hình `.env` file
4. Chạy migrations (nếu nâng cấp từ DB cũ)
5. Sử dụng PM2 để quản lý process:

```bash
npm install -g pm2
pm2 start server.js --name rental-api
pm2 save
pm2 startup
```

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL đang chạy: `sudo systemctl status postgresql`
- Kiểm tra thông tin trong file `.env`
- Test connection: `npm run test-db`

### Port đã được sử dụng
- Thay đổi PORT trong file `.env`
- Hoặc kill process đang dùng port: `lsof -ti:4000 | xargs kill`

### CORS errors
- Kiểm tra `FRONTEND_URL` trong file `.env`
- Trong production, set `FRONTEND_URL` cụ thể thay vì `*`

## Security

- Không commit file `.env` lên Git
- Sử dụng environment variables cho sensitive data
- Cấu hình CORS đúng cho production (không dùng `origin: "*"`)
- Sử dụng HTTPS trong production
- **Lưu ý:** Backend hiện chưa có authentication middleware — cần bổ sung nếu deploy public
