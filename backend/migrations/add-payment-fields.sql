-- Migration: Thêm các trường thanh toán và tài khoản ngân hàng
-- Chạy script này nếu database đã tồn tại

-- Thêm các cột vào bảng users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='bank_account') THEN
        ALTER TABLE users ADD COLUMN bank_account VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='bank_name') THEN
        ALTER TABLE users ADD COLUMN bank_name VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='qr_code_url') THEN
        ALTER TABLE users ADD COLUMN qr_code_url TEXT;
    END IF;
END $$;

-- Thêm các cột vào bảng tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='payment_status') THEN
        ALTER TABLE tenants ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='payment_confirmed_at') THEN
        ALTER TABLE tenants ADD COLUMN payment_confirmed_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='owner_confirmed_amount') THEN
        ALTER TABLE tenants ADD COLUMN owner_confirmed_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='owner_confirmed_at') THEN
        ALTER TABLE tenants ADD COLUMN owner_confirmed_at TIMESTAMP;
    END IF;
END $$;

-- Tạo bảng payment_details nếu chưa có
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

