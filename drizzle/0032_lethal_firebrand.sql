CREATE TABLE `agent_credit_pool` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`balance` decimal(20,2) NOT NULL DEFAULT '10000',
	`totalEarned` decimal(20,2) NOT NULL DEFAULT '10000',
	`totalSpent` decimal(20,2) NOT NULL DEFAULT '0',
	`regenerationRate` decimal(10,2) NOT NULL DEFAULT '500',
	`lastRegeneration` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_credit_pool_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`transactionType` enum('regeneration','communication_sent','communication_received','analysis_performed','auto_fix_applied','report_generated','bonus') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`balanceBefore` decimal(20,2) NOT NULL,
	`balanceAfter` decimal(20,2) NOT NULL,
	`relatedAgent` varchar(100),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virtual_credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionType` enum('regeneration','email_send','api_call','agent_communication','report_generation','data_sync','bonus','manual_adjustment') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`balanceBefore` decimal(20,2) NOT NULL,
	`balanceAfter` decimal(20,2) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `virtual_credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virtual_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(20,2) NOT NULL DEFAULT '1000',
	`totalEarned` decimal(20,2) NOT NULL DEFAULT '1000',
	`totalSpent` decimal(20,2) NOT NULL DEFAULT '0',
	`regenerationRate` decimal(10,2) NOT NULL DEFAULT '100',
	`regenerationInterval` int NOT NULL DEFAULT 300,
	`lastRegeneration` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virtual_credits_id` PRIMARY KEY(`id`)
);
