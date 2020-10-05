// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
export interface idAndName {
    id: number;
    name:string;
  }
  
@Injectable()
export class LoadSpravService{
    constructor(private http: HttpClient){ }
    

    getMyId(){return this.http.get('/api/auth/getMyId');} 

    getMyCompanyId(){return this.http.get('/api/auth/getMyCompanyId');} 
    
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
          
    //загружает деревья категорий продуктов
    getProductCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getProductCategoriesTrees', body);}

    //загрузка типов цен
    getPriceTypesList(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getPriceTypesList', body);}
        
    //формирование списка документов с id и названием (и то и другое - в таблице documents)
    getDocumentsList(){
            let dockList: idAndName [] = [];
            dockList = [
                // {id:3, name:'Предприятия'},
                {id:12, name:'Контрагенты'},
                {id:23, name:'Заказы покупателей'},
                {id:21, name:'Отгрузка'},
            ];
            return dockList; 
        }
    //загружается список статусов документа по его id (таблица documents) и id предприятия
    getStatusList(companyId: number, documentId:number){
        const body = {companyId: companyId, documentId: documentId};
        return this.http.post('/api/auth/getStatusList', body);}    

    getSpravSysPriceRole(){return this.http.post('http://localhost:8080/api/auth/getSpravSysPriceRole', '');}
    //загружает деревья категорий контрагентов
    getCagentCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getCagentCategoriesTrees', body);}
    getSpravSysOPF(){return this.http.post('/api/auth/getSpravSysOPF', '');}
}