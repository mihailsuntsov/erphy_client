// Сервис для работы с таблицей предприятий (получение данных, пагинации, сортировка, поиск...)

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
//import {QueryForm} from './query-form';
  
@Injectable()
export class QueryFormService{
  
    constructor(private http: HttpClient){ }

//Здесь определен метод getTable, который получает для отправки объект QueryForm. 
//Сами отправляемые данные представляют объект body. 
//Для отправки применяется метод http.post(), в который передается адрес сервера и отправляемый объект.      
getList(groupId:any,field_type:any,parentSetId:any){
        const body = {  groupId: groupId, 
                        field_type: field_type, 
                        parentSetId: parentSetId}; 
        console.log("перед вызовом getProductGroupFieldsList");
        return this.http.post('/api/auth/getProductGroupFieldsList', body); 
    }


}



