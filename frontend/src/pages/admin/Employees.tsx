import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeProfileModal } from '@/components/employee/EmployeeProfileModal';

export default function Employees() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const defaultForm = { 
    name: '', email: '', password: '', staff_no: '', job_title: '', 
    work_place: '', phone_number: '', next_of_kin: '', next_of_kin_phone: '', 
    employment_date: '', employment_duration: '', national_id: '', 
    has_computer: false, employment_status: 'full_time', department_id: '' 
  };
  const [formData, setFormData] = useState(defaultForm);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users/')).data
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = { ...data, department_id: data.department_id ? Number(data.department_id) : null };
      const res = await api.post('/users/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
      setFormData(defaultForm);
    }
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.post(`/users/${userId}/suspend`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!window.confirm("Are you sure you want to permanently delete this employee? This cannot be undone.")) return;
      const res = await api.delete(`/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

    const { data: empOptionData } = useQuery({ queryKey: ['settings', 'employment_options'], queryFn: async () => {
    try { const { data } = await api.get('/settings/employment_options'); return data.value; } catch { return [{name: 'Full Time', duration: '5 Years'}, {name: 'Probation (6 Months)', duration: '6 Months'}, {name: 'Probation (3 Months)', duration: '3 Months'}]; }
  }});
  const { data: jobTitleData } = useQuery({ queryKey: ['settings', 'job_titles'], queryFn: async () => {
    try { const { data } = await api.get('/settings/job_titles'); return data.value; } catch { return []; }
  }});
  const { data: workPlaceData } = useQuery({ queryKey: ['settings', 'work_places'], queryFn: async () => {
    try { const { data } = await api.get('/settings/work_places'); return data.value; } catch { return ['Yasian']; }
  }});

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments/')).data
  });

  const assignDeptMutation = useMutation({
    mutationFn: async ({ userId, deptId, isHead }: { userId: number, deptId: number | null, isHead: boolean }) => {
      const res = await api.patch(`/users/${userId}/department`, { department_id: deptId, is_department_head: isHead });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  

  const updateEmpStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: string }) => {
      const res = await api.patch(`/users/${userId}/employment-status`, { employment_status: status });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  return (

    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage user accounts and system access.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>Add Employee</Button>
      </div>
      
      {isFormOpen && (
        <Card>
          <CardHeader><CardTitle className="text-xl">New Employee</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="staff_no">Staff No.</Label>
                        <Input id="staff_no" value={formData.staff_no} onChange={e => setFormData(p => ({...p, staff_no: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title</Label>
                        <select id="job_title" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.job_title} onChange={e => setFormData(p => ({...p, job_title: e.target.value}))}>
                            <option value="">-- Select Job Title --</option>
                            {jobTitleData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="work_place">Work Place</Label>
                        <select id="work_place" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.work_place} onChange={e => setFormData(p => ({...p, work_place: e.target.value}))}>
                            {workPlaceData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input id="phone_number" value={formData.phone_number} onChange={e => setFormData(p => ({...p, phone_number: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="national_id">National ID</Label>
                        <Input id="national_id" value={formData.national_id} onChange={e => setFormData(p => ({...p, national_id: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="next_of_kin">Next of Kin</Label>
                        <Input id="next_of_kin" value={formData.next_of_kin} onChange={e => setFormData(p => ({...p, next_of_kin: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="next_of_kin_phone">Next of Kin Phone</Label>
                        <Input id="next_of_kin_phone" value={formData.next_of_kin_phone} onChange={e => setFormData(p => ({...p, next_of_kin_phone: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employment_date">Employment Date</Label>
                        <Input id="employment_date" type="text" placeholder="YYYY/MM/DD" value={formData.employment_date} onChange={e => setFormData(p => ({...p, employment_date: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employment_duration">Employment Duration</Label>
                        <Input id="employment_duration" value={formData.employment_duration} onChange={e => setFormData(p => ({...p, employment_duration: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employment_status">Employment Status</Label>
                        <select id="employment_status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.employment_status} onChange={e => setFormData(p => ({...p, employment_status: e.target.value}))}>
                            <option value="full_time">Full-time</option>
                            <option value="probation_3m">Probation (3 Months)</option>
                            <option value="probation_6m">Probation (6 Months)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department</Label>
                        <select id="department_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" value={formData.department_id} onChange={e => setFormData(p => ({...p, department_id: e.target.value}))}>
                            <option value="">-- No Department --</option>
                            {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 flex items-center gap-2 pt-8">
                        <input id="has_computer" type="checkbox" className="w-4 h-4" checked={formData.has_computer} onChange={e => setFormData(p => ({...p, has_computer: e.target.checked}))} />
                        <Label htmlFor="has_computer" className="mt-0">Employee has computer?</Label>
                    </div>
                </div>
                <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>Save Employee</Button>
                </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Staff No</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Employment Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{u.staff_no || '-'}</td>
                  <td className="px-4 py-3 font-medium">
                     <span className="cursor-pointer text-primary hover:underline font-bold" onClick={() => setSelectedUserId(u.id)}>
                        {u.name}
                     </span>
                     {u.is_department_head && <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-1">Head</span>}
                     {u.job_title && <div className="text-xs text-muted-foreground mt-1">{u.job_title}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                     <select 
                        className="border rounded p-1 text-xs max-w-[120px] bg-background"
                        value={u.employment_status || ''}
                        onChange={e => updateEmpStatusMutation.mutate({ userId: u.id, status: e.target.value })}
                        disabled={updateEmpStatusMutation.isPending || u.role === 'admin'}
                     >
                        {empOptionData?.map((o: any) => {
                              const text = o.name || o;
                              return <option key={text} value={text}>{text}</option>;
                            })}
                     </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[150px]" title={u.email}>{u.email}</td>
                  
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                       <select 
                          className="border rounded p-1 text-sm mr-2 max-w-[140px] bg-background"
                          value={u.department_id || ''}
                          onChange={e => assignDeptMutation.mutate({ userId: u.id, deptId: e.target.value ? Number(e.target.value) : null, isHead: u.is_department_head })}
                       >
                         <option value="">None</option>
                         {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                       </select>
                    )}
                    {u.department_id && u.role !== 'admin' && (
                       <label className="text-xs flex items-center gap-1 mt-1 cursor-pointer text-muted-foreground">
                          <input type="checkbox" checked={u.is_department_head} 
                                 onChange={e => assignDeptMutation.mutate({ userId: u.id, deptId: u.department_id, isHead: e.target.checked })} /> 
                          Is Head?
                       </label>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded inline-flex text-xs font-semibold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                        <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => suspendMutation.mutate(u.id)}
                              disabled={suspendMutation.isPending}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deleteMutation.mutate(u.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <EmployeeProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
