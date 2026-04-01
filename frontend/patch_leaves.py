with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Leaves.tsx', 'r') as f:
    content = f.read()

# Make sure we don't have overlapping imports
if "import { Tabs" not in content:
    content = content.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';\nimport { useAuthStore } from '@/store/auth';")
    content = content.replace("export default function AdminLeaves() {", "export default function AdminLeaves() {\n  const { user } = useAuthStore();\n  const [activeTab, setActiveTab] = useState('all');")

content = content.replace("Leave Management", "Leave Applications")
content = content.replace("Review leave applications and monitor employee absences.", "View pending, active, and past leave applications.")

with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Leaves.tsx', 'w') as f:
    f.write(content)
