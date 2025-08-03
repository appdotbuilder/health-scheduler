
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { Role, RoleGroup, StaffGroup, CreateRoleInput, CreateRoleGroupInput, CreateStaffGroupInput } from '../../../server/src/schema';

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const [roleFormData, setRoleFormData] = useState<CreateRoleInput>({
    name: '',
    description: null
  });

  const [roleGroupFormData, setRoleGroupFormData] = useState<CreateRoleGroupInput>({
    name: '',
    description: null
  });

  const [staffGroupFormData, setStaffGroupFormData] = useState<CreateStaffGroupInput>({
    name: '',
    description: null,
    max_consecutive_days: null,
    requires_day_off_after_oncall: false
  });

  const loadData = useCallback(async () => {
    try {
      const [rolesResult, roleGroupsResult, staffGroupsResult] = await Promise.all([
        trpc.getRoles.query(),
        trpc.getRoleGroups.query(),
        trpc.getStaffGroups.query()
      ]);
      setRoles(rolesResult);
      setRoleGroups(roleGroupsResult);
      setStaffGroups(staffGroupsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createRole.mutate(roleFormData);
      setRoles((prev: Role[]) => [...prev, response]);
      setRoleFormData({ name: '', description: null });
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createRoleGroup.mutate(roleGroupFormData);
      setRoleGroups((prev: RoleGroup[]) => [...prev, response]);
      setRoleGroupFormData({ name: '', description: null });
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to create role group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createStaffGroup.mutate(staffGroupFormData);
      setStaffGroups((prev: StaffGroup[]) => [...prev, response]);
      setStaffGroupFormData({
        name: '',
        description: null,
        max_consecutive_days: null,
        requires_day_off_after_oncall: false
      });
      setActiveDialog(null);
    } catch (error) {
      console.error('Failed to create staff group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎯 Role & Group Management</CardTitle>
          <CardDescription>
            Define roles, role groups, and staff groups to organize your healthcare team effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles">🎯 Roles</TabsTrigger>
              <TabsTrigger value="role-groups">👥 Role Groups</TabsTrigger>
              <TabsTrigger value="staff-groups">🏥 Staff Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Healthcare Roles</h3>
                  <p className="text-sm text-gray-600">Individual roles like MRI, CT, On-Call, etc.</p>
                </div>
                <Dialog 
                  open={activeDialog === 'role'} 
                  onOpenChange={(open: boolean) => setActiveDialog(open ? 'role' : null)}
                >
                  <DialogTrigger asChild>
                    <Button>➕ Add Role</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Define a specific healthcare role (e.g., MRI, CT, Emergency On-Call)
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRoleSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="role-name">Role Name</Label>
                          <Input
                            id="role-name"
                            value={roleFormData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRoleFormData((prev: CreateRoleInput) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., MRI Technician, CT Scanner, On-Call"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role-description">Description (Optional)</Label>
                          <Textarea
                            id="role-description"
                            value={roleFormData.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setRoleFormData((prev: CreateRoleInput) => ({ 
                                ...prev, 
                                description: e.target.value || null 
                              }))
                            }
                            placeholder="Describe the responsibilities and requirements"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Role'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3">
                {roles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No roles defined yet</p>
                    <p className="text-sm text-gray-400">
                      🔬 Create roles like MRI, CT, On-Call to start organizing your team
                    </p>
                  </div>
                ) : (
                  roles.map((role: Role) => (
                    <Card key={role.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          {role.description && (
                            <p className="text-sm text-gray-600">{role.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          Created {role.created_at.toLocaleDateString()}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="role-groups" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Role Groups</h3>
                  <p className="text-sm text-gray-600">Group roles by specialty (e.g., Radiologists, Emergency)</p>
                </div>
                <Dialog 
                  open={activeDialog === 'role-group'} 
                  onOpenChange={(open: boolean) => setActiveDialog(open ? 'role-group' : null)}
                >
                  <DialogTrigger asChild>
                    <Button>➕ Add Role Group</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Role Group</DialogTitle>
                      <DialogDescription>
                        Group related roles by specialty or department
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRoleGroupSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="rolegroup-name">Group Name</Label>
                          <Input
                            id="rolegroup-name"
                            value={roleGroupFormData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRoleGroupFormData((prev: CreateRoleGroupInput) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., Radiologists, Emergency Team"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rolegroup-description">Description (Optional)</Label>
                          <Textarea
                            id="rolegroup-description"
                            value={roleGroupFormData.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setRoleGroupFormData((prev: CreateRoleGroupInput) => ({ 
                                ...prev, 
                                description: e.target.value || null 
                              }))
                            }
                            placeholder="Describe this role group and its purpose"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Role Group'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3">
                {roleGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No role groups defined yet</p>
                    <p className="text-sm text-gray-400">
                      👥 Create role groups like Radiologists, Emergency Team to organize specialties
                    </p>
                  </div>
                ) : (
                  roleGroups.map((group: RoleGroup) => (
                    <Card key={group.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-gray-600">{group.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          Created {group.created_at.toLocaleDateString()}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="staff-groups" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Staff Groups</h3>
                  <p className="text-sm text-gray-600">Professional categories with scheduling rules (Doctors, Nurses)</p>
                </div>
                <Dialog 
                  open={activeDialog === 'staff-group'} 
                  onOpenChange={(open: boolean) => setActiveDialog(open ? 'staff-group' : null)}
                >
                  <DialogTrigger asChild>
                    <Button>➕ Add Staff Group</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Staff Group</DialogTitle>
                      <DialogDescription>
                        Define professional categories with specific scheduling constraints
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleStaffGroupSubmit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="staffgroup-name">Group Name</Label>
                          <Input
                            id="staffgroup-name"
                            value={staffGroupFormData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStaffGroupFormData((prev: CreateStaffGroupInput) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., Doctors, Nurses, Technicians"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staffgroup-description">Description (Optional)</Label>
                          <Textarea
                            id="staffgroup-description"
                            value={staffGroupFormData.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setStaffGroupFormData((prev: CreateStaffGroupInput) => ({ 
                                ...prev, 
                                description: e.target.value || null 
                              }))
                            }
                            placeholder="Describe this staff group"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-consecutive">Max Consecutive Days (Optional)</Label>
                          <Input
                            id="max-consecutive"
                            type="number"
                            value={staffGroupFormData.max_consecutive_days || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStaffGroupFormData((prev: CreateStaffGroupInput) => ({ 
                                ...prev, 
                                max_consecutive_days: e.target.value ? parseInt(e.target.value) : null 
                              }))
                            }
                            placeholder="e.g., 2 for doctors"
                            min="1"
                          />
                          <p className="text-xs text-gray-500">
                            Limits consecutive work days to prevent burnout
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="day-off-oncall"
                            checked={staffGroupFormData.requires_day_off_after_oncall || false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStaffGroupFormData((prev: CreateStaffGroupInput) => ({ 
                                ...prev, 
                                requires_day_off_after_oncall: e.target.checked 
                              }))
                            }
                            className="rounded"
                          />
                          <Label htmlFor="day-off-oncall" className="text-sm">
                            Requires day off after on-call assignment
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Staff Group'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-3">
                {staffGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No staff groups defined yet</p>
                    <p className="text-sm text-gray-400">
                      🏥 Create staff groups like Doctors, Nurses with scheduling constraints
                    </p>
                  </div>
                ) : (
                  staffGroups.map((group: StaffGroup) => (
                    <Card key={group.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {group.max_consecutive_days && (
                              <span>📅 Max {group.max_consecutive_days} consecutive days</span>
                            )}
                            {group.requires_day_off_after_oncall && (
                              <span>🛏️ Day off after on-call</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          Created {group.created_at.toLocaleDateString()}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
