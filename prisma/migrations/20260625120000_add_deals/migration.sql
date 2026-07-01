CREATE TABLE `Deal` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `specialPrice` DOUBLE NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Deal_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DealProduct` (
  `id` VARCHAR(191) NOT NULL,
  `dealId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,

  UNIQUE INDEX `DealProduct_dealId_productId_key`(`dealId`, `productId`),
  INDEX `DealProduct_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DealProduct`
  ADD CONSTRAINT `DealProduct_dealId_fkey`
  FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `DealProduct`
  ADD CONSTRAINT `DealProduct_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
