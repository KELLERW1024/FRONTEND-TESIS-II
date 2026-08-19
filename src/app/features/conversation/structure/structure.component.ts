import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { Plan, Section } from 'src/app/core/models/PlanResponse';
import { PlanNode } from 'src/app/core/models/PlanNodeResponse';

import { ConversationService } from '../service/conversation.service';

import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MaterialModule } from 'src/app/material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { StructureService } from '../service/structure.service';
import { NodeDialogComponent } from '../dialogs/node-dialog/node-dialog.component';
import { MoveNodeDialogComponent } from '../dialogs/move-node-dialog/move-node-dialog.component';
import { EditNodeDialogComponent } from '../dialogs/edit-node-dialog/edit-node-dialog.component';
import { DeleteNodeDialogComponent } from '../dialogs/delete-node-dialog/delete-node-dialog.component';


@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatExpansionModule,
    TablerIconsModule,
    MatDividerModule
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
})
export class StructureComponent implements OnInit {

  idSuscriptionConversation!: number;


  plan!: Plan;


  planNode: PlanNode[] = [];

  // sections: Section[] = [];


  constructor(
    private location: Location,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private conversationService: ConversationService,
    private structureService: StructureService
  ) {}


  ngOnInit(): void {

    this.route.params.subscribe(params => {

      this.idSuscriptionConversation = Number(params['id']);

      console.log(
        'ONINIT => idSuscriptionConversation:',
        this.idSuscriptionConversation
      );

      this.obtenerDataConversation();

    });

  }

  /**
   * Regresar a la pantalla anterior
   */
  goBack(): void {
    this.location.back();
  }


  /**
   * Obtener estructura del plan
   *
   * La API devuelve inicialmente una lista plana:
   *
   * [
   *   {
   *      id: 129,
   *      parent_id: null
   *   },
   *   {
   *      id: 130,
   *      parent_id: 129
   *   },
   *   ...
   * ]
   *
   * Aquí convertimos esa lista en un árbol usando children.
   */
  obtenerDataConversation(): void {

    console.log(
      'Suscription => obtenerDataConversation'
    );

    this.conversationService
      .getConversationPlanUser(this.idSuscriptionConversation)
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Conversation => ',
            resp
          );

          /**
           * La API devuelve los nodos.
           *
           * Convertimos:
           *
           * PlanNode[]
           *
           * en:
           *
           * PlanNode[] con children
           */
          this.planNode = this.buildTree(resp.data);

          console.log(
            'ÁRBOL => ',
            this.planNode
          );

        },

        error: (err: any) => {

          console.error(
            'Error obteniendo estructura:',
            err
          );

        },

        complete: () => {

          console.log(
            'Completado'
          );

        }

      });

  }


  /**
   * Construye el árbol a partir de la lista plana
   *
   * La relación se obtiene mediante:
   *
   * parent_id
   *
   * Ejemplo:
   *
   * 129
   * ├── 130
   * ├── 131
   * └── 135
   *     ├── 136
   *     ├── 137
   *     └── 138
   *
   */
  buildTree(nodes: PlanNode[]): PlanNode[] {

    /**
     * Mapa:
     *
     * id -> nodo
     */
    const nodeMap = new Map<number, PlanNode>();

    /**
     * Nodos raíz
     *
     * Son aquellos que tienen:
     *
     * parent_id = null
     */
    const roots: PlanNode[] = [];


    /**
     * PRIMER PASO
     *
     * Registramos todos los nodos.
     *
     * También inicializamos children.
     */
    nodes.forEach(node => {

      nodeMap.set(node.id, {
        ...node,
        children: []
      });

    });


    /**
     * SEGUNDO PASO
     *
     * Relacionamos cada nodo con su padre.
     */
    nodes.forEach(node => {

      const currentNode = nodeMap.get(node.id);

      if (!currentNode) {
        return;
      }


      /**
       * Es un nodo raíz
       */
      if (node.parent_id === null) {

        roots.push(currentNode);

        return;
      }


      /**
       * Buscar padre
       */
      const parent = nodeMap.get(node.parent_id);


      /**
       * Si encontramos el padre,
       * agregamos el nodo a children.
       */
      if (parent) {

        parent.children ??= [];

        parent.children.push(currentNode);

      } else {

        /**
         * Esto solamente sirve para detectar
         * inconsistencias en la información.
         */
        console.warn(
          `No se encontró el padre ${node.parent_id} del nodo ${node.id}`
        );

      }

    });


    /**
     * TERCER PASO
     *
     * Ordenamos recursivamente por "orden".
     */
    this.sortChildren(roots);


    return roots;
  }



getNodeCode(
  node: PlanNode,
  parentCode: string = ''
): string {

  const code = parentCode
    ? `${parentCode}.${node.orden}`
    : `${node.orden}`;

  return code;
}


  private sortChildren(nodes: PlanNode[]): void {

    nodes.sort(
      (a, b) => a.orden - b.orden
    );


    nodes.forEach(node => {

      if (
        node.children &&
        node.children.length > 0
      ) {

        this.sortChildren(
          node.children
        );

      }

    });

  }


  /**
   * AGREGAR HERMANO
   *
   * El nuevo nodo tendrá el mismo parent_id
   * que el nodo seleccionado.
   */
    addSibling(node: PlanNode): void {

      const dialogRef = this.dialog.open(
        NodeDialogComponent,
        {
          width: '550px',
          data: {
            mode: 'sibling',
            node: node
          }
        }
      );

      dialogRef.afterClosed().subscribe(result => {

        if (!result) {
          return;
        }

        const data = {

          plan_id: node.plan_id,

          user_plan_id: node.user_plan_id,

          // MISMO PADRE
          parent_id: node.parent_id,

          // El nuevo nodo se coloca después
          orden: node.orden + 1,

          titulo: result.titulo,

          objective: result.objective || null

        };

        console.log('CREANDO HERMANO:', data);

        this.structureService.createNode(data).subscribe({

          next: (resp) => {

            console.log(
              'Nodo creado correctamente:',
              resp
            );

            this.obtenerDataConversation();

          },

          error: (err) => {

            console.error(
              'Error creando nodo:',
              err
            );

          }

        });

      });

    }




  /**
   * AGREGAR HIJO
   *
   * El nuevo nodo tendrá:
   *
   * parent_id = node.id
   */
  addChild(node: PlanNode): void {

    const dialogRef = this.dialog.open(
    NodeDialogComponent,
    {
      width: '550px',

      data: {
        mode: 'child',
        node: node
      }
    }
  );

  dialogRef.afterClosed().subscribe(result => {

    if (!result) {
      return;
    }

    // Buscar solamente los hijos DIRECTOS
    const children = this.planNode.filter(
      item => item.parent_id === node.id
    );

    // Obtener el siguiente orden
    const nextOrder =
      children.length > 0
        ? Math.max(
            ...children.map(child => child.orden)
          ) + 1
        : 1;

    const data = {

      plan_id: node.plan_id,

      user_plan_id: node.user_plan_id,

      // El nuevo nodo será hijo directo
      parent_id: node.id,

      // Último hijo
      //orden: nextOrder,

      titulo: result.titulo,

      objective: result.objective || null

    };

    console.log('CREANDO HIJO:', data);

    this.structureService.createNode(data).subscribe({

      next: (resp: any) => {

        console.log(
          'Hijo creado correctamente:',
          resp
        );

        this.obtenerDataConversation();

      },

      error: (err: any) => {

        console.error(
          'Error creando hijo:',
          err
        );

      }

    });

  });

}



  /**
   * MOVER
   *
   * En nuestra interfaz solamente permitiremos
   * mover dentro del mismo nivel.
   *
   * Es decir:
   *
   * mismo parent_id
   */
moveNode(node: PlanNode): void {

  console.log('========== MOVE NODE ==========');
  console.log('NODO SELECCIONADO:', node);

  const siblings = this.findSiblings(
    node,
    this.planNode
  );

  console.log(
    'HERMANOS ENCONTRADOS:',
    siblings
  );

  if (siblings.length <= 1) {

    console.log(
      'El nodo no tiene otros hermanos para reordenar.'
    );

    return;
  }

  const orderedSiblings = [...siblings]
    .sort((a, b) => a.orden - b.orden);

  const dialogRef = this.dialog.open(
    MoveNodeDialogComponent,
    {
      width: '500px',

      data: {
        node: node,
        siblings: orderedSiblings,
        currentOrder: node.orden
      }
    }
  );

  dialogRef.afterClosed().subscribe(result => {

    if (!result) {
      return;
    }

    const newOrder = Number(result.orden);

    if (newOrder === node.orden) {
      return;
    }

    console.log('MOVIENDO:', {
      id: node.id,
      parent_id: node.parent_id,
      ordenActual: node.orden,
      nuevoOrden: newOrder
    });

    this.structureService
      .moveNode(
        node.id,
        node.parent_id,
        newOrder
      )
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Nodo movido correctamente:',
            resp
          );

          this.obtenerDataConversation();
        },

        error: (err: any) => {

          console.error(
            'Error moviendo nodo:',
            err
          );
        }

      });
  });
}


// UTIL MOVE
private findSiblings(
  node: PlanNode,
  nodes: PlanNode[]
): PlanNode[] {

  // El nodo es raíz
  if (node.parent_id === null) {
    return nodes.filter(
      item => item.parent_id === null
    );
  }

  // Buscar el padre
  for (const currentNode of nodes) {

    if (currentNode.id === node.parent_id) {

      return currentNode.children ?? [];
    }

    // Buscar recursivamente
    if (
      currentNode.children &&
      currentNode.children.length > 0
    ) {

      const siblings = this.findSiblings(
        node,
        currentNode.children
      );

      if (siblings.length > 0) {
        return siblings;
      }
    }
  }

  return [];
}



 /**
   * EDITAR
   */

editNode(node: PlanNode): void {

  console.log('EDITAR NODE:', node);

  const dialogRef = this.dialog.open(
    EditNodeDialogComponent,
    {
      width: '600px',

      data: {
        node: node
      }
    }
  );

  dialogRef.afterClosed().subscribe(result => {

    if (!result) {
      return;
    }

    console.log(
      'DATOS PARA ACTUALIZAR:',
      result
    );

    this.structureService
      .updateNode(
        node.id,
        {
          titulo: result.titulo,
          objective: result.objective
        }
      )
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Nodo actualizado correctamente:',
            resp
          );

          this.obtenerDataConversation();
        },

        error: (err: any) => {

          console.error(
            'Error actualizando nodo:',
            err
          );

        }

      });

  });
}


  /**
   * ELIMINAR
   *
   * El backend actualmente elimina
   * todo el subárbol.
   */
 deleteNode(node: PlanNode): void {

  console.log('ELIMINAR NODE:', node);

  const children = node.children ?? [];

  const dialogRef = this.dialog.open(
    DeleteNodeDialogComponent,
    {
      width: '500px',

      data: {
        node: node,
        hasChildren: children.length > 0,
        childrenCount: children.length
      }
    }
  );

  dialogRef.afterClosed().subscribe(confirmado => {

    if (!confirmado) {
      return;
    }

    console.log(
      'ELIMINANDO NODE:',
      node.id
    );

    this.structureService
      .deleteNode(node.id)
      .subscribe({

        next: (resp: any) => {

          console.log(
            'Nodo eliminado:',
            resp
          );

          this.obtenerDataConversation();
        },

        error: (err: any) => {

          console.error(
            'Error eliminando nodo:',
            err
          );

        }

      });

  });
}


  closeStructura(){

    this.structureService.closeStructura(this.idSuscriptionConversation)
      .subscribe({

        next: (resp: any) => {
          console.log(  'Conversation => ',  resp  );

        },
        error: (err: any) => {
          console.error(  'Error obteniendo estructura:', err );

        },
        complete: () => {
          console.log( 'Completado' );
        }

      });
  }

}
