
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, schedulesTable, scheduleAssignmentsTable, rolesTable } from '../db/schema';
import { type GetSchedulesByUserInput } from '../schema';
import { getSchedules } from '../handlers/get_schedules';

describe('getSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all schedules when no input provided', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin'
      })
      .returning()
      .execute();

    // Create test schedules
    await db.insert(schedulesTable)
      .values([
        {
          name: 'Schedule 1',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'draft',
          created_by_user_id: userResult[0].id
        },
        {
          name: 'Schedule 2',
          start_date: '2024-02-01',
          end_date: '2024-02-28',
          status: 'published',
          created_by_user_id: userResult[0].id
        }
      ])
      .execute();

    const result = await getSchedules();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Schedule 1');
    expect(result[1].name).toEqual('Schedule 2');
    expect(result[0].status).toEqual('draft');
    expect(result[1].status).toEqual('published');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
  });

  it('should filter schedules by status only', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin'
      })
      .returning()
      .execute();

    // Create test schedules with different statuses
    await db.insert(schedulesTable)
      .values([
        {
          name: 'Draft Schedule',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'draft',
          created_by_user_id: userResult[0].id
        },
        {
          name: 'Published Schedule',
          start_date: '2024-02-01',
          end_date: '2024-02-28',
          status: 'published',
          created_by_user_id: userResult[0].id
        }
      ])
      .execute();

    // Filter by status only - create a minimal input object
    const result = await getSchedules({ status: 'published' } as GetSchedulesByUserInput);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Published Schedule');
    expect(result[0].status).toEqual('published');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
  });

  it('should return schedules assigned to specific user', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword',
          first_name: 'Admin',
          last_name: 'User',
          user_type: 'admin'
        },
        {
          email: 'staff@test.com',
          password_hash: 'hashedpassword',
          first_name: 'Staff',
          last_name: 'User',
          user_type: 'staff'
        }
      ])
      .returning()
      .execute();

    const adminUser = userResults[0];
    const staffUser = userResults[1];

    // Create test role
    const roleResult = await db.insert(rolesTable)
      .values({
        name: 'Test Role',
        description: 'A test role'
      })
      .returning()
      .execute();

    // Create test schedules
    const scheduleResults = await db.insert(schedulesTable)
      .values([
        {
          name: 'Schedule 1',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'published',
          created_by_user_id: adminUser.id
        },
        {
          name: 'Schedule 2',
          start_date: '2024-02-01',
          end_date: '2024-02-28',
          status: 'published',
          created_by_user_id: adminUser.id
        }
      ])
      .returning()
      .execute();

    // Create assignment only for first schedule
    await db.insert(scheduleAssignmentsTable)
      .values({
        schedule_id: scheduleResults[0].id,
        user_id: staffUser.id,
        role_id: roleResult[0].id,
        shift_date: '2024-01-15',
        shift_type: 'regular',
        start_time: '09:00',
        end_time: '17:00'
      })
      .execute();

    const input: GetSchedulesByUserInput = {
      user_id: staffUser.id
    };

    const result = await getSchedules(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Schedule 1');
    expect(result[0].id).toEqual(scheduleResults[0].id);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no schedule assignments', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staff@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Staff',
        last_name: 'User',
        user_type: 'staff'
      })
      .returning()
      .execute();

    const input: GetSchedulesByUserInput = {
      user_id: userResult[0].id
    };

    const result = await getSchedules(input);

    expect(result).toHaveLength(0);
  });

  it('should handle user filter with status filter combined', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword',
          first_name: 'Admin',
          last_name: 'User',
          user_type: 'admin'
        },
        {
          email: 'staff@test.com',
          password_hash: 'hashedpassword',
          first_name: 'Staff',
          last_name: 'User',
          user_type: 'staff'
        }
      ])
      .returning()
      .execute();

    const adminUser = userResults[0];
    const staffUser = userResults[1];

    // Create test role
    const roleResult = await db.insert(rolesTable)
      .values({
        name: 'Test Role',
        description: 'A test role'
      })
      .returning()
      .execute();

    // Create test schedules with different statuses
    const scheduleResults = await db.insert(schedulesTable)
      .values([
        {
          name: 'Draft Schedule',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'draft',
          created_by_user_id: adminUser.id
        },
        {
          name: 'Published Schedule',
          start_date: '2024-02-01',
          end_date: '2024-02-28',
          status: 'published',
          created_by_user_id: adminUser.id
        }
      ])
      .returning()
      .execute();

    // Create assignments for both schedules
    await db.insert(scheduleAssignmentsTable)
      .values([
        {
          schedule_id: scheduleResults[0].id,
          user_id: staffUser.id,
          role_id: roleResult[0].id,
          shift_date: '2024-01-15',
          shift_type: 'regular',
          start_time: '09:00',
          end_time: '17:00'
        },
        {
          schedule_id: scheduleResults[1].id,
          user_id: staffUser.id,
          role_id: roleResult[0].id,
          shift_date: '2024-02-15',
          shift_type: 'regular',
          start_time: '09:00',
          end_time: '17:00'
        }
      ])
      .execute();

    const input: GetSchedulesByUserInput = {
      user_id: staffUser.id,
      status: 'published'
    };

    const result = await getSchedules(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Published Schedule');
    expect(result[0].status).toEqual('published');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
  });
});
