// Сервис для работы с таблицей предприятий (получение данных, пагинации, сортировка, поиск...)

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {QueryForm} from './query-form';
  
@Injectable()
export class QueryFormService{
  
    constructor(private http: HttpClient){ }
   
getTable(queryForm: QueryForm){
        const body = {  searchString: queryForm.searchString, 
                        sortColumn:queryForm.sortColumn, 
                        offset:queryForm.offset, 
                        sortAsc:queryForm.sortAsc, 
                        result:queryForm.result,
                        companyId: queryForm.companyId,
                        categoryId: queryForm.selectedNodeId};
                        console.log("перед вызовом getProductsTable");
        return this.http.post('/api/auth/getProductsTable', body); 
    }

getPagesList(queryForm: QueryForm){
            const body = {  searchString: queryForm.searchString, 
                            sortColumn:queryForm.sortColumn, 
                            offset:queryForm.offset, 
                            sortAsc:queryForm.sortAsc, 
                            result:queryForm.result,
                            companyId: queryForm.companyId,
                            categoryId: queryForm.selectedNodeId
                          };
            return this.http.post('/api/auth/getProductsPagesList', body); 
        }


}



