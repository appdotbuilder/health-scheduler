
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { roleGroupsTable } from '../db/schema';
import { type CreateRoleGroupInput } from '../schema';
import { getRoleGroups } from '../handlers/get_role_groups';

// Test data
const testRoleGroup1: CreateRoleGroupInput = {
  name: 'Radiologists',
  description: 'Medical imaging specialists'
};

const testRoleGroup2: CreateRoleGroupInput = {
  name: 'Technicians',
  description: 'Technical support staff'
};

const testRoleGroup3: CreateRoleGroupInput = {
  name: 'Nurses',
  description: null
};

describe('getRoleGroups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no role groups exist', async () => {
    const result = await getRoleGroups();

    expect(result).toEqual([]);
  });

  it('should return all role groups', async () => {
    // Create test role groups
    await db.insert(roleGroupsTable)
      .values([testRoleGroup1, testRoleGroup2, testRoleGroup3])
      .execute();

    const result = await getRoleGroups();

    expect(result).toHaveLength(3);
    
    // Verify all role groups are returned
    const names = result.map(rg => rg.name);
    expect(names).toContain('Radiologists');
    expect(names).toContain('Technicians');
    expect(names).toContain('Nurses');
  });

  it('should return role groups with correct properties', async () => {
    // Create a single role group
    await db.insert(roleGroupsTable)
      .values(testRoleGroup1)
      .execute();

    const result = await getRoleGroups();

    expect(result).toHaveLength(1);
    const roleGroup = result[0];

    expect(roleGroup.id).toBeDefined();
    expect(typeof roleGroup.id).toBe('number');
    expect(roleGroup.name).toEqual('Radiologists');
    expect(roleGroup.description).toEqual('Medical imaging specialists');
    expect(roleGroup.created_at).toBeInstanceOf(Date);
  });

  it('should handle role groups with null descriptions', async () => {
    // Create role group with null description
    await db.insert(roleGroupsTable)
      .values(testRoleGroup3)
      .execute();

    const result = await getRoleGroups();

    expect(result).toHaveLength(1);
    const roleGroup = result[0];

    expect(roleGroup.name).toEqual('Nurses');
    expect(roleGroup.description).toBeNull();
  });
});
