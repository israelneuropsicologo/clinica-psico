ALTER TABLE `transactions` MODIFY COLUMN `patientId` int;--> statement-breakpoint
ALTER TABLE `transactions` ADD `category` varchar(64) DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `transactionDate` bigint;