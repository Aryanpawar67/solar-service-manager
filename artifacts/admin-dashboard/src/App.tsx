import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import StaffPage from "@/pages/Staff";
import ServicesPage from "@/pages/Services";
import SubscriptionsPage from "@/pages/Subscriptions";
import PaymentsPage from "@/pages/Payments";
import ContactPage from "@/pages/Contact";
import SchedulePage from "@/pages/Schedule";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/customers" component={Customers} />
        <Route path="/staff" component={StaffPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/schedule" component={SchedulePage} />
        <Route path="/subscriptions" component={SubscriptionsPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
