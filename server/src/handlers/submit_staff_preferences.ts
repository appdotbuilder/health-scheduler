
import { db } from '../db';
import { staffPreferencesTable } from '../db/schema';
import { type SubmitStaffPreferencesInput, type StaffPreference } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function submitStaffPreferences(input: SubmitStaffPreferencesInput, userId: number): Promise<StaffPreference[]> {
  try {
    // First, verify all preferences belong to the requesting user and are in draft status
    const existingPreferences = await db.select()
      .from(staffPreferencesTable)
      .where(
        and(
          inArray(staffPreferencesTable.id, input.preference_ids),
          eq(staffPreferencesTable.user_id, userId),
          eq(staffPreferencesTable.status, 'draft')
        )
      )
      .execute();

    // Check if all requested preferences were found and belong to the user
    if (existingPreferences.length !== input.preference_ids.length) {
      throw new Error('Some preferences not found, do not belong to user, or are not in draft status');
    }

    // Update preferences to submitted status with timestamp
    const result = await db.update(staffPreferencesTable)
      .set({
        status: 'submitted',
        submitted_at: new Date(),
        updated_at: new Date()
      })
      .where(
        and(
          inArray(staffPreferencesTable.id, input.preference_ids),
          eq(staffPreferencesTable.user_id, userId)
        )
      )
      .returning()
      .execute();

    // Convert date strings to Date objects for preferred_date
    return result.map(preference => ({
      ...preference,
      preferred_date: new Date(preference.preferred_date)
    }));
  } catch (error) {
    console.error('Staff preferences submission failed:', error);
    throw error;
  }
}
