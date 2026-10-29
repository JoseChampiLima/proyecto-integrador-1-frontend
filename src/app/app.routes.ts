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
  { path: 'nosotros',
    loadComponent: () => import('./features/nosotros/pages/nosotros/nosotros.component').then(m => m.NosotrosComponent)
  },

  // --- Zona CLIENTE ---
  
// --- Zona CLIENTE ---
    {
      path: 'inicio',
      loadComponent: () =>
        import('./layouts/cliente-layout/cliente-layout.component')
          .then(m => m.ClienteLayoutComponent),

      canActivate: [authGuard, roleGuard(['CLIENTE'])],

      children: [
        {
          path: '',
          loadComponent: () =>
            import('./features/home/pages/home/home.component')
              .then(m => m.HomeComponent)
        },
        {
          path: 'reservar/:id',
          loadComponent: () =>
            import('./features/reservas/pages/reserva-form/reserva-form.component')
              .then(m => m.ReservaFormComponent)
        },
        {
          path: 'espacios',
          loadComponent: () =>
            import('./features/espacios/pages/espacios-list/espacios-list.component')
              .then(m => m.EspaciosListComponent)
        },
        {
          path: 'mis-reservas',
          loadComponent: () =>
            import('./features/reservas/pages/mis-reservas/mis-reservas.component')
              .then(m => m.MisReservasComponent)
        },
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
      },

      { 
        path: 'tipos-espacio',
        loadComponent: () => import('./features/admin/pages/tipos-espacio/tipos-espacio-list/tipos-espacio-list.component').then(m => m.TiposEspacioListComponent)
      },
      {
        path: 'tipos-espacio/nuevo',
        loadComponent: () => import('./features/admin/pages/tipos-espacio/tipo-espacio-form/tipo-espacio-form.component').then(m => m.TipoEspacioFormComponent)
      },
      {
        path: 'tipos-espacio/:id/editar',
        loadComponent: () => import('./features/admin/pages/tipos-espacio/tipo-espacio-form/tipo-espacio-form.component').then(m => m.TipoEspacioFormComponent)
      },

      { path: 'mantenimientos', loadComponent: () => import('./features/admin/pages/mantenimientos/mantenimientos-list/mantenimientos-list.component').then(m => m.MantenimientosListComponent) },
      { path: 'mantenimientos/nuevo', loadComponent: () => import('./features/admin/pages/mantenimientos/mantenimiento-form/mantenimiento-form.component').then(m => m.MantenimientoFormComponent) },
      { path: 'mantenimientos/:id/editar', loadComponent: () => import('./features/admin/pages/mantenimientos/mantenimiento-form/mantenimiento-form.component').then(m => m.MantenimientoFormComponent) },

      { path: 'pagos', loadComponent: () => import('./features/admin/pages/pagos/pagos-list/pagos-list.component').then(m => m.PagosListComponent) },

      { path: 'reservas', loadComponent: () => import('./features/admin/pages/reservas/reservas-list/reservas-list.component').then(m => m.ReservasListComponent) },
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];