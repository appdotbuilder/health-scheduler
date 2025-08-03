
import { z } from 'zod';

// Enums
export const userTypeEnum = z.enum(['admin', 'staff']);
export const scheduleStatusEnum = z.enum(['draft', 'published']);
export const preferenceStatusEnum = z.enum(['draft', 'submitted']);
export const shiftTypeEnum = z.enum(['regular', 'on_call']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  user_type: userTypeEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Role schema (e.g., MRI, CT, On-Call)
export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Role = z.infer<typeof roleSchema>;

// Role Group schema (e.g., Radiologists)
export const roleGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type RoleGroup = z.infer<typeof roleGroupSchema>;

// Staff Group schema (e.g., Doctors, Nurses)
export const staffGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  max_consecutive_days: z.number().int().nullable(),
  requires_day_off_after_oncall: z.boolean(),
  created_at: z.coerce.date()
});

export type StaffGroup = z.infer<typeof staffGroupSchema>;

// Staff Competency schema
export const staffCompetencySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  role_id: z.number(),
  proficiency_level: z.number().int().min(1).max(5),
  certified_date: z.coerce.date().nullable(),
  expiry_date: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type StaffCompetency = z.infer<typeof staffCompetencySchema>;

// Schedule schema
export const scheduleSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  status: scheduleStatusEnum,
  created_by_user_id: z.number(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Schedule = z.infer<typeof scheduleSchema>;

// Schedule Assignment schema
export const scheduleAssignmentSchema = z.object({
  id: z.number(),
  schedule_id: z.number(),
  user_id: z.number(),
  role_id: z.number(),
  shift_date: z.coerce.date(),
  shift_type: shiftTypeEnum,
  start_time: z.string(),
  end_time: z.string(),
  created_at: z.coerce.date()
});

export type ScheduleAssignment = z.infer<typeof scheduleAssignmentSchema>;

// Staff Preference schema
export const staffPreferenceSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  schedule_id: z.number(),
  preferred_date: z.coerce.date(),
  role_id: z.number().nullable(),
  shift_type: shiftTypeEnum.nullable(),
  preference_type: z.enum(['available', 'unavailable', 'preferred']),
  priority: z.number().int().min(1).max(5),
  status: preferenceStatusEnum,
  notes: z.string().nullable(),
  submitted_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StaffPreference = z.infer<typeof staffPreferenceSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string(),
  last_name: z.string(),
  user_type: userTypeEnum,
  staff_group_id: z.number().optional(),
  role_group_id: z.number().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createRoleInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  role_group_id: z.number().optional()
});

export type CreateRoleInput = z.infer<typeof createRoleInputSchema>;

export const createRoleGroupInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional()
});

export type CreateRoleGroupInput = z.infer<typeof createRoleGroupInputSchema>;

export const createStaffGroupInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  max_consecutive_days: z.number().int().nullable().optional(),
  requires_day_off_after_oncall: z.boolean().optional()
});

export type CreateStaffGroupInput = z.infer<typeof createStaffGroupInputSchema>;

export const createStaffCompetencyInputSchema = z.object({
  user_id: z.number(),
  role_id: z.number(),
  proficiency_level: z.number().int().min(1).max(5),
  certified_date: z.coerce.date().nullable().optional(),
  expiry_date: z.coerce.date().nullable().optional()
});

export type CreateStaffCompetencyInput = z.infer<typeof createStaffCompetencyInputSchema>;

export const createScheduleInputSchema = z.object({
  name: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type CreateScheduleInput = z.infer<typeof createScheduleInputSchema>;

export const createScheduleAssignmentInputSchema = z.object({
  schedule_id: z.number(),
  user_id: z.number(),
  role_id: z.number(),
  shift_date: z.coerce.date(),
  shift_type: shiftTypeEnum,
  start_time: z.string(),
  end_time: z.string()
});

export type CreateScheduleAssignmentInput = z.infer<typeof createScheduleAssignmentInputSchema>;

export const createStaffPreferenceInputSchema = z.object({
  schedule_id: z.number(),
  preferred_date: z.coerce.date(),
  role_id: z.number().nullable().optional(),
  shift_type: shiftTypeEnum.nullable().optional(),
  preference_type: z.enum(['available', 'unavailable', 'preferred']),
  priority: z.number().int().min(1).max(5).optional(),
  notes: z.string().nullable().optional()
});

export type CreateStaffPreferenceInput = z.infer<typeof createStaffPreferenceInputSchema>;

// Update schemas
export const updateScheduleStatusInputSchema = z.object({
  id: z.number(),
  status: scheduleStatusEnum
});

export type UpdateScheduleStatusInput = z.infer<typeof updateScheduleStatusInputSchema>;

export const submitStaffPreferencesInputSchema = z.object({
  preference_ids: z.array(z.number())
});

export type SubmitStaffPreferencesInput = z.infer<typeof submitStaffPreferencesInputSchema>;

// Query schemas
export const getSchedulesByUserInputSchema = z.object({
  user_id: z.number(),
  status: scheduleStatusEnum.optional()
});

export type GetSchedulesByUserInput = z.infer<typeof getSchedulesByUserInputSchema>;

export const getStaffPreferencesInputSchema = z.object({
  schedule_id: z.number(),
  user_id: z.number().optional(),
  status: preferenceStatusEnum.optional()
});

export type GetStaffPreferencesInput = z.infer<typeof getStaffPreferencesInputSchema>;
