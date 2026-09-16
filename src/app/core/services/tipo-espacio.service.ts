import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoEspacio } from '../models/tipo-espacio.model';

@Injectable({
  providedIn: 'root'
})
export class TipoEspacioService {
  private apiUrl = `${environment.urlBackend}/tipos-espacio`;

  constructor(private http: HttpClient) {}

  listar(): Observable<TipoEspacio[]> {
    return this.http.get<TipoEspacio[]>(this.apiUrl);
  }

  listarActivos(): Observable<TipoEspacio[]> {
    return this.http.get<TipoEspacio[]>(`${this.apiUrl}/activos`);
  }

  buscarPorId(id: number): Observable<TipoEspacio> {
    return this.http.get<TipoEspacio>(`${this.apiUrl}/${id}`);
  }

  guardar(tipoEspacio: TipoEspacio): Observable<TipoEspacio> {
    return this.http.post<TipoEspacio>(this.apiUrl, tipoEspacio);
  }

  actualizar(id: number, tipoEspacio: TipoEspacio): Observable<TipoEspacio> {
    return this.http.put<TipoEspacio>(`${this.apiUrl}/${id}`, tipoEspacio);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
