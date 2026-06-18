CREATE TABLE `clinical_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`aiSuggestions` text,
	`aiSummary` text,
	`mood` enum('very_bad','bad','neutral','good','very_good'),
	`progressRating` int,
	`goals` text,
	`interventions` text,
	`homework` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinical_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int,
	`category` enum('report','exam','prescription','referral','consent','other') NOT NULL DEFAULT 'other',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(30),
	`birthDate` date,
	`cpf` varchar(14),
	`address` text,
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(30),
	`occupation` varchar(255),
	`referredBy` varchar(255),
	`mainComplaint` text,
	`medicalHistory` text,
	`medications` text,
	`notes` text,
	`status` enum('active','inactive','discharged') NOT NULL DEFAULT 'active',
	`sessionValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`scheduledAt` bigint NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 50,
	`status` enum('scheduled','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`sessionType` enum('individual','couple','group','evaluation') NOT NULL DEFAULT 'individual',
	`modality` enum('in_person','online') NOT NULL DEFAULT 'in_person',
	`sessionValue` decimal(10,2),
	`isPaid` enum('pending','paid','waived') NOT NULL DEFAULT 'pending',
	`cancelReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int,
	`amount` decimal(10,2) NOT NULL,
	`type` enum('income','expense','refund') NOT NULL DEFAULT 'income',
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('cash','pix','credit_card','debit_card','bank_transfer','health_insurance','other'),
	`description` text,
	`dueDate` bigint,
	`paidAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
