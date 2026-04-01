import re

with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Employees.tsx', 'r') as f:
    content = f.read()

# Remove column header
content = content.replace('<th className="px-4 py-3 font-medium">Role</th>\n', '')

# Remove entire td block for the Role column using a non-greedy regex
content = re.sub(r'<td className="px-4 py-3 capitalize text-xs">.*?</td>', '', content, flags=re.DOTALL)

with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Employees.tsx', 'w') as f:
    f.write(content)
