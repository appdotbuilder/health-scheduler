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

export const seedDatabase = async (): Promise<{ message: string; success: boolean }> => {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(usersTable).execute();
    if (existingUsers.length > 0) {
      return {
        message: 'Database already contains data, skipping seeding',
        success: true
      };
    }

    // 1. Create Users (1 admin + 8 staff members)
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'admin@hospital.com',
          password_hash: 'hashed_password_admin',
          first_name: 'Sarah',
          last_name: 'Chen',
          user_type: 'admin'
        },
        {
          email: 'dr.martinez@hospital.com',
          password_hash: 'hashed_password_1',
          first_name: 'Carlos',
          last_name: 'Martinez',
          user_type: 'staff'
        },
        {
          email: 'dr.johnson@hospital.com',
          password_hash: 'hashed_password_2',
          first_name: 'Emily',
          last_name: 'Johnson',
          user_type: 'staff'
        },
        {
          email: 'dr.patel@hospital.com',
          password_hash: 'hashed_password_3',
          first_name: 'Raj',
          last_name: 'Patel',
          user_type: 'staff'
        },
        {
          email: 'nurse.williams@hospital.com',
          password_hash: 'hashed_password_4',
          first_name: 'Lisa',
          last_name: 'Williams',
          user_type: 'staff'
        },
        {
          email: 'nurse.brown@hospital.com',
          password_hash: 'hashed_password_5',
          first_name: 'Michael',
          last_name: 'Brown',
          user_type: 'staff'
        },
        {
          email: 'tech.davis@hospital.com',
          password_hash: 'hashed_password_6',
          first_name: 'Jennifer',
          last_name: 'Davis',
          user_type: 'staff'
        },
        {
          email: 'tech.wilson@hospital.com',
          password_hash: 'hashed_password_7',
          first_name: 'David',
          last_name: 'Wilson',
          user_type: 'staff'
        },
        {
          email: 'dr.thompson@hospital.com',
          password_hash: 'hashed_password_8',
          first_name: 'Amanda',
          last_name: 'Thompson',
          user_type: 'staff'
        }
      ])
      .returning()
      .execute();

    // 2. Create Role Groups
    const roleGroups = await db.insert(roleGroupsTable)
      .values([
        {
          name: 'Radiologists',
          description: 'Medical doctors specializing in medical imaging and interpretation'
        },
        {
          name: 'Nursing Staff',
          description: 'Registered nurses and nursing assistants providing patient care'
        },
        {
          name: 'Imaging Technologists',
          description: 'Technical staff operating imaging equipment'
        },
        {
          name: 'Emergency Medicine',
          description: 'Medical professionals handling emergency and urgent care'
        }
      ])
      .returning()
      .execute();

    // 3. Create Roles
    const roles = await db.insert(rolesTable)
      .values([
        {
          name: 'MRI Technician',
          description: 'Operates MRI machines and assists with MRI procedures',
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id
        },
        {
          name: 'CT Scanner Operator',
          description: 'Operates CT scan equipment and manages patient positioning',
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id
        },
        {
          name: 'Radiologist',
          description: 'Interprets medical images and provides diagnostic reports',
          role_group_id: roleGroups.find(rg => rg.name === 'Radiologists')?.id
        },
        {
          name: 'On-Call Doctor',
          description: 'Emergency physician available for urgent consultations',
          role_group_id: roleGroups.find(rg => rg.name === 'Emergency Medicine')?.id
        },
        {
          name: 'General Nurse',
          description: 'Provides general nursing care and patient support',
          role_group_id: roleGroups.find(rg => rg.name === 'Nursing Staff')?.id
        },
        {
          name: 'ICU Nurse',
          description: 'Specialized nursing care for intensive care patients',
          role_group_id: roleGroups.find(rg => rg.name === 'Nursing Staff')?.id
        },
        {
          name: 'Ultrasound Technician',
          description: 'Performs ultrasound examinations and basic interpretations',
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id
        },
        {
          name: 'X-Ray Technician',
          description: 'Performs X-ray imaging procedures',
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id
        }
      ])
      .returning()
      .execute();

    // 4. Create Staff Groups
    const staffGroups = await db.insert(staffGroupsTable)
      .values([
        {
          name: 'Doctors',
          description: 'Medical doctors and physicians',
          max_consecutive_days: 2,
          requires_day_off_after_oncall: true
        },
        {
          name: 'Nurses',
          description: 'Registered nurses and nursing staff',
          max_consecutive_days: 4,
          requires_day_off_after_oncall: true
        },
        {
          name: 'Technologists',
          description: 'Medical imaging and diagnostic technologists',
          max_consecutive_days: 5,
          requires_day_off_after_oncall: false
        }
      ])
      .returning()
      .execute();

    // 5. Assign Users to Staff Groups
    await db.insert(userStaffGroupsTable)
      .values([
        // Doctors
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Doctors')?.id!
        },
        {
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Doctors')?.id!
        },
        {
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Doctors')?.id!
        },
        {
          user_id: users.find(u => u.email === 'dr.thompson@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Doctors')?.id!
        },
        // Nurses
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Nurses')?.id!
        },
        {
          user_id: users.find(u => u.email === 'nurse.brown@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Nurses')?.id!
        },
        // Technologists
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Technologists')?.id!
        },
        {
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          staff_group_id: staffGroups.find(sg => sg.name === 'Technologists')?.id!
        }
      ])
      .execute();

    // 6. Assign Users to Role Groups
    await db.insert(userRoleGroupsTable)
      .values([
        // Radiologists
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Radiologists')?.id!
        },
        {
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Radiologists')?.id!
        },
        // Emergency Medicine
        {
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Emergency Medicine')?.id!
        },
        {
          user_id: users.find(u => u.email === 'dr.thompson@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Emergency Medicine')?.id!
        },
        // Nursing Staff
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Nursing Staff')?.id!
        },
        {
          user_id: users.find(u => u.email === 'nurse.brown@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Nursing Staff')?.id!
        },
        // Imaging Technologists
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id!
        },
        {
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          role_group_id: roleGroups.find(rg => rg.name === 'Imaging Technologists')?.id!
        }
      ])
      .execute();

    // 7. Create Staff Competencies
    await db.insert(staffCompetenciesTable)
      .values([
        // Dr. Martinez - Radiologist competencies
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          proficiency_level: 5,
          certified_date: '2018-03-15',
          expiry_date: '2025-03-15'
        },
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          proficiency_level: 4,
          certified_date: '2019-06-10',
          expiry_date: '2026-06-10'
        },
        // Dr. Johnson - Emergency Medicine
        {
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          proficiency_level: 5,
          certified_date: '2020-01-20',
          expiry_date: '2027-01-20'
        },
        // Dr. Patel - Radiologist
        {
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          proficiency_level: 4,
          certified_date: '2021-09-12',
          expiry_date: '2028-09-12'
        },
        {
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'CT Scanner Operator')?.id!,
          proficiency_level: 3,
          certified_date: '2022-02-28',
          expiry_date: '2029-02-28'
        },
        // Dr. Thompson - Emergency Medicine
        {
          user_id: users.find(u => u.email === 'dr.thompson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          proficiency_level: 4,
          certified_date: '2019-11-05',
          expiry_date: '2026-11-05'
        },
        // Nurse Williams
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'General Nurse')?.id!,
          proficiency_level: 5,
          certified_date: '2017-04-22',
          expiry_date: '2025-04-22'
        },
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'ICU Nurse')?.id!,
          proficiency_level: 4,
          certified_date: '2020-07-30',
          expiry_date: '2027-07-30'
        },
        // Nurse Brown
        {
          user_id: users.find(u => u.email === 'nurse.brown@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'General Nurse')?.id!,
          proficiency_level: 3,
          certified_date: '2022-01-15',
          expiry_date: '2029-01-15'
        },
        // Tech Davis
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          proficiency_level: 5,
          certified_date: '2018-08-14',
          expiry_date: '2025-08-14'
        },
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Ultrasound Technician')?.id!,
          proficiency_level: 4,
          certified_date: '2020-03-18',
          expiry_date: '2027-03-18'
        },
        // Tech Wilson
        {
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'CT Scanner Operator')?.id!,
          proficiency_level: 4,
          certified_date: '2019-12-02',
          expiry_date: '2026-12-02'
        },
        {
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'X-Ray Technician')?.id!,
          proficiency_level: 5,
          certified_date: '2017-05-10',
          expiry_date: '2025-05-10'
        }
      ])
      .execute();

    // 8. Create Schedules
    const schedules = await db.insert(schedulesTable)
      .values([
        {
          name: 'January 2024 Schedule',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          status: 'published',
          created_by_user_id: users.find(u => u.email === 'admin@hospital.com')?.id!,
          published_at: new Date('2023-12-15T10:00:00Z')
        },
        {
          name: 'February 2024 Schedule',
          start_date: '2024-02-01',
          end_date: '2024-02-29',
          status: 'draft',
          created_by_user_id: users.find(u => u.email === 'admin@hospital.com')?.id!
        }
      ])
      .returning()
      .execute();

    // 9. Create Schedule Assignments
    const januarySchedule = schedules.find(s => s.name === 'January 2024 Schedule')!;
    const februarySchedule = schedules.find(s => s.name === 'February 2024 Schedule')!;

    await db.insert(scheduleAssignmentsTable)
      .values([
        // January Schedule - Week 1
        // Dr. Martinez - Regular MRI shifts
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          shift_date: '2024-01-02',
          shift_type: 'regular',
          start_time: '08:00',
          end_time: '17:00'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          shift_date: '2024-01-03',
          shift_type: 'regular',
          start_time: '08:00',
          end_time: '17:00'
        },
        // Dr. Johnson - On-call shifts
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          shift_date: '2024-01-01',
          shift_type: 'on_call',
          start_time: '18:00',
          end_time: '08:00'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          shift_date: '2024-01-04',
          shift_type: 'on_call',
          start_time: '18:00',
          end_time: '08:00'
        },
        // Tech Davis - MRI Tech shifts
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          shift_date: '2024-01-02',
          shift_type: 'regular',
          start_time: '07:30',
          end_time: '16:30'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          shift_date: '2024-01-03',
          shift_type: 'regular',
          start_time: '07:30',
          end_time: '16:30'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          shift_date: '2024-01-04',
          shift_type: 'regular',
          start_time: '07:30',
          end_time: '16:30'
        },
        // Tech Wilson - CT Scanner shifts
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'CT Scanner Operator')?.id!,
          shift_date: '2024-01-02',
          shift_type: 'regular',
          start_time: '06:00',
          end_time: '14:00'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'tech.wilson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'CT Scanner Operator')?.id!,
          shift_date: '2024-01-03',
          shift_type: 'regular',
          start_time: '06:00',
          end_time: '14:00'
        },
        // Nurse Williams - General nursing
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'General Nurse')?.id!,
          shift_date: '2024-01-02',
          shift_type: 'regular',
          start_time: '07:00',
          end_time: '19:00'
        },
        {
          schedule_id: januarySchedule.id,
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'ICU Nurse')?.id!,
          shift_date: '2024-01-05',
          shift_type: 'regular',
          start_time: '19:00',
          end_time: '07:00'
        },
        // February Schedule - Draft assignments
        {
          schedule_id: februarySchedule.id,
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          shift_date: '2024-02-01',
          shift_type: 'regular',
          start_time: '08:00',
          end_time: '17:00'
        },
        {
          schedule_id: februarySchedule.id,
          user_id: users.find(u => u.email === 'dr.thompson@hospital.com')?.id!,
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          shift_date: '2024-02-01',
          shift_type: 'on_call',
          start_time: '18:00',
          end_time: '08:00'
        }
      ])
      .execute();

    // 10. Create Staff Preferences
    await db.insert(staffPreferencesTable)
      .values([
        // Dr. Martinez preferences for February
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-05',
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          shift_type: 'regular',
          preference_type: 'preferred',
          priority: 1,
          status: 'submitted',
          notes: 'Prefer morning shifts on this date',
          submitted_at: new Date('2024-01-15T09:00:00Z')
        },
        {
          user_id: users.find(u => u.email === 'dr.martinez@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-14',
          preference_type: 'unavailable',
          priority: 1,
          status: 'submitted',
          notes: 'Medical conference - unavailable all day',
          submitted_at: new Date('2024-01-15T09:05:00Z')
        },
        // Dr. Johnson preferences
        {
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-10',
          role_id: roles.find(r => r.name === 'On-Call Doctor')?.id!,
          shift_type: 'on_call',
          preference_type: 'available',
          priority: 2,
          status: 'submitted',
          notes: 'Available for emergency on-call coverage',
          submitted_at: new Date('2024-01-18T14:30:00Z')
        },
        {
          user_id: users.find(u => u.email === 'dr.johnson@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-17',
          preference_type: 'unavailable',
          priority: 1,
          status: 'submitted',
          notes: 'Family obligation - not available',
          submitted_at: new Date('2024-01-18T14:35:00Z')
        },
        // Tech Davis preferences
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-08',
          role_id: roles.find(r => r.name === 'MRI Technician')?.id!,
          shift_type: 'regular',
          preference_type: 'preferred',
          priority: 2,
          status: 'submitted',
          notes: 'Prefer to work with Dr. Martinez on MRI cases',
          submitted_at: new Date('2024-01-20T11:15:00Z')
        },
        {
          user_id: users.find(u => u.email === 'tech.davis@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-22',
          role_id: roles.find(r => r.name === 'Ultrasound Technician')?.id!,
          shift_type: 'regular',
          preference_type: 'available',
          priority: 3,
          status: 'draft',
          notes: 'Can cover ultrasound if needed'
        },
        // Nurse Williams preferences
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-12',
          role_id: roles.find(r => r.name === 'ICU Nurse')?.id!,
          shift_type: 'regular',
          preference_type: 'preferred',
          priority: 1,
          status: 'submitted',
          notes: 'Prefer ICU night shift - comfortable with critical patients',
          submitted_at: new Date('2024-01-22T16:45:00Z')
        },
        {
          user_id: users.find(u => u.email === 'nurse.williams@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-19',
          preference_type: 'unavailable',
          priority: 1,
          status: 'submitted',
          notes: 'Continuing education seminar',
          submitted_at: new Date('2024-01-22T16:50:00Z')
        },
        // Nurse Brown preferences
        {
          user_id: users.find(u => u.email === 'nurse.brown@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-15',
          role_id: roles.find(r => r.name === 'General Nurse')?.id!,
          shift_type: 'regular',
          preference_type: 'available',
          priority: 2,
          status: 'submitted',
          notes: 'Happy to cover day shift',
          submitted_at: new Date('2024-01-25T08:20:00Z')
        },
        // Dr. Patel preferences
        {
          user_id: users.find(u => u.email === 'dr.patel@hospital.com')?.id!,
          schedule_id: februarySchedule.id,
          preferred_date: '2024-02-09',
          role_id: roles.find(r => r.name === 'Radiologist')?.id!,
          shift_type: 'regular',
          preference_type: 'preferred',
          priority: 1,
          status: 'submitted',
          notes: 'Prefer to handle complex imaging cases',
          submitted_at: new Date('2024-01-28T13:10:00Z')
        }
      ])
      .execute();

    return {
      message: 'Database seeded successfully with comprehensive healthcare scheduling data',
      success: true
    };
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
};