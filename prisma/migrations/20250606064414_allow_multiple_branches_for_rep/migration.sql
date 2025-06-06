-- DropForeignKey
ALTER TABLE `branches` DROP FOREIGN KEY `branches_salesRepId_fkey`;

-- DropIndex
DROP INDEX `branches_salesRepId_key` ON `branches`;

-- AddForeignKey
-- ALTER TABLE `order_products` ADD CONSTRAINT `order_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
