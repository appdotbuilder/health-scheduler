
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { rolesTable, roleGroupsTable } from '../db/schema';
import { type CreateRoleInput } from '../schema';
import { createRole } from '../handlers/create_role';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateRoleInput = {
  name: 'MRI Technician',
  description: 'Operates MRI scanning equipment'
};

describe('createRole', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a role', async () => {
    const result = await createRole(testInput);

    // Basic field validation
    expect(result.name).toEqual('MRI Technician');
    expect(result.description).toEqual('Operates MRI scanning equipment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save role to database', async () => {
    const result = await createRole(testInput);

    // Query using proper drizzle syntax
    const roles = await db.select()
      .from(rolesTable)
      .where(eq(rolesTable.id, result.id))
      .execute();

    expect(roles).toHaveLength(1);
    expect(roles[0].name).toEqual('MRI Technician');
    expect(roles[0].description).toEqual('Operates MRI scanning equipment');
    expect(roles[0].created_at).toBeInstanceOf(Date);
  });

  it('should create role with null description', async () => {
    const inputWithoutDescription: CreateRoleInput = {
      name: 'CT Technician'
    };

    const result = await createRole(inputWithoutDescription);

    expect(result.name).toEqual('CT Technician');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create role with role_group_id', async () => {
    // First create a role group
    const roleGroupResult = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists',
        description: 'Medical imaging specialists'
      })
      .returning()
      .execute();

    const roleGroup = roleGroupResult[0];

    const inputWithRoleGroup: CreateRoleInput = {
      name: 'Interventional Radiologist',
      description: 'Performs minimally invasive procedures',
      role_group_id: roleGroup.id
    };

    const result = await createRole(inputWithRoleGroup);

    expect(result.name).toEqual('Interventional Radiologist');
    expect(result.description).toEqual('Performs minimally invasive procedures');
    expect(result.id).toBeDefined();

    // Verify role_group_id was saved correctly
    const savedRole = await db.select()
      .from(rolesTable)
      .where(eq(rolesTable.id, result.id))
      .execute();

    expect(savedRole[0].role_group_id).toEqual(roleGroup.id);
  });

  it('should handle foreign key constraint violation', async () => {
    const inputWithInvalidRoleGroup: CreateRoleInput = {
      name: 'Invalid Role',
      description: 'Role with non-existent role group',
      role_group_id: 9999 // Non-existent role group ID
    };

    await expect(createRole(inputWithInvalidRoleGroup)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
