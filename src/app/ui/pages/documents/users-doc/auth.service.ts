// HTTP-запросы (attemptAuth/signup) отправляются с помощью Angular HttpClient
// Поля AuthLoginInfo и SignUpInfo проверяются с помощью Angular template-driven Form

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SignUpInfo } from './signup-info';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private signupUrl = '/api/auth/signup';

  //HTTP-запросы (signin/signup) отправляются с помощью Angular HttpClient
  constructor(private http: HttpClient) {
  }

  signUp(info: SignUpInfo): Observable<string> {
    return this.http.post<string>(this.signupUrl, info, httpOptions);
  }
}
