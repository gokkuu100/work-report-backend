import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bell, History } from 'lucide-react';
import { format } from 'date-fns';

export default function SendNotification() {
  const queryClient = useQueryClient();
  const [targetType, setTargetType] = useState<'all' | 'user' | 'department'>('all');
  const [targetId, setTargetId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: users } = useQuery({ 
      queryKey: ['users'], 
      queryFn: async () => (await api.get('/users/')).data 
  });

  const { data: departments } = useQuery({
      queryKey: ['departments'],
      queryFn: async () => (await api.get('/departments/')).data
  });

  const { data: notifications, isLoading } = useQuery({
      queryKey: ['notifications-admin'],
      queryFn: async () => (await api.get('/notifications/')).data
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
          message,
          target_type: targetType,
      };
      if (targetType === 'user') payload.user_id = parseInt(targetId);
      if (targetType === 'department') payload.department_id = parseInt(targetId);

      const { data } = await api.post('/notifications/', payload);
      return data;
    },
    onSuccess: () => {
      setSuccess('Notification sent successfully!');
      setError('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['notifications-admin'] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to send notification');
      setSuccess('');
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    if (targetType !== 'all' && !targetId) {
        setError('Please select a target.');
        return;
    }
    sendMutation.mutate();
  };

  const getUserName = (id: number) => users?.find((u:any) => u.id === id)?.name || `User #${id}`;

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl grid md:grid-cols-[1fr,400px] gap-8 items-start">
      <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary" /> Send Notification
            </h1>
            <p className="text-muted-foreground text-sm">Broadcast messages to all employees or target a specific user directly on their dashboard.</p>
          </div>
    
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg">Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Target Audience Type</Label>
                <select
                    value={targetType}
                    onChange={(e: any) => { setTargetType(e.target.value); setTargetId(''); }}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="all">All Employees Globally</option>
                    <option value="department">Specific Department</option>
                    <option value="user">Specific User</option>
                </select>
              </div>

              {targetType === 'department' && (
                  <div className="space-y-3">
                    <Label>Select Department</Label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">-- Choose Department --</option>
                        {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
              )}

              {targetType === 'user' && (
                  <div className="space-y-3">
                    <Label>Select User</Label>
                    <select value={targetId} onChange={e => setTargetId(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">-- Choose User --</option>
                        {users?.filter((u: any) => u.role !== 'admin').map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                  </div>
              )}
    
              <div className="space-y-3">
                <Label htmlFor="message" className="text-base font-semibold">Message Content</Label>
                <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type the announcement or warning here..."
                    className="min-h-[150px] rounded-xl resize-none"
                />
              </div>
    
              <Button 
                  onClick={handleSend} 
                  disabled={sendMutation.isPending || !message.trim()}
                  className="rounded-xl h-11 w-full sm:w-auto px-8"
              >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMutation.isPending ? 'Sending...' : 'Dispatch Notification'}
              </Button>
    
              {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">{success}</div>}
              {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">{error}</div>}
            </CardContent>
          </Card>
      </div>

      <Card className="shadow-sm h-full md:max-h-[calc(100vh-140px)] flex flex-col">
        <CardHeader className="border-b bg-muted/10 pb-4 shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 justify-center flex text-muted-foreground text-sm">Loading history...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No alerts have been sent yet.</div>
          ) : (
            <div className="divide-y relative">
              {notifications.map((n: any) => (
                <div key={n.id} className="p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${n.target_type === 'all' ? 'bg-primary/10 text-primary' : n.target_type === 'department' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {n.target_type === 'all' ? 'Globally Sent' : n.target_type === 'department' ? `Dept: ${departments?.find((d:any) => d.id === n.department_id)?.name || n.department_id}` : `To: ${getUserName(n.user_id)}`}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{format(new Date(n.created_at + 'Z'), 'MMM do, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
