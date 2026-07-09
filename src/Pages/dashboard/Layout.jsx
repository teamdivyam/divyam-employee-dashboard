import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@components/components/ui/breadcrumb";
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
import { Separator } from "@components/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/components/ui/avatar";
import { UserRound, Settings, LogOut, Moon, Sun } from "lucide-react";
import {
  setDarkTheme,
  setLightTheme,
} from "@/store/Theme/themeSlice";
import EmployeeService from "../../services/employee.service";

const getInitials = (name) => {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `https://assets.divyam.com/Uploads/admins/${avatar}`;
};

export default function Layout() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);
  const [employee, setEmployee] = useState(null);

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
    let mounted = true;

    EmployeeService.me()
      .then((response) => {
        if (mounted) {
          setEmployee(response?.data?.data || response?.data?.employee || response?.data);
        }
      })
      .catch(() => {
        if (mounted) {
          setEmployee(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleTheme = () => {
    const currentTheme = theme === "dark" ? "dark" : "light";

    if (currentTheme === "dark") {
      dispatch(setLightTheme());
    } else {
      dispatch(setDarkTheme());
    }
  };

  const employeeName = employee?.fullName || employee?.name || "Employee";
  const employeeRole =
    employee?.role?.name || employee?.role || employee?.designation || "Employee";
  const avatarUrl = getAvatarUrl(employee?.avatar);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8" />

            <Separator
              orientation="vertical"
              className="h-5"
            />

            <div>
              <h1 className="text-sm font-semibold text-foreground">
                Dashboard
              </h1>

              <p className="hidden md:block text-xs text-muted-foreground">
                Manage products, inventory and operations
              </p>
            </div>
          </div>

          <div className="adminProfile pr-8 cursor-pointer">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div
                  className="flex items-center gap-3 rounded-xl border-border bg-card px-3 py-2 transition-colors hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={employeeName} />
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(employeeName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      {employeeName}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {employeeName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {employeeRole}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <NavLink to={"settings?tab=my-profile"} className="w-full">
                    <span className="flex items-center justify-start gap-2">
                      <UserRound className="size-4 " />
                      <span className="">Profile</span>
                    </span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <NavLink to="settings?tab=account-settings" className="w-full">
                    <span className="flex items-center justify-start gap-2">
                      <Settings className="size-4 " />
                      <span className="">Account</span>
                    </span>
                  </NavLink>
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
                  className="text-destructive focus:text-destructive"
                >
                  <NavLink to="/dashboard/logout" className="w-full">
                    <span className="flex items-center justify-start gap-2 ">
                      <LogOut className="size-4" />
                      <span className="">Logout</span>
                    </span>
                  </NavLink>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
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
