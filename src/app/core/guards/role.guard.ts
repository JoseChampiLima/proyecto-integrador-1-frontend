// RUTA src\app\core\guards\role.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RolUsuario } from '../auth/auth.service';

/**
 * Uso en app.routes.ts:
 *   canActivate: [authGuard, roleGuard(['ADMIN'])]
 *   canActivate: [authGuard, roleGuard(['CLIENTE'])]
 *
 * Requiere que authGuard ya haya corrido antes (o corre igual, pero
 * asume que si no hay sesión, isAuthenticated ya te redirigió a /login).
 */
export function roleGuard(rolesPermitidos: RolUsuario[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const rolActual = authService.rol();

    if (rolActual && rolesPermitidos.includes(rolActual as RolUsuario)) {
      return true;
    }

    // Usuario autenticado pero sin permiso: lo mandamos a su home según rol
    // en vez de dejarlo en una pantalla en blanco o un error genérico
    const destino = authService.isAdmin() ? '/admin' : '/inicio';
    router.navigate([destino]);
    return false;
  };
}