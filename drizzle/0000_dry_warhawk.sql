CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`state` text NOT NULL,
	`version` integer NOT NULL,
	`last_action` text,
	`status` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_owner_updated` ON `games` (`owner`,`updated_at`);--> statement-breakpoint
CREATE TABLE `saves` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_saves_owner_created` ON `saves` (`owner`,`created_at`);