import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth';
import { differenceInDays, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Check, X, Ban } from 'lucide-react';

export default function AdminLeaves() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const itemsPerPage = 10;

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['admin-leaves'],
    queryFn: async () => {
        const { data } = await api.get('/leaves/');
        return data || [];
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users/')).data
  });

  const approveHrMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/leaves/${id}/approve-hr`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leaves'] })
  });
  
  const rejectHrMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/leaves/${id}/reject-hr`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leaves'] })
  });
  
  const suspendLeaveMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/leaves/${id}/reject-hr`), // Treating suspend as reject/revoke for now
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leaves'] })
  });

  const getUserName = (id: number) => {
    if (!users) return id;
    return users.find((u: any) => u.id === id)?.name || id;
  };

  const getLeaveDays = (start: string, end: string, requested: number) => {
      if (requested) return requested;
      try {
          const days = differenceInDays(parseISO(end), parseISO(start)) + 1;
          return days > 0 ? days : 0;
      } catch (e) {
          return 0;
      }
  };

  const isLoading = leavesLoading || usersLoading;
  
  const today = startOfDay(new Date());
  
  // Tab filtered leaves
  const getFilteredByTab = (leavesProp: any[]) => {
      if (!leavesProp) return [];
      switch(activeTab) {
          case 'pending':
              return leavesProp.filter(l => l.hr_admin_status === 'pending');
          case 'active':
              return leavesProp.filter(l => {
                  if (l.hr_admin_status !== 'approved' || l.dept_head_status !== 'approved') return false;
                  return isWithinInterval(today, { start: startOfDay(parseISO(l.start_date)), end: startOfDay(parseISO(l.end_date)) });
              });
          case 'history':
              return leavesProp.filter(l => l.end_date && startOfDay(parseISO(l.end_date)) < today);
          default:
              return leavesProp;
      }
  };

  const filteredLeaves = getFilteredByTab(leaves)?.filter((l: any) => {
      if (!filterText) return true;
      const lowerFilter = filterText.toLowerCase();
      const userName = String(getUserName(l.user_id)).toLowerCase();
      return userName.includes(lowerFilter) || 
             l.leave_type.toLowerCase().includes(lowerFilter) || 
             l.dept_head_status.toLowerCase().includes(lowerFilter) ||
             l.hr_admin_status.toLowerCase().includes(lowerFilter);
  }) || [];

  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Applications</h1>
          <p className="text-muted-foreground text-sm">View pending, active, and past leave applications.</p>
        </div>
        <div className="w-full md:w-64">
           <Input 
             placeholder="Filter by name, type, or status..." 
             value={filterText} 
             onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }} 
           />
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-48 bg-muted animate-pulse rounded-xl"></div>
      ) : (
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Currently on Leave</TabsTrigger>
            <TabsTrigger value="history">History (Past)</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
          <div className="border rounded-md bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Type / Info</th>
                    <th className="px-4 py-3">Department Head</th>
                    <th className="px-4 py-3">HR Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedLeaves?.map((l: any) => {
                    const isOngoing = isWithinInterval(today, { start: startOfDay(parseISO(l.start_date)), end: startOfDay(parseISO(l.end_date)) });
                    return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                         <span className="text-primary font-bold">
                              {getUserName(l.user_id)}
                         </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {l.start_date} &rarr; {l.end_date}
                          <div className="text-xs text-indigo-600 font-semibold mt-1">{getLeaveDays(l.start_date, l.end_date, l.requested_days)} Days</div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                          <span className="capitalize bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground tracking-wider mb-1 inline-block">{l.leave_type}</span>
                          {l.reason && <p className="text-xs text-muted-foreground italic truncate" title={l.reason}>"{l.reason}"</p>}
                      </td>
                      <td className="px-4 py-4">
                          <span className={`capitalize px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${l.dept_head_status === 'approved' ? 'bg-green-100 text-green-700' : l.dept_head_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                               {l.dept_head_status}
                          </span>
                      </td>
                      <td className="px-4 py-4">
                          <span className={`capitalize px-2 py-1 rounded text-xs font-bold tracking-wide whitespace-nowrap ${l.hr_admin_status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : l.hr_admin_status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                               {l.hr_admin_status}
                          </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                          {user?.role === 'admin' ? (
                              <div className="flex gap-2 justify-end">
                                  {l.hr_admin_status !== 'rejected' && isOngoing && (
                                     <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Suspend Leave" onClick={() => suspendLeaveMutation.mutate(l.id)} disabled={suspendLeaveMutation.isPending}>
                                         <Ban className="w-4 h-4 mr-1" /> Suspend
                                     </Button>
                                  )}
                              </div>
                          ) : (
                              l.hr_admin_status === 'pending' && l.dept_head_status === 'approved' ? (
                                  <div className="flex gap-2 justify-end">
                                      <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200" title="Reject" onClick={() => rejectHrMutation.mutate(l.id)} disabled={rejectHrMutation.isPending || approveHrMutation.isPending}>
                                          <X className="w-4 h-4" />
                                      </Button>
                                      <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white shadow-sm" title="Approve" onClick={() => approveHrMutation.mutate(l.id)} disabled={approveHrMutation.isPending || rejectHrMutation.isPending}>
                                          <Check className="w-4 h-4" />
                                      </Button>
                                  </div>
                              ) : (
                                   <span className="text-[10px] font-medium text-muted-foreground uppercase">{l.hr_admin_status === 'pending' ? 'Awaiting' : 'Processed'}</span>
                              )
                          )}
                      </td>
                    </tr>
                  )})}
                  {paginatedLeaves.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No applications found in this category.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
