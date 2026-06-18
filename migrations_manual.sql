-- ============================================================================
-- Manual Migration: Add missing tables for clinica-psico
-- ============================================================================

-- API Tokens Table
CREATE TABLE IF NOT EXISTS `apiTokens` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `description` text,
  `isActive` tinyint DEFAULT 1 NOT NULL,
  `lastUsedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS `webhookLogs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `webhookType` varchar(100) NOT NULL,
  `payload` json,
  `statusCode` int,
  `response` text,
  `error` text,
  `isSuccess` tinyint DEFAULT 0 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sync Logs Table
CREATE TABLE IF NOT EXISTS `syncLogs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `syncType` varchar(100) NOT NULL,
  `source` varchar(100) NOT NULL,
  `target` varchar(100) NOT NULL,
  `recordsProcessed` int DEFAULT 0,
  `recordsSucceeded` int DEFAULT 0,
  `recordsFailed` int DEFAULT 0,
  `error` text,
  `isSuccess` tinyint DEFAULT 0 NOT NULL,
  `startedAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `completedAt` timestamp NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Session Recordings Table
CREATE TABLE IF NOT EXISTS `sessionRecordings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `sessionId` int NOT NULL,
  `recordingUrl` text,
  `fileKey` varchar(255),
  `duration` int,
  `fileSize` int,
  `isTranscribed` tinyint DEFAULT 0 NOT NULL,
  `transcription` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Links Table
CREATE TABLE IF NOT EXISTS `userLinks` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `primaryUserId` int NOT NULL,
  `linkedUserId` int NOT NULL,
  `permission` enum('view','edit','admin') DEFAULT 'view' NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`primaryUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`linkedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Shares Table
CREATE TABLE IF NOT EXISTS `userShares` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `fromUserId` int NOT NULL,
  `toUserId` int NOT NULL,
  `patientId` int NOT NULL,
  `permission` enum('view','edit','admin') DEFAULT 'view' NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timeline Analyses Table
CREATE TABLE IF NOT EXISTS `timelineAnalyses` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `patientId` int NOT NULL,
  `analysisType` varchar(100) NOT NULL,
  `content` text,
  `summary` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patient Invitations Table
CREATE TABLE IF NOT EXISTS `patientInvitations` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `patientId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `email` varchar(320) NOT NULL,
  `status` enum('pending','accepted','rejected','expired') DEFAULT 'pending' NOT NULL,
  `expiresAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Internal Users Table
CREATE TABLE IF NOT EXISTS `internalUsers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `roleId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(20),
  `isActive` tinyint DEFAULT 1 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Communications Table
CREATE TABLE IF NOT EXISTS `agentCommunications` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `agentId` varchar(100) NOT NULL,
  `agentName` varchar(255) NOT NULL,
  `messageType` varchar(100) NOT NULL,
  `content` text,
  `response` text,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending' NOT NULL,
  `error` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Analysis Table
CREATE TABLE IF NOT EXISTS `agentAnalysis` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `patientId` int NOT NULL,
  `analysisType` varchar(100) NOT NULL,
  `findings` text,
  `recommendations` text,
  `confidence` decimal(3,2),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Health Metrics Table
CREATE TABLE IF NOT EXISTS `agentHealthMetrics` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `metricType` varchar(100) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `unit` varchar(50),
  `status` enum('normal','warning','critical') DEFAULT 'normal' NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agent Tokens Table
CREATE TABLE IF NOT EXISTS `agentTokens` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `agentId` varchar(100) NOT NULL,
  `tokensUsed` int DEFAULT 0 NOT NULL,
  `tokensRemaining` int DEFAULT 0 NOT NULL,
  `totalAllocation` int DEFAULT 0 NOT NULL,
  `resetDate` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily Reports Table
CREATE TABLE IF NOT EXISTS `dailyReports` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `reportDate` date NOT NULL,
  `totalPatients` int DEFAULT 0,
  `totalSessions` int DEFAULT 0,
  `totalRevenue` decimal(10,2) DEFAULT 0,
  `summary` text,
  `metrics` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
