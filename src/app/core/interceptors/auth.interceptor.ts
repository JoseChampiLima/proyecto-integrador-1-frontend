// RUTA src\app\core\interceptors\auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authHeader = authService.getAuthHeader();

  const requestClonada = authHeader
    ? req.clone({ setHeaders: { Authorization: authHeader } })
    : req;

  return next(requestClonada).pipe(
    catchError((error) => {
      // Solo forzamos logout/redirect si la petición SÍ llevaba token y el backend
      // lo rechazó (sesión vencida/inválida). Si era una petición anónima (sin token,
      // ej. una pantalla pública como el home), un 401 no debe mandar al usuario al login.
      if (error.status === 401 && authHeader) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};