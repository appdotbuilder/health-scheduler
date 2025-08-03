
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  schedulesTable, 
  rolesTable, 
  roleGroupsTable,
  staffCompetenciesTable,
  scheduleAssignmentsTable 
} from '../db/schema';
import { type CreateScheduleAssignmentInput } from '../schema';
import { createScheduleAssignment } from '../handlers/create_schedule_assignment';
import { eq, and } from 'drizzle-orm';

describe('createScheduleAssignment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testScheduleId: number;
  let testRoleId: number;

  // Single beforeEach to set up all test data
  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create admin user for schedule creation
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin'
      })
      .returning()
      .execute();

    // Create role group
    const roleGroupResult = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists'
      })
      .returning()
      .execute();

    // Create test role
    const roleResult = await db.insert(rolesTable)
      .values({
        name: 'MRI Technician',
        role_group_id: roleGroupResult[0].id
      })
      .returning()
      .execute();
    testRoleId = roleResult[0].id;

    // Create test schedule - convert dates to strings
    const scheduleResult = await db.insert(schedulesTable)
      .values({
        name: 'Test Schedule',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        created_by_user_id: adminResult[0].id
      })
      .returning()
      .execute();
    testScheduleId = scheduleResult[0].id;

    // Create staff competency
    await db.insert(staffCompetenciesTable)
      .values({
        user_id: testUserId,
        role_id: testRoleId,
        proficiency_level: 3
      })
      .execute();
  });

  const getTestInput = (): CreateScheduleAssignmentInput => ({
    schedule_id: testScheduleId,
    user_id: testUserId,
    role_id: testRoleId,
    shift_date: new Date('2024-01-15'),
    shift_type: 'regular',
    start_time: '09:00',
    end_time: '17:00'
  });

  it('should create a schedule assignment', async () => {
    const input = getTestInput();
    const result = await createScheduleAssignment(input);

    expect(result.schedule_id).toEqual(testScheduleId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.role_id).toEqual(testRoleId);
    expect(result.shift_date).toEqual(new Date('2024-01-15'));
    expect(result.shift_type).toEqual('regular');
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('17:00');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save assignment to database', async () => {
    const input = getTestInput();
    const result = await createScheduleAssignment(input);

    const assignments = await db.select()
      .from(scheduleAssignmentsTable)
      .where(eq(scheduleAssignmentsTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].schedule_id).toEqual(testScheduleId);
    expect(assignments[0].user_id).toEqual(testUserId);
    expect(assignments[0].role_id).toEqual(testRoleId);
    expect(assignments[0].shift_date).toEqual('2024-01-15');
    expect(assignments[0].shift_type).toEqual('regular');
    // Database stores full time format
    expect(assignments[0].start_time).toEqual('09:00:00');
    expect(assignments[0].end_time).toEqual('17:00:00');
  });

  it('should throw error for non-existent schedule', async () => {
    const input = {
      ...getTestInput(),
      schedule_id: 99999
    };

    await expect(createScheduleAssignment(input)).rejects.toThrow(/schedule not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...getTestInput(),
      user_id: 99999
    };

    await expect(createScheduleAssignment(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent role', async () => {
    const input = {
      ...getTestInput(),
      role_id: 99999
    };

    await expect(createScheduleAssignment(input)).rejects.toThrow(/role not found/i);
  });

  it('should throw error when user lacks competency for role', async () => {
    // Create another role without competency
    const anotherRoleResult = await db.insert(rolesTable)
      .values({
        name: 'CT Technician'
      })
      .returning()
      .execute();

    const input = {
      ...getTestInput(),
      role_id: anotherRoleResult[0].id
    };

    await expect(createScheduleAssignment(input)).rejects.toThrow(/lacks competency/i);
  });

  it('should throw error for conflicting assignments on same date', async () => {
    const input = getTestInput();

    // Create first assignment
    await createScheduleAssignment(input);

    // Try to create second assignment on same date
    await expect(createScheduleAssignment(input)).rejects.toThrow(/already has an assignment/i);
  });

  it('should allow assignments on different dates', async () => {
    const input1 = {
      ...getTestInput(),
      shift_date: new Date('2024-01-15')
    };

    const input2 = {
      ...getTestInput(),
      shift_date: new Date('2024-01-16')
    };

    const result1 = await createScheduleAssignment(input1);
    const result2 = await createScheduleAssignment(input2);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle date conversion correctly', async () => {
    const input = getTestInput();
    const result = await createScheduleAssignment(input);

    // Verify that the returned date is a Date object
    expect(result.shift_date).toBeInstanceOf(Date);
    expect(result.shift_date.getTime()).toEqual(new Date('2024-01-15').getTime());

    // Verify that the database stores it as a string
    const dbResult = await db.select()
      .from(scheduleAssignmentsTable)
      .where(eq(scheduleAssignmentsTable.id, result.id))
      .execute();

    expect(typeof dbResult[0].shift_date).toBe('string');
    expect(dbResult[0].shift_date).toEqual('2024-01-15');
  });

  it('should handle time format conversion correctly', async () => {
    const input = getTestInput();
    const result = await createScheduleAssignment(input);

    // Verify that the returned times are in HH:MM format
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('17:00');

    // Verify that the database stores them in HH:MM:SS format
    const dbResult = await db.select()
      .from(scheduleAssignmentsTable)
      .where(eq(scheduleAssignmentsTable.id, result.id))
      .execute();

    expect(dbResult[0].start_time).toEqual('09:00:00');
    expect(dbResult[0].end_time).toEqual('17:00:00');
  });
});
