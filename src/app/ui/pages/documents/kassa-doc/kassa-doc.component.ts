import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Router } from '@angular/router';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { KkmAtolService } from '../../../../services/kkm_atol';
import { translate } from '@ngneat/transloco'; //+++

interface docResponse {//интерфейс для получения ответа в методе getKassaValuesById
  id: number;
  company: string;//предприятие кассы
  company_id: number;// id предприятия кассы
  creator: string;//создатель
  creator_id: number;// id создателя
  department: string;  //отделение, в котором будет находиться касса
  department_id: number; // id отделения, в котором будет находиться касса
  master: string; //мастер-аккаунт
  master_id: number; //id мастер-аккаунтa
  changer:string;//кто изменяет
  changer_id: number;//id кто изменяет
  date_time_changed: string;//дата и время изменения 
  date_time_created: string;//дата и время создания
  name: string;//наименование кассы
  server_type: string;//тип сервера: atol - atol web server, kkmserver - kkmserver.ru
  sno1_id: number; // id системы налогообложения
  billing_address: string; // место расчетов
  device_server_uid: string; // идентификатор кассы на сервере касс (atol web server или kkmserver)
  additional: string; // дополнительная информация
  server_address: string; // адрес сервера и порт в локальной сети или интернете вида http://127.0.0.1:16732
  allow_to_use: boolean; // разрешено исползовать
  is_delete: boolean; // касса удалена
  zn_kkt: string; // заводской номер кассы
  is_virtual: boolean;// виртуальная (сейчас не используется, на будущее)
  allow_acquiring: boolean;// прием безнала на данной кассе
  acquiring_bank_id: number; // id банка-эквайера
  acquiring_bank: string; // название банка-эквайера
  acquiring_precent: number; // процент банку за услугу эквайринга 
  acquiring_service_id: number; // id услуги эквайринга
  acquiring_service: string; // наименование услуги эквайринга
  payment_account_id: number; //id расчетного счета
  payment_account: string;  // расчетный счет
  expenditure_id: number; //id статьи расходов
  expenditure: string;  // статья расходов
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface filesInfo {// для файлов
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}
interface TaxationTypes{ // для списка справочника систем налогообложения (например усн, осн)
  id: number;
  name: string;
  name_api_atol; string;
}



@Component({
  selector: 'app-kassa-doc',
  templateUrl: './kassa-doc.component.html',
  styleUrls: ['./kassa-doc.component.css'],
  providers: [LoadSpravService,KkmAtolService]
})
export class KassaDocComponent implements OnInit {

  id: number = 0;// id документа
  myId:number=0;// мой id 
  myCompanyId:number=0; //id моего предприятия (под моим понимается залогиненного пользователя)
  creatorId:number=0; // id создателя
  createdDocId: number;// id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedUsersList  : any [];//массив для получения списка пользователей
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  spravSysTaxationTypes: TaxationTypes[] = []; //массив списка справочника систем налогообложения (например усн, осн)
  
  paymentAccounts:any[]=[];  // список расчётных счетов предприятия
  expenditureItems:any[]=[];  // список статей расходов
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  
  //для поиска контрагента по подстроке
  searchCagentCtrl = new FormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  //для поиска услуги эквайринга по подстроке
  searchServiceCtrl = new FormControl();//поле для поиска
  isServiceListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canServiceAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredServices: any;

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  showOpenDocIcon:boolean=false;
  rightsDefined:boolean; // определены ли права !!!


  //взаимодействие с кассой
  test_status:string=''; // статус соединения (200, 404 и т.д.)
  wasConnectionTest:boolean=false;// был ли тест соединения с кассой
  requestToServer:boolean=false;// идет запрос к серверу
  testSuccess=false;// запрос к серверу был со статусом 200
  modelName:string='';
  firmwareVersion:string='';
  zn_kkt:string='';
  ffdVersion:string='';
  fnFfdVersion:string='';

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    private kkmAtolService: KkmAtolService,
    public MessageDialog: MatDialog,
    private _router:Router,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar
  ) {if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];}

  ngOnInit(): void {
    this.formBaseInformation = new FormGroup({              
      id:                 new FormControl(this.id,[]),               // id документа
      company_id:         new FormControl('',[Validators.required]), // id предприятия
      department_id:      new FormControl('',[Validators.required]), // id отделения
      name:               new FormControl('',[Validators.maxLength(60),  Validators.required]), // наименование кассы
      server_type:        new FormControl('atol',[Validators.required]), // тип сервера: atol - atol web server, kkmserver - kkmserver.ru
      sno1_id:            new FormControl('',[Validators.required]), // id системы налогообложения
      billing_address:    new FormControl('',[Validators.maxLength(300), Validators.required]), // место расчетов
      device_server_uid:  new FormControl('',[Validators.maxLength(20),  Validators.required]), // идентификатор кассы на сервере касс (atol web server или kkmserver)
      additional:         new FormControl('',[]), // дополнительная информация
      server_address:     new FormControl('http://127.0.0.1:16732',[Validators.maxLength(300), Validators.required]), // адрес сервера и порт в локальной сети или интернете вида http://127.0.0.1:16732
      allow_to_use:       new FormControl(false,[]), // разрешено исползовать
      zn_kkt:             new FormControl('',[Validators.maxLength(64),  Validators.required]), // заводской номер кассы
      is_virtual:         new FormControl(false,[]),  // виртуальная (сейчас не используется, на будущее)
      allow_acquiring:    new FormControl(false,[]),  // прием безнала на данной кассе
      acquiring_bank_id:  new FormControl('',[]),     // id банка-эквайера
      acquiring_bank:     new FormControl('',[]),     // название банка-эквайера
      acquiring_precent:  new FormControl('',[Validators.max(100),Validators.min(0)]),     // процент банку за услугу эквайринга 
      acquiring_service_id:new FormControl('',[]),    // id услуги эквайринга
      acquiring_service:  new FormControl('',[]),     // наименование услуги эквайринга
      payment_account_id: new FormControl('',[]),     // id расчетного счета
      payment_account:    new FormControl('',[]),     // расчетный счет
      expenditure_id:     new FormControl('',[]),     // id статьи расходов
      expenditure:        new FormControl('',[]),     // статья расходов
    });
    this.formAboutDocument = new FormGroup({
      id:                 new FormControl('',[]),
      master:             new FormControl('',[]),
      creator:            new FormControl('',[]),
      changer:            new FormControl('',[]),
      company:            new FormControl('',[]),
      date_time_created:  new FormControl('',[]),
      date_time_changed:  new FormControl('',[]),
    });
    this.onCagentSearchValueChanges();//отслеживание изменений поля Банк для эквайринга
    this.onServiceSearchValueChanges();//отслеживание изменений поля Услуга эквайринга
    this.getSpravSysTaxationTypes();
    this.getSetOfPermissions();//
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
    this.getBaseData('myDepartmentsList'); 

  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=24')
      .subscribe(
          (data) => {   
            this.permissionsSet=data as any [];
            this.getMyId();
          },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
    );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==296)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==297)});
    this.allowToCreateMyDepartments = this.permissionsSet.some(        function(e){return(e==298)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==302)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==303)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==304)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==305)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==306)});
    this.allowToUpdateMyDepartments = this.permissionsSet.some(        function(e){return(e==307)});

    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    let documentOfMyDepartments:boolean = (this.inMyDepthsId(+this.formBaseInformation.get('department_id').value));
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)||
      (this.allowToViewMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)||
      (this.allowToUpdateMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!
    return true;
  }
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  //  -------------     ***** поиск по подстроке для контрагента ***    --------------------------
  onCagentSearchValueChanges(){
  this.searchCagentCtrl.valueChanges
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
    this.formBaseInformation.get('acquiring_bank_id').setValue(+id);}
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('acquiring_bank_id').setValue(null);
  }}
  getCagentsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canCagentAutocompleteQuery && this.searchCagentCtrl.value.length>1){
        const body = {
          "searchString":this.searchCagentCtrl.value,
          "companyId":this.formBaseInformation.get('company_id').value};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {
    return [];}}
//-------------------------------------------------------------------------------
//  -------------     ***** поиск по подстроке для услуги эквайринга ***    --------------------------
onServiceSearchValueChanges(){
  this.searchServiceCtrl.valueChanges
  .pipe(
    debounceTime(500),
    tap(() => {
      this.filteredServices = [];}),       
    switchMap(fieldObject =>  
      this.getServicesList()))
  .subscribe(data => {
    this.isServiceListLoading = false;
    if (data == undefined) {
      this.filteredServices = [];
    } else {
      this.filteredServices = data as any;
  }});}
  onSelectService(id:any,name:string){
    this.formBaseInformation.get('acquiring_service_id').setValue(+id);}
  checkEmptyServiceField(){
    if(this.searchServiceCtrl.value.length==0){
      this.formBaseInformation.get('acquiring_service_id').setValue(null);
  }}
  getServicesList(){ //заполнение Autocomplete для поля Услуга банка Эквайринга
    try {
      if(this.canServiceAutocompleteQuery && this.searchServiceCtrl.value.length>1){
        this.isServiceListLoading  = true;
        return this.http.get('/api/auth/getProductsList?searchString='+this.searchServiceCtrl.value+'&companyId='+this.formBaseInformation.get('company_id').value+'&departmentId=0&document_id=0&priceTypeId=0');
      }else return [];
    } catch (e) {
      this.isServiceListLoading  = false;
      return [];}}
//-------------------------------------------------------------------------------
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
          this.getMyDepartmentsList();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getMyDepartmentsList();
  }
  getMyDepartmentsList(){ //+++
    if(this.receivedMyDepartmentsList.length==0)
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.getCRUD_rights();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getCRUD_rights();
  }
  setDefaultCompany(){
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
      this.getDepartmentsList(true);
      this.getExpenditureItemsList();
      this.getCompaniesPaymentAccounts();
  }
  getDepartmentsList(newDoc:boolean){
    this.receivedDepartmentsList=null;
    if (newDoc) this.formBaseInformation.get('department_id').setValue('');
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                    this.doFilterDepartmentsList();
                    if (newDoc) this.setDefaultDepartment();},
                error => console.log(error)
            );
  }

  onCompanyChange(){
    this.getDepartmentsList(true);
    this.getExpenditureItemsList();
    this.getCompaniesPaymentAccounts();
  }

  getExpenditureItemsList(){
    return this.http.get('/api/auth/getExpenditureItems?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.expenditureItems=data as any [];
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  getCompaniesPaymentAccounts(){
    return this.http.get('/api/auth/getCompaniesPaymentAccounts?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.paymentAccounts=data as any [];
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }


  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      let depId:number;
      this.receivedDepartmentsList.forEach(data =>{depId=+data.id;});
      this.formBaseInformation.get('department_id').setValue(depId);
    }
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
  doFilterDepartmentsList(){
    console.log('doFilterDepartmentsList');
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }
  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    console.log('inMyDepthsId');
    let inMyDepthsId:boolean = false;
    this.receivedMyDepartmentsList.forEach(myDepth =>{
      myDepth.id==id?inMyDepthsId=true:null;
    });
  return inMyDepthsId;
  }
  getDocumentValuesById(){
        this.http.get('/api/auth/getKassaValuesById?id='+this.id)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //!!!
                if(data!=null&&documentValues.company_id!=null){
                  //Заполнение формы из интерфейса documentValues:
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                  this.formBaseInformation.get('department_id').setValue(+documentValues.department_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('server_type').setValue(documentValues.server_type);
                  this.formBaseInformation.get('sno1_id').setValue(documentValues.sno1_id);
                  this.formBaseInformation.get('billing_address').setValue(documentValues.billing_address);
                  this.formBaseInformation.get('device_server_uid').setValue(documentValues.device_server_uid);
                  this.formBaseInformation.get('additional').setValue(documentValues.additional);
                  this.formBaseInformation.get('server_address').setValue(documentValues.server_address);
                  this.formBaseInformation.get('allow_to_use').setValue(documentValues.allow_to_use);
                  this.formBaseInformation.get('zn_kkt').setValue(documentValues.zn_kkt);

                  this.formBaseInformation.get('is_virtual').setValue(documentValues.is_virtual);
                  this.formBaseInformation.get('allow_acquiring').setValue(documentValues.allow_acquiring);
                  this.formBaseInformation.get('acquiring_bank_id').setValue(documentValues.acquiring_bank_id);
                  this.formBaseInformation.get('acquiring_bank').setValue(documentValues.acquiring_bank);
                  this.formBaseInformation.get('acquiring_precent').setValue(documentValues.acquiring_precent);  
                  this.formBaseInformation.get('acquiring_service_id').setValue(documentValues.acquiring_service_id);  
                  this.formBaseInformation.get('acquiring_service').setValue(documentValues.acquiring_service);    
                  this.searchCagentCtrl.setValue(documentValues.acquiring_bank);
                  this.searchServiceCtrl.setValue(documentValues.acquiring_service);

                  this.formBaseInformation.get('payment_account_id').setValue(documentValues.payment_account_id);    
                  this.formBaseInformation.get('payment_account').setValue(documentValues.payment_account);    
                  this.formBaseInformation.get('expenditure_id').setValue(documentValues.expenditure_id);    
                  this.formBaseInformation.get('expenditure').setValue(documentValues.expenditure);    

                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.creatorId=+documentValues.creator_id;
                  this.loadFilesInfo();
                  this.getDepartmentsList(false);
                  this.getExpenditureItemsList();
                  this.getCompaniesPaymentAccounts();
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  getSpravSysTaxationTypes(){
        this.loadSpravService.getSpravSysTaxationTypes()
        .subscribe((data) => {this.spravSysTaxationTypes=data as TaxationTypes[];},
        error => console.log(error));
  }

  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertKassa', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as number;
                                if(+this.createdDocId!=0){
                                  this.id=+this.createdDocId[0];
                                  this._router.navigate(['/ui/taxesdoc', this.id]);
                                  this.formBaseInformation.get('id').setValue(this.id);
                                  this.rightsDefined=false; //!!!
                                  this.getData();
                                  this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.kassa')}), translate('docs.msg.close'));
                                }else{
                                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.there_cashbox')}})
                                }                                
                            },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }

  updateDocument(){ 
      return this.http.post('/api/auth/updateKassa', this.formBaseInformation.value)
        .subscribe(
            (data) => 
            {   
              let result=data as number;
              if(+result==1){
                this.getData();
                this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.kassa')})+translate('docs.msg.saved'), translate('docs.msg.close'));
              }else if(+result==0){
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.there_cashbox')}})
              }else if(+result==null){
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.save_error')}})
              }else if(+result==-1){
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})
              }
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
        );
  } 

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  queryDeviceInfo(){
    let address=this.formBaseInformation.get('server_address').value;
    this.wasConnectionTest=true;
    this.requestToServer=true;
    this.test_status= '';
    this.modelName= '';
    this.firmwareVersion= '';
    this.zn_kkt= '';
    this.ffdVersion= '';
    this.fnFfdVersion= '';
    this.kkmAtolService.queryDeviceInfo(address,'info',this.formBaseInformation.get('device_server_uid').value).subscribe(//параметры: 1й - запрос информации (может быть еще запрос кода ошибки), 2й - id кассы в сервере Атола
      (data) => {
        let response=data as any;
        try{
          this.requestToServer=false;
          //если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
          //тогда в catch запрашиваем уточненный статус http запроса (4ХХ) и расшифровываем ошибку
          this.test_status=translate('docs.msg.c_cnnctd');
          this.modelName=       response.deviceInfo.modelName;
          this.firmwareVersion= response.deviceInfo.firmwareVersion;
          this.zn_kkt=          response.deviceInfo.serial;
          this.ffdVersion=      response.deviceInfo.ffdVersion;
          this.fnFfdVersion=    response.deviceInfo.fnFfdVersion;
          if(+this.id>0 && this.formBaseInformation.get('zn_kkt').value!=this.zn_kkt)//если мы на этапе редактирования, и заводские номера в карточке кассы и в запросе к кассе не совпедают, то эта карточка не от подключенной кассы
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:'Тест соединения пройден, но данная карточка кассы не соответствует подключенной ККМ по заводскому номеру. Для подключенной ККМ необходимо завести новую карточку'}})
          if(+this.id==0)//если на этапе создания - вписываем заводской номер в карточку кассы
            this.formBaseInformation.get('zn_kkt').setValue(this.zn_kkt);
          console.log(this.test_status);
        } catch (e) {
          this.test_status=translate('docs.msg.c_conn_err');
          this.requestToServer=true;
          let errorMessage:string=response.error.description;//ошибки тоже возворащают объект, в котором может содержаться детальное описание ошибки
          if(errorMessage==translate('docs.msg.c_no_port')||errorMessage==translate('docs.msg.c_no_connct')) errorMessage=errorMessage+'.'+ translate('docs.msg.c_check_plug');
          //запрашиваем код ошибки
          this.kkmAtolService.queryShiftStatus(address,'errorCode',this.formBaseInformation.get('device_server_uid').value).subscribe((data) => {
            this.requestToServer=false;
            let response=data as any;
            switch(response){
              case 401:{this.test_status=translate('docs.msg.c_auth_error');break;};
              case 403:{this.test_status=translate('docs.msg.c_err_not_act');break;};
              case 404:{this.test_status=translate('docs.msg.c_id_not_fnd');break;};
              case 408:{this.test_status=translate('docs.msg.c_cnt_get_drvr');break;};
              default :{this.test_status=translate('docs.msg.c_err_exe_qury');};//420
            }
            this.test_status=this.test_status+'. '+errorMessage;
            console.log(this.test_status);
          }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
        }
      }, error => {console.log(error);this.requestToServer=false;this.test_status= translate('docs.msg.c_no_srvr_cnct');});
  } 
  
  showZnMessage(){
    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.c_fill_only_crt')}})
  }
  //*****************************************************************************************************************************************/
  //***************************************************    добавление файлов          *******************************************************/
  //*****************************************************************************************************************************************/
  openDialogAddFiles() {
    const dialogRef = this.dialogAddFiles.open(FilesComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'select',
        companyId: this.formBaseInformation.get('company_id').value
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result)this.addFilesToKassa(result);
    });
  }
  openFileCard(docId:number) {
    const dialogRef = this.dialogAddFiles.open(FilesDocComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'window',
        docId: docId
      },
    });
  }

  addFilesToKassa(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addFilesToKassa', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar(translate('docs.msg.files_added'), translate('docs.msg.close'));
                    this.loadFilesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
              );
  }
  loadFilesInfo(){//                                     загружает информацию по прикрепленным файлам
    return this.http.get('/api/auth/getListOfKassaFiles?id='+this.id) 
      .subscribe(
          (data) => {  
                      this.filesInfo = data as any; 
                    },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
  }
  clickBtnDeleteFile(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.file_del_head'),
        query: translate('docs.msg.file_del_qury'),
        warning: translate('docs.msg.file_del_warn'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteFile(id);}
    });        
  }

  deleteFile(id:number){
  return this.http.delete('/api/auth/deleteKassaFile?kassa_id='+this.id+'&file_id='+id)
    .subscribe(
        (data) => {   
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.loadFilesInfo();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );  
  }
  checkPrecent(){
    this.formBaseInformation.get('acquiring_precent').setValue((this.formBaseInformation.get('acquiring_precent').value!=null?this.formBaseInformation.get('acquiring_precent').value:'').replace(",", "."));
  }
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}
