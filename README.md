# Ứng dụng Quản lý Phòng trọ tích hợp AI

## Tổng quan
Dự án bao gồm 2 phần chính:
- **Backend (`backend/`)**: REST API viết bằng Node.js/Express, sử dụng cơ sở dữ liệu PostgreSQL. Tích hợp tính năng nhận diện biển số xe tự động thông qua `Roboflow Cloud` và cung cấp luồng camera RTSP thời gian thực bằng `go2rtc`.
- **Frontend (`src/`)**: Ứng dụng Zalo Mini App sử dụng React, `zmp-ui` và `zmp-sdk`.

Hạ tầng yêu cầu để chạy ứng dụng đầy đủ tính năng:
- PostgreSQL (Khuyến nghị dùng Supabase cho tiện lợi).
- Render.com (Hoặc môi trường chạy Node.js bất kỳ để deploy API Backend).
- `go2rtc` (Để chuyển đổi stream camera RTSP sang WebRTC/MSE).
- Cloudflare Tunnel (Để public luồng camera từ local ra internet).

---

## Yêu cầu cài sẵn
- Node.js `>= 18`
- npm hoặc yarn
- PostgreSQL hoặc tài khoản Supabase.
- Visual Studio Code với **Zalo Mini App extension**.
- App Zalo trên điện thoại để quét mã test app.

---

## 1. Cài đặt và cấu hình Backend

### 1.1 Khởi tạo cơ sở dữ liệu
1. Tạo một cơ sở dữ liệu PostgreSQL (có thể tạo miễn phí nhanh chóng trên Supabase).
2. Mở file `backend/schema.sql` và chạy tất cả các lệnh SQL trong đó để tạo các bảng cơ bản.
3. Chạy lần lượt các file script trong thư mục `backend/migrations/` để cập nhật database (ví dụ: thêm cột `license_plate`, `payment_fields`...).

### 1.2 Cài đặt thư viện
Di chuyển vào thư mục backend và cài đặt các dependencies:
```shell
cd backend
npm install
```

### 1.3 Cấu hình biến môi trường
Tạo một file `.env` trong thư mục `backend` với nội dung sau:
```env
PORT=3000
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<dbname>
ROBOFLOW_API_KEY=your_roboflow_key # API Key để nhận diện biển số xe (Code đã có fallback dự phòng)
GO2RTC_URL=https://your-tunnel-url.trycloudflare.com # Lấy link này ở Bước 2
```

### 1.4 Chạy Backend (Local)
Chạy server backend trên máy tính của bạn:
```shell
npm run dev
# hoặc
npm start
```
Backend sẽ bắt đầu lắng nghe tại địa chỉ `http://localhost:3000`.

### 1.5 (Tùy chọn) Triển khai Backend lên Render.com
Nếu bạn muốn public backend lên internet (cần thiết khi publish mini app thật):
1. Truy cập [Dashboard Render](https://dashboard.render.com/).
2. Tạo một **Web Service** mới, liên kết với Github Repo của bạn và trỏ Root Directory vào thư mục `backend`.
3. Trong tab **Environment** của dịch vụ vừa tạo, thêm các biến môi trường:
   - `DATABASE_URL`
   - `ROBOFLOW_API_KEY` (Tùy chọn)
   - `GO2RTC_URL` (Trống tạm thời, sẽ cập nhật khi thiết lập Cloudflare xong)
4. Nhấn **Save Changes** để Render tự động build và chạy dịch vụ. Lấy URL của backend (ví dụ `https://my-dorm-backend.onrender.com`).

---

## 2. Thiết lập go2rtc & Cloudflare Tunnel (Cho tính năng Camera & Biển số xe)

Tính năng xem camera và quét biển số xe lạ yêu cầu luồng RTSP nội bộ phải được xử lý và đưa lên mạng Internet.

### 2.1 Cài đặt và khởi chạy go2rtc
1. Tải phần mềm `go2rtc` mới nhất tại [Github go2rtc Releases](https://github.com/AlexxIT/go2rtc/releases).
2. Chạy trực tiếp file thực thi (ví dụ: `go2rtc.exe` trên Windows).
3. Khi khởi động, go2rtc sẽ mở cổng API mặc định tại `1984` (Trong log hiện `INF [api] listen addr=:1984`).

### 2.2 Đưa luồng Camera lên Internet bằng Cloudflare Tunnel
Vì Zalo Mini App trên điện thoại không thể kết nối trực tiếp đến cổng `localhost:1984` của máy tính bạn, ta cần dùng Cloudflare Tunnel:
1. Tải công cụ `cloudflared` tại trang chủ Cloudflare.
2. Mở Terminal (Command Prompt / PowerShell) và gõ lệnh sau để kết nối cổng 1984 ra ngoài internet:
   ```shell
   cloudflared tunnel --url http://localhost:1984
   ```
3. Cloudflare sẽ tạo ra một đường link tạm thời dạng `https://<random-name>.trycloudflare.com`.
4. Copy toàn bộ đường link này.

### 2.3 Cập nhật biến môi trường
- Nếu đang chạy backend local: Dán link vừa copy vào biến `GO2RTC_URL` trong file `backend/.env`.
- Nếu đang chạy backend trên Render: Mở Dashboard Render -> Web Service -> Environment. Dán link vừa copy vào giá trị của biến `GO2RTC_URL`. Nhấn **Save Changes** để backend tự động khởi động lại.

---

## 3. Chạy giao diện Zalo Mini App và Trải nghiệm (Demo)

### 3.1 Cài đặt dependencies Frontend
Mở một terminal mới ở thư mục gốc của dự án (`dorm-management-app`), cài đặt thư viện:
```shell
npm install
```

### 3.2 Kết nối Frontend với Backend
Mở file `src/constants/common.ts`, tìm biến `API_BASE_URL` và đổi giá trị thành địa chỉ backend của bạn:
- Local: `http://localhost:3000`
- Render: `https://my-dorm-backend.onrender.com`

### 3.3 Hướng dẫn Cài đặt & Dùng thử Zalo Mini App Extension (Trên VS Code)
Để giả lập và chạy thử ứng dụng ngay trên Zalo của điện thoại, bạn thao tác như sau:

1. **Cài đặt Extension:** 
   - Mở VS Code, chuyển sang tab Extensions (hoặc bấm `Ctrl+Shift+X`).
   - Tìm từ khóa **Zalo Mini App** và bấm Install.
2. **Đăng nhập tài khoản Zalo:** 
   - Bấm vào biểu tượng Zalo Mini App ở thanh công cụ bên trái (Activity Bar) của VS Code.
   - Nhấn nút **Login**. Một trình duyệt sẽ mở ra để bạn đăng nhập/quét mã QR xác thực bằng tài khoản Zalo cá nhân.
3. **Khởi động server phát triển (Development):**
   - Vẫn ở bảng điều khiển của Zalo Mini App trong VS Code, tìm và nhấn nút **Start Development Server**.
   - (Hoặc bạn có thể gõ trực tiếp lệnh `zmp start` trên terminal).
4. **Trải nghiệm Demo trên điện thoại:**
   - Sau khi server khởi động xong, Extension sẽ hiển thị một **Mã QR code** ngay trên màn hình VS Code.
   - Mở ứng dụng **Zalo** trên điện thoại. Bấm vào biểu tượng quét mã QR (ở góc phải trên cùng màn hình chat).
   - Đưa camera quét mã QR trên VS Code. Zalo sẽ tự động tải và hiển thị giao diện Mini App trực tiếp trên điện thoại của bạn.
   - Lúc này bạn có thể thao tác thêm phòng, thêm người thuê, bật/tắt camera giám sát, cũng như thanh toán hóa đơn. Mọi code bạn sửa trong VS Code sẽ được Live Reload ngay lập tức lên điện thoại.

### 3.4 Đóng gói và Phát hành (Deploy)
Khi ứng dụng đã hoàn thiện và sẵn sàng phát hành:
1. Nhấn nút **Deploy** trên bảng điều khiển của Zalo Mini App extension.
2. Ghi chú lại những thay đổi (Changelog) của phiên bản.
3. Extension sẽ build ra gói mã nguồn (bundle) và tự động upload lên Zalo Mini App Platform. Bạn có thể lên trang quản trị Zalo Mini App để trình duyệt phiên bản này.

---

## Các Lệnh Hữu Ích

- `npm run start` (Frontend): Khởi chạy Development server cho Mini App.
- `npm run deploy` (Frontend): Đóng gói và Deploy Mini App lên Zalo.
- `npm start` (Backend): Chạy REST API Server.
- `cloudflared tunnel --url http://localhost:1984`: Mở luồng Camera ra mạng công cộng.

## License
Dự án phát triển dựa trên **Zalo Mini App Framework**.
