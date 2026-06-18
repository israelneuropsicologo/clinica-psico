CREATE TABLE `agent_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisType` enum('module_health','performance_bottleneck','data_inconsistency','error_pattern','optimization_opportunity','security_issue') NOT NULL,
	`module` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text NOT NULL,
	`findings` text NOT NULL,
	`recommendations` text NOT NULL,
	`autoFixApplied` boolean NOT NULL DEFAULT false,
	`fixResult` text,
	`status` enum('open','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_communications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromAgent` varchar(100) NOT NULL,
	`toAgent` varchar(100) NOT NULL,
	`messageType` enum('handshake','health_check','error_detected','consistency_check','daily_report_request','sync_status','auto_fix') NOT NULL,
	`status` enum('pending','sent','received','processed','failed') NOT NULL DEFAULT 'pending',
	`payload` text NOT NULL,
	`response` text,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_communications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_health_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`healthScore` decimal(5,2) NOT NULL,
	`uptime` int NOT NULL,
	`lastHealthCheck` timestamp NOT NULL,
	`totalAppointments` int NOT NULL DEFAULT 0,
	`syncedAppointments` int NOT NULL DEFAULT 0,
	`failedAppointments` int NOT NULL DEFAULT 0,
	`averageSyncTimeMs` int NOT NULL DEFAULT 0,
	`databaseHealth` enum('healthy','degraded','unhealthy') NOT NULL DEFAULT 'healthy',
	`apiLatencyMs` int NOT NULL DEFAULT 0,
	`pendingRetries` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_health_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` date NOT NULL,
	`agentName` varchar(100) NOT NULL,
	`summary` text NOT NULL,
	`performance` text NOT NULL,
	`errors` text,
	`recommendations` text NOT NULL,
	`autoActionsApplied` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`)
);
