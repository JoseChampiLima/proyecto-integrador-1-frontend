import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'crear-usuario',
    loadComponent: () => import('./features/usuarios/pages/crear-usuario/crear-usuario.component').then(m => m.CrearUsuarioComponent)
  },

  // --- Zona CLIENTE ---
  {
    path: 'inicio',
    loadComponent: () => import('./layouts/cliente-layout/cliente-layout.component').then(m => m.ClienteLayoutComponent),
    canActivate: [authGuard, roleGuard(['CLIENTE'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent)
      }
      // TODO: 'mis-reservas', 'espacios/:id', etc.
    ]
  },

  // --- Zona ADMIN ---
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/pages/usuarios/usuarios-list/usuarios-list.component').then(m => m.UsuariosListComponent)
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () => import('./features/admin/pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
      },
      {
        path: 'usuarios/:id/editar',
        loadComponent: () => import('./features/admin/pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
      }
      // TODO: 'sedes', 'espacios', 'reservas', 'horarios', 'pagos'
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];