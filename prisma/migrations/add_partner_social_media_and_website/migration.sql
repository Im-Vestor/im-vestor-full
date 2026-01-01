-- AlterTable
-- Add website and social media columns to Partner table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'website'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "website" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'linkedinUrl'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "linkedinUrl" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'facebook'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "facebook" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'instagram'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "instagram" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'twitter'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "twitter" TEXT;
    END IF;
END $$;

