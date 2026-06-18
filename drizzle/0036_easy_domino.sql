CREATE TABLE `analysis_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`analysisType` enum('global','session','evolution') NOT NULL DEFAULT 'global',
	`content` text NOT NULL,
	`summary` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_history_id` PRIMARY KEY(`id`)
);
