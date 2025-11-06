-- AlterTable
-- Add actionPlan column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Project'
        AND column_name = 'actionPlan'
    ) THEN
        ALTER TABLE "Project" ADD COLUMN "actionPlan" TEXT;
    END IF;
END $$;

