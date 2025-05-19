-- CreateTable
CREATE TABLE `callevents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentName` VARCHAR(191) NOT NULL,
    `callerName` VARCHAR(191) NOT NULL,
    `callerNumber` VARCHAR(191) NOT NULL,
    `callSource` VARCHAR(191) NOT NULL,
    `productOfInterest` VARCHAR(191) NULL,
    `customerLocation` VARCHAR(191) NULL,
    `reasonForCall` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `followUpNeeded` BOOLEAN NOT NULL,
    `followUpDate` DATETIME(3) NULL,
    `callStatus` ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED') NOT NULL,
    `followUpStage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
