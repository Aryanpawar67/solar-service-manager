import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical, Edit, Trash2, BadgeCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { 
  useListStaff, 
  useCreateStaff, 
  useUpdateStaff, 
  useDeleteStaff,
  getListStaffQueryKey
} from "@workspace/api-client-react";
import type { Staff } from "@workspace/api-client-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone is required"),
  role: z.string().min(2, "Role is required"),
  workArea: z.string().optional(),
  availability: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function StaffPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { data, isLoading } = useListStaff();
  const createMut = useCreateStaff();
  const updateMut = useUpdateStaff();
  const deleteMut = useDeleteStaff();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: "", phone: "", role: "Technician", workArea: "", availability: "", isActive: true }
  });

  const openAddDialog = () => {
    setSelectedStaff(null);
    form.reset({ name: "", phone: "", role: "Technician", workArea: "", availability: "", isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (s: Staff) => {
    setSelectedStaff(s);
    form.reset({
      name: s.name,
      phone: s.phone,
      role: s.role,
      workArea: s.workArea || "",
      availability: s.availability || "",
      isActive: s.isActive
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: StaffFormValues) => {
    if (selectedStaff) {
      updateMut.mutate({ id: selectedStaff.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Staff updated successfully" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
          setIsDialogOpen(false);
          toast({ title: "Staff created successfully" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
          toast({ title: "Staff deleted" });
        }
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Staff Directory</h2>
          <p className="text-muted-foreground mt-1">Manage technicians and service personnel.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Name & Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Work Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No staff found.</TableCell></TableRow>
              ) : (
                data?.data?.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {staff.name}
                        {staff.isActive && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{staff.role}</div>
                    </TableCell>
                    <TableCell className="text-sm">{staff.phone}</TableCell>
                    <TableCell className="text-sm">{staff.workArea || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={staff.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEditDialog(staff)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(staff.id)} className="text-destructive focus:bg-destructive/10 cursor-pointer">
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
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle className="text-xl font-display">{selectedStaff ? "Edit Staff" : "Add Staff Member"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Role *</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="workArea" render={({ field }) => (
                <FormItem><FormLabel>Work Area / Region</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Account</FormLabel>
                    <div className="text-sm text-muted-foreground">Allow assignments to this staff member</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : "Save Staff"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
