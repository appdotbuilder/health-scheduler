
import { db } from '../db';
import { rolesTable } from '../db/schema';
import { type Role } from '../schema';

export const getRoles = async (): Promise<Role[]> => {
  try {
    const results = await db.select()
      .from(rolesTable)
      .execute();

    return results.map(role => ({
      ...role,
      created_at: role.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    throw error;
  }
};
