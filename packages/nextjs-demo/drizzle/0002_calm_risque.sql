PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_component_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_component_entries`("id", "page_id", "data", "created_at") SELECT "id", "page_id", "data", "created_at" FROM `component_entries`;--> statement-breakpoint
DROP TABLE `component_entries`;--> statement-breakpoint
ALTER TABLE `__new_component_entries` RENAME TO `component_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `component_entries_page_created` ON `component_entries` (`page_id`,`created_at`);--> statement-breakpoint
DROP INDEX `pages_slug_unique`;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `icon`;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `position`;