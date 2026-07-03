-- CreateTable
CREATE TABLE `DeliveryZone` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Lebanon',
    `governorate` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fee` DOUBLE NOT NULL DEFAULT 5,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryZone_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Customer_order`
    ADD COLUMN `deliveryZoneId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryFee` DOUBLE NOT NULL DEFAULT 5,
    ADD COLUMN `grandTotal` DOUBLE NULL;

-- AddIndex
CREATE INDEX `Customer_order_deliveryZoneId_idx` ON `Customer_order`(`deliveryZoneId`);

-- AddForeignKey
ALTER TABLE `Customer_order`
    ADD CONSTRAINT `Customer_order_deliveryZoneId_fkey`
    FOREIGN KEY (`deliveryZoneId`) REFERENCES `DeliveryZone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData
INSERT INTO `DeliveryZone` (`id`, `code`, `country`, `governorate`, `city`, `label`, `fee`, `isActive`, `sortOrder`, `updatedAt`) VALUES
('delivery-zone-standard-lebanon', 'standard-lebanon', 'Lebanon', 'Lebanon', 'Lebanon', 'Standard Lebanon', 5, true, 0, CURRENT_TIMESTAMP(3)),
('delivery-zone-inside-tripoli', 'inside-tripoli', 'Lebanon', 'North Lebanon', 'Tripoli', 'Inside Tripoli', 3, true, 1, CURRENT_TIMESTAMP(3)),
('delivery-zone-akkar', 'akkar', 'Lebanon', 'Akkar', 'Akkar', 'Akkar', 4, true, 2, CURRENT_TIMESTAMP(3)),
('delivery-zone-beirut', 'beirut', 'Lebanon', 'Beirut', 'Beirut', 'Beirut', 5, true, 10, CURRENT_TIMESTAMP(3)),
('delivery-zone-mount-lebanon', 'mount-lebanon', 'Lebanon', 'Mount Lebanon', 'Mount Lebanon', 'Mount Lebanon', 5, true, 20, CURRENT_TIMESTAMP(3)),
('delivery-zone-north-lebanon', 'north-lebanon', 'Lebanon', 'North Lebanon', 'North Lebanon', 'North Lebanon outside Tripoli', 5, true, 30, CURRENT_TIMESTAMP(3)),
('delivery-zone-south-lebanon', 'south-lebanon', 'Lebanon', 'South Lebanon', 'South Lebanon', 'South Lebanon', 5, true, 40, CURRENT_TIMESTAMP(3)),
('delivery-zone-nabatieh', 'nabatieh', 'Lebanon', 'Nabatieh', 'Nabatieh', 'Nabatieh', 5, true, 50, CURRENT_TIMESTAMP(3)),
('delivery-zone-beqaa', 'beqaa', 'Lebanon', 'Beqaa', 'Beqaa', 'Beqaa', 5, true, 60, CURRENT_TIMESTAMP(3)),
('delivery-zone-baalbek-hermel', 'baalbek-hermel', 'Lebanon', 'Baalbek-Hermel', 'Baalbek-Hermel', 'Baalbek-Hermel', 5, true, 70, CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
    `country` = VALUES(`country`),
    `governorate` = VALUES(`governorate`),
    `city` = VALUES(`city`),
    `label` = VALUES(`label`),
    `fee` = VALUES(`fee`),
    `isActive` = VALUES(`isActive`),
    `sortOrder` = VALUES(`sortOrder`),
    `updatedAt` = CURRENT_TIMESTAMP(3);
