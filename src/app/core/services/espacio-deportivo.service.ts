import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EspacioDeportivo } from '../models/espacio-deportivo.model';

@Injectable({
  providedIn: 'root'
})
export class EspacioDeportivoService {
  private apiUrl = `${environment.urlBackend}/espacios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<EspacioDeportivo[]> {
    return this.http.get<EspacioDeportivo[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<EspacioDeportivo> {
    return this.http.get<EspacioDeportivo>(`${this.apiUrl}/${id}`);
  }

  listarPorTipo(idTipo: number): Observable<EspacioDeportivo[]> {
    return this.http.get<EspacioDeportivo[]>(`${this.apiUrl}/tipo/${idTipo}`);
  }

  listarPorSede(idSede: number): Observable<EspacioDeportivo[]> {
    return this.http.get<EspacioDeportivo[]>(`${this.apiUrl}/sede/${idSede}`);
  }

  listarPorEstado(estado: string): Observable<EspacioDeportivo[]> {
    return this.http.get<EspacioDeportivo[]>(`${this.apiUrl}/estado/${estado}`);
  }

  listarDisponiblesPorSede(idSede: number): Observable<EspacioDeportivo[]> {
    return this.http.get<EspacioDeportivo[]>(`${this.apiUrl}/disponibles/sede/${idSede}`);
  }

  guardar(espacio: EspacioDeportivo): Observable<EspacioDeportivo> {
    return this.http.post<EspacioDeportivo>(this.apiUrl, espacio);
  }

  actualizar(id: number, espacio: EspacioDeportivo): Observable<EspacioDeportivo> {
    return this.http.put<EspacioDeportivo>(`${this.apiUrl}/${id}`, espacio);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  subirFoto(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/${id}/foto`, formData);
  }

  eliminarFoto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/foto`);
  }
}
