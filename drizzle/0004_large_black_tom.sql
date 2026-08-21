PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_parent_students` (
	`parent_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`relation` text DEFAULT 'ولي أمر' NOT NULL,
	PRIMARY KEY(`parent_id`, `student_id`),
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_parent_students`("parent_id", "student_id", "relation") SELECT "parent_id", "student_id", "relation" FROM `parent_students`;--> statement-breakpoint
DROP TABLE `parent_students`;--> statement-breakpoint
ALTER TABLE `__new_parent_students` RENAME TO `parent_students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_teacher_subjects` (
	`teacher_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	PRIMARY KEY(`teacher_id`, `subject_id`),
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_teacher_subjects`("teacher_id", "subject_id") SELECT "teacher_id", "subject_id" FROM `teacher_subjects`;--> statement-breakpoint
DROP TABLE `teacher_subjects`;--> statement-breakpoint
ALTER TABLE `__new_teacher_subjects` RENAME TO `teacher_subjects`;