import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

export const userRoleEnum = pgEnum('user_role', ['member', 'instructor', 'admin']);
export const groupMemberRoleEnum = pgEnum('group_member_role', ['admin', 'member']);
export const eventTypeEnum = pgEnum('event_type', ['regular', 'special']);
export const eventAttendanceStatusEnum = pgEnum('event_attendance_status', [
  'attending',
  'not_attending',
  'maybe',
]);
export const classStatusEnum = pgEnum('class_status', ['pending', 'approved', 'rejected']);
export const feeTypeEnum = pgEnum('fee_type', ['free', 'paid']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'paid']);
export const bannerTypeEnum = pgEnum('banner_type', ['promo', 'app_intro']);
export const pointTypeEnum = pgEnum('point_type', ['signup_bonus', 'referral', 'grant', 'use', 'donate']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected']);

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 255 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    profileImageUrl: text('profile_image_url'),
    referralCode: varchar('referral_code', { length: 255 }),
    role: userRoleEnum('role').default('member').notNull(),
    agreedTermsAt: timestamp('agreed_terms_at', { withTimezone: true }),
    nickname: varchar('nickname', { length: 255 }),
    bio: varchar('bio', { length: 40 }),
    mbti: varchar('mbti', { length: 4 }),
    profileLocation: varchar('profile_location', { length: 255 }),
    gender: varchar('gender', { length: 1 }),
    birthdate: varchar('birthdate', { length: 20 }),
    interests: text('interests').array(),
    showGroups: boolean('show_groups').default(true).notNull(),
    createdAt,
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_referral_code_unique').on(table.referralCode),
  ],
);

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 255 }),
  location: varchar('location', { length: 255 }),
  imageUrl: text('image_url'),
  maxMembers: integer('max_members').default(50).notNull(),
  creatorId: varchar('creator_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt,
});

export const groupMembers = pgTable(
  'group_members',
  {
    id: serial('id').primaryKey(),
    groupId: integer('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: groupMemberRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('group_members_group_user_unique').on(table.groupId, table.userId)],
);

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  location: varchar('location', { length: 255 }),
  eventType: eventTypeEnum('event_type').default('regular').notNull(),
  cost: varchar('cost', { length: 100 }),
  imageUrl: text('image_url'),
  creatorId: varchar('creator_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt,
});

export const eventAttendees = pgTable(
  'event_attendees',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: eventAttendanceStatusEnum('status').default('attending').notNull(),
    createdAt,
  },
  (table) => [uniqueIndex('event_attendees_event_user_unique').on(table.eventId, table.userId)],
);

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  curriculum: text('curriculum'),
  schedule: text('schedule'),
  location: varchar('location', { length: 255 }),
  category: varchar('category', { length: 255 }),
  imageUrl: text('image_url'),
  price: varchar('price', { length: 100 }).default('무료').notNull(),
  maxStudents: integer('max_students').default(30).notNull(),
  instructorId: varchar('instructor_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: classStatusEnum('status').default('pending').notNull(),
  feeType: feeTypeEnum('fee_type').default('free').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
  adminNote: text('admin_note'),
  createdAt,
});

export const classEnrollments = pgTable(
  'class_enrollments',
  {
    id: serial('id').primaryKey(),
    classId: integer('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('class_enrollments_class_user_unique').on(table.classId, table.userId)],
);

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  videoUrl: text('video_url'),
  description: text('description'),
  type: bannerTypeEnum('type').default('promo').notNull(),
  requesterId: varchar('requester_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt,
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt,
});

export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    addedBy: varchar('added_by', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt,
  },
  (table) => [uniqueIndex('admins_email_unique').on(table.email)],
);

export const points = pgTable('points', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: pointTypeEnum('type').notNull(),
  description: text('description'),
  createdAt,
});

export const referrals = pgTable(
  'referrals',
  {
    id: serial('id').primaryKey(),
    referrerId: varchar('referrer_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredUserId: varchar('referred_user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt,
  },
  (table) => [uniqueIndex('referrals_referrer_referred_unique').on(table.referrerId, table.referredUserId)],
);

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: varchar('owner_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt,
});

export const storeTransactions = pgTable('store_transactions', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  token: varchar('token', { length: 255 }),
  createdAt,
});

export const boardPosts = pgTable('board_posts', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt,
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const boardComments = pgTable('board_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => boardPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt,
});

export const boardPostLikes = pgTable(
  'board_post_likes',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => boardPosts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const groupMessages = pgTable('group_messages', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  gifUrl: text('gif_url'),
  createdAt,
});

export const directMessages = pgTable('direct_messages', {
  id: serial('id').primaryKey(),
  senderId: varchar('sender_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  receiverId: varchar('receiver_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt,
});

export const classMessages = pgTable('class_messages', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt,
});

export const classBoardPosts = pgTable('class_board_posts', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt,
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const classBoardComments = pgTable('class_board_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => classBoardPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt,
});

export const classBoardPostLikes = pgTable(
  'class_board_post_likes',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => classBoardPosts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const classReviews = pgTable(
  'class_reviews',
  {
    id: serial('id').primaryKey(),
    classId: integer('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    authorId: varchar('author_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    rating: integer('rating').notNull(),
    createdAt,
  },
  (table) => [check('class_reviews_rating_check', sql`${table.rating} between 1 and 5`)],
);

export const groupPhotos = pgTable('group_photos', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  uploaderId: varchar('uploader_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  createdAt,
});

export const siteContent = pgTable('site_content', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adRequests = pgTable('ad_requests', {
  id: serial('id').primaryKey(),
  requesterId: varchar('requester_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: requestStatusEnum('status').default('pending').notNull(),
  createdAt,
});

export const instructorApplications = pgTable('instructor_applications', {
  id: serial('id').primaryKey(),
  applicantId: varchar('applicant_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: requestStatusEnum('status').default('pending').notNull(),
  createdAt,
});

export const leaderPosts = pgTable('leader_posts', {
  id: serial('id').primaryKey(),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt,
});

export const leaderComments = pgTable('leader_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => leaderPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt,
});
