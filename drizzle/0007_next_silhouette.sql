ALTER TABLE `patients` ADD `externalCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_externalCustomerId_unique` UNIQUE(`externalCustomerId`);