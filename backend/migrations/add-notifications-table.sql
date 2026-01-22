-- Migration: Thêm bảng notifications
-- Chạy script này nếu database đã tồn tại

-- Tạo bảng notifications nếu chưa có
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    tenant_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'payment_confirmation',
    title VARCHAR(255),
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(owner_id, is_read);

