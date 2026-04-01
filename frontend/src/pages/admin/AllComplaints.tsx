import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function AllComplaints() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM'));

  const { data: complaints, isLoading } = useQuery({ queryKey: ['complaints'], queryFn: async () => (await api.get('/complaints/')).data });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users/')).data });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await api.patch(`/complaints/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] })
  });

  const getUserName = (id: number) => users?.find((u:any) => u.id === id)?.name || 'Unknown';

  const filteredComplaints = complaints?.filter((c: any) => {
      const uName = getUserName(c.user_id).toLowerCase();
      const matchesSearch = uName.includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || format(new Date(c.created_at + 'Z'), 'yyyy-MM').startsWith(dateFilter);
      return matchesSearch && matchesDate;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">All Complaints</h1>
          <p className="text-muted-foreground text-sm">Review and resolve employee submitted issues.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <Input 
                placeholder="Search employee..." 
                className="w-full md:w-64 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Input 
                type="month" 
                className="w-full md:w-40 bg-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
            />
        </div>
      </div>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredComplaints.length === 0 && <p className="text-muted-foreground text-sm">No complaints found matching criteria.</p>}
          {filteredComplaints.map((c: any) => (
             <Card key={c.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{c.title}</CardTitle>
                                {users?.find((u: any) => u.id === c.user_id)?.is_department_head && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Dept Head</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">From: {getUserName(c.user_id)} • {format(new Date(c.created_at + 'Z'), 'PPP p')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <select 
                                value={c.status}
                                onChange={(e) => statusMutation.mutate({ id: c.id, status: e.target.value })}
                                disabled={statusMutation.isPending}
                                className="text-xs px-2 py-1 rounded border bg-transparent font-medium focus:outline-none"
                            >
                                <option value="open">Open</option>
                                <option value="in_review">On Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
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
