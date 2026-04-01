import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ArrowLeft, UserPlus, CheckCircle, FileText, AlertTriangle, Paperclip, X, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState('');

  const { data: dept, isLoading: deptLoading } = useQuery({
    queryKey: ['department', id],
    queryFn: async () => (await api.get(`/departments/${id}`)).data
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users/')).data
  });

  const { data: allReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports/')).data
  });

  const { data: allComplaints } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => (await api.get('/complaints/')).data
  });

  const assignDeptMutation = useMutation({
    mutationFn: async ({ userId, deptId, isHead }: { userId: number, deptId: number | null, isHead: boolean }) => {
      const res = await api.patch(`/users/${userId}/department`, { department_id: deptId, is_department_head: isHead });
      return res.data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['department', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setSelectedUserId('');
    }
  });

  if (deptLoading || usersLoading) return <div className="p-8">Loading...</div>;
  if (!dept) return <div className="p-8 text-red-500">Department not found.</div>;

  const deptUserIds = dept.users?.map((u: any) => u.id) || [];
  const deptReports = allReports?.filter((r: any) => deptUserIds.includes(r.user_id)) || [];
  const filteredDeptReports = deptReports.filter((r: any) => !dateFilter || r.date.startsWith(dateFilter));
  const deptComplaints = allComplaints?.filter((c: any) => c.target_level === 'department' && deptUserIds.includes(c.user_id)) || [];
  const availableUsers = users?.filter((u: any) => u.role !== 'admin' && u.department_id !== dept.id) || [];

  const getUserName = (userId: number) => dept.users?.find((u: any) => u.id === userId)?.name || userId;

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

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-muted" onClick={() => navigate('/admin/departments')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{dept.name}</h1>
          <p className="text-muted-foreground text-sm">{dept.description || 'No description provided.'}</p>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
              <CardHeader className="bg-muted/10 border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary"/> Add Member</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl">
                      <div className="flex-1 space-y-2 w-full">
                          <Label>Existing Employee</Label>
                          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                              <option value="">-- Select Employee --</option>
                              {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.department_id ? 'Transfer' : 'Unassigned'})</option>)}
                          </select>
                      </div>
                      <Button className="h-11 rounded-xl px-8 w-full sm:w-auto" onClick={() => { if (selectedUserId) assignDeptMutation.mutate({ userId: parseInt(selectedUserId), deptId: dept.id, isHead: false }) }} disabled={!selectedUserId || assignDeptMutation.isPending}>Add to Department</Button>
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader className="bg-muted/10 border-b pb-4">
                  <CardTitle className="text-lg">Current Members</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y relative max-h-[500px] overflow-y-auto">
                      {dept.users?.map((u: any) => (
                          <div key={u.id} className="p-4 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center text-sm hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                      {u.name.substring(0,2)}
                                  </div>
                                  <div>
                                      <span className="font-semibold block text-base">{u.name}</span>
                                      <span className="text-muted-foreground text-xs">{u.email}</span>
                                      {u.is_department_head && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase border border-blue-200 inline-block mt-1">Head of Department</span>}
                                  </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                  {!u.is_department_head && (
                                     <Button variant="outline" size="sm" className="h-9 hover:bg-blue-50 hover:text-blue-700" onClick={() => assignDeptMutation.mutate({ userId: u.id, deptId: dept.id, isHead: true })}>
                                        <CheckCircle className="w-4 h-4 mr-2"/> Set as Head
                                     </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-9 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200" onClick={() => assignDeptMutation.mutate({ userId: u.id, deptId: null, isHead: false })}>Remove</Button>
                              </div>
                          </div>
                      ))}
                      {!dept.users?.length && <div className="p-8 text-muted-foreground text-center text-sm">No members assigned to this department yet.</div>}
                  </div>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="bg-muted/10 border-b pb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-lg">Department Reports</CardTitle>
                <Input 
                    type="month" 
                    className="w-full md:w-40 bg-white"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y max-h-[600px] overflow-y-auto">
                   {filteredDeptReports.map((r: any) => (
                       <div key={r.id} className="p-6 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedReport(r)}>
                           <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-xs">
                                       {getUserName(r.user_id).substring(0,2)}
                                   </div>
                                   <span className="font-semibold">{getUserName(r.user_id)}</span>
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
                   {!filteredDeptReports.length && <div className="p-8 text-sm text-muted-foreground text-center">No reports found for this period.</div>}
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card>
            <CardHeader className="bg-muted/10 border-b pb-4">
                <CardTitle className="text-lg">Department Complaints</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y max-h-[600px] overflow-y-auto">
                   {deptComplaints.map((c: any) => (
                       <div key={c.id} className="p-6 hover:bg-muted/10 transition-colors">
                           <div className="flex justify-between items-start mb-3">
                               <div>
                                   <h3 className="font-bold text-lg mb-1">{c.title}</h3>
                                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                       <span className="font-semibold text-foreground">From: {getUserName(c.user_id)}</span>
                                       <span>•</span>
                                       <span>{format(new Date(c.created_at + 'Z'), 'MMM d, yyyy h:mm a')}</span>
                                   </div>
                               </div>
                               <div className="flex flex-col items-end gap-2 shrink-0">
                                   <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${c.status === 'resolved' ? 'bg-green-100 text-green-700 border border-green-200' : c.status === 'in_review' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : c.status === 'closed' ? 'bg-muted text-muted-foreground border border-border' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>{c.status.replace('_', ' ')}</span>
                                   <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${c.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>{c.priority} Priority</span>
                               </div>
                           </div>
                           <div className="bg-background border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-2">
                               {c.description}
                           </div>
                       </div>
                   ))}
                   {!deptComplaints.length && <div className="p-8 text-sm text-muted-foreground text-center">No complaints targeted to this department.</div>}
               </div>
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
    </div>
  );
}
