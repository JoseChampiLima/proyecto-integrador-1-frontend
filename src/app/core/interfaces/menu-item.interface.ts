export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string;
  exact?: boolean; // Para routerLinkActiveOptions
  children?: { label: string; routerLink: string }[];
  isOpen?: boolean; // Solo para items con children
}