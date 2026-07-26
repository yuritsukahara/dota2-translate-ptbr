CREATE TABLE `voice_pack_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`credit` text NOT NULL,
	`drive_folder_url` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`decided_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `voice_pack_submissions_hero_idx` ON `voice_pack_submissions` (`hero_id`);--> statement-breakpoint
CREATE INDEX `voice_pack_submissions_author_idx` ON `voice_pack_submissions` (`author_id`);--> statement-breakpoint
CREATE INDEX `voice_pack_submissions_status_idx` ON `voice_pack_submissions` (`status`);