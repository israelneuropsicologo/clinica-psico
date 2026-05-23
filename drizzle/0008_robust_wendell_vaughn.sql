CREATE TABLE `chatbot_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` varchar(255) NOT NULL,
	`patientId` int,
	`message` text NOT NULL,
	`response` text,
	`sentiment` varchar(20),
	`topic` varchar(100),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversion_funnel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`stage` enum('lead','prospect','customer','inactive') NOT NULL,
	`previousStage` varchar(50),
	`source` varchar(50) NOT NULL,
	`conversionTime` int,
	`notes` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversion_funnel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `patients` ADD `leadSource` enum('chatbot','direct_booking','manual','import') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `patients` ADD `leadStatus` enum('lead','prospect','customer','inactive') DEFAULT 'lead' NOT NULL;--> statement-breakpoint
ALTER TABLE `patients` ADD `interactionCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `patients` ADD `lastInteractionAt` timestamp;