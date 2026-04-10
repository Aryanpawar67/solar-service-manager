import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useListServices } from "@workspace/api-client-react";
import type { Service } from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const locales = { "en-US": Intl.DateTimeFormat };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type ServiceEvent = Event & { resource: Service };

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
  cancelled: "#6b7280",
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const startDate = format(startOfMonth(addMonths(currentDate, -1)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");

  const { data, isLoading } = useListServices({ startDate, endDate, limit: 100 });

  const events: ServiceEvent[] = useMemo(() => {
    return (data?.data ?? []).map((service) => {
      const date = new Date(service.scheduledDate + "T00:00:00");
      return {
        title: service.customer?.name ?? `Service #${service.id}`,
        start: date,
        end: date,
        allDay: true,
        resource: service,
      };
    });
  }, [data]);

  const eventStyleGetter = (event: ServiceEvent) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.resource.status] ?? "#6b7280",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      padding: "2px 6px",
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Schedule</h2>
        <p className="text-muted-foreground mt-1">Upcoming service appointments and timelines.</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-sm">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            <span className="capitalize text-muted-foreground">{status.replace("_", " ")}</span>
          </span>
        ))}
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4" style={{ height: 680 }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Loading schedule...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            date={currentDate}
            onNavigate={setCurrentDate}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => setSelectedService((event as ServiceEvent).resource)}
            style={{ height: "100%", fontFamily: "inherit" }}
            views={["month", "week", "agenda"]}
            defaultView="month"
          />
        )}
      </div>

      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        {selectedService && (
          <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden border-border/50">
            <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
              <DialogTitle className="text-xl font-display">Service Details</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{selectedService.customer?.name}</span>
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: `${STATUS_COLORS[selectedService.status]}20`,
                    color: STATUS_COLORS[selectedService.status],
                    borderColor: `${STATUS_COLORS[selectedService.status]}50`,
                  }}
                >
                  {selectedService.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground block">Date</span>
                  <span className="font-medium">{format(new Date(selectedService.scheduledDate + "T00:00:00"), "MMMM d, yyyy")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Type</span>
                  <span className="font-medium">{selectedService.serviceType ?? "Maintenance"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Address</span>
                  <span className="font-medium">{selectedService.customer?.address}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Technician</span>
                  <span className="font-medium">{selectedService.staff?.name ?? "Unassigned"}</span>
                </div>
                {selectedService.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Notes</span>
                    <span className="font-medium">{selectedService.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
