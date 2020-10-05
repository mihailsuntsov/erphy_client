// HTTP-запросы (attemptAuth/signup) отправляются с помощью Angular HttpClient
// Поля AuthLoginInfo и SignUpInfo проверяются с помощью Angular template-driven Form

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { JwtResponse } from './jwt-response';
import { AuthLoginInfo } from './login-info';
import { SignUpInfo } from './signup-info';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = '/api/public/signin';
  private signupUrl = '/api/public/signup';

  //HTTP-запросы (signin/signup) отправляются с помощью Angular HttpClient
  constructor(private http: HttpClient) {
  }
//Поля AuthLoginInfo и SignUpInfo проверяются с помощью Angular template-driven Form
  attemptAuth(credentials: AuthLoginInfo): Observable<JwtResponse> {
    
    return this.http.post<JwtResponse>(this.loginUrl, credentials, httpOptions);
  }

  signUp(info: SignUpInfo): Observable<string> {
    return this.http.post<string>(this.signupUrl, info, httpOptions);
  }
}3
