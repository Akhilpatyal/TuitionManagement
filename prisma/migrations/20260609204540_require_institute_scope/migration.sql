/*
  Warnings:

  - Made the column `instituteId` on table `AIReport` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `Attendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `FeeHistory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `Quiz` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `QuizAttempt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `StudyMaterial` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instituteId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AIReport" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FeeHistory" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Quiz" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "QuizAttempt" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StudyMaterial" ALTER COLUMN "instituteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "instituteId" SET NOT NULL;
