
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { schedulesTable, usersTable } from '../db/schema';
import { type CreateScheduleInput } from '../schema';
import { createSchedule } from '../handlers/create_schedule';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateScheduleInput = {
  name: 'Test Schedule',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('createSchedule', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user to be the schedule creator
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'admin'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a schedule with draft status', async () => {
    const result = await createSchedule(testInput, testUserId);

    // Basic field validation
    expect(result.name).toEqual('Test Schedule');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-01-31'));
    expect(result.status).toEqual('draft');
    expect(result.created_by_user_id).toEqual(testUserId);
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save schedule to database', async () => {
    const result = await createSchedule(testInput, testUserId);

    // Query using proper drizzle syntax
    const schedules = await db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].name).toEqual('Test Schedule');
    expect(new Date(schedules[0].start_date)).toEqual(new Date('2024-01-01'));
    expect(new Date(schedules[0].end_date)).toEqual(new Date('2024-01-31'));
    expect(schedules[0].status).toEqual('draft');
    expect(schedules[0].created_by_user_id).toEqual(testUserId);
    expect(schedules[0].published_at).toBeNull();
    expect(schedules[0].created_at).toBeInstanceOf(Date);
    expect(schedules[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple schedules with different names', async () => {
    const schedule1 = await createSchedule({
      ...testInput,
      name: 'January Schedule'
    }, testUserId);

    const schedule2 = await createSchedule({
      ...testInput,
      name: 'February Schedule',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-29')
    }, testUserId);

    expect(schedule1.name).toEqual('January Schedule');
    expect(schedule2.name).toEqual('February Schedule');
    expect(schedule1.id).not.toEqual(schedule2.id);

    // Verify both are in database
    const allSchedules = await db.select()
      .from(schedulesTable)
      .execute();

    expect(allSchedules).toHaveLength(2);
  });
});
