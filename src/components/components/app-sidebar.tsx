import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Boxes,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserCircle,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { NavMain } from "@components/components/nav-main";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@components/components/ui/sidebar";
import EmployeeService from "../../services/employee.service";

type EmployeeProfile = {
  fullName?: string;
  name?: string;
  role?: string;
  email?: string;
  avatar?: string;
};

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  target?: string;
  items?: {
    title: string;
    url: string;
  }[];
};

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
    items: [],
  },
  {
    title: "My Tasks",
    url: "/dashboard/my-tasks",
    icon: Workflow,
    items: [],
  },
  {
    title: "Assigned Events",
    url: "/dashboard/assigned-events",
    icon: CalendarDays,
    isActive: true,
    items: [],
  },
  {
    title: "Assigned Clients",
    url: "/dashboard/assigned-clients",
    icon: Home,
    items: [],
  },
  {
    title: "Vendor Coordination",
    url: "/dashboard/vendor-coordination",
    icon: Handshake,
    items: [],
  },
  {
    title: "Inventory & Essentials",
    url: "/dashboard/inventory",
    icon: Boxes,
    items: [
      {
        title: "Stocks",
        url: "/dashboard/inventory/stock",
      },
      {
        title: "Products",
        url: "/dashboard/inventory/product",
      },
      {
        title: "Packages",
        url: "/dashboard/inventory/package",
      },
    ],
  },
  {
    title: "My Expenses",
    url: "/dashboard/expenses",
    icon: ReceiptText,
    items: [],
  },
  {
    title: "My Request & Approvals",
    url: "/dashboard/requests-approvals",
    icon: ReceiptText,
    items: [],
  },
  {
    title: "Attendence & Leave",
    url: "/dashboard/attendence-&-leave",
    icon: ClipboardList,
    items: [],
  },
  {
    title: "My Reports",
    url: "/dashboard/reports",
    icon: FileSpreadsheet,
    items: [],
  },
  {
    title: "My Scorecard",
    url: "/dashboard/scorecard",
    icon: ShieldCheck,
    items: [],
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: Settings,
  },
];

const getInitials = (name?: string) => {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return "";
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `https://assets.divyam.com/Uploads/admins/${avatar}`;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const [employee, setEmployee] = React.useState<EmployeeProfile | null>(null);

  React.useEffect(() => {
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

  const employeeName = employee?.fullName || employee?.name || "Employee";
  const employeeRole = employee?.role.name || "Employee";
  const avatarUrl = getAvatarUrl(employee?.avatar);

  const handleLogout = () => {
    localStorage.removeItem("AppID");
    navigate("/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-[#123257] bg-[#001833] text-white"
    >
      <SidebarHeader className="px-3 pb-2 pt-2 group-data-[collapsible=icon]:px-2">
        <div className="flex flex-col items-center gap-2 text-center group-data-[collapsible=icon]:gap-0">
          <img
            src="/img/logo.png"
            alt="Divyam"
            className="h-12 w-auto object-contain group-data-[collapsible=icon]:h-9"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-[19px] font-light uppercase tracking-[0.48em] text-[#f0b64f]">
              Divyam
            </div>
            <p className="mt-0.5 text-[10px] font-medium italic leading-3 text-[#f3b84c]">
              The Promise of Purity.
              <br />
              The Standard of Luxury.
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2 group-data-[collapsible=icon]:px-1">
        <NavMain items={navMain} />
      </SidebarContent>

      <div className="mx-3 mb-2 mt-auto h-px bg-white/10 group-data-[collapsible=icon]:hidden" />

      <SidebarFooter className="px-3 pb-4 pt-1 group-data-[collapsible=icon]:px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-full border border-[#c7973a]/70 bg-[#001f42] p-1.5 text-left text-white outline-none transition hover:border-[#f0b64f] hover:bg-[#07264a] focus-visible:ring-2 focus-visible:ring-[#f0b64f] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#d59b2d] bg-[#10223d] text-[11px] font-semibold text-white">
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarUrl} alt={employeeName} />
                  <AvatarFallback className="bg-[#10223d] text-[11px] text-white">
                    {getInitials(employeeName)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#001833] bg-emerald-400" />
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-[12px] font-semibold leading-4 text-white">
                  {employeeName}
                </span>
                <span className="block text-[10px] leading-3 text-[#7ff0a4]">
                  {employeeRole}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-white/80 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-56 border-border bg-popover text-popover-foreground"
          >
            <DropdownMenuLabel className="font-medium">
              <div className="truncate text-sm">{employeeName}</div>
              {employee?.email && (
                <div className="truncate text-xs font-normal text-muted-foreground">
                  {employee.email}
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings?tab=my-profile")}>
              <UserCircle className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
