// RUTA src\app\core\auth\auth.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../interfaces/login-request.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ForgotRequest } from '../interfaces/forgot-request.interface';
import { ForgotResponse } from '../interfaces/forgot-response.interface';

export type RolUsuario = 'ADMINISTRADOR' | 'CLIENTE';

interface SesionGuardada {
  token: string;
  tipo: string;
  rol: string;
  correo: string;
  expiraEn: number; // timestamp absoluto (ms) en el que expira
}

const TOKEN_KEY = 'lt_token';
const TIPO_KEY = 'lt_tipo';
const ROL_KEY = 'lt_rol';
const CORREO_KEY = 'lt_correo';
const EXPIRA_KEY = 'lt_expira';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.urlBackend}/auth`;

  // Fuente única de verdad para toda la app (header, guards, interceptor)
  private tokenSignal = signal<string | null>(null);
  private tipoSignal = signal<string | null>(null);
  private rolSignal = signal<string | null>(null);
  private correoSignal = signal<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly tipo = this.tipoSignal.asReadonly();
  readonly rol = this.rolSignal.asReadonly();
  readonly correo = this.correoSignal.asReadonly();

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isAdmin = computed(() => this.rolSignal() === 'ADMINISTRADOR');
  readonly isCliente = computed(() => this.rolSignal() === 'CLIENTE');

  constructor(private http: HttpClient) {
    this.rehidratarSesion();
  }

  login(loginRequest: LoginRequest, recordarme: boolean = true): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap((response) => this.guardarSesion(response, loginRequest.correo, recordarme))
    );
  }

  forgot(forgotRequest: ForgotRequest): Observable<ForgotResponse> {
    return this.http.post<ForgotResponse>(`${this.apiUrl}/forgot-password`, forgotRequest);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TIPO_KEY);
    localStorage.removeItem(ROL_KEY);
    localStorage.removeItem(CORREO_KEY);
    localStorage.removeItem(EXPIRA_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TIPO_KEY);
    sessionStorage.removeItem(ROL_KEY);
    sessionStorage.removeItem(CORREO_KEY);
    sessionStorage.removeItem(EXPIRA_KEY);

    this.tokenSignal.set(null);
    this.tipoSignal.set(null);
    this.rolSignal.set(null);
    this.correoSignal.set(null);
  }

  /** Actualiza el correo de la sesión activa (localStorage o sessionStorage, el que esté en uso) y el signal, sin tocar el token. */
  actualizarCorreoSesion(nuevoCorreo: string): void {
    for (const storage of [localStorage, sessionStorage]) {
      if (storage.getItem(TOKEN_KEY)) {
        storage.setItem(CORREO_KEY, nuevoCorreo);
      }
    }
    this.correoSignal.set(nuevoCorreo);
  }

  /** Header Authorization listo para el interceptor, ej: "Bearer eyJhbGciOi..." */
  getAuthHeader(): string | null {
    const token = this.tokenSignal();
    const tipo = this.tipoSignal();
    if (!token) return null;
    return `${tipo ?? 'Bearer'} ${token}`;
  }

  // --- Privados ---

  private guardarSesion(response: LoginResponse, correo: string, recordarme: boolean): void {
    const storage = recordarme ? localStorage : sessionStorage;

    // expiraEn viene del backend en segundos; lo convertimos a timestamp absoluto
    const expiraTimestamp = Date.now() + response.expiraEn * 1000;

    storage.setItem(TOKEN_KEY, response.token);
    storage.setItem(TIPO_KEY, response.tipo);
    storage.setItem(ROL_KEY, response.rol);
    storage.setItem(CORREO_KEY, correo);
    storage.setItem(EXPIRA_KEY, expiraTimestamp.toString());

    this.tokenSignal.set(response.token);
    this.tipoSignal.set(response.tipo);
    this.rolSignal.set(response.rol);
    this.correoSignal.set(correo);
  }

  private rehidratarSesion(): void {
    const sesion = this.leerSesionDeStorage();
    if (!sesion) return;

    if (Date.now() >= sesion.expiraEn) {
      // Token vencido: limpiamos en vez de dejar una sesión inválida activa
      this.logout();
      return;
    }

    this.tokenSignal.set(sesion.token);
    this.tipoSignal.set(sesion.tipo);
    this.rolSignal.set(sesion.rol);
    this.correoSignal.set(sesion.correo);
  }

  private leerSesionDeStorage(): SesionGuardada | null {
    // Revisa localStorage primero (recordarme = true), luego sessionStorage
    for (const storage of [localStorage, sessionStorage]) {
      const token = storage.getItem(TOKEN_KEY);
      const tipo = storage.getItem(TIPO_KEY);
      const rol = storage.getItem(ROL_KEY);
      const correo = storage.getItem(CORREO_KEY);
      const expiraEn = storage.getItem(EXPIRA_KEY);

      if (token && tipo && rol && correo && expiraEn) {
        return { token, tipo, rol, correo, expiraEn: Number(expiraEn) };
      }
    }
    return null;
  }
}