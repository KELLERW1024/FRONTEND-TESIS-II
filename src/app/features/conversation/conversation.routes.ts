import { Routes } from "@angular/router";
import { ConversationComponent } from "./conversation/conversation.component";
import { ViewConversationComponent } from "./view-conversation/view-conversation.component";
import { EditConversationComponent } from "./edit-conversation/edit-conversation.component";
import { EditCapituloConversationComponent } from "./edit-capitulo-conversation/edit-capitulo-conversation.component";
import { DeleteCapituloConversationComponent } from "./delete-capitulo-conversation/delete-capitulo-conversation.component";

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
  },
  {
   path: 'edit-capitulo-conversation/:id',
   component: EditCapituloConversationComponent,
  },
  {
   path: 'delete-capitulo-conversation/:id',
   component: DeleteCapituloConversationComponent,
  }

];