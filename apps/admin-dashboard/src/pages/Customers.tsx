import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreVertical, Edit, Trash2, MapPin, Phone, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getListCustomersQueryKey,
  exportCustomers,
} from "@workspace/api-client-react";
import type { Customer } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().optional(),
  solarCapacity: z.coerce.number().optional(),
  installationDate: z.string().optional(),
  installationDetails: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useListCustomers({ search: search || undefined });
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "", phone: "", address: "", city: "", solarCapacity: undefined, installationDate: "", installationDetails: "", notes: ""
    }
  });

  const openAddDialog = () => {
    setSelectedCustomer(null);
    form.reset({ name: "", phone: "", address: "", city: "", solarCapacity: undefined, installationDate: "", installationDetails: "", notes: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (c: Customer) => {
    setSelectedCustomer(c);
    form.reset({
      name: c.name,
      phone: c.phone,
      address: c.address,
      city: c.city || "",
      solarCapacity: c.solarCapacity || undefined,
      installationDate: c.installationDate ? format(new Date(c.installationDate), "yyyy-MM-dd") : "",
      installationDetails: c.installationDetails || "",
      notes: c.notes || ""
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: CustomerFormValues) => {
    if (selectedCustomer) {
      updateMut.mutate({ id: selectedCustomer.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Customer updated successfully" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Customer created successfully" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          toast({ title: "Customer deleted" });
        }
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Customers</h2>
          <p className="text-muted-foreground mt-1">Manage your solar panel clients and their details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCustomers(search || undefined)} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Client Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>System Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">Loading...</TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No customers found.</TableCell>
                </TableRow>
              ) : (
                data?.data?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{customer.name}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Phone className="mr-1 h-3 w-3" /> {customer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start text-sm text-foreground">
                        <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="max-w-[200px] truncate">{customer.address}, {customer.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.solarCapacity ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {customer.solarCapacity} kW System
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEditDialog(customer)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-destructive focus:bg-destructive/10 cursor-pointer">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="solarCapacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solar Capacity (kW)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="installationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Date</FormLabel>
                    <FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="installationDetails" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Details</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Roof type, Inverter brand" className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl><Textarea {...field} className="rounded-xl resize-none" rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
