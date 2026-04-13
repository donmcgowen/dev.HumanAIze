CREATE TABLE `weight_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weightLbs` int NOT NULL,
	`recordedAt` bigint NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `weight_entries` ADD CONSTRAINT `weight_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP COLUMN `startWeightLbs`;