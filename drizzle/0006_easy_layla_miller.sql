CREATE TABLE `favorite_foods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`foodName` varchar(191) NOT NULL,
	`servingSize` varchar(120) NOT NULL,
	`calories` int NOT NULL,
	`proteinGrams` double NOT NULL,
	`carbsGrams` double NOT NULL,
	`fatGrams` double NOT NULL,
	`source` enum('manual','ai_recognized','usda','open_food_facts') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mealName` varchar(191) NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack','other') NOT NULL DEFAULT 'other',
	`foods` json NOT NULL,
	`totalCalories` int NOT NULL,
	`totalProteinGrams` double NOT NULL,
	`totalCarbsGrams` double NOT NULL,
	`totalFatGrams` double NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorite_foods` ADD CONSTRAINT `favorite_foods_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meal_templates` ADD CONSTRAINT `meal_templates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;