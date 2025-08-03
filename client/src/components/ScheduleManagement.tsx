
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { trpc } from '@/utils/trpc';
import { format } from 'date-fns';
import type { 
  Schedule, 
  CreateScheduleInput, 
  UpdateScheduleStatusInput, 
  User, 
  ScheduleAssignment,
  CreateScheduleAssignmentInput,
  Role 
} from '../../../server/src/schema';

interface ScheduleManagementProps {
  currentUser: User;
}

export function ScheduleManagement({ currentUser }: ScheduleManagementProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const [scheduleFormData, setScheduleFormData] = useState<CreateScheduleInput>({
    name: '',
    start_date: new Date(),
    end_date: new Date()
  });

  const [assignmentFormData, setAssignmentFormData] = useState<CreateScheduleAssignmentInput>({
    schedule_id: 0,
    user_id: 0,
    role_id: 0,
    shift_date: new Date(),
    shift_type: 'regular',
    start_time: '09:00',
    end_time: '17:00'
  });

  const loadData = useCallback(async () => {
    try {
      const [schedulesResult, rolesResult, usersResult] = await Promise.all([
        trpc.getSchedules.query(),
        trpc.getRoles.query(),
        trpc.getUsers.query()
      ]);
      setSchedules(schedulesResult);
      setRoles(rolesResult);
      setUsers(usersResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  const loadAssignments = useCallback(async (scheduleId: number) => {
    try {
      const result = await trpc.getScheduleAssignments.query({ scheduleId });
      setAssignments(result);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedSchedule) {
      loadAssignments(selectedSchedule.id);
      setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({
        ...prev,
        schedule_id: selectedSchedule.id
      }));
    }
  }, [selectedSchedule, loadAssignments]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSchedule.mutate(scheduleFormData);
      setSchedules((prev: Schedule[]) => [...prev, response]);
      setScheduleFormData({
        name: '',
        start_date: new Date(),
        end_date: new Date()
      });
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createScheduleAssignment.mutate(assignmentFormData);
      setAssignments((prev: ScheduleAssignment[]) => [...prev, response]);
      setAssignmentFormData({
        schedule_id: selectedSchedule?.id || 0,
        user_id: 0,
        role_id: 0,
        shift_date: new Date(),
        shift_type: 'regular',
        start_time: '09:00',
        end_time: '17:00'
      });
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to create assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishSchedule = async (schedule: Schedule) => {
    setIsLoading(true);
    try {
      const updateData: UpdateScheduleStatusInput = {
        id: schedule.id,
        status: 'published'
      };
      await trpc.updateScheduleStatus.mutate(updateData);
      setSchedules((prev: Schedule[]) => 
        prev.map((s: Schedule) => 
          s.id === schedule.id ? { ...s, status: 'published' as const, published_at: new Date() } : s
        )
      );
    } catch (error) {
      console.error('Failed to publish schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use currentUser for authorization checks
  const canManageSchedules = currentUser.user_type === 'admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📅 Schedule Management</CardTitle>
              <CardDescription>
                Create, manage, and publish healthcare schedules with AI-powered optimization
              </CardDescription>
            </div>
            {canManageSchedules && (
              <Dialog 
                open={activeDialog === 'schedule'} 
                onOpenChange={(open: boolean) => setActiveDialog(open ? 'schedule' : null)}
              >
                <DialogTrigger asChild>
                  <Button>➕ Create New Schedule</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Schedule</DialogTitle>
                    <DialogDescription>
                      Set up a new scheduling period for your healthcare team
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleScheduleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-name">Schedule Name</Label>
                        <Input
                          id="schedule-name"
                          value={scheduleFormData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setScheduleFormData((prev: CreateScheduleInput) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="e.g., January 2024 Schedule, Q1 Emergency Coverage"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {format(scheduleFormData.start_date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduleFormData.start_date}
                                onSelect={(date: Date | undefined) => 
                                  date && setScheduleFormData((prev: CreateScheduleInput) => ({ ...prev, start_date: date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {format(scheduleFormData.end_date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduleFormData.end_date}
                                onSelect={(date: Date | undefined) => 
                                  date && setScheduleFormData((prev: CreateScheduleInput) => ({ ...prev, end_date: date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Schedule'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No schedules created yet</p>
              <p className="text-sm text-gray-400">
                🔬 <strong>AI Integration:</strong> Once you create schedules, the system will use AI to optimize 
                assignments based on staff preferences, competencies, and burnout prevention rules.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule: Schedule) => (
                <Card key={schedule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{schedule.name}</h3>
                      <p className="text-sm text-gray-600">
                        {format(schedule.start_date, 'MMM dd')} - {format(schedule.end_date, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'}>
                        {schedule.status === 'published' ? '✅ Published' : '📝 Draft'}
                      </Badge>
                      {schedule.status === 'draft' && canManageSchedules && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishSchedule(schedule)}
                          disabled={isLoading}
                        >
                          Publish
                        </Button>
                      )}
                      {canManageSchedules && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSchedule && canManageSchedules && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>🗓️ {selectedSchedule.name} - Assignments</CardTitle>
                <CardDescription>
                  Manage individual staff assignments and shifts
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog 
                  open={activeDialog === 'assignment'} 
                  onOpenChange={(open: boolean) => setActiveDialog(open ? 'assignment' : null)}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">➕ Add Assignment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Assignment</DialogTitle>
                      <DialogDescription>
                        Assign a staff member to a specific role and shift
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignmentSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Staff Member</Label>
                          <Select 
                            value={assignmentFormData.user_id > 0 ? assignmentFormData.user_id.toString() : 'unselected'} 
                            onValueChange={(value: string) => {
                              if (value !== 'unselected') {
                                setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ 
                                  ...prev, 
                                  user_id: parseInt(value) 
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unselected" disabled>Select staff member</SelectItem>
                              {users.map((user: User) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select 
                            value={assignmentFormData.role_id > 0 ? assignmentFormData.role_id.toString() : 'unselected'} 
                            onValueChange={(value: string) => {
                              if (value !== 'unselected') {
                                setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ 
                                  ...prev, 
                                  role_id: parseInt(value) 
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unselected" disabled>Select role</SelectItem>
                              {roles.map((role: Role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Shift Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {format(assignmentFormData.shift_date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={assignmentFormData.shift_date}
                                onSelect={(date: Date | undefined) => 
                                  date && setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ ...prev, shift_date: date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Shift Type</Label>
                          <Select 
                            value={assignmentFormData.shift_type} 
                            onValueChange={(value: 'regular' | 'on_call') => 
                              setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ 
                                ...prev, 
                                shift_type: value 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">📅 Regular Shift</SelectItem>
                              <SelectItem value="on_call">🚨 On-Call</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={assignmentFormData.start_time}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ 
                                  ...prev, 
                                  start_time: e.target.value 
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={assignmentFormData.end_time}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setAssignmentFormData((prev: CreateScheduleAssignmentInput) => ({ 
                                  ...prev, 
                                  end_time: e.target.value 
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Assignment'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={() => setSelectedSchedule(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No assignments created yet</p>
                <p className="text-sm text-gray-400">
                  🤖 <strong>AI Suggestion:</strong> Add staff assignments to begin optimizing schedules 
                  based on competencies and preferences.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment: ScheduleAssignment) => {
                  const assignedUser = users.find((u: User) => u.id === assignment.user_id);
                  const assignedRole = roles.find((r: Role) => r.id === assignment.role_id);
                  
                  return (
                    <Card key={assignment.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Unknown User'}
                            </span>
                            <Badge variant="outline">
                              {assignedRole?.name || 'Unknown Role'}
                            </Badge>
                            <Badge variant={assignment.shift_type === 'on_call' ? 'destructive' : 'default'}>
                              {assignment.shift_type === 'on_call' ? '🚨 On-Call' : '📅 Regular'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {format(assignment.shift_date, 'PPP')} • {assignment.start_time} - {assignment.end_time}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
