CREATE TABLE `user_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryUserId` int NOT NULL,
	`linkedUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_links_id` PRIMARY KEY(`id`)
);
