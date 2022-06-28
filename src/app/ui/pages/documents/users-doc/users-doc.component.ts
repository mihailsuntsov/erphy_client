import { Component, EventEmitter, OnInit, Output } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { map, startWith } from 'rxjs/operators';
import { translate } from '@ngneat/transloco'; //+++

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

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
status_account: string;
status_account_name: string;
status_employee: string;
status_employee_name: string;
additional: string;
languageId: number;
localeId: number;
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
  providers: [LoadSpravService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class UsersDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedUserGroupList: any [];//для групп пользователей
  spravSysLanguages: IdAndName[] = [];                // here will be loaded all languages
  spravSysLocales  : IdAndName[] = [];                // here will be loaded all locales

  visBtnUpdate = false;

  
  id: number=0;// id документа
  myCompanyId:number=0;
  myId:number=0;

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
  
  suffix:string = "en"; // суффикс 
  locale:string = "en-uk"; // локаль 

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    private _router:Router,
    private loadSpravService:   LoadSpravService,
    public MessageDialog: MatDialog,
    public dialogCreateDepartment: MatDialog,
    private _snackBar: MatSnackBar,
    private _adapter: DateAdapter<any>
    ){
    console.log(this.activateRoute);
    if(activateRoute.snapshot.params['id'])
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0
   }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      name: new FormControl      ('',[Validators.required]),
      company_id: new FormControl      ('',[Validators.required]),
      address: new FormControl      ('',[]),
      additional: new FormControl      ('',[]),
      username: new FormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.minLength(4),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      email: new FormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.email]),
      password: new FormControl ({ value: '', disabled: (+this.id>0)},[Validators.required,Validators.minLength(6),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      fio_family: new FormControl      ('',[Validators.required]),
      fio_name: new FormControl      ('',[Validators.required]),
      fio_otchestvo: new FormControl      ('',[]),
      sex: new FormControl      ('',[]),
      date_birthday: new FormControl      ('',[]),
      status_account: new FormControl      ('2',[]),
      status_employee: new FormControl      ('',[]),
      timeZoneName: new FormControl      ('',[]),
      vatin: new FormControl      ('',[Validators.maxLength(12), Validators.minLength(12),Validators.pattern('^[0-9]{12}$')]),
      selectedUserDepartments: new FormControl([],[]),
      userGroupList: new FormControl      ([],[]),      
      timeZoneId: new FormControl  (24,[]),
      localeId: new FormControl      (4,[]),
      languageId: new FormControl    (1,[]),
      localeName: new FormControl      ('',[]),
      languageName: new FormControl    ('',[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl           ('',[]),
      master: new FormControl       ('',[]),
      creator: new FormControl      ('',[]),
      changer: new FormControl      ('',[]),
      company: new FormControl      ('',[]),
      date_time_created: new FormControl      ('',[]),
      date_time_changed: new FormControl      ('',[]),
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
  }

  setBaseDataParameter(parameterName:string,parameterValue:any){
    if(parameterValue)
      this.formBaseInformation.get(parameterName).setValue(parameterValue);
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
  getUserGroupListByCompanyId(company: number){
    this.receivedUserGroupList=null;
    this.loadSpravService.getUserGroupListByCompanyId(company)
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
    this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.getDepartmentsList(+this.formBaseInformation.get('company_id').value);
    this.getUserGroupListByCompanyId(this.formBaseInformation.get('company_id').value);
    this.refreshPermissions();
  }
  
  onCompanyChange(){
    this.formBaseInformation.get('selectedUserDepartments').setValue([]);
    this.getDepartmentsList(+this.formBaseInformation.get('company_id').value);
    this.getUserGroupListByCompanyId(this.formBaseInformation.get('company_id').value);
    this.refreshPermissions();
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
    return this.http.post('/api/auth/updateUser', this.formBaseInformation.value)
    .subscribe(
      (data) => {let result=data as any;
        switch(result){
          case 1:{this.getData(); this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));break;} 
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
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
                  this.formBaseInformation.get('status_account').setValue(documentResponse.status_account);
                  this.formBaseInformation.get('date_birthday').setValue(documentResponse.date_birthday ? moment(documentResponse.date_birthday,'DD.MM.YYYY'):"");
                  this.formBaseInformation.get('additional').setValue(documentResponse.additional);
                  this.formBaseInformation.get('userGroupList').setValue(documentResponse.userGroupsId);

                  this.getDepartmentsList(this.formBaseInformation.get('company_id').value);  
                  this.getUserGroupListByCompanyId(this.formBaseInformation.get('company_id').value);




                  
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  onSubmit() {
    if( (this.formBaseInformation.get("name").value!="") && 
        (this.formBaseInformation.get("username").value!="") && 
        (this.formBaseInformation.get("email").value!="") && 
        (this.formBaseInformation.get("password").value!="")&& (!this.formBaseInformation.invalid))
    {
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
        },
        error => {this.isSignUpFailed = true;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.message}})
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


  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

}






