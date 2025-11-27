import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  QrCode,
  Users,
  Settings,
  Building2,
  BarChart3,
  CreditCard,
  MessageSquare,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatUserRole, getRoleColor } from "@/lib/authUtils";
import type { UserRole } from "@shared/schema";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const mainMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "My Tickets",
    url: "/tickets",
    icon: Ticket,
  },
];

const organizerMenuItems: MenuItem[] = [
  {
    title: "Create Event",
    url: "/events/create",
    icon: Calendar,
    roles: ["admin", "organiser"],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["admin", "organiser"],
  },
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
    roles: ["admin", "organiser"],
  },
  {
    title: "WhatsApp Logs",
    url: "/whatsapp",
    icon: MessageSquare,
    roles: ["admin", "organiser"],
  },
];

const adminMenuItems: MenuItem[] = [
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin", "organiser"],
  },
];

const scannerMenuItems: MenuItem[] = [
  {
    title: "Gate Scanner",
    url: "/scan",
    icon: QrCode,
    roles: ["admin", "organiser", "gatekeeper"],
  },
];

function filterMenuByRole(items: MenuItem[], userRole: UserRole = "user") {
  return items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const userRole = (user?.role as UserRole) || "user";

  const isActive = (url: string) => {
    if (url === "/dashboard") return location === "/" || location === "/dashboard";
    return location.startsWith(url);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold">EventPass</span>
            <span className="text-xs text-muted-foreground">Event Ticketing</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filterMenuByRole(scannerMenuItems, userRole).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Scanner</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterMenuByRole(scannerMenuItems, userRole).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filterMenuByRole(organizerMenuItems, userRole).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Organizer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterMenuByRole(organizerMenuItems, userRole).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filterMenuByRole(adminMenuItems, userRole).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterMenuByRole(adminMenuItems, userRole).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex w-full items-center gap-3 rounded-md p-2 hover-elevate"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={user?.profileImageUrl || undefined} 
                  alt={user?.firstName || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user?.firstName, user?.lastName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"}
                </p>
                <Badge variant="secondary" className={`text-xs ${getRoleColor(userRole)}`}>
                  {formatUserRole(userRole)}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="menu-item-settings">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-destructive" data-testid="menu-item-logout">
              <a href="/api/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
