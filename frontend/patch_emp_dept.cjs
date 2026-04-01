const fs = require('fs');
const file = '/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Employees.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add department_id to defaultForm
content = content.replace(
  "has_computer: false, employment_status: 'full_time'",
  "has_computer: false, employment_status: 'full_time', department_id: ''"
);
content = content.replace(
  "has_computer: false, employment_status: empOptionData?.[0] || 'Full Time'",
  "has_computer: false, employment_status: empOptionData?.[0] || 'Full Time', department_id: ''"
);
content = content.replace(
  "employment_status: (empOptionData?.[0]?.name || empOptionData?.[0]) || 'Full Time'",
  "employment_status: (empOptionData?.[0]?.name || empOptionData?.[0]) || 'Full Time', department_id: ''"
);

// 2. Fix the create mutation payload
content = content.replace(
  "const res = await api.post('/users/', data);",
  "const payload = { ...data, department_id: data.department_id ? Number(data.department_id) : null };\n      const res = await api.post('/users/', payload);"
);

// 3. Add the select field to the form
// Find "work_place" to insert before it or "employment_status"
const insertAfterStr = `<div className="space-y-2">
                        <Label htmlFor="employment_status">Employment Status</Label>
                        <select id="employment_status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.employment_status} onChange={handleEmpStatusChange}>                 
                            {empOptionData?.map((o: any) => {
                           const text = o.name || o;
                           return <option key={text} value={text}>{text}</option>;
                        })}
                        </select>
                    </div>`;
                    
const regexOptionMap = /<div className="space-y-2">\s*<Label htmlFor="employment_status">Employment Status<\/Label>\s*<select id="employment_status"[\s\S]*?<\/select>\s*<\/div>/g;

const newDeptSelect = `
                    <div className="space-y-2">
                        <Label htmlFor="department_id">Department</Label>
                        <select id="department_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" value={formData.department_id} onChange={e => setFormData(p => ({...p, department_id: e.target.value}))}>
                            <option value="">-- No Department --</option>
                            {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>`;

content = content.replace(regexOptionMap, match => match + newDeptSelect);

fs.writeFileSync(file, content);
console.log('Patched frontend to include new user department_id select');
