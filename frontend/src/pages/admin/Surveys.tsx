import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ClipboardList, Star, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function Surveys() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const { data } = await api.get('/surveys/');
      return data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const url = 'https://script.google.com/macros/s/AKfycbxzCSXZElYqamQG0ci2PbcQ4gISIjsdO33k7KPUQaLiwGhVJf74jGX70TIpw2DwrAB31Q/exec';
      const { data } = await api.post('/surveys/sync', { url });
      return data;
    },
    onSuccess: (data: any) => {
        setSuccess(data.message || 'Successfully synced survey data!');
        setError('');
        queryClient.invalidateQueries({ queryKey: ['surveys'] });
        setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => {
        setError(err.message || err.response?.data?.detail || 'Failed to sync data');
        setSuccess('');
    }
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM'));

  const filteredSurveys = surveys?.filter((survey: any) => {
      const matchesSearch = survey.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          survey.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || (survey.timestamp && format(new Date(survey.timestamp), 'yyyy-MM').startsWith(dateFilter));
      return matchesSearch && matchesDate;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" /> Customer Surveys
          </h1>
          <p className="text-muted-foreground text-sm">Sync and view customer feedback responses directly from Google Sheets.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button 
                onClick={handleSync} 
                disabled={syncMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Syncing Data...' : 'Sync Fresh Data'}
            </Button>
            <a 
                href="https://docs.google.com/spreadsheets/d/15QScRj0eUi3ucr7vjmSX4Hidjmu_f18DhO750bW-ts4/edit" 
                target="_blank" 
                rel="noopener noreferrer"
            >
                <Button variant="outline" className="gap-2 bg-white">
                    View in Google Sheets <ExternalLink className="w-4 h-4" />
                </Button>
            </a>
        </div>
      </div>

      {(success || error) && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {success || error}
          </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="text-lg">Survey Responses ({filteredSurveys.length})</CardTitle>
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <Input 
                      placeholder="Search customer, email..." 
                      className="w-full md:w-64 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Input 
                      type="month" 
                      className="w-full md:w-40 bg-white"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center"><RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" /></div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No survey responses found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Service</th>
                    <th className="px-6 py-4 font-semibold">Rating</th>
                    <th className="px-6 py-4 font-semibold min-w-[300px]">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSurveys.map((survey: any) => (
                    <tr key={survey.id} className="bg-white hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {survey.timestamp ? format(new Date(survey.timestamp), 'MMM do, yyyy h:mm a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{survey.customer_name || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">{survey.email} {survey.phone ? `• ${survey.phone}` : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                            {survey.service_utilized || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-yellow-500 font-medium">
                            {survey.rating} <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-md break-words">
                        {survey.feedback || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
