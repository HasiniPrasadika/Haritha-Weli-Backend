-- CreateTable
CREATE TABLE `mason_bass` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bassName` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
