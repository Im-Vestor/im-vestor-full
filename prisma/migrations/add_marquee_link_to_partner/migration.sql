-- CreateEnum
-- Create MarqueeLinkType enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarqueeLinkType') THEN
        CREATE TYPE "MarqueeLinkType" AS ENUM ('WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER');
    END IF;
END $$;

-- AlterTable
-- Add marqueeLinkType and marqueeLinkUrl columns to Partner table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'marqueeLinkType'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "marqueeLinkType" "MarqueeLinkType";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Partner'
        AND column_name = 'marqueeLinkUrl'
    ) THEN
        ALTER TABLE "Partner" ADD COLUMN "marqueeLinkUrl" TEXT;
    END IF;
END $$;
