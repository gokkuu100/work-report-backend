with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/employee/DailyReport.tsx', 'r') as f:
    content = f.read()

import_replacement = "import { useState, useRef } from 'react';\nimport { useAuthStore } from '@/store/auth';"
content = content.replace("import { useState, useRef } from 'react';", import_replacement)

render_init = """export default function DailyReport() {
  const { user } = useAuthStore();
  const isWeeklyReporter = user?.department?.name === 'HR' || user?.department?.name === 'Admin / Procurement' || user?.is_hr;
  const isSaturday = new Date().getDay() === 6;
"""
content = content.replace("export default function DailyReport() {", render_init)

view_replacement = """<p className="text-muted-foreground text-sm">Submit your {isWeeklyReporter ? 'weekly' : 'daily'} activities for {format(new Date(), 'EEEE, MMMM do yyyy')}</p>
      </div>
      
      {isWeeklyReporter && !isSaturday ? (
          <Card className="shadow-sm border-amber-200 bg-amber-50/50">
              <CardContent className="p-8 text-center text-amber-700 font-medium">
                  HR and Admin/Procurement departments submit weekly reports on Saturdays only.
                  <br />Please return on Saturday to submit your weekly report.
              </CardContent>
          </Card>
      ) : (
      <Card className="shadow-sm">"""
content = content.replace("""<p className="text-muted-foreground text-sm">Submit your daily activities for {format(new Date(), 'EEEE, MMMM do yyyy')}</p>
      </div>
      
      <Card className="shadow-sm">""", view_replacement)

# Close the newly opened conditional block
end_replacement = """        </CardContent>
      </Card>
      )}
    </div>"""

content = content.replace("""        </CardContent>
      </Card>
    </div>""", end_replacement)

content = content.replace("<h1>Daily Report</h1>", "<h1>{isWeeklyReporter ? 'Weekly Report' : 'Daily Report'}</h1>")
content = content.replace("Daily Report</h1", "{isWeeklyReporter ? 'Weekly Report' : 'Daily Report'}</h1")

with open('/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/employee/DailyReport.tsx', 'w') as f:
    f.write(content)
