import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  Menu as MenuIcon,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "../auth/useAdminAuth";

const NAV_WIDTH = "w-[280px]";

function NavItem({ to, label, icon: Icon, isActive, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/15 text-foreground border border-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ pathname, onNavigate, onLogout }) {
  // v1 pages are not a priority — keep nav minimal to v2
  const items = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/v2/menu-scheduler", label: "Menu Scheduler", icon: CalendarDays },
      { to: "/admin/v2/delivery-settings", label: "Delivery Settings", icon: Truck },
    ],
    []
  );

  return (
    <div className={cn("h-full flex flex-col", NAV_WIDTH, "bg-background text-foreground")}>
      <div className="px-5 py-5">
        <div className="text-lg font-extrabold tracking-tight">FoodSavvy Admin</div>
        <div className="text-xs text-muted-foreground mt-1">Control Center</div>
      </div>

      <div className="px-4">
        <Separator />
      </div>

      <div className="px-3 py-3 flex flex-col gap-1">
        {items.map((it) => (
          <NavItem
            key={it.to}
            to={it.to}
            label={it.label}
            icon={it.icon}
            isActive={pathname === it.to}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="mt-auto px-3 pb-4">
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout } = useAdminAuth();

  return (
    <div className="admin-root min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className={cn("hidden lg:flex flex-col border-r border-border", NAV_WIDTH)}>
          <SidebarContent pathname={pathname} onNavigate={() => {}} onLogout={logout} />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
            <div className="h-14 px-4 flex items-center gap-3">
              {/* Mobile nav */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <MenuIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <SidebarContent
                      pathname={pathname}
                      onNavigate={() => {}}
                      onLogout={logout}
                    />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="font-semibold tracking-tight">Admin</div>

              <div className="ml-auto hidden md:flex items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  {pathname === "/admin/v2/menu-scheduler"
                    ? "Scheduling"
                    : pathname === "/admin/v2/delivery-settings"
                    ? "Delivery"
                    : "Dashboard"}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
