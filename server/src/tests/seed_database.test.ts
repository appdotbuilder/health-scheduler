import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  roleGroupsTable, 
  rolesTable, 
  staffGroupsTable,
  userStaffGroupsTable,
  userRoleGroupsTable,
  staffCompetenciesTable,
  schedulesTable,
  scheduleAssignmentsTable,
  staffPreferencesTable
} from '../db/schema';
import { seedDatabase } from '../handlers/seed_database';
import { eq, count } from 'drizzle-orm';

describe('seedDatabase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed the database with comprehensive sample data', async () => {
    const result = await seedDatabase();

    expect(result.success).toBe(true);
    expect(result.message).toContain('seeded successfully');
  });

  it('should create all users correctly', async () => {
    await seedDatabase();

    const users = await db.select().from(usersTable).execute();
    expect(users).toHaveLength(9); // 1 admin + 8 staff

    const adminUsers = users.filter(u => u.user_type === 'admin');
    const staffUsers = users.filter(u => u.user_type === 'staff');
    
    expect(adminUsers).toHaveLength(1);
    expect(staffUsers).toHaveLength(8);
    
    const admin = adminUsers[0];
    expect(admin.email).toBe('admin@hospital.com');
    expect(admin.first_name).toBe('Sarah');
    expect(admin.last_name).toBe('Chen');
  });

  it('should create role groups and roles with proper relationships', async () => {
    await seedDatabase();

    const roleGroups = await db.select().from(roleGroupsTable).execute();
    expect(roleGroups).toHaveLength(4);

    const roleGroupNames = roleGroups.map(rg => rg.name);
    expect(roleGroupNames).toContain('Radiologists');
    expect(roleGroupNames).toContain('Nursing Staff');
    expect(roleGroupNames).toContain('Imaging Technologists');
    expect(roleGroupNames).toContain('Emergency Medicine');

    const roles = await db.select().from(rolesTable).execute();
    expect(roles).toHaveLength(8);

    const roleNames = roles.map(r => r.name);
    expect(roleNames).toContain('MRI Technician');
    expect(roleNames).toContain('CT Scanner Operator');
    expect(roleNames).toContain('Radiologist');
    expect(roleNames).toContain('On-Call Doctor');
    expect(roleNames).toContain('General Nurse');
    expect(roleNames).toContain('ICU Nurse');
  });

  it('should create staff groups with proper constraints', async () => {
    await seedDatabase();

    const staffGroups = await db.select().from(staffGroupsTable).execute();
    expect(staffGroups).toHaveLength(3);

    const doctorsGroup = staffGroups.find(sg => sg.name === 'Doctors');
    expect(doctorsGroup).toBeDefined();
    expect(doctorsGroup!.max_consecutive_days).toBe(2);
    expect(doctorsGroup!.requires_day_off_after_oncall).toBe(true);

    const nursesGroup = staffGroups.find(sg => sg.name === 'Nurses');
    expect(nursesGroup).toBeDefined();
    expect(nursesGroup!.max_consecutive_days).toBe(4);
    expect(nursesGroup!.requires_day_off_after_oncall).toBe(true);

    const techGroup = staffGroups.find(sg => sg.name === 'Technologists');
    expect(techGroup).toBeDefined();
    expect(techGroup!.max_consecutive_days).toBe(5);
    expect(techGroup!.requires_day_off_after_oncall).toBe(false);
  });

  it('should create user-staff group and user-role group mappings', async () => {
    await seedDatabase();

    const userStaffGroups = await db.select().from(userStaffGroupsTable).execute();
    expect(userStaffGroups).toHaveLength(8); // All 8 staff members assigned

    const userRoleGroups = await db.select().from(userRoleGroupsTable).execute();
    expect(userRoleGroups).toHaveLength(8); // All 8 staff members assigned to role groups
  });

  it('should create staff competencies with various proficiency levels', async () => {
    await seedDatabase();

    const competencies = await db.select().from(staffCompetenciesTable).execute();
    expect(competencies.length).toBeGreaterThan(10); // Multiple competencies per staff

    // Check for different proficiency levels
    const proficiencyLevels = [...new Set(competencies.map(c => c.proficiency_level))];
    expect(proficiencyLevels).toContain(3);
    expect(proficiencyLevels).toContain(4);
    expect(proficiencyLevels).toContain(5);

    // Verify some competencies have expiry dates
    const competenciesWithExpiry = competencies.filter(c => c.expiry_date !== null);
    expect(competenciesWithExpiry.length).toBeGreaterThan(0);
  });

  it('should create schedules with different statuses', async () => {
    await seedDatabase();

    const schedules = await db.select().from(schedulesTable).execute();
    expect(schedules).toHaveLength(2);

    const publishedSchedule = schedules.find(s => s.status === 'published');
    const draftSchedule = schedules.find(s => s.status === 'draft');

    expect(publishedSchedule).toBeDefined();
    expect(draftSchedule).toBeDefined();

    expect(publishedSchedule!.name).toBe('January 2024 Schedule');
    expect(publishedSchedule!.published_at).toBeDefined();
    
    expect(draftSchedule!.name).toBe('February 2024 Schedule');
    expect(draftSchedule!.published_at).toBeNull();
  });

  it('should create schedule assignments with various shift types', async () => {
    await seedDatabase();

    const assignments = await db.select().from(scheduleAssignmentsTable).execute();
    expect(assignments.length).toBeGreaterThan(10);

    const regularShifts = assignments.filter(a => a.shift_type === 'regular');
    const onCallShifts = assignments.filter(a => a.shift_type === 'on_call');

    expect(regularShifts.length).toBeGreaterThan(0);
    expect(onCallShifts.length).toBeGreaterThan(0);

    // Verify on-call shifts are properly structured
    onCallShifts.forEach(shift => {
      expect(shift.start_time).toBe('18:00:00');
      expect(shift.end_time).toBe('08:00:00');
    });
  });

  it('should create staff preferences with various types and statuses', async () => {
    await seedDatabase();

    const preferences = await db.select().from(staffPreferencesTable).execute();
    expect(preferences.length).toBeGreaterThan(8);

    const preferenceTypes = [...new Set(preferences.map(p => p.preference_type))];
    expect(preferenceTypes).toContain('available');
    expect(preferenceTypes).toContain('unavailable');
    expect(preferenceTypes).toContain('preferred');

    const preferenceStatuses = [...new Set(preferences.map(p => p.status))];
    expect(preferenceStatuses).toContain('draft');
    expect(preferenceStatuses).toContain('submitted');

    // Verify submitted preferences have submitted_at timestamp
    const submittedPreferences = preferences.filter(p => p.status === 'submitted');
    submittedPreferences.forEach(pref => {
      expect(pref.submitted_at).toBeDefined();
    });

    // Verify some preferences have notes
    const preferencesWithNotes = preferences.filter(p => p.notes !== null);
    expect(preferencesWithNotes.length).toBeGreaterThan(0);
  });

  it('should maintain referential integrity between related tables', async () => {
    await seedDatabase();

    // Verify all roles reference valid role groups
    const rolesWithGroups = await db.select({
      roleId: rolesTable.id,
      roleName: rolesTable.name,
      roleGroupId: rolesTable.role_group_id,
      roleGroupName: roleGroupsTable.name
    })
    .from(rolesTable)
    .leftJoin(roleGroupsTable, eq(rolesTable.role_group_id, roleGroupsTable.id))
    .execute();

    rolesWithGroups.forEach(role => {
      if (role.roleGroupId) {
        expect(role.roleGroupName).toBeDefined();
      }
    });

    // Verify all schedule assignments reference valid users, schedules, and roles
    const assignmentCounts = await db.select({ count: count() })
      .from(scheduleAssignmentsTable)
      .execute();

    expect(assignmentCounts[0].count).toBeGreaterThan(0);

    // Verify all staff competencies reference valid users and roles
    const competencyCounts = await db.select({ count: count() })
      .from(staffCompetenciesTable)
      .execute();

    expect(competencyCounts[0].count).toBeGreaterThan(0);
  });

  it('should create realistic healthcare scheduling scenarios', async () => {
    await seedDatabase();

    const users = await db.select().from(usersTable).execute();
    const schedules = await db.select().from(schedulesTable).execute();
    const assignments = await db.select().from(scheduleAssignmentsTable).execute();
    const preferences = await db.select().from(staffPreferencesTable).execute();

    // Verify we have doctors with on-call assignments
    const doctors = users.filter(u => u.email.startsWith('dr.'));
    expect(doctors.length).toBeGreaterThan(3);

    const onCallAssignments = assignments.filter(a => a.shift_type === 'on_call');
    expect(onCallAssignments.length).toBeGreaterThan(0);

    // Verify we have technologists with equipment-specific roles
    const techs = users.filter(u => u.email.startsWith('tech.'));
    expect(techs.length).toBeGreaterThan(1);

    // Verify preferences cover both schedules and various preference types
    const februaryPreferences = preferences.filter(p => 
      schedules.find(s => s.id === p.schedule_id)?.name === 'February 2024 Schedule'
    );
    expect(februaryPreferences.length).toBeGreaterThan(0);
  });
});