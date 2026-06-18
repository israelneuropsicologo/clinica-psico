CREATE TABLE `anamneseV1` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientId` int NOT NULL,
	`mainComplaintDetail` text,
	`therapeuticGoals` text,
	`cidCode` varchar(20),
	`cidDescription` text,
	`therapeuticApproach` text,
	`currentDiseaseHistory` text,
	`personalHistory` text,
	`familyHistory` text,
	`psychiatricHistory` text,
	`previousTreatments` text,
	`childhoodHistory` text,
	`relationshipHistory` text,
	`professionalHistory` text,
	`substanceUse` text,
	`sleepAndEating` text,
	`sexualAffectiveLife` text,
	`riskFactors` text,
	`protectiveFactors` text,
	`additionalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamneseV1_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `anamneseV1` ADD CONSTRAINT `anamneseV1_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;