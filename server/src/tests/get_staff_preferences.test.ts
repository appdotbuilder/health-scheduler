
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, schedulesTable, staffPreferencesTable, roleGroupsTable, rolesTable } from '../db/schema';
import { type GetStaffPreferencesInput } from '../schema';
import { getStaffPreferences } from '../handlers/get_staff_preferences';

describe('getStaffPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all preferences for a schedule', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning();

    const [schedule] = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: user.id
    }).returning();

    const [roleGroup] = await db.insert(roleGroupsTable).values({
      name: 'Test Role Group'
    }).returning();

    const [role] = await db.insert(rolesTable).values({
      name: 'Test Role',
      role_group_id: roleGroup.id
    }).returning();

    // Create preferences
    await db.insert(staffPreferencesTable).values([
      {
        user_id: user.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-15',
        role_id: role.id,
        shift_type: 'regular',
        preference_type: 'preferred',
        priority: 5,
        status: 'draft'
      },
      {
        user_id: user.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-20',
        preference_type: 'unavailable',
        priority: 1,
        status: 'submitted',
        submitted_at: new Date()
      }
    ]);

    const input: GetStaffPreferencesInput = {
      schedule_id: schedule.id
    };

    const result = await getStaffPreferences(input);

    expect(result).toHaveLength(2);
    expect(result[0].schedule_id).toBe(schedule.id);
    expect(result[0].user_id).toBe(user.id);
    expect(result[0].preferred_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Check that we have both preferences
    const preferenceTypes = result.map(p => p.preference_type);
    expect(preferenceTypes).toContain('preferred');
    expect(preferenceTypes).toContain('unavailable');
  });

  it('should filter preferences by user_id', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable).values({
      email: 'user1@example.com',
      password_hash: 'hash',
      first_name: 'User',
      last_name: 'One',
      user_type: 'staff'
    }).returning();

    const [user2] = await db.insert(usersTable).values({
      email: 'user2@example.com',
      password_hash: 'hash',
      first_name: 'User',
      last_name: 'Two',
      user_type: 'staff'
    }).returning();

    const [schedule] = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: user1.id
    }).returning();

    // Create preferences for both users
    await db.insert(staffPreferencesTable).values([
      {
        user_id: user1.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-15',
        preference_type: 'preferred',
        priority: 3
      },
      {
        user_id: user2.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-20',
        preference_type: 'unavailable',
        priority: 1
      }
    ]);

    const input: GetStaffPreferencesInput = {
      schedule_id: schedule.id,
      user_id: user1.id
    };

    const result = await getStaffPreferences(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1.id);
    expect(result[0].preference_type).toBe('preferred');
  });

  it('should filter preferences by status', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning();

    const [schedule] = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: user.id
    }).returning();

    // Create preferences with different statuses
    await db.insert(staffPreferencesTable).values([
      {
        user_id: user.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-15',
        preference_type: 'preferred',
        priority: 3,
        status: 'draft'
      },
      {
        user_id: user.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-20',
        preference_type: 'unavailable',
        priority: 1,
        status: 'submitted',
        submitted_at: new Date()
      }
    ]);

    const input: GetStaffPreferencesInput = {
      schedule_id: schedule.id,
      status: 'submitted'
    };

    const result = await getStaffPreferences(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('submitted');
    expect(result[0].submitted_at).toBeInstanceOf(Date);
    expect(result[0].preference_type).toBe('unavailable');
  });

  it('should return empty array when no preferences exist for schedule', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'staff'
    }).returning();

    const [schedule] = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: user.id
    }).returning();

    const input: GetStaffPreferencesInput = {
      schedule_id: schedule.id
    };

    const result = await getStaffPreferences(input);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple filters combined', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable).values({
      email: 'user1@example.com',
      password_hash: 'hash',
      first_name: 'User',
      last_name: 'One',
      user_type: 'staff'
    }).returning();

    const [user2] = await db.insert(usersTable).values({
      email: 'user2@example.com',
      password_hash: 'hash',
      first_name: 'User',
      last_name: 'Two',
      user_type: 'staff'
    }).returning();

    const [schedule] = await db.insert(schedulesTable).values({
      name: 'Test Schedule',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      created_by_user_id: user1.id
    }).returning();

    // Create multiple preferences
    await db.insert(staffPreferencesTable).values([
      {
        user_id: user1.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-15',
        preference_type: 'preferred',
        priority: 3,
        status: 'draft'
      },
      {
        user_id: user1.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-16',
        preference_type: 'unavailable',
        priority: 1,
        status: 'submitted',
        submitted_at: new Date()
      },
      {
        user_id: user2.id,
        schedule_id: schedule.id,
        preferred_date: '2024-01-20',
        preference_type: 'available',
        priority: 2,
        status: 'submitted',
        submitted_at: new Date()
      }
    ]);

    const input: GetStaffPreferencesInput = {
      schedule_id: schedule.id,
      user_id: user1.id,
      status: 'submitted'
    };

    const result = await getStaffPreferences(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1.id);
    expect(result[0].status).toBe('submitted');
    expect(result[0].preference_type).toBe('unavailable');
  });
});
