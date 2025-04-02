-- AlterTable
ALTER TABLE `orders` ADD COLUMN `discountAmount` DECIMAL(10, 2) NULL DEFAULT 0,
    ADD COLUMN `discountPercentage` DECIMAL(5, 2) NULL DEFAULT 0,
    ADD COLUMN `subtotalAmount` DECIMAL(10, 2) NULL;
