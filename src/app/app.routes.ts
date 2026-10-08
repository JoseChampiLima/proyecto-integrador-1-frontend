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
  {
    path: 'sedes',
    loadComponent: () => import('./features/sedes/pages/sedes-list/sedes-list.component').then(m => m.SedesListComponent)
  },
  {
    path: 'espacios',
    loadComponent: () => import('./features/espacios/pages/espacios-list/espacios-list.component').then(m => m.EspaciosListComponent)
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
      },

      { 
        path: 'sedes',
        loadComponent: () => import('./features/admin/pages/sedes/sedes-list/sedes-list.component').then(m => m.SedesListComponent)
      },
      {
        path: 'sedes/nuevo',
        loadComponent: () => import('./features/admin/pages/sedes/sede-form/sede-form.component').then(m => m.SedeFormComponent)
      },
      {
        path: 'sedes/:id/editar',
        loadComponent: () => import('./features/admin/pages/sedes/sede-form/sede-form.component').then(m => m.SedeFormComponent)
      },

      { 
        path: 'espacios',
        loadComponent: () => import('./features/admin/pages/espacios/espacios-list/espacios-list.component').then(m => m.EspaciosListComponent)
      },
      {
        path: 'espacios/nuevo',
        loadComponent: () => import('./features/admin/pages/espacios/espacio-form/espacio-form.component').then(m => m.EspacioFormComponent)
      },
      {
        path: 'espacios/:id/editar',
        loadComponent: () => import('./features/admin/pages/espacios/espacio-form/espacio-form.component').then(m => m.EspacioFormComponent)
      },

      { 
        path: 'horarios',
        loadComponent: () => import('./features/admin/pages/horarios/horarios-list/horarios-list.component').then(m => m.HorariosListComponent)
      },
      {
        path: 'horarios/nuevo',
        loadComponent: () => import('./features/admin/pages/horarios/horario-form/horario-form.component').then(m => m.HorarioFormComponent)
      },
      {
        path: 'horarios/:id/editar',
        loadComponent: () => import('./features/admin/pages/horarios/horario-form/horario-form.component').then(m => m.HorarioFormComponent)
      },

      { 
        path: 'estados-reserva',
        loadComponent: () => import('./features/admin/pages/estados-reserva/estados-reserva-list/estados-reserva-list.component').then(m => m.EstadosReservaListComponent)
      },
      {
        path: 'estados-reserva/nuevo',
        loadComponent: () => import('./features/admin/pages/estados-reserva/estado-reserva-form/estado-reserva-form.component').then(m => m.EstadoReservaFormComponent)
      },
      {
        path: 'estados-reserva/:id/editar',
        loadComponent: () => import('./features/admin/pages/estados-reserva/estado-reserva-form/estado-reserva-form.component').then(m => m.EstadoReservaFormComponent)
      },

      { 
        path: 'metodos-pago',
        loadComponent: () => import('./features/admin/pages/metodo-pago/metodos-pago-list/metodos-pago-list.component').then(m => m.MetodosPagoListComponent)
      },
      {
        path: 'metodos-pago/nuevo',
        loadComponent: () => import('./features/admin/pages/metodo-pago/metodo-pago-form/metodo-pago-form.component').then(m => m.MetodoPagoFormComponent)
      },
      {
        path: 'metodos-pago/:id/editar',
        loadComponent: () => import('./features/admin/pages/metodo-pago/metodo-pago-form/metodo-pago-form.component').then(m => m.MetodoPagoFormComponent)
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];