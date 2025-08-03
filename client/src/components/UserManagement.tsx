
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, StaffGroup, RoleGroup } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'staff',
    staff_group_id: undefined,
    role_group_id: undefined
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const [staffGroupsResult, roleGroupsResult] = await Promise.all([
        trpc.getStaffGroups.query(),
        trpc.getRoleGroups.query()
      ]);
      setStaffGroups(staffGroupsResult);
      setRoleGroups(roleGroupsResult);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, [loadUsers, loadGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createUser.mutate(formData);
      setUsers((prev: User[]) => [...prev, response]);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'staff',
        staff_group_id: undefined,
        role_group_id: undefined
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>👥 Staff Management</CardTitle>
              <CardDescription>
                Manage healthcare staff members, their roles, and access permissions
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>➕ Add New Staff Member</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>
                    Create a new healthcare professional account
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        minLength={8}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="user_type">User Type</Label>
                      <Select 
                        value={formData.user_type || 'staff'} 
                        onValueChange={(value: 'admin' | 'staff') => 
                          setFormData((prev: CreateUserInput) => ({ ...prev, user_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">👨‍⚕️ Staff</SelectItem>
                          <SelectItem value="admin">👑 Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {staffGroups.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="staff_group">Staff Group (Optional)</Label>
                        <Select 
                          value={formData.staff_group_id?.toString() || 'unassigned'} 
                          onValueChange={(value: string) => 
                            setFormData((prev: CreateUserInput) => ({ 
                              ...prev, 
                              staff_group_id: value === 'unassigned' ? undefined : parseInt(value) 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">No staff group</SelectItem>
                            {staffGroups.map((group: StaffGroup) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {roleGroups.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="role_group">Role Group (Optional)</Label>
                        <Select 
                          value={formData.role_group_id?.toString() || 'unassigned'} 
                          onValueChange={(value: string) => 
                            setFormData((prev: CreateUserInput) => ({ 
                              ...prev, 
                              role_group_id: value === 'unassigned' ? undefined : parseInt(value) 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">No role group</SelectItem>
                            {roleGroups.map((group: RoleGroup) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Staff Member'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No staff members found. Create your first staff member!</p>
              <p className="text-sm text-gray-400">
                🔬 <strong>Note:</strong> This is using placeholder data. 
                In a real implementation, staff data would be loaded from the database.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user: User) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.user_type === 'admin' ? 'default' : 'secondary'}>
                        {user.user_type === 'admin' ? '👑 Admin' : '👨‍⚕️ Staff'}
                      </Badge>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                      <p className="text-xs text-gray-400">
                        Joined {user.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {users.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Getting Started:</strong> Add staff members to begin managing schedules. 
                You can assign them to different staff groups (Doctors, Nurses) and role groups (Radiologists, Emergency).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
