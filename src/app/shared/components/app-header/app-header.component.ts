// RUTA src\app\shared\components\app-header\app-header.component.ts

import { Component, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent {
  userMenuOpen = signal(false);

  constructor(public auth: AuthService, private router: Router) {}

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  onLogout(): void {
    this.auth.logout();
    this.userMenuOpen.set(false);
    this.router.navigate(['/login']);
  }

  onEditarPerfil(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/perfil']);
  }
}