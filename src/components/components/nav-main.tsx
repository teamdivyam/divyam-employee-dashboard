import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@components/components/ui/sidebar";
import { cn } from "@components/lib/utils";

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

const linkClass = (isActive: boolean) =>
  cn(
    "h-9 rounded-[7px] border px-2 text-[12px] font-medium leading-none transition-all",
    "text-slate-100 hover:border-[#d59b2d]/70 hover:bg-[#d59b2d]/12 hover:text-white",
    "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
    isActive
      ? "border-[#b88227] bg-[#d59b2d]/18 text-white shadow-[inset_0_0_0_1px_rgba(213,155,45,0.18)]"
      : "border-transparent"
  );

const subLinkClass = (isActive: boolean) =>
  cn(
    "h-7 rounded-md px-2 text-[11px] font-medium transition-all",
    "text-slate-200 hover:bg-[#d59b2d]/12 hover:text-white",
    isActive && "bg-[#d59b2d]/18 text-white"
  );

export function NavMain({ items }: { items: NavItem[] }) {
  const location = useLocation();

  return (
    <SidebarGroup className="px-0">
      <SidebarMenu className="mt-1 gap-1">
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length);
          const isParentActive =
            location.pathname === item.url ||
            (item.url !== "/dashboard" && location.pathname.startsWith(item.url));

          if (hasChildren) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive || isParentActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={linkClass(isParentActive)}
                    >
                      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                      <span className="text-[12px] truncate group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-5 mt-1 border-l border-[#d59b2d]/25 pl-2">
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to={subItem.url}
                              className={({ isActive }) => subLinkClass(isActive)}
                            >
                              <span className="truncate text-xs text-white hover:text-black">{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          if (item.target === "_blank") {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={linkClass(false)}
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                    <span className="text-[12px] truncate group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                  <span className="text-[12px] truncate group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
