
import { db } from '../db';
import { schedulesTable } from '../db/schema';
import { type CreateScheduleInput, type Schedule } from '../schema';

export async function createSchedule(input: CreateScheduleInput, createdByUserId: number): Promise<Schedule> {
  try {
    // Insert schedule record
    const result = await db.insert(schedulesTable)
      .values({
        name: input.name,
        start_date: input.start_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        end_date: input.end_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        status: 'draft',
        created_by_user_id: createdByUserId
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects
    const schedule = result[0];
    return {
      ...schedule,
      start_date: new Date(schedule.start_date),
      end_date: new Date(schedule.end_date)
    };
  } catch (error) {
    console.error('Schedule creation failed:', error);
    throw error;
  }
}
