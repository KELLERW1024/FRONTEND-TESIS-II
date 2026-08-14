import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiResponse } from '../conversation/conversation.component';
import { AnswerValidationResponse } from 'src/app/core/models/ValidarRespuestaResponse';
import { Observable } from 'rxjs';
import { ChatResponse, IaResponse } from 'src/app/core/models/IAResponse';

@Injectable({
  providedIn: 'root',
})
export class StructureService {

  url = URL_SERVICIOS +"/structure";

  constructor( private http: HttpClient, public authService: AuthService) { }

  
  /**
   * Crear un nuevo nodo
   */
  createNode(data: any): Observable<any> {

    console.log("TOKEN: " + this.authService.token )
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});

    return this.http.post<any>(
      this.url,
      data,
      {headers: headers}
    );

  }

  moveNode(
      id: number,
      parentId: number | null,
      orden: number
    ): Observable<any> {

        const headers = new HttpHeaders({
          'Authorization': 'Bearer ' + this.authService.token
        });

      return this.http.patch<any>(
        `${this.url}/${id}/position`,
        {
          parent_id: parentId,
          orden: orden
        },
        {
          headers
        }
      );
    }

    

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
      return this.http.get( this.url + "/conversationPlan" ,
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
    

  
}
