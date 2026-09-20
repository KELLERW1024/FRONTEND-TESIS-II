import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserResponse } from 'src/app/core/models/UserResponse';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  private url = URL_SERVICIOS + '/users';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.token,
      'Accept': 'application/json'
    });
  }

  getUsers(): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.url, { headers: this.getHeaders() });
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(this.url, userData, { headers: this.getHeaders() });
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.patch(`${this.url}/${id}`, userData, { headers: this.getHeaders() });
  }

  updateUserStatus(id: number, isActive: boolean): Observable<any> {
  return this.http.patch(`${this.url}/${id}`, { is_active: isActive }, { headers: this.getHeaders() });
  } 
}