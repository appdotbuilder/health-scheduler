
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { rolesTable, roleGroupsTable } from '../db/schema';
import { type CreateRoleInput, type CreateRoleGroupInput } from '../schema';
import { getRoles } from '../handlers/get_roles';

describe('getRoles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no roles exist', async () => {
    const result = await getRoles();
    expect(result).toEqual([]);
  });

  it('should return all roles', async () => {
    // Create role group first
    const roleGroupResult = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists',
        description: 'Medical imaging specialists'
      })
      .returning()
      .execute();

    const roleGroupId = roleGroupResult[0].id;

    // Create test roles
    const testRoles = [
      {
        name: 'MRI Technician',
        description: 'Operates MRI machines',
        role_group_id: roleGroupId
      },
      {
        name: 'CT Technician',
        description: 'Operates CT scanners',
        role_group_id: roleGroupId
      },
      {
        name: 'On-Call Radiologist',
        description: 'Emergency radiology coverage'
      }
    ];

    await db.insert(rolesTable)
      .values(testRoles)
      .execute();

    const result = await getRoles();

    expect(result).toHaveLength(3);
    
    // Verify role data
    const mriRole = result.find(role => role.name === 'MRI Technician');
    expect(mriRole).toBeDefined();
    expect(mriRole!.description).toEqual('Operates MRI machines');
    expect(mriRole!.id).toBeDefined();
    expect(mriRole!.created_at).toBeInstanceOf(Date);

    const ctRole = result.find(role => role.name === 'CT Technician');
    expect(ctRole).toBeDefined();
    expect(ctRole!.description).toEqual('Operates CT scanners');

    const onCallRole = result.find(role => role.name === 'On-Call Radiologist');
    expect(onCallRole).toBeDefined();
    expect(onCallRole!.description).toEqual('Emergency radiology coverage');
  });

  it('should handle roles with null descriptions', async () => {
    await db.insert(rolesTable)
      .values({
        name: 'General Role',
        description: null
      })
      .execute();

    const result = await getRoles();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('General Role');
    expect(result[0].description).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return roles in consistent order', async () => {
    // Create multiple roles
    const roleNames = ['Alpha Role', 'Beta Role', 'Gamma Role'];
    
    for (const name of roleNames) {
      await db.insert(rolesTable)
        .values({
          name,
          description: `Description for ${name}`
        })
        .execute();
    }

    const result = await getRoles();

    expect(result).toHaveLength(3);
    // Verify all roles are returned
    roleNames.forEach(name => {
      expect(result.find(role => role.name === name)).toBeDefined();
    });
  });
});
