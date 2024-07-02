// Сервис реализует интеграцию ККМ АТОЛ (платформа 5, драйвер 10.x) с Докио через Атол web-сервер
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Cookie } from 'ng2-cookies/ng2-cookies';

@Injectable()
export class DelCookiesService{
    
  temp_language:string;

    constructor(private http: HttpClient){ }

    delCookiesOnLogin(){
        Cookie.set('anotherCashierFio','undefined', -1, '/');
        Cookie.set('anotherCashierVatin','undefined', -1, '/');
        Cookie.set('dokio_token', '', -1, '/');

        Cookie.delete('anotherCashierFio');
        Cookie.delete('anotherCashierVatin');

        this.temp_language=Cookie.get('language');
        
        try{
          Cookie.deleteAll();
          Cookie.deleteAll('/');
        } catch (e){
          console.log(e.message);
        } finally {
          Cookie.set('language', this.temp_language);
        }
        
    }


}