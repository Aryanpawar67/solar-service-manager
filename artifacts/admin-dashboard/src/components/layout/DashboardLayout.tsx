import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { clearToken, getUser } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  CalendarDays, 
  CreditCard, 
  MessageSquare, 
  BadgeCheck,
  Menu,
  Sun,
  Bell,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/staff", label: "Staff", icon: BadgeCheck },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/subscriptions", label: "Subscriptions", icon: Sun },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/contact", label: "Messages", icon: MessageSquare },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const user = getUser();
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "A";

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border shadow-sm">
        <div className="flex items-center gap-2 text-sidebar-primary">
          <Sun className="h-6 w-6" />
          <span className="font-display text-xl font-bold tracking-tight text-white">GreenVolt</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20 font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "" : "opacity-70"}`} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-4 sm:px-6 backdrop-blur-md shadow-sm">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold font-display truncate">
              {NAV_ITEMS.find((item) => item.href === location)?.label || "Dashboard"}
            </h1>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-accent-foreground rounded-full">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">A</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name ?? "Admin"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <UserIcon className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 cursor-pointer" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
