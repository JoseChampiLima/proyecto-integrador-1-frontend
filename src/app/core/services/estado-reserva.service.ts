import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoReserva } from '../models/estado-reserva.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoReservaService {
  private apiUrl = `${environment.urlBackend}/estados-reserva`;

  constructor(private http: HttpClient) {}

  listar(): Observable<EstadoReserva[]> {
    return this.http.get<EstadoReserva[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<EstadoReserva> {
    return this.http.get<EstadoReserva>(`${this.apiUrl}/${id}`);
  }

  guardar(estadoReserva: EstadoReserva): Observable<EstadoReserva> {
    return this.http.post<EstadoReserva>(this.apiUrl, estadoReserva);
  }

  actualizar(id: number, estadoReserva: EstadoReserva): Observable<EstadoReserva> {
    return this.http.put<EstadoReserva>(`${this.apiUrl}/${id}`, estadoReserva);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
