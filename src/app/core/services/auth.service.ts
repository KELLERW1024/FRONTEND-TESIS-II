import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { BehaviorSubject, catchError, map, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  url = URL_SERVICIOS;
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();

  

  private emailRecovery: string = '';

  constructor( private http: HttpClient ) { }

  get token(): string | null {
    return localStorage.getItem('token');
  }
  /*getLocalStorage(){
    this.token = localStorage.getItem("token");
    console.log("TOKEN getLocal: " + this.token)
    if(localStorage.getItem("token") && localStorage.getItem("user")){
      let USER = localStorage.getItem("user");
      //this.user = JSON.parse(USER ? USER : '');
      this.token = localStorage.getItem("token");

    }else{
      //this.user = null;
      this.token = null;
    }
  }*/

  setLoggedIn(status: boolean) {
    this.loggedIn.next(status);
  }

  setRecoveryEmail(email: string) {
    this.emailRecovery = email;
  }

  getRecoveryEmail() {
    return this.emailRecovery;
  }

  login(data:any){
    // this.url 
    return this.http.post(this.url +"/auth/login",{email: data.email,password: data.password}).pipe(
      map((auth:any) => {
        console.log(auth);
        this.saveTokenLocalStorage(auth);
        //this.getLocalStorage();
        return auth;
      }),
      catchError((error:any) => {
        console.log(error);
        return throwError(() => error);
      })
    );
  }

  register(data:any){
    // this.url 
    return this.http.post(this.url +"/auth/register",{
      name: data.name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      role_id: data.role_id
    }).pipe(
      map((res:any) => {
        console.log('Usuario registrado:', res);
        return res;
      }),
      catchError((error:any) => {
        console.log( 'Error en registro:', error );
        return throwError(() => error);
      })
    );
  }

  saveTokenLocalStorage(auth:any){
    if(auth && auth.access_token){
      localStorage.setItem("token",auth.access_token);
      localStorage.setItem("user",JSON.stringify(auth.user));
      localStorage.setItem('authenticated', 'true');
      return true;
    }
    return false;
  }

  forgotPassword( email: string){
    
    return this.http.post(this.url +"/auth/forgot-password-code",{ email }).pipe(
      map((auth:any) => {
        console.log(auth);
        //const result = this.saveTokenLocalStorage(auth);
        return auth;
      }),
      catchError((error:any) => {
        console.log(error);
        return of(undefined);
      })
    );
  }

  verifyCode( email: string , code: string){
      return this.http.post(this.url +"/auth/verify-code",{ email , code}).pipe(
        map((auth:any) => {
          console.log(auth);
          //const result = this.saveTokenLocalStorage(auth);
          return auth;
        }),
        catchError((error:any) => {
          console.log(error);
           return throwError(() => error);
        })
      );
  }

  changePassword( email: string , password: string,  code: string){
      return this.http.post(this.url +"/auth/reset-password-code",{ email , password, code}).pipe(
        map((auth:any) => {
          console.log(auth);
          //const result = this.saveTokenLocalStorage(auth);
          return auth;
        }),
        catchError((error:any) => {
          console.log(error);
          return of(undefined);
        })
      );
  }

}
