CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_data` text,
	`after_data` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `school_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`school_name` text NOT NULL,
	`short_name` text DEFAULT '' NOT NULL,
	`logo_url` text DEFAULT '' NOT NULL,
	`country` text DEFAULT 'اليمن' NOT NULL,
	`governorate` text DEFAULT 'لحج' NOT NULL,
	`district` text DEFAULT 'المفلحي' NOT NULL,
	`area` text DEFAULT 'يافع' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`principal_name` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'YER' NOT NULL,
	`timezone` text DEFAULT 'Asia/Aden' NOT NULL,
	`date_mode` text DEFAULT 'both' NOT NULL,
	`primary_color` text DEFAULT '#087b83' NOT NULL,
	`academic_year` text DEFAULT '1448هـ' NOT NULL,
	`current_term` text DEFAULT 'الفصل الأول' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_user_id` text NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_external_user_id_unique` ON `users` (`external_user_id`);