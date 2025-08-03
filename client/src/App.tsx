
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { UserManagement } from '@/components/UserManagement';
import { RoleManagement } from '@/components/RoleManagement';
import { ScheduleManagement } from '@/components/ScheduleManagement';
import { StaffPreferences } from '@/components/StaffPreferences';
import { StaffScheduleView } from '@/components/StaffScheduleView';
import { CompetencyManagement } from '@/components/CompetencyManagement';
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
      // For demo purposes, simulate a logged-in user (first admin or first user)
      const adminUser = result.find((user: User) => user.user_type === 'admin');
      const demoUser = adminUser || result[0];
      setCurrentUser(demoUser || null);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // User switch for demo purposes
  const switchUser = (user: User) => {
    setCurrentUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Healthcare Scheduling System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-900">🏥 HealthScheduler Pro</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <Badge variant={currentUser.user_type === 'admin' ? 'default' : 'secondary'}>
                    {currentUser.user_type === 'admin' ? '👑 Admin' : '👨‍⚕️ Staff'}
                  </Badge>
                  <span className="text-sm font-medium text-gray-700">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                </div>
              )}
              
              {/* Demo User Switcher */}
              {users.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Demo Mode:</span>
                  {users.slice(0, 3).map((user: User) => (
                    <Button
                      key={user.id}
                      variant={currentUser?.id === user.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => switchUser(user)}
                      className="text-xs"
                    >
                      {user.first_name} ({user.user_type})
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to HealthScheduler Pro</CardTitle>
              <CardDescription>
                Please wait while we load your profile...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                If no users are available, please create some users first using the admin panel.
              </p>
            </CardContent>
          </Card>
        ) : currentUser.user_type === 'admin' ? (
          // Admin Dashboard
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600">
                Manage all aspects of healthcare scheduling including staff, roles, competencies, and schedules.
              </p>
            </div>

            <Tabs defaultValue="schedules" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="schedules" className="text-sm">📅 Schedules</TabsTrigger>
                <TabsTrigger value="users" className="text-sm">👥 Staff</TabsTrigger>
                <TabsTrigger value="roles" className="text-sm">🎯 Roles</TabsTrigger>
                <TabsTrigger value="competencies" className="text-sm">🏆 Competencies</TabsTrigger>
                <TabsTrigger value="preferences" className="text-sm">📝 Preferences</TabsTrigger>
                <TabsTrigger value="reports" className="text-sm">📊 Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="schedules" className="space-y-6">
                <ScheduleManagement currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <UserManagement />
              </TabsContent>

              <TabsContent value="roles" className="space-y-6">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="competencies" className="space-y-6">
                <CompetencyManagement />
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <StaffPreferences currentUser={currentUser} viewMode="admin" />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Scheduling Reports</CardTitle>
                    <CardDescription>
                      Analytics and insights for healthcare scheduling management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Staff Utilization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-blue-600">85%</p>
                          <p className="text-sm text-gray-600">Average utilization rate</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Schedule Compliance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-green-600">92%</p>
                          <p className="text-sm text-gray-600">Preference satisfaction</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Burnout Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-yellow-600">3</p>
                          <p className="text-sm text-gray-600">Staff members at risk</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-4">
                        🔬 <strong>AI Insights:</strong> System automatically monitors workload distribution 
                        and suggests optimizations to prevent staff burnout while maintaining coverage requirements.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Staff Dashboard
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                👨‍⚕️ Staff Dashboard
              </h2>
              <p className="text-gray-600">
                View your schedules and submit availability preferences.
              </p>
            </div>

            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="schedule" className="text-sm">📅 My Schedule</TabsTrigger>
                <TabsTrigger value="preferences" className="text-sm">📝 Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-6">
                <StaffScheduleView currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <StaffPreferences currentUser={currentUser} viewMode="staff" />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
