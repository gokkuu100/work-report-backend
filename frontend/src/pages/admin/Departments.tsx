import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function Departments() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments/')).data
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/departments/', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setFormData({ name: '', description: '' });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Departments</h1>
        <p className="text-muted-foreground text-sm">Manage company departments.</p>
      </div>
      
      <Card>
        <CardHeader><CardTitle className="text-xl">Create Department</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} />
              </div>
              <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Add Department</Button>
              </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="border rounded-md bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {departments?.map((d: any) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/departments/${d.id}`)}>
                  <td className="px-4 py-3 font-medium text-primary hover:underline">{d.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
