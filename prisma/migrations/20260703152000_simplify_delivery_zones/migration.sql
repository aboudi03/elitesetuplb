UPDATE `DeliveryZone`
SET `label` = 'Tripoli',
    `fee` = 3,
    `sortOrder` = 1,
    `isActive` = true,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'inside-tripoli';

UPDATE `DeliveryZone`
SET `label` = 'Akkar',
    `fee` = 4,
    `sortOrder` = 2,
    `isActive` = true,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'akkar';

UPDATE `DeliveryZone`
SET `label` = 'All over Lebanon',
    `fee` = 5,
    `sortOrder` = 3,
    `isActive` = true,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'standard-lebanon';

UPDATE `DeliveryZone`
SET `isActive` = false,
    `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` NOT IN ('inside-tripoli', 'akkar', 'standard-lebanon');
