
import { db } from '../db';
import { staffGroupsTable } from '../db/schema';
import { type CreateStaffGroupInput, type StaffGroup } from '../schema';

export const createStaffGroup = async (input: CreateStaffGroupInput): Promise<StaffGroup> => {
  try {
    // Insert staff group record
    const result = await db.insert(staffGroupsTable)
      .values({
        name: input.name,
        description: input.description || null,
        max_consecutive_days: input.max_consecutive_days || null,
        requires_day_off_after_oncall: input.requires_day_off_after_oncall || false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Staff group creation failed:', error);
    throw error;
  }
};
