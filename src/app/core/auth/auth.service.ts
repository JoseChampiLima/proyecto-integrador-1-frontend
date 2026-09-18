// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../interfaces/login-request.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ForgotRequest } from '../interfaces/forgot-request.interface';
import { ForgotResponse } from '../interfaces/forgot-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.urlBackend}/auth`;

  constructor(private http: HttpClient) {}

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest);
  }
  forgot(forgotRequest: ForgotRequest): Observable<ForgotResponse> {
    return this.http.post<ForgotResponse>(`${this.apiUrl}/forgot-password`, forgotRequest);
  }
}