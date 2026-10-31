import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [ CommonModule, MatCardModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit {
  
  planes: any[] = [];
  isLoadingPlanes = true;

  private apiUrl = 'http://127.0.0.1:8000/api/packages'; 

  ngOnInit(): void {
    this.cargarPlanes();
  }

  async cargarPlanes(): Promise<void> {
    try {

      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Convertimos la respuesta a JSON
      const rawData = await response.json();
      
      const todosLosPaquetes = rawData.data || rawData;
      const nombresDeseados = ['Emprendedor', 'Profesional', 'Asesor senior'];
        
      this.planes = todosLosPaquetes
        .filter((p: any) => nombresDeseados.includes(p.name))
        .map((p: any) => {
          
          let desc = '';
          if (p.name === 'Emprendedor') {
            desc = 'Para comenzar a estructurar tu primer proyecto.';         
          } else if (p.name === 'Profesional') {
            desc = 'Para desarrollar proyectos completos con mayor capacidad.';    
          } else {
            desc = 'Para proyectos extensos y usuarios con mayor demanda.';
          }

       let beneficiosArray = [];
          if (p.benefits) {
            beneficiosArray = p.benefits.split(',').map((b: string) => {
              // 1. Quitamos espacios extra a los lados
              let texto = b.trim();
              // 2. Si hay texto, convertimos la PRIMERA letra en mayúscula
              if (texto.length > 0) {
                texto = texto.charAt(0).toUpperCase() + texto.slice(1);
              }
              // 3. Retornamos con el check
              return '✓ ' + texto;
            });
          }

          return {
            // Asignamos el nombre de la BD
            nombre: p.name, 
            precio: p.local_price,
            meses: p.duration_months,
            descripcion: desc,
            esDestacado: p.name === 'Profesional',
            caracteristicas: beneficiosArray
          };
        })
        .sort((a: any, b: any) => {
          // Usamos los nombres de la BD para determinar el orden
          const orden: any = { 'Emprendedor': 1, 'Profesional': 2, 'Asesor senior': 3 };
          return orden[a.nombre] - orden[b.nombre];
        });

      this.isLoadingPlanes = false;

    } catch (error) {
      console.error('Error al cargar planes de la BD de forma nativa:', error);
      this.isLoadingPlanes = false;
    }
  }
}