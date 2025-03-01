import type { password } from 'bun'
import {boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core'
import { timestamp } from 'drizzle-orm/pg-core'

export const postsTable = pgTable('posts', {
 id: integer().primaryKey().generatedAlwaysAsIdentity(),
 text: varchar({ length: 255 }).notNull(),
 sentiment: varchar({ length: 80 }),
 correction: varchar({ length: 255 }),
 userId: integer()
    .notNull()
    .references(()=>usersTable.id,{onDelete: 'cascade'}),   
 createdAt: timestamp('created_at').defaultNow().notNull()  // 🕒 Zeitstempel hinzufügen
    
})

export const usersTable = pgTable('users', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    isAdmin: boolean('is_admin').notNull().default(false),
})
