// RUTA src\app\core\services\dashboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.urlBackend}/dashboard`;

  constructor(private http: HttpClient) {}

  /** Las fechas deben ir en formato ISO yyyy-MM-dd (lo que espera @DateTimeFormat.ISO.DATE) */
  obtener(fechaDesde: string, fechaHasta: string): Observable<Dashboard> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);

    return this.http.get<Dashboard>(this.apiUrl, { params });
  }
}