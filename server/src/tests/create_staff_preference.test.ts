
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, schedulesTable, rolesTable, roleGroupsTable, staffPreferencesTable } from '../db/schema';
import { type CreateStaffPreferenceInput } from '../schema';
import { createStaffPreference } from '../handlers/create_staff_preference';
import { eq } from 'drizzle-orm';

// Test data setup
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'staff@example.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Doe',
      user_type: 'staff',
      is_active: true
    })
    .returning()
    .execute();
  return result[0];
};

const createTestSchedule = async (createdByUserId: number) => {
  const result = await db.insert(schedulesTable)
    .values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'draft',
      created_by_user_id: createdByUserId
    })
    .returning()
    .execute();
  return result[0];
};

const createTestRole = async () => {
  // Create role group first
  const roleGroup = await db.insert(roleGroupsTable)
    .values({
      name: 'Radiologists',
      description: 'Medical imaging specialists'
    })
    .returning()
    .execute();

  const result = await db.insert(rolesTable)
    .values({
      name: 'MRI Technician',
      description: 'MRI specialist',
      role_group_id: roleGroup[0].id
    })
    .returning()
    .execute();
  return result[0];
};

const testInput: CreateStaffPreferenceInput = {
  schedule_id: 1,
  preferred_date: new Date('2024-01-15'),
  role_id: 1,
  shift_type: 'regular',
  preference_type: 'preferred',
  priority: 4,
  notes: 'Prefer morning shift'
};

describe('createStaffPreference', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a staff preference', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);
    const role = await createTestRole();

    const input = {
      ...testInput,
      schedule_id: schedule.id,
      role_id: role.id
    };

    const result = await createStaffPreference(input, user.id);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.schedule_id).toEqual(schedule.id);
    expect(result.preferred_date).toEqual(new Date('2024-01-15'));
    expect(result.role_id).toEqual(role.id);
    expect(result.shift_type).toEqual('regular');
    expect(result.preference_type).toEqual('preferred');
    expect(result.priority).toEqual(4);
    expect(result.status).toEqual('draft');
    expect(result.notes).toEqual('Prefer morning shift');
    expect(result.submitted_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save staff preference to database', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);
    const role = await createTestRole();

    const input = {
      ...testInput,
      schedule_id: schedule.id,
      role_id: role.id
    };

    const result = await createStaffPreference(input, user.id);

    const preferences = await db.select()
      .from(staffPreferencesTable)
      .where(eq(staffPreferencesTable.id, result.id))
      .execute();

    expect(preferences).toHaveLength(1);
    expect(preferences[0].user_id).toEqual(user.id);
    expect(preferences[0].schedule_id).toEqual(schedule.id);
    expect(new Date(preferences[0].preferred_date)).toEqual(new Date('2024-01-15'));
    expect(preferences[0].role_id).toEqual(role.id);
    expect(preferences[0].shift_type).toEqual('regular');
    expect(preferences[0].preference_type).toEqual('preferred');
    expect(preferences[0].priority).toEqual(4);
    expect(preferences[0].status).toEqual('draft');
    expect(preferences[0].notes).toEqual('Prefer morning shift');
    expect(preferences[0].submitted_at).toBeNull();
  });

  it('should create preference with optional fields as null', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);

    const minimalInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-20'),
      preference_type: 'available'
    };

    const result = await createStaffPreference(minimalInput, user.id);

    expect(result.role_id).toBeNull();
    expect(result.shift_type).toBeNull();
    expect(result.priority).toEqual(3); // Default value
    expect(result.notes).toBeNull();
  });

  it('should create preference with default priority when not provided', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);

    const inputWithoutPriority: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-20'),
      preference_type: 'unavailable'
    };

    const result = await createStaffPreference(inputWithoutPriority, user.id);

    expect(result.priority).toEqual(3);
  });

  it('should throw error when user does not exist', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);
    const role = await createTestRole();

    const input = {
      ...testInput,
      schedule_id: schedule.id,
      role_id: role.id
    };

    await expect(createStaffPreference(input, 999)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when schedule does not exist', async () => {
    const user = await createTestUser();

    const input = {
      ...testInput,
      schedule_id: 999
    };

    await expect(createStaffPreference(input, user.id)).rejects.toThrow(/schedule not found/i);
  });

  it('should throw error when role does not exist', async () => {
    const user = await createTestUser();
    const schedule = await createTestSchedule(user.id);

    const input = {
      ...testInput,
      schedule_id: schedule.id,
      role_id: 999
    };

    await expect(createStaffPreference(input, user.id)).rejects.toThrow(/role not found/i);
  });
});
