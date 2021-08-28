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
    
// id пользователя в системе
    getMyId(){return this.http.get('/api/auth/getMyId');} 
// id предприятия пользователя в системе (у Мастер-пользователя это будет предприятие, которое создалось при регистрации аккаунта)
    getMyCompanyId(){return this.http.get('/api/auth/getMyCompanyId');} 
// список предприятий мастер-аккаунта    
    getCompaniesList(){return this.http.post('/api/auth/getCompaniesList', '');}
// список отделений предприятия, к которым приписан пользователь
    getMyDepartmentsListByCompanyId(companyId: number, has_parent: boolean){
        const body = {   
            has_parent:has_parent,
            companyId: companyId  };
        return this.http.post('/api/auth/getMyDepartmentsListByCompanyId', body);}
// список всех отделений предприятия мастер-аккаунта
    getDepartmentsListByCompanyId(companyId: number, has_parent: boolean){
        const body = {   
            has_parent:has_parent,
            companyId: companyId  };
        return this.http.post('/api/auth/getDepartmentsListByCompanyId', body);}

    getUsersListByDepartmentId(depId: number){
        const body = {id:depId};
        return this.http.post('/api/auth/getUsersListByDepartmentId', body);}     
          
    //отдает сотрудников (пользователей) по id отделения
    getEmployeeListByDepartmentId(id:number){return this.http.get('/api/auth/getEmployeeListByDepartmentId?id='+id);}

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
                {id:28, name:'Возврат покупателя'},
                {id:23, name:'Заказ покупателя'},
                {id:27, name:'Инвентаризация'},
                {id:12, name:'Контрагент'},
                {id:21, name:'Отгрузка'},
                {id:25, name:'Розничная продажа'},
            ];
            return dockList; 
        }
    //загружается список статусов документа по его id (таблица documents) и id предприятия
    getStatusList(companyId: number, documentId:number){
        const body = {companyId: companyId, documentId: documentId};
        return this.http.post('/api/auth/getStatusList', body);}    
    // загрузка роли цены. Устарело.    
    getSpravSysPriceRole(){return this.http.post('/api/auth/getSpravSysPriceRole', '');}
    //загружает деревья категорий контрагентов
    getCagentCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getCagentCategoriesTrees', body);}
    //организационно-правовые формы    
    getSpravSysOPF(){return this.http.post('/api/auth/getSpravSysOPF', '');}
    // НДС
    getSpravSysNds(){return this.http.get('/api/auth/getSpravSysNds');}
    // Типы чеков
    getSpravSysChequeTypes(){return this.http.get('/api/auth/getSpravSysChequeTypes');}
    // Налогообложения виды
    getSpravSysTaxationTypes(){return this.http.get('/api/auth/getSpravSysTaxationTypes');}
    // Типы оплаты (нал/безнал и т.д.)
    getSpravSysPaymentMethods(){return this.http.get('/api/auth/getSpravSysPaymentMethods');}
    // признак предмета расчета (товар, услуга и т.п.)
    getSpravSysPPR(){return this.http.get('/api/auth/getSpravSysPPR', )}
    // загрузить информацию о текущем пользователе
    getMyShortInfo(){return this.http.get('/api/auth/getMyShortInfo', )}
    // (boolean) Может ли пользователь работать с ККМ предприятия? Должны совпадать логин и пароль, пользователь должен иметь статус "Активен" и принадлежать тому же предприятию логина, из под которого идет запрос
    isUserCanWorkWithKKM(username:string,password:string){return this.http.get('/api/auth/isUserCanWorkWithKKM?username='+username+'&password='+password)}
    // (String) загрузить Инфо юзера по логину. Нужно для имени кассира, пока грузится только имя
    getUserByLoginInfo(username:string,password:string){return this.http.get('/api/auth/getUserByLoginInfo?username='+username+'&password='+password)}
    // Налогообложения виды
    getProductPrices(productId:number){return this.http.get('/api/auth/getProductPrices?productId='+productId);}

}