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
CREATE INDEX `audit_subject_idx` ON `audit_events` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE TABLE `heroes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`voice_directory` text NOT NULL,
	`voice_prefix` text NOT NULL,
	`scope` text DEFAULT 'base' NOT NULL,
	`build_id` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lines` (
	`id` text PRIMARY KEY NOT NULL,
	`hero_id` text NOT NULL,
	`asset_path` text NOT NULL,
	`category` text NOT NULL,
	`placeholder_text` text NOT NULL,
	`translation_status` text DEFAULT 'placeholder' NOT NULL,
	`audio_status` text DEFAULT 'missing' NOT NULL,
	`release_status` text DEFAULT 'missing' NOT NULL,
	`inventory_state` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`hero_id`) REFERENCES `heroes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lines_asset_path_unique` ON `lines` (`asset_path`);--> statement-breakpoint
CREATE INDEX `lines_hero_idx` ON `lines` (`hero_id`);--> statement-breakpoint
CREATE INDEX `lines_category_idx` ON `lines` (`category`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`line_id` text NOT NULL,
	`author_id` text NOT NULL,
	`kind` text NOT NULL,
	`text` text,
	`translation_proposal_id` text,
	`audio_object_key` text,
	`audio_duration_ms` integer,
	`audio_sample_rate` integer,
	`credit` text,
	`license` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`opened_at` text,
	`decided_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `proposals_line_idx` ON `proposals` (`line_id`);--> statement-breakpoint
CREATE INDEX `proposals_status_idx` ON `proposals` (`status`);--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`build_id` text NOT NULL,
	`download_url` text NOT NULL,
	`manifest_url` text NOT NULL,
	`sha256` text NOT NULL,
	`signature` text NOT NULL,
	`reviewed_lines` integer NOT NULL,
	`total_lines` integer NOT NULL,
	`published_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_version_unique` ON `releases` (`version`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`kind` text NOT NULL,
	`decision` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_unique_kind` ON `reviews` (`proposal_id`,`kind`);--> statement-breakpoint
CREATE TABLE `roles` (
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`granted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `role`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`verified` integer DEFAULT false NOT NULL,
	`discord_created_at` text NOT NULL,
	`blocked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);--> statement-breakpoint
CREATE TABLE `votes` (
	`proposal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`proposal_id`, `user_id`),
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
