// RUTA src\app\layouts\cliente-layout\cliente-layout.component.ts

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `
})
export class ClienteLayoutComponent {}