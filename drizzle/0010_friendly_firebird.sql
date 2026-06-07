CREATE TABLE `anamnesis_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fields` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnesis_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinical_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` bigint NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`description` text,
	`attachmentType` enum('exam','photo','document','test','report','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinical_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`documentType` enum('laudo','parecer','atestado','declaracao','referral') NOT NULL,
	`content` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`documentType` enum('laudo','parecer','atestado','declaracao','referral') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`pdfKey` varchar(255),
	`pdfUrl` text,
	`status` enum('draft','pending_review','approved','signed','archived') NOT NULL DEFAULT 'draft',
	`signatureDate` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`provider` varchar(255),
	`registrationNumber` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_health_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`healthPlanId` int NOT NULL,
	`membershipNumber` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_health_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productivity_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`totalSessions` int NOT NULL DEFAULT 0,
	`completedSessions` int NOT NULL DEFAULT 0,
	`cancelledSessions` int NOT NULL DEFAULT 0,
	`noShowSessions` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT 0,
	`averageSessionValue` decimal(10,2),
	`newPatients` int NOT NULL DEFAULT 0,
	`activePatients` int NOT NULL DEFAULT 0,
	`conversionRate` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productivity_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int,
	`receiptNumber` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`pdfKey` varchar(255),
	`pdfUrl` text,
	`status` enum('generated','sent','viewed','archived') NOT NULL DEFAULT 'generated',
	`sentAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `receipts_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `teleconsult_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`roomId` varchar(255) NOT NULL,
	`roomLink` text NOT NULL,
	`status` enum('pending','active','completed','cancelled') NOT NULL DEFAULT 'pending',
	`startedAt` bigint,
	`endedAt` bigint,
	`duration` int,
	`recordingUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teleconsult_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `teleconsult_sessions_roomId_unique` UNIQUE(`roomId`)
);
