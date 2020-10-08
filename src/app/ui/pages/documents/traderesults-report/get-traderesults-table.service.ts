// Сервис для работы с таблицей предприятий (получение данных, пагинации, сортировка, поиск...)

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {QueryForm} from './query-form';
  
@Injectable()
export class QueryFormService{
  
    constructor(private http: HttpClient){ }

//Здесь определен метод getTable, который получает для отправки объект QueryForm. 
//Сами отправляемые данные представляют объект body. 
//Для отправки применяется метод http.post(), в который передается адрес сервера и отправляемый объект.      
getTable(queryForm: QueryForm){
        const body = {  companyId: queryForm.companyId,
                        departmentId:queryForm.departmentId,
                        employeeId: queryForm.employeeId,
                        dateFrom: queryForm.dateFrom,
                        dateTo: queryForm.dateTo
                       };

        return this.http.post('/api/auth/getTradeResultsTableReport', body); 
    }


}



