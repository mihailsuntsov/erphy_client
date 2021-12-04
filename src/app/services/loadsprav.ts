// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
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
                {id:28, name:'Возврат покупателя'},
                {id:29, name:'Возврат поставщику'},
                {id:33, name:'Входящий платеж'},
                {id:23, name:'Заказ покупателя'},
                {id:39, name:'Заказ поставщику'},
                {id:27, name:'Инвентаризация'},
                {id:34, name:'Исходящий платеж'},
                {id:12, name:'Контрагент'},
                {id:41, name:'Корректировка'},
                {id:16, name:'Оприходование'},
                {id:21, name:'Отгрузка'},
                {id:30, name:'Перемещение'},
                {id:15, name:'Приёмка'},
                {id:35, name:'Приходный ордер'},   
                {id:36, name:'Расходный ордер'},
                {id:25, name:'Розничная продажа'},
                {id:17, name:'Списание'},
                {id:31, name:'Счёт покупателю'},
                {id:32, name:'Счет поставщика'},
                {id:37, name:'Счет-фактура выданный'},
                {id:38, name:'Счет-фактура полученный'},
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