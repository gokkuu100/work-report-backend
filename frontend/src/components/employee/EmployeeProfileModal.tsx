import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, User, Calendar, FileText, MessageSquare, Briefcase } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

interface Props {
  userId: number | null;
  onClose: () => void;
}

import { useAuthStore } from '@/store/auth';

export function EmployeeProfileModal({ userId, onClose }: Props) {
  const { data: users } = useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
        try {
            return (await api.get('/users/')).data;
        } catch {
            const authUser = useAuthStore.getState().user;
            if (authUser?.department_id) {
                const res = await api.get(`/departments/${authUser.department_id}`);
                return res.data.users || [];
            }
            return [];
        }
    },
    enabled: !!userId,
  });

  const { data: leaves } = useQuery({
    queryKey: ['all-leaves-profile'],
    queryFn: async () => (await api.get('/leaves/')).data,
    enabled: !!userId,
  });

  const { data: reports } = useQuery({
    queryKey: ['all-reports-profile'],
    queryFn: async () => {
        try {
            return (await api.get('/reports/all')).data;
        } catch {
            return (await api.get('/reports/department')).data; // Fallback for Dept Head
        }
    },
    enabled: !!userId,
  });

  const { data: complaints } = useQuery({
    queryKey: ['all-complaints-profile'],
    queryFn: async () => {
        try {
            return (await api.get('/complaints/')).data;
        } catch {
            return (await api.get('/complaints/department')).data; // Fallback for Dept Head
        }
    },
    enabled: !!userId,
  });

  if (!userId) return null;

  const user = users?.find((u: any) => u.id === userId);
  const userLeaves = leaves?.filter((l: any) => l.user_id === userId).reverse() || [];
  const userReports = reports?.filter((r: any) => r.user_id === userId).reverse() || [];
  const userComplaints = complaints?.filter((c: any) => c.user_id === userId).reverse() || [];

  const getLeaveDays = (start: string, end: string, requested: number) => {
      if (requested) return requested;
      try {
          const days = differenceInDays(parseISO(end), parseISO(start)) + 1;
          return days > 0 ? days : 0;
      } catch (e) {
          return 0;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {user?.name?.substring(0, 2) || <User />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{user?.name || 'Loading...'}</h2>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <span>{user?.email}</span>
                        {user?.job_title && <span>• {user.job_title}</span>}
                    </p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="w-5 h-5 text-muted-foreground" />
            </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-muted/5">
            <Tabs defaultValue="leaves" className="w-full">
              <TabsList className="mb-6 bg-muted/50 w-full justify-start p-1 h-auto flex-wrap">
                <TabsTrigger value="leaves" className="py-2 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Calendar className="w-4 h-4"/> Leave History ({userLeaves.length})</TabsTrigger>
                <TabsTrigger value="reports" className="py-2 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileText className="w-4 h-4"/> Reports ({userReports.length})</TabsTrigger>
                <TabsTrigger value="complaints" className="py-2 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><MessageSquare className="w-4 h-4"/> Complaints ({userComplaints.length})</TabsTrigger>
                <TabsTrigger value="info" className="py-2 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Briefcase className="w-4 h-4"/> Employee Info</TabsTrigger>
              </TabsList>

              <TabsContent value="leaves" className="space-y-4 outline-none">
                 {userLeaves.length === 0 ? (
                     <p className="text-muted-foreground text-center py-8">No leaves recorded.</p>
                 ) : (
                     <div className="space-y-4">
                         {userLeaves.map((l: any) => (
                             <div key={l.id} className="bg-background border rounded-lg p-5 shadow-sm">
                                 <div className="flex justify-between items-start mb-3 border-b pb-3">
                                     <div>
                                         <h4 className="font-bold uppercase tracking-wider text-primary text-sm mb-1">{l.leave_type}</h4>
                                         <p className="text-sm font-medium">{l.start_date} to {l.end_date} <span className="text-muted-foreground font-normal ml-2">({getLeaveDays(l.start_date, l.end_date, l.requested_days)} Days)</span></p>
                                     </div>
                                     <div className="flex flex-col items-end gap-1 text-xs font-semibold">
                                         <span className={`px-2 py-0.5 rounded ${l.dept_head_status === 'approved' ? 'bg-green-100 text-green-700' : l.dept_head_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            Head: {l.dept_head_status}
                                         </span>
                                         <span className={`px-2 py-0.5 rounded ${l.hr_admin_status === 'approved' ? 'bg-green-100 text-green-700' : l.hr_admin_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            HR: {l.hr_admin_status}
                                         </span>
                                     </div>
                                 </div>
                                 <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                     <span className="font-semibold text-foreground">Reason: </span>
                                     {l.reason || 'No reason provided.'}
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4 outline-none">
                 {userReports.length === 0 ? (
                     <p className="text-muted-foreground text-center py-8">No reports submitted.</p>
                 ) : (
                     <div className="space-y-4">
                         {userReports.map((r: any) => (
                             <div key={r.id} className="bg-background border rounded-lg p-5 shadow-sm">
                                 <div className="flex justify-between items-center mb-2">
                                     <h4 className="font-bold text-sm">{format(new Date(r.date), 'EEEE, MMMM do yyyy')}</h4>
                                     {r.is_late ? <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Late</span> : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">On-Time</span>}
                                 </div>
                                 <p className="text-sm bg-muted/30 p-3 rounded">{r.tasks}</p>
                             </div>
                         ))}
                     </div>
                 )}
              </TabsContent>

              <TabsContent value="complaints" className="space-y-4 outline-none">
                 {userComplaints.length === 0 ? (
                     <p className="text-muted-foreground text-center py-8">No complaints filed.</p>
                 ) : (
                     <div className="space-y-4">
                         {userComplaints.map((c: any) => (
                             <div key={c.id} className="bg-background border rounded-lg p-5 shadow-sm">
                                 <div className="flex items-start justify-between mb-2">
                                     <div>
                                        <h4 className="font-bold text-base flex items-center gap-2">
                                            {c.title}
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${c.priority === 'high' ? 'bg-red-100 text-red-700' : c.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{c.priority}</span>
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.created_at + 'Z'), 'MMM do, yyyy')}</p>
                                     </div>
                                     <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${c.status === 'open' ? 'bg-yellow-100 text-yellow-700' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                                 </div>
                                 <p className="text-sm bg-muted/30 p-3 rounded">{c.description}</p>
                             </div>
                         ))}
                     </div>
                 )}
              </TabsContent>

              <TabsContent value="info" className="outline-none">
                  {user && (
                    <div className="bg-background border rounded-lg p-6 shadow-sm max-w-2xl space-y-6 text-sm">
                        <div>
                            <h3 className="font-bold text-base mb-3 text-primary border-b pb-2">Employment Details</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div><p className="text-muted-foreground font-medium mb-1">Status</p><p className="font-bold capitalize">{String(user.status || 'Active')}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Employment Type</p><p className="font-bold capitalize">{String(user.employment_status || 'Full Time').replace('_', ' ')}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">System Role</p><p className="font-bold capitalize">{user.role}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Department Head</p><p className="font-bold">{user.is_department_head ? 'Yes' : 'No'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Job Title</p><p className="font-bold">{user.job_title || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Staff No.</p><p className="font-bold">{user.staff_no || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Work Place</p><p className="font-bold">{user.work_place || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Has Computer</p><p className="font-bold">{user.has_computer ? 'Yes' : 'No'}</p></div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-base mb-3 text-primary border-b pb-2">Personal & Contact Info</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div><p className="text-muted-foreground font-medium mb-1">National ID</p><p className="font-bold">{user.national_id || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Phone Number</p><p className="font-bold">{user.phone_number || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Next of Kin</p><p className="font-bold">{user.next_of_kin || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Next of Kin Phone</p><p className="font-bold">{user.next_of_kin_phone || 'N/A'}</p></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-base mb-3 text-primary border-b pb-2">Dates</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <div><p className="text-muted-foreground font-medium mb-1">Employment Date</p><p className="font-bold">{user.employment_date || 'N/A'}</p></div>
                                <div><p className="text-muted-foreground font-medium mb-1">Employment Duration</p><p className="font-bold">{user.employment_duration || 'N/A'}</p></div>
                                <div className="col-span-2"><p className="text-muted-foreground font-medium mb-1">System Joined Date</p><p className="font-bold">{format(new Date(user.created_at + 'Z'), 'MMMM do, yyyy')}</p></div>
                            </div>
                        </div>
                    </div>
                  )}
              </TabsContent>
            </Tabs>
        </div>
      </Card>
    </div>
  );
}
