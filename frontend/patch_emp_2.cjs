const fs = require('fs');
const file = 'src/pages/admin/Employees.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove assignHrMutation
const hrMutationPattern = /const assignHrMutation = useMutation\(\{\s*mutationFn: async \(\{ userId, isHr \}: \{ userId: number, isHr: boolean \}\) => \{\s*const res = await api.patch\(`\/users\/\$\{userId\}\/hr`, \{ is_hr: isHr \}\);\s*return res\.data;\s*\},\s*onSuccess: \(\) => queryClient\.invalidateQueries\(\{ queryKey: \['users'\] \}\)\s*\}\);/gs;
content = content.replace(hrMutationPattern, '');

// 2. Fix the empOptionData init query in Employees.tsx
content = content.replace(
  "return ['Full Time', 'Probation (6 Months)', 'Probation (3 Months)'];",
  "return [{name: 'Full Time', duration: '5 Years'}, {name: 'Probation (6 Months)', duration: '6 Months'}, {name: 'Probation (3 Months)', duration: '3 Months'}];"
);
content = content.replace(
  "employment_status: empOptionData?.[0] || 'Full Time'",
  "employment_status: (empOptionData?.[0]?.name || empOptionData?.[0]) || 'Full Time'"
);

// 3. Fix handleEmpStatusChange
content = content.replace(
  `        const val = e.target.value;
        const match = val.match(/\\(([^)]+)\\)/);
        let duration = '';
        if (match) {
            duration = match[1];
        } else if (val.toLowerCase().includes('time')) {
            duration = '5 Years';
        }
        setFormData(p => ({...p, employment_status: val, employment_duration: duration}));`,
  `        const val = e.target.value;
        const optionObj = empOptionData?.find((o: any) => (o.name || o) === val);
        const duration = optionObj?.duration || '';
        setFormData(p => ({...p, employment_status: val, employment_duration: duration}));`
);

// 4. Update empOptionData mapping in Employees.tsx
content = content.replace(
  "{empOptionData?.map((o: any) => <option key={o} value={o}>{o}</option>)}",
  "{empOptionData?.map((o: any) => {\n                              const text = o.name || o;\n                              return <option key={text} value={text}>{text}</option>;\n                            })}"
);
content = content.replace(
  "{empOptionData?.map((o: any) => <option key={o} value={o}>{o}</option>)}",
  "{empOptionData?.map((o: any) => {\n                           const text = o.name || o;\n                           return <option key={text} value={text}>{text}</option>;\n                        })}"
);

fs.writeFileSync(file, content);
console.log("Patched Employees HR and employment Status.");

// 5. Fix Settings.tsx TS Errors
const settingsFile = 'src/pages/admin/Settings.tsx';
let settingsContent = fs.readFileSync(settingsFile, 'utf8');

settingsContent = settingsContent.replace(
  `{item.name || item}`, 
  `{typeof item === 'object' ? item.name : item}`
);
settingsContent = settingsContent.replace(
  `{item.name || item}`, 
  `{typeof item === 'object' ? item.name : item}`
);
settingsContent = settingsContent.replace(
  `itemToRemoveName: string`,
  `itemToRemoveName: any`
);
fs.writeFileSync(settingsFile, settingsContent);
console.log("Patched Settings TS error.");
