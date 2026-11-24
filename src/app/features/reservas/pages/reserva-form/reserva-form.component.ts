// RUTA src\app\features\reservas\pages\reserva-form\reserva-form.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EspacioDeportivoService } from '../../../../core/services/espacio-deportivo.service';
import { HorarioService } from '../../../../core/services/horario.service';
import { ReservaService } from '../../../../core/services/reserva.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { EspacioDeportivo } from '../../../../core/models/espacio-deportivo.model';
import { Horario } from '../../../../core/models/horario.model';
import { Reserva } from '../../../../core/models/reserva.model';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs);

type EstadoBloque = 'disponible' | 'ocupado' | 'fuera' | 'consultando';
interface Bloque { inicio: string; fin: string; estado: EstadoBloque; }


@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva-form.component.html',
  styleUrl: './reserva-form.component.css',
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' }
  ]
})

export class ReservaFormComponent implements OnInit {
  idReservaCreada = signal<number | null>(null);
  espacio = signal<EspacioDeportivo | null>(null);
  horarios = signal<Horario[]>([]);
  idUsuario = signal<number | null>(null);
  cargando = signal(true);
  procesando = signal(false);
  consultando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');
  bloques = signal<Bloque[]>([]);
  fecha = '';
  horaInicio = '';
  horaFin = '';
  observacion = '';
  semanaInicio = this.inicioSemana(new Date());
  fechaMinima = this.fechaISO(new Date());
  private consultaActual = 0;
  private dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private espacioService: EspacioDeportivoService,
    private horarioService: HorarioService,
    private reservaService: ReservaService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    const idEspacio = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(idEspacio) || idEspacio <= 0) {
      this.mensajeError.set('El espacio seleccionado no es válido.');
      this.cargando.set(false);
      return;
    }
    forkJoin({
      espacio: this.espacioService.buscarPorId(idEspacio),
      horarios: this.horarioService.listarPorEspacio(idEspacio),
      perfil: this.usuarioService.obtenerMiPerfil(),
    }).subscribe({
      next: ({ espacio, horarios, perfil }) => {
         console.log('Espacio:', espacio);
  console.log('Imagen de la cancha:', espacio.foto);
        this.espacio.set(espacio);
        this.horarios.set(horarios);
        this.idUsuario.set(perfil.idUsuario);
        this.cargando.set(false);
        this.seleccionarFecha(this.fechaMinima);
      },
      error: () => {
        this.mensajeError.set('No se pudo cargar la información de la reserva.');
        this.cargando.set(false);
      },
    });
  }

  get diasSemana(): { iso: string; numero: number; nombre: string }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.semanaInicio);
      d.setDate(d.getDate() + i);
      return { iso: this.fechaISO(d), numero: d.getDate(), nombre: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()] };
    });
  }

  get mesVisible(): string {
    const d = new Date(this.semanaInicio);
    d.setDate(d.getDate() + 3);
    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(d);
  }

  get horariosDelDia(): Horario[] {
    if (!this.fecha) return [];
    return this.horarios().filter(h => h.estado === true && h.diaSemana.toUpperCase() === this.nombreDia(this.fecha))
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  get duracionCalculada(): number {
    if (!this.horaInicio || !this.horaFin) return 0;
    return Math.max(0, (this.minutos(this.horaFin) - this.minutos(this.horaInicio)) / 60);
  }
  get totalCalculado(): number { return (this.espacio()?.precioHora ?? 0) * this.duracionCalculada; }
  get horarioSeleccionado(): string { return this.horaInicio && this.horaFin ? `${this.horaInicio} – ${this.horaFin}` : 'Por seleccionar'; }

  moverSemana(delta: number): void {
    const nueva = new Date(this.semanaInicio);
    nueva.setDate(nueva.getDate() + delta * 7);
    if (delta < 0 && this.fechaISO(new Date(nueva.getFullYear(), nueva.getMonth(), nueva.getDate() + 6)) < this.fechaMinima) return;
    this.semanaInicio = nueva;
    const primerDiaValido = this.diasSemana.find(d => d.iso >= this.fechaMinima);
    if (primerDiaValido) this.seleccionarFecha(primerDiaValido.iso);
  }

  seleccionarFecha(iso: string): void {
    if (iso < this.fechaMinima) return;
    this.fecha = iso;
    this.horaInicio = '';
    this.horaFin = '';
    this.mensajeError.set('');
    this.cargarDisponibilidad();
  }

  private cargarDisponibilidad(): void {
    const idEspacio = this.espacio()?.idEspacio;
    const numeroConsulta = ++this.consultaActual;
    const bloques: Bloque[] = [];
    for (const h of this.horariosDelDia) {
      // Bloques de una hora. Los tramos incompletos se muestran como fuera de atención.
      for (let m = this.minutos(h.horaInicio); m + 60 <= this.minutos(h.horaFin); m += 60) {
        const inicio = this.horaDesdeMinutos(m);
        const fin = this.horaDesdeMinutos(m + 60);
        if (!bloques.some(b => b.inicio === inicio)) bloques.push({ inicio, fin, estado: 'consultando' });
      }
    }
    bloques.sort((a, b) => a.inicio.localeCompare(b.inicio));
    this.bloques.set(bloques);
    if (!idEspacio || !bloques.length) { this.consultando.set(false); return; }
    this.consultando.set(true);
    forkJoin(bloques.map(b => this.reservaService.verificarDisponibilidad(idEspacio, this.fecha, b.inicio, b.fin)
      .pipe(catchError(() => of(null))))).subscribe(resultados => {
      if (numeroConsulta !== this.consultaActual) return;
      this.bloques.set(bloques.map((b, i) => ({ ...b, estado: resultados[i] === null ? 'consultando' : resultados[i] ? 'disponible' : 'ocupado' })));
      this.consultando.set(false);
      if (resultados.some(x => x === null)) this.mensajeError.set('No se pudo consultar toda la disponibilidad. Intenta actualizar los horarios.');
    });
  }

  actualizarHorarios(): void { this.horaInicio = ''; this.horaFin = ''; this.cargarDisponibilidad(); }

  

seleccionarBloque(b: Bloque): void {

  if (b.estado !== 'disponible') return;

  this.mensajeError.set('');

  // PRIMERA SELECCIÓN
  if (!this.horaInicio || !this.horaFin) {
    this.horaInicio = b.inicio;
    this.horaFin = b.fin;
    return;
  }

  // SI SELECCIONA EL MISMO BLOQUE, DESMARCAR
  if (b.inicio === this.horaInicio && b.fin === this.horaFin) {
    this.horaInicio = '';
    this.horaFin = '';
    return;
  }

  // SI YA TIENE 2 HORAS SELECCIONADAS
  if (this.duracionCalculada >= 2) {

    // Si selecciona uno de los bloques actuales,
    // conservar únicamente ese bloque.
    if (this.bloqueSeleccionado(b)) {
      this.horaInicio = b.inicio;
      this.horaFin = b.fin;
      return;
    }

    this.mensajeError.set(
      'Solo puedes seleccionar un máximo de 2 horas consecutivas.'
    );
    return;
  }

  // AGREGAR UNA HORA CONSECUTIVA HACIA ADELANTE
  if (b.inicio === this.horaFin) {
    this.horaFin = b.fin;
    return;
  }

  // AGREGAR UNA HORA CONSECUTIVA HACIA ATRÁS
  if (b.fin === this.horaInicio) {
    this.horaInicio = b.inicio;
    return;
  }

  // SI NO ES CONSECUTIVO, REINICIAR LA SELECCIÓN
  this.horaInicio = b.inicio;
  this.horaFin = b.fin;
}



  bloqueSeleccionado(b: Bloque): boolean { return !!this.horaInicio && b.inicio >= this.horaInicio && b.fin <= this.horaFin; }
  


horarioValido(): boolean {

  if (!this.fecha || this.fecha < this.fechaMinima) {
    return false;
  }

  if (!this.horaInicio || !this.horaFin) {
    return false;
  }

  // Mínimo 1 hora, máximo 2 horas
  if (this.duracionCalculada < 1 ||
      this.duracionCalculada > 2) {
    return false;
  }

  const seleccionados = this.bloques()
    .filter(b =>
      b.inicio >= this.horaInicio &&
      b.fin <= this.horaFin
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  if (seleccionados.length < 1 || seleccionados.length > 2) {
    return false;
  }

  // Todos los bloques deben estar disponibles
  if (seleccionados.some(b => b.estado !== 'disponible')) {
    return false;
  }

  // Comprobar que comienza en el primer bloque
  if (seleccionados[0].inicio !== this.horaInicio) {
    return false;
  }

  // Verificar continuidad
  for (let i = 1; i < seleccionados.length; i++) {
    if (seleccionados[i - 1].fin !== seleccionados[i].inicio) {
      return false;
    }
  }

  // Verificar hora final
  return seleccionados[seleccionados.length - 1].fin === this.horaFin;
}



  confirmarReserva(): void {
     // Evitar registrar la misma reserva varias veces
  if (this.procesando() || this.idReservaCreada() !== null) {
    return;
  }
    const espacio = this.espacio();
    const idUsuario = this.idUsuario();
    if (!espacio?.idEspacio || !idUsuario) { this.mensajeError.set('Faltan datos para realizar la reserva.'); return; }
    if (espacio.estado !== 'ACTIVO' || !this.horarioValido()) { this.mensajeError.set('Selecciona un horario disponible y válido.'); return; }
    this.procesando.set(true);
    this.mensajeError.set('');
    this.reservaService.verificarDisponibilidad(espacio.idEspacio, this.fecha, this.horaInicio, this.horaFin).subscribe({
      next: disponible => {
        if (!disponible) {
          this.mensajeError.set('El horario ya no está disponible. Actualiza los horarios e intenta nuevamente.');
          this.procesando.set(false);
          this.cargarDisponibilidad();
          return;
        }
        const nuevaReserva = {
          usuario: { idUsuario }, espacio: { idEspacio: espacio.idEspacio }, fechaReserva: this.fecha,
          horaInicio: this.horaInicio, horaFin: this.horaFin, observacion: this.observacion.trim(),
        } as unknown as Reserva;
        this.reservaService.guardar(nuevaReserva).subscribe({
          next: guardada => {
            this.procesando.set(false);
            this.idReservaCreada.set(guardada.idReserva ?? null);
            this.mensajeExito.set('Tu reserva fue registrada. Para confirmarla, registra tu pago.');
          },
          error: error => {
            this.mensajeError.set(error.error?.message || error.error?.mensaje || 'No se pudo registrar la reserva.');
            this.procesando.set(false);
            this.cargarDisponibilidad();
          },
        });
      },
      error: () => { this.mensajeError.set('No se pudo verificar la disponibilidad.'); this.procesando.set(false); },
    });
  }

  volver(): void { this.router.navigate(['/inicio/espacios']); }
  irAPagar(): void { this.router.navigate(['/inicio/pagar', this.idReservaCreada()]); }
  irAMisReservas(): void { this.router.navigate(['/inicio/mis-reservas']); }
  private nombreDia(iso: string): string {
    const [y,m,d] = iso.split('-').map(Number);
    return this.dias[new Date(y,m-1,d).getDay()];
  }
  private minutos(hora: string): number { const [h,m] = hora.split(':').map(Number); return h * 60 + m; }
  private horaDesdeMinutos(n: number): string { return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
  private fechaISO(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  private inicioSemana(d: Date): Date { const x = new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate() - ((x.getDay()+6)%7)); return x; }
  


obtenerImagenCancha(foto: string | null | undefined): string {

  const urlBackend = 'http://localhost:8080';
  const rutaImagenes = '/uploads/espacios/';

  if (!foto || !foto.trim()) {
    return '/images/cancha-tenis.jpg';
  }

  const ruta = foto.trim().replace(/\\/g, '/');

  // CASO 1: La BD almacena una URL completa.
  if (/^https?:\/\//i.test(ruta)) {
    return encodeURI(ruta);
  }

  // CASO 2: La BD almacena la ruta completa relativa.
  // Ejemplo: /uploads/espacios/imagen.jpg
  if (ruta.startsWith('/uploads/espacios/')) {
    return `${urlBackend}${encodeURI(ruta)}`;
  }

  // CASO 3: La BD almacena solamente el nombre.
  // Ejemplo: imagen.jpg
  const nombreArchivo = ruta.split('/').pop() || '';

  return `${urlBackend}${rutaImagenes}${encodeURIComponent(nombreArchivo)}`;
}

usarImagenPredeterminada(event: Event): void {

  const imagen = event.target as HTMLImageElement;
  const imagenPredeterminada = '/images/cancha-tenis.jpg';

  // Evitar un bucle si también falla la imagen predeterminada.
  if (!imagen.src.endsWith(imagenPredeterminada)) {
    imagen.src = imagenPredeterminada;
  }
}



esHorarioPasado(fecha: string, horaInicio: string): boolean {

  if (!fecha || !horaInicio) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [hora, minuto] = horaInicio.split(':').map(Number);

  const inicioBloque = new Date(
    anio,
    mes - 1,
    dia,
    hora,
    minuto || 0,
    0
  );

  return inicioBloque.getTime() <= Date.now();
}

horarioSeleccionadoPasado(): boolean {

  return this.bloques().some(b =>
    this.bloqueSeleccionado(b) &&
    this.esHorarioPasado(this.fecha, b.inicio)
  );
}



}
