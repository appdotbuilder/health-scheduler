
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { roleGroupsTable } from '../db/schema';
import { type CreateRoleGroupInput } from '../schema';
import { createRoleGroup } from '../handlers/create_role_group';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateRoleGroupInput = {
  name: 'Radiologists',
  description: 'Medical professionals specializing in radiology'
};

describe('createRoleGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a role group with description', async () => {
    const result = await createRoleGroup(testInput);

    // Basic field validation
    expect(result.name).toEqual('Radiologists');
    expect(result.description).toEqual('Medical professionals specializing in radiology');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a role group without description', async () => {
    const inputWithoutDescription: CreateRoleGroupInput = {
      name: 'Cardiologists'
    };

    const result = await createRoleGroup(inputWithoutDescription);

    expect(result.name).toEqual('Cardiologists');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save role group to database', async () => {
    const result = await createRoleGroup(testInput);

    // Query using proper drizzle syntax
    const roleGroups = await db.select()
      .from(roleGroupsTable)
      .where(eq(roleGroupsTable.id, result.id))
      .execute();

    expect(roleGroups).toHaveLength(1);
    expect(roleGroups[0].name).toEqual('Radiologists');
    expect(roleGroups[0].description).toEqual('Medical professionals specializing in radiology');
    expect(roleGroups[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreateRoleGroupInput = {
      name: 'Emergency Medicine',
      description: null
    };

    const result = await createRoleGroup(inputWithNullDescription);

    expect(result.name).toEqual('Emergency Medicine');
    expect(result.description).toBeNull();

    // Verify in database
    const roleGroups = await db.select()
      .from(roleGroupsTable)
      .where(eq(roleGroupsTable.id, result.id))
      .execute();

    expect(roleGroups[0].description).toBeNull();
  });
});
