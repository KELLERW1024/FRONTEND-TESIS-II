import { Routes } from "@angular/router";
import { ConversationComponent } from "./conversation/conversation.component";
import { ViewConversationComponent } from "./view-conversation/view-conversation.component";
import { EditConversationComponent } from "./edit-conversation/edit-conversation.component";

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

];