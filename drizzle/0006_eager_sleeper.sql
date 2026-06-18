CREATE TABLE `lgpd_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`action` varchar(20) NOT NULL,
	`dataClassification` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` varchar(20) NOT NULL,
	`errorMessage` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lgpd_audit_logs_id` PRIMARY KEY(`id`)
);
