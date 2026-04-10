import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical, Edit, Trash2, Calendar, Wrench, FileDown, Image, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useListCustomers,
  useListStaff,
  getListServicesQueryKey,
  uploadFile,
  downloadServiceReport,
} from "@workspace/api-client-react";
import type { Service } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const serviceSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  staffId: z.coerce.number().optional(),
  scheduledDate: z.string().min(1, "Date is required"),
  status: z.enum(["pending", "in_progress", "completed"]),
  serviceType: z.string().optional(),
  notes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState<"pre" | "post" | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const preFileRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useListServices();
  const { data: customers } = useListCustomers({ limit: 100 });
  const { data: staff } = useListStaff();

  const createMut = useCreateService();
  const updateMut = useUpdateService();
  const deleteMut = useDeleteService();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { customerId: undefined, staffId: undefined, scheduledDate: "", status: "pending", serviceType: "Maintenance", notes: "" },
  });

  const openAddDialog = () => {
    setSelectedService(null);
    form.reset({ customerId: undefined, staffId: undefined, scheduledDate: "", status: "pending", serviceType: "Maintenance", notes: "" });
    setIsEditOpen(true);
  };

  const openEditDialog = (s: Service) => {
    setSelectedService(s);
    form.reset({
      customerId: s.customerId,
      staffId: s.staffId || undefined,
      scheduledDate: format(new Date(s.scheduledDate), "yyyy-MM-dd"),
      status: s.status as ServiceFormValues["status"],
      serviceType: s.serviceType || "",
      notes: s.notes || "",
    });
    setIsEditOpen(true);
  };

  const openDetailDialog = (s: Service) => {
    setSelectedService(s);
    setIsDetailOpen(true);
  };

  const onSubmit = (values: ServiceFormValues) => {
    if (selectedService) {
      updateMut.mutate({ id: selectedService.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsEditOpen(false);
          toast({ title: "Service updated" });
        },
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsEditOpen(false);
          toast({ title: "Service created" });
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this service job?")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          toast({ title: "Service deleted" });
        },
      });
    }
  };

  const handlePhotoUpload = async (file: File, field: "preServiceImage" | "postServiceImage") => {
    if (!selectedService) return;
    setUploading(field === "preServiceImage" ? "pre" : "post");
    try {
      const { url } = await uploadFile(file);
      await new Promise<void>((resolve, reject) =>
        updateMut.mutate(
          { id: selectedService.id, data: { [field]: url } },
          {
            onSuccess: (updated) => {
              setSelectedService(prev => prev ? { ...prev, [field]: url } : prev);
              queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
              toast({ title: "Photo uploaded" });
              resolve();
            },
            onError: reject,
          }
        )
      );
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleReport = async (serviceId: number) => {
    setDownloadingReport(true);
    try {
      await downloadServiceReport(serviceId);
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Service Jobs</h2>
          <p className="text-muted-foreground mt-1">Schedule and manage solar panel cleanings and maintenance.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Create Job
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service Info</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No services found.</TableCell></TableRow>
              ) : (
                data?.data?.map((service) => (
                  <TableRow
                    key={service.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openDetailDialog(service)}
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">{service.customer?.name || `Customer #${service.customerId}`}</div>
                      <div className="text-xs text-muted-foreground">{service.customer?.address}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        {service.serviceType || "Maintenance"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Staff: {service.staff?.name || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(service.scheduledDate + "T00:00:00"), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[service.status] ?? ""}>
                        {service.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openDetailDialog(service)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(service)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReport(service.id)}
                            className="cursor-pointer text-primary focus:text-primary"
                            disabled={downloadingReport}
                          >
                            <FileDown className="mr-2 h-4 w-4" /> Download Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedService && (
          <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden border-border/50 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 bg-muted/30 border-b border-border/50 sticky top-0 z-10">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="text-xl font-display">Service Details</DialogTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setIsDetailOpen(false); openEditDialog(selectedService); }} className="rounded-xl">
                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReport(selectedService.id)}
                    disabled={downloadingReport}
                    className="rounded-xl bg-primary text-primary-foreground shadow-sm"
                  >
                    <FileDown className="mr-1.5 h-3.5 w-3.5" />
                    {downloadingReport ? "Generating..." : "Download PDF"}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Status + dates */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Badge variant="outline" className={`text-sm px-3 py-1 ${STATUS_COLORS[selectedService.status] ?? ""}`}>
                  {selectedService.status.replace("_", " ").toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedService.scheduledDate + "T00:00:00"), "MMMM d, yyyy")}
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-foreground">{selectedService.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedService.customer?.address}{selectedService.customer?.city ? `, ${selectedService.customer.city}` : ""}</p>
                {selectedService.customer?.phone && <p className="text-sm text-muted-foreground">{selectedService.customer.phone}</p>}
              </div>

              {/* Service info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
                  <p className="text-sm font-medium mt-0.5">{selectedService.serviceType || "Maintenance"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technician</p>
                  <p className="text-sm font-medium mt-0.5">{selectedService.staff?.name || "Unassigned"}</p>
                </div>
                {selectedService.completedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
                    <p className="text-sm font-medium mt-0.5">{format(new Date(selectedService.completedAt), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedService.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-foreground/80 bg-muted/30 rounded-lg p-3">{selectedService.notes}</p>
                </div>
              )}
              {selectedService.remarks && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-sm text-foreground/80 bg-muted/30 rounded-lg p-3">{selectedService.remarks}</p>
                </div>
              )}

              {/* Photos */}
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Photos</p>

                {/* Hidden file inputs */}
                <input
                  ref={preFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file, "preServiceImage");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={postFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file, "postServiceImage");
                    e.target.value = "";
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Pre-service photo */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Pre-service</p>
                    {selectedService.preServiceImage ? (
                      <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted">
                        <img
                          src={selectedService.preServiceImage}
                          alt="Pre-service"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-lg text-xs"
                            onClick={() => preFileRef.current?.click()}
                            disabled={uploading === "pre"}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => preFileRef.current?.click()}
                        disabled={uploading === "pre"}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                      >
                        <Image className="h-6 w-6" />
                        <span className="text-xs">{uploading === "pre" ? "Uploading..." : "Upload pre-service photo"}</span>
                      </button>
                    )}
                  </div>

                  {/* Post-service photo */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Post-service</p>
                    {selectedService.postServiceImage ? (
                      <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted">
                        <img
                          src={selectedService.postServiceImage}
                          alt="Post-service"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-lg text-xs"
                            onClick={() => postFileRef.current?.click()}
                            disabled={uploading === "post"}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => postFileRef.current?.click()}
                        disabled={uploading === "post"}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                      >
                        <Image className="h-6 w-6" />
                        <span className="text-xs">{uploading === "post" ? "Uploading..." : "Upload post-service photo"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Edit / Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">{selectedService ? "Edit Service Job" : "Create Service Job"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="staffId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Staff</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staff?.data?.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date *</FormLabel>
                    <FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem><FormLabel>Service Type</FormLabel><FormControl><Input {...field} className="rounded-xl" placeholder="e.g. Cleaning, Maintenance" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} className="rounded-xl" placeholder="Pre-service notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Job"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
