import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, File as FileIcon } from 'lucide-react';

const formSchema = z.object({
  tasks: z.string().min(10, { message: "Tasks description must be at least 10 characters." }),
  blockers: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DailyReport() {
  const { user } = useAuthStore();
  const isWeeklyReporter = user?.department?.name === 'HR' || user?.department?.name === 'Admin / Procurement' || user?.is_hr;
  const isSaturday = new Date().getDay() === 6;

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validate < 5MB
      const validFiles = newFiles.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          setError(`File ${f.name} is larger than 5MB.`);
          return false;
        }
        return true;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    setUploadProgress('');
    try {
      const uploadedAttachments = [];
      let currentIdx = 1;

      // Upload files
      for (const file of selectedFiles) {
        setUploadProgress(`Uploading ${file.name} (${currentIdx}/${selectedFiles.length})...`);
        const res = await api.post('/uploads/presigned-url', {
             filename: file.name,
             content_type: file.type || 'application/octet-stream'
        });
        const { url, file_key } = res.data;
        
        const uploadRes = await fetch(url, {
             method: 'PUT',
             body: file,
             headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);

        uploadedAttachments.push({ file_url: file_key, file_name: file.name });
        currentIdx++;
      }

      setUploadProgress('Saving report...');
      await api.post('/reports/', { 
          ...data, 
          status: 'submitted', 
          attachments: uploadedAttachments 
      });
      navigate('/reports');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Network Error')) {
         setError('Network error: Unable to reach the server. Please check your connection.');
      } else if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
         setError('Network error: Unable to upload attachment. Check if the storage service is reachable.');
      } else {
         setError(err.response?.data?.detail || 'Failed to submit report. You may have already submitted today.');
      }
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{isWeeklyReporter ? 'Weekly Report' : 'Daily Report'}</h1>
        <p className="text-muted-foreground text-sm">Submit your {isWeeklyReporter ? 'weekly' : 'daily'} activities for {format(new Date(), 'EEEE, MMMM do yyyy')}</p>
      </div>
      
      {isWeeklyReporter && !isSaturday ? (
          <Card className="shadow-sm border-amber-200 bg-amber-50/50">
              <CardContent className="p-8 text-center text-amber-700 font-medium">
                  HR and Admin/Procurement departments submit weekly reports on Saturdays only.
                  <br />Please return on Saturday to submit your weekly report.
              </CardContent>
          </Card>
      ) : (
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-3">
              <Label htmlFor="tasks" className="text-base font-semibold">Tasks Completed <span className="text-red-500">*</span></Label>
              <textarea 
                id="tasks"
                className="flex min-h-[140px] w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="List what you accomplished today..."
                {...register('tasks')}
              />
              {errors.tasks && <p className="text-sm text-red-500 font-medium">{errors.tasks.message}</p>}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="blockers" className="text-base font-semibold">Blockers / Issues <span className="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
              <textarea 
                id="blockers"
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Any issues blocking your workflow?"
                {...register('blockers')}
              />
            </div>

            <div className="space-y-3 pt-2">
               <div className="flex justify-between items-center">
                   <Label className="text-base font-semibold">Attachments <span className="text-muted-foreground text-sm font-normal">(Max 5MB per file)</span></Label>
                   <Button 
                       type="button" 
                       variant="outline" 
                       size="sm" 
                       onClick={() => fileInputRef.current?.click()}
                       className="rounded-full text-primary border-primary/20 hover:bg-primary/10"
                    >
                       <Upload className="h-4 w-4 mr-2" /> Add File
                   </Button>
                   <input 
                       type="file" 
                       multiple 
                       ref={fileInputRef} 
                       onChange={handleFileSelect} 
                       className="hidden" 
                   />
               </div>
               
               {selectedFiles.length > 0 && (
                   <div className="flex flex-col gap-2 mt-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                       {selectedFiles.map((f, idx) => (
                           <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background border shadow-sm">
                               <div className="flex items-center gap-3 overflow-hidden">
                                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                                        <FileIcon className="h-4 w-4" />
                                   </div>
                                   <div className="flex flex-col truncate">
                                      <span className="text-sm font-medium truncate">{f.name}</span>
                                      <span className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                   </div>
                               </div>
                               <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-red-500">
                                   <X className="h-4 w-4" />
                               </Button>
                           </div>
                       ))}
                   </div>
               )}
            </div>
            
            {(error || uploadProgress) && (
                <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-primary/10 text-primary border border-primary/20 animate-pulse'}`}>
                    {error || uploadProgress}
                </div>
            )}
            
            <div className="pt-6">
              <Button type="submit" size="lg" className="w-full text-base font-semibold rounded-xl" disabled={loading}>
                {loading ? 'Processing...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
