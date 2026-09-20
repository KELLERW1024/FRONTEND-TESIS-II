import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';

import { PackageResponse } from '../core/models/PackageResponse';


@Injectable({
  providedIn: 'root',
})
export class DashboardService {


  constructor( private http: HttpClient, public authService: AuthService) { }

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


  getPlans(){

      let URL = URL_SERVICIOS + "/plans";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get( URL  ,
        {   headers
        });

  }

  getPackages(){

      let URL = URL_SERVICIOS + "/packages";
      console.log("TOKEN get progres: " + this.authService.token )
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.get<PackageResponse>( URL  ,
        {   headers
        });
  }

  createPackage(data: any) {

      let URL = URL_SERVICIOS + "/packages";
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.post( URL, 
        data, 
        {   headers 
        });

  }

  updatePackage(id: number, data: any) {

      let URL = URL_SERVICIOS + "/packages/" + id;
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.token});
      return this.http.patch( URL, 
        data, 
        {   headers 
        });
  }

  syncPackagePlans(packageId: number, planIds: number[]) {
    let URL = URL_SERVICIOS + `/packages/${packageId}/plans`;
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
    return this.http.post(URL, { plans: planIds }, { headers });
  }

  getPackagePlans(idPackage: number) {
  let URL = URL_SERVICIOS + "/getpackageplans?idPackage=" + idPackage;
  let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.token });
  return this.http.get(URL, { headers });
}
}
