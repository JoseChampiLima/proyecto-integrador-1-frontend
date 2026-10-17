// RUTA src\app\layouts\admin-layout\admin-layout.component.ts

import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MenuItem } from '../../core/interfaces/menu-item.interface';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, NgFor, NgIf],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);
  router = inject(Router);

  ngOnInit(): void {
    this.menuItems.forEach((item) => {
      item.isOpen = !!item.children?.some(
        (c) => c.routerLink && this.router.url.startsWith(c.routerLink),
      );
    });
  }

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', routerLink: '/admin', exact: true },

    // Operación diaria
    { label: 'Reservas', icon: '📅', routerLink: '/admin/reservas' },
    { label: 'Pagos', icon: '💳', routerLink: '/admin/pagos' },

    // Catálogo que se arma una vez y se toca poco
    {
      label: 'Gestión',
      icon: '🏟️',
      isOpen: false,
      children: [
        { label: 'Sedes', routerLink: '/admin/sedes' },
        { label: 'Espacios', routerLink: '/admin/espacios' },
        { label: 'Tipos de espacio', routerLink: '/admin/tipos-espacio' },
        { label: 'Horarios', routerLink: '/admin/horarios' },
        { label: 'Mantenimientos', routerLink: '/admin/mantenimientos' },
      ],
    },

    { label: 'Usuarios', icon: '👥', routerLink: '/admin/usuarios' },

    {
      label: 'Configuración',
      icon: '⚙️',
      isOpen: false,
      children: [
        { label: 'Estados de reserva', routerLink: '/admin/estados-reserva' },
        { label: 'Métodos de pago', routerLink: '/admin/metodos-pago' },
      ],
    },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  toggleMenu(index: number): void {
    this.menuItems.forEach((item, i) => {
      if (item.children) {
        item.isOpen = i === index ? !item.isOpen : false;
      }
    });
  }
}
