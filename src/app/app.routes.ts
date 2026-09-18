import { Routes } from '@angular/router';

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
  }
];
