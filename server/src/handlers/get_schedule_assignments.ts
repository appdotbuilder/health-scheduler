
import { db } from '../db';
import { scheduleAssignmentsTable } from '../db/schema';
import { type ScheduleAssignment } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getScheduleAssignments(scheduleId: number, userId?: number): Promise<ScheduleAssignment[]> {
  try {
    // Build query conditions
    const conditions = [eq(scheduleAssignmentsTable.schedule_id, scheduleId)];
    
    if (userId !== undefined) {
      conditions.push(eq(scheduleAssignmentsTable.user_id, userId));
    }

    // Execute query with conditions
    const results = await db.select()
      .from(scheduleAssignmentsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert shift_date string to Date object
    return results.map(result => ({
      ...result,
      shift_date: new Date(result.shift_date)
    }));
  } catch (error) {
    console.error('Failed to get schedule assignments:', error);
    throw error;
  }
}
