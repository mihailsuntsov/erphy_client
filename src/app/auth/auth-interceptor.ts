import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { TokenStorageService } from './token-storage.service';
import {tap} from 'rxjs/operators';
import { Router } from '@angular/router';
// import { DelCookiesService } from '../services/del-cookies.service';

const TOKEN_HEADER_KEY = 'Authorization';

// Отправка запросов на сервер
// Добавление токена к заголовку запроса с помощью HttpInterceptor
// Мы используем Angular HttpInterceptor c методом intercept() для 
// инспекции и изменения НТТР запросов перед их отправкой на сервер.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private token: TokenStorageService,
        // private delCookiesService: DelCookiesService, 
        private router: Router /*, private Cookie: Cookie*/) {}

    //объект HTTPRequest будет просмотрен и перенаправлен к методу handle() объекта HttpHandler
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        
        let authReq = req;
        const token = this.token.getToken()?this.token.getToken():Cookie.get('dokio_token');
        //console.log("TOKEN - "+token);
        //console.log("TOKEN_COOKIE - "+Cookie.get('dokio_token'));
        if (token != null) {//если есть токен в запросе, он добавляется в заголовок
            // alert(token);
            // вызывается метод req.clone() для клонирования оригинального HTTP запроса. В методе мы меняем поле заголовка с помощью метода req.headers.set().
            authReq = req.clone({ 
                headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token)
                .set('Access-Control-Allow-Origin', '*')
            });
        }

        return next.handle(authReq).pipe( tap(() => {},
        (err: any) => {
            if (err instanceof HttpErrorResponse) {
                // console.log();
                if ((err.status == 401 && this.router.url!=='/' && this.getPort(err.url)!=16732)) { // the port is not belongs to one of POS-terminals servers
                    // alert('router.url - '+this.router.url)
                    this.logout(); 
                } else return;//затем запрос проталкивается далее, в HttpHandler.handle()
                
            }
        }));
        // return next.handle(authReq);
    }

    logout(){
        Cookie.set('dokio_token', '', -1, '/');
        this.delCookiesOnLogin();
        this.token.signOut();    
        window.location.reload();
        // this.router.navigate(['auth/login']);
    }

    delCookiesOnLogin(){
        Cookie.set('anotherCashierFio','undefined', -1, '/');
        Cookie.set('anotherCashierVatin','undefined', -1, '/');
        Cookie.set('dokio_token', '', -1, '/');
        Cookie.delete('anotherCashierFio');
        Cookie.delete('anotherCashierVatin');

        try{
          Cookie.deleteAll();          
          Cookie.deleteAll('/');
          Cookie.deleteAll('/','localhost');
        } catch (e){
          console.log(e.message);
        }
    }

    getPort(url) {
        url = url.match(/^(([a-z]+:)?(\/\/)?[^\/]+).*$/)[1] || url;
        var parts = url.split(':'),
            port = parseInt(parts[parts.length - 1], 10);
        if(parts[0] === 'http' && (isNaN(port) || parts.length < 3)) {
            return 80;
        }
        if(parts[0] === 'https' && (isNaN(port) || parts.length < 3)) {
            return 443;
        }
        if(parts.length === 1 || isNaN(port)) return 80;
        return port;
    }
}

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true, Cookie: Cookie }
];
