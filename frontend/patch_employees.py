with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Employees.tsx', 'r') as f:
    content = f.read()

# Remove the Role column header
content = content.replace('<th className="px-4 py-3 font-medium">Role</th>', '')

# Remove the Role td cell entirely
old_td = """<td className="px-4 py-3 capitalize text-xs">
                     <span className="font-semibold block">{u.role}</span>
                     {u.role !== 'admin' && (
                         <label className="flex items-center gap-1 mt-1 cursor-pointer text-muted-foreground">
                             <input type="checkbox" checked={u.is_hr} 
                                   onChange={e => assignHrMutation.mutate({ userId: u.id, isHr: e.target.checked })} />
                             Is HR?
                         </label>
                     )}
                  </td>"""
                  
# Wait, let's use regex or string replace with careful matching
