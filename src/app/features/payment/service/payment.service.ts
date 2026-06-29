import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { CouponValidationResponse } from 'src/app/core/models/Coupon';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiResponse } from '../../conversation/conversation/conversation.component';
import { ConversationsPaymentsResponse } from 'src/app/core/models/PaymentsResponse';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {

  url = URL_SERVICIOS +"/payment";

  constructor( private http: HttpClient, public authService: AuthService) { }

  validateCoupon(code: string, planId: number) {
        let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
        return this.http.post<CouponValidationResponse>(
            this.url + `/validate`,
             {
              code,
              plan_id: planId
            },
            {headers}
        );
  }

  registerYapePayment(data: FormData) {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.token
    });

    return this.http.post(
      this.url + '/yape',
      data,
      { headers }
    );
  }

  getPayments(){

    let URL = this.url + "/getpayments";
    console.log("TOKEN get progres: " + this.authService.token )
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
    return this.http.get<ConversationsPaymentsResponse>( URL  ,
      {   headers
      });

  }
  
}
