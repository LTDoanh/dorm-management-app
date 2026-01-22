-- Migration: Thêm cột billing cho bảng tenants
-- Chạy script này nếu bảng tenants đã tồn tại và chưa có các cột billing

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tenants' AND column_name='current_bill'
    ) THEN
        ALTER TABLE tenants ADD COLUMN current_bill DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tenants' AND column_name='debt'
    ) THEN
        ALTER TABLE tenants ADD COLUMN debt DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tenants' AND column_name='last_bill_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN last_bill_at TIMESTAMP;
    END IF;
END $$;


