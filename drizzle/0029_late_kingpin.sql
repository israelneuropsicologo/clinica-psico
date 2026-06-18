CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`entityName` varchar(255),
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
