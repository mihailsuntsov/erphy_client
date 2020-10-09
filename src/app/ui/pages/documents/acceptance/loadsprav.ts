// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
@Injectable()
export class LoadSpravService{
    constructor(private http: HttpClient){ }
    
    getCompaniesList(){return this.http.post('/api/auth/getCompaniesList', '');}

    getMyDepartmentsListByCompanyId(companyId: number, has_parent: boolean){
        const body = {   
            has_parent:has_parent,
            companyId: companyId  };
        return this.http.post('/api/auth/getMyDepartmentsListByCompanyId', body);}

    getDepartmentsListByCompanyId(companyId: number, has_parent: boolean){
        const body = {   
            has_parent:has_parent,
            companyId: companyId  };
        return this.http.post('/api/auth/getDepartmentsListByCompanyId', body);} 

    getMyCompanyId(){return this.http.get('/api/auth/getMyCompanyId');} 
    
    getMyId(){return this.http.get('/api/auth/getMyId');}
    
}