import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { ConversationService } from '../features/conversation/service/conversation.service';
import { map, catchError, of } from 'rxjs';

export const conversationStepGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const conversationService = inject(ConversationService);
  const dialog = inject(MatDialog);

  const idConversation = Number(route.paramMap.get('id'));
  const requiredStep = route.data['step'] as 'diagnostic' | 'structure' | 'edit';


  const mostrarAviso = (mensaje: string, titulo = 'Acceso no permitido') => {
    dialog.open(DialogComponent, {
      width: '400px',
      data: {
        type: 'info',
        title: titulo,
        message: mensaje,
        confirmText: 'Aceptar'
      }
    });
  };

  if (!idConversation) {
    return of(router.createUrlTree(['/conversations']));
  }

  return conversationService.getVerficationDiagnosticExist(idConversation).pipe(
    map((resp: any) => {
      const hasDiagnostic = resp.exists && resp.summary != null;
      const statusStructure = Number(resp.status_structure ?? 0);

      //Diagnóstico inicial
      if (requiredStep === 'diagnostic') {
        if (hasDiagnostic) {
          mostrarAviso('Ya has completado el diagnóstico inicial de este plan.');
          if (statusStructure === 0) {
            return router.createUrlTree(['/conversations/structure', idConversation]);
          }
          return router.createUrlTree(['/conversations/edit', idConversation]);
        }
        return true;
      }

      //Estructura del plan
      if (requiredStep === 'structure') {
        if (!hasDiagnostic) {
          mostrarAviso('Primero debes completar el diagnóstico inicial.'); 
          return router.createUrlTree(['/conversations/question-diagnostic-type', idConversation]);
        }
        return true; 
      }

      //Desarrollo del plan
      if (requiredStep === 'edit') {
        if (!hasDiagnostic) {
          mostrarAviso('Primero debes completar el diagnóstico inicial.');
          return router.createUrlTree(['/conversations/question-diagnostic-type', idConversation]);
        }
        if (statusStructure === 0) {
          mostrarAviso('Primero debes definir y guardar la estructura de tu plan.');
          return router.createUrlTree(['/conversations/structure', idConversation]);
        }
        return true;
      }

      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/conversations']));
    })
  );
};