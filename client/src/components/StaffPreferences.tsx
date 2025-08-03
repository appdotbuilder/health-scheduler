
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { trpc } from '@/utils/trpc';
import { format } from 'date-fns';
import type { 
  User, 
  Schedule, 
  StaffPreference, 
  CreateStaffPreferenceInput,
  Role,
  SubmitStaffPreferencesInput
} from '../../../server/src/schema';

interface StaffPreferencesProps {
  currentUser: User;
  viewMode: 'admin' | 'staff';
}

export function StaffPreferences({ currentUser, viewMode }: StaffPreferencesProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [preferences, setPreferences] = useState<StaffPreference[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateStaffPreferenceInput>({
    schedule_id: 0,
    preferred_date: new Date(),
    role_id: null,
    shift_type: null,
    preference_type: 'available',
    priority: 3,
    notes: null
  });

  

  const loadSchedules = useCallback(async () => {
    try {
      const result = await trpc.getSchedules.query(
        viewMode === 'staff' 
          ? { user_id: currentUser.id, status: 'published' }
          : undefined
      );
      setSchedules(result);
      if (result.length > 0 && !selectedSchedule) {
        setSelectedSchedule(result[0]);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }, [currentUser.id, viewMode, selectedSchedule]);

  const loadPreferences = useCallback(async () => {
    if (!selectedSchedule) return;
    
    try {
      const result = await trpc.getStaffPreferences.query({
        schedule_id: selectedSchedule.id,
        user_id: viewMode === 'staff' ? currentUser.id : undefined
      });
      setPreferences(result);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, [selectedSchedule, currentUser.id, viewMode]);

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
    loadPreferences();
    if (selectedSchedule) {
      setFormData((prev: CreateStaffPreferenceInput) => ({
        ...prev,
        schedule_id: selectedSchedule.id
      }));
    }
  }, [selectedSchedule, loadPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createStaffPreference.mutate(formData);
      setPreferences((prev: StaffPreference[]) => [...prev, response]);
      setFormData({
        schedule_id: selectedSchedule?.id || 0,
        preferred_date: new Date(),
        role_id: null,
        shift_type: null,
        preference_type: 'available',
        priority: 3,
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPreferences = async () => {
    const draftPreferences = preferences.filter((p: StaffPreference) => p.status === 'draft');
    if (draftPreferences.length === 0) return;

    setIsLoading(true);
    try {
      const submitData: SubmitStaffPreferencesInput = {
        preference_ids: draftPreferences.map((p: StaffPreference) => p.id)
      };
      await trpc.submitStaffPreferences.mutate(submitData);
      // Reload preferences to show updated status
      loadPreferences();
    } catch (error) {
      console.error('Failed to submit preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPreferenceIcon = (type: string) => {
    switch (type) {
      case 'available': return '✅';
      case 'unavailable': return '❌';
      case 'preferred': return '⭐';
      default: return '❓';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {viewMode === 'admin' ? '📝 Staff Preferences Overview' : '📝 My Availability Preferences'}
              </CardTitle>
              <CardDescription>
                {viewMode === 'admin' 
                  ? 'Review and manage staff availability preferences for scheduling optimization'
                  : 'Submit your availability and shift preferences to help create optimal schedules'
                }
              </CardDescription>
            </div>
            
            {schedules.length > 0 && (
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">
                {viewMode === 'admin' 
                  ? 'No schedules available for preference management'
                  : 'No published schedules available for preference submission'
                }
              </p>
              <p className="text-sm text-gray-400">
                {viewMode === 'admin' 
                  ? 'Create and publish schedules to allow staff to submit preferences'
                  : 'Wait for administrators to publish schedules before submitting preferences'
                }
              </p>
            </div>
          ) : !selectedSchedule ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a schedule to view preferences</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions for staff */}
              {viewMode === 'staff' && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-blue-900">Submit Your Preferences</h3>
                    <p className="text-sm text-blue-700">
                      Help us create better schedules by sharing your availability and preferences
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>➕ Add Preference</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Availability Preference</DialogTitle>
                          <DialogDescription>
                            Specify your availability, preferences, or unavailable dates
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    {format(formData.preferred_date, 'PPP')}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={formData.preferred_date}
                                    onSelect={(date: Date | undefined) => 
                                      date && setFormData((prev: CreateStaffPreferenceInput) => ({ ...prev, preferred_date: date }))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Preference Type</Label>
                              <Select 
                                value={formData.preference_type} 
                                onValueChange={(value: 'available' | 'unavailable' | 'preferred') => 
                                  setFormData((prev: CreateStaffPreferenceInput) => ({ ...prev, preference_type: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">✅ Available</SelectItem>
                                  <SelectItem value="preferred">⭐ Preferred</SelectItem>
                                  <SelectItem value="unavailable">❌ Unavailable</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Role (Optional)</Label>
                              <Select 
                                value={formData.role_id?.toString() || ''} 
                                onValueChange={(value: string) => 
                                  setFormData((prev: CreateStaffPreferenceInput) => ({ 
                                    ...prev, 
                                    role_id: value ? parseInt(value) : null 
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Any role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role: Role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Shift Type (Optional)</Label>
                              <Select 
                                value={formData.shift_type || ''} 
                                onValueChange={(value: string) => 
                                  setFormData((prev: CreateStaffPreferenceInput) => ({ 
                                    ...prev, 
                                    shift_type: (value === 'regular' || value === 'on_call') ? value : null
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Any shift type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="regular">📅 Regular Shift</SelectItem>
                                  <SelectItem value="on_call">🚨 On-Call</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Priority (1-5)</Label>
                              <Select 
                                value={formData.priority?.toString() || '3'} 
                                onValueChange={(value: string) => 
                                  setFormData((prev: CreateStaffPreferenceInput) => ({ 
                                    ...prev, 
                                    priority: parseInt(value) 
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 - Low Priority</SelectItem>
                                  <SelectItem value="2">2 - Low-Medium</SelectItem>
                                  <SelectItem value="3">3 - Medium</SelectItem>
                                  <SelectItem value="4">4 - High</SelectItem>
                                  <SelectItem value="5">5 - Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Notes (Optional)</Label>
                              <Textarea
                                value={formData.notes || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setFormData((prev: CreateStaffPreferenceInput) => ({ 
                                    ...prev, 
                                    notes: e.target.value || null 
                                  }))
                                }
                                placeholder="Additional details about your preference"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Adding...' : 'Add Preference'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    {preferences.some((p: StaffPreference) => p.status === 'draft') && (
                      <Button 
                        variant="default"
                        onClick={handleSubmitPreferences}
                        disabled={isLoading}
                      >
                        📤 Submit All Preferences
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Preferences List */}
              <div className="space-y-3">
                {preferences.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">
                      {viewMode === 'admin' 
                        ? 'No staff preferences submitted yet'
                        : 'No preferences added yet'
                      }
                    </p>
                    <p className="text-sm text-gray-400">
                      {viewMode === 'staff' && 'Add your first preference to get started'}
                    </p>
                  </div>
                ) : (
                  preferences.map((preference: StaffPreference) => {
                    const role = roles.find((r: Role) => r.id === preference.role_id);
                    
                    return (
                      <Card key={preference.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {getPreferenceIcon(preference.preference_type)}
                              </span>
                              <span className="font-medium">
                                {format(preference.preferred_date, 'PPP')}
                              </span>
                              <Badge variant="outline">
                                {preference.preference_type}
                              </Badge>
                              {role && (
                                <Badge variant="secondary">
                                  {role.name}
                                </Badge>
                              )}
                              {preference.shift_type && (
                                <Badge variant={preference.shift_type === 'on_call' ? 'destructive' : 'default'}>
                                  {preference.shift_type === 'on_call' ? '🚨 On-Call' : '📅 Regular'}
                                </Badge>
                              )}
                            </div>
                            {preference.notes && (
                              <p className="text-sm text-gray-600">{preference.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getPriorityColor(preference.priority)}`}>
                              Priority {preference.priority}
                            </span>
                            <Badge variant={preference.status === 'submitted' ? 'default' : 'secondary'}>
                              {preference.status === 'submitted' ? '📤 Submitted' : '📝 Draft'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {preferences.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    🤖 <strong>AI Optimization:</strong> Your preferences are used by our AI system to create 
                    optimal schedules while considering workload balance, competencies, and burnout prevention.
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
