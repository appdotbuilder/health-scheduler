
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffGroupsTable } from '../db/schema';
import { getStaffGroups } from '../handlers/get_staff_groups';

describe('getStaffGroups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no staff groups exist', async () => {
    const result = await getStaffGroups();

    expect(result).toEqual([]);
  });

  it('should return all staff groups', async () => {
    // Create test staff groups
    await db.insert(staffGroupsTable).values([
      {
        name: 'Doctors',
        description: 'Medical doctors',
        max_consecutive_days: 7,
        requires_day_off_after_oncall: true
      },
      {
        name: 'Nurses',
        description: 'Nursing staff',
        max_consecutive_days: 5,
        requires_day_off_after_oncall: false
      },
      {
        name: 'Technicians',
        description: null,
        max_consecutive_days: null,
        requires_day_off_after_oncall: false
      }
    ]).execute();

    const result = await getStaffGroups();

    expect(result).toHaveLength(3);
    
    // Verify first staff group
    const doctorsGroup = result.find(group => group.name === 'Doctors');
    expect(doctorsGroup).toBeDefined();
    expect(doctorsGroup?.description).toEqual('Medical doctors');
    expect(doctorsGroup?.max_consecutive_days).toEqual(7);
    expect(doctorsGroup?.requires_day_off_after_oncall).toEqual(true);
    expect(doctorsGroup?.id).toBeDefined();
    expect(doctorsGroup?.created_at).toBeInstanceOf(Date);

    // Verify second staff group
    const nursesGroup = result.find(group => group.name === 'Nurses');
    expect(nursesGroup).toBeDefined();
    expect(nursesGroup?.description).toEqual('Nursing staff');
    expect(nursesGroup?.max_consecutive_days).toEqual(5);
    expect(nursesGroup?.requires_day_off_after_oncall).toEqual(false);

    // Verify third staff group with null values
    const techGroup = result.find(group => group.name === 'Technicians');
    expect(techGroup).toBeDefined();
    expect(techGroup?.description).toBeNull();
    expect(techGroup?.max_consecutive_days).toBeNull();
    expect(techGroup?.requires_day_off_after_oncall).toEqual(false);
  });

  it('should return staff groups ordered by creation', async () => {
    // Create staff groups in specific order
    await db.insert(staffGroupsTable).values({
      name: 'First Group',
      description: 'Created first'
    }).execute();

    await db.insert(staffGroupsTable).values({
      name: 'Second Group', 
      description: 'Created second'
    }).execute();

    const result = await getStaffGroups();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Group');
    expect(result[1].name).toEqual('Second Group');
    expect(result[0].created_at < result[1].created_at).toBe(true);
  });
});
