-- AlterTable
-- Add isFeatured column to Partner table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

