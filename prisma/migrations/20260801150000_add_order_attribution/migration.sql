ALTER TABLE `Customer_order`
  ADD COLUMN `attributionSource` VARCHAR(191) NULL,
  ADD COLUMN `attributionMedium` VARCHAR(191) NULL,
  ADD COLUMN `attributionCampaign` VARCHAR(191) NULL,
  ADD COLUMN `attributionCampaignId` VARCHAR(191) NULL,
  ADD COLUMN `attributionAdset` VARCHAR(191) NULL,
  ADD COLUMN `attributionAdsetId` VARCHAR(191) NULL,
  ADD COLUMN `attributionAd` VARCHAR(191) NULL,
  ADD COLUMN `attributionAdId` VARCHAR(191) NULL,
  ADD COLUMN `attributionFbclid` VARCHAR(191) NULL,
  ADD COLUMN `attributionLandingPage` TEXT NULL,
  ADD COLUMN `attributionReferrer` TEXT NULL,
  ADD COLUMN `attributionCapturedAt` DATETIME(3) NULL;

CREATE INDEX `Customer_order_attributionCampaignId_idx`
  ON `Customer_order`(`attributionCampaignId`);
