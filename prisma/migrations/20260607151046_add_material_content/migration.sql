-- AlterTable
ALTER TABLE "StudyMaterial" ADD COLUMN     "content" TEXT,
ALTER COLUMN "fileUrl" DROP NOT NULL;
