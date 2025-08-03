
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

const testUser1: CreateUserInput = {
  email: 'john.doe@hospital.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  user_type: 'staff'
};

const testUser2: CreateUserInput = {
  email: 'jane.smith@hospital.com',
  password: 'password456',
  first_name: 'Jane',
  last_name: 'Smith',
  user_type: 'admin'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toHaveLength(0);
  });

  it('should return all users', async () => {
    // Create test users - using simple password hash for testing
    await db.insert(usersTable).values([
      {
        email: testUser1.email,
        password_hash: 'hashed_password_123',
        first_name: testUser1.first_name,
        last_name: testUser1.last_name,
        user_type: testUser1.user_type
      },
      {
        email: testUser2.email,
        password_hash: 'hashed_password_456',
        first_name: testUser2.first_name,
        last_name: testUser2.last_name,
        user_type: testUser2.user_type
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify first user
    const user1 = result.find(u => u.email === testUser1.email);
    expect(user1).toBeDefined();
    expect(user1!.first_name).toEqual('John');
    expect(user1!.last_name).toEqual('Doe');
    expect(user1!.user_type).toEqual('staff');
    expect(user1!.is_active).toBe(true);
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Verify second user
    const user2 = result.find(u => u.email === testUser2.email);
    expect(user2).toBeDefined();
    expect(user2!.first_name).toEqual('Jane');
    expect(user2!.last_name).toEqual('Smith');
    expect(user2!.user_type).toEqual('admin');
    expect(user2!.is_active).toBe(true);
    expect(user2!.id).toBeDefined();
    expect(user2!.created_at).toBeInstanceOf(Date);
    expect(user2!.updated_at).toBeInstanceOf(Date);
  });

  it('should include inactive users', async () => {
    await db.insert(usersTable).values({
      email: testUser1.email,
      password_hash: 'hashed_password_123',
      first_name: testUser1.first_name,
      last_name: testUser1.last_name,
      user_type: testUser1.user_type,
      is_active: false
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(false);
    expect(result[0].email).toEqual(testUser1.email);
  });

  it('should return users sorted by id', async () => {
    // Insert users in reverse alphabetical order
    await db.insert(usersTable).values([
      {
        email: testUser2.email,
        password_hash: 'hashed_password_456',
        first_name: testUser2.first_name,
        last_name: testUser2.last_name,
        user_type: testUser2.user_type
      },
      {
        email: testUser1.email,
        password_hash: 'hashed_password_123',
        first_name: testUser1.first_name,
        last_name: testUser1.last_name,
        user_type: testUser1.user_type
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    // Users should be returned in order of their IDs (insertion order)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].email).toEqual(testUser2.email);
    expect(result[1].email).toEqual(testUser1.email);
  });
});
