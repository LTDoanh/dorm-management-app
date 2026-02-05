-- Tạo bảng users nếu chưa có
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50),
    phone_number VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    qr_code_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng buildings
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    owner_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tạo bảng rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    building_id INTEGER NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    room_price DECIMAL(12, 2) DEFAULT 0,
    service_fee DECIMAL(12, 2) DEFAULT 0,
    electricity_price DECIMAL(10, 2) DEFAULT 0,
    water_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tạo bảng tenants (người thuê trọ)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    current_bill DECIMAL(12, 2) DEFAULT 0,
    debt DECIMAL(12, 2) DEFAULT 0,
    last_bill_at TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_confirmed_at TIMESTAMP,
    owner_confirmed_amount DECIMAL(12, 2) DEFAULT 0,
    owner_confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(room_id, user_id)
);

-- Tạo bảng payment_details để lưu chi tiết hóa đơn
CREATE TABLE IF NOT EXISTS payment_details (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    room_price DECIMAL(12, 2) DEFAULT 0,
    service_fee DECIMAL(12, 2) DEFAULT 0,
    electricity_amount DECIMAL(12, 2) DEFAULT 0,
    water_amount DECIMAL(12, 2) DEFAULT 0,
    penalty DECIMAL(12, 2) DEFAULT 0,
    debt_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tạo bảng notifications
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

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_buildings_owner ON buildings(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_room ON tenants(room_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(owner_id, is_read);

