import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { ActualizarPerfilResponse, PerfilResponse } from '../interfaces/perfil-response.interface';
import { ActualizarPerfilRequest } from '../interfaces/actualizar-perfil-request.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.urlBackend}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  buscarPorDni(dni: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/dni/${dni}`);
  }

  buscarPorCorreo(correo: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/correo/${correo}`);
  }

  guardar(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Trae los datos del usuario autenticado (el backend lo resuelve a partir del JWT). */
  obtenerMiPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.apiUrl}/perfil`);
  }
 
  /** Actualiza nombres/apellidos/teléfono y, opcionalmente, la contraseña (requiere claveActual). */
  actualizarPerfil(id: number, request: ActualizarPerfilRequest): Observable<ActualizarPerfilResponse> {
    return this.http.put<ActualizarPerfilResponse>(`${this.apiUrl}/${id}/perfil`, request);
  }
}
