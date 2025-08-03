
import { db } from '../db';
import { schedulesTable, scheduleAssignmentsTable } from '../db/schema';
import { type Schedule, type GetSchedulesByUserInput } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export async function getSchedules(input?: GetSchedulesByUserInput): Promise<Schedule[]> {
  try {
    if (input?.user_id !== undefined) {
      // When filtering by user, join with assignments
      const conditions: SQL<unknown>[] = [
        eq(scheduleAssignmentsTable.user_id, input.user_id)
      ];

      // Add status filter if provided
      if (input.status !== undefined) {
        conditions.push(eq(schedulesTable.status, input.status));
      }

      const results = await db.select({
        id: schedulesTable.id,
        name: schedulesTable.name,
        start_date: schedulesTable.start_date,
        end_date: schedulesTable.end_date,
        status: schedulesTable.status,
        created_by_user_id: schedulesTable.created_by_user_id,
        published_at: schedulesTable.published_at,
        created_at: schedulesTable.created_at,
        updated_at: schedulesTable.updated_at,
      }).from(schedulesTable)
      .innerJoin(scheduleAssignmentsTable, eq(schedulesTable.id, scheduleAssignmentsTable.schedule_id))
      .where(and(...conditions))
      .execute();

      // Remove duplicates and convert date strings to Date objects
      const uniqueSchedules = results.reduce((acc: Schedule[], schedule: any) => {
        const existing = acc.find((s: Schedule) => s.id === schedule.id);
        if (!existing) {
          acc.push({
            ...schedule,
            start_date: new Date(schedule.start_date),
            end_date: new Date(schedule.end_date)
          });
        }
        return acc;
      }, []);

      return uniqueSchedules;
    } else {
      // When not filtering by user, query schedules directly
      const conditions: SQL<unknown>[] = [];

      // Add status filter if provided
      if (input?.status !== undefined) {
        conditions.push(eq(schedulesTable.status, input.status));
      }

      let results: any[];
      if (conditions.length > 0) {
        results = await db.select().from(schedulesTable).where(and(...conditions)).execute();
      } else {
        results = await db.select().from(schedulesTable).execute();
      }

      // Convert date strings to Date objects
      return results.map(schedule => ({
        ...schedule,
        start_date: new Date(schedule.start_date),
        end_date: new Date(schedule.end_date)
      }));
    }
  } catch (error) {
    console.error('Get schedules failed:', error);
    throw error;
  }
}
