
import { db } from '../db';
import { rolesTable } from '../db/schema';
import { type CreateRoleInput, type Role } from '../schema';

export const createRole = async (input: CreateRoleInput): Promise<Role> => {
  try {
    // Insert role record
    const result = await db.insert(rolesTable)
      .values({
        name: input.name,
        description: input.description || null,
        role_group_id: input.role_group_id || null
      })
      .returning()
      .execute();

    const role = result[0];
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      created_at: role.created_at
    };
  } catch (error) {
    console.error('Role creation failed:', error);
    throw error;
  }
};
