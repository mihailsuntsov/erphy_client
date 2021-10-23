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
          
    getUsersListByDepartmentId(depId: number){
        const body = {id:depId};
        return this.http.post('/api/auth/getUsersListByDepartmentId', body);}   
    
    getMyId(){return this.http.get('/api/auth/getMyId');} 

    getSpravSysPriceRole(){return this.http.post('http://localhost:8080/api/auth/getSpravSysPriceRole', '');}

    getMyCompanyId(){return this.http.get('/api/auth/getMyCompanyId');} 
    
    //загружает деревья категорий продуктов
    getProductCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getProductCategoriesTrees', body);}
    
}