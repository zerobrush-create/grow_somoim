import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const uploads = pgTable('uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull(),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
