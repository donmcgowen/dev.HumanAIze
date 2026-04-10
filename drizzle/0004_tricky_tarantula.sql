CREATE TABLE `nutrition_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`dailyCalories` int NOT NULL,
	`proteinGrams` double NOT NULL,
	`carbsGrams` double NOT NULL,
	`fatGrams` double NOT NULL,
	`proteinCalories` int NOT NULL,
	`carbsCalories` int NOT NULL,
	`fatCalories` int NOT NULL,
	`fitnessGoal` enum('lose_fat','build_muscle','maintain') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nutrition_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nutrition_plans` ADD CONSTRAINT `nutrition_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;