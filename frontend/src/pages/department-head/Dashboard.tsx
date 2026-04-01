import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, FileText, Paperclip, X, Download, Palmtree } from 'lucide-react';
import { EmployeeProfileModal } from '@/components/employee/EmployeeProfileModal';
import { LeaveApplicationModal } from '@/components/leaves/LeaveApplicationModal';

export default function DeptHeadDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveData, setLeaveData] = useState({ user_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [complaintDateFilter, setComplaintDateFilter] = useState('');

  // Pagination states
  const [reportsPage, setReportsPage] = useState(1);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [leavesPage, setLeavesPage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);
  const itemsPerPage = 8;

  const { data: allUsers } = useQuery({
    queryKey: ['department', user?.department_id],
    queryFn: async () => {
        if (!user?.department_id) return [];
        const { data } = await api.get(`/departments/${user.department_id}`);
        return data.users || [];
    },
    enabled: !!user?.department_id
  });

  const departmentUsers = allUsers?.filter((u: any) => u.role !== 'admin') || [];

  const { data: reports } = useQuery({
    queryKey: ['dept-reports'],
    queryFn: async () => {
        const { data } = await api.get('/reports/department');
        return data.reverse();
    }
  });

  const filteredReports = reports?.filter((r: any) => !dateFilter || (r.date && String(r.date).startsWith(dateFilter))) || [];
  const totalReportPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice((reportsPage - 1) * itemsPerPage, reportsPage * itemsPerPage);

  const { data: leaves } = useQuery({
    queryKey: ['dept-leaves'],
    queryFn: async () => {
        const { data } = await api.get('/leaves/department');
        return data.reverse();
    }
  });

  const totalLeavePages = Math.ceil((leaves?.length || 0) / itemsPerPage) || 1;
  const paginatedLeaves = leaves?.slice((leavesPage - 1) * itemsPerPage, leavesPage * itemsPerPage);

  const { data: complaints } = useQuery({
    queryKey: ['dept-complaints'],
    queryFn: async () => {
        const { data } = await api.get('/complaints/department');
        return data.reverse();
    }
  });

  const filteredComplaints = complaints?.filter((c: any) => !complaintDateFilter || (c.created_at && String(c.created_at).startsWith(complaintDateFilter))) || [];
  const totalComplaintPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = filteredComplaints.slice((complaintsPage - 1) * itemsPerPage, complaintsPage * itemsPerPage);

  const totalMemberPages = Math.ceil((departmentUsers?.length || 0) / itemsPerPage) || 1;
  const paginatedMembers = departmentUsers?.slice((membersPage - 1) * itemsPerPage, membersPage * itemsPerPage);

  const leaveMutation = useMutation({
    mutationFn: async (data: typeof leaveData) => {
      let days = 0;
      if (data.start_date && data.end_date) {
        let d1 = new Date(data.start_date);
        const d2 = new Date(data.end_date);
        while (d1 <= d2) {
          if (d1.getDay() !== 0) days++;
          d1.setDate(d1.getDate() + 1);
        }
      }
      const res = await api.post(`/leaves/grant/${data.user_id}`, {
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason,
          requested_days: days
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-leaves'] });
      setLeaveData({ user_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      alert('Leave granted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to grant leave');
    }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/leaves/${id}/approve-dept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dept-leaves'] }),
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/leaves/${id}/reject-dept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dept-leaves'] }),
  });

  const alertMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post('/notifications/', {
          message,
          target_type: 'department',
          department_id: user?.department_id,
      });
      return res.data;
    },
    onSuccess: () => {
      setAlertMessage('');
      alert('Alert broadcasted successfully!');
    }
  });

  const getUserName = (id: number | string) => {
    const foundUser = allUsers?.find((u: any) => String(u.id) === String(id));
    return foundUser?.name ? String(foundUser.name) : `User ${id}`;
  };

  const downloadAttachment = async (fileKey: string) => {
    try {
      const res = await api.get(`/uploads/presigned-url/get?file_key=${encodeURIComponent(fileKey)}`);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert("Failed to access attachment.");
    }
  };

  const getLeaveDays = (start: string, end: string) => {
      try {
          const days = differenceInDays(parseISO(end), parseISO(start)) + 1;
          return days > 0 ? days : 0;
      } catch (e) {
          return 0;
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Department Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of reports, complaints, and leaves in your department.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="members" className="rounded-md">Members</TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-md">Leave Applications</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-md">Reports</TabsTrigger>
          <TabsTrigger value="complaints" className="rounded-md">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-xl">Send Department Alert</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); alertMutation.mutate(alertMessage); }} className="space-y-4">
                      <div className="space-y-2">
                          <Label>Message</Label>
                          <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={alertMessage} onChange={e => setAlertMessage(e.target.value)} required placeholder="Type an alert to send to everyone in your department..."></textarea>
                      </div>
                      <Button type="submit" disabled={alertMutation.isPending || !alertMessage.trim()}>Broadcast Alert</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-xl">Grant Leave Days</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); leaveMutation.mutate(leaveData); }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Employee</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={leaveData.user_id} onChange={e => setLeaveData(p => ({...p, user_id: e.target.value}))} required>
                                  <option value="">Select Employee</option>
                                  {departmentUsers?.map((u: any) => (
                                      <option key={u.id} value={u.id}>{u.name}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <Label>Leave Type</Label>
                              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={leaveData.leave_type} onChange={e => setLeaveData(p => ({...p, leave_type: e.target.value}))}>
                                  <option value="annual">Annual Leave</option>
                                  <option value="sick">Sick Leave</option>
                                  <option value="maternity">Maternity Leave</option>
                                  <option value="paternity">Paternity Leave</option>
                                  <option value="compassionate">Compassionate Leave</option>
                                  <option value="unpaid">Unpaid Leave</option>
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input type="date" value={leaveData.start_date} onChange={e => setLeaveData(p => ({...p, start_date: e.target.value}))} required />
                          </div>
                          <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={leaveData.end_date} onChange={e => setLeaveData(p => ({...p, end_date: e.target.value}))} required />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label>Reason *</Label>
                          <Input value={leaveData.reason} onChange={e => setLeaveData(p => ({...p, reason: e.target.value}))} placeholder="Reason for the grant..." required />
                      </div>
                      <Button type="submit" disabled={leaveMutation.isPending || !leaveData.user_id || !leaveData.reason.trim()}>Grant Leave</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

        <TabsContent value="members">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader className="bg-muted/10 border-b pb-4 shrink-0">
                        <CardTitle className="text-lg">Department Members</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                       <div className="divide-y flex-1 overflow-y-auto">
                           {paginatedMembers?.map((u: any) => (
                               <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                                   <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                           {String(u.name || '').substring(0,2)}
                                       </div>
                                       <div>
                                           <p className="font-semibold text-foreground flex items-center gap-2">
                                               <span className="cursor-pointer hover:underline text-primary" onClick={() => setSelectedUserId(u.id)}>{u.name}</span>
                                               {u.is_department_head && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-wider">Dept Head</span>}
                                           </p>
                                           <p className="text-xs text-muted-foreground">{u.email}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                       {totalMemberPages > 1 && (
                           <div className="flex justify-between items-center p-3 border-t bg-muted/10 shrink-0">
                               <Button variant="ghost" size="sm" onClick={() => setMembersPage(p => Math.max(1, p - 1))} disabled={membersPage === 1}>Prev</Button>
                               <span className="text-xs text-muted-foreground">{membersPage} / {totalMemberPages}</span>
                               <Button variant="ghost" size="sm" onClick={() => setMembersPage(p => Math.min(totalMemberPages, p + 1))} disabled={membersPage === totalMemberPages}>Next</Button>
                           </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="leaves">
            <div className="flex flex-col gap-6">
                <Card className="flex flex-col">
                    <CardHeader className="bg-muted/10 border-b pb-4 flex flex-row items-center justify-between shrink-0">
                        <CardTitle className="text-lg">Recent Leaves</CardTitle>
                        <Button size="sm" onClick={() => setIsLeaveModalOpen(true)} className="gap-2 shrink-0">
                            <Palmtree className="w-4 h-4" /> Apply for Leave
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                       <div className="divide-y flex-1 overflow-y-auto">
                           {paginatedLeaves?.map((l: any) => (
                               <div key={l.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-sm hover:bg-muted/5 transition-colors gap-4">
                                   <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                         <p className="font-semibold text-foreground">
                                             <span className="cursor-pointer hover:underline text-primary" onClick={() => setSelectedUserId(l.user_id)}>
                                                {getUserName(l.user_id)}
                                             </span>
                                         </p>
                                         <span className="capitalize px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold text-muted-foreground tracking-wider">{l.leave_type}</span>
                                       </div>
                                       <p className="text-xs text-muted-foreground mb-1">{l.start_date} to {l.end_date} • <span className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">{l.requested_days || getLeaveDays(l.start_date, l.end_date)} days</span></p>
                                       {l.reason && <p className="text-xs text-muted-foreground italic">"{l.reason}"</p>}
                                       {l.document_url && (
                                         <button onClick={() => downloadAttachment(l.document_url)} className="text-[10px] text-blue-600 font-semibold uppercase mt-1 flex items-center gap-1 hover:underline">
                                           <Paperclip className="w-3 h-3" /> View Document
                                         </button>
                                       )}
                                   </div>
                                   <div className="flex flex-col items-end gap-2 shrink-0">
                                       {l.dept_head_status === 'pending' ? (
                                           <div className="flex gap-2">
                                               <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => rejectLeaveMutation.mutate(l.id)} disabled={rejectLeaveMutation.isPending}>Reject</Button>
                                               <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveLeaveMutation.mutate(l.id)} disabled={approveLeaveMutation.isPending}>Approve</Button>
                                           </div>
                                       ) : (
                                           <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${l.dept_head_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                               Head: {l.dept_head_status}
                                           </span>
                                       )}
                                       {l.dept_head_status === 'approved' && (
                                            <span className={`capitalize px-2 py-1 rounded text-[10px] font-semibold ${l.hr_admin_status === 'approved' ? 'bg-indigo-100 text-indigo-700' : l.hr_admin_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                               HR: {l.hr_admin_status}
                                           </span>
                                       )}
                                   </div>
                               </div>
                           ))}
                           {!paginatedLeaves?.length && <p className="text-sm text-muted-foreground p-8 text-center">No leaves recorded.</p>}
                       </div>
                       {totalLeavePages > 1 && (
                           <div className="flex justify-between items-center p-3 border-t bg-muted/10 shrink-0">
                               <Button variant="ghost" size="sm" onClick={() => setLeavesPage(p => Math.max(1, p - 1))} disabled={leavesPage === 1}>Prev</Button>
                               <span className="text-xs text-muted-foreground">{leavesPage} / {totalLeavePages}</span>
                               <Button variant="ghost" size="sm" onClick={() => setLeavesPage(p => Math.min(totalLeavePages, p + 1))} disabled={leavesPage === totalLeavePages}>Next</Button>
                           </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="flex flex-col">
            <CardHeader className="bg-muted/10 border-b pb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
                <CardTitle className="text-lg">Department Reports</CardTitle>
                <Input 
                    type="month" 
                    className="w-full md:w-40 bg-white"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setReportsPage(1); }}
                />
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
               <div className="divide-y flex-1 overflow-y-auto">
                   {paginatedReports.map((r: any) => (
                       <div key={r.id} className="p-6 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedReport(r)}>
                           <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-xs">
                                       {String(getUserName(r.user_id)).substring(0,2)}
                                   </div>
                                   <span className="font-semibold cursor-pointer hover:underline text-primary" onClick={(e) => { e.stopPropagation(); setSelectedUserId(r.user_id); }}>
                                       {getUserName(r.user_id)}
                                   </span>
                               </div>
                               <div className="flex items-center gap-2">
                                  {r.is_late && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold uppercase tracking-wider">Late</span>}
                                  <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">{r.date}</span>
                               </div>
                           </div>
                           <div className="bg-background border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-2">
                               {r.tasks}
                           </div>
                       </div>
                   ))}
                   {!paginatedReports.length && <div className="p-8 text-sm text-muted-foreground text-center">No reports found for this period.</div>}
               </div>
               
               {totalReportPages > 1 && (
                   <div className="flex justify-between items-center p-3 border-t bg-muted/10 shrink-0">
                       <Button variant="ghost" size="sm" onClick={() => setReportsPage(p => Math.max(1, p - 1))} disabled={reportsPage === 1}>Previous</Button>
                       <span className="text-xs font-medium text-muted-foreground">Page {reportsPage} of {totalReportPages}</span>
                       <Button variant="ghost" size="sm" onClick={() => setReportsPage(p => Math.min(totalReportPages, p + 1))} disabled={reportsPage === totalReportPages}>Next</Button>
                   </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card className="flex flex-col">
            <CardHeader className="bg-muted/10 border-b pb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
                <CardTitle className="text-lg">Department Complaints</CardTitle>
                <Input 
                    type="month" 
                    className="w-full md:w-40 bg-white"
                    value={complaintDateFilter}
                    onChange={(e) => { setComplaintDateFilter(e.target.value); setComplaintsPage(1); }}
                />
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
               <div className="divide-y flex-1 overflow-y-auto">
                   {paginatedComplaints?.map((c: any) => (
                       <div key={c.id} className="p-6 hover:bg-muted/10 transition-colors">
                           <div className="flex justify-between items-start mb-4">
                               <div className="space-y-1">
                                   <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                        {c.title}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${c.priority === 'high' ? 'bg-red-100 text-red-700' : c.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{c.priority}</span>
                                   </h3>
                                   <p className="text-xs text-muted-foreground font-medium">From: <span className="cursor-pointer hover:underline text-primary font-bold" onClick={() => setSelectedUserId(c.user_id)}>{getUserName(c.user_id)}</span> • {format(new Date(c.created_at + 'Z'), 'MMM do, yyyy h:mm a')}</p>
                               </div>
                               <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${c.status === 'open' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                   {String(c.status || '').replace('_', ' ')}
                               </span>
                           </div>
                           <div className="bg-background border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                               {c.description}
                           </div>
                       </div>
                   ))}
                   {!paginatedComplaints?.length && <div className="p-8 text-sm text-muted-foreground text-center">No complaints found for this period.</div>}
               </div>

               {totalComplaintPages > 1 && (
                   <div className="flex justify-between items-center p-3 border-t bg-muted/10 shrink-0">
                       <Button variant="ghost" size="sm" onClick={() => setComplaintsPage(p => Math.max(1, p - 1))} disabled={complaintsPage === 1}>Previous</Button>
                       <span className="text-xs font-medium text-muted-foreground">Page {complaintsPage} of {totalComplaintPages}</span>
                       <Button variant="ghost" size="sm" onClick={() => setComplaintsPage(p => Math.min(totalComplaintPages, p + 1))} disabled={complaintsPage === totalComplaintPages}>Next</Button>
                   </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                           {getUserName(selectedReport.user_id)}
                           {selectedReport.is_late ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase font-bold tracking-wider">Late</span>
                           ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase font-bold tracking-wider">On-Time</span>
                           )}
                        </h2>
                        <span className="text-sm font-medium text-muted-foreground">{format(new Date(selectedReport.date), 'EEEE, MMMM do yyyy')}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setSelectedReport(null)}>
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
                
                <div className="p-6 space-y-8">
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-primary" /> Tasks Completed
                        </h3>
                        <div className="text-base text-foreground bg-muted/20 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {selectedReport.tasks}
                        </div>
                    </div>
                    
                    {selectedReport.blockers && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Blockers & Issues
                            </h3>
                            <div className="text-base text-foreground bg-orange-50/50 p-4 rounded-xl border border-orange-100 leading-relaxed whitespace-pre-wrap">
                                {selectedReport.blockers}
                            </div>
                        </div>
                    )}

                    {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <Paperclip className="w-4 h-4 text-indigo-500" /> Attachments
                            </h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {selectedReport.attachments.map((att: any) => (
                                    <button 
                                        key={att.id} 
                                        onClick={() => downloadAttachment(att.file_url)}
                                        className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 hover:bg-muted/30 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md shrink-0">
                                                <Paperclip className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium truncate pr-4">{att.file_name}</span>
                                        </div>
                                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                        <span>Submitted at {format(new Date(selectedReport.created_at + 'Z'), 'hh:mm:ss a')}</span>
                        <span>Report ID: #{selectedReport.id}</span>
                    </div>
                </div>
            </div>
        </div>
      )}
      <EmployeeProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      <LeaveApplicationModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
    </div>
  );
}
