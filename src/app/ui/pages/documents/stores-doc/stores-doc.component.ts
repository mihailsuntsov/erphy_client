import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { v4 as uuidv4 } from 'uuid';
import { translate } from '@ngneat/transloco'; //+++import { Observable } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';

interface docResponse {//интерфейс для получения ответа в методе getStoresDocsTableById
  id: number;
  company: string;
  company_id: number;
  document: string;
  document_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  changer:string;
  changer_id: number;
  date_time_changed: string;
  date_time_created: string;
  name: string;
  lang_code: string;                    // language code, e.g. EN 
  store_type: string;                   // e.g. woo
  store_api_version: string;            // e.g. v3
  crm_secret_key: string;               // like UUID generated
  store_price_type_regular: number;     // id of regular type price
  store_price_type_sale: number;        // id of sale type price
  store_orders_department_id: number;   // department for creation Customer order from store
  store_if_customer_not_found: string;  // "create_new" or "use_default"
  store_default_customer_id: number;    // counterparty id if store_if_customer_not_found=use_default
  store_default_customer: string;       // the name of store_default_customer
  store_default_creator_id: number;     // ID of default user, that will be marked as a creator of store order. Default is master user
  store_days_for_esd: number;           // number of days for ESD of created store order. Default is 0 
  store_default_creator: string;        // name of default user that will be marked as a creator of store order.
  store_auto_reserve: boolean;          // auto reserve product after getting internet store order
  storeDepartments: number[];    // internet store's departments
  store_ip: string;                     // store server ip address
  is_deleted: boolean;
  

}
interface StoresList {//интерфейс массива для получения всех налогов текущего документа
  id: string;
  name: string;
  output_order: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface idNameDescription{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  description: string;
}
interface IdAndName{
  id: number;
  name: string;
}


@Component({
  selector: 'app-stores-doc',
  templateUrl: './stores-doc.component.html',
  styleUrls: ['./stores-doc.component.css'],
  providers: [LoadSpravService,]
})
export class StoresDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  editability:boolean = false; // возможность редактирования полей.
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений

  //для поиска контрагента (покупателя) по подстроке
  searchDefaultCustomerCtrl = new UntypedFormControl();//поле для поиска дефолтного контрагента для созданных из интернет-магазина заказов
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  //для поиска создателя интернет-заказов по подстроке
  searchDefaultCreatorCtrl = new UntypedFormControl();//поле для поиска пользователя, который будет назначен как создатель для созданных из интернет-магазина заказов 
  isDefaultCreatorListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canDefaultCreatorAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredDefaultCreators: any;
  
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  rightsDefined:boolean; // определены ли права !!!

  statusColor: string;
  storesList : StoresList [] = []; //массив для получения всех налогов текущего документа

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    private _snackBar: MatSnackBar) { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      // storesIdsInOrderOfList:new UntypedFormControl      ([],[]),//
      name: new UntypedFormControl      ('',[Validators.required,Validators.maxLength(250)]),
      lang_code:                new UntypedFormControl      ('EN',[Validators.required, Validators.minLength(2),Validators.maxLength(2)]),  
      store_type:               new UntypedFormControl      ('woo',[]),  // e.g. woo
      store_api_version:        new UntypedFormControl      ('v3',[]),  // e.g. v3
      crm_secret_key:           new UntypedFormControl      ('',[Validators.required, Validators.maxLength(36)]),  // like UUID generated
      store_price_type_regular: new UntypedFormControl      ('',[Validators.required]),  // id of regular type price
      store_price_type_sale:    new UntypedFormControl      ('',[]),  // id of sale type price                // used with nds_payer as default values for Customers orders fields "Tax" and "Tax included"
      store_orders_department_id:  new UntypedFormControl   (null,[Validators.required]),   // department for creation Customer order from store
      store_if_customer_not_found: new UntypedFormControl   ('create_new',[Validators.required]),  // "create_new" or "use_default"
      store_default_customer_id:   new UntypedFormControl   (null,[]),    // counterparty id if store_if_customer_not_found=use_default
      store_default_creator_id:    new UntypedFormControl   (null,[Validators.required]),   // ID of default user, that will be marked as a creator of store order. Default is master user
      store_days_for_esd:          new UntypedFormControl   ('0',[Validators.required,Validators.maxLength(3),Validators.pattern('^[0-9]{1,3}$')]),// number of days for ESD of created store order. Default is 0 
      storeDepartments:            new UntypedFormControl   ([],[Validators.required]),
      store_auto_reserve:          new UntypedFormControl   (false,[]), // auto reserve product after getting internet store order
      store_ip:                    new UntypedFormControl   ('',[Validators.required,Validators.maxLength(21)]),  // internet-store ip address
      is_deleted: new UntypedFormControl      (false,[]),
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

    this.getSetOfPermissions();
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.onDefaultCreatorSearchValueChanges();//отслеживание изменений поля "Создатель по умолчанию"
    // getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');    
  }
  
  get formValid() {
    if(this.formBaseInformation!=undefined)
    //если нет ошибок в форме, включая отсутствие дробного количества у неделимых товаров
      return (this.formBaseInformation.valid && 
        (this.formBaseInformation.get('store_if_customer_not_found').value=='create_new' || 
          (this.formBaseInformation.get('store_if_customer_not_found').value=='use_default' && +this.formBaseInformation.get('store_default_customer_id').value>0))
      && (+this.formBaseInformation.get('store_price_type_regular').value>0&&this.formBaseInformation.get('store_price_type_regular').value!=this.formBaseInformation.get('store_price_type_sale').value)
      );
    else return true;    //чтобы не было ExpressionChangedAfterItHasBeenCheckedError. Т.к. форма создается пустая и с .valid=true, а потом уже при заполнении проверяется еще раз.
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=54')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
        );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==672)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==673)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==676)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==677)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==678)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==679)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (+this.formBaseInformation.get('company_id').value==this.myCompanyId);
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;

    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));

    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // return true;
    this.rightsDefined=true;//!!!
  return true;

}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
//  -------------     ***** поиск по подстроке для контрагента ***    --------------------------
onCagentSearchValueChanges(){
  this.searchDefaultCustomerCtrl.valueChanges
  .pipe(
    debounceTime(500),
    tap(() => {
      this.filteredCagents = [];}),       
    switchMap(fieldObject =>  
      this.getCagentsList()))
  .subscribe(data => {
    this.isCagentListLoading = false;
    if (data == undefined) {
      this.filteredCagents = [];
    } else {
      this.filteredCagents = data as any;
  }});}
  onSelectCagent(id:any,name:string){
    this.formBaseInformation.get('store_default_customer_id').setValue(+id);}
  checkEmptyCagentField(){
    if(this.searchDefaultCustomerCtrl.value.length==0){
      this.formBaseInformation.get('store_default_customer_id').setValue(null);
  }}
  getCagentsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canCagentAutocompleteQuery && this.searchDefaultCustomerCtrl.value.length>1){
        const body = {
          "searchString":this.searchDefaultCustomerCtrl.value,
          "companyId":this.formBaseInformation.get('company_id').value};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {
    return [];}}
//  -------------     ***** конец поиска по подстроке для контрагента ***    --------------------------
//  -------------     ***** поиск по подстроке для создателя заказов ***    --------------------------
onDefaultCreatorSearchValueChanges(){
  this.searchDefaultCreatorCtrl.valueChanges
  .pipe(
    debounceTime(500),
    tap(() => {
      this.filteredDefaultCreators = [];}),       
    switchMap(fieldObject =>  
      this.getDefaultCreatorsList()))
  .subscribe(data => {
    this.isDefaultCreatorListLoading = false;
    if (data == undefined) {
      this.filteredDefaultCreators = [];
    } else {
      this.filteredDefaultCreators = data as any;
  }});}
  onSelectDefaultCreator(id:any,name:string){
    this.formBaseInformation.get('store_default_creator_id').setValue(+id);}
  checkEmptyDefaultCreatorField(){
    if(this.searchDefaultCreatorCtrl.value.length==0){
      this.formBaseInformation.get('store_default_creator_id').setValue(null);
  }}
  getDefaultCreatorsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canDefaultCreatorAutocompleteQuery && this.searchDefaultCreatorCtrl.value.length>1){
        this.isDefaultCreatorListLoading  = true;
        return this.http.get('/api/auth/getUsersList?company_id='+this.formBaseInformation.get('company_id').value+'&search_string='+this.searchDefaultCreatorCtrl.value);
      }else return [];
    } catch (e) {
    return [];}}
//  -------------     ***** конец поиска по подстроке для создателя заказов ***    --------------------------
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
    }
  }

  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList()
        .subscribe(
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              this.doFilterCompaniesList();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
    else this.doFilterCompaniesList();
  }
  getMyId(){ //+++
    if(+this.myId==0)
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();
  }
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getCRUD_rights();
  }

  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(Cookie.get('satusdoc_companyId')=="0"?this.myCompanyId:+Cookie.get('satusdoc_companyId'));
    this.getPriceTypesList();
    this.getDepartmentsList();   
    this.refreshPermissions();
  }
  
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    } 
    this.setDefaultCompany();
  }
  onCompanyChange(){
    this.searchDefaultCustomerCtrl.reset();
    this.searchDefaultCreatorCtrl.reset();
    this.formBaseInformation.get('store_price_type_regular').setValue('');
    this.formBaseInformation.get('store_price_type_sale').setValue('');
    this.formBaseInformation.get('store_orders_department_id').setValue(null);
    this.formBaseInformation.get('store_default_creator_id').setValue(null);
    this.formBaseInformation.get('store_default_customer_id').setValue(null);   
    this.formBaseInformation.get('storeDepartments').setValue([]);    
    this.getPriceTypesList();
    this.getDepartmentsList();   
    this.refreshPermissions();
  }
  getDocumentValuesById(){
    this.http.get('/api/auth/getStoresValuesById?id='+this.id)
        .subscribe(
            data => {
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('lang_code').setValue(documentValues.lang_code);
                  this.formBaseInformation.get('store_type').setValue(documentValues.store_type);
                  this.formBaseInformation.get('store_api_version').setValue(documentValues.store_api_version);
                  this.formBaseInformation.get('crm_secret_key').setValue(documentValues.crm_secret_key);
                  this.formBaseInformation.get('store_price_type_regular').setValue(documentValues.store_price_type_regular);
                  this.formBaseInformation.get('store_price_type_sale').setValue(documentValues.store_price_type_sale);
                  this.formBaseInformation.get('store_orders_department_id').setValue(documentValues.store_orders_department_id);
                  this.formBaseInformation.get('store_if_customer_not_found').setValue(documentValues.store_if_customer_not_found);
                  this.formBaseInformation.get('store_default_creator_id').setValue(documentValues.store_default_creator_id);
                  this.formBaseInformation.get('store_default_customer_id').setValue(documentValues.store_default_customer_id);
                  this.formBaseInformation.get('store_days_for_esd').setValue(documentValues.store_days_for_esd);         
                  this.formBaseInformation.get('store_auto_reserve').setValue(documentValues.store_auto_reserve);    
                  this.formBaseInformation.get('storeDepartments').setValue(documentValues.storeDepartments);    
                  this.formBaseInformation.get('store_ip').setValue(documentValues.store_ip); 
                  this.formBaseInformation.get('is_deleted').setValue(documentValues.is_deleted);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.searchDefaultCreatorCtrl.setValue(documentValues.store_default_creator);
                  this.searchDefaultCustomerCtrl.setValue(documentValues.store_default_customer);
                  this.getPriceTypesList();
                  this.getDepartmentsList(); 
                  this.refreshPermissions();
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertStores', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                  let result:number=data as number;
                  switch(result){
                    case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                      break;
                    }
                    case -121:{// the quatity of online-stores is over of tariff plan, or online-stores are not accepted by tariiff plan
                      {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('docs.msg.out_of_plan')+" ("+translate('docs.field.p_store')+")"}});
                      break;}
                    }
                    default:{// Успешно
                      this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.afterCreateDoc();
                                this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
                    }
                  }
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }


  updateDocument(){ 
    return this.http.post('/api/auth/updateStores', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              default:{// Успешно
                this.getData();
                this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
              }
            }                  
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  // getStoresIdsInOrderOfList(): number[] {
  //   var i: number []=[];
  //   this.storesList.forEach(x => {
  //     i.push(+x.id);
  //   })
  //   return i;
  // }

  // dropCagent(event: CdkDragDrop<string[]>) {
  //   moveItemInArray(this.storesList, event.previousIndex, event.currentIndex);
  // }

  // Действия после создания нового документа Счёт покупателю (это самый последний этап).
  afterCreateDoc(){// с true запрос придет при отбиваемом в данный момент чеке
    // Сначала обживаем текущий документ:
    this.id=+this.createdDocId;
    this.rightsDefined=false; //!!!
    this._router.navigate(['/ui/storesdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/storesdoc',0]);
    this.id=0;
    this.formBaseInformation.get('id').setValue(0);
    this.formBaseInformation.get('name').setValue('');
    this.formBaseInformation.get('is_deleted').setValue(false);
    this.storesList=[];
    this.getData();
  }

  // onTaxValueChange(){
  //   this.formBaseInformation.get('value').value;
  //   this.formBaseInformation.get('multiplier').setValue(1
  //     +(
  //     this.formBaseInformation.get('value').value/100
  //   )
  //   );
  // }

  getPriceTypesList(){
    this.loadSpravService.getPriceTypesList(this.formBaseInformation.get('company_id').value).subscribe(
        (data) => {this.receivedPriceTypesList=data as any [];},
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});}
      );
  }
  getDepartmentsList(){
    this.loadSpravService.getDepartmentsList(this.formBaseInformation.get('company_id').value).subscribe(
        (data) => {this.receivedDepartmentsList=data as any []},
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});}
    );
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDotAndColon(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46 && charCode!=58)) { return false; } return true;}
  lettersOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    console.log('charCode = ' + charCode);
    if ((charCode >= 65 && charCode <= 90)||(charCode >= 97 && charCode <= 122)) { return true; } return false;}

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
  generateCrmSecretKey(){
    if(this.id>0 && this.formBaseInformation.get('crm_secret_key').value.length>0){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head:translate('docs.msg.attention'),
          query: translate('docs.msg.gen_new_skey'),
          warning: translate('docs.msg.gen_new_skey_'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1) this.formBaseInformation.get('crm_secret_key').setValue(uuidv4());
      });
    } else this.formBaseInformation.get('crm_secret_key').setValue(uuidv4());
      
  }
  copyKeyToClipboard(){
    navigator.clipboard.writeText(this.formBaseInformation.get('crm_secret_key').value);
  }
}
