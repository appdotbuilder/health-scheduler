
import { db } from '../db';
import { staffGroupsTable } from '../db/schema';
import { type StaffGroup } from '../schema';

export const getStaffGroups = async (): Promise<StaffGroup[]> => {
  try {
    const results = await db.select()
      .from(staffGroupsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch staff groups:', error);
    throw error;
  }
};
