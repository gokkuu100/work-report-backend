import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, FileText, Paperclip, Clock, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AllReports() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM'));

  const { data: reports, isLoading: rLoading } = useQuery({ queryKey: ['reports'], queryFn: async () => (await api.get('/reports/')).data });
  const { data: users, isLoading: uLoading } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users/')).data });

  const getUserName = (id: number) => users?.find((u:any) => u.id === id)?.name || 'Unknown Employee';

  const downloadAttachment = async (fileKey: string) => {
    try {
      const res = await api.get(`/uploads/presigned-url/get?file_key=${encodeURIComponent(fileKey)}`);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert("Failed to access attachment.");
    }
  };

  const filteredReports = reports?.filter((r: any) => {
      const uName = getUserName(r.user_id).toLowerCase();
      const matchesSearch = uName.includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || r.date.startsWith(dateFilter);
      return matchesSearch && matchesDate;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">All Submissions</h1>
          <p className="text-muted-foreground text-sm">Monitor daily activity reports from all employees across the company.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <Input 
                placeholder="Search employee..." 
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

      {rLoading || uLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
            <div className="h-44 bg-muted rounded-xl"></div>
            <div className="h-44 bg-muted rounded-xl"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.length === 0 && (
              <div className="col-span-full py-12 text-center bg-muted/20 border border-dashed rounded-xl">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">No reports found matching criteria.</p>
              </div>
          )}
          
          {filteredReports.map((r: any) => (
             <Card 
                key={r.id} 
                className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
                onClick={() => setSelectedReport(r)}
             >
                <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-bold text-foreground">
                                {getUserName(r.user_id)}
                            </CardTitle>
                            <p className="text-xs font-medium text-muted-foreground">
                                {format(new Date(r.date), 'MMM do, yyyy')}
                            </p>
                        </div>
                        {r.is_late ? (
                             <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 uppercase font-bold tracking-wider">
                                 <AlertTriangle className="w-3 h-3" /> Late
                             </span>
                        ) : (
                             <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-green-100 text-green-700 uppercase font-bold tracking-wider">
                                 <CheckCircle2 className="w-3 h-3" /> On-Time
                             </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    <div className="line-clamp-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {r.tasks}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(r.created_at + 'Z'), 'h:mm a')}
                        </div>
                        {r.attachments && r.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-primary">
                                <Paperclip className="w-3 h-3" />
                                {r.attachments.length} attached
                            </div>
                        )}
                    </div>
                </CardContent>
             </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                           {getUserName(selectedReport.user_id)}
                           {selectedReport.is_late ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase font-bold tracking-wider">Late</span>
                           ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase font-bold tracking-wider">On-Time</span>
                           )}
                        </h2>
                        <span className="text-sm font-medium text-muted-foreground">{format(new Date(selectedReport.date), 'EEEE, MMMM do yyyy')}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setSelectedReport(null)}>
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
                
                <div className="p-6 space-y-8">
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-primary" /> Tasks Completed
                        </h3>
                        <div className="text-base text-foreground bg-muted/20 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {selectedReport.tasks}
                        </div>
                    </div>
                    
                    {selectedReport.blockers && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <AlertTriangle className="w-4 h-4 text-orange-500" /> Blockers & Issues
                            </h3>
                            <div className="text-base text-foreground bg-orange-50/50 p-4 rounded-xl border border-orange-100 leading-relaxed whitespace-pre-wrap">
                                {selectedReport.blockers}
                            </div>
                        </div>
                    )}

                    {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <Paperclip className="w-4 h-4 text-indigo-500" /> Attachments
                            </h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {selectedReport.attachments.map((att: any) => (
                                    <button 
                                        key={att.id} 
                                        onClick={() => downloadAttachment(att.file_url)}
                                        className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 hover:bg-muted/30 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md shrink-0">
                                                <Paperclip className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium truncate pr-4">{att.file_name}</span>
                                        </div>
                                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                        <span>Submitted at {format(new Date(selectedReport.created_at + 'Z'), 'hh:mm:ss a')}</span>
                        <span>Report ID: #{selectedReport.id}</span>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
