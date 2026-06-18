CREATE TABLE `anamnese` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`bloodType` varchar(10),
	`allergies` text,
	`chronicConditions` text,
	`disabilities` text,
	`mainComplaintDetail` text,
	`familyHistory` text,
	`personalHistory` text,
	`previousTreatments` text,
	`therapeuticGoals` text,
	`cidCode` varchar(20),
	`therapeuticApproach` varchar(100),
	`riskFactors` text,
	`protectiveFactors` text,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnese_id` PRIMARY KEY(`id`),
	CONSTRAINT `anamnese_patientId_unique` UNIQUE(`patientId`)
);
--> statement-breakpoint
CREATE TABLE `session_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int,
	`durationSeconds` int,
	`transcription` text,
	`transcriptionStatus` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeline_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`analysisType` enum('global','last_session','next_session') NOT NULL,
	`content` text NOT NULL,
	`sessionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_analyses_id` PRIMARY KEY(`id`)
);
