CREATE TABLE `sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`direction` enum('site_to_esaude','esaude_to_site') NOT NULL,
	`status` enum('pending','success','failed','retry') NOT NULL DEFAULT 'pending',
	`errorMessage` varchar(500),
	`esaudeId` varchar(255),
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sync_logs_id` PRIMARY KEY(`id`)
);
