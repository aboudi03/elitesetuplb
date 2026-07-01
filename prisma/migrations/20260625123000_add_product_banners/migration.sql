CREATE TABLE `ProductBanner` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `image` VARCHAR(191) NOT NULL,
  `altText` VARCHAR(191) NULL,
  `scopeType` ENUM('ALL', 'PRODUCTS', 'CATEGORIES') NOT NULL DEFAULT 'ALL',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductBannerProduct` (
  `id` VARCHAR(191) NOT NULL,
  `bannerId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `ProductBannerProduct_bannerId_productId_key`(`bannerId`, `productId`),
  INDEX `ProductBannerProduct_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductBannerCategory` (
  `id` VARCHAR(191) NOT NULL,
  `bannerId` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `ProductBannerCategory_bannerId_categoryId_key`(`bannerId`, `categoryId`),
  INDEX `ProductBannerCategory_categoryId_idx`(`categoryId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProductBannerProduct`
  ADD CONSTRAINT `ProductBannerProduct_bannerId_fkey`
  FOREIGN KEY (`bannerId`) REFERENCES `ProductBanner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProductBannerProduct`
  ADD CONSTRAINT `ProductBannerProduct_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProductBannerCategory`
  ADD CONSTRAINT `ProductBannerCategory_bannerId_fkey`
  FOREIGN KEY (`bannerId`) REFERENCES `ProductBanner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProductBannerCategory`
  ADD CONSTRAINT `ProductBannerCategory_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
