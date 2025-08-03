
import { db } from '../db';
import { staffPreferencesTable, usersTable, schedulesTable, rolesTable } from '../db/schema';
import { type CreateStaffPreferenceInput, type StaffPreference } from '../schema';
import { eq } from 'drizzle-orm';

export const createStaffPreference = async (input: CreateStaffPreferenceInput, userId: number): Promise<StaffPreference> => {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify schedule exists
    const schedules = await db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, input.schedule_id))
      .execute();

    if (schedules.length === 0) {
      throw new Error('Schedule not found');
    }

    // Verify role exists if provided
    if (input.role_id) {
      const roles = await db.select()
        .from(rolesTable)
        .where(eq(rolesTable.id, input.role_id))
        .execute();

      if (roles.length === 0) {
        throw new Error('Role not found');
      }
    }

    // Convert Date to string for date column
    const preferredDateString = input.preferred_date.toISOString().split('T')[0];

    // Insert staff preference record
    const result = await db.insert(staffPreferencesTable)
      .values({
        user_id: userId,
        schedule_id: input.schedule_id,
        preferred_date: preferredDateString,
        role_id: input.role_id || null,
        shift_type: input.shift_type || null,
        preference_type: input.preference_type,
        priority: input.priority || 3,
        status: 'draft',
        notes: input.notes || null,
        submitted_at: null
      })
      .returning()
      .execute();

    // Convert string date back to Date object for return
    const preference = result[0];
    return {
      ...preference,
      preferred_date: new Date(preference.preferred_date)
    };
  } catch (error) {
    console.error('Staff preference creation failed:', error);
    throw error;
  }
};
