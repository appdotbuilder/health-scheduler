
import { db } from '../db';
import { scheduleAssignmentsTable, staffCompetenciesTable, schedulesTable, usersTable, rolesTable } from '../db/schema';
import { type CreateScheduleAssignmentInput, type ScheduleAssignment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createScheduleAssignment = async (input: CreateScheduleAssignmentInput): Promise<ScheduleAssignment> => {
  try {
    // Validate that the schedule exists
    const scheduleExists = await db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, input.schedule_id))
      .execute();

    if (scheduleExists.length === 0) {
      throw new Error('Schedule not found');
    }

    // Validate that the user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Validate that the role exists
    const roleExists = await db.select()
      .from(rolesTable)
      .where(eq(rolesTable.id, input.role_id))
      .execute();

    if (roleExists.length === 0) {
      throw new Error('Role not found');
    }

    // Validate staff competency - user must have competency for the assigned role
    const competency = await db.select()
      .from(staffCompetenciesTable)
      .where(
        and(
          eq(staffCompetenciesTable.user_id, input.user_id),
          eq(staffCompetenciesTable.role_id, input.role_id)
        )
      )
      .execute();

    if (competency.length === 0) {
      throw new Error('User lacks competency for the assigned role');
    }

    // Convert date to string for database query
    const shiftDateString = input.shift_date.toISOString().split('T')[0];

    // Check for conflicting assignments on the same date
    const conflictingAssignments = await db.select()
      .from(scheduleAssignmentsTable)
      .where(
        and(
          eq(scheduleAssignmentsTable.user_id, input.user_id),
          eq(scheduleAssignmentsTable.shift_date, shiftDateString)
        )
      )
      .execute();

    if (conflictingAssignments.length > 0) {
      throw new Error('User already has an assignment on this date');
    }

    // Insert the schedule assignment
    const result = await db.insert(scheduleAssignmentsTable)
      .values({
        schedule_id: input.schedule_id,
        user_id: input.user_id,
        role_id: input.role_id,
        shift_date: shiftDateString,
        shift_type: input.shift_type,
        start_time: input.start_time,
        end_time: input.end_time
      })
      .returning()
      .execute();

    // Convert string date back to Date object and normalize time format for return
    const assignment = result[0];
    return {
      ...assignment,
      shift_date: new Date(assignment.shift_date),
      start_time: assignment.start_time.substring(0, 5), // Convert "09:00:00" to "09:00"
      end_time: assignment.end_time.substring(0, 5) // Convert "17:00:00" to "17:00"
    };
  } catch (error) {
    console.error('Schedule assignment creation failed:', error);
    throw error;
  }
};
