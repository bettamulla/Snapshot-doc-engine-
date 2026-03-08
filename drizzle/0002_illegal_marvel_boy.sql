CREATE TABLE `emailAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`provider` enum('sendgrid','aws_ses','mailgun','smtp') NOT NULL,
	`apiKey` text NOT NULL,
	`isDefault` int NOT NULL DEFAULT 0,
	`isVerified` int NOT NULL DEFAULT 0,
	`verificationToken` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emailAccounts` ADD CONSTRAINT `emailAccounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;