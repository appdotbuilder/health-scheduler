
import { db } from '../db';
import { usersTable, userStaffGroupsTable, userRoleGroupsTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password (simple hash for demo - in production use bcrypt)
    const password_hash = `hashed_${input.password}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        first_name: input.first_name,
        last_name: input.last_name,
        user_type: input.user_type
      })
      .returning()
      .execute();

    const user = result[0];

    // Create staff group association if provided
    if (input.staff_group_id) {
      await db.insert(userStaffGroupsTable)
        .values({
          user_id: user.id,
          staff_group_id: input.staff_group_id
        })
        .execute();
    }

    // Create role group association if provided
    if (input.role_group_id) {
      await db.insert(userRoleGroupsTable)
        .values({
          user_id: user.id,
          role_group_id: input.role_group_id
        })
        .execute();
    }

    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
