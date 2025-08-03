
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, rolesTable, staffCompetenciesTable, roleGroupsTable } from '../db/schema';
import { getStaffCompetencies } from '../handlers/get_staff_competencies';

describe('getStaffCompetencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all staff competencies when no user ID provided', async () => {
    // Create prerequisite data
    const roleGroup = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists',
        description: 'Medical imaging specialists'
      })
      .returning()
      .execute();

    const role = await db.insert(rolesTable)
      .values({
        name: 'MRI Specialist',
        description: 'MRI imaging role',
        role_group_id: roleGroup[0].id
      })
      .returning()
      .execute();

    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        password_hash: 'hashedpassword1',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'staff'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        password_hash: 'hashedpassword2',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'staff'
      })
      .returning()
      .execute();

    // Create competencies for both users
    await db.insert(staffCompetenciesTable)
      .values([
        {
          user_id: user1[0].id,
          role_id: role[0].id,
          proficiency_level: 4,
          certified_date: '2023-01-15',
          expiry_date: '2025-01-15'
        },
        {
          user_id: user2[0].id,
          role_id: role[0].id,
          proficiency_level: 3,
          certified_date: '2023-06-01',
          expiry_date: '2025-06-01'
        }
      ])
      .execute();

    const result = await getStaffCompetencies();

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBeDefined();
    expect(result[0].role_id).toBe(role[0].id);
    expect(result[0].proficiency_level).toBeOneOf([3, 4]);
    expect(result[0].certified_date).toBeInstanceOf(Date);
    expect(result[0].expiry_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return competencies for specific user when user ID provided', async () => {
    // Create prerequisite data
    const roleGroup = await db.insert(roleGroupsTable)
      .values({
        name: 'Radiologists',
        description: 'Medical imaging specialists'
      })
      .returning()
      .execute();

    const role = await db.insert(rolesTable)
      .values({
        name: 'CT Specialist',
        description: 'CT imaging role',
        role_group_id: roleGroup[0].id
      })
      .returning()
      .execute();

    const user1 = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        password_hash: 'hashedpassword1',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'staff'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        password_hash: 'hashedpassword2',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'staff'
      })
      .returning()
      .execute();

    // Create competencies for both users
    await db.insert(staffCompetenciesTable)
      .values([
        {
          user_id: user1[0].id,
          role_id: role[0].id,
          proficiency_level: 5,
          certified_date: '2022-12-01',
          expiry_date: '2024-12-01'
        },
        {
          user_id: user2[0].id,
          role_id: role[0].id,
          proficiency_level: 2,
          certified_date: '2023-03-15',
          expiry_date: '2025-03-15'
        }
      ])
      .execute();

    const result = await getStaffCompetencies(user1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user1[0].id);
    expect(result[0].role_id).toBe(role[0].id);
    expect(result[0].proficiency_level).toBe(5);
    expect(result[0].certified_date).toBeInstanceOf(Date);
    expect(result[0].expiry_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no competencies', async () => {
    // Create user but no competencies
    const user = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'staff'
      })
      .returning()
      .execute();

    const result = await getStaffCompetencies(user[0].id);

    expect(result).toHaveLength(0);
  });

  it('should handle competencies with null dates correctly', async () => {
    // Create prerequisite data
    const roleGroup = await db.insert(roleGroupsTable)
      .values({
        name: 'Technicians',
        description: 'Technical staff'
      })
      .returning()
      .execute();

    const role = await db.insert(rolesTable)
      .values({
        name: 'General Tech',
        description: 'General technical role',
        role_group_id: roleGroup[0].id
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'tech@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Tech',
        last_name: 'User',
        user_type: 'staff'
      })
      .returning()
      .execute();

    // Create competency with null dates
    await db.insert(staffCompetenciesTable)
      .values({
        user_id: user[0].id,
        role_id: role[0].id,
        proficiency_level: 3,
        certified_date: null,
        expiry_date: null
      })
      .execute();

    const result = await getStaffCompetencies(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(user[0].id);
    expect(result[0].role_id).toBe(role[0].id);
    expect(result[0].proficiency_level).toBe(3);
    expect(result[0].certified_date).toBeNull();
    expect(result[0].expiry_date).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple competencies for same user with different roles', async () => {
    // Create prerequisite data
    const roleGroup = await db.insert(roleGroupsTable)
      .values({
        name: 'Imaging Specialists',
        description: 'Medical imaging professionals'
      })
      .returning()
      .execute();

    const roles = await db.insert(rolesTable)
      .values([
        {
          name: 'MRI Specialist',
          description: 'MRI imaging',
          role_group_id: roleGroup[0].id
        },
        {
          name: 'CT Specialist',
          description: 'CT imaging',
          role_group_id: roleGroup[0].id
        }
      ])
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'multi@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Multi',
        last_name: 'Skilled',
        user_type: 'staff'
      })
      .returning()
      .execute();

    // Create multiple competencies for same user
    await db.insert(staffCompetenciesTable)
      .values([
        {
          user_id: user[0].id,
          role_id: roles[0].id,
          proficiency_level: 4,
          certified_date: '2023-01-01',
          expiry_date: '2025-01-01'
        },
        {
          user_id: user[0].id,
          role_id: roles[1].id,
          proficiency_level: 3,
          certified_date: '2023-06-01',
          expiry_date: '2025-06-01'
        }
      ])
      .execute();

    const result = await getStaffCompetencies(user[0].id);

    expect(result).toHaveLength(2);
    result.forEach(competency => {
      expect(competency.user_id).toBe(user[0].id);
      expect(competency.role_id).toBeOneOf([roles[0].id, roles[1].id]);
      expect(competency.proficiency_level).toBeOneOf([3, 4]);
      expect(competency.certified_date).toBeInstanceOf(Date);
      expect(competency.expiry_date).toBeInstanceOf(Date);
      expect(competency.created_at).toBeInstanceOf(Date);
    });
  });

  it('should convert date strings to proper Date objects', async () => {
    // Create prerequisite data
    const roleGroup = await db.insert(roleGroupsTable)
      .values({
        name: 'Test Group',
        description: 'Testing date conversion'
      })
      .returning()
      .execute();

    const role = await db.insert(rolesTable)
      .values({
        name: 'Test Role',
        description: 'Testing role',
        role_group_id: roleGroup[0].id
      })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'datetest@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Date',
        last_name: 'Tester',
        user_type: 'staff'
      })
      .returning()
      .execute();

    const testCertifiedDate = '2023-05-15';
    const testExpiryDate = '2025-05-15';

    await db.insert(staffCompetenciesTable)
      .values({
        user_id: user[0].id,
        role_id: role[0].id,
        proficiency_level: 4,
        certified_date: testCertifiedDate,
        expiry_date: testExpiryDate
      })
      .execute();

    const result = await getStaffCompetencies(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].certified_date).toBeInstanceOf(Date);
    expect(result[0].expiry_date).toBeInstanceOf(Date);
    
    // Verify the dates match the expected values
    expect(result[0].certified_date?.toISOString().split('T')[0]).toBe(testCertifiedDate);
    expect(result[0].expiry_date?.toISOString().split('T')[0]).toBe(testExpiryDate);
  });
});
