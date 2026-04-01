const fs = require('fs');
const file = 'frontend/src/pages/admin/Employees.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add settings queries
const queryTarget = "const { data: departments } = useQuery({";
const queryInsert = `  const { data: empOptionData } = useQuery({ queryKey: ['settings', 'employment_options'], queryFn: async () => {
    try { const { data } = await api.get('/settings/employment_options'); return data.value; } catch { return ['Full Time', 'Probation (6 Months)', 'Probation (3 Months)']; }
  }});
  const { data: jobTitleData } = useQuery({ queryKey: ['settings', 'job_titles'], queryFn: async () => {
    try { const { data } = await api.get('/settings/job_titles'); return data.value; } catch { return []; }
  }});
  const { data: workPlaceData } = useQuery({ queryKey: ['settings', 'work_places'], queryFn: async () => {
    try { const { data } = await api.get('/settings/work_places'); return data.value; } catch { return ['Yasian']; }
  }});

  const { data: departments } = useQuery({`;

content = content.replace(queryTarget, queryInsert);

// Default work_place to "Yasian" on form reset
const resetTarget = "setFormData({ name: '', email: '', password: '', status: 'active', staff_no: '', job_title: '', phone_number: '', work_place: '', national_id: '', next_of_kin: '', next_of_kin_phone: '', employment_date: '', employment_duration: '', employment_status: 'full_time', has_computer: false });";
const resetReplace = "setFormData({ name: '', email: '', password: '', status: 'active', staff_no: '', job_title: jobTitleData?.[0] || '', phone_number: '', work_place: workPlaceData?.[0] || 'Yasian', national_id: '', next_of_kin: '', next_of_kin_phone: '', employment_date: '', employment_duration: '', employment_status: empOptionData?.[0] || 'Full Time', has_computer: false });";
content = content.replace(resetTarget, resetReplace);

// 2. handleEmpStatusChange
const formChangeTarget = "const handleAdd = (e: React.FormEvent) => {";
const formChangeInsert = `
    const handleEmpStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const match = val.match(/\\(([^)]+)\\)/);
        let duration = '';
        if (match) {
            duration = match[1];
        } else if (val.toLowerCase().includes('time')) {
            duration = '5 Years';
        }
        setFormData(p => ({...p, employment_status: val, employment_duration: duration}));
    };

    const handleAdd = (e: React.FormEvent) => {`;
content = content.replace(formChangeTarget, formChangeInsert);

// Job Title Select
const jobTitleTarget = `<Input id="job_title" value={formData.job_title} onChange={e => setFormData(p => ({...p, job_title: e.target.value}))} />`;
const jobTitleReplace = `<select id="job_title" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.job_title} onChange={e => setFormData(p => ({...p, job_title: e.target.value}))}>
                            <option value="">-- Select Job Title --</option>
                            {jobTitleData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                        </select>`;
content = content.replace(jobTitleTarget, jobTitleReplace);

// Work Place Select
const workPlaceTarget = `<Input id="work_place" value={formData.work_place} onChange={e => setFormData(p => ({...p, work_place: e.target.value}))} />`;
const workPlaceReplace = `<select id="work_place" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.work_place} onChange={e => setFormData(p => ({...p, work_place: e.target.value}))}>
                            {workPlaceData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                        </select>`;
content = content.replace(workPlaceTarget, workPlaceReplace);

// Employment Status Add Form Select
const empStatTarget1 = `<select id="employment_status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.employment_status} onChange={e => setFormData(p => ({...p, employment_status: e.target.value}))}>                 
                            <option value="full_time">Full-time</option>
                            <option value="probation_3m">Probation (3 Months)</option>
                            <option value="probation_6m">Probation (6 Months)</option>
                        </select>`;
const empStatReplace1 = `<select id="employment_status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.employment_status} onChange={handleEmpStatusChange}>                 
                            {empOptionData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                        </select>`;
content = content.replace(empStatTarget1, empStatReplace1);

// Employment Status Inline Grid Select
const empStatTarget2 = `<select 
                        className="border rounded p-1 text-xs"
                        value={u.employment_status || 'full_time'}
                        onChange={e => updateEmpStatusMutation.mutate({ userId: u.id, status: e.target.value })}
                        disabled={updateEmpStatusMutation.isPending || u.role === 'admin'}
                     >
                        <option value="full_time">Full-time</option>
                        <option value="probation_3m">Probation (3 Months)</option>
                        <option value="probation_6m">Probation (6 Months)</option>
                     </select>`;
const empStatReplace2 = `<select 
                        className="border rounded p-1 text-xs max-w-[120px] bg-background"
                        value={u.employment_status || ''}
                        onChange={e => updateEmpStatusMutation.mutate({ userId: u.id, status: e.target.value })}
                        disabled={updateEmpStatusMutation.isPending || u.role === 'admin'}
                     >
                        {empOptionData?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                     </select>`;
content = content.replace(empStatTarget2, empStatReplace2);

// Department Select & Is HR cleanup inline
const deptTarget = `                    {u.role !== 'admin' && (
                       <select 
                          className="border rounded p-1 text-sm mr-2"
                          value={u.department_id || ''}
                          onChange={e => assignDeptMutation.mutate({ userId: u.id, deptId: e.target.value ? Number(e.target.value) : null, isHead: u.is_department_head })}
                       >
                         <option value="">None</option>
                         {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                       </select>
                    )}
                    {u.department_id && (
                       <label className="text-xs flex items-center gap-1 mt-1 cursor-pointer">
                          <input type="checkbox" checked={u.is_department_head} 
                                 onChange={e => assignDeptMutation.mutate({ userId: u.id, deptId: u.department_id, isHead: e.target.checked })} /> 
                          Is Head?
                       </label>
                    )}
                    {u.role !== 'admin' && (
                       <label className="text-xs flex items-center gap-1 mt-1 cursor-pointer">
                          <input type="checkbox" checked={u.is_hr} 
                                 onChange={e => assignHrMutation.mutate({ userId: u.id, isHr: e.target.checked })} /> 
                          Is HR?
                       </label>
                    )}`;

const deptReplace = `                    {u.role !== 'admin' && (
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
                    )}`;
content = content.replace(deptTarget, deptReplace);

fs.writeFileSync(file, content);
console.log("Patched Employees with select inputs from settings & cleaned department head items!");
