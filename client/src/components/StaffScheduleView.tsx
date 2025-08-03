
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { User, Schedule, ScheduleAssignment, Role } from '../../../server/src/schema';

interface StaffScheduleViewProps {
  currentUser: User;
}

export function StaffScheduleView({ currentUser }: StaffScheduleViewProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadSchedules = useCallback(async () => {
    try {
      const result = await trpc.getSchedules.query({
        user_id: currentUser.id,
        status: 'published'
      });
      setSchedules(result);
      if (result.length > 0 && !selectedSchedule) {
        setSelectedSchedule(result[0]);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }, [currentUser.id, selectedSchedule]);

  const loadAssignments = useCallback(async () => {
    if (!selectedSchedule) return;
    
    try {
      const result = await trpc.getScheduleAssignments.query({
        scheduleId: selectedSchedule.id,
        userId: currentUser.id
      });
      setAssignments(result);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, [selectedSchedule, currentUser.id]);

  const loadRoles = useCallback(async () => {
    try {
      const result = await trpc.getRoles.query();
      setRoles(result);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadRoles();
  }, [loadSchedules, loadRoles]);

  useEffect(() => {
    loadAssignments();
  }, [selectedSchedule, loadAssignments]);

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter((assignment: ScheduleAssignment) =>
      isSameDay(assignment.shift_date, date)
    );
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find((r: Role) => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  const getTotalHoursThisWeek = () => {
    const weekDays = getWeekDays();
    let totalMinutes = 0;
    
    weekDays.forEach((day: Date) => {
      const dayAssignments = getAssignmentsForDate(day);
      dayAssignments.forEach((assignment: ScheduleAssignment) => {
        const [startHour, startMin] = assignment.start_time.split(':').map(Number);
        const [endHour, endMin] = assignment.end_time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        totalMinutes += endMinutes - startMinutes;
      });
    });
    
    return Math.round(totalMinutes / 60 * 100) / 100; // Round to 2 decimal places
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📅 My Schedule</CardTitle>
              <CardDescription>
                View your published work schedule and assignments
              </CardDescription>
            </div>
            
            {schedules.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Schedule:</Label>
                  <Select 
                    value={selectedSchedule?.id.toString() || ''} 
                    onValueChange={(value: string) => {
                      const schedule = schedules.find((s: Schedule) => s.id === parseInt(value));
                      setSelectedSchedule(schedule || null);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map((schedule: Schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">View:</Label>
                  <Select 
                    value={viewMode} 
                    onValueChange={(value: 'week' | 'month') => setViewMode(value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No published schedules available</p>
              <p className="text-sm text-gray-400">
                Your schedule will appear here once it's published by the administrators
              </p>
            </div>
          ) : !selectedSchedule ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a schedule to view your assignments</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Week Summary */}
              {viewMode === 'week' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{getTotalHoursThisWeek()}</p>
                    <p className="text-sm text-blue-700">Hours This Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {assignments.filter((a: ScheduleAssignment) => a.shift_type === 'regular').length}
                    </p>
                    <p className="text-sm text-green-700">Regular Shifts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {assignments.filter((a: ScheduleAssignment) => a.shift_type === 'on_call').length}
                    </p>
                    <p className="text-sm text-orange-700">On-Call Assignments</p>
                  </div>
                </div>
              )}

              {/* Schedule Grid */}
              {viewMode === 'week' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {getWeekDays().map((day: Date) => {
                      const dayAssignments = getAssignmentsForDate(day);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <Card key={day.toISOString()} className={`p-3 ${isToday ? 'border-blue-300 bg-blue-50' : ''}`}>
                          <div className="text-center mb-2">
                            <p className="text-sm font-medium">{format(day, 'EEE')}</p>
                            <p className={`text-lg ${isToday ? 'font-bold text-blue-600' : ''}`}>
                              {format(day, 'd')}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            {dayAssignments.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center">No shifts</p>
                            ) : (
                              dayAssignments.map((assignment: ScheduleAssignment) => (
                                <div key={assignment.id} className="space-y-1">
                                  <Badge 
                                    variant={assignment.shift_type === 'on_call' ? 'destructive' : 'default'}
                                    className="w-full text-xs"
                                  >
                                    {assignment.shift_type === 'on_call' ? '🚨' : '📅'} {getRoleName(assignment.role_id)}
                                  </Badge>
                                  <p className="text-xs text-gray-600 text-center">
                                    {assignment.start_time} - {assignment.end_time}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Month view - simplified list
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">All Assignments</h3>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No assignments in this schedule</p>
                    </div>
                  ) : (
                    assignments
                      .sort((a: ScheduleAssignment, b: ScheduleAssignment) => 
                        a.shift_date.getTime() - b.shift_date.getTime()
                      )
                      .map((assignment: ScheduleAssignment) => (
                        <Card key={assignment.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {format(assignment.shift_date, 'EEEE, MMM dd, yyyy')}
                                </span>
                                <Badge variant={assignment.shift_type === 'on_call' ? 'destructive' : 'default'}>
                                  {assignment.shift_type === 'on_call' ? '🚨 On-Call' : '📅 Regular'}
                                </Badge>
                                <Badge variant="outline">
                                  {getRoleName(assignment.role_id)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {assignment.start_time} - {assignment.end_time}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              )}

              {assignments.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    💡 <strong>Schedule Optimization:</strong> Your schedule has been optimized using AI to balance 
                    workload, consider your preferences, and ensure compliance with healthcare regulations.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
