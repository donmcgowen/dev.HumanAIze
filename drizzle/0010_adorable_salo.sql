CREATE TABLE `food_search_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchQuery` varchar(191) NOT NULL,
	`foodName` varchar(191) NOT NULL,
	`description` text,
	`calories` int NOT NULL,
	`proteinGrams` double NOT NULL,
	`carbsGrams` double NOT NULL,
	`fatGrams` double NOT NULL,
	`servingSize` varchar(120) NOT NULL DEFAULT '100g',
	`source` enum('gemini','usda','open_food_facts') NOT NULL DEFAULT 'gemini',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `food_search_cache_id` PRIMARY KEY(`id`)
);
