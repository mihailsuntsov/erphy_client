// Сервис для работы с таблицей документов (получение данных, пагинации, сортировка, поиск...)

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
          const body = {  searchString: queryForm.searchString, 
                          sortColumn:queryForm.sortColumn, 
                          offset:queryForm.offset, 
                          sortAsc:queryForm.sortAsc, 
                          result:queryForm.result,
                          companyId: queryForm.companyId,
                          departmentId: queryForm.departmentId,
                          shift_id: queryForm.shift_id,
                          kassaId: queryForm.kassaId,
                          cashierId: queryForm.cashierId,
                          filterOptionsIds: queryForm.filterOptionsIds};
          return this.http.post('/api/auth/getReceiptsTable', body); 
  }

  getPagesList(queryForm: QueryForm){
              const body = {  searchString: queryForm.searchString, 
                              sortColumn:queryForm.sortColumn, 
                              offset:queryForm.offset, 
                              sortAsc:queryForm.sortAsc, 
                              result:queryForm.result,
                              companyId: queryForm.companyId,
                              shift_id:queryForm.shift_id,
                              departmentId: queryForm.departmentId,
                              kassaId: queryForm.kassaId,
                              cashierId: queryForm.cashierId,
                              filterOptionsIds: queryForm.filterOptionsIds
                            };
              return this.http.post('/api/auth/getReceiptsPagesList', body); 
  }


}



