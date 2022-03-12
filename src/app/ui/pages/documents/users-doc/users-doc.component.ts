import { Component, OnInit } from '@angular/core';
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
import {MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';
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
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: string;
  name_rus: string;
}
@Component({
  //changeDetection: ChangeDetectionStrategy.OnPush, // Using this just to avoid the expression changed error. Please use this if required.
  selector: 'app-users-doc',
  templateUrl: './users-doc.component.html',
  styleUrls: ['./users-doc.component.css'],
  providers: [LoadSpravService,
              {provide: MAT_DATE_LOCALE, useValue: 'ru'},
              {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
              {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class UsersDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedUserGroupList: any [];//для групп пользователей

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
  
  spravSysTimeZones: idAndName[] = [];// массив, куда будут грузиться все зоны
  filteredSpravSysTimeZones: Observable<idAndName[]>; //массив для отфильтрованных зон

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    private _router:Router,
    private loadSpravService:   LoadSpravService,
    public MessageDialog: MatDialog,
    public dialogCreateDepartment: MatDialog,
    private _snackBar: MatSnackBar
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
      time_zone_name: new FormControl      ('',[]),
      time_zone_id: new FormControl      (30,[Validators.required]),
      vatin: new FormControl      ('',[Validators.maxLength(12), Validators.minLength(12),Validators.pattern('^[0-9]{12}$')]),
      selectedUserDepartments: new FormControl([],[]),
      userGroupList: new FormControl      ([],[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl      ('',[]),
      master: new FormControl      ('',[]),
      creator: new FormControl      ('',[]),
      changer: new FormControl      ('',[]),
      company: new FormControl      ('',[]),
      date_time_created: new FormControl      ('',[]),
      date_time_changed: new FormControl      ('',[]),
    });
      //слушалка наизменение поля Часовой пояс
    this.filteredSpravSysTimeZones = this.formBaseInformation.get('time_zone_name').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value))
    );
    
    this.getSpravSysTimeZones();
    this.getSetOfPermissions();
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
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
  }

  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
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


  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.doFilterCompaniesList();
                  this.setDefaultCompany();
                }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
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
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateUser', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Пользователь сохранён", "Закрыть");
                        },
                error => console.log(error),
            );
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
                  this.formBaseInformation.get('time_zone_id').setValue(documentResponse.time_zone_id);
                  this.formBaseInformation.get('vatin').setValue(documentResponse.vatin);

                  this.getDepartmentsList(this.formBaseInformation.get('company_id').value);  
                  this.getUserGroupListByCompanyId(this.formBaseInformation.get('company_id').value);
                  this.updateValuesSpravSysTimeZones(); 
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
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
            case  null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
            case  -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
            case -10:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Пользователь с таким логином уже есть в системе"}});break;}
            case -11:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Пользователь с таким e-mail уже есть в системе"}});break;}
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
              this.openSnackBar("Пользователь создан", "Закрыть");
            }
          }
        },
        error => {this.isSignUpFailed = true;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.message}})
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

  //фильтрация при каждом изменении в поле Часовой пояс
  private _filter(value: string): idAndName[] {
    const filterValue = value.toLowerCase();
    return this.spravSysTimeZones.filter(option => option.name_rus.toLowerCase().includes(filterValue));
  }
  getSpravSysTimeZones():void {    
    this.http.post('/api/auth/getSpravSysTimeZones', {})  // 
    .subscribe((data) => {this.spravSysTimeZones = data as any[];
    this.updateValuesSpravSysTimeZones(); },
    error => console.log(error));
    }
  //если значение уже выбрано (id загрузилось), надо из массива объектов найти имя, соответствующее этому id 
  updateValuesSpravSysTimeZones(){
    if(+this.formBaseInformation.get('time_zone_id').value!=0)
      {
        this.spravSysTimeZones.forEach(x => {
          if(x.id==this.formBaseInformation.get('time_zone_id').value){
            this.formBaseInformation.get('time_zone_name').setValue(x.name_rus);
          }
        })
      } 
      else //иначе обнулить поля id и имени. Без этого при установке курсора в поле список выскакивать не будет (х.з. почему так)
      {
        this.formBaseInformation.get('time_zone_name').setValue('');
        this.formBaseInformation.get('time_zone_id').setValue('');
      }
  }
  //вызывается из html. необходима для сброса уже имеющегося значения. когда имя стирается, в id установится 0 
  checkEmptyTimeZoneField(){
    if( this.formBaseInformation.get('time_zone_name').value.length==0){
      this.formBaseInformation.get('time_zone_id').setValue('');
    }
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
}






