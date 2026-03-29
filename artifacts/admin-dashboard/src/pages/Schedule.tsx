import { motion } from "framer-motion";
import { format, parseISO, isSameDay } from "date-fns";
import { CalendarDays, Clock, MapPin, User, Wrench } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SchedulePage() {
  const { data, isLoading } = useListServices({ limit: 100 });

  // Group services by date
  const groupedServices = data?.data?.reduce((acc, service) => {
    const date = format(parseISO(service.scheduledDate), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(service);
    return acc;
  }, {} as Record<string, typeof data.data>);

  // Sort dates
  const sortedDates = groupedServices ? Object.keys(groupedServices).sort() : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Schedule</h2>
          <p className="text-muted-foreground mt-1">Upcoming service appointments and timelines.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading schedule...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-card">No upcoming services scheduled.</div>
        ) : (
          sortedDates.map((dateStr) => {
            const dateServices = groupedServices![dateStr];
            const dateObj = parseISO(dateStr);
            const isToday = isSameDay(dateObj, new Date());

            return (
              <Card key={dateStr} className={`border-border/50 shadow-sm overflow-hidden ${isToday ? 'ring-2 ring-primary/50' : ''}`}>
                <CardHeader className={`p-4 border-b border-border/50 ${isToday ? 'bg-primary/5' : 'bg-muted/30'}`}>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {format(dateObj, "EEEE, MMMM do, yyyy")}
                    {isToday && <Badge className="ml-2 bg-primary">Today</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {dateServices.map(service => (
                      <div key={service.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex gap-4 items-start">
                          <div className="flex flex-col items-center justify-center bg-accent/50 text-primary w-16 h-16 rounded-xl shrink-0">
                            <Clock className="h-5 w-5 mb-1" />
                            <span className="text-xs font-semibold">TBD</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                              {service.customer?.name}
                              <Badge variant="outline" className={
                                service.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                service.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-amber-100 text-amber-800 border-amber-200'
                              }>
                                {service.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {service.customer?.address}</span>
                              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Tech: {service.staff?.name || 'Unassigned'}</span>
                              <span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> {service.serviceType || 'Maintenance'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
