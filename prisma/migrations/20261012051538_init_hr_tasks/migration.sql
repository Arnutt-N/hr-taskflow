-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `detail` TEXT NULL,
    `status` ENUM('waiting', 'in_process', 'done') NOT NULL DEFAULT 'waiting',
    `dueDate` DATE NULL,
    `remark` TEXT NULL,
    `documentNumber` VARCHAR(191) NOT NULL,
    `documentDate` DATE NULL,
    `documentType` ENUM('PROMOTION_ORDER', 'APPOINTMENT', 'TRANSFER', 'INBOUND_TRANSFER', 'OUTBOUND_TRANSFER', 'RESIGNATION', 'POLICY', 'SPECIAL_ASSIGNMENT', 'OTHER') NOT NULL,
    `source` ENUM('edoc', 'paper') NOT NULL,
    `confidential` BOOLEAN NOT NULL DEFAULT false,
    `deadlineInferred` BOOLEAN NOT NULL DEFAULT false,
    `kpiLink` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tasks_documentNumber_idx`(`documentNumber`),
    INDEX `tasks_status_idx`(`status`),
    INDEX `tasks_documentType_idx`(`documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `tokenPrefix` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `api_tokens_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
