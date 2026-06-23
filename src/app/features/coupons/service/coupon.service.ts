import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CouponService {

  url = URL_SERVICIOS +"/conversation";

  constructor( private http: HttpClient, public authService: AuthService) { }

  saveCoupon( data: any ){
      let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authService.token});
      let URL = URL_SERVICIOS+"/coupon/savecoupon";
      return this.http.post(URL,data,{headers: headers});
  }


   getCoupons(){

      let URL = URL_SERVICIOS + "/coupons";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( URL  ,
        {   headers
        });

    }
  
}
