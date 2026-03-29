import { motion } from "framer-motion";
import { MessageSquare, Mail, Phone, Clock } from "lucide-react";
import { format } from "date-fns";

import { useListContactSubmissions } from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  const { data, isLoading } = useListContactSubmissions();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Contact Inquiries</h2>
          <p className="text-muted-foreground mt-1">Messages from the public website.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Loading inquiries...</div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-card">No messages found.</div>
        ) : (
          data?.data?.map((msg) => (
            <Card key={msg.id} className="border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row border-b border-border/40 bg-muted/20 p-4 gap-4 sm:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {msg.name}
                        {!msg.isRead && <Badge className="bg-blue-500 text-white hover:bg-blue-600">New</Badge>}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {msg.email}</span>
                        {msg.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {msg.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
                <div className="p-5">
                  {msg.subject && <h4 className="font-medium text-sm mb-2">Subject: {msg.subject}</h4>}
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
