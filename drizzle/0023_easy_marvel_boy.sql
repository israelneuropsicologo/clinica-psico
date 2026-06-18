ALTER TABLE `clinical_notes` MODIFY COLUMN `content` text NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `externalBookingId` varchar(255);