import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, FileText, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users/')).data });
  const { data: reports, isLoading: reportsLoading } = useQuery({ queryKey: ['reports'], queryFn: async () => (await api.get('/reports/')).data });
  const { data: complaints, isLoading: complaintsLoading } = useQuery({ queryKey: ['complaints'], queryFn: async () => (await api.get('/complaints/')).data });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Monitor system activity, employee reports, and open complaints.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Employees</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
            ) : (
                <div className="text-3xl font-bold mt-2 text-foreground">{users?.filter((u: any) => u.role !== 'admin').length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Active in the system</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-indigo-400/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Reports</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
             {reportsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
            ) : (
                <div className="text-3xl font-bold mt-2 text-foreground">{reports?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Submitted reports</p>
          </CardContent>
        </Card>

        <Card className="group hover:border-orange-400/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Open Complaints</CardTitle>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
             {complaintsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
            ) : (
                <div className="text-3xl font-bold mt-2 text-foreground">{complaints?.filter((c:any) => c.status === 'open').length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2 font-medium">Require admin action</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
