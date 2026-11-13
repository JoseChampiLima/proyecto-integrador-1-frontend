// RUTA src\app\core\guards\guest.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Evita que un usuario ya autenticado vuelva a ver el sitio público o el login.
 *
 * Caso típico: el usuario cierra la ventana con la sesión guardada en localStorage
 * (checkbox "Recordarme"), vuelve a abrir el navegador en la raíz "/" y Angular
 * restaura la sesión, pero la ruta "/" es la landing pública. Con este guard lo
 * mandamos directo a su panel según el rol.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Autenticado: cada rol tiene su propia home
  return router.createUrlTree([authService.isAdmin() ? '/admin' : '/inicio']);
};
