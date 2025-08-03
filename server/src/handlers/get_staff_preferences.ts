
import { db } from '../db';
import { staffPreferencesTable } from '../db/schema';
import { type GetStaffPreferencesInput, type StaffPreference } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getStaffPreferences(input: GetStaffPreferencesInput): Promise<StaffPreference[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Always filter by schedule_id
    conditions.push(eq(staffPreferencesTable.schedule_id, input.schedule_id));

    // Filter by user_id if provided
    if (input.user_id !== undefined) {
      conditions.push(eq(staffPreferencesTable.user_id, input.user_id));
    }

    // Filter by status if provided
    if (input.status !== undefined) {
      conditions.push(eq(staffPreferencesTable.status, input.status));
    }

    // Build and execute query
    const query = db.select()
      .from(staffPreferencesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));

    const results = await query.execute();

    return results.map(preference => ({
      ...preference,
      preferred_date: new Date(preference.preferred_date),
      submitted_at: preference.submitted_at ? new Date(preference.submitted_at) : null,
      created_at: new Date(preference.created_at),
      updated_at: new Date(preference.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch staff preferences:', error);
    throw error;
  }
}
