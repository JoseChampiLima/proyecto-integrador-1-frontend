// RUTA src\app\features\admin\pages\usuarios\usuarios-list\usuarios-list.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { Usuario } from '../../../../../core/models/usuario.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css'
})
export class UsuariosListComponent implements OnInit {
  usuarios = signal<Usuario[]>([]);
  filtro = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Usuario seleccionado para el modal de confirmación de borrado (null = modal cerrado)
  usuarioAEliminar = signal<Usuario | null>(null);
  eliminando = signal(false);

  usuariosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    if (!termino) return this.usuarios();

    return this.usuarios().filter(u =>
      u.nombres.toLowerCase().includes(termino) ||
      u.apellidos.toLowerCase().includes(termino) ||
      u.dni.includes(termino) ||
      u.correo.toLowerCase().includes(termino)
    );
  });

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usuarioService.listar().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (err) => {
        console.error('Error al listar usuarios:', err);
        this.errorMessage.set('No se pudo cargar la lista de usuarios.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  irACrear(): void {
    this.router.navigate(['/admin/usuarios/nuevo']);
  }

  irAEditar(usuario: Usuario): void {
    this.router.navigate(['/admin/usuarios', usuario.idUsuario, 'editar']);
  }

  pedirConfirmacionEliminar(usuario: Usuario): void {
    this.usuarioAEliminar.set(usuario);
  }

  cancelarEliminar(): void {
    this.usuarioAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const usuario = this.usuarioAEliminar();
    if (!usuario?.idUsuario) return;

    this.eliminando.set(true);

    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        this.usuarios.update(lista => lista.filter(u => u.idUsuario !== usuario.idUsuario));
        this.usuarioAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        this.errorMessage.set('No se pudo eliminar el usuario.');
      },
      complete: () => this.eliminando.set(false)
    });
  }
}