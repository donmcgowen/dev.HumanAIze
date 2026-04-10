CREATE TABLE `food_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`foodName` varchar(191) NOT NULL,
	`servingSize` varchar(120),
	`calories` int NOT NULL,
	`proteinGrams` double NOT NULL,
	`carbsGrams` double NOT NULL,
	`fatGrams` double NOT NULL,
	`loggedAt` bigint NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack','other') NOT NULL DEFAULT 'other',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `food_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `food_logs` ADD CONSTRAINT `food_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;