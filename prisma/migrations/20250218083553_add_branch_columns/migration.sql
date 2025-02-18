/*
  Warnings:

  - Added the required column `name` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `branches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `branches` ADD COLUMN `agent` INTEGER NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `salesRep` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `branchId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
