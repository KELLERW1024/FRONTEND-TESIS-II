import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiResponse } from '../conversation/conversation.component';
import { AnswerValidationResponse } from 'src/app/core/models/ValidarRespuestaResponse';
import { Observable } from 'rxjs';
import { ChatResponse, IaResponse } from 'src/app/core/models/IAResponse';
import { ConversationPlanResponse } from 'src/app/core/models/ConversationPlanResponse';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {

  url = URL_SERVICIOS +"/conversation";

  constructor( private http: HttpClient, public authService: AuthService) { }

    obtienerDataPlan(idPlan : number ){
      // this.url 
      //console.log("TOKEN: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/obtenercapitulosplan" ,
        {   headers,
            params: { idPlan: idPlan } 
        });
    }

    getVerficationDiagnosticExist( idConversation : number ){
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/verficationdiagnosticexist" ,
        {   headers,
            params: { idConversation: idConversation} 
        });
    }

    getQuestionsDiagnostic( idConversation : number ){
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/diagnosticplan" ,
        {   headers,
            params: { idConversation: idConversation} 
        });
    }

    startConversation( idPlan : number){
        let headers = new HttpHeaders({
            'Authorization': 'Bearer ' + this.authService.token
        });

        let URL = URL_SERVICIOS + "/conversation/startconversation";

        return this.http.post(URL, 
            { plan_id: idPlan }, 
            { headers: headers }
        );
    }
    
    enviarContextoRespuestas( data: any ){
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        let URL = URL_SERVICIOS+"/conversation/validateAnswerResponse";
        return this.http.post<ChatResponse>(URL,data,{headers: headers});
    }

    validateAnswer(data: FormData): Observable<AnswerValidationResponse> {

      const headers = new HttpHeaders({
        Authorization: 'Bearer ' + this.authService.token
      });

      const URL = URL_SERVICIOS + "/conversation/validateanswer";

      return this.http.post<AnswerValidationResponse>(
        URL,
        data,
        { headers }
      );
    }

    guardarRespuestas( data: any ){
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        let URL = URL_SERVICIOS+"/conversation/savereply";
        return this.http.post(URL,data,{headers: headers});
    }

    saveAnswerDiagnostic( data: any ){
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        let URL = URL_SERVICIOS+"/conversation/saveanswerdiagnostic";
        return this.http.post(URL,data,{headers: headers});
    }

  assistantChat(payload: {
    idConversation: number;
    idQuestion: number;
    messages: { role: string; content: string }[];
    user_message?: string;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.token
    });
    return this.http.post(`${this.url}/assistant-chat`, payload, { headers });
  }

    getDocument(idConversation: number ){

      let URL = URL_SERVICIOS + "/download";
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( URL  ,
        {   headers,
            params: { idConversation: idConversation } ,
            responseType: 'blob'
        });
    }

    getSuscriptions(){

      let URL = URL_SERVICIOS + "/conversation/conversationsUser";
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<ApiResponse>( URL  ,
        {   headers
        });
    }

    getDataConversation(idConversation: number, triggerAi: boolean = false){
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<ConversationPlanResponse>( this.url + "/conversationPlan" ,
        {   headers,
            params: {
               idConversation: idConversation,
               trigger_ai: triggerAi ? 1 : 0 
            }
        }); 
    }

    getConversationPlanUser(idConversation: number ){
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/conversationplanuser" ,
        {   headers,
            params: { idConversation: idConversation } 
        });
     
    }

    getViewConversationPlanUser(idConversation: number ){
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/viewconversationplanuser" ,
        {   headers,
            params: { idConversation: idConversation } 
        });
    }

    updateTitleConversation( data: any ){
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        let URL = URL_SERVICIOS+"/conversation/updatetitleconversation";
        return this.http.post(URL,data,{headers: headers});
    }

    getReplicatePrediction(idPrediction: string ){
      // this.url 
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
     const url = `${this.url}/replicate/prediction/${idPrediction}`;

      console.log('this.url:', this.url);
      console.log('idPrediction:', idPrediction);
      console.log('URL FINAL:', url);

      return this.http.get(url, { headers });
     
    }
    
    // Borra la respuesta de la pregunta anterior y la vuelve la actual (no hay vuelta atrás).
    // idQuestion es la pregunta que ve el usuario: si ya no es la actual, el backend lo rechaza.
    goBack(idConversation: number, idQuestion: number): Observable<any> {
      const headers = new HttpHeaders({
        'Authorization': 'Bearer ' + this.authService.token
      });
      return this.http.post(`${this.url}/go-back`, {
        idConversation,
        idQuestion
      }, { headers });
    }

    // ============================================================
    // ANEXOS DEL PLAN (imágenes o Excel al final del documento)
    // ============================================================

    getAnnexes(idConversation: number): Observable<any> {
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
      return this.http.get(`${this.url}/annexes`, { headers, params: { idConversation } });
    }

    // data: FormData con idConversation, title, source y file
    addAnnex(data: FormData): Observable<any> {
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
      return this.http.post(`${this.url}/annexes`, data, { headers });
    }

    // Sube o baja el anexo una posición
    moveAnnex(id: number, direction: 'up' | 'down'): Observable<any> {
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
      return this.http.patch(`${this.url}/annexes/${id}/move`, { direction }, { headers });
    }

    deleteAnnex(id: number): Observable<any> {
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
      return this.http.delete(`${this.url}/annexes/${id}`, { headers });
    }

    // Borra las respuestas de la Fase 1 desde ese punto en adelante: una pregunta
    // o un nodo (capítulo, sección o subsección)
    deleteChaptersAnswers(
      idConversation: number,
      start: { startNodeId?: number; startQuestionId?: number }
    ): Observable<any> {
      const headers = new HttpHeaders({
        'Authorization': 'Bearer ' + this.authService.token
      });
      return this.http.post(`${this.url}/delete-chapters-answers`, {
        idConversation,
        ...start
      }, { headers });
    }
}
