const fs = require('fs');
const file = '/home/prince/Documents/yasian-dev/work-report-system/frontend/src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix !settingTime error that happened previously
content = content.replace('{!settingTime ? (', '{!settingTime ? ('); // Just double checking the condition, it seems it failed previously because he used !settingTime directly. Wait, the user aborted it with ^C in previous session.
// Need to find exactly what exists

// Let's replace the entire return block
const returnIndex = content.indexOf('  return (');
const headers = content.substring(0, returnIndex);

const newReturn = `  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-2">Manage application-wide preferences and configurations.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Reporting Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!settingTime ? (
            <div className="h-20 animate-pulse bg-muted rounded-xl" />
          ) : (
            <div className="space-y-3">
              <Label htmlFor="cutoffTime" className="text-base font-semibold">Report Submission Cutoff Time</Label>
              <p className="text-sm text-muted-foreground mb-4">
                  Set the daily deadline for report submissions. Any report submitted after this time will be flagged as <span className="text-yellow-600 font-bold bg-yellow-100 px-1.5 py-0.5 rounded uppercase text-[10px]">Late</span>.
              </p>
              
              <div className="flex items-center gap-4">
                <input
                    type="time"
                    id="cutoffTime"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    className="flex h-11 w-32 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button 
                    onClick={handleSave} 
                    disabled={updateMutation.isPending}
                    className="rounded-xl h-11"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}

          {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">{success}</div>}
          {error && <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">{error}</div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Job Titles */}
        <Card className="border-border/50 shadow-sm flex flex-col h-full">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
            <CardTitle className="text-base font-medium">Job Titles</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-background/50">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Add a new job title..."
                    className="h-10 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddArrayItem('job_titles', jobTitles, e.currentTarget.value, setNewJobTitle, setJobTitles);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">↵</span>
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '300px' }}>
              {jobTitles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No job titles configured</div>
              ) : (
                <ul className="space-y-1">
                  {jobTitles.map((item, idx) => (
                    <li key={idx} className="group flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                      <span className="text-sm font-medium text-foreground">{item}</span>
                      <button 
                        onClick={() => handleRemoveArrayItem('job_titles', jobTitles, item, setJobTitles)} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employment Statuses */}
        <Card className="border-border/50 shadow-sm flex flex-col h-full">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
            <CardTitle className="text-base font-medium">Employment Statuses</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-background/50">
               <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Add employment status..."
                    className="h-10 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddArrayItem('employment_options', employmentStatuses, e.currentTarget.value, setNewEmploymentStatus, setEmploymentStatuses);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">↵</span>
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '300px' }}>
              {employmentStatuses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No employment statuses configured</div>
              ) : (
                <ul className="space-y-1">
                  {employmentStatuses.map((item, idx) => (
                    <li key={idx} className="group flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                      <span className="text-sm font-medium text-foreground">{item}</span>
                      <button 
                        onClick={() => handleRemoveArrayItem('employment_options', employmentStatuses, item, setEmploymentStatuses)} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card className="border-border/50 shadow-sm flex flex-col h-full">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
            <CardTitle className="text-base font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-background/50">
               <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Add a department..."
                    className="h-10 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddArrayItem('departments_list', departmentsList, e.currentTarget.value, setNewDepartment, setDepartmentsList);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">↵</span>
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '300px' }}>
              {departmentsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No departments configured</div>
              ) : (
                <ul className="space-y-1">
                  {departmentsList.map((item, idx) => (
                    <li key={idx} className="group flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                      <span className="text-sm font-medium text-foreground">{item}</span>
                      <button 
                        onClick={() => handleRemoveArrayItem('departments_list', departmentsList, item, setDepartmentsList)} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Places */}
        <Card className="border-border/50 shadow-sm flex flex-col h-full">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
            <CardTitle className="text-base font-medium">Work Places</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-background/50">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Add a work place..."
                    className="h-10 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddArrayItem('work_places', workPlaces, e.currentTarget.value, setNewWorkPlace, setWorkPlaces);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">↵</span>
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '300px' }}>
              {workPlaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No work places configured</div>
              ) : (
                <ul className="space-y-1">
                  {workPlaces.map((item, idx) => (
                    <li key={idx} className="group flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                      <span className="text-sm font-medium text-foreground text-left">{item}</span>
                      <button 
                        onClick={() => handleRemoveArrayItem('work_places', workPlaces, item, setWorkPlaces)} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all duration-200"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`;

fs.writeFileSync(file, headers + newReturn);
console.log("Rewrote UI successfully");
