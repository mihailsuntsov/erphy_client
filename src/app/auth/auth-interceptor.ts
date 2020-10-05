import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { TokenStorageService } from './token-storage.service';

const TOKEN_HEADER_KEY = 'Authorization';

// Отправка запросов на сервер
// Добавление токена к заголовку запроса с помощью HttpInterceptor
// Мы используем Angular HttpInterceptor c методом intercept() для 
// инспекции и изменения НТТР запросов перед их отправкой на сервер.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private token: TokenStorageService, /*private Cookie: Cookie*/) {}

    //объект HTTPRequest будет просмотрен и перенаправлен к методу handle() объекта HttpHandler
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        
        let authReq = req;
        const token = this.token.getToken()?this.token.getToken():Cookie.get('dokio_token');
        //console.log("TOKEN - "+token);
        //console.log("TOKEN_COOKIE - "+Cookie.get('dokio_token'));
        if (token != null) {//если есть токен в запросе, он добавляется в заголовок
            // вызывается метод req.clone() для клонирования оригинального HTTP запроса. В методе мы меняем поле заголовка с помощью метода req.headers.set().
            authReq = req.clone({ 
                headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token)
                .set('Access-Control-Allow-Origin', '*')
            });
        }
        return next.handle(authReq);//затем запрос проталкивается далее, в HttpHandler.handle()
    }
}

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true, Cookie: Cookie }
];
