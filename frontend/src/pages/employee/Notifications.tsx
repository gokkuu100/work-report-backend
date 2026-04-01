import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/me');
      return data;
    }
  });

  const dismissMutation = useMutation({
      mutationFn: async (id: number) => {
          await api.post(`/notifications/${id}/read`);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" /> Notifications
        </h1>
        <p className="text-muted-foreground text-sm">Review announcements and alerts sent by the administrative team.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded-xl"></div>
        ) : !notifications || notifications.length === 0 ? (
            <div className="py-12 text-center bg-muted/20 border border-dashed rounded-xl">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground text-sm font-medium">You have zero unread notifications. All caught up!</p>
            </div>
        ) : (
            notifications.map((n: any) => (
                <Card key={n.id} className="relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardContent className="p-5 flex gap-5 items-start">
                        <div className="shrink-0 mt-1 bg-blue-100 p-2.5 rounded-full">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2 pr-10">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${n.target_type === 'all' ? 'bg-indigo-100 text-indigo-700' : n.target_type === 'department' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {n.target_type === 'all' ? 'Global Announcement' : n.target_type === 'department' ? 'Department Alert' : 'Personal Alert'}
                                </span>
                                {n.sender_name && (
                                   <span className="text-xs text-muted-foreground font-medium">
                                       From: <strong className="text-foreground capitalize">{n.sender_name}</strong>
                                   </span>
                                )}
                                <span className="text-xs text-muted-foreground font-medium">
                                    • {format(new Date(n.created_at + 'Z'), 'MMM do, yyyy h:mm a')}
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">{n.message}</p>
                        </div>
                        <button 
                            onClick={() => dismissMutation.mutate(n.id)}
                            disabled={dismissMutation.isPending}
                            className="absolute right-4 top-4 px-3 py-1.5 bg-muted/60 hover:bg-red-50 rounded-full transition-colors text-muted-foreground hover:text-red-600 text-xs font-semibold border"
                            title="Mark as read / Dismiss"
                        >
                            Mark as read
                        </button>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
