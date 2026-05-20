-- Thêm cột license_plate cho tenants (optional, biển số xe)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20);

-- Cho phép tenant_id và room_id nullable trong notifications (cho thông báo xe lạ)
ALTER TABLE notifications ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN room_id DROP NOT NULL;
