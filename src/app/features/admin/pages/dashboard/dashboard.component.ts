// RUTA src\app\features\admin\pages\dashboard\dashboard.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { Dashboard } from '../../../../core/models/dashboard.model';

type Preset = 'hoy' | '7d' | '30d' | 'mes';

const PALETA = ['#0d5c3a', '#d4af37', '#2f8f83', '#c53030', '#6b7d74', '#3b6ea5'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  data = signal<Dashboard | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  fechaDesde = signal('');
  fechaHasta = signal('');
  presetActivo = signal<Preset | null>('mes');

  readonly presets: { id: Preset; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: 'mes', label: 'Este mes' }
  ];

  totalEstados = computed(() =>
    (this.data()?.reservasPorEstado ?? []).reduce((s, e) => s + e.cantidad, 0)
  );

  // Segmentos del donut: usa un círculo de circunferencia 100 para trabajar en porcentajes
  estadoSegmentos = computed(() => {
    const lista = this.data()?.reservasPorEstado ?? [];
    const total = this.totalEstados();
    if (!total) return [];

    let acumulado = 0;
    return lista.map((e, i) => {
      const pct = (e.cantidad / total) * 100;
      const segmento = {
        estado: e.estado,
        cantidad: e.cantidad,
        pct,
        offset: 25 - acumulado,
        color: this.colorEstado(e.estado, i)
      };
      acumulado += pct;
      return segmento;
    });
  });

  espaciosRanking = computed(() => {
    const lista = [...(this.data()?.reservasPorEspacio ?? [])].sort((a, b) => b.cantidad - a.cantidad);
    const max = lista[0]?.cantidad || 1;
    return lista.map(e => ({ ...e, ancho: (e.cantidad / max) * 100 }));
  });

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.aplicarPreset('mes');
  }

  aplicarPreset(preset: Preset): void {
    const hoy = new Date();
    let desde = new Date(hoy);

    switch (preset) {
      case '7d':
        desde.setDate(hoy.getDate() - 6);
        break;
      case '30d':
        desde.setDate(hoy.getDate() - 29);
        break;
      case 'mes':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      // 'hoy': desde = hoy
    }

    this.presetActivo.set(preset);
    this.fechaDesde.set(this.formatearFecha(desde));
    this.fechaHasta.set(this.formatearFecha(hoy));
    this.cargar();
  }

  onFechaCambiada(campo: 'desde' | 'hasta', valor: string): void {
    if (campo === 'desde') this.fechaDesde.set(valor);
    else this.fechaHasta.set(valor);

    this.presetActivo.set(null); // rango personalizado
    if (this.fechaDesde() && this.fechaHasta()) this.cargar();
  }

  cargar(): void {
    if (this.fechaDesde() > this.fechaHasta()) {
      this.errorMessage.set('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.obtener(this.fechaDesde(), this.fechaHasta()).subscribe({
      next: (data) => this.data.set(data),
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.errorMessage.set('No se pudieron cargar las métricas. Intenta nuevamente.');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  private colorEstado(estado: string, indice: number): string {
    const e = estado.toUpperCase();
    if (e.includes('CANCEL')) return '#c53030';
    if (e.includes('PEND')) return '#d4af37';
    if (e.includes('CONFIRM')) return '#0d5c3a';
    if (e.includes('COMPLET') || e.includes('FINAL')) return '#2f8f83';
    return PALETA[indice % PALETA.length];
  }

  // yyyy-MM-dd en hora local (toISOString() usaría UTC y puede correr el día)
  private formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}