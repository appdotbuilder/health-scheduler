
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, schedulesTable, staffPreferencesTable } from '../db/schema';
import { type CreateUserInput, type CreateScheduleInput, type CreateStaffPreferenceInput } from '../schema';
import { submitStaffPreferences } from '../handlers/submit_staff_preferences';
import { eq } from 'drizzle-orm';

// Test user data
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'User',
  user_type: 'staff'
};

const otherUserInput: CreateUserInput = {
  email: 'other@example.com',
  password: 'password123',
  first_name: 'Other',
  last_name: 'User',
  user_type: 'staff'
};

const adminUserInput: CreateUserInput = {
  email: 'admin@example.com',
  password: 'password123',
  first_name: 'Admin',
  last_name: 'User',
  user_type: 'admin'
};

const testScheduleInput: CreateScheduleInput = {
  name: 'Test Schedule',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

// Helper functions
const createUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: input.email,
      password_hash: 'hashed_password', // Simple placeholder for tests
      first_name: input.first_name,
      last_name: input.last_name,
      user_type: input.user_type
    })
    .returning()
    .execute();

  return result[0];
};

const createSchedule = async (input: CreateScheduleInput, createdByUserId: number) => {
  const result = await db.insert(schedulesTable)
    .values({
      name: input.name,
      start_date: input.start_date.toISOString().split('T')[0],
      end_date: input.end_date.toISOString().split('T')[0],
      created_by_user_id: createdByUserId
    })
    .returning()
    .execute();

  return {
    ...result[0],
    start_date: new Date(result[0].start_date),
    end_date: new Date(result[0].end_date)
  };
};

const createStaffPreference = async (input: CreateStaffPreferenceInput, userId: number) => {
  const result = await db.insert(staffPreferencesTable)
    .values({
      user_id: userId,
      schedule_id: input.schedule_id,
      preferred_date: input.preferred_date.toISOString().split('T')[0],
      role_id: input.role_id || null,
      shift_type: input.shift_type || null,
      preference_type: input.preference_type,
      priority: input.priority || 3,
      notes: input.notes || null
    })
    .returning()
    .execute();

  return {
    ...result[0],
    preferred_date: new Date(result[0].preferred_date)
  };
};

describe('submitStaffPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit draft preferences for the user', async () => {
    // Create admin user and test user
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);

    // Create schedule
    const schedule = await createSchedule(testScheduleInput, adminUser.id);

    // Create draft preferences
    const preference1Input: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-15'),
      preference_type: 'available',
      priority: 3
    };

    const preference2Input: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-16'),
      preference_type: 'preferred',
      priority: 5,
      notes: 'Test preference'
    };

    const preference1 = await createStaffPreference(preference1Input, testUser.id);
    const preference2 = await createStaffPreference(preference2Input, testUser.id);

    // Submit preferences
    const result = await submitStaffPreferences(
      { preference_ids: [preference1.id, preference2.id] },
      testUser.id
    );

    // Verify result
    expect(result).toHaveLength(2);
    result.forEach(preference => {
      expect(preference.status).toEqual('submitted');
      expect(preference.submitted_at).toBeInstanceOf(Date);
      expect(preference.updated_at).toBeInstanceOf(Date);
      expect(preference.user_id).toEqual(testUser.id);
      expect(preference.preferred_date).toBeInstanceOf(Date);
    });
  });

  it('should update preferences in database', async () => {
    // Create admin user and test user
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);

    // Create schedule
    const schedule = await createSchedule(testScheduleInput, adminUser.id);

    // Create draft preference
    const preferenceInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-15'),
      preference_type: 'available',
      priority: 3
    };

    const preference = await createStaffPreference(preferenceInput, testUser.id);

    // Submit preference
    await submitStaffPreferences(
      { preference_ids: [preference.id] },
      testUser.id
    );

    // Verify database update
    const updatedPreferences = await db.select()
      .from(staffPreferencesTable)
      .where(eq(staffPreferencesTable.id, preference.id))
      .execute();

    expect(updatedPreferences).toHaveLength(1);
    const updatedPreference = updatedPreferences[0];
    expect(updatedPreference.status).toEqual('submitted');
    expect(updatedPreference.submitted_at).toBeInstanceOf(Date);
    expect(updatedPreference.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when preferences do not belong to user', async () => {
    // Create admin user and two test users
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);
    const otherUser = await createUser(otherUserInput);

    // Create schedule
    const schedule = await createSchedule(testScheduleInput, adminUser.id);

    // Create preference for other user
    const preferenceInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-15'),
      preference_type: 'available',
      priority: 3
    };

    const preference = await createStaffPreference(preferenceInput, otherUser.id);

    // Try to submit other user's preference
    expect(
      submitStaffPreferences(
        { preference_ids: [preference.id] },
        testUser.id
      )
    ).rejects.toThrow(/not found.*belong to user.*not in draft status/i);
  });

  it('should throw error when preferences are already submitted', async () => {
    // Create admin user and test user
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);

    // Create schedule
    const schedule = await createSchedule(testScheduleInput, adminUser.id);

    // Create and submit preference
    const preferenceInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-15'),
      preference_type: 'available',
      priority: 3
    };

    const preference = await createStaffPreference(preferenceInput, testUser.id);

    // Submit preference first time
    await submitStaffPreferences(
      { preference_ids: [preference.id] },
      testUser.id
    );

    // Try to submit again
    expect(
      submitStaffPreferences(
        { preference_ids: [preference.id] },
        testUser.id
      )
    ).rejects.toThrow(/not found.*belong to user.*not in draft status/i);
  });

  it('should throw error when some preferences do not exist', async () => {
    // Create admin user and test user
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);

    // Try to submit non-existent preference
    expect(
      submitStaffPreferences(
        { preference_ids: [999, 1000] },
        testUser.id
      )
    ).rejects.toThrow(/not found.*belong to user.*not in draft status/i);
  });

  it('should handle partial success - reject if any preference is invalid', async () => {
    // Create admin user and test user
    const adminUser = await createUser(adminUserInput);
    const testUser = await createUser(testUserInput);
    const otherUser = await createUser(otherUserInput);

    // Create schedule
    const schedule = await createSchedule(testScheduleInput, adminUser.id);

    // Create valid preference for test user
    const validPreferenceInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-15'),
      preference_type: 'available',
      priority: 3
    };

    // Create preference for other user
    const otherPreferenceInput: CreateStaffPreferenceInput = {
      schedule_id: schedule.id,
      preferred_date: new Date('2024-01-16'),
      preference_type: 'preferred',
      priority: 5
    };

    const validPreference = await createStaffPreference(validPreferenceInput, testUser.id);
    const otherPreference = await createStaffPreference(otherPreferenceInput, otherUser.id);

    // Try to submit both (one valid, one invalid)
    expect(
      submitStaffPreferences(
        { preference_ids: [validPreference.id, otherPreference.id] },
        testUser.id
      )
    ).rejects.toThrow(/not found.*belong to user.*not in draft status/i);

    // Verify the valid preference remains in draft status
    const preferences = await db.select()
      .from(staffPreferencesTable)
      .where(eq(staffPreferencesTable.id, validPreference.id))
      .execute();

    expect(preferences[0].status).toEqual('draft');
    expect(preferences[0].submitted_at).toBeNull();
  });
});
