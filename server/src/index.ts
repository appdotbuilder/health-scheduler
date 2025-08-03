
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createRoleInputSchema,
  createRoleGroupInputSchema,
  createStaffGroupInputSchema,
  createStaffCompetencyInputSchema,
  createScheduleInputSchema,
  createScheduleAssignmentInputSchema,
  createStaffPreferenceInputSchema,
  updateScheduleStatusInputSchema,
  submitStaffPreferencesInputSchema,
  getSchedulesByUserInputSchema,
  getStaffPreferencesInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createRole } from './handlers/create_role';
import { getRoles } from './handlers/get_roles';
import { createRoleGroup } from './handlers/create_role_group';
import { getRoleGroups } from './handlers/get_role_groups';
import { createStaffGroup } from './handlers/create_staff_group';
import { getStaffGroups } from './handlers/get_staff_groups';
import { createStaffCompetency } from './handlers/create_staff_competency';
import { getStaffCompetencies } from './handlers/get_staff_competencies';
import { createSchedule } from './handlers/create_schedule';
import { getSchedules } from './handlers/get_schedules';
import { updateScheduleStatus } from './handlers/update_schedule_status';
import { createScheduleAssignment } from './handlers/create_schedule_assignment';
import { getScheduleAssignments } from './handlers/get_schedule_assignments';
import { createStaffPreference } from './handlers/create_staff_preference';
import { getStaffPreferences } from './handlers/get_staff_preferences';
import { submitStaffPreferences } from './handlers/submit_staff_preferences';
import { seedDatabase } from './handlers/seed_database';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Additional input schemas for procedures that need them
const getStaffCompetenciesInputSchema = z.object({
  userId: z.number().optional()
});

const getScheduleAssignmentsInputSchema = z.object({
  scheduleId: z.number(),
  userId: z.number().optional()
});

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Database seeding (for development/demo purposes)
  seedDatabase: publicProcedure
    .mutation(() => seedDatabase()),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Role management
  createRole: publicProcedure
    .input(createRoleInputSchema)
    .mutation(({ input }) => createRole(input)),
  getRoles: publicProcedure
    .query(() => getRoles()),

  // Role group management
  createRoleGroup: publicProcedure
    .input(createRoleGroupInputSchema)
    .mutation(({ input }) => createRoleGroup(input)),
  getRoleGroups: publicProcedure
    .query(() => getRoleGroups()),

  // Staff group management
  createStaffGroup: publicProcedure
    .input(createStaffGroupInputSchema)
    .mutation(({ input }) => createStaffGroup(input)),
  getStaffGroups: publicProcedure
    .query(() => getStaffGroups()),

  // Staff competency management
  createStaffCompetency: publicProcedure
    .input(createStaffCompetencyInputSchema)
    .mutation(({ input }) => createStaffCompetency(input)),
  getStaffCompetencies: publicProcedure
    .input(getStaffCompetenciesInputSchema.optional())
    .query(({ input }) => getStaffCompetencies(input?.userId)),

  // Schedule management
  createSchedule: publicProcedure
    .input(createScheduleInputSchema)
    .mutation(({ input }) => createSchedule(input, 1)), // TODO: Get actual user ID from context
  getSchedules: publicProcedure
    .input(getSchedulesByUserInputSchema.optional())
    .query(({ input }) => getSchedules(input)),
  updateScheduleStatus: publicProcedure
    .input(updateScheduleStatusInputSchema)
    .mutation(({ input }) => updateScheduleStatus(input)),

  // Schedule assignment management
  createScheduleAssignment: publicProcedure
    .input(createScheduleAssignmentInputSchema)
    .mutation(({ input }) => createScheduleAssignment(input)),
  getScheduleAssignments: publicProcedure
    .input(getScheduleAssignmentsInputSchema)
    .query(({ input }) => getScheduleAssignments(input.scheduleId, input.userId)),

  // Staff preference management
  createStaffPreference: publicProcedure
    .input(createStaffPreferenceInputSchema)
    .mutation(({ input }) => createStaffPreference(input, 1)), // TODO: Get actual user ID from context
  getStaffPreferences: publicProcedure
    .input(getStaffPreferencesInputSchema)
    .query(({ input }) => getStaffPreferences(input)),
  submitStaffPreferences: publicProcedure
    .input(submitStaffPreferencesInputSchema)
    .mutation(({ input }) => submitStaffPreferences(input, 1)), // TODO: Get actual user ID from context
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Healthcare Scheduling TRPC server listening at port: ${port}`);
}

start();
