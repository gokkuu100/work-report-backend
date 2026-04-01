import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const queryClient = useQueryClient();
  const [cutoffTime, setCutoffTime] = useState('17:00');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  type EmpOption = { name: string; duration: string };
  const [employmentStatuses, setEmploymentStatuses] = useState<EmpOption[]>([]);
  const [newEmpStatusName, setNewEmpStatusName] = useState('');
  const [newEmpStatusDuration, setNewEmpStatusDuration] = useState('');
  
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  
  const [workPlaces, setWorkPlaces] = useState<string[]>([]);
  const [newWorkPlace, setNewWorkPlace] = useState('');

  const fetchSetting = async (key: string, defaultValue: any) => {
      try {
        const { data } = await api.get(`/settings/${key}`);
        return data.value ? JSON.parse(data.value) : defaultValue;
      } catch (e: any) {
        if (e.response?.status === 404) return defaultValue;
        throw e;
      }
  };

  const { data: settingTime } = useQuery({ queryKey: ['settings', 'report_cutoff_time'], queryFn: async () => {
      try { const { data } = await api.get('/settings/report_cutoff_time'); return data.value; } 
      catch (e: any) { if (e.response?.status === 404) return '17:00'; throw e; }
  }});

  const { data: empOptionData } = useQuery({ 
      queryKey: ['settings', 'employment_options'], 
      queryFn: () => fetchSetting('employment_options', [
          { name: 'Full Time', duration: '5 Years' }, 
          { name: 'Probation (6 Months)', duration: '6 Months' },
          { name: 'Probation (3 Months)', duration: '3 Months' }
      ])
  });

  const { data: jobTitleData } = useQuery({ queryKey: ['settings', 'job_titles'], queryFn: () => fetchSetting('job_titles', ['Shop Assistant', 'General Clerk', 'Manager']) });
  const { data: workPlaceData } = useQuery({ queryKey: ['settings', 'work_places'], queryFn: () => fetchSetting('work_places', ['Yasian']) });

  useEffect(() => { if (settingTime) setCutoffTime(settingTime); }, [settingTime]);
  useEffect(() => { if (empOptionData) setEmploymentStatuses(empOptionData); }, [empOptionData]);
  useEffect(() => { if (jobTitleData) setJobTitles(jobTitleData); }, [jobTitleData]);
  useEffect(() => { if (workPlaceData) setWorkPlaces(workPlaceData); }, [workPlaceData]);

  const updateMutation = useMutation({
    mutationFn: async (val: string) => {
      const { data } = await api.put('/settings/report_cutoff_time', { value: val });
      return data;
    },
    onSuccess: () => {
      setSuccess('Settings saved successfully!');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (e: any) => {
      setError(e.response?.data?.detail || 'Failed to save settings');
      setTimeout(() => setError(''), 3000);
    }
  });

  const arraySettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any[] }) => {
        const { data } = await api.put(`/settings/${key}`, { value: JSON.stringify(value) });
        return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] })
  });

  const handleAddStringItem = (key: string, stateArr: string[], value: string, arrSetter: any, valSetter: any) => {
      if (!value.trim()) return;
      const updated = [...stateArr, value.trim()];
      arrSetter(updated);
      arraySettingMutation.mutate({ key, value: updated });
      valSetter('');
  };

  const handleRemoveStringItem = (key: string, stateArr: string[], itemToRemove: string, arrSetter: any) => {
      const updated = stateArr.filter(i => i !== itemToRemove);
      arrSetter(updated);
      arraySettingMutation.mutate({ key, value: updated });
  };

  const handleAddEmpOption = () => {
      if (!newEmpStatusName.trim() || !newEmpStatusDuration.trim()) return;
      const updated = [...employmentStatuses, { name: newEmpStatusName.trim(), duration: newEmpStatusDuration.trim() }];
      setEmploymentStatuses(updated);
      arraySettingMutation.mutate({ key: 'employment_options', value: updated });
      setNewEmpStatusName('');
      setNewEmpStatusDuration('');
  };

  const handleRemoveEmpOption = (itemToRemoveName: any) => {
      const updated = employmentStatuses.filter(i => i.name !== itemToRemoveName);
      setEmploymentStatuses(updated);
      arraySettingMutation.mutate({ key: 'employment_options', value: updated });
  };

  const handleSaveTime = () => updateMutation.mutate(cutoffTime);

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Settings</h1>
        <p className="text-muted-foreground text-sm">Configure system parameters and dropdown lists.</p>
      </div>

      {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">{success}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Card className="col-span-full md:col-span-2 lg:col-span-3 border-border/50 shadow-sm bg-card/50 overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardHeader className="bg-muted/50 border-b border-border/50 p-6">
                <CardTitle className="text-lg">Reporting Policies</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <Label htmlFor="cutoffTime" className="text-base font-semibold">Report Submission Cutoff Time</Label>
                <p className="text-sm text-muted-foreground">Set the daily deadline for report submissions.</p>
                <div className="flex items-center gap-4">
                    <Input
                        type="time"
                        id="cutoffTime"
                        value={cutoffTime}
                        onChange={(e) => setCutoffTime(e.target.value)}
                        className="w-32"
                    />
                    <Button onClick={handleSaveTime} disabled={updateMutation.isPending} className="px-6"> 
                        <Save className="w-4 h-4 mr-2" /> Save policy
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 overflow-hidden hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-muted/50 border-b border-border/50 p-4">
            <CardTitle className="text-base">Job Titles</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="New job title..."
                value={newJobTitle}
                onChange={e => setNewJobTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStringItem('job_titles', jobTitles, newJobTitle, setJobTitles, setNewJobTitle);
                }}
              />
              <Button onClick={() => handleAddStringItem('job_titles', jobTitles, newJobTitle, setJobTitles, setNewJobTitle)} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobTitles.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-secondary text-secondary-foreground pl-3 pr-2 py-1.5 rounded-md text-sm border w-full">
                  <span>{item}</span>
                  <button onClick={() => handleRemoveStringItem('job_titles', jobTitles, item, setJobTitles)} className="hover:text-destructive text-muted-foreground p-1 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 overflow-hidden hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-muted/50 border-b border-border/50 p-4">
            <CardTitle className="text-base">Work Places</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="New work place..."
                value={newWorkPlace}
                onChange={e => setNewWorkPlace(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStringItem('work_places', workPlaces, newWorkPlace, setWorkPlaces, setNewWorkPlace);
                }}
              />
              <Button onClick={() => handleAddStringItem('work_places', workPlaces, newWorkPlace, setWorkPlaces, setNewWorkPlace)} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {workPlaces.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-secondary text-secondary-foreground pl-3 pr-2 py-1.5 rounded-md text-sm border w-full">
                  <span>{item}</span>
                  <button onClick={() => handleRemoveStringItem('work_places', workPlaces, item, setWorkPlaces)} className="hover:text-destructive text-muted-foreground p-1 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 overflow-hidden hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-muted/50 border-b border-border/50 p-4">
            <CardTitle className="text-base">Employment Statuses</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-2 border-b pb-4">
              <Input
                type="text"
                placeholder="Status Name (e.g. Probation 3M)..."
                value={newEmpStatusName}
                onChange={e => setNewEmpStatusName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Duration (e.g. 3 Months)..."
                value={newEmpStatusDuration}
                onChange={e => setNewEmpStatusDuration(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddEmpOption();
                }}
              />
              <Button onClick={handleAddEmpOption} size="sm" className="w-full mt-1">Add Status & Duration</Button>
            </div>
            <div className="flex flex-col gap-2">
              {employmentStatuses.map((item, idx) => (
                <div key={idx} className="flex flex-col bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border">
                  <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{typeof item === 'object' ? item.name : item}</span>
                      <button onClick={() => handleRemoveEmpOption(item.name || item)} className="hover:text-destructive text-muted-foreground transition-colors p-1">
                        <X className="h-4 w-4" />
                      </button>
                  </div>
                  <div className="text-xs text-muted-foreground">Duration: {item.duration || 'Not set'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
