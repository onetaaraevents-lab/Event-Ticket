export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function formatUserRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Administrator",
    organiser: "Event Organiser",
    gatekeeper: "Gate Keeper",
    user: "User",
  };
  return roleMap[role] || role;
}

export function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    admin: "bg-destructive text-destructive-foreground",
    organiser: "bg-primary text-primary-foreground",
    gatekeeper: "bg-info text-info-foreground",
    user: "bg-secondary text-secondary-foreground",
  };
  return colorMap[role] || "bg-muted text-muted-foreground";
}
