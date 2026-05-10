-- Thêm cột camera_rtsp vào bảng buildings
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS camera_rtsp TEXT;
