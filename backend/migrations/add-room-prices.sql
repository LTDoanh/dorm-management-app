-- Migration: Thêm các cột giá vào bảng rooms
-- Chạy script này nếu bảng rooms đã tồn tại và chưa có các cột giá

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='room_price'
    ) THEN
        ALTER TABLE rooms ADD COLUMN room_price DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='service_fee'
    ) THEN
        ALTER TABLE rooms ADD COLUMN service_fee DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='electricity_price'
    ) THEN
        ALTER TABLE rooms ADD COLUMN electricity_price DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='rooms' AND column_name='water_price'
    ) THEN
        ALTER TABLE rooms ADD COLUMN water_price DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Migration: Thêm các cột giá vào bảng rooms
-- Chạy script này nếu bảng rooms đã tồn tại và chưa có các cột giá

-- Thêm các cột giá nếu chưa tồn tại
DO $$ 
BEGIN
    -- Thêm cột room_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='rooms' AND column_name='room_price') THEN
        ALTER TABLE rooms ADD COLUMN room_price DECIMAL(12, 2) DEFAULT 0;
    END IF;

    -- Thêm cột service_fee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='rooms' AND column_name='service_fee') THEN
        ALTER TABLE rooms ADD COLUMN service_fee DECIMAL(12, 2) DEFAULT 0;
    END IF;

    -- Thêm cột electricity_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='rooms' AND column_name='electricity_price') THEN
        ALTER TABLE rooms ADD COLUMN electricity_price DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Thêm cột water_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='rooms' AND column_name='water_price') THEN
        ALTER TABLE rooms ADD COLUMN water_price DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

