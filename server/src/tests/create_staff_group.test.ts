
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffGroupsTable } from '../db/schema';
import { type CreateStaffGroupInput } from '../schema';
import { createStaffGroup } from '../handlers/create_staff_group';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateStaffGroupInput = {
  name: 'Radiologists',
  description: 'Medical imaging specialists',
  max_consecutive_days: 7,
  requires_day_off_after_oncall: true
};

describe('createStaffGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a staff group with all fields', async () => {
    const result = await createStaffGroup(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Radiologists');
    expect(result.description).toEqual('Medical imaging specialists');
    expect(result.max_consecutive_days).toEqual(7);
    expect(result.requires_day_off_after_oncall).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a staff group with minimal fields', async () => {
    const minimalInput: CreateStaffGroupInput = {
      name: 'Nurses'
    };

    const result = await createStaffGroup(minimalInput);

    // Verify required field and defaults
    expect(result.name).toEqual('Nurses');
    expect(result.description).toBeNull();
    expect(result.max_consecutive_days).toBeNull();
    expect(result.requires_day_off_after_oncall).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save staff group to database', async () => {
    const result = await createStaffGroup(testInput);

    // Query the database to verify record was created
    const staffGroups = await db.select()
      .from(staffGroupsTable)
      .where(eq(staffGroupsTable.id, result.id))
      .execute();

    expect(staffGroups).toHaveLength(1);
    expect(staffGroups[0].name).toEqual('Radiologists');
    expect(staffGroups[0].description).toEqual('Medical imaging specialists');
    expect(staffGroups[0].max_consecutive_days).toEqual(7);
    expect(staffGroups[0].requires_day_off_after_oncall).toEqual(true);
    expect(staffGroups[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null optional values correctly', async () => {
    const inputWithNulls: CreateStaffGroupInput = {
      name: 'Emergency Staff',
      description: null,
      max_consecutive_days: null,
      requires_day_off_after_oncall: false
    };

    const result = await createStaffGroup(inputWithNulls);

    expect(result.name).toEqual('Emergency Staff');
    expect(result.description).toBeNull();
    expect(result.max_consecutive_days).toBeNull();
    expect(result.requires_day_off_after_oncall).toEqual(false);
  });
});
