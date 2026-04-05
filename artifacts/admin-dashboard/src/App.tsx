import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { isAuthenticated } from "@/lib/auth";

// Pages
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import StaffPage from "@/pages/Staff";
import ServicesPage from "@/pages/Services";
import SubscriptionsPage from "@/pages/Subscriptions";
import PaymentsPage from "@/pages/Payments";
import ContactPage from "@/pages/Contact";
import SchedulePage from "@/pages/Schedule";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/customers" component={() => <ProtectedRoute component={Customers} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={StaffPage} />} />
      <Route path="/services" component={() => <ProtectedRoute component={ServicesPage} />} />
      <Route path="/schedule" component={() => <ProtectedRoute component={SchedulePage} />} />
      <Route path="/subscriptions" component={() => <ProtectedRoute component={SubscriptionsPage} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={PaymentsPage} />} />
      <Route path="/contact" component={() => <ProtectedRoute component={ContactPage} />} />
      <Route component={NotFound} />
    </Switch>
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
