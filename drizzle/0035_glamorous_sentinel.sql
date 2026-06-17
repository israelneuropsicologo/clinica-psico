ALTER TABLE `patients` MODIFY COLUMN `status` enum('active','inactive','discharged','archived') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `sync_logs` DROP COLUMN `notified`;