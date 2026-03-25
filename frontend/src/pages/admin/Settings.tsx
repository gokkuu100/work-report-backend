import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [cutoffTime, setCutoffTime] = useState('17:00');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: setting, isLoading } = useQuery({
    queryKey: ['settings', 'report_cutoff_time'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/settings/report_cutoff_time');
        return data;
      } catch (e: any) {
        if (e.response?.status === 404) {
          return null; // not set yet
        }
        throw e;
      }
    }
  });

  useEffect(() => {
    if (setting?.value) {
      setCutoffTime(setting.value);
    }
  }, [setting]);

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
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save settings');
      setSuccess('');
    }
  });

  const handleSave = () => {
    if (!cutoffTime) return;
    updateMutation.mutate(cutoffTime);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure global application behaviors and parameters.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-lg">Reporting Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
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
                    className="flex h-11 w-32 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">{error}</div>}
          
        </CardContent>
      </Card>
    </div>
  );
}
