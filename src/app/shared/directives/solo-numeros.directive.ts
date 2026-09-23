// RUTA src\app\shared\directives\solo-numeros.directive.ts

import { Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appSoloNumeros]',
  standalone: true
})
export class SoloNumerosDirective {
  @Input() permitirDecimales = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl?: NgControl
  ) {}

  /**
   * Intercepta la pulsación de teclas para bloquear caracteres no numéricos ANTES de que aparezcan.
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Permitir teclas de control: Backspace, Delete, Tab, Escape, Enter, Flechas, Home, End
    if (
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'Tab' ||
      key === 'Escape' ||
      key === 'Enter' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Home' ||
      key === 'End'
    ) {
      return;
    }

    // Definir qué es válido
    const esDigito = /^[0-9]$/.test(key);
    const esPunto = key === '.';

    // Lógica de validación
    if (this.permitirDecimales) {
      // Si permite decimales: acepta dígitos o punto (si aún no hay uno)
      if (esDigito) return;
      
      if (esPunto) {
        // Verificar si ya existe un punto en el valor actual
        const currentValue = this.el.nativeElement.value;
        if (!currentValue.includes('.')) {
          return; // Permitir el primer punto
        }
      }
    } else {
      // Si solo enteros: solo acepta dígitos
      if (esDigito) return;
    }

    // Si llegamos aquí, la tecla NO es válida -> Bloquearla
    event.preventDefault();
  }

  /**
   * Maneja el pegado (Paste) para limpiar caracteres no deseados.
   * El evento keydown no captura Ctrl+V ni Click derecho -> Pegar.
   */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    // Obtener texto pegado
    const pasteData = event.clipboardData?.getData('text') || '';
    
    // Limpiar según configuración
    const patronInvalido = this.permitirDecimales ? /[^0-9.]/g : /\D/g;
    let limpio = pasteData.replace(patronInvalido, '');

    if (this.permitirDecimales) {
      // Asegurar solo un punto decimal en lo pegado
      const partes = limpio.split('.');
      if (partes.length > 2) {
        limpio = partes[0] + '.' + partes.slice(1).join('');
      }
    }

    // Insertar el texto limpio en la posición del cursor o al final
    const input = this.el.nativeElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    
    // Construir nuevo valor respetando la selección actual
    const valorActual = input.value;
    const nuevoValor = valorActual.substring(0, start) + limpio + valorActual.substring(end);

    input.value = nuevoValor;
    
    // Actualizar FormControl
    this.ngControl?.control?.setValue(nuevoValor, { emitEvent: false });
    
    // Mover el cursor al final de lo insertado
    input.setSelectionRange(start + limpio.length, start + limpio.length);
  }

  /**
   * Respaldo por si el autocompletado del navegador ignora los eventos anteriores.
   * Limpia cualquier residuo no deseado.
   */
  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const patronInvalido = this.permitirDecimales ? /[^0-9.]/g : /\D/g;
    let limpio = input.value.replace(patronInvalido, '');

    if (this.permitirDecimales) {
      const partes = limpio.split('.');
      if (partes.length > 2) {
        limpio = partes[0] + '.' + partes.slice(1).join('');
      }
    }

    if (input.value !== limpio) {
      input.value = limpio;
      this.ngControl?.control?.setValue(limpio, { emitEvent: false });
    }
  }
}