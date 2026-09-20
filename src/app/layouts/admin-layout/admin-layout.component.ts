// RUTA src\app\layouts\admin-layout\admin-layout.component.ts

import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule,],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}