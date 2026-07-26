CREATE TABLE `caption_suggestion_votes` (
	`suggestion_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`suggestion_id`, `user_id`),
	FOREIGN KEY (`suggestion_id`) REFERENCES `caption_suggestions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `caption_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`line_id` text NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`terminology_warnings` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `caption_suggestions_line_idx` ON `caption_suggestions` (`line_id`);--> statement-breakpoint
CREATE INDEX `caption_suggestions_hero_idx` ON `caption_suggestions` (`hero_id`);--> statement-breakpoint
CREATE INDEX `caption_suggestions_status_idx` ON `caption_suggestions` (`status`);