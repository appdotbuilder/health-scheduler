
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, date, time } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userTypeEnum = pgEnum('user_type', ['admin', 'staff']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['draft', 'published']);
export const preferenceStatusEnum = pgEnum('preference_status', ['draft', 'submitted']);
export const shiftTypeEnum = pgEnum('shift_type', ['regular', 'on_call']);
export const preferenceTypeEnum = pgEnum('preference_type', ['available', 'unavailable', 'preferred']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  user_type: userTypeEnum('user_type').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Role Groups table (e.g., Radiologists)
export const roleGroupsTable = pgTable('role_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Roles table (e.g., MRI, CT, On-Call)
export const rolesTable = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  role_group_id: integer('role_group_id').references(() => roleGroupsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Staff Groups table (e.g., Doctors, Nurses)
export const staffGroupsTable = pgTable('staff_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  max_consecutive_days: integer('max_consecutive_days'),
  requires_day_off_after_oncall: boolean('requires_day_off_after_oncall').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User Staff Group mapping
export const userStaffGroupsTable = pgTable('user_staff_groups', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  staff_group_id: integer('staff_group_id').references(() => staffGroupsTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User Role Group mapping
export const userRoleGroupsTable = pgTable('user_role_groups', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  role_group_id: integer('role_group_id').references(() => roleGroupsTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Staff Competencies table
export const staffCompetenciesTable = pgTable('staff_competencies', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  role_id: integer('role_id').references(() => rolesTable.id).notNull(),
  proficiency_level: integer('proficiency_level').notNull(),
  certified_date: date('certified_date'),
  expiry_date: date('expiry_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Schedules table
export const schedulesTable = pgTable('schedules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  status: scheduleStatusEnum('status').notNull().default('draft'),
  created_by_user_id: integer('created_by_user_id').references(() => usersTable.id).notNull(),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Schedule Assignments table
export const scheduleAssignmentsTable = pgTable('schedule_assignments', {
  id: serial('id').primaryKey(),
  schedule_id: integer('schedule_id').references(() => schedulesTable.id).notNull(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  role_id: integer('role_id').references(() => rolesTable.id).notNull(),
  shift_date: date('shift_date').notNull(),
  shift_type: shiftTypeEnum('shift_type').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Staff Preferences table
export const staffPreferencesTable = pgTable('staff_preferences', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  schedule_id: integer('schedule_id').references(() => schedulesTable.id).notNull(),
  preferred_date: date('preferred_date').notNull(),
  role_id: integer('role_id').references(() => rolesTable.id),
  shift_type: shiftTypeEnum('shift_type'),
  preference_type: preferenceTypeEnum('preference_type').notNull(),
  priority: integer('priority').notNull().default(3),
  status: preferenceStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  submitted_at: timestamp('submitted_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  staffCompetencies: many(staffCompetenciesTable),
  scheduleAssignments: many(scheduleAssignmentsTable),
  staffPreferences: many(staffPreferencesTable),
  userStaffGroups: many(userStaffGroupsTable),
  userRoleGroups: many(userRoleGroupsTable),
  createdSchedules: many(schedulesTable),
}));

export const roleGroupsRelations = relations(roleGroupsTable, ({ many }) => ({
  roles: many(rolesTable),
  userRoleGroups: many(userRoleGroupsTable),
}));

export const rolesRelations = relations(rolesTable, ({ one, many }) => ({
  roleGroup: one(roleGroupsTable, {
    fields: [rolesTable.role_group_id],
    references: [roleGroupsTable.id],
  }),
  staffCompetencies: many(staffCompetenciesTable),
  scheduleAssignments: many(scheduleAssignmentsTable),
  staffPreferences: many(staffPreferencesTable),
}));

export const staffGroupsRelations = relations(staffGroupsTable, ({ many }) => ({
  userStaffGroups: many(userStaffGroupsTable),
}));

export const userStaffGroupsRelations = relations(userStaffGroupsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userStaffGroupsTable.user_id],
    references: [usersTable.id],
  }),
  staffGroup: one(staffGroupsTable, {
    fields: [userStaffGroupsTable.staff_group_id],
    references: [staffGroupsTable.id],
  }),
}));

export const userRoleGroupsRelations = relations(userRoleGroupsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userRoleGroupsTable.user_id],
    references: [usersTable.id],
  }),
  roleGroup: one(roleGroupsTable, {
    fields: [userRoleGroupsTable.role_group_id],
    references: [roleGroupsTable.id],
  }),
}));

export const staffCompetenciesRelations = relations(staffCompetenciesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [staffCompetenciesTable.user_id],
    references: [usersTable.id],
  }),
  role: one(rolesTable, {
    fields: [staffCompetenciesTable.role_id],
    references: [rolesTable.id],
  }),
}));

export const schedulesRelations = relations(schedulesTable, ({ one, many }) => ({
  createdBy: one(usersTable, {
    fields: [schedulesTable.created_by_user_id],
    references: [usersTable.id],
  }),
  assignments: many(scheduleAssignmentsTable),
  preferences: many(staffPreferencesTable),
}));

export const scheduleAssignmentsRelations = relations(scheduleAssignmentsTable, ({ one }) => ({
  schedule: one(schedulesTable, {
    fields: [scheduleAssignmentsTable.schedule_id],
    references: [schedulesTable.id],
  }),
  user: one(usersTable, {
    fields: [scheduleAssignmentsTable.user_id],
    references: [usersTable.id],
  }),
  role: one(rolesTable, {
    fields: [scheduleAssignmentsTable.role_id],
    references: [rolesTable.id],
  }),
}));

export const staffPreferencesRelations = relations(staffPreferencesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [staffPreferencesTable.user_id],
    references: [usersTable.id],
  }),
  schedule: one(schedulesTable, {
    fields: [staffPreferencesTable.schedule_id],
    references: [schedulesTable.id],
  }),
  role: one(rolesTable, {
    fields: [staffPreferencesTable.role_id],
    references: [rolesTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  roleGroups: roleGroupsTable,
  roles: rolesTable,
  staffGroups: staffGroupsTable,
  userStaffGroups: userStaffGroupsTable,
  userRoleGroups: userRoleGroupsTable,
  staffCompetencies: staffCompetenciesTable,
  schedules: schedulesTable,
  scheduleAssignments: scheduleAssignmentsTable,
  staffPreferences: staffPreferencesTable,
};
