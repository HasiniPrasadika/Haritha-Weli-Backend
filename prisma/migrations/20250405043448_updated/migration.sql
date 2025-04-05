/*
  Warnings:

  - You are about to drop the column `productImage` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `productImage`,
    ADD COLUMN `userImage` VARCHAR(191) NULL;
