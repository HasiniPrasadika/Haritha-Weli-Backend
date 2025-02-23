/*
  Warnings:

  - You are about to drop the column `agent` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `salesRep` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[agentId]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[salesRepId]` on the table `branches` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_branchId_fkey`;

-- DropIndex
DROP INDEX `users_branchId_fkey` ON `users`;

-- AlterTable
ALTER TABLE `branches` DROP COLUMN `agent`,
    DROP COLUMN `salesRep`,
    ADD COLUMN `agentId` INTEGER NULL,
    ADD COLUMN `salesRepId` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `branchId`;

-- CreateTable
CREATE TABLE `_BranchUsers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BranchUsers_AB_unique`(`A`, `B`),
    INDEX `_BranchUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `branches_agentId_key` ON `branches`(`agentId`);

-- CreateIndex
CREATE UNIQUE INDEX `branches_salesRepId_key` ON `branches`(`salesRepId`);

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_salesRepId_fkey` FOREIGN KEY (`salesRepId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BranchUsers` ADD CONSTRAINT `_BranchUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BranchUsers` ADD CONSTRAINT `_BranchUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
