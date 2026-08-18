import { Injectable } from '@angular/core';
import { ConversationPlanResponse } from 'src/app/core/models/ConversationPlanResponse';
import { ChatTable, IaResponse } from 'src/app/core/models/IAResponse';

@Injectable({
  providedIn: 'root'
})
export class ConversationFormService {

  constructor() {}

  buildValidateFormData(data: {
    idConversation: number;
    question: ConversationPlanResponse;
    response: string;
    generateTable: boolean;
    isVisual: boolean;
    files: File[];
  }): FormData {

    const formData = new FormData();

    formData.append(
      'idConversation',
      String(data.idConversation ?? '')
    );

    formData.append(
      'idQuestion',
      String(data.question.question?.id ?? '')
    );

    formData.append(
      'description',
      data.question.parent_node?.titulo ?? ''
    );

    formData.append(
      'question',
      data.question.question?.question_text ?? ''
    );

    formData.append(
      'detail',
      data.question.question?.question_detail ?? ''
    );

    formData.append(
      'validation',
      data.question.question?.validation_detail ?? ''
    );

    formData.append(
      'response',
      data.response ?? ''
    );

    formData.append(
      'generate_table',
      data.generateTable ? '1' : '0'
    );

    formData.append(
      'is_visual',
      data.isVisual ? '1' : '0'
    );

    data.files.forEach(file => {
      formData.append(
        'files[]',
        file,
        file.name
      );
    });

    return formData;
  }


  buildSaveFormData(data: {
    idConversation: number;
    question: ConversationPlanResponse;
    reply: string;
    files: any[];
    iaResponse: IaResponse | null;
    table: ChatTable | null;
    iaImageUrl?: string | null;
    iaImageDescription?: string;
  }): FormData {

    const formData = new FormData();

    formData.append(
      'idConversation',
      String(data.idConversation ?? '')
    );

    formData.append(
      'idQuestion',
      String(data.question.question?.id ?? '')
    );

    formData.append(
      'reply',
      data.reply ?? ''
    );


    // =========================
    // ARCHIVOS
    // =========================

    formData.append(
      'metadata',
      JSON.stringify(
        data.files.map(item => ({
          description: item.description,
          fuente: item.fuente
        }))
      )
    );

    data.files.forEach(item => {

      formData.append(
        'files[]',
        item.file,
        item.file.name
      );

    });


    // =========================
    // REFERENCIAS IA
    // =========================

    formData.append(
      'references',
      JSON.stringify(
        data.iaResponse?.references ?? []
      )
    );


    // =========================
    // TABLA
    // =========================

    formData.append(
      'table',
      JSON.stringify(data.table)
    );


    // =========================
    // IMAGEN IA
    // =========================

    if (data.iaImageUrl) {

      formData.append(
        'url_imagen_ia',
        data.iaImageUrl
      );

      formData.append(
        'desc_imagen_ia',
        data.iaImageDescription ?? ''
      );
    }


    return formData;
  }
}
