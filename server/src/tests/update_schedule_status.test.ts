
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { schedulesTable, usersTable } from '../db/schema';
import { type UpdateScheduleStatusInput } from '../schema';
import { updateScheduleStatus } from '../handlers/update_schedule_status';
import { eq } from 'drizzle-orm';

describe('updateScheduleStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update schedule status from draft to published', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const createdUser = userResult[0];

    // Create a test schedule
    const scheduleResult = await db.insert(schedulesTable)
      .values({
        name: 'Test Schedule',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        status: 'draft',
        created_by_user_id: createdUser.id
      })
      .returning()
      .execute();

    const createdSchedule = scheduleResult[0];

    const input: UpdateScheduleStatusInput = {
      id: createdSchedule.id,
      status: 'published'
    };

    const result = await updateScheduleStatus(input);

    // Verify the result
    expect(result.id).toEqual(createdSchedule.id);
    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.name).toEqual('Test Schedule');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
  });

  it('should update schedule from published back to draft', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const createdUser = userResult[0];

    // Create a test schedule that's already published
    const scheduleResult = await db.insert(schedulesTable)
      .values({
        name: 'Published Schedule',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        status: 'published',
        created_by_user_id: createdUser.id,
        published_at: new Date()
      })
      .returning()
      .execute();

    const createdSchedule = scheduleResult[0];

    const input: UpdateScheduleStatusInput = {
      id: createdSchedule.id,
      status: 'draft'
    };

    const result = await updateScheduleStatus(input);

    // Verify the result
    expect(result.id).toEqual(createdSchedule.id);
    expect(result.status).toEqual('draft');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.name).toEqual('Published Schedule');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    // published_at should remain as it was (not reset when going back to draft)
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const createdUser = userResult[0];

    // Create a test schedule
    const scheduleResult = await db.insert(schedulesTable)
      .values({
        name: 'Test Schedule',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        status: 'draft',
        created_by_user_id: createdUser.id
      })
      .returning()
      .execute();

    const createdSchedule = scheduleResult[0];

    const input: UpdateScheduleStatusInput = {
      id: createdSchedule.id,
      status: 'published'
    };

    await updateScheduleStatus(input);

    // Query the database to verify the update was persisted
    const updatedSchedules = await db.select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, createdSchedule.id))
      .execute();

    expect(updatedSchedules).toHaveLength(1);
    const updatedSchedule = updatedSchedules[0];
    expect(updatedSchedule.status).toEqual('published');
    expect(updatedSchedule.published_at).toBeInstanceOf(Date);
    expect(updatedSchedule.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent schedule', async () => {
    const input: UpdateScheduleStatusInput = {
      id: 999999, // Non-existent ID
      status: 'published'
    };

    await expect(updateScheduleStatus(input)).rejects.toThrow(/Schedule with id 999999 not found/i);
  });
});
