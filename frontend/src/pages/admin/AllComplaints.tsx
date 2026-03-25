import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

export default function AllComplaints() {
  const queryClient = useQueryClient();
  const { data: complaints, isLoading } = useQuery({ queryKey: ['complaints'], queryFn: async () => (await api.get('/complaints/')).data });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users/')).data });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await api.patch(`/complaints/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] })
  });

  const getUserName = (id: number) => users?.find((u:any) => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 pt-4 animate-in fade-in">
      <h1 className="text-3xl font-bold tracking-tight">All Complaints</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {complaints?.length === 0 && <p className="text-muted-foreground text-sm">No complaints found.</p>}
          {complaints?.map((c: any) => (
             <Card key={c.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{c.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">From: {getUserName(c.user_id)} • {format(new Date(c.created_at), 'PPP')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <select 
                                value={c.status}
                                onChange={(e) => statusMutation.mutate({ id: c.id, status: e.target.value })}
                                disabled={statusMutation.isPending}
                                className="text-xs px-2 py-1 rounded border bg-transparent font-medium focus:outline-none"
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${c.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{c.priority}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.description}</p>
                </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
