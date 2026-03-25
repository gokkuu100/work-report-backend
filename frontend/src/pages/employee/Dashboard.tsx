import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Files, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, XCircle, Bell } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { useAuthStore } from '@/store/auth';

export default function Dashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: reports, isLoading: rLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: async () => {
      const { data } = await api.get('/reports/me');
      return data;
    }
  });

  const { data: notifications } = useQuery({
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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const submittedToday = reports?.some((r: any) => r.date === todayStr);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayStatus = (day: number) => {
      const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
      const report = reports?.find((r: any) => r.date === dateStr);
      
      if (isFuture(new Date(year, month, day))) return 'future';
      if (!report) return 'missed';
      if (report.is_late) return 'late';
      return 'on-time';
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted-foreground text-sm">Here is a quick overview of your activities today.</p>
      </div>

      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div key={n.id} className="flex gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-900 shadow-sm items-start relative overflow-hidden group">
                <div className="shrink-0 mt-0.5 bg-blue-100 p-2 rounded-full">
                    <Bell className="w-4 h-4 text-blue-600 inline-block" />
                </div>
                <div className="space-y-1 flex-1 pr-8">
                    <p className="text-sm font-medium leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-blue-600/70 font-semibold uppercase tracking-wider">{format(new Date(n.created_at + 'Z'), 'MMM do, h:mm a')}</p>
                </div>
                <button 
                  onClick={() => dismissMutation.mutate(n.id)}
                  disabled={dismissMutation.isPending}
                  className="absolute right-3 top-3 px-3 py-1.5 bg-white/60 hover:bg-blue-100 rounded-full transition-colors text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-wide shadow-sm"
                  title="Mark as read"
                >
                    Mark as read
                </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Today's Report</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mt-2 text-foreground">
              {submittedToday ? "Submitted" : "Pending"}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {!submittedToday ? "Please submit your daily activity report." : "Awesome! You're all caught up."}
            </p>
          </CardContent>
        </Card>
        
        <Card className="group hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Reports</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Files className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mt-2 text-foreground">{reports?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Lifetime submissions</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Submission Activity</h2>
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> On Time</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Late</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Missed</span>
            </div>
        </div>

        <Card className="overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/10 border-b pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        {format(currentDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={prevMonth}>Prev Month</Button>
                        <Button variant="outline" size="sm" onClick={nextMonth}>Next Month</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {rLoading ? (
                    <div className="h-48 bg-muted animate-pulse rounded-xl"></div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground mb-2">
                                {day}
                            </div>
                        ))}
                        
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className="aspect-square rounded-xl bg-muted/5 border border-dashed border-border/40"></div>
                        ))}
                        
                        {days.map(day => {
                            const status = getDayStatus(day);
                            const today = isToday(new Date(year, month, day));
                            
                            let bgClass = "bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40"; // future
                            let icon = null;

                            if (status === 'on-time') {
                                bgClass = "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
                                icon = <CheckCircle2 className="w-3 h-3 absolute bottom-1 right-1 opacity-50" />;
                            } else if (status === 'late') {
                                bgClass = "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200";
                                icon = <AlertTriangle className="w-3 h-3 absolute bottom-1 right-1 opacity-50" />;
                            } else if (status === 'missed') {
                                bgClass = "bg-red-50 text-red-500 border-red-100 hover:bg-red-100";
                                icon = <XCircle className="w-3 h-3 absolute bottom-1 right-1 opacity-40" />;
                            }

                            return (
                                <div 
                                    key={day} 
                                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border transition-colors cursor-default ${bgClass} ${today ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                    title={`Day ${day} - ${status}`}
                                >
                                    <span className="text-sm font-bold">{day}</span>
                                    {icon}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
