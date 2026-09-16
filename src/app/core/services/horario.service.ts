import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Horario } from '../models/horario.mode';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = `${environment.urlBackend}/horarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}`);
  }

  listarPorEspacio(idEspacio: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/espacio/${idEspacio}`);
  }

  listarPorEspacioYDia(idEspacio: number, dia: string): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/espacio/${idEspacio}/dia/${dia}`);
  }

  guardar(horario: Horario): Observable<Horario> {
    return this.http.post<Horario>(this.apiUrl, horario);
  }

  actualizar(id: number, horario: Horario): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${id}`, horario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}