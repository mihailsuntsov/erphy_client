// Сервис реализует интеграцию ККМ АТОЛ (платформа 5, драйвер 10.x) с Докио через Атол web-сервер
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';

@Injectable()
export class DelCookiesService{
        constructor(private http: HttpClient){ }

    delCookiesOnLogin(){
        Cookie.delete('anotherCashierFio');
        Cookie.delete('anotherCashierVatin');
    }


}