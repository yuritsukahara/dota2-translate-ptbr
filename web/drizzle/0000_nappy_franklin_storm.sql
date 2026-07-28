CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_actor_action_idx` ON `audit_events` (`actor_id`,`action`);--> statement-breakpoint
CREATE INDEX `audit_subject_idx` ON `audit_events` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE TABLE `caption_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`line_id` text NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `caption_suggestions_line_idx` ON `caption_suggestions` (`line_id`);--> statement-breakpoint
CREATE INDEX `caption_suggestions_hero_idx` ON `caption_suggestions` (`hero_id`);--> statement-breakpoint
CREATE TABLE `petition_signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`statement_version` text DEFAULT '2026-07-26' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `petition_signatures_user_id_unique` ON `petition_signatures` (`user_id`);--> statement-breakpoint
CREATE INDEX `petition_signatures_created_idx` ON `petition_signatures` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`steam_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`steam_account_created_at` text NOT NULL,
	`blocked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_steam_id_unique` ON `users` (`steam_id`);--> statement-breakpoint
CREATE TABLE `voice_pack_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`credit` text NOT NULL,
	`drive_folder_url` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `voice_pack_submissions_hero_idx` ON `voice_pack_submissions` (`hero_id`);--> statement-breakpoint
CREATE INDEX `voice_pack_submissions_author_idx` ON `voice_pack_submissions` (`author_id`);