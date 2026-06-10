-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'INSTITUTE_OWNER';
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- AlterTable
ALTER TABLE "AIReport" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "FeeHistory" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "StudyMaterial" ADD COLUMN     "instituteId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instituteId" TEXT;

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institute_slug_key" ON "Institute"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeHistory" ADD CONSTRAINT "FeeHistory_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
