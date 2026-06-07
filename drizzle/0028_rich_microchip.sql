CREATE TABLE `deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`entityName` varchar(255),
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`roleId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLogin` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `internal_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clinicId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
