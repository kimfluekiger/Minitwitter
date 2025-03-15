import { pgTable, unique, integer, varchar, boolean, foreignKey, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	username: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const posts = pgTable("posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "posts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	text: varchar({ length: 255 }).notNull(),
	sentiment: varchar({ length: 80 }),
	correction: varchar({ length: 255 }),
	userId: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_userId_users_id_fk"
		}).onDelete("cascade"),
]);
