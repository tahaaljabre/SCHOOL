CREATE TABLE `teacher_classrooms` (
	`teacher_id` integer NOT NULL,
	`classroom_id` integer NOT NULL,
	PRIMARY KEY(`teacher_id`, `classroom_id`),
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `subjects` ADD `status` text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `subjects` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `created_at` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `updated_at` text;--> statement-breakpoint
UPDATE `subjects` SET `created_at`=CURRENT_TIMESTAMP,`updated_at`=CURRENT_TIMESTAMP WHERE `created_at` IS NULL;
