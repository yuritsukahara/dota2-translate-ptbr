CREATE TABLE `petition_signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`statement_version` text DEFAULT '2026-07-26' NOT NULL,
	`display_publicly` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `petition_signatures_user_id_unique` ON `petition_signatures` (`user_id`);--> statement-breakpoint
CREATE INDEX `petition_signatures_created_idx` ON `petition_signatures` (`created_at`);