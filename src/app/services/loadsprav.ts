// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
export interface idAndName {
    id: any;
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
          
    getUserGroupListByCompanyId(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getUserGroupListByCompanyId', body);}
        
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
            let docList: idAndName [] = [];
            docList = [
                // {id:3, name:'Предприятия'},
                {id:28, name:'.docs.return'},
                {id:29, name:'.docs.returnsup'},
                {id:33, name:'.docs.paymentin'},
                {id:23, name:'.docs.c_order'},
                {id:39, name:'.docs.ordersup'},
                {id:27, name:'.docs.inventory'},
                {id:34, name:'.docs.paymentout'},
                {id:12, name:'.docs.cparty'},
                {id:41, name:'.docs.correction'},
                {id:16, name:'.docs.posting'},
                {id:21, name:'.docs.shipment'},
                {id:30, name:'.docs.moving'},
                {id:15, name:'.docs.acceptance'},
                {id:35, name:'.docs.orderin'},   
                {id:36, name:'.docs.orderout'},
                {id:25, name:'.docs.retailsale'},
                {id:17, name:'.docs.writeoff'},
                {id:31, name:'.docs.invoiceout'},
                {id:32, name:'.docs.invoicein'},
                {id:37, name:'.docs.v_invoiceout'},
                {id:38, name:'.docs.v_invoicein'},
            ];
            return docList; 
        }
    //формирование списка расходов с id и названием
    getExpenditureList(){
        let docList: idAndName [] = [];
        docList = [
            {id:'return', name:'Возврат'},
            {id:'purchases', name:'Закупки'},
            {id:'taxes', name:'Налоги и сборы'},
            {id:'moving', name:'Внутреннее пермещение'},
            {id:'other_opex', name:'Другие операционные расходы'},
        ];
        return docList; 
    }    
    //формирование списка коррекций с id и названием
    getCorrectionTypesList(){
        let docList: idAndName [] = [];
        docList = [
            {id:'boxoffice', name:'Касса предприятия'},
            {id:'account', name:'Расчётный счёт'},
            {id:'cagent', name:'Баланс контрагента'},
        ];
        return docList; 
    }    
    //формирование списка типов перемещений: на кассу - boxoffice, на счёт - account, kassa - касса ККМ
    getMovingTypeList(){
        let docList: any [] = [];
        docList = [
            {id:'boxoffice', name_from:'Из кассы предприятия', name_to:'В кассу предприятия'},
            {id:'account', name_from:'С расчётного счёта', name_to:'На расчётный счёт'},
            {id:'kassa', name_from:'Из кассы ККМ', name_to:'В Кассу ККМ'},
        ];
        return docList;  
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
    // НДС или другие налоги
    getSpravTaxes(companyId:number){return this.http.get('/api/auth/getTaxesList?company_id='+companyId);}
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
    //загружает деревья категорий для файлов
    getFileCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getFileCategoriesTrees', body);}
    // загружает картинку
    getImage(imageUrl: string): Observable<Blob> {return this.http.get(imageUrl, { responseType: 'blob' });
      }
        
}