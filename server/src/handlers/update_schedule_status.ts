
import { db } from '../db';
import { schedulesTable } from '../db/schema';
import { type UpdateScheduleStatusInput, type Schedule } from '../schema';
import { eq } from 'drizzle-orm';

export const updateScheduleStatus = async (input: UpdateScheduleStatusInput): Promise<Schedule> => {
  try {
    const updateData: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Set published_at timestamp when publishing
    if (input.status === 'published') {
      updateData.published_at = new Date();
    }

    // Update the schedule record
    const result = await db.update(schedulesTable)
      .set(updateData)
      .where(eq(schedulesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Schedule with id ${input.id} not found`);
    }

    const schedule = result[0];
    
    // Convert date strings to Date objects to match Schedule type
    return {
      ...schedule,
      start_date: new Date(schedule.start_date),
      end_date: new Date(schedule.end_date)
    };
  } catch (error) {
    console.error('Schedule status update failed:', error);
    throw error;
  }
};
