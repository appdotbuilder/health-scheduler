
import { db } from '../db';
import { staffCompetenciesTable } from '../db/schema';
import { type StaffCompetency } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStaffCompetencies(userId?: number): Promise<StaffCompetency[]> {
  try {
    // Use separate query paths to avoid TypeScript issues
    const results = userId !== undefined
      ? await db.select().from(staffCompetenciesTable).where(eq(staffCompetenciesTable.user_id, userId)).execute()
      : await db.select().from(staffCompetenciesTable).execute();

    return results.map(competency => ({
      ...competency,
      // Convert date strings to Date objects
      certified_date: competency.certified_date ? new Date(competency.certified_date) : null,
      expiry_date: competency.expiry_date ? new Date(competency.expiry_date) : null,
      // created_at is already a Date object from timestamp column
      created_at: competency.created_at
    }));
  } catch (error) {
    console.error('Get staff competencies failed:', error);
    throw error;
  }
}
