CREATE TABLE `patient_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `patient_invitations_token_unique` UNIQUE(`token`)
);
