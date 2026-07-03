import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';
import { AnswerValidationResponse } from 'src/app/core/models/ValidarRespuestaResponse';
import { PaymentResponse } from 'src/app/core/models/PaymentResponse';
import { Observable } from 'rxjs';
import { IaResponse } from 'src/app/core/models/IAResponse';

@Injectable({
  providedIn: 'root',
})
export class PlanService {

  url = URL_SERVICIOS +"/plans";

  constructor( private http: HttpClient, public authService: AuthService) { }

    getPlanId( idPlan: number ){
  
        console.log("TOKEN get progres: " + this.authService.token )
        let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
        return this.http.get( this.url + "/getplanid" ,
            {   headers,
                params: { idPlan: idPlan } 
            });

    }

    getPackagePlans( idPackage: number ){
  
        console.log("TOKEN get progres: " + this.authService.token )
        let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
        return this.http.get( URL_SERVICIOS + "/getpackageplans"     ,
            {   headers,
                params: { idPackage: idPackage } 
            });

    }

    createPayment(paymentData: any): Observable<PaymentResponse> {
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        return this.http.post<PaymentResponse>(
            URL_SERVICIOS + `/payment`,
            paymentData,
            {headers}
        );
    }

    guardarRespuestas( data: any ){
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        let URL = URL_SERVICIOS+"/conversation/savereply";
        return this.http.post(URL,data,{headers: headers});
    }

}