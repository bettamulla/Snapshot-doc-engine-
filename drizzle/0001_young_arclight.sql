CREATE TABLE `auditReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`assessmentDate` timestamp NOT NULL,
	`scoreTotal` int NOT NULL,
	`containmentPct` int NOT NULL,
	`exposurePct` int NOT NULL,
	`overallStatus` varchar(64) NOT NULL,
	`monthlyRevenue` int,
	`currency` varchar(3) DEFAULT 'GBP',
	`pdfUrl` text NOT NULL,
	`pdfKey` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditReports` ADD CONSTRAINT `auditReports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;