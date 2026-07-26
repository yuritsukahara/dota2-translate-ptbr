CREATE TABLE `audition_clips` (
	`audition_id` text NOT NULL,
	`line_id` text NOT NULL,
	`position` integer NOT NULL,
	`audio_object_key` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`sample_rate` integer NOT NULL,
	PRIMARY KEY(`audition_id`, `line_id`),
	FOREIGN KEY (`audition_id`) REFERENCES `auditions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audition_clip_position_unique` ON `audition_clips` (`audition_id`,`position`);--> statement-breakpoint
CREATE TABLE `audition_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`audition_id` text NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`hidden_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`audition_id`) REFERENCES `auditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audition_comments_audition_idx` ON `audition_comments` (`audition_id`);--> statement-breakpoint
CREATE TABLE `audition_reactions` (
	`audition_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`audition_id`, `user_id`),
	FOREIGN KEY (`audition_id`) REFERENCES `auditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audition_votes` (
	`audition_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`audition_id`, `user_id`),
	FOREIGN KEY (`audition_id`) REFERENCES `auditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `auditions` (
	`id` text PRIMARY KEY NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`credit` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`opened_at` text,
	`decided_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `auditions_hero_idx` ON `auditions` (`hero_id`);--> statement-breakpoint
CREATE INDEX `auditions_author_idx` ON `auditions` (`author_id`);--> statement-breakpoint
CREATE INDEX `auditions_status_idx` ON `auditions` (`status`);--> statement-breakpoint
CREATE TABLE `voice_pack_clips` (
	`pack_id` text NOT NULL,
	`line_id` text NOT NULL,
	`audio_object_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`pack_id`, `line_id`),
	FOREIGN KEY (`pack_id`) REFERENCES `voice_packs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `voice_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`hero_id` text NOT NULL,
	`author_id` text NOT NULL,
	`audition_id` text NOT NULL,
	`status` text DEFAULT 'recording' NOT NULL,
	`total_lines` integer NOT NULL,
	`submitted_lines` integer DEFAULT 5 NOT NULL,
	`approved_lines` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audition_id`) REFERENCES `auditions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_packs_hero_id_unique` ON `voice_packs` (`hero_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `voice_packs_audition_id_unique` ON `voice_packs` (`audition_id`);--> statement-breakpoint
CREATE INDEX `voice_packs_author_idx` ON `voice_packs` (`author_id`);