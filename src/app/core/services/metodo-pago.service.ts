import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MetodoPago } from '../models/metodo-pago.model';

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private apiUrl = `${environment.urlBackend}/metodos-pago`;

  constructor(private http: HttpClient) {}

  listar(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(this.apiUrl);
  }

  listarActivos(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.apiUrl}/activos`);
  }

  buscarPorId(id: number): Observable<MetodoPago> {
    return this.http.get<MetodoPago>(`${this.apiUrl}/${id}`);
  }

  guardar(metodoPago: MetodoPago): Observable<MetodoPago> {
    return this.http.post<MetodoPago>(this.apiUrl, metodoPago);
  }

  actualizar(id: number, metodoPago: MetodoPago): Observable<MetodoPago> {
    return this.http.put<MetodoPago>(`${this.apiUrl}/${id}`, metodoPago);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
