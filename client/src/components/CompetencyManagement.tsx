
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { trpc }  from '@/utils/trpc';
import { format } from 'date-fns';
import type { 
  User, 
  Role, 
  StaffCompetency, 
  CreateStaffCompetencyInput 
} from '../../../server/src/schema';

export function CompetencyManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [competencies, setCompetencies] = useState<StaffCompetency[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateStaffCompetencyInput>({
    user_id: 0,
    role_id: 0,
    proficiency_level: 3,
    certified_date: null,
    expiry_date: null
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result.filter((user: User) => user.user_type === 'staff'));
      if (result.length > 0 && !selectedUser) {
        const staffUsers = result.filter((user: User) => user.user_type === 'staff');
        setSelectedUser(staffUsers[0] || null);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [selectedUser]);

  const loadRoles = useCallback(async () => {
    try {
      const result = await trpc.getRoles.query();
      setRoles(result);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  }, []);

  const loadCompetencies = useCallback(async () => {
    try {
      const result = await trpc.getStaffCompetencies.query(
        selectedUser ? { userId: selectedUser.id } : undefined
      );
      setCompetencies(result);
    } catch (error) {
      console.error('Failed to load competencies:', error);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  useEffect(() => {
    loadCompetencies();
    if (selectedUser) {
      setFormData((prev: CreateStaffCompetencyInput) => ({
        ...prev,
        user_id: selectedUser.id
      }));
    }
  }, [selectedUser, loadCompetencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createStaffCompetency.mutate(formData);
      setCompetencies((prev: StaffCompetency[]) => [...prev, response]);
      setFormData({
        user_id: selectedUser?.id || 0,
        role_id: 0,
        proficiency_level: 3,
        certified_date: null,
        expiry_date: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create competency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProficiencyLabel = (level: number) => {
    const labels = {
      1: '🔴 Beginner',
      2: '🟡 Basic',
      3: '🟢 Competent',
      4: '🔵 Proficient',
      5: '🟣 Expert'
    };
    return labels[level as keyof typeof labels] || 'Unknown';
  };

  const getProficiencyColor = (level: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find((r: Role) => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  const isExpiringSoon = (expiryDate: Date | null) => {
    if (!expiryDate) return false;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate <= thirtyDaysFromNow;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🏆 Staff Competency Management</CardTitle>
              <CardDescription>
                Track and manage staff certifications, skills, and proficiency levels for optimal scheduling
              </CardDescription>
            </div>
            
            {users.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Staff Member:</Label>
                  <Select 
                    value={selectedUser?.id.toString() || ''} 
                    onValueChange={(value: string) => {
                      const user = users.find((u: User) => u.id === parseInt(value));
                      setSelectedUser(user || null);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: User) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedUser}>➕ Add Competency</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Staff Competency</DialogTitle>
                      <DialogDescription>
                        Record a new competency or certification for {selectedUser?.first_name} {selectedUser?.last_name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select 
                            value={formData.role_id.toString()} 
                            onValueChange={(value: string) => 
                              setFormData((prev: CreateStaffCompetencyInput) => ({ 
                                ...prev, 
                                role_id: parseInt(value) 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
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
                          <Label>Proficiency Level</Label>
                          <Select 
                            value={formData.proficiency_level.toString()} 
                            onValueChange={(value: string) => 
                              setFormData((prev: CreateStaffCompetencyInput) => ({ 
                                ...prev, 
                                proficiency_level: parseInt(value) 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">🔴 1 - Beginner</SelectItem>
                              <SelectItem value="2">🟡 2 - Basic</SelectItem>
                              <SelectItem value="3">🟢 3 - Competent</SelectItem>
                              <SelectItem value="4">🔵 4 - Proficient</SelectItem>
                              <SelectItem value="5">🟣 5 - Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Certified Date (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {formData.certified_date ? format(formData.certified_date, 'PPP') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.certified_date || undefined}
                                onSelect={(date: Date | undefined) => 
                                  setFormData((prev: CreateStaffCompetencyInput) => ({ 
                                    ...prev, 
                                    certified_date: date || null 
                                  }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Expiry Date (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                {formData.expiry_date ? format(formData.expiry_date, 'PPP') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.expiry_date || undefined}
                                onSelect={(date: Date | undefined) => 
                                  setFormData((prev: CreateStaffCompetencyInput) => ({ 
                                    ...prev, 
                                    expiry_date: date || null 
                                  }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Adding...' : 'Add Competency'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No staff members found</p>
              <p className="text-sm text-gray-400">
                Create staff members first to manage their competencies
              </p>
            </div>
          ) : !selectedUser ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a staff member to view their competencies</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Staff Member Profile */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-700">
                      {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <p className="text-blue-700">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Competencies List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Competencies</h3>
                
                {competencies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No competencies recorded yet</p>
                    <p className="text-sm text-gray-400">
                      Add competencies to track this staff member's skills and certifications
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {competencies.map((competency: StaffCompetency) => (
                      <Card key={competency.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{getRoleName(competency.role_id)}</h4>
                              <Badge className={getProficiencyColor(competency.proficiency_level)}>
                                {getProficiencyLabel(competency.proficiency_level)}
                              </Badge>
                              {competency.expiry_date && isExpiringSoon(competency.expiry_date) && (
                                <Badge variant="destructive">
                                  ⚠️ Expiring Soon
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {competency.certified_date && (
                                <span>📅 Certified: {format(competency.certified_date, 'MMM dd, yyyy')}</span>
                              )}
                              {competency.expiry_date && (
                                <span className={isExpiringSoon(competency.expiry_date) ? 'text-red-600 font-medium' : ''}>
                                  🗓️ Expires: {format(competency.expiry_date, 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              Added {format(competency.created_at, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {competencies.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎯 <strong>Smart Scheduling:</strong> The AI scheduler uses competency data to ensure 
                    only qualified staff are assigned to specific roles, while balancing proficiency levels 
                    across shifts for optimal patient care.
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
