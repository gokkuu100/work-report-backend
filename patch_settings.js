const fs = require('fs');
const file = 'frontend/src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';",
  "import { Settings as SettingsIcon, Save, Plus, Trash2, X } from 'lucide-react';"
);

if (!content.includes('const [departmentsList, setDepartmentsList]')) {
  content = content.replace(
    "const [newWorkPlace, setNewWorkPlace] = useState('');",
    "const [newWorkPlace, setNewWorkPlace] = useState('');\n  const [departmentsList, setDepartmentsList] = useState<string[]>([]);\n  const [newDepartment, setNewDepartment] = useState('');"
  );
}

fs.writeFileSync(file, content);
console.log("Patched X and departments");
