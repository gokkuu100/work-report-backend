import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high']),
  target_level: z.enum(['company', 'department']),
});

type FormValues = z.infer<typeof formSchema>;

export default function Complaints() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => {
      const { data } = await api.get('/complaints/me');
      return data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { priority: 'medium', target_level: 'company' }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await api.post('/complaints/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      setIsFormOpen(false);
      reset();
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Complaints</h1>
          <p className="text-muted-foreground text-sm">Raise issues and track their resolution status.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="mr-2 h-4 w-4" /> New Complaint
        </Button>
      </div>
      
      {isFormOpen && (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-xl">Raise a Complaint</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                        <Input id="title" {...register('title')} placeholder="Brief summary" />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                        <textarea 
                            id="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detailed description..."
                            {...register('description')}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <select 
                                id="priority" 
                                {...register('priority')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target_level">Target Audience</Label>
                            <select 
                                id="target_level" 
                                {...register('target_level')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                <option value="company">Entire Company (Admin only)</option>
                                <option value="department">My Department (Dept Head & Admin)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>Submit</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Card>
            <CardContent className="p-0">
               <div className="divide-y max-h-[700px] overflow-y-auto">
                   {complaints?.length === 0 && <p className="text-muted-foreground text-sm p-8 text-center">No complaints found.</p>}
                   {complaints?.map((c: any) => (
                       <div key={c.id} className="p-6 hover:bg-muted/10 transition-colors">
                           <div className="flex justify-between items-start mb-4">
                               <div className="space-y-1">
                                   <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                        {c.title}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${c.priority === 'high' ? 'bg-red-100 text-red-700' : c.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{c.priority}</span>
                                   </h3>
                                   <p className="text-xs text-muted-foreground font-medium">{format(new Date(c.created_at + 'Z'), 'MMM do, yyyy h:mm a')}</p>
                               </div>
                               <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${c.status === 'open' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                   {c.status.replace('_', ' ')}
                               </span>
                           </div>
                           <div className="bg-background border rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                               {c.description}
                           </div>
                       </div>
                   ))}
               </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
