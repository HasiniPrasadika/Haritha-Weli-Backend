/*
  Warnings:

  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `products` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `products_name_description_tags_idx` ON `products`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `description`,
    DROP COLUMN `tags`,
    ADD COLUMN `applicationMethod` TEXT NULL,
    ADD COLUMN `mixing` TEXT NULL,
    ADD COLUMN `productImage` VARCHAR(191) NULL,
    ADD COLUMN `storage` TEXT NULL,
    ADD COLUMN `usageImage` VARCHAR(191) NULL,
    ADD COLUMN `volume` INTEGER NULL;

-- CreateIndex
CREATE FULLTEXT INDEX `products_name_idx` ON `products`(`name`);
