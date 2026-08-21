CREATE TABLE `shift_admins` (
	`user_id` integer NOT NULL,
	`shift_id` integer NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`user_id`, `shift_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`gender_scope` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shifts_code_unique` ON `shifts` (`code`);--> statement-breakpoint
CREATE TABLE `teacher_shifts` (
	`teacher_id` integer NOT NULL,
	`shift_id` integer NOT NULL,
	PRIMARY KEY(`teacher_id`, `shift_id`),
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `classrooms` ADD `shift_id` integer;--> statement-breakpoint
ALTER TABLE `school_settings` ADD `work_days` text DEFAULT '[6,0,1,2,3]' NOT NULL;