
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffGroupsTable, roleGroupsTable, userStaffGroupsTable, userRoleGroupsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input data
const basicUserInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  user_type: 'staff'
};

const adminUserInput: CreateUserInput = {
  email: 'admin@example.com',
  password: 'adminpass123',
  first_name: 'Jane',
  last_name: 'Admin',
  user_type: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic staff user', async () => {
    const result = await createUser(basicUserInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.user_type).toEqual('staff');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toEqual('hashed_password123');
  });

  it('should create an admin user', async () => {
    const result = await createUser(adminUserInput);

    expect(result.email).toEqual('admin@example.com');
    expect(result.user_type).toEqual('admin');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Admin');
    expect(result.password_hash).toEqual('hashed_adminpass123');
  });

  it('should save user to database', async () => {
    const result = await createUser(basicUserInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].user_type).toEqual('staff');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should create user with staff group association', async () => {
    // Create a staff group first
    const staffGroupResult = await db.insert(staffGroupsTable)
      .values({
        name: 'Doctors',
        description: 'Medical doctors'
      })
      .returning()
      .execute();

    const staffGroup = staffGroupResult[0];

    // Create user with staff group association
    const userInput: CreateUserInput = {
      ...basicUserInput,
      staff_group_id: staffGroup.id
    };

    const result = await createUser(userInput);

    // Verify user was created
    expect(result.id).toBeDefined();

    // Verify staff group association was created
    const associations = await db.select()
      .from(userStaffGroupsTable)
      .where(eq(userStaffGroupsTable.user_id, result.id))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].staff_group_id).toEqual(staffGroup.id);
  });

  it('should create user with role group association', async () => {
    // Create a role group first
    const roleGroupResult = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists',
        description: 'Radiology specialists'
      })
      .returning()
      .execute();

    const roleGroup = roleGroupResult[0];

    // Create user with role group association
    const userInput: CreateUserInput = {
      ...basicUserInput,
      role_group_id: roleGroup.id
    };

    const result = await createUser(userInput);

    // Verify user was created
    expect(result.id).toBeDefined();

    // Verify role group association was created
    const associations = await db.select()
      .from(userRoleGroupsTable)
      .where(eq(userRoleGroupsTable.user_id, result.id))
      .execute();

    expect(associations).toHaveLength(1);
    expect(associations[0].role_group_id).toEqual(roleGroup.id);
  });

  it('should create user with both staff and role group associations', async () => {
    // Create both groups first
    const staffGroupResult = await db.insert(staffGroupsTable)
      .values({
        name: 'Nurses',
        description: 'Nursing staff'
      })
      .returning()
      .execute();

    const roleGroupResult = await db.insert(roleGroupsTable)
      .values({
        name: 'Emergency',
        description: 'Emergency department'
      })
      .returning()
      .execute();

    const staffGroup = staffGroupResult[0];
    const roleGroup = roleGroupResult[0];

    // Create user with both associations
    const userInput: CreateUserInput = {
      ...basicUserInput,
      staff_group_id: staffGroup.id,
      role_group_id: roleGroup.id
    };

    const result = await createUser(userInput);

    // Verify staff group association
    const staffAssociations = await db.select()
      .from(userStaffGroupsTable)
      .where(eq(userStaffGroupsTable.user_id, result.id))
      .execute();

    expect(staffAssociations).toHaveLength(1);
    expect(staffAssociations[0].staff_group_id).toEqual(staffGroup.id);

    // Verify role group association
    const roleAssociations = await db.select()
      .from(userRoleGroupsTable)
      .where(eq(userRoleGroupsTable.user_id, result.id))
      .execute();

    expect(roleAssociations).toHaveLength(1);
    expect(roleAssociations[0].role_group_id).toEqual(roleGroup.id);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(basicUserInput);

    // Try to create another user with same email
    await expect(createUser(basicUserInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should reject invalid foreign key for staff group', async () => {
    const userInput: CreateUserInput = {
      ...basicUserInput,
      staff_group_id: 999 // Non-existent staff group
    };

    await expect(createUser(userInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should reject invalid foreign key for role group', async () => {
    const userInput: CreateUserInput = {
      ...basicUserInput,
      role_group_id: 999 // Non-existent role group
    };

    await expect(createUser(userInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
