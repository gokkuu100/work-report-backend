import { useAuthStore } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Profile() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 pt-4 animate-in fade-in max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      
      <Card>
        <CardHeader>
            <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base font-semibold">{user?.name}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base font-semibold">{user?.email}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-base font-semibold capitalize">{user?.role}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-base font-semibold capitalize">{user?.status}</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
