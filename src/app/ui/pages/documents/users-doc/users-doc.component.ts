import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { debounceTime, map, startWith, switchMap, tap } from 'rxjs/operators';
import { translate } from '@ngneat/transloco'; //+++
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  // estimated_balance: number;      // остатки
  filename: string;               // картинка товара
  edizm: string;                  // наименование единицы измерения товара
  total: number;                  // остатки 
  nds_id: number;                 // ндс 
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
  priceOfTypePrice: number;       // цена по запрошенному id типа цены
  avgCostPrice: number;           // средняя себестоимость
  lastPurchasePrice: number;      // последняя закупочная цена
  avgPurchasePrice : number;      // средняя закупочная цена
  is_material: boolean;           // материален ли продукт (товар это или услуга)
}

interface docResponse {//интерфейс для получения ответа в методе getUserValuesById
id: number;
username: string;
password: string;
email: string;
name: string;
company_id: string;
company: string;
creator_id: string;
master_id: string;
creator: string;
master: string;
userDepartmentsNames: string[];
userDepartmentsId: string[];
userGroupsId: string[];
date_time_changed: string;
date_time_created: string;
changer_id: string;
changer: string;
fio_family: string;
fio_name: string;
fio_otchestvo: string;
sex: string;
time_zone_id: string;
vatin:string;
date_birthday: string;
status_account: number;
status_account_name: string;
status_employee: string;
status_employee_name: string;
additional: string;
languageId: number;
localeId: number;
is_employee: boolean; // Пользователь является сотрудником предприятия // User is employee of company
is_currently_employed: boolean; // Это действующий сотрудник (не уволен) // Currently employed (not fired)
is_display_in_employee_list: boolean; // Отображать в списках сотрудников, оказывающих услуги // This user will be displayed in the lists of users who provide services
job_title_id: number; // Должность // Job title
job_title_name: number; // Должность // Job title
counterparty_id: number; // Карточка контрагента // Counteparty card (ID)
counterparty_name: string; // Карточка контрагента // Counteparty card
incoming_service_id: number; //Принимаемая услуга - какую услугу сотрудник оказывает предприятию, для обоснования получения зп. // Incoming service from employee to company, when he working   for its salary
incoming_service_name: string; 


//describes set of services that employee (this user) can provide, and where (parts of departments) he can provide these services
userProducts:UserProducts[];
}

interface UserProducts{
  id: number;
  name: string;
  // dep_parts_ids: number[];

}
interface IdAndName{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
}
@Component({
  //changeDetection: ChangeDetectionStrategy.OnPush, // Using this just to avoid the expression changed error. Please use this if required.
  selector: 'app-users-doc',
  templateUrl: './users-doc.component.html',
  styleUrls: ['./users-doc.component.css'],
  providers: [LoadSpravService,ProductCategoriesSelectComponent,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class UsersDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedDepartmentsWithPartsList: any [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  receivedUserGroupList: any [];//для групп пользователей`
  spravSysLanguages: IdAndName[] = [];                // here will be loaded all languages`
  spravSysLocales  : IdAndName[] = [];                // here will be loaded all locales
  oneClickSaveControl:boolean=false;//блокировка кнопок Save и Complete для защиты от двойного клика

  visBtnUpdate = false;

  
  id: number=0;// id документа
  myCompanyId:number=0;
  myId:number=0;
  gettingTableData: boolean = false;//идет загрузка данных
  displayedColumns:string[] = [];//отображаемые колонки таблицы
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан


  //Формы
  formBaseInformation:any;//форма основной информации и банк. реквизитов
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/именён кем/когда)
 
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyMastersCompanies:boolean = false;
  allowToUpdate:boolean = false;
  allowToView:boolean = false;
  rightsDefined:boolean = false;
  
  isSignedUp = false;
  isSignUpFailed = false;
  errorMessage = '';
  emptyName=false;
  emptyLogin=false;
  emptyEmail=false;
  emptyPassword=false;
  emptyusername=false;
  
  spravSysTimeZones: IdAndName[] = [];// массив, куда будут грузиться все зоны
  filteredSpravSysTimeZones: Observable<IdAndName[]>; // here will be filtered time zones for showing in select list
  filteredSpravSysLanguages: Observable<IdAndName[]>; // here will be filtered languages for showing in select list
  filteredSpravSysLocales:   Observable<IdAndName[]>; // here will be filtered locales for showing in select list
  filteredJobtitles: Observable<IdAndName[]>; // here will be job titles for showing in select list
  
  suffix:string = "en"; // суффикс 
  locale:string = "en-uk"; // локаль 

  resource_row_id:number=0;

  //для поиска контрагента (получателя) по подстроке
  searchCagentCtrl = new UntypedFormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    private _router:Router,
    public ConfirmDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _fb: UntypedFormBuilder, //чтобы билдить группы форм productPricesTable и другие
    public MessageDialog: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    public dialogCreateDepartment: MatDialog,
    private _snackBar: MatSnackBar,
    private _adapter: DateAdapter<any>
    ){
    console.log(this.activateRoute);
    if(activateRoute.snapshot.params['id'])
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0
   }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      name: new UntypedFormControl      ('',[Validators.required]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      address: new UntypedFormControl      ('',[]),
      additional: new UntypedFormControl      ('',[]),
      username: new UntypedFormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.minLength(4),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      email: new UntypedFormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.email]),
      password: new UntypedFormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.minLength(6),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      fio_family: new UntypedFormControl      ('',[]),
      fio_name: new UntypedFormControl      ('',[Validators.required]),
      fio_otchestvo: new UntypedFormControl      ('',[]),
      sex: new UntypedFormControl      ('',[]),
      date_birthday: new UntypedFormControl      ('',[]),
      status_account: new UntypedFormControl      (2,[]),
      status_employee: new UntypedFormControl      ('',[]),
      timeZoneName: new UntypedFormControl      ('',[]),
      vatin: new UntypedFormControl      ('',[Validators.maxLength(12), Validators.minLength(12),Validators.pattern('^[0-9]{12}$')]),
      selectedUserDepartments: new UntypedFormControl([],[Validators.required]),
      userGroupList: new UntypedFormControl      ([],[Validators.required]),      
      timeZoneId: new UntypedFormControl  (24,[Validators.required]),
      localeId: new UntypedFormControl      (4,[Validators.required]),
      languageId: new UntypedFormControl    (1,[Validators.required]),
      localeName: new UntypedFormControl      ('',[]),
      languageName: new UntypedFormControl    ('',[]),
     
      is_employee: new UntypedFormControl    ('',[]), // Пользователь является сотрудником предприятия // User is employee of company
      is_currently_employed: new UntypedFormControl    ('',[]), // Это действующий сотрудник (не уволен) // Currently employed (not fired)
      is_display_in_employee_list: new UntypedFormControl    ('',[]), //  Отображать в списках сотрудников, оказывающих услуги // This user will be displayed in the lists of users who provide services
      job_title_id:  new UntypedFormControl    (null,[]), // Должность // Job title
      job_title_name:  new UntypedFormControl    ('',[]), // Должность // Job title
      counterparty_id:  new UntypedFormControl    ('',[]), // Карточка контрагента // Counteparty card (ID)
      // counterparty_name:  new UntypedFormControl    ('',[]), // Карточка контрагента // Counteparty card
      incoming_service_name:  new UntypedFormControl    ('',[]), // Принимаемая услуга - какую услугу сотрудник оказывает предприятию, для обоснования получения зп. // Incoming service from employee to company, when he working   for its salary
      incoming_service_id:  new UntypedFormControl    ('',[]), // Принимаемая услуга - какую услугу сотрудник оказывает предприятию, для обоснования получения зп. // Incoming service from employee to company, when he working   for its salary

      userProducts: new UntypedFormArray([]), //describes set of services that employee can provide, and where (parts of departments) he can provide these services
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl           ('',[]),
      master: new UntypedFormControl       ('',[]),
      creator: new UntypedFormControl      ('',[]),
      changer: new UntypedFormControl      ('',[]),
      company: new UntypedFormControl      ('',[]),
      date_time_created: new UntypedFormControl      ('',[]),
      date_time_changed: new UntypedFormControl      ('',[]),
    });

    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList'); 
    this.getBaseData('suffix'); 
    this.getBaseData('timeZoneId'); 
    this.getBaseData('languageId'); 
    this.getBaseData('localeId'); 
    // listener of time zones field change
    this.filteredSpravSysTimeZones = this.formBaseInformation.get('timeZoneName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.spravSysTimeZones))
    );

    // listener of language field change
    this.filteredSpravSysLanguages = this.formBaseInformation.get('languageName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.spravSysLanguages))
    );
    // listener of Job title field change
    this.filteredJobtitles = this.formBaseInformation.get('job_title_name').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter_jobtitles(value,this.receivedJobtitlesList))
    );
    // listener of locale field change
    this.filteredSpravSysLocales = this.formBaseInformation.get('localeName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value, this.spravSysLocales))
    );
    this.getSpravSysTimeZones();
    this.getSpravSysLanguages();
    this.getSpravSysLocales();
    this.getSetOfPermissions();
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Контрагент"
  }

  setBaseDataParameter(parameterName:string,parameterValue:any){
    if(parameterValue)
      this.formBaseInformation.get(parameterName).setValue(parameterValue);
  }
  get additionalChecksValid(){
    return(
      (!this.formBaseInformation.get('is_employee').value || 
        (
          this.formBaseInformation.get('is_employee').value && 
          +this.formBaseInformation.get('job_title_id').value>0
        )
      )
    ) &&
    (
      (+this.formBaseInformation.get('counterparty_id').value==0 ||
        (
          +this.formBaseInformation.get('counterparty_id').value>0 
          // && +this.formBaseInformation.get('incoming_service_id').value>0
        )
      )
    )
  }


  getSpravSysLanguages():void {    
    this.http.get('/api/auth/getSpravSysLanguages')  // 
    .subscribe((data) => {this.spravSysLanguages = data as any[];
    this.updateValues('languageId','languageName',this.spravSysLanguages); },
    error => console.log(error));
  }
  getSpravSysLocales():void {    
    this.http.get('/api/auth/getSpravSysLocales')  // 
    .subscribe((data) => {this.spravSysLocales = data as any[];
    this.updateValues('localeId','localeName',this.spravSysLocales); },
    error => console.log(error));
  }
  getSpravSysTimeZones():void {    
    this.http.get('/api/auth/getSpravSysTimeZones?suffix='+this.suffix)  // 
    .subscribe((data) => {this.spravSysTimeZones = data as any[];
    this.updateValues('timeZoneId','timeZoneName',this.spravSysTimeZones); },
    error => console.log(error));
  }  
  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  getJobtitleList(){ 
    return this.http.get('/api/auth/getJobtitlesList?company_id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesList=data as any [];
                      this.updateJobTitleValues('job_title_id','job_title_name');
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateValues(id:string,name:string,list:IdAndName[]){
    if(+this.formBaseInformation.get(id).value!=0){
      list.forEach(x => {
        if(x.id==this.formBaseInformation.get(id).value){
          this.formBaseInformation.get(name).setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.formBaseInformation.get(name).setValue('');
      this.formBaseInformation.get(id).setValue('');
    }
  }
  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateJobTitleValues(id:string,name:string){
    if(+this.formBaseInformation.get(id).value!=0){
      this.receivedJobtitlesList.forEach(x => {
        if(x.jobtitle_id==this.formBaseInformation.get(id).value){
          this.formBaseInformation.get(name).setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.formBaseInformation.get(name).setValue('');
      this.formBaseInformation.get(id).setValue('');
    }
  }
  // set id of field value into null when field search value is '' 
  checkEmptyFields(id:string,name:string){
    if( this.formBaseInformation.get(name).value.length==0){
      this.formBaseInformation.get(id).setValue(null);
    }
  }
  clearField(field:string){
    this.formBaseInformation.get(field).setValue('');
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
    }
  }
  // this.formBaseInformation.controls.password.disable();
  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=5')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                  },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
                  );
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

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==22)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==22)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==25)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==24)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==27)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==26)});
  
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    this.getData();
  }

  refreshPermissions(){
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
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    this.refreshTableColumns();
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getDepartmentsList(company: number){
    this.receivedDepartmentsList=null;
    //console.log("gettingDepthList");
    this.loadSpravService.getDepartmentsListByCompanyId(company,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];console.log("receivedDepartmentsList-"+this.receivedDepartmentsList)},
                error => console.log(error)
            );
  }
  getUserGroupList(){
    this.receivedUserGroupList=null;
    this.loadSpravService.getUserGroupList()
            .subscribe(
                (data) => {this.receivedUserGroupList=data as any [];console.log("receivedUserGroupList-"+this.receivedUserGroupList)},
                error => console.log(error)
            );
  }

  onToggleDropdown() {
    //this.multiSelect.toggleDropdown();
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    this.setDefaultCompany();
  }

  setDefaultCompany(){
    if(+this.id==0)
      if(this.allowToCreateAllCompanies)
        this.formBaseInformation.get('company_id').setValue(Cookie.get('users_companyId')=="0"?this.myCompanyId:+Cookie.get('users_companyId'));
      else
        this.formBaseInformation.get('company_id').setValue(this.myCompanyId);

    this.getDepartmentsList(+this.formBaseInformation.get('company_id').value);
    this.getUserGroupList();
    this.refreshPermissions();
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
  }
  
  onCompanyChange(){
    this.formBaseInformation.get('selectedUserDepartments').setValue([]);
    this.getDepartmentsList(+this.formBaseInformation.get('company_id').value);
    this.getUserGroupList();
    this.refreshPermissions();    
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    this.searchCagentCtrl.setValue('');
    this.formBaseInformation.get('counterparty_id').setValue(null);
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
    this.oneClickSaveControl=true;
    if(!this.formBaseInformation.get('is_employee').value){
      this.searchCagentCtrl.setValue('');
      this.formBaseInformation.get('job_title_id').setValue(null);
      this.formBaseInformation.get('counterparty_id').setValue(null);
      this.onClickDeleteIncomingService();
    }
    this.http.post('/api/auth/updateUser', this.formBaseInformation.value).subscribe(
      (data) => {let result=data as any;
        switch(result){
          case 1:{this.getData(); this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));break;} 
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
        }
        this.oneClickSaveControl=false;
      },error => {this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.oneClickSaveControl=true;
    this.http.post('/api/auth/getUserValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                if(data!=null&&documentResponse.company_id!=null){
                  this.formAboutDocument.get('id').setValue(+documentResponse.id);
                  this.formAboutDocument.get('master').setValue(documentResponse.master);
                  this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                  this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                  this.formAboutDocument.get('company').setValue(documentResponse.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
                  this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                  this.formBaseInformation.get('additional').setValue(documentResponse.additional);
                  this.formBaseInformation.get('fio_family').setValue(documentResponse.fio_family);
                  this.formBaseInformation.get('fio_name').setValue(documentResponse.fio_name);
                  this.formBaseInformation.get('fio_otchestvo').setValue(documentResponse.fio_otchestvo);
                  this.formBaseInformation.get('username').setValue(documentResponse.username);
                  this.formBaseInformation.get('email').setValue(documentResponse.email);
                  this.formBaseInformation.get('selectedUserDepartments').setValue(documentResponse.userDepartmentsId);
                  this.formBaseInformation.get('sex').setValue(documentResponse.sex);
                  this.formBaseInformation.get('status_account').setValue(+documentResponse.status_account);
                  this.formBaseInformation.get('date_birthday').setValue(documentResponse.date_birthday ? moment(documentResponse.date_birthday,'DD.MM.YYYY'):"");
                  this.formBaseInformation.get('additional').setValue(documentResponse.additional);
                  this.formBaseInformation.get('userGroupList').setValue(documentResponse.userGroupsId);
                  this.formBaseInformation.get('counterparty_id').setValue(documentResponse.counterparty_id);
                  this.searchCagentCtrl.setValue(documentResponse.counterparty_name); //counterparty_name
                  this.formBaseInformation.get('is_employee').setValue(documentResponse.is_employee);
                  this.formBaseInformation.get('is_currently_employed').setValue(documentResponse.is_currently_employed);
                  this.formBaseInformation.get('is_display_in_employee_list').setValue(documentResponse.is_display_in_employee_list);                  
                  this.formBaseInformation.get('job_title_id').setValue(documentResponse.job_title_id);
                  this.formBaseInformation.get('job_title_name').setValue(documentResponse.job_title_name);
                  this.formBaseInformation.get('incoming_service_id').setValue(documentResponse.incoming_service_id);
                  this.formBaseInformation.get('incoming_service_name').setValue(documentResponse.incoming_service_name);
                  this.fillProductsListFromApiResponse(documentResponse.userProducts);

                  this.getDepartmentsList(this.formBaseInformation.get('company_id').value);  
                  this.getUserGroupList();
                  this.getDepartmentsWithPartsList();
                  this.getJobtitleList();
                  
                } else {this.oneClickSaveControl=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
                this.oneClickSaveControl=false;
            },
            error => {this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  onSubmit() {
    if( (this.formBaseInformation.get("name").value!="") && 
        (this.formBaseInformation.get("username").value!="") && 
        (this.formBaseInformation.get("email").value!="") && 
        (this.formBaseInformation.get("password").value!="")&& (!this.formBaseInformation.invalid))
    {
      this.oneClickSaveControl=true;
      this.http.post('/api/auth/addUser', this.formBaseInformation.value)
      .subscribe(
        (data) =>   {
          let result=data as any;
          switch(result){
            case  null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case  -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            case -10:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.user_login_th')}});break;}
            case -11:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.user_email_th')}});break;}
            case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
            default:{  
              this.isSignedUp = true;
              this.isSignUpFailed = false;
              this.id=result;
              this._router.navigate(['/ui/usersdoc', this.id]);
              this.formBaseInformation.get('id').setValue(this.id);
              this.formBaseInformation.controls['username'].disable();
              this.formBaseInformation.controls['email'].disable();
              this.rightsDefined=false; //!!!
              this.getData();
              this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
            }
          }
          this.oneClickSaveControl=false;
        },
        error => {this.oneClickSaveControl=false;this.isSignUpFailed = true;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.message}})
        }
      );
    }else{
      if(this.formBaseInformation.get("name").value==""){
        this.emptyName=true;
      }
      if(this.formBaseInformation.get("username").value==""){
        this.emptyLogin=true;
      }
      if(this.formBaseInformation.get("email").value==""){
        this.emptyEmail=true;
      }
      if(this.formBaseInformation.get("username").value==""){
        this.emptyusername=true;
      }
      if(this.formBaseInformation.get("password").value==""){
        this.emptyPassword=true;
      }
    }  
  }


  // filtration on each change of text field
  private _filter(value: string, list:IdAndName[]): IdAndName[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  private _filter_jobtitles(value: string, list:any[]): any[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
  getControl(formControlName){
    const control = <UntypedFormArray>this.formBaseInformation.get(formControlName);
    return control
  }
  fillProductsListFromApiResponse(productsArray:UserProducts[]){
    this.getControl('userProducts').clear();
    if(productsArray.length>0){
      const control = <UntypedFormArray>this.formBaseInformation.get('userProducts');
      productsArray.forEach(row=>{
        control.push(this.formingProductResourceRow(row));            
      });
    }
    // this.refreshProductsTableColumns();
  }
  
  formingProductResourceRow(row: UserProducts) {
    return this._fb.group({
      // row_id: [this.getResourceRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      id:  new UntypedFormControl (row.id,[]),
      name: new UntypedFormControl (row.name,[]),
      // dep_parts_ids: new UntypedFormControl (row.dep_parts_ids,[]),
    });
  }

  // getResourceRowId():number{
  //   let current_row_id:number=this.resource_row_id;
  //   this.resource_row_id++;
  //   return current_row_id;
  // }


  // refreshProductsTableColumns(){
  //   this.displayedResourcesColumns=[];
  //   setTimeout(() => { 
  //     this.formResourceTableColumns();
  //   }, 1);
  // }

  
  openDialogProductCategoriesSelect(selection:string, destination:string){
    let reportOnIds:number[]=[];
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    selection, // Что выбираем (Категории - categories, товары и услуги - products)
        companyId:  this.formBaseInformation.get('company_id').value, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          reportOnIds.push(i.id);
        });
        if(reportOnIds.length>0)
          this.getProductsInfoListByIds(selection,reportOnIds,destination);
      }
    });
  }
  
  getProductsInfoListByIds(selection:string, ids: number[], destination:string){
    const body =  {
      companyId:this.formBaseInformation.get('company_id').value,         // предприятие, по которому идет запрос данных
      departmentId:0,                    // id отделения
      priceTypeId:0,                     // тип цены, по которому будут выданы цены
      reportOn:selection,                // по категориям или по товарам/услугам (categories, products)
      reportOnIds:ids                    // id категорий или товаров/услуг (того, что выбрано в reportOn)
    };
    this.http.post('/api/auth/getProductsInfoListByIds', body).subscribe(
      (data) => {   
        let filteredProducts=data as ProductSearchResponse[];
        if(filteredProducts.length>0){//несмотря на то, что сами id, по ним может ничего не вернуться, т.к. товары по запрошенным id могут быть не материальны (услуги), либо категории пустые/с нематериальными товарами
          if(destination=='employee_services')
            filteredProducts.map(i=>{
              this.addProductRow(i);
          });
          if(destination=='incoming_service'){
            if(!filteredProducts[0].is_material){
              this.formBaseInformation.get('incoming_service_id').setValue(filteredProducts[0].product_id);
              this.formBaseInformation.get('incoming_service_name').setValue(filteredProducts[0].name);
            } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.no_service')}});
          }
          setTimeout(() => {this.sortBy('name')},1);
        }
      },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  
  addProductRow(product:ProductSearchResponse){ 
    let thereSame:boolean=false;
    const control = <UntypedFormArray>this.formBaseInformation.get('userProducts');
    this.formBaseInformation.value.userProducts.map(i => 
    { // Существующий список не должен содержать одинаковые товары (услуги). Тут проверяем на это
      // Existed list shouldn't contain the same products (services). Here is checking about it
      if(+i['id'] == product.product_id)
      {
        thereSame=true;
      }
    });
    if(!thereSame){//такого товара в списке ещё нет. Добавляем в таблицу 
      control.push(this.formingJobtitleRowFromSearchForm(product.product_id,product.name));
    } 
  }  

  formingJobtitleRowFromSearchForm(id:number,name:string){
    return this._fb.group({
      // row_id: [this.getResourceRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      id:  new UntypedFormControl (id,[]),
      name: new UntypedFormControl (name,[]),
      // dep_parts_ids: new UntypedFormControl ([],[]),
    });
  }
  trackByIndex(i: any) { return i; }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.cln_table'),warning: translate('docs.msg.cln_table_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControl('userProducts').clear();
      }});  
  }
  formColumns(){
    this.displayedColumns=[];
    // if(this.editability)
        // this.displayedColumns.push('select');
    this.displayedColumns.push('name');
    // this.displayedColumns.push('dep_parts');
    if(this.editability/* && this.showSearchFormFields*/)
      this.displayedColumns.push('delete');
  }
  refreshTableColumns(){
    this.displayedColumns=[];
    setTimeout(() => { 
      this.formColumns();
    }, 1);
  }

  deleteTableRow(row: any,index:number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_prod_item'),
        warning: translate('docs.msg.del_prod_quer',{name:row.name})+'?',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const control = <UntypedFormArray>this.formBaseInformation.get('userProducts');
          control.removeAt(index);
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  sortBy(FieldName: string) {
    console.log(this.myItems.value, FieldName);
    this.myItems.setValue(this.myItems.value.sort((a, b) => {
      // alert(a[FieldName]+', '+b[FieldName])
      const nameA = a[FieldName].toUpperCase(); // ignore upper and lowercase
      const nameB = b[FieldName].toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    }));
  }
  get myItems(): UntypedFormArray {
    return this.formBaseInformation.get('userProducts') as UntypedFormArray;
  }
  onClickSelectIncomingService(){
    this.openDialogProductCategoriesSelect('products','incoming_service');
  }

  onClickDeleteIncomingService(){
    this.formBaseInformation.get('incoming_service_id').setValue(null);
    this.formBaseInformation.get('incoming_service_name').setValue('');
  }

  //  ***************** Counterparty (cagent) ******************

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
  
  onSelectCagent(id:number,name:string){
    this.formBaseInformation.get('counterparty_id').setValue(+id);
    // this.formBaseInformation.get('counterparty_name').setValue(name);
  }
  
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('counterparty_id').setValue(null);
      // this.formBaseInformation.get('counterparty_name').setValue('');
  }};     
  
  getCagentsList(){ //заполнение Autocomplete
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

  is_employee_toggle(event: MatSlideToggleChange) {
    if(!event.checked){
      this.formBaseInformation.get('is_currently_employed').setValue(false);
      this.formBaseInformation.get('is_display_in_employee_list').setValue(false);
      
      // this.formBaseInformation.get('incoming_service_id').setValue(null);
      // this.formBaseInformation.get('incoming_service_name').setValue('');
      // this.formBaseInformation.get('job_title_id').setValue(null);
      // this.formBaseInformation.get('job_title_name').setValue('');
      // this.formBaseInformation.get('counterparty_id').setValue(null);
      // this.searchCagentCtrl.setValue('');
    } else {
      this.formBaseInformation.get('is_currently_employed').setValue(true);
      this.formBaseInformation.get('is_display_in_employee_list').setValue(true);
    }
  }

  insertUserCagent(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
      width: '400px',
      data:
      { 
        head: translate('docs.tip.crte_usr_cgnt'),
        warning: translate('docs.msg.crte_usr_cgnt_q'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.http.post('/api/auth/insertUserCagent',
          {
            companyId:+this.formBaseInformation.get('company_id').value,
            displayName:this.formBaseInformation.get('name').value,
            name:this.formBaseInformation.get('fio_name').value,
            surname:this.formBaseInformation.get('fio_family').value,
            fatherName:this.formBaseInformation.get('fio_otchestvo').value,
            email:this.formBaseInformation.get('email').value
          }
        ).subscribe((data) => {
          let result:number=data as number;
          switch(result){
            case null:{// null возвращает если не удалось создать документ из-за ошибки
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.shipment')})}});
              break;
            }
            case -1:{//недостаточно прав
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_oper') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.shipment')})}});
              break;
            }
            default:{
              this.searchCagentCtrl.setValue(this.formBaseInformation.get('name').value);
              this.formBaseInformation.get('counterparty_id').setValue(result);
              this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
            }
          }
        },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
        );
      }
    });     
  }
}






