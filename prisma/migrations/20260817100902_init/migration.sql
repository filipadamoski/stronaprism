-- CreateTable
CREATE TABLE `Miejscowosc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nazwa` VARCHAR(191) NOT NULL,
    `kraj` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Miesiace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nazwa` VARCHAR(191) NOT NULL,
    `pora` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pomiary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `temperatura` INTEGER NOT NULL,
    `id_miejscowosc` INTEGER NOT NULL,
    `id_miesiac` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pomiary` ADD CONSTRAINT `Pomiary_id_miejscowosc_fkey` FOREIGN KEY (`id_miejscowosc`) REFERENCES `Miejscowosc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pomiary` ADD CONSTRAINT `Pomiary_id_miesiac_fkey` FOREIGN KEY (`id_miesiac`) REFERENCES `Miesiace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
