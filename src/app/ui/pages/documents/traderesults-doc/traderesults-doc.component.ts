import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

import { MomentDateAdapter} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

interface docResponse {//интерфейс для получения ответа в методе getUserValuesById
  id: number;
  company: string;
  company_id: string;
  department: string;
  department_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  changer:string;
  changer_id: string;
  employee:string;
  employee_id: string;
  trade_date: string;
  date_time_changed: string;
  date_time_created: string;
  incoming_cash_checkout: string;
  incoming_cashless_checkout: string;
  incoming_cash2: string;
  incoming_cashless2: string;
  refund_cash: string;
  refund_cashless: string;
  encashment_cash: string;
  encashment_cashless: string;
  additional: string;
  }

  interface isIt_Doc_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
    itIsMyDocument:boolean;
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyDepartments:boolean;
  }

@Component({
  selector: 'app-traderesults-doc',
  templateUrl: './traderesults-doc.component.html',
  styleUrls: ['./traderesults-doc.component.css'],
  providers: [LoadSpravService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class TraderesultsDocComponent implements OnInit {

  id: number;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отделений
  receivedUsersList  : any [];//массив для получения списка пользователей
  defaultId:number=0;//для подстановки дефолтных значений выпадающих списков

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyDepartments:boolean = false;
  itIsMyDocument:boolean = false;
  canUpdateThisDoc:boolean = false;

  constructor( private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    public MessageDialog: MatDialog,
    private _snackBar: MatSnackBar) 
    {
      console.log(this.activateRoute);
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0 
    }


  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      department_id: new UntypedFormControl      ('',[Validators.required]),
      employee_id: new UntypedFormControl      ('',[Validators.required]),
      company: new UntypedFormControl      ('',[]),
      department: new UntypedFormControl      ('',[]),
      employee: new UntypedFormControl      ('',[]),
      trade_date: new UntypedFormControl      ('',[]),
      incoming_cash_checkout: new UntypedFormControl      ('',[]),
      incoming_cashless_checkout: new UntypedFormControl      ('',[]),
      incoming_cash2: new UntypedFormControl      ('',[]),
      incoming_cashless2: new UntypedFormControl      ('',[]),
      refund_cash: new UntypedFormControl      ('',[]),
      refund_cashless: new UntypedFormControl      ('',[]),
      encashment_cash: new UntypedFormControl      ('',[]),
      encashment_cashless: new UntypedFormControl      ('',[]),
      additional: new UntypedFormControl      ('',[]),
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl      ('',[]),
      master: new UntypedFormControl      ('',[]),
      creator: new UntypedFormControl      ('',[]),
      changer: new UntypedFormControl      ('',[]),
      company: new UntypedFormControl      ('',[]),
      date_time_created: new UntypedFormControl      ('',[]),
      date_time_changed: new UntypedFormControl      ('',[]),
    });
   // this.checkedList = [];
   
    this.getSetOfPermissions();
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=7')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            // console.log("permissions:"+this.permissionsSet);
                            if(+this.id>0) this.IsItMy_DocCheckings(+this.id); else this.getCRUD_rights(this.permissionsSet);
                            //this.getCRUD_rights(this.permissionsSet);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }
  IsItMy_DocCheckings(id:number){// проверки на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
    const body = {"documentId": id};//
          return this.http.post('/api/auth/getIsItMy_TradeResults_JSON', body) 
            .subscribe(
                (data) => {   let isItMy_Doc: isIt_Doc_Response=data as any;  
                  this.itIsDocumentOfMyCompany = isItMy_Doc.itIsDocumentOfMyCompany;
                  this.itIsDocumentOfMyDepartments = isItMy_Doc.itIsDocumentOfMyDepartments;
                  this.itIsMyDocument = isItMy_Doc.itIsMyDocument;
                            this.getCRUD_rights(this.permissionsSet);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }
  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
    this.allowToUpdateAllCompanies = permissionsSet.some(this.isAllowToUpdateAllCompanies);
    this.allowToUpdateMyCompany = permissionsSet.some(this.isAllowToUpdateMyCompany);
    this.allowToUpdateMyDepartments = permissionsSet.some(this.isAllowToUpdateMyDepartments);
    this.allowToUpdateMy = permissionsSet.some(this.isAllowToUpdateMy);
    
  if  (this.allowToUpdateAllCompanies ||                                     //если есть права изменять доки всех предприятий
      (this.itIsDocumentOfMyCompany && this.allowToUpdateMyCompany)||             //или это мое предприятие и есть права изменять доки своего предприятия
      (this.itIsDocumentOfMyDepartments && this.allowToUpdateMyDepartments)||     //или это мое отделение иесть права изменять доки своих отделений
      (this.itIsMyDocument && this.allowToUpdateMy)||                     //или это мой документ и есть права изменять свои доки (т.е. созданные собой)
      (this.allowToUpdateMy && +this.id==0))                         //или документ только создаётся и я могу изменять свои доки
      {this.canUpdateThisDoc=true;}

    this.visAfterCreatingBlocks=!this.allowToCreate;

    this.getData();
  }
  isAllowToCreate   (e){return(e==75);}
  isAllowToUpdateAllCompanies(e){return(e==81);}    //редактирование доков всех доступных предприятий
  isAllowToUpdateMyCompany(e){return(e==82);}       //редактирование доков моего предприятия
  isAllowToUpdateMyDepartments(e){return(e==83);}   //редактирование доков моих отделений
  isAllowToUpdateMy (e){return(e==84);}             //редактирование моих доков
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
      this.setDefaultDate();
    }
    this.refreshShowAllTabs();
  }

  refreshShowAllTabs(){
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.canUpdateThisDoc;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }
  setDefaultDate(){
    this.formBaseInformation.get('trade_date').setValue(moment());
  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  } 

  setDefaultCompany(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.defaultId=data as number;
        console.log("defaultId="+this.defaultId);
        this.formBaseInformation.get('company_id').setValue(this.defaultId);
        console.log("C. company_id="+this.formBaseInformation.get('company_id').value);
        this.getDepartmentsList();
      }, error => console.log(error)
      );
      
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                          //this.getUsersListByDepartmentId();
                          this.setDefaultDepartment();},
                error => console.log(error)
            );
  }
  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      this.receivedDepartmentsList.forEach(data =>{this.defaultId=+data.id;});
      this.formBaseInformation.get('department_id').setValue(this.defaultId);
      this.getUsersListByDepartmentId();
    } else this.getUsersListByDepartmentId();
  }
  getUsersListByDepartmentId(){
    this.receivedUsersList=null;
    this.loadSpravService.getUsersListByDepartmentId(this.formBaseInformation.get('department_id').value)
            .subscribe(
                (data) => {this.receivedUsersList=data as any [];
                  console.log("receivedUsersList="+this.receivedUsersList);
                  this.setDefaultUser();
                },
                error => console.log(error)
            );
  }
  setDefaultUser(){
    console.log("A. employee_id="+this.formBaseInformation.get('employee_id').value);
    if(+this.formBaseInformation.get('employee_id').value==0){
      console.log("('employee_id').value==0");
      this.loadSpravService.getMyId().subscribe(
                (data) => {this.defaultId=data as number;
                  console.log("defaultId="+this.defaultId);
                  this.formBaseInformation.get('employee_id').setValue(this.defaultId);
                  console.log("B. employee_id="+this.formBaseInformation.get('employee_id').value);},
                error => console.log(error));}
  }
  getDocumentValuesById(){
    const docId = {"id": this.id};
          this.http.post('/api/auth/getTradeResultsValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                this.formAboutDocument.get('id').setValue(+documentResponse.id);
                this.formAboutDocument.get('master').setValue(documentResponse.master);
                this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                this.formAboutDocument.get('company').setValue(documentResponse.company);
                this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                this.formBaseInformation.get('company').setValue(documentResponse.company);
                this.formBaseInformation.get('department_id').setValue(+documentResponse.department_id);
                this.formBaseInformation.get('department').setValue(documentResponse.department);
                this.formBaseInformation.get('employee_id').setValue(+documentResponse.employee_id);
                this.formBaseInformation.get('employee').setValue(documentResponse.employee);
                this.formBaseInformation.get('trade_date').setValue(documentResponse.trade_date ? moment(documentResponse.trade_date,'DD.MM.YYYY'):"");
                this.formBaseInformation.get('incoming_cash_checkout').setValue(documentResponse.incoming_cash_checkout);
                this.formBaseInformation.get('incoming_cashless_checkout').setValue(documentResponse.incoming_cashless_checkout);
                this.formBaseInformation.get('incoming_cash2').setValue(documentResponse.incoming_cash2);
                this.formBaseInformation.get('incoming_cashless2').setValue(documentResponse.incoming_cashless2);
                this.formBaseInformation.get('refund_cash').setValue(documentResponse.refund_cash);
                this.formBaseInformation.get('refund_cashless').setValue(documentResponse.refund_cashless);
                this.formBaseInformation.get('encashment_cash').setValue(documentResponse.encashment_cash);
                this.formBaseInformation.get('encashment_cashless').setValue(documentResponse.encashment_cashless);
                this.formBaseInformation.get('additional').setValue(documentResponse.additional);
                this.getCompaniesList(); 
            },
            error => console.log(error)
        );
  }

  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }

  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertTradeResults', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Документ \"Итоги смены\" успешно создан", "Закрыть");
                            },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }
  updateDocument(){
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateTradeResults', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Документ \"Итоги смены\" сохранён", "Закрыть");
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }


}
