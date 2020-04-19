
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GetPageForm } from './query-forms/get-page.form';
  
@Injectable()
export class PagesService{
  
    constructor(private http: HttpClient){ }

    getHtmlPage(getPageForm: GetPageForm){
        return this.http.get('/api/public/getHtmlPage?domain='+getPageForm.domain+'&uid='+getPageForm.uid+'&route_id='+getPageForm.route_id+'&parameter='+getPageForm.parameter,{responseType: 'text'}); 
    }


}