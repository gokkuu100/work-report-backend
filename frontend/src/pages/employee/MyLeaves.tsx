import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Palmtree, ChevronLeft, ChevronRight, FileSymlink, Trash2 } from 'lucide-react';
import { LeaveApplicationModal } from '@/components/leaves/LeaveApplicationModal';

export default function MyLeaves() {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const queryClient = useQueryClient();

  const withdrawMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/leaves/${id}/withdraw`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      alert('Leave application withdrawn successfully');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to withdraw leave');
    }
  });

  const handleWithdraw = (id: number) => {
    if (confirm('Are you sure you want to withdraw this leave application?')) {
      withdrawMutation.mutate(id);
    }
  };

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => {
      const { data } = await api.get('/leaves/me');
      return data;
    }
  });

  const getLeaveDays = (start: string, end: string) => {
    let count = 0;
    const current = parseISO(start);
    const endDate = parseISO(end);
    while (current <= endDate) {
        if (current.getDay() !== 0) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getStatusBadge = (deptStatus: string, hrStatus: string) => {
    if (hrStatus === 'rejected' || deptStatus === 'rejected') {
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold uppercase tracking-wider border border-red-200">Rejected</span>;
    }
    if (hrStatus === 'approved') {
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold uppercase tracking-wider border border-green-200">Approved</span>;
    }
    if (deptStatus === 'approved' && hrStatus === 'pending') {
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-wider border border-blue-200">Awaiting HR</span>;
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold uppercase tracking-wider border border-yellow-200">Pending Dept Head</span>;
  };

  const leavesList = leaves || [];
  const totalPages = Math.ceil(leavesList.length / itemsPerPage);
  const paginatedLeaves = leavesList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             <Calendar className="w-8 h-8 text-primary" /> My Leave Applications
          </h1>
          <p className="text-muted-foreground text-sm">View your leave history and check the status of your applications.</p>
        </div>
        <Button onClick={() => setIsLeaveModalOpen(true)} className="gap-2 shrink-0">
            <Palmtree className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-lg">Application History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading history...</div>
          ) : leavesList.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground space-y-3">
               <FileSymlink className="w-10 h-10 opacity-20" />
               <p>You have not applied for any leaves yet.</p>
            </div>
          ) : (
            <div className="divide-y">
               {paginatedLeaves.map((l: any) => (
                   <div key={l.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-sm hover:bg-muted/5 transition-colors gap-4">
                       <div className="flex-1">
                           <div className="flex items-center gap-3 mb-1">
                             <span className="capitalize px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold text-muted-foreground tracking-wider">{l.leave_type} Leave</span>
                             {getStatusBadge(l.dept_head_status, l.hr_admin_status)}
                           </div>
                           <p className="font-medium text-foreground mb-1">{l.start_date} to {l.end_date} • <span className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">{l.requested_days || getLeaveDays(l.start_date, l.end_date)} days</span></p>
                           <p className="text-xs text-muted-foreground line-clamp-1 border-l-2 pl-2 mt-2">{l.reason}</p>
                       </div>
                       <div className="text-xs text-muted-foreground whitespace-nowrap md:text-right flex flex-col items-start md:items-end gap-1">
                           <span>Applied on {format(new Date(l.created_at + 'Z'), 'MMM do')}</span>
                           {l.document_url && (
                               <a href={l.document_url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                                   <FileSymlink className="w-3 h-3" /> View Document
                               </a>
                           )}
                           {l.hr_admin_status !== 'approved' && l.dept_head_status !== 'approved' && l.hr_admin_status !== 'rejected' && l.dept_head_status !== 'rejected' && (
                               <Button variant="ghost" size="sm" onClick={() => handleWithdraw(l.id)} disabled={withdrawMutation.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-2 h-7 px-2 text-xs">
                                   <Trash2 className="w-3 h-3 mr-1" /> Withdraw
                               </Button>
                           )}
                       </div>
                   </div>
               ))}
            </div>
          )}
          
          {totalPages > 1 && (
             <div className="p-4 border-t flex items-center justify-between text-sm">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                   disabled={currentPage === 1}
                 >
                   <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                 </Button>
                 <span className="text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                   disabled={currentPage === totalPages}
                 >
                   Next <ChevronRight className="w-4 h-4 ml-1" />
                 </Button>
             </div>
          )}
        </CardContent>
      </Card>

      <LeaveApplicationModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
    </div>
  );
}
