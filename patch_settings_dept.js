const fs = require('fs');
const file = 'frontend/src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const queryLine = "const { data: workPlaceData } = useQuery({ queryKey: ['settings', 'work_places'], queryFn: () => fetchSetting('work_places', ['Yasian']) });";
const newQueryLine = `const { data: workPlaceData } = useQuery({ queryKey: ['settings', 'work_places'], queryFn: () => fetchSetting('work_places', ['Yasian']) });
  const { data: deptData } = useQuery({ queryKey: ['settings', 'departments_list'], queryFn: () => fetchSetting('departments_list', ['HR', 'IT', 'Sales']) });`;

content = content.replace(queryLine, newQueryLine);

const effectLine = "useEffect(() => { if (workPlaceData) setWorkPlaces(workPlaceData); }, [workPlaceData]);";
const newEffectLine = `useEffect(() => { if (workPlaceData) setWorkPlaces(workPlaceData); }, [workPlaceData]);
  useEffect(() => { if (deptData) setDepartmentsList(deptData); }, [deptData]);`;

content = content.replace(effectLine, newEffectLine);

fs.writeFileSync(file, content);
console.log("Patched departments queries");
