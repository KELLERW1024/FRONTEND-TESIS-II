import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface Herramienta {
  id: string;
  nombre: string;
  categoria: 'estadistica' | 'finanzas' | 'operaciones';
  recomendada?: boolean; // sugerencia
}

@Component({
  selector: 'app-calculator-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './calculator-panel.component.html'
})
export class CalculatorPanelComponent implements OnInit {
  // 1. Recibe los datos que ya están en la columna izquierda
  @Input() datosConocidos: { clave: string, nombre: string, valor: string }[] = [];

  @Output() cerrarPanel = new EventEmitter<void>();
  @Output() inyectarResultado = new EventEmitter<string>();

  // 3. Estados de navegación
  activeTab: 'estadistica' | 'finanzas' | 'operaciones' = 'finanzas';
  activeToolId: string = 'pe';

  // 4.CATÁLOGO DE CALCULADORAS
  herramientas: Herramienta[] = [

    // --- ESTADÍSTICA ---
    { id: 'muestra', nombre: 'Tamaño de Muestra', categoria: 'estadistica', recomendada: true },
    { id: 'demanda', nombre: 'Proyección de Demanda', categoria: 'estadistica' },
    { id: 'mercado', nombre: 'Mercado TAM/SAM/SOM', categoria: 'estadistica' },
    { id: 'ticket', nombre: 'Ticket Promedio', categoria: 'estadistica' },
    { id: 'desviacion', nombre: 'Media y Desviación', categoria: 'estadistica' },
    
    // --- FINANZAS ---
    { id: 'pe', nombre: 'Punto de Equilibrio', categoria: 'finanzas', recomendada: true },
    { id: 'fijacion_precio', nombre: 'Fijación de Precio', categoria: 'finanzas' },
    { id: 'flujo', nombre: 'Flujo de Caja', categoria: 'finanzas' },
    { id: 'cuota', nombre: 'Cuota de Préstamo', categoria: 'finanzas' },
    { id: 'tir_van', nombre: 'TIR y VAN', categoria: 'finanzas' },

    // --- OPERACIONES ---
    { id: 'cap_maxima', nombre: 'Capacidad Máxima', categoria: 'operaciones', recomendada: true },
    { id: 'depreciacion', nombre: 'Depreciación', categoria: 'operaciones' },
    { id: 'tiempos', nombre: 'Tiempos de Ciclo', categoria: 'operaciones' },
    { id: 'mermas', nombre: 'Cálculo de Mermas', categoria: 'operaciones' },
    { id: 'productividad', nombre: 'Productividad', categoria: 'operaciones' }
  ];


  // ESTADISTICA
  // *************************************************

  // --- TAMAÑO DE MUESTRA ---
  muestraPoblacion: number | null = null; // Si es null, asumimos población infinita
  muestraConfianza: number = 1.96; // Por defecto 95% (Z = 1.96)
  muestraError: number | null = 5; // Por defecto 5% de margen de error
  muestraProbabilidad: number = 50; // p=50%, q=50% (máxima varianza)

  // --- PROYECCIÓN DE DEMANDA ---
  demBase: number | null = null;
  demTasa: number | null = null; // Porcentaje de crecimiento
  demAnios: number | null = 3;

  // --- MERCADO TAM / SAM / SOM ---
  tamUniverso: number | null = null;
  samPorcentaje: number | null = null; // % del TAM
  somPorcentaje: number | null = null; // % del SAM

  // --- TICKET PROMEDIO ---
  tickIngresos: number | null = null;
  tickClientes: number | null = null;

  // --- MEDIA Y DESVIACIÓN (3 Escenarios) ---
  medVal1: number | null = null;
  medVal2: number | null = null;
  medVal3: number | null = null;


  // FINANZAS
  // *************************************************

  // --- VARIABLES: PUNTO DE EQUILIBRIO ---
  peCostosFijos: number | null = null;
  pePrecioVenta: number | null = null;
  peCostoVariable: number | null = null;

  // --- VARIABLES: FIJACIÓN DE PRECIO ---
  fpCostoUnitario: number | null = null;
  fpMargenDeseado: number | null = null; // Porcentaje (Ej. 30%)

  // --- VARIABLES: FLUJO DE CAJA ---
  fcIngresos: number | null = null;
  fcEgresos: number | null = null;

  // --- VARIABLES: CUOTA DE PRÉSTAMO ---
  cpCapital: number | null = null;
  cpTasaAnual: number | null = null; // Porcentaje anual
  cpMeses: number | null = null;

  // --- VARIABLES: TIR Y VAN ---
  vanInversion: number | null = null;
  vanTasaDescuento: number | null = null; // COK
  vanAnios: number = 3; // Por defecto 3 años
  vanFlujos: number[] = [0, 0, 0]; // Arreglo dinámico de flujos

  // Método para cuando el usuario cambia la cantidad de años
  actualizarAniosVan() {
    if (this.vanAnios > 0 && this.vanAnios <= 10) { // Límite de 10 años por UI
      const currentLength = this.vanFlujos.length;
      if (this.vanAnios > currentLength) {
        for (let i = currentLength; i < this.vanAnios; i++) this.vanFlujos.push(0);
      } else if (this.vanAnios < currentLength) {
        this.vanFlujos = this.vanFlujos.slice(0, this.vanAnios);
      }
    }
  }


  // OPERACIONES
  // *************************************************

  // --- VARIABLES: CAPACIDAD MÁXIMA ---
  capEquipos: number | null = null;
  capProduccionPorTurno: number | null = null;
  capDiasLaborables: number | null = null;

  // --- VARIABLES: DEPRECIACIÓN LINEAL ---
  depValor: number | null = null;
  depResidual: number | null = null; // Valor de rescate (Ej. 0)
  depVidaUtil: number | null = null; // En años

  // --- VARIABLES: TIEMPOS DE CICLO ---
  tcTiempoTotal: number | null = null; // Minutos, horas, etc.
  tcUnidades: number | null = null;

  // --- VARIABLES: MERMAS Y DESPERDICIOS ---
  merMateriaPrima: number | null = null;
  merProductoTerminado: number | null = null;

  // --- VARIABLES: PRODUCTIVIDAD MANO DE OBRA ---
  prodUnidades: number | null = null;
  prodHorasHombre: number | null = null;


  ngOnInit() {
    this.intentarAutocompletar();
    this.seleccionarHerramientaRecomendada(this.activeTab);
  }

  get herramientasActuales() {
    return this.herramientas.filter(h => h.categoria === this.activeTab);
  }

  cambiarTab(tab: 'estadistica' | 'finanzas' | 'operaciones') {
    this.activeTab = tab;
    this.seleccionarHerramientaRecomendada(tab);
  }

  seleccionarHerramientaRecomendada(categoria: string) {
    const recomendada = this.herramientas.find(h => h.categoria === categoria && h.recomendada);
    if (recomendada) {
      this.activeToolId = recomendada.id;
    } else {
      const primera = this.herramientas.find(h => h.categoria === categoria);
      this.activeToolId = primera ? primera.id : '';
    }
  }

  cambiarHerramienta(id: string) {
    this.activeToolId = id;
  }

  intentarAutocompletar() {

    const valorDe = (clave: string) => this.datosConocidos.find(d => d.clave === clave)?.valor ?? '';

    const precio = valorDe('precio_o_tarifa').match(/\d+(?:[.,]\d+)?/);
    if (precio) this.pePrecioVenta = parseFloat(precio[0].replace(',', '.'));

    const capacidad = valorDe('capacidad_operativa');

    const equipos = capacidad.match(/(\d+)\s*(?:equipos?|estaciones?|microscopios?|máquinas?|maquinas?)/i);
    if (equipos) this.capEquipos = parseFloat(equipos[1]);

    const dias = capacidad.match(/(\d+)\s*d[ií]as/i);
    if (dias) this.capDiasLaborables = parseFloat(dias[1]);
  }

  // --- RESULTADOS MATEMÁTICOS ---

  // RESULTADOS ESTADISTICOS
  // *************************************************
  
  get tamanoMuestraResultado(): number | null {
    if (this.muestraError) {
      const Z = this.muestraConfianza;
      const e = this.muestraError / 100; // Convertir porcentaje a decimal
      const p = this.muestraProbabilidad / 100;
      const q = 1 - p;

      let n = (Math.pow(Z, 2) * p * q) / Math.pow(e, 2); // Fórmula Infinita

      // Si el usuario ingresó una población (Población Finita), ajustamos la fórmula
      if (this.muestraPoblacion && this.muestraPoblacion > 0) {
        const N = this.muestraPoblacion;
        n = n / (1 + ((n - 1) / N));
      }

      return Math.ceil(n); // Siempre redondeamos hacia arriba
    }
    return null;
  }

  get demandaResultado(): number | null {
    if (this.demBase && this.demTasa !== null && this.demAnios) {
      // Fórmula de Interés Compuesto para crecimiento poblacional/demanda
      return Math.round(this.demBase * Math.pow(1 + (this.demTasa / 100), this.demAnios));
    }
    return null;
  }

  get mercadoResultados(): {tam: number, sam: number, som: number} | null {
    if (this.tamUniverso && this.samPorcentaje && this.somPorcentaje) {
      const tam = this.tamUniverso;
      const sam = Math.round(tam * (this.samPorcentaje / 100));
      const som = Math.round(sam * (this.somPorcentaje / 100));
      return { tam, sam, som };
    }
    return null;
  }

  get ticketResultado(): number | null {
    if (this.tickIngresos && this.tickClientes) {
      return parseFloat((this.tickIngresos / this.tickClientes).toFixed(2));
    }
    return null;
  }

  get mediaResultado(): number | null {
    if (this.medVal1 !== null && this.medVal2 !== null && this.medVal3 !== null) {
      return parseFloat(((this.medVal1 + this.medVal2 + this.medVal3) / 3).toFixed(2));
    }
    return null;
  }

  // RESULTADOS FINANZAS
  // *************************************************

  get puntoEquilibrioResultado(): number | null {
    if (this.peCostosFijos && this.pePrecioVenta && this.peCostoVariable) {
      const margen = this.pePrecioVenta - this.peCostoVariable;
      return margen > 0 ? Math.ceil(this.peCostosFijos / margen) : null;
    }
    return null;
  }

  get fijacionPrecioResultado(): number | null {
    // Fórmula de pricing por margen: Precio = Costo / (1 - %Margen)
    if (this.fpCostoUnitario && this.fpMargenDeseado !== null && this.fpMargenDeseado < 100) {
      return parseFloat((this.fpCostoUnitario / (1 - (this.fpMargenDeseado / 100))).toFixed(2));
    }
    return null;
  }

  get flujoCajaResultado(): number | null {
    if (this.fcIngresos !== null && this.fcEgresos !== null) {
      return parseFloat((this.fcIngresos - this.fcEgresos).toFixed(2));
    }
    return null;
  }

  get cuotaPrestamoResultado(): number | null {
    // Fórmula de cuota francesa: C = (V * i) / (1 - (1+i)^-n)
    if (this.cpCapital && this.cpTasaAnual && this.cpMeses) {
      const i = (this.cpTasaAnual / 100) / 12; // Tasa mensual
      const n = this.cpMeses;
      const cuota = (this.cpCapital * i) / (1 - Math.pow(1 + i, -n));
      return parseFloat(cuota.toFixed(2));
    }
    return null;
  }

  get vanResultado(): number | null {
    if (this.vanInversion && this.vanTasaDescuento !== null) {
      const r = this.vanTasaDescuento / 100;
      let van = -this.vanInversion;
      for (let i = 0; i < this.vanFlujos.length; i++) {
        const flujo = this.vanFlujos[i] || 0;
        van += flujo / Math.pow(1 + r, i + 1);
      }
      return parseFloat(van.toFixed(2));
    }
    return null;
  }

  get tirResultado(): number | null {
    if (this.vanInversion && this.vanFlujos.length > 0) {
      // Método de aproximación simple para la TIR
      let tir = 0.1; // Asumimos 10% inicial
      let step = 0.1;
      let limit = 1000;
      
      for (let iter = 0; iter < limit; iter++) {
        let npv = -this.vanInversion;
        for (let i = 0; i < this.vanFlujos.length; i++) {
          npv += (this.vanFlujos[i] || 0) / Math.pow(1 + tir, i + 1);
        }
        if (Math.abs(npv) < 0.1) return parseFloat((tir * 100).toFixed(2));
        
        // Ajustamos la tasa dependiendo de si el VAN es positivo o negativo
        if (npv > 0) tir += step;
        else {
          tir -= step;
          step /= 2; // Refinamos la búsqueda
          tir += step;
        }
      }
    }
    return null;
  }

  // RESULTADOS OPERACIONES
  // *************************************************

  get capacidadMaximaResultado(): number | null {
    if (this.capEquipos && this.capProduccionPorTurno && this.capDiasLaborables) {
      // Fórmula básica: Equipos x Producción diaria por equipo x Días al mes
      return Math.round(this.capEquipos * this.capProduccionPorTurno * this.capDiasLaborables);
    }
    return null;
  }

  get depreciacionResultado(): number | null {
    if (this.depValor && this.depVidaUtil && this.depVidaUtil > 0) {
      const residual = this.depResidual || 0; // Si lo dejan vacío, asume 0
      return parseFloat(((this.depValor - residual) / this.depVidaUtil).toFixed(2));
    }
    return null;
  }

  get tiemposResultado(): number | null {
    if (this.tcTiempoTotal && this.tcUnidades && this.tcUnidades > 0) {
      return parseFloat((this.tcTiempoTotal / this.tcUnidades).toFixed(2));
    }
    return null;
  }

  get mermasResultado(): number | null {
    if (this.merMateriaPrima && this.merProductoTerminado !== null && this.merMateriaPrima > 0) {
      const merma = this.merMateriaPrima - this.merProductoTerminado;
      const porcentaje = (merma / this.merMateriaPrima) * 100;
      return parseFloat(porcentaje.toFixed(2));
    }
    return null;
  }

  get productividadResultado(): number | null {
    if (this.prodUnidades && this.prodHorasHombre && this.prodHorasHombre > 0) {
      return parseFloat((this.prodUnidades / this.prodHorasHombre).toFixed(2));
    }
    return null;
  }

  // --- INYECCIÓN AL CHAT ---
  
  inyectar() {
    // ESTADISTICA
    if (this.activeToolId === 'muestra' && this.tamanoMuestraResultado) {
      const tipoPoblacion = this.muestraPoblacion ? `una población finita de ${this.muestraPoblacion} personas` : 'una población infinita';
      const mensaje = `He calculado mi tamaño de muestra estadístico. Considerando ${tipoPoblacion}, un nivel de confianza del ${this.muestraConfianza === 1.96 ? '95%' : (this.muestraConfianza === 2.58 ? '99%' : '90%')}, y un margen de error del ${this.muestraError}%, necesito encuestar a ${this.tamanoMuestraResultado} personas. Por favor, redacta el sustento metodológico con estos datos.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'demanda' && this.demandaResultado) {
      const mensaje = `He proyectado mi demanda. Con una base actual de ${this.demBase}, una tasa de crecimiento anual del ${this.demTasa}%, en ${this.demAnios} años tendré una demanda estimada de ${this.demandaResultado}. Por favor, inclúyelo en la proyección.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'mercado' && this.mercadoResultados) {
      const mensaje = `He calculado mi mercado. Mi Mercado Total (TAM) es de ${this.mercadoResultados.tam}. De ahí, mi Mercado Disponible (SAM) es el ${this.samPorcentaje}%, lo que equivale a ${this.mercadoResultados.sam}. Finalmente, mi Mercado Objetivo (SOM) es el ${this.somPorcentaje}% del SAM, lo que significa que apunto a capturar ${this.mercadoResultados.som} clientes. Úsalo para sustentar el estudio de mercado.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'ticket' && this.ticketResultado) {
      const mensaje = `He calculado mi ticket promedio. Basado en S/${this.tickIngresos} de ingresos generados por ${this.tickClientes} clientes/atenciones, mi ticket promedio por cliente es de S/${this.ticketResultado}. Intégralo al plan.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'desviacion' && this.mediaResultado) {
      const mensaje = `He calculado el promedio simple de mis tres muestras o escenarios (${this.medVal1}, ${this.medVal2}, ${this.medVal3}). La media resultante es ${this.mediaResultado}. Utiliza este promedio como base conservadora en la propuesta.`;
      this.inyectarResultado.emit(mensaje);
    }
    // FINANZAS
    else if (this.activeToolId === 'pe' && this.puntoEquilibrioResultado) {
      const mensaje = `Acabo de simular mi Punto de Equilibrio. Mis Costos Fijos son S/${this.peCostosFijos}, Precio de Venta: S/${this.pePrecioVenta}, Costo Variable: S/${this.peCostoVariable}. El resultado es de ${this.puntoEquilibrioResultado} unidades. Por favor, integra este cálculo en la propuesta académica.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'fijacion_precio' && this.fijacionPrecioResultado) {
      const mensaje = `He calculado el precio de venta ideal. Con un costo unitario de S/${this.fpCostoUnitario} y buscando un margen de ganancia del ${this.fpMargenDeseado}%, el precio de venta debe fijarse en S/${this.fijacionPrecioResultado}. Por favor, intégralo a la estrategia de precios.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'flujo' && this.flujoCajaResultado !== null) {
      const estado = this.flujoCajaResultado >= 0 ? 'positivo' : 'negativo';
      const mensaje = `He calculado mi flujo de caja del periodo. Con ingresos de S/${this.fcIngresos} y egresos de S/${this.fcEgresos}, mi flujo neto es ${estado} por un total de S/${this.flujoCajaResultado}. Úsalo para sustentar la liquidez.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'cuota' && this.cuotaPrestamoResultado) {
      const mensaje = `He simulado un financiamiento. Para un capital de S/${this.cpCapital} a una tasa anual del ${this.cpTasaAnual}% durante ${this.cpMeses} meses, mi cuota mensual será de S/${this.cuotaPrestamoResultado}. Añádelo al plan de inversión.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'tir_van' && this.vanResultado !== null) {
      const viabilidad = this.vanResultado > 0 ? 'altamente viable' : 'no viable';
      const mensaje = `He calculado los indicadores de rentabilidad a ${this.vanAnios} años. Con una inversión de S/${this.vanInversion} y una tasa de descuento del ${this.vanTasaDescuento}%, el VAN resultante es de S/${this.vanResultado}. Además, la Tasa Interna de Retorno (TIR) estimada es del ${this.tirResultado}%. Esto indica que el proyecto es ${viabilidad}. Por favor, redacta el análisis financiero.`;
      this.inyectarResultado.emit(mensaje);
    }
    // OPERACIONES 
    else if (this.activeToolId === 'cap_maxima' && this.capacidadMaximaResultado) {
      const mensaje = `Acabo de calcular mi Capacidad Máxima Instalada. Cuento con ${this.capEquipos} equipos/recursos, una producción/atención de ${this.capProduccionPorTurno} unidades diarias por equipo, y opero ${this.capDiasLaborables} días al mes. Mi capacidad máxima mensual es de ${this.capacidadMaximaResultado} unidades. Por favor, utilízalo para redactar el análisis de operaciones.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'depreciacion' && this.depreciacionResultado !== null) {
      const mensaje = `He calculado la depreciación lineal de un activo. Con un valor de adquisición de S/${this.depValor}, un valor residual de S/${this.depResidual || 0}, y una vida útil de ${this.depVidaUtil} años, la depreciación anual es de S/${this.depreciacionResultado}. Inclúyelo en el presupuesto operativo.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'tiempos' && this.tiemposResultado !== null) {
      const mensaje = `He medido mis tiempos de ciclo. Toma ${this.tcTiempoTotal} minutos/horas producir o atender ${this.tcUnidades} unidades. Esto nos da un tiempo de ciclo promedio de ${this.tiemposResultado} por unidad/servicio. Utilízalo para sustentar la eficiencia operativa.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'mermas' && this.mermasResultado !== null) {
      const cantidadMerma = this.merMateriaPrima! - this.merProductoTerminado!;
      const mensaje = `He calculado mis mermas operativas. Ingresando ${this.merMateriaPrima} unidades/kg de materia prima y logrando ${this.merProductoTerminado} productos terminados, tengo una pérdida física de ${cantidadMerma}, lo que representa un ${this.mermasResultado}% de merma. Incorpóralo en el plan de producción.`;
      this.inyectarResultado.emit(mensaje);
    }
    else if (this.activeToolId === 'productividad' && this.productividadResultado !== null) {
      const mensaje = `He evaluado la productividad laboral. Produciendo ${this.prodUnidades} unidades e invirtiendo un total de ${this.prodHorasHombre} horas-hombre, el ratio es de ${this.productividadResultado} unidades por hora-hombre. Añádelo al análisis de recursos humanos y operaciones.`;
      this.inyectarResultado.emit(mensaje);
    }
  }

  cancelar() {
    this.cerrarPanel.emit();
  }
}