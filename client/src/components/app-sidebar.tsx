import { Link } from "@tanstack/react-router";

import {
  BookOpen,
  Bot,
  Command,
  Frame,
  Home,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import * as React from "react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function Logo() {
  const [anim, setAnim] = React.useState(false);
  const handleClick = () => {
    setAnim(true);
    window.setTimeout(() => {
      setAnim(false);
    }, 650);
  };

  console.log("Logo render - anim state:", anim);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={handleClick}
        >
          <div className="relative">
            {/* ping glow */}
            {anim && (
              <div className="absolute inset-0 rounded-lg animate-ping bg-primary/20" />
            )}
            <div
              className={
                "bg-sidebar-primary/10 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg transition-transform duration-500 will-change-transform shrink-0 " +
                (anim ? "scale-110 rotate-12 shadow-lg shadow-primary/40" : "")
              }
            >
              <img
                src="/logo.svg"
                alt="Snippy logo"
                className={
                  "size-8 transition-transform duration-500 shrink-0 " +
                  (anim ? "-rotate-12" : "")
                }
              />
            </div>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span
              className={
                "truncate font-medium transition-transform duration-500 " +
                (anim ? "translate-x-0.5" : "")
              }
            >
              Snippy
            </span>
            <span
              className={
                "truncate text-xs text-muted-foreground transition-opacity duration-500 " +
                (anim ? "opacity-80" : "opacity-60")
              }
            >
              Recall your snippets fast
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function NavMain() {
  const items = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Explore",
      url: "/explore",
      icon: SquareTerminal,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Frame,
    },
    {
      title: "Collections",
      url: "/collections",
      icon: Bot,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: BookOpen,
    },
    {
      title: "Add Snippet",
      url: "/add-snippet",
      icon: Command,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link to={item.url}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
