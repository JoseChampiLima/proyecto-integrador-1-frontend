import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sede } from '../models/sede.model';

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private apiUrl = `${environment.urlBackend}/sedes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Sede[]> {
    return this.http.get<Sede[]>(this.apiUrl);
  }

  listarActivas(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiUrl}/activas`);
  }

  buscarPorId(id: number): Observable<Sede> {
    return this.http.get<Sede>(`${this.apiUrl}/${id}`);
  }

  guardar(sede: Sede): Observable<Sede> {
    return this.http.post<Sede>(this.apiUrl, sede);
  }

  actualizar(id: number, sede: Sede): Observable<Sede> {
    return this.http.put<Sede>(`${this.apiUrl}/${id}`, sede);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
