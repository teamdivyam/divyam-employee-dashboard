import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@components/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/components/ui//dropdown-menu";
import { AppSidebar } from "@components/components/app-sidebar";
import { NotificationBell, ReminderNotificationBell } from "@components/components/NotificationBell";
import { Separator } from "@components/components/ui/separator";
import { UserRound, Settings, LogOut, Moon, Sun } from "lucide-react";
import {
  setDarkTheme,
  setLightTheme,
} from "@/store/Theme/themeSlice";
import useCurrentEmployee from "../../hooks/useCurrentEmployee";
import EmployeeV2Service from "../../services/employee-v2.service";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AD";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (typeof avatar === "object") {
    return getAvatarUrl(avatar.url || avatar.path || avatar.filename || avatar.name);
  }
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `https://assets.divyam.com/Uploads/admins/${avatar}`;
};

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useSelector((state) => state.theme);
  const { data: employee } = useCurrentEmployee();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!["light", "dark"].includes(theme)) return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      dispatch(setDarkTheme());
    } else {
      dispatch(setLightTheme());
    }
  }, [dispatch]);

  const handleToggleTheme = () => {
    if (theme === "dark") {
      dispatch(setLightTheme());
      localStorage.setItem("theme", "light");
    } else {
      dispatch(setDarkTheme());
      localStorage.setItem("theme", "dark");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await EmployeeV2Service.logout();
      queryClient.clear();
      localStorage.removeItem("AppID");
      toast.success(response.data?.message || "Logout successful");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error.response?.data?.error?.message
        || error.response?.data?.message
        || error.response?.data?.msg
        || "Unable to logout. Please try again.";
      toast.error(message);
      setIsLoggingOut(false);
    }
  };

  const employeeName = employee?.name || "Employee";
  const employeeRole = employee?.accessRole || "Employee";
  const employeeEmail = employee?.email || "";
  const avatarUrl = getAvatarUrl(employee?.profileImage?.smallUrl);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-3 lg:px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-7 w-7" />

            <Separator
              orientation="vertical"
              className="h-4"
            />

            <div>
              <h1 className="text-sm font-semibold text-foreground">
                Dashboard
              </h1>

              <p className="hidden md:block text-[11px] leading-tight text-muted-foreground">
                Manage products, inventory and operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-4">
            <ReminderNotificationBell />
            <NotificationBell />
            <div className="adminProfile cursor-pointer">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border-border bg-card px-2 py-1 transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary" >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={employeeName}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold">{getInitials(employeeName)}</span>
                    )}
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      {employeeName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employeeRole}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[110] w-40">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {employeeName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {employeeEmail || employeeRole}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => navigate("/dashboard/settings?tab=my-profile")}
                  className="cursor-pointer"
                >
                  <UserRound className="size-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate("/dashboard/settings?tab=account-settings")}
                  className="cursor-pointer"
                >
                  <Settings className="size-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleTheme}
                  className="cursor-pointer"
                >
                  <span className="flex items-center justify-start gap-2">
                    {theme === "dark" ? (
                      <>
                        <Sun className="size-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="size-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </header>
        <main
          className="flex-1 bg-background"
        >
          <div
            className="mx-auto w-full max-w-[1800px]"
          >
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
