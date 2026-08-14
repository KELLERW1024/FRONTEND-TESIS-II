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

    updateNode(id: number, data: any): Observable<any> {

  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.authService.token
  });

  return this.http.patch<any>(
    `${this.url}/${id}`,
    data,
    { headers }
  );
}


deleteNode(id: number): Observable<any> {

  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.authService.token
  });

  return this.http.delete<any>(
    `${this.url}/${id}`,
    { headers }
  );
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
