import React, { useEffect } from "react";
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
  DropdownMenuCheckboxItem
} from "@components/components/ui//dropdown-menu";
import { AppSidebar } from "@components/components/app-sidebar";
import { Separator } from "@components/components/ui/separator";
import { UserRound, Settings, LogOut, Moon, Sun } from "lucide-react";
import {
  setDarkTheme,
  setLightTheme,
} from "@/store/Theme/themeSlice";

export default function Layout() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme);

  useEffect(() => {
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary" >
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      Employee
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="font-medium">
                      Employee
                    </p>

                    <p className="text-xs text-muted-foreground">
                      employee@divyam.com
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