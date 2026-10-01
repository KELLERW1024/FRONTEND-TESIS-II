import { Routes } from "@angular/router";
import { ConversationComponent } from "./conversation/conversation.component";
import { ViewConversationComponent } from "./view-conversation/view-conversation.component";
import { EditConversationComponent } from "./edit-conversation/edit-conversation.component";
import { EditCapituloConversationComponent } from "./edit-capitulo-conversation/edit-capitulo-conversation.component";
import { DeleteCapituloConversationComponent } from "./delete-capitulo-conversation/delete-capitulo-conversation.component";
import { StructureComponent } from "./structure/structure.component";
import { DiagnosticComponent } from "../diagnostic/diagnostic.component";
import { QuestionDiagnosticComponent } from "./question-diagnostic-modal/question-diagnostic.component";
import { conversationStepGuard } from "src/app/guard/conversation-step.guard";

export const ConversationRoutes: Routes = [
   {
    path: '',
    component: ConversationComponent,
  },

  {
   path: 'view/:id',
   component: ViewConversationComponent,
  },

  {
   path: 'edit/:id',
   component: EditConversationComponent,
   canActivate: [conversationStepGuard],
   data: { step: 'edit' }
  },
  {
   path: 'edit-capitulo-conversation/:id',
   component: EditCapituloConversationComponent,
  },
  {
   path: 'delete-capitulo-conversation/:id',
   component: DeleteCapituloConversationComponent,
  },
  {
   path: 'structure/:id',
   component: StructureComponent,
   canActivate: [conversationStepGuard],
   data: { step: 'structure' }
  },
  {
   path: 'question-diagnostic-type/:id',
   component: QuestionDiagnosticComponent,
   canActivate: [conversationStepGuard],
   data: { step: 'diagnostic' }
  }
  
];