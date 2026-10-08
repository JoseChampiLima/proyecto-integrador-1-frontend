// RUTA src\app\layouts\admin-layout\admin-layout.component.ts

import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MenuItem } from '../../core/interfaces/menu-item.interface';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, NgFor, NgIf, NgClass],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', routerLink: '/admin', exact: true },
    { label: 'Usuarios', icon: '👥', routerLink: '/admin/usuarios' },
    { label: 'Sedes', icon: '🏟️', routerLink: '/admin/sedes' },
    { label: 'Espacios', icon: '🎾', routerLink: '/admin/espacios' },
    { label: 'Horarios', icon: '🕒', routerLink: '/admin/horarios' },
    { label: 'Reservas', icon: '📅', routerLink: '/admin/reservas' },
    { label: 'Pagos', icon: '💳', routerLink: '/admin/pagos' },
    {
      label: 'Configuración',
      icon: '⚙️',
      isOpen: false,
      children: [
        { label: 'Estado de reservas', routerLink: '/admin/configuracion/estado' },
        { label: 'Métodos de pago', routerLink: '/admin/metodos-pago' }
      ]
    }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleMenu(index: number): void {
    this.menuItems[index].isOpen = !this.menuItems[index].isOpen;
  }
}