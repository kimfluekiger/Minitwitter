import type { password } from 'bun'
import {boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core'

export const postsTable = pgTable('posts', {
 id: integer().primaryKey().generatedAlwaysAsIdentity(),
 text: varchar({ length: 255 }).notNull(),
 userId: integer()
    .notNull()
    .references(()=>usersTable.id,{onDelete: 'cascade'}),
})

export const usersTable = pgTable('users', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    isAdmin: boolean('is_admin').notNull().default(false),
})