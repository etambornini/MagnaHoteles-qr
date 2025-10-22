/*
  Warnings:

  - You are about to alter the column `role` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(3))`.

*/
-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_hotelId_fkey`;

-- DropIndex
DROP INDEX `User_hotelId_role_idx` ON `User`;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'MANAGER') NOT NULL DEFAULT 'MANAGER',
    MODIFY `hotelId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `User_hotelId_idx` ON `User`(`hotelId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `Hotel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
