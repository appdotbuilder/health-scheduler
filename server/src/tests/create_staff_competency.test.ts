
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rolesTable, staffCompetenciesTable } from '../db/schema';
import { type CreateStaffCompetencyInput } from '../schema';
import { createStaffCompetency } from '../handlers/create_staff_competency';
import { eq } from 'drizzle-orm';

describe('createStaffCompetency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testRoleId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create test role
    const roleResult = await db.insert(rolesTable)
      .values({
        name: 'MRI Technician',
        description: 'MRI scanning specialist'
      })
      .returning()
      .execute();

    testRoleId = roleResult[0].id;
  });

  it('should create staff competency with all fields', async () => {
    const input: CreateStaffCompetencyInput = {
      user_id: testUserId,
      role_id: testRoleId,
      proficiency_level: 4,
      certified_date: new Date('2023-01-15'),
      expiry_date: new Date('2025-01-15')
    };

    const result = await createStaffCompetency(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.role_id).toEqual(testRoleId);
    expect(result.proficiency_level).toEqual(4);
    expect(result.certified_date).toEqual(new Date('2023-01-15'));
    expect(result.expiry_date).toEqual(new Date('2025-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create staff competency with minimal fields', async () => {
    const input: CreateStaffCompetencyInput = {
      user_id: testUserId,
      role_id: testRoleId,
      proficiency_level: 3
    };

    const result = await createStaffCompetency(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.role_id).toEqual(testRoleId);
    expect(result.proficiency_level).toEqual(3);
    expect(result.certified_date).toBeNull();
    expect(result.expiry_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save competency to database', async () => {
    const input: CreateStaffCompetencyInput = {
      user_id: testUserId,
      role_id: testRoleId,
      proficiency_level: 5,
      certified_date: new Date('2023-06-01'),
      expiry_date: new Date('2026-06-01')
    };

    const result = await createStaffCompetency(input);

    const competencies = await db.select()
      .from(staffCompetenciesTable)
      .where(eq(staffCompetenciesTable.id, result.id))
      .execute();

    expect(competencies).toHaveLength(1);
    expect(competencies[0].user_id).toEqual(testUserId);
    expect(competencies[0].role_id).toEqual(testRoleId);
    expect(competencies[0].proficiency_level).toEqual(5);
    expect(competencies[0].certified_date).toEqual('2023-06-01');
    expect(competencies[0].expiry_date).toEqual('2026-06-01');
    expect(competencies[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input: CreateStaffCompetencyInput = {
      user_id: 99999,
      role_id: testRoleId,
      proficiency_level: 3
    };

    await expect(createStaffCompetency(input))
      .rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error for non-existent role', async () => {
    const input: CreateStaffCompetencyInput = {
      user_id: testUserId,
      role_id: 99999,
      proficiency_level: 3
    };

    await expect(createStaffCompetency(input))
      .rejects.toThrow(/Role with id 99999 not found/i);
  });

  it('should handle different proficiency levels', async () => {
    const levels = [1, 2, 3, 4, 5];

    for (const level of levels) {
      const input: CreateStaffCompetencyInput = {
        user_id: testUserId,
        role_id: testRoleId,
        proficiency_level: level
      };

      const result = await createStaffCompetency(input);
      expect(result.proficiency_level).toEqual(level);
    }
  });
});
