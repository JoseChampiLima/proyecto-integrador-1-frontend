// RUTA src\app\shared\components\app-header\app-header.component.ts

import { Component, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { EditarPerfilModalComponent } from '../editar-perfil-modal/editar-perfil-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, EditarPerfilModalComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent {
  userMenuOpen = signal(false);
  mostrarModalPerfil = signal(false);

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
    this.userMenuOpen.set(false); // cierra el dropdown
    this.mostrarModalPerfil.set(true);
  }
 
  cerrarModalPerfil(): void {
    this.mostrarModalPerfil.set(false);
  }
}