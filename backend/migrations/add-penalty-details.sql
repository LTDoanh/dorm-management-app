-- Migration: Thêm cột penalty_details vào payment_details
-- Chạy script này nếu database đã tồn tại

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_details' AND column_name='penalty_details') THEN
        ALTER TABLE payment_details ADD COLUMN penalty_details JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
