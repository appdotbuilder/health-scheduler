
import { db } from '../db';
import { staffCompetenciesTable, usersTable, rolesTable } from '../db/schema';
import { type CreateStaffCompetencyInput, type StaffCompetency } from '../schema';
import { eq } from 'drizzle-orm';

export const createStaffCompetency = async (input: CreateStaffCompetencyInput): Promise<StaffCompetency> => {
  try {
    // Verify user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify role exists
    const roleExists = await db.select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.id, input.role_id))
      .limit(1)
      .execute();

    if (roleExists.length === 0) {
      throw new Error(`Role with id ${input.role_id} not found`);
    }

    // Insert staff competency record
    const result = await db.insert(staffCompetenciesTable)
      .values({
        user_id: input.user_id,
        role_id: input.role_id,
        proficiency_level: input.proficiency_level,
        certified_date: input.certified_date ? input.certified_date.toISOString().split('T')[0] : null,
        expiry_date: input.expiry_date ? input.expiry_date.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();

    const competency = result[0];
    return {
      ...competency,
      certified_date: competency.certified_date ? new Date(competency.certified_date) : null,
      expiry_date: competency.expiry_date ? new Date(competency.expiry_date) : null
    };
  } catch (error) {
    console.error('Staff competency creation failed:', error);
    throw error;
  }
};
