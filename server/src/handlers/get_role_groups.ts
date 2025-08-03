
import { db } from '../db';
import { roleGroupsTable } from '../db/schema';
import { type RoleGroup } from '../schema';

export const getRoleGroups = async (): Promise<RoleGroup[]> => {
  try {
    const results = await db.select()
      .from(roleGroupsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch role groups:', error);
    throw error;
  }
};
