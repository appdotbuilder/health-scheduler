
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, schedulesTable, rolesTable, scheduleAssignmentsTable, roleGroupsTable } from '../db/schema';
import { getScheduleAssignments } from '../handlers/get_schedule_assignments';

describe('getScheduleAssignments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all assignments for a schedule', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning().execute();
    const userId = userResult[0].id;

    // Create another test user
    const user2Result = await db.insert(usersTable).values({
      email: 'test2@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test2',
      last_name: 'User2',
      user_type: 'staff'
    }).returning().execute();
    const user2Id = user2Result[0].id;

    // Create admin user for schedule creation
    const adminResult = await db.insert(usersTable).values({
      email: 'admin@example.com',
      password_hash: 'hashed_password',
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin'
    }).returning().execute();
    const adminId = adminResult[0].id;

    // Create role group
    const roleGroupResult = await db.insert(roleGroupsTable).values({
      name: 'Test Role Group',
      description: 'Test description'
    }).returning().execute();
    const roleGroupId = roleGroupResult[0].id;

    // Create role
    const roleResult = await db.insert(rolesTable).values({
      name: 'Test Role',
      description: 'Test role description',
      role_group_id: roleGroupId
    }).returning().execute();
    const roleId = roleResult[0].id;

    // Create schedule
    const scheduleResult = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: adminId
    }).returning().execute();
    const scheduleId = scheduleResult[0].id;

    // Create schedule assignments
    await db.insert(scheduleAssignmentsTable).values([
      {
        schedule_id: scheduleId,
        user_id: userId,
        role_id: roleId,
        shift_date: '2024-01-01',
        shift_type: 'regular',
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        schedule_id: scheduleId,
        user_id: user2Id,
        role_id: roleId,
        shift_date: '2024-01-02',
        shift_type: 'on_call',
        start_time: '17:00',
        end_time: '09:00'
      }
    ]).execute();

    const assignments = await getScheduleAssignments(scheduleId);

    expect(assignments).toHaveLength(2);
    expect(assignments[0].schedule_id).toEqual(scheduleId);
    expect(assignments[0].user_id).toEqual(userId);
    expect(assignments[0].role_id).toEqual(roleId);
    expect(assignments[0].shift_date).toEqual(new Date('2024-01-01'));
    expect(assignments[0].shift_type).toEqual('regular');
    expect(assignments[0].start_time).toEqual('09:00:00');
    expect(assignments[0].end_time).toEqual('17:00:00');
    expect(assignments[0].id).toBeDefined();
    expect(assignments[0].created_at).toBeInstanceOf(Date);

    expect(assignments[1].schedule_id).toEqual(scheduleId);
    expect(assignments[1].user_id).toEqual(user2Id);
    expect(assignments[1].shift_type).toEqual('on_call');
    expect(assignments[1].shift_date).toEqual(new Date('2024-01-02'));
  });

  it('should return assignments filtered by user ID', async () => {
    // Create test users
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning().execute();
    const userId = userResult[0].id;

    const user2Result = await db.insert(usersTable).values({
      email: 'test2@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test2',
      last_name: 'User2',
      user_type: 'staff'
    }).returning().execute();
    const user2Id = user2Result[0].id;

    // Create admin user
    const adminResult = await db.insert(usersTable).values({
      email: 'admin@example.com',
      password_hash: 'hashed_password',
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin'
    }).returning().execute();
    const adminId = adminResult[0].id;

    // Create role group and role
    const roleGroupResult = await db.insert(roleGroupsTable).values({
      name: 'Test Role Group'
    }).returning().execute();
    const roleGroupId = roleGroupResult[0].id;

    const roleResult = await db.insert(rolesTable).values({
      name: 'Test Role',
      role_group_id: roleGroupId
    }).returning().execute();
    const roleId = roleResult[0].id;

    // Create schedule
    const scheduleResult = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: adminId
    }).returning().execute();
    const scheduleId = scheduleResult[0].id;

    // Create assignments for both users
    await db.insert(scheduleAssignmentsTable).values([
      {
        schedule_id: scheduleId,
        user_id: userId,
        role_id: roleId,
        shift_date: '2024-01-01',
        shift_type: 'regular',
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        schedule_id: scheduleId,
        user_id: user2Id,
        role_id: roleId,
        shift_date: '2024-01-02',
        shift_type: 'on_call',
        start_time: '17:00',
        end_time: '09:00'
      }
    ]).execute();

    // Get assignments for specific user
    const userAssignments = await getScheduleAssignments(scheduleId, userId);

    expect(userAssignments).toHaveLength(1);
    expect(userAssignments[0].user_id).toEqual(userId);
    expect(userAssignments[0].shift_date).toEqual(new Date('2024-01-01'));
    expect(userAssignments[0].shift_type).toEqual('regular');
    expect(userAssignments[0].id).toBeDefined();
    expect(userAssignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent schedule', async () => {
    const assignments = await getScheduleAssignments(999);
    expect(assignments).toHaveLength(0);
  });

  it('should return empty array when user has no assignments', async () => {
    // Create test user and admin
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning().execute();
    const userId = userResult[0].id;

    const adminResult = await db.insert(usersTable).values({
      email: 'admin@example.com',
      password_hash: 'hashed_password',
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin'
    }).returning().execute();
    const adminId = adminResult[0].id;

    // Create schedule
    const scheduleResult = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: adminId
    }).returning().execute();
    const scheduleId = scheduleResult[0].id;

    // Get assignments for user with no assignments
    const assignments = await getScheduleAssignments(scheduleId, userId);
    expect(assignments).toHaveLength(0);
  });

  it('should handle date conversion correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning().execute();
    const userId = userResult[0].id;

    const adminResult = await db.insert(usersTable).values({
      email: 'admin@example.com',
      password_hash: 'hashed_password',
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin'
    }).returning().execute();
    const adminId = adminResult[0].id;

    const roleGroupResult = await db.insert(roleGroupsTable).values({
      name: 'Test Role Group'
    }).returning().execute();
    const roleGroupId = roleGroupResult[0].id;

    const roleResult = await db.insert(rolesTable).values({
      name: 'Test Role',
      role_group_id: roleGroupId
    }).returning().execute();
    const roleId = roleResult[0].id;

    const scheduleResult = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: adminId
    }).returning().execute();
    const scheduleId = scheduleResult[0].id;

    // Create assignment with specific date
    await db.insert(scheduleAssignmentsTable).values({
      schedule_id: scheduleId,
      user_id: userId,
      role_id: roleId,
      shift_date: '2024-01-15',
      shift_type: 'regular',
      start_time: '08:00',
      end_time: '16:00'
    }).execute();

    const assignments = await getScheduleAssignments(scheduleId);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].shift_date).toBeInstanceOf(Date);
    expect(assignments[0].shift_date.getFullYear()).toEqual(2024);
    expect(assignments[0].shift_date.getMonth()).toEqual(0); // January is 0
    expect(assignments[0].shift_date.getDate()).toEqual(15);
  });
});
