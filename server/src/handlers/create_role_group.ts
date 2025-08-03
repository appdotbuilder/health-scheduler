
import { db } from '../db';
import { roleGroupsTable } from '../db/schema';
import { type CreateRoleGroupInput, type RoleGroup } from '../schema';

export const createRoleGroup = async (input: CreateRoleGroupInput): Promise<RoleGroup> => {
  try {
    // Insert role group record
    const result = await db.insert(roleGroupsTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Role group creation failed:', error);
    throw error;
  }
};
