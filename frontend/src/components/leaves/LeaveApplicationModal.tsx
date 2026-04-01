import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, UploadCloud } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveApplicationModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const computeDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    let d1 = new Date(start);
    const d2 = new Date(end);
    let days = 0;
    while (d1 <= d2) {
      if (d1.getDay() !== 0) days++; // Exclude Sunday
      d1.setDate(d1.getDate() + 1);
    }
    return days;
  };

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      let document_url = null;
      if (file) {
        // Get presigned URL
        const presignedRes = await api.post('/uploads/presigned-url', {
          filename: file.name,
          content_type: file.type || 'application/octet-stream'
        });
        const { url, file_key } = presignedRes.data;
        
        // Upload to MinIO bypass interceptor
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        });
        document_url = file_key;
      }
      
      const { data } = await api.post('/leaves/apply', {
        ...payload,
        document_url
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred. Contact HR.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const requested_days = computeDays(startDate, endDate);
    
    if (requested_days <= 0) {
      setError('Invalid date range');
      return;
    }

    if (!reason || reason.trim() === '') {
      setError('Reason is required.');
      return;
    }
    
    if (leaveType === 'sick' && requested_days > 14) {
        setError('Sick leave exceeds 14 days limit. Contact HR.');
        return;
    }
    if (leaveType === 'sick' && !file) {
        setError('Sick leave requires a supporting document.');
        return;
    }
    if (leaveType === 'maternity' && requested_days > 90) {
        setError('Maternity leave exceeds 3 months limit. Contact HR.');
        return;
    }
    if (leaveType === 'paternity' && requested_days > 14) {
        setError('Paternity leave exceeds 14 days limit. Contact HR.');
        return;
    }
    if (leaveType === 'compassionate' && requested_days > 14) {
        setError('Compassionate leave exceeds 14 days limit. Contact HR.');
        return;
    }

    applyMutation.mutate({
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      requested_days
    });
  };

  const reset = () => {
    setLeaveType('sick');
    setStartDate('');
    setEndDate('');
    setReason('');
    setFile(null);
    setError('');
  };

  if (!isOpen) return null;

  const requested_days = computeDays(startDate, endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4">Apply for Leave</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <span className="font-semibold px-2 py-0.5 bg-red-200 rounded text-xs uppercase tracking-wider">Error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <select
              disabled={applyMutation.isPending}
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="sick">Sick Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
              <option value="compassionate">Compassionate Leave</option>
            </select>
            {leaveType === 'sick' && <p className="text-xs text-orange-600 font-medium">Document upload required (Max 14 days)</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" required disabled={applyMutation.isPending} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" required disabled={applyMutation.isPending} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          
          {requested_days > 0 && (
             <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100">
               Duration: {requested_days} day(s) <span className="text-xs text-muted-foreground">(Sundays excluded)</span>
             </div>
          )}

          <div className="space-y-2">
            <Label>Reason (Required)</Label>
            <Textarea required disabled={applyMutation.isPending} value={reason} onChange={e => setReason(e.target.value)} placeholder="Please detail the reason for your leave request..." />
          </div>

          {(leaveType === 'sick' || file) && (
            <div className="space-y-2 border-t pt-4 mt-2">
              <Label>Supporting Document</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" className="relative" disabled={applyMutation.isPending}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {file ? 'Change File' : 'Upload File'}
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {file && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{file.name}</span>}
              </div>
            </div>
          )}

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={applyMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? 'Applying...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
