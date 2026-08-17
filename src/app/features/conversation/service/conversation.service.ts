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
      console.log("TOKEN: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/obtenercapitulosplan" ,
        {   headers,
            params: { idPlan: idPlan } 
        });
      /*return this.http.get(this.url +"/section/obtenercapitulosplan",{ params: { idPlan: idPlan } }).pipe(
        map((auth:any) => {
          console.log(auth);
          //this.saveTokenLocalStorage(auth);
          return auth;
        }),
        catchError((error:any) => {
          console.log(error);
          return throwError(() => error);
        })
      );*/
    }

    getVerficationDiagnosticExist( idConversation : number ){
      console.log("TOKEN: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/verficationdiagnosticexist" ,
        {   headers,
            params: { idConversation: idConversation} 
        });
    }

    getQuestionsDiagnostic( idConversation : number ){
      console.log("TOKEN: " + this.authService.token )
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

    /*getProgress(idConversation: number ){

      let URL = URL_SERVICIOS + "/conversation/conversationprogress";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<ProgressResponse>( URL  ,
        {   headers,
            params: { idConversation: idConversation } 
        });

    }*/

    getDocument(idConversation: number ){

      let URL = URL_SERVICIOS + "/download";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( URL  ,
        {   headers,
            params: { idConversation: idConversation } ,
            responseType: 'blob'
        });

    }

    getSuscriptions(){

      let URL = URL_SERVICIOS + "/conversation/conversationsUser";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<ApiResponse>( URL  ,
        {   headers
        });

    }

    getDataConversation(idConversation: number ){
      // this.url 
      console.log("TOKEN: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<ConversationPlanResponse>( this.url + "/conversationPlan" ,
        {   headers,
            params: { idConversation: idConversation } 
        });
     
    }

    getConversationPlanUser(idConversation: number ){
      // this.url 
      console.log("TOKEN: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( this.url + "/conversationplanuser" ,
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

    

  
}
