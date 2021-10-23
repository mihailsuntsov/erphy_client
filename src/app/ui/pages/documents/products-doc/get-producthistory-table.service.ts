// Сервис для работы с таблицей предприятий (получение данных, пагинации, сортировка, поиск...)

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { ProductHistoryQuery } from './product-history-form';
  
@Injectable()
export class ProductHistoryService{
  
constructor(private http: HttpClient){ }
    
getTable(queryForm: ProductHistoryQuery){
        const body = {  companyId: queryForm.companyId,
                        departmentId:queryForm.departmentId,
                        productId:queryForm.productId,
                        dateFrom: queryForm.dateFrom,
                        dateTo: queryForm.dateTo,
                        sortColumn: queryForm.sortColumn,
                        offset: queryForm.offset,
                        sortAsc: queryForm.sortAsc,
                        result: queryForm.result,
                        docTypesIds:queryForm.docTypesIds
                       };

        return this.http.post('/api/auth/getProductHistoryTableReport', body); 
    }


}
