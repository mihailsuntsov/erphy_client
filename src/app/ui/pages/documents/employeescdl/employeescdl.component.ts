import { Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { UserLegalInfoComponent } from '../../../../modules/user-legal-info/user-legal-info.component';
import { PaymentSelectComponent } from '../../../../modules/payment-select/payment-select.component';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FastSceduleComponent } from './fastscedule.component';
const MY_FORMATS = MomentDefault.getMomentFormat();
import { LOCALE_ID, Inject } from '@angular/core';
// import moment from 'moment';
const moment = MomentDefault.getMomentDefault();


interface EmployeeScedule {
  name: string;       // Employee's name
  photo_link: string; // link to the picture of employee
  jobtitle: string;   // Job title of employee
  days: SceduleDay[]; // days array
  departments:  IdAndName[]; 
  employee_services: IdAndName[];
}
interface SceduleDay {
  id:   number;  
  name: string;         // day name in format DDMMYYYY like '25042024'
  date: string;         // day date in format DD.MM.YYYY like '25.04.2024'
  is_changed: boolean;  // only days with is_changed = true will be saved in database
  workshift: Workshift; // this object describes work shift
  vacation: Vacation;   // this object describes any type of vacation
}
interface Workshift{
  id:   number;  
  depparts: number[]; // set of department parts  
  time_from: string;  // time of work shift start
  time_to: string;    // time of work shift end
  breaks: Break[],    // breaks
}
interface Break{
  id:   number;  
  time_from: string;  // time of work shift start
  time_to: string;    // time of work shift end
  paid: boolean;      // is break paid by employer
  precent: number;    // 1-100
}
interface Vacation{
  id:   number;  
  name: string;
  is_paid: boolean;
  payment_per_day: number;
}

interface Department{
  department_id: number;
  department_name: string;
  parts: Deppart[];
}
interface Deppart{
  id:number;
  name: string;
  description: string;
  is_active: boolean;
  deppartProducts:IdAndName[];
}
interface IdAndName {
  id: number;
  name:string;
}

@Component({
  selector: 'app-employeescdl',
  templateUrl: './employeescdl.component.html',
  styleUrls: ['./employeescdl.component.css'],
  providers: [LoadSpravService, CommonUtilitesService, Cookie,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class EmployeeScdlComponent implements OnInit {

  receivedCompaniesList: IdAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  myId:number=0;
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedDepartmentsWithPartsList: Department [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  receivedWorkShiftsList: any[]=[]; // array of previously saved work shifts templates
  receivedVacationsList: any[]=[]; // array of previously saved vacations templates
  day_type:string = 'workshift'; //   type of the day: workshift or vacation
  selectedWorkShiftTemplateId: number = null;
  selectedVacationTemplateId:  number = null;
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)
  timeFormat:string='24';   //12 or 24
  displayedColumnsBreaks:string[] = [];//columnss of the table of work shift breaks
  displayedColumns:string[] = [];//columnss of the table with days of scedule
  displayedColumnsDates:string[] = [];
  displayedColumnsDayNames:string[] = [];
  gettingTableData: boolean = false;//идет загрузка товарных позиций
  shift_time_from_value: number=0; // start time of shift, time stamp like 946728000000
  shift_time_to_value: number=0; // end timof shift, time stamp like 946728000000
  shiftAndBreaksTimeArray: number[]=[];
  // daysSelectingMode: boolean = false;//идет загрузка товарных позиций
  settingsGeneral:any;
  userSettings:any;
  dateFormat:string = 'YYYY-MM-DD'; // user's format of the date
  suffix:string = "en"; // language suffix 
  table_dates: string[] = [];       // array of dates (in format dateFormat) between date range dateFrom and dateTo
  table_dates_days: string[] = [];  // array of names of days of week in accordance of table_dates
  servicesList: string[] = []; // list of services that will be shown in an information panel of employee or department part
  departmentsList: string[] = []; // list of departments that will be shown in an information panel of employee
  colorsDataBase:string[]=['DarkMagenta','DarkCyan','Chocolate','ForestGreen','Navy','MediumOrchid','Brown','MediumVioletRed','Olive','Indigo','DarkRed','SlateBlue','DarkOliveGreen','Crimson','SteelBlue','SteelBlue','DarkMagenta','DarkCyan','Chocolate','ForestGreen','Navy','MediumOrchid','Brown','MediumVioletRed','Olive','Indigo','DarkRed','SlateBlue','DarkOliveGreen','Crimson','SteelBlue','SteelBlue','DarkMagenta','DarkCyan','Chocolate','ForestGreen','Navy','MediumOrchid','Brown','MediumVioletRed','Olive','Indigo','DarkRed','SlateBlue','DarkOliveGreen','Crimson','SteelBlue','SteelBlue']
  colors:string[]=[];
  maxSceduleDays:number=366;
  sceduleChanged:boolean=false;
  //Формы
  queryForm:any;//форма для отправки запроса 
  scheduleData: EmployeeScedule[];
  gettingSceduleData:boolean=false;  
  workShiftForm: any; // form for work shift
  vacationForm: any;  // form for vacation


  needAgainOfAfterChangeFiltersApiCalls:boolean=false;
  waitingOfAfterChangeFiltersApiCalls:boolean=false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  // selectionFilterOptions = new SelectionModel<IdAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  // optionsIds: IdAndName [];
  // displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  // @ViewChild(MatSelect, { static: false }) mySelect: MatSelect;

  private scrollTopBeforeSelection: number;

  constructor(
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public ConfirmDialog: MatDialog, 
    private fastSceduleComponent: MatDialog,
    public deleteDialog: MatDialog,
    public cu: CommonUtilitesService,
    private _fb: UntypedFormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
    private service: TranslocoService,
    private _adapter: DateAdapter<any>,
    @Inject(LOCALE_ID) public locale: string,
  ) { }
  ngOnInit() {

    this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
      companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
      dateFrom: new UntypedFormControl(moment().startOf('month'),[]),   // дата С
      dateTo: new UntypedFormControl(moment().endOf('month'),[]),     // дата По
      // depparts: new UntypedFormControl([],[]), // set of department parts
      departments: new UntypedFormControl([],[]), // set of departments IDs
      jobtitles: new UntypedFormControl([],[]), // set of job titles
    });

    this.workShiftForm = new UntypedFormGroup({ // form for working with work shift
      id: new UntypedFormControl      (null,[]),
      name: new UntypedFormControl ('',[Validators.minLength(1),Validators.maxLength(1000)]),
      depparts: new UntypedFormControl([],[Validators.required]), // set of department parts        
      time_from: new UntypedFormControl     ('',[Validators.required]),
      time_to: new UntypedFormControl     ('',[Validators.required]),
      // time_from_value: new UntypedFormControl     (0,[Validators.required]),
      // time_to_value: new UntypedFormControl     (0,[Validators.required]),
      breaks: new UntypedFormArray([]),
    });

    this.vacationForm = new UntypedFormGroup({ // form for working with vacations
      id: new UntypedFormControl      (null,[]),
      name: new UntypedFormControl ('',[Validators.required, Validators.minLength(1), Validators.maxLength(1000)]),
      is_paid: new UntypedFormControl     (false,[]),
      payment_per_day:  new UntypedFormControl (this.numToPrice(0,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
    });

    if(Cookie.get('employeescdl_companyId')=='undefined' || Cookie.get('employeescdl_companyId')==null)     
    Cookie.set('employeescdl_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('employeescdl_companyId')=="0"?"0":+Cookie.get('employeescdl_companyId'));

    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');      
    this.getBaseData('accountingCurrency');  
    this.getBaseData('dateFormat');     
    this.getBaseData('timeFormat');    
    this.getBaseData('suffix');
    this.getBaseData('locale');
    this.getCompaniesList();
    this.getSettingsGeneral();
    this.dateFormat=this.dateFormat.replace('FMDD','DD').replace('FMMM','MM'),//FMDD. FMMM. YYYY. is a PostgreSQL format for Serbian language. If not to replace -> Invalid date error
    moment.locale(this.locale);
    // this.getSettings();
    // this._adapter.get
    this.mixColors();
  }
  // ngAfterViewInit(): void {
  //   setTimeout(() => { 
      
  //     // this.mySelect.openedChange.subscribe((open) => {
  //     //   if (open) {
  //     //     alert(111)
  //     //     this.mySelect.panel.nativeElement.addEventListener(
  //     //       'scroll',
  //     //       (event) => (this.scrollTopBeforeSelection = event.target.scrollTop)
  //     //     );
  //     //   }
  //     // });
    
  //     // this.mySelect.optionSelectionChanges.subscribe(() => {
  //     //   this.mySelect.panel.nativeElement.scrollTop = this.scrollTopBeforeSelection;
  //     // });

  //     (<any>this.mySelect).baseonselect = (<any>this.mySelect)._onSelect;
  //     (<any>this.mySelect)._onSelect = (ev, isUserInput) => {
  //       alert(111);
  //        (<any>this.mySelect).baseonselect(ev, false);
  //     };
  //   }, 3000);
    

  // }
  afterChangeFiltersApiCalls(){
    if(!this.waitingOfAfterChangeFiltersApiCalls){ // если не в режиме отложенного срабатывания / if not in delayed triggering mode
      this.waitingOfAfterChangeFiltersApiCalls=true; // ставим в режим отложенного срабатывания / delayed triggering mode is "ON"
      // console.log('!this.waitingOfAfterChangeFiltersApiCalls before timeOut()')
      setTimeout(() => { //ожидание / delayed triggering
        // отложенное срабатывание случилось: / delayed triggering happened:
        // отключаем режим отложенного срабатывания / disable delayed triggering mode
        this.waitingOfAfterChangeFiltersApiCalls=false;        
        if(!this.needAgainOfAfterChangeFiltersApiCalls){ // если повторные запросы во время ожидания больше не "прилетали" / if repeated requests no longer arrived
          //выполняем код, частоту которого нужно ограничить / execute code whose frequency needs to be limited
          this.clickApplyFilters();
        } else {// если повторные запросы "прилетали" во время ожидания / if repeated requests arrived while waiting
          // сбросили отметку о наличии повторных запросов / cleared the mark for repeated requests
          this.needAgainOfAfterChangeFiltersApiCalls=false;
          // обратились к данной функции снова, чтобы включить отложенное срабатывание / turned to this function again to enable delayed triggering (recursive call)
          this.afterChangeFiltersApiCalls();
        }
      }, 800);
      // режим отложенного срабатывания, но продолжают "прилетать" повторные запросы / delayed triggering mode, but repeated requests continue to arrive
    } else this.needAgainOfAfterChangeFiltersApiCalls=true; 
  } 
  get formValid() {
    if(this.queryForm!=undefined)
      return (this.queryForm.valid);
    else return true;
  }
  getSettings(){
    this.http.get('/api/auth/getMySettings')
      .subscribe(
          data => { 
            this.userSettings=data as any;
            this._adapter.setLocale(this.userSettings.locale?this.userSettings.locale:'en-gb')        // setting locale in moment.js
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=58')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
      );
  }

  getCRUD_rights(){
    this.allowToView =   this.permissionsSet.some(  function(e){return(e==702)});
    this.allowToUpdate = this.permissionsSet.some(  function(e){return(e==703)});
    this.editability=this.allowToUpdate;
  }

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getMoment(date){
    return moment(date);
  }
  get datesExistAndValid(){
    return(this.getMoment(this.queryForm.dateFrom).isValid() && this.getMoment(this.queryForm.dateTo).isValid());
  }

  getData(){
    console.log('datesExistAndValid',this.datesExistAndValid)
    if(this.datesExistAndValid && this.queryForm.get('departments').value.length>0 && this.queryForm.get('jobtitles').value.length>0)
      if(this.allowToView)
      {
        this.getEmployeesWorkSchedule();
      } else {this.gettingSceduleData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
  }
 
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList()
              .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.getSetOfPermissions();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
            );
    else this.getSetOfPermissions();
  }  

  getMyId(){ //+++
    if(+this.myId==0)
     this.loadSpravService.getMyId()
      .subscribe(
          (data) => {this.myId=data as any;
            this.getMyCompanyId();},
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
      );
    else this.getMyCompanyId();
  }

  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    else this.setDefaultCompany();
  } 

  setDefaultCompany(){
    if(Cookie.get('employeescdl_companyId')=='0'||!this.companyIdInList(Cookie.get('employeescdl_companyId'))){
      this.queryForm.get('companyId').setValue(this.myCompanyId);
      Cookie.set('employeescdl_companyId',this.queryForm.get('companyId').value);
    }
    this.getDepartmentsList();
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    this.getCRUD_rights();
    this.setDefaultTime();
    this.formColumnsBreaks();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.queryForm.get('companyId').value,false)
    .subscribe(
      (data) => {this.receivedDepartmentsList=data as any [];
        this.selectAllDepartments();
        this.getData();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}, //+++
    );
  }

  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
                      // this.selectAllCheckList('depparts','queryForm');
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getJobtitleList(){ 
    return this.http.get('/api/auth/getJobtitlesList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesList=data as any [];
                      this.selectAllCheckList('jobtitles','queryForm');
                      this.getData();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}

  clickApplyFilters(){

    if(this.sceduleChanged){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',
          data:
          { 
            head: translate('docs.msg.there_unsaved_cngs'),
            query: translate('docs.msg.want_to_contnue_q'),
            warning: '',
          },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){

          let diff = this.queryForm.get('dateTo').value.diff(this.queryForm.get('dateFrom').value, 'days');
          // console.log('diff',diff)
          if((diff+1)>this.maxSceduleDays){
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.warning'),message:translate('docs.msg.too_many_days',{cnt:this.maxSceduleDays})}});
            this.queryForm.get('dateTo').setValue(moment(this.queryForm.get('dateFrom').value, "DD.MM.YYYY").add(this.maxSceduleDays-1, 'days'));
          }
      
          // if date to less than date from
          if(diff < 0) this.queryForm.get('dateTo').setValue(this.queryForm.get('dateFrom').value);
      
          this.getData();

          this.sceduleChanged=false;
        }
      });       
    } else this.getData();


    
    



  }

  onCompanySelection(){
    Cookie.set('employeescdl_companyId',this.queryForm.get('companyId').value);
    this.getDepartmentsList();
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    // this.getData();
  }

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  updateDocument(){ 
    this.normalizeDatesTimes();
    this.http.post('/api/auth/updateEmployeeWorkSchedule', this.scheduleData)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            this.sceduleChanged=false;
            switch(result){
              case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save'))}});
                this.getData();
                break;
              }
              case -1:{// недостаточно прав
                       // not enought permissions
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              default:{// Успешно
                this.getData();
                this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
              }
            }                  
          },
          error => {this.sceduleChanged=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }

  normalizeDatesTimes(){
    this.scheduleData.map(employeeScedule =>{
      employeeScedule.days.map(sceduleDay => {
        if(sceduleDay.workshift){
          sceduleDay.workshift.time_from = this.timeTo24h(sceduleDay.workshift.time_from);
          sceduleDay.workshift.time_to = this.timeTo24h(sceduleDay.workshift.time_to);
          if(sceduleDay.workshift.breaks && sceduleDay.workshift.breaks.length>0){
            sceduleDay.workshift.breaks.map(break_ => {
              break_.time_from = this.timeTo24h(break_.time_from);
              break_.time_to = this.timeTo24h(break_.time_to);
            });
          }
        }
      });
    });
  }

  getEmployeesWorkSchedule(){ 
    this.gettingSceduleData=true;
    const querydata = {
                        companyId:    this.queryForm.get('companyId').value,
                        dateFrom:     moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY').add(-1,'day').format('DD.MM.YYYY'),
                        dateTo:       moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY').add(1,'day').format('DD.MM.YYYY'),
                        departments:  this.queryForm.get('departments').value,
                        jobtitles:    this.queryForm.get('jobtitles').value,
    }
    this.http.post('/api/auth/getEmployeesWorkSchedule', querydata)
      .subscribe(
          (data) => {
            this.gettingSceduleData=false;
            if(!data){
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
            }
            this.scheduleData=data as EmployeeScedule[];
            this.formColumns();
          },
          error => {console.log(error);this.gettingSceduleData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
    );
  }
  
  getSettingsGeneral(){
    return this.http.get('/api/public/getSettingsGeneral')
      .subscribe(
          (data) => {   
              this.settingsGeneral=data as any;
          },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
          );
  }
  selectAllDepartments(){
    let departments:number[]=[];
    this.receivedDepartmentsList.map(i=>{departments.push(i.id);});
    this.queryForm.get('departments').setValue(departments);
    this.uncheckPlacesOfWork(); // deselect department parts that are not contained in the selected departments
  }
  // unselectAllDepartments(){
    // this.queryForm.get(field).setValue([])
  // }
  selectAllCheckList(field:string, form:string){
    let depparts = field=='depparts'?this.getAllDeppartsIds():this.getAllJobtitlesIds();
    form=='queryForm'?this.queryForm.get(field).setValue(depparts):this.workShiftForm.get(field).setValue(depparts);
    this.uncheckPlacesOfWork(); // deselect department parts that are not contained in the selected departments
  }
  
  selectAllDepPartsOneDep(dep_id:number, form:string){
    const depparts = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = form=='queryForm'?this.queryForm.get('depparts').value:this.workShiftForm.get('depparts').value;
    form=='queryForm'?this.queryForm.get('depparts').setValue(depparts.concat(ids_now)):this.workShiftForm.get('depparts').setValue(depparts.concat(ids_now));
    this.uncheckPlacesOfWork(); // deselect department parts that are not contained in the selected departments
  }

  unselectAllCheckList(field:string, form:string){
    form=='queryForm'?this.queryForm.get(field).setValue([]):this.workShiftForm.get(field).setValue([]);
    this.uncheckPlacesOfWork(); // deselect department parts that are not contained in the selected departments
  }

  unselectAllDepPartsOneDep(dep_id:number, form:string){
    const ids_in_deppat = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = form=='queryForm'?this.queryForm.get('depparts').value:this.workShiftForm.get('depparts').value;
    form=='queryForm'?this.queryForm.get('depparts').setValue(ids_now.filter(e => !ids_in_deppat.includes(e))):this.workShiftForm.get('depparts').setValue(ids_now.filter(e => !ids_in_deppat.includes(e)));
  }

  getAllDeppartsIds():number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        depparts.push(deppart.id);
      })
    });
    return depparts;
  }  

  getAllJobtitlesIds():number[]{
    let jt:number[]=[];
    this.receivedJobtitlesList.map(jobtitle=>{
      jt.push(jobtitle.jobtitle_id);
    });
    return jt;
  }  

  getAllDeppartsIdsOfOneDep(dep_id:number):number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      // console.log('department.department_id==dep_id',department.department_id==dep_id)
      if(department.department_id==dep_id)
        department.parts.map(deppart=>{
          depparts.push(deppart.id);
        })
    });
    // console.log('depparts',depparts)
    return depparts;
  }

  setDefaultTime(){
    this.workShiftForm.get('time_from').setValue(moment('08:00', 'hh:mm'). format('HH:mm'));
    this.workShiftForm.get('time_to').setValue(moment('18:00', 'hh:mm'). format('HH:mm'));
    /*
    On create or update work shift need to set the time format to the HH:mm if currently it is AM/PM format

    if(this.timeFormat=='12') {
      this.workShiftForm.get('time_from').setValue(moment(this.workShiftForm.get('time_from').value, 'hh:mm A'). format('HH:mm'));
      this.workShiftForm.get('time_to').setValue(moment(this.workShiftForm.get('time_to').value, 'hh:mm A'). format('HH:mm'));
    }
    */
  }

  formColumnsBreaks(){
    this.displayedColumnsBreaks=[];
    this.displayedColumnsBreaks.push('time_from');
    this.displayedColumnsBreaks.push('time_to');
    // this.displayedColumnsBreaks.push('paid');
    // this.displayedColumnsBreaks.push('precent');
    if(this.editability)
      this.displayedColumnsBreaks.push('delete');
  }

  formColumns(){
    this.displayedColumns=['employee'];
    this.displayedColumnsDates=[];
    this.displayedColumnsDayNames=[];
    const dates = this.getTextDateRange(moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY').add(-1,'day').format(this.dateFormat), moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY').add(1,'day').format(this.dateFormat));
    const days =  this.getTextDaysRange(moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY').add(-1,'day').format(this.dateFormat), moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY').add(1,'day').format(this.dateFormat));
    let indx=0;
    console.log('days',days);
    dates.map(i=>{
      this.displayedColumns.push(i);
      this.displayedColumnsDates.push(i);
      this.displayedColumnsDayNames.push(days[indx]);
      indx++;
    });
    console.log(this.displayedColumns);
  }

  getControlTablefield(){ 
    const control = <UntypedFormArray>this.workShiftForm.get('breaks');
    return control;
  }
//*****************************************************************************************************************************************/
//***********************************************            COMMON UTILITES        *******************************************************/
//*****************************************************************************************************************************************/
  numberOnly(event): boolean {
  const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
  if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  //Конвертирует число в строку типа 0.00 например 6.40, 99.25
  numToPrice(price:number,charsAfterDot:number) {
    //конертим число в строку и отбрасываем лишние нули без округления
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + charsAfterDot + "})?", "g")
    const a = price.toString().match(reg)[0];
    //находим положение точки в строке
    const dot = a.indexOf(".");
    // если число целое - добавляется точка и нужное кол-во нулей
    if (dot === -1) { 
        return a + "." + "0".repeat(charsAfterDot);
    }
    //если не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  } 
  //заменяет запятую на точку при вводе цены или количества в заданной ячейке
  commaToDotInVacationForm(fieldName:string){
    this.vacationForm.get(fieldName).setValue(this.vacationForm.get(fieldName).value.replace(",", "."));
  }
  //для проверки в таблице с вызовом из html
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
  // get isTimeNextDay(){
  //   var beginningTime = moment('8:45am', 'h:mma');
  //   var endTime = moment('9:00am', 'h:mma');
  //   return (beginningTime.isBefore(endTime))
  // }
  trackByIndex(i: any) { return i; }

  addBreakRow(){
    let thereOverlapping:boolean=false;
    // this.workShiftForm.value.breaks.map(i => 
    // { // Cписок не должен содержать пересекающиеся временные отрезки
    //   // The list should not contain overlapping time periods
    //   if(false)
    //   {
    //     this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
    //     thereOverlapping=true; 
    //   }
    // });
    if(!thereOverlapping){
      const control = this.getControlTablefield();
      control.push(this.formingBreakRowFromInterface());
    }
  }
  formingBreakRowFromInterface() {
    return this._fb.group({
      id: new UntypedFormControl (null,[]),
      time_from:  new UntypedFormControl (moment('12:00', 'hh:mm'). format('HH:mm'),[]),
      time_to:  new UntypedFormControl (moment('13:00', 'hh:mm'). format('HH:mm'),[]),
      // time_from_value: new UntypedFormControl     (0,[Validators.required]),
      // time_to_value: new UntypedFormControl     (0,[Validators.required]),
      paid: new UntypedFormControl (false,[]),
      precent: new UntypedFormControl (0,[Validators.required,Validators.pattern('^[0-9]{1,3}$'),Validators.max(100),Validators.min(0)]),
    });
  }
  formingBreakRowFromTable(time_from:string, time_to:string, paid:boolean, precent:number) {
    return this._fb.group({
      id: new UntypedFormControl (null,[]),
      time_from:  new UntypedFormControl (moment(this.timeTo24h(time_from), 'hh:mm'). format('HH:mm'),[]),
      time_to:  new UntypedFormControl (moment(this.timeTo24h(time_to), 'hh:mm'). format('HH:mm'),[]),
      paid: new UntypedFormControl (paid,[]),
      precent: new UntypedFormControl (precent,[Validators.required,Validators.pattern('^[0-9]{1,3}$'),Validators.max(100),Validators.min(0)]),
    });
  }
  clearTable(): void {
    const control = this.getControlTablefield();
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.cln_table'),warning: translate('docs.msg.cln_table_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        control.clear();
      }});  
  }
  refreshTableColumns(){
    this.displayedColumnsBreaks=[];
    setTimeout(() => { 
      this.formColumnsBreaks();
    }, 1);
  }
  deleteTableRow(row: any,index:number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.deleting'),
        warning: translate('docs.msg.delete_this_row'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
          const control = <UntypedFormArray>this.workShiftForm.get('breaks');
          control.removeAt(index);
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  get serviceDateFrom(){
    const format1 = "YYYY-MM-DD HH:mm";
    const date="2000-01-01 "+this.timeTo24h(this.workShiftForm.get('time_from').value)
    var date1 = new Date(date);
    return (date1.toUTCString()+' | '+moment(date1).format(format1));
  }

  get serviceDateTo(){
    const format1 = "YYYY-MM-DD HH:mm";
    const date="2000-01-"+(this.isTimeNextDay(this.workShiftForm.get('time_from').value, this.workShiftForm.get('time_to').value)?"02 ":"01 ")+this.timeTo24h(this.workShiftForm.get('time_to').value)
    var date1 = new Date(date);
    return (date1.toUTCString()+' | '+moment(date1).format(format1));
  }

  get isDateToNextDay(){
    // const format = "DD.MM.YYYY HH:mm"
    // var timeFrom = moment(this.workShiftForm.get('time_from').value, 'hh:mm');
    // var timeTo   = moment(this.workShiftForm.get('time_to').value, 'hh:mm');
    // console.log('timeFrom', timeFrom.valueOf());
    // console.log('timeTo  ', timeTo.valueOf());
    return (this.isTimeNextDay(this.workShiftForm.get('time_from').value, this.workShiftForm.get('time_to').value));
  }

  isTimeNextDay(timeFrom:string, timeTo:string):boolean{
    return (moment(this.timeTo24h(timeFrom), 'HH:mm').valueOf() >= moment(this.timeTo24h(timeTo), 'HH:mm').valueOf());
  }

  isTimeFormatAmPm(time:string){
    return((time.includes("AM") || time.includes("PM") || time.includes("утра") || time.includes("вечера")));
  }

  timeTo24h(time:string){
    // In ru locale MomentJs has 'утра' and 'вечера' instead of AM and PM
    // if current locale is ru - moment to convert string to time format needs to have string contained 'утра','вечера' instead of AM PM  
    if(this.locale=='ru') time=time.replace('PM','вечера').replace('AM','утра');
    return(this.isTimeFormatAmPm(time)?moment(time, 'hh:mm A').format('HH:mm'):time);
  }
  timeToAmPm(time:string){
    // in russian language momentJs returns 'утра' and 'вечера' instead of AM and PM
    return(this.isTimeFormatAmPm(time)?time:moment(time, 'HH:mm').format('hh:mm A').replace('утра','AM').replace('вечера','PM'));
  }

  //isBreakIntervalsHaveErrors():boolean{
    /*let trereAreErrors: boolean = false;

    if(this.isBreaksHaveMoreOneDayTransition()){
      trereAreErrors=true;
      return trereAreErrors;
    }
    this.getStartAndEndTimeShiftValues();
    this.fillTimeTableValue();*/
    /*
    let nextDayCounter:number=0; // There should be no more than one transition the next day like 22:00 - 06:00
    let day:string = '01'; 
    let isOverlap:boolean=false;
    let previousTimeTo = this.timeTo24h(this.workShiftForm.get('time_from').value);
    this.getControlTablefield().controls.map(currBreak=>{
      

      if(this.isTimeNextDay(previousTimeTo, this.timeTo24h(currBreak.get('time_from').value)))
        nextDayCounter++;        
      if(this.isTimeNextDay(this.timeTo24h(currBreak.get('time_from').value), this.timeTo24h(currBreak.get('time_to').value)))
        nextDayCounter++;
      
      

      console.log('time_from', this.timeTo24h(currBreak.get('time_from').value));
      console.log('time_to', this.timeTo24h(currBreak.get('time_to').value));
      console.log('previousTimeTo', previousTimeTo);
      console.log('nextDayCounter', nextDayCounter);

      previousTimeTo = this.timeTo24h(currBreak.get('time_to').value);
    })

    if(this.isTimeNextDay(previousTimeTo, this.timeTo24h(this.workShiftForm.get('time_to').value)))
        nextDayCounter++; 

    if(nextDayCounter>1) isOverlap=true;



    console.log('isOverlap', isOverlap);
    */
   // return trereAreErrors;
  //}

  // Breaks shouldn't have more than one time day transition, for example 23:00 - 01:00
  // isBreaksHaveMoreOneDayTransition(){
  //   let nextDayCounter:number=0;
  //   this.getControlTablefield().controls.map(currBreak=>{
  //     if(this.isTimeNextDay(this.timeTo24h(currBreak.get('time_from').value), this.timeTo24h(currBreak.get('time_to').value)))
  //     nextDayCounter++;
  //   });
  //   if(nextDayCounter>1)
  //     console.log('Breaks shouldn\'t have more than one time day transition, but there are '+nextDayCounter+' transitions')
  //   return nextDayCounter>1;
  // }

  // returns value of date & time like 946728000000
  // day can be 01 or 02, time in AM/PM or 24h
  getTimeValue(day:string,time:string):number{
    const format1 = "YYYY-MM-DD HH:mm";
    const date="2000-01-"+day+this.timeTo24h(time)
    var date1 = new Date(date);
    // console.log('date',date);
    // console.log('date1',date1);
    // console.log('moment.valueOf()',moment(date1, format1).valueOf());
    return moment(date1, format1).valueOf();
  }

  // calculate start and end time of shifts in the time stamp format like 946728000000
  getStartAndEndTimeShiftValues(){
    let day:string = '01 '; 
    this.shift_time_from_value=this.getTimeValue(day, this.workShiftForm.get('time_from').value);
    if(this.isTimeNextDay(this.workShiftForm.get('time_from').value, this.workShiftForm.get('time_to').value))
      day='02 ';
    this.shift_time_to_value=this.getTimeValue(day, this.workShiftForm.get('time_to').value);
  }

  // fillTimeTableValue(){
  //   let day:string = '01 '; 
  //   // console.log('fillTimeTableValue');
  //   this.getControlTablefield().controls.map(currBreak=>{
  //     if(this.isTimeNextDay(this.workShiftForm.get('time_from').value, this.timeTo24h(currBreak.get('time_from').value)))
  //       day='02 ';
  //     currBreak.get('time_from_value').setValue(this.getTimeValue(day, currBreak.get('time_from').value));
  //     currBreak.get('time_to_value').setValue(this.getTimeValue(day, currBreak.get('time_to').value));
  //   });
  // }

  get isOverlaps(){
    var isAscending = true;
    this.fillShiftAndBreaksTimeArray();
    for (var i=0, l=this.shiftAndBreaksTimeArray.length-1; i<l; i++)
    {
      // true if this is less than the next and all others so far have been true
      isAscending = isAscending && (this.shiftAndBreaksTimeArray[i] < this.shiftAndBreaksTimeArray[i+1]);
    }
    return !isAscending;
  }

  // collect all time values to the single array
  fillShiftAndBreaksTimeArray(){
    this.getStartAndEndTimeShiftValues();
    this.shiftAndBreaksTimeArray=[];
    let day:string = '01 '; 
    this.shiftAndBreaksTimeArray.push(this.shift_time_from_value);
    this.getControlTablefield().controls.map(currBreak=>{
      if(this.isTimeNextDay(this.workShiftForm.get('time_from').value, currBreak.get('time_from').value) && day=='01 ')
        day='02 ';
      this.shiftAndBreaksTimeArray.push(this.getTimeValue(day, currBreak.get('time_from').value));
      if(this.isTimeNextDay(currBreak.get('time_from').value, currBreak.get('time_to').value) && day=='01 ')
        day='02 ';
      this.shiftAndBreaksTimeArray.push(this.getTimeValue(day, currBreak.get('time_to').value));
    });
    this.shiftAndBreaksTimeArray.push(this.shift_time_to_value);
    // console.log('shiftAndBreaksTimeArray',this.shiftAndBreaksTimeArray);
  }

  createNewShift(){

  }

  updateShift(){

  }
  
  clearShiftForm(){
    // this.daysSelectingMode=false;
    // this.workShiftForm.reset();
    this.workShiftForm.get('id').setValue(null);
    this.workShiftForm.get('name').setValue('');
    this.workShiftForm.get('depparts').setValue([]);
    // this.workShiftForm.get('depparts').clear();
    // this.workShiftForm.get('depparts').markAsPristine();
    // this.workShiftForm.get('depparts').markAsUntouched();

    this.workShiftForm.get('time_from').setValue('08:00');
    this.workShiftForm.get('time_to').setValue('18:00');
    const control = this.getControlTablefield();
    control.clear();

    // const control1 = <UntypedFormArray>this.workShiftForm;
    // control1.clear();
  }
  // onClickWorkShiftDayAddBtn(){
  //   this.daysSelectingMode=!this.daysSelectingMode;
  // }
  
  //при изменении поля Цена в таблице товаров
  onChangePaymentOneDay(){
    this.commaToDotInVacationForm('payment_per_day');  // замена запятой на точку
  } 

  clearVacationForm(){
    // this.daysSelectingMode=false;
    // this.vacationForm.reset();
    this.vacationForm.get('id').setValue(null);
    this.vacationForm.get('name').setValue('');
    this.vacationForm.get('payment_per_day').setValue(this.numToPrice(0,2));
    this.vacationForm.get('is_paid').setValue(false);
  }
  
  createNewVacation(){

  }

  updateVacation(){

  }
  // onClickVacationAddBtn(){
  //   this.daysSelectingMode=!this.daysSelectingMode;
  // }
  onWorkshiftTemplateSelection(){

  }

  onVacationsSelection(){
    
  }

  getTextDateRange(firstDate:string, lastDate:string):string[] {
    if (moment(firstDate, this.dateFormat).isSame(moment(lastDate, this.dateFormat), 'day'))
      return [lastDate];
    let date = firstDate;
    // const dates = [date+', '+moment(date, this.dateFormat).format('dddd')];
    const dates = [date];
    // this.table_dates = [date];
    // this.table_dates_days = [moment(date, this.dateFormat).format('dddd')];
    do {
      date = moment(date, this.dateFormat).add(1, 'day').format(this.dateFormat);
      // dates.push(date+', '+moment(date, this.dateFormat).format('dddd'));
      dates.push(date);
      // this.table_dates.push(date);
      // this.table_dates_days.push(moment(date, this.dateFormat).format('dddd'))
    } while (moment(date, this.dateFormat).isBefore(moment(lastDate, this.dateFormat)));
    return dates;
  };
  getTextDaysRange(firstDate:string, lastDate:string):string[] {
    if (moment(firstDate, this.dateFormat).isSame(moment(lastDate, this.dateFormat), 'day'))
      return [moment(lastDate, this.dateFormat).format('dddd')];
    let date = firstDate;
    // const dates = [date+', '+moment(date, this.dateFormat).format('dddd')];
    const dates = [date];
    // this.table_dates = [date];
    let table_dates_days = [moment(date, this.dateFormat).format('dddd')];
    do {
      date = moment(date, this.dateFormat).add(1, 'day').format(this.dateFormat);
      table_dates_days.push(moment(date, this.dateFormat).format('dddd'))
    } while (moment(date, this.dateFormat).isBefore(moment(lastDate, this.dateFormat)));
    return table_dates_days;
  };
  // onGetTextDatesClick(){
  //   const dates = this.getTextDateRange(this.queryForm.get('dateFrom').value.format(this.dateFormat), this.queryForm.get('dateTo').value.format(this.dateFormat));
  //   console.log('dates: ', dates);
  //   // console.log('table_dates_days: ', this.table_dates_days);
  // }

  uncheckPlacesOfWork(){
    let allDeppartsOfSelectedDepartments:number[]=[];
    // let selectedDepparts:number[]=[];
    // let updatedDepparts:number[]=[];
    // let selectedDepartments:number[]=[];
    // selectedDepartments = this.queryForm.get('departments').value;
    // selectedDepartments.map(department=>{
    //   selectedDepartments.push(department)
    // })
    // console.log('queryForm.get(departments).value',this.queryForm.get('departments').value)
    // console.log('selectedDepartments',selectedDepartments);
    this.queryForm.get('departments').value.map(i=>{
      // console.log('i.id',i.id);
      allDeppartsOfSelectedDepartments=allDeppartsOfSelectedDepartments.concat(this.getAllDeppartsIdsOfOneDep(i));
    });
    // console.log('allDeppartsOfSelectedDepartments',allDeppartsOfSelectedDepartments);
    // const selectedDepparts:number[] = this.workShiftForm.get('depparts').value;
    // console.log('selectedDepparts',selectedDepparts)
    // const updatedDepparts = selectedDepparts.filter(id => allDeppartsOfSelectedDepartments.includes(id));
    // console.log('updatedDepparts',updatedDepparts)
    // this.workShiftForm.get('depparts').setValue(updatedDepparts);
    this.workShiftForm.get('depparts').setValue(this.workShiftForm.get('depparts').value.filter(
      id => allDeppartsOfSelectedDepartments.includes(id)
    ));
  }


  isDeppartBelongsToSelectedDepartments(deppartId:number){
    let allDeppartsOfSelectedDepartments:number[]=[];
    this.queryForm.get('departments').value.map(i=>{
      allDeppartsOfSelectedDepartments=allDeppartsOfSelectedDepartments.concat(this.getAllDeppartsIdsOfOneDep(i));
    });
    return(allDeppartsOfSelectedDepartments.includes(deppartId));
  }
  // isSelectedDeppartsBelongToEmployeeDepartments(employeeScedule:EmployeeScedule):boolean{
  //   let allEmployeeDepparts = 
  // }
  getAllEmployeeDepparts(employeeScedule:EmployeeScedule): number[]{
    let allEmployeeDepparts:number[]=[];
    employeeScedule.departments.map(department=>{
      allEmployeeDepparts=allEmployeeDepparts.concat(this.getAllDeppartsIdsOfOneDep(department.id));
    });
    return allEmployeeDepparts;
  }
  // workshift, vacation, both, undefined
  getDayType(row_index:number, col_index:number):string{
    let result = 'undefined';
    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];
    if(sceduleDay && sceduleDay.workshift && sceduleDay.vacation)
      result = 'both';
    if(sceduleDay && sceduleDay.workshift && !sceduleDay.vacation)
      result = 'workshift';
    if(sceduleDay &&  !sceduleDay.workshift && sceduleDay.vacation)
      result = 'vacation';
    return result;
  }

  deleteRecord(row_index:number, col_index:number, data_type:string){
    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];
    if(data_type=='workshift')  
      sceduleDay.workshift = null;
    else
      sceduleDay.vacation = null;
    //mark day as changed for backend
    sceduleDay.is_changed=true;
    //mark scedule as changed
    this.sceduleChanged=true;
  }

        // data type can be: workshift, vacation, undefined
  onDayClick(row_index:number, col_index:number, data_type:string, automatic=false){

    // console.log('row_index',row_index);
    // console.log('col_index',col_index);
    // console.log('data_type',data_type);
    // console.log('isOverlaps',this.isOverlaps);

    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];

    if((this.day_type=='workshift' && !this.workShiftForm.valid && (data_type=='undefined' || data_type=='vacation')) || (this.day_type=='vacation' && !this.vacationForm.valid && (data_type=='undefined')))
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.form_has_errors')}})
    else if ((data_type=='undefined'|| data_type=='vacation') && this.day_type=='workshift' && this.getControlTablefield().controls.length>0 && this.isOverlaps)
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.error.overlap_breaks_time')}})
    else if (
      (data_type=='undefined'|| data_type=='vacation') && 
      this.day_type=='workshift' && 
      this.isTimeOfShiftsOverlap(row_index, col_index, moment(this.timeTo24h(this.workShiftForm.get('time_from').value),'HH:mm'), moment(this.timeTo24h(this.workShiftForm.get('time_to').value),'HH:mm'))
    )
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.error.overlap_shifts_time')}})
    else
      if(data_type=='undefined'){ //  day is empty and user wants to add information into this day
          this.addInfoToSceduleDay(row_index, col_index, automatic);
      }else{ // if clicked day is vacation or work shift
        // const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];     
        this.editSceduleDay(row_index, col_index, data_type)
      }
  }

  // сравнивает время начала и окончания смены текущего дня с соседними днями на предмет наложения смены текущего дня на время смен соседних дней
  // compares the start and end times of the current day's work shift with neighboring days to see if the current day's shift overlaps with the shift time of neighboring days
  isTimeOfShiftsOverlap(cur_day_row_index, cur_day_col_index,startShiftTimeCurrDay:moment.Moment,endShiftTimeCurrDay:moment.Moment):boolean{
    const prevSceduleDay: SceduleDay = this.scheduleData[cur_day_row_index].days[cur_day_col_index-1];
    const nextSceduleDay: SceduleDay = this.scheduleData[cur_day_row_index].days[cur_day_col_index+1];
    console.log('prevSceduleDay',prevSceduleDay);
    console.log('nextSceduleDay',nextSceduleDay);
    const startShiftTimePrevDay = prevSceduleDay.workshift==null?null:moment(this.timeTo24h(prevSceduleDay.workshift.time_from), 'HH:mm');
    const endShiftTimePrevDay = prevSceduleDay.workshift==null?null:moment(this.timeTo24h(prevSceduleDay.workshift.time_to), 'HH:mm');
    const startShiftTimeNextDay = nextSceduleDay.workshift==null?null:moment(this.timeTo24h(nextSceduleDay.workshift.time_from), 'HH:mm');
    return(
      // yesterday's work shift ending in a current day, and current day work shift starting before ending yesterday's work shift          
      (endShiftTimePrevDay==null?false:(endShiftTimePrevDay<=startShiftTimePrevDay && startShiftTimeCurrDay<endShiftTimePrevDay))
      ||
      // current day's work shift ending in a tomorrow day, and tomorrow day work shift starting before ending current day's work shift          
      (startShiftTimeNextDay==null?false:(endShiftTimeCurrDay<=startShiftTimeCurrDay && startShiftTimeNextDay<endShiftTimeCurrDay))
    )
  }


  isArrayIncludesAllElementsOfAnotherArray(arr, arr2){
    return arr2.every(i => arr.includes(i));
  }

  // return: 
  // 'each'    If each part of the department to which an employee is assigned has services that the employee can provide
  //           Если каждая часть отделения, в которую назначается сотрудник, имеет услуги, которые сотрудник может предоставить
  // 'some_of' If not all parts of the departments to which the employee is assigned have services that the employee can provide
  //           Если не во всех частях отделений, в которые назначается сотрудник, оказываются услуги, которые сотрудник может оказывать
  // 'none'    If none of the parts of the departments to which the employee is assigned provide services that the employee can provide
  //           Если ни в одной из частей отделений, куда назначают сотрудника, не оказывается услуг, которые умеет оказывать сотрудник 
  statusOfSelectedDepparts(employeeServices:IdAndName[]):string{
    let result:string = '';
    let selectedDepparts:number[] = this.workShiftForm.get('depparts').value;
    let servicesIdsOfDeppart:number[]=[];
    let employeeServicesIds:number[]=[];

    //collect employee's services IDs
    employeeServices.map(employeeService=>{employeeServicesIds.push(employeeService.id)})

    this.receivedDepartmentsWithPartsList.map(department=>{
      // console.log('department.department_id==dep_id',department.department_id==dep_id)
      department.parts.map(deppart => {
        //checking that this department part is selected for employee's' assigning in it
        //проверка того, что данная часть отделения выбрана для назначения в нее сотрудника
        if(selectedDepparts.includes(deppart.id)){
          // collecting services IDs of this department part
          servicesIdsOfDeppart=[];
          deppart.deppartProducts.map(deppartProduct=>{
            servicesIdsOfDeppart.push(deppartProduct.id);
          });
          // Оставляем в данной коллекции только ID тех услуг, которе совпадают с услугами оказываемыми сотрудником
          // It is necessary to leave in this collection the IDs of only those services that coincide with the IDs of the services provided by the employee
          let ln = servicesIdsOfDeppart.filter(v1 => employeeServicesIds.includes(v1)).length;
          // Calculating current result based on its previous values
          // Расчет текущего результата на основе его предыдущих значений
          if(ln==0){// if the length of resulted collection is 0 then in this part of department to which the employee is assigned, no services that the employee can provide
                    // Если длина результирующей коллекции равна 0, то в этой части отделения, к которой назначен сотрудник, нет услуг, которые сотрудник может предоставить
            if (result == '') result = 'none';
            if (result == 'each') result = 'some_of';
            // if result is 'none'    then not changing
            // if result is 'some_of' then not changing
          } else {
            if (result == 'none') result = 'some_of';
            if (result == '') result = 'each';
            // if result is 'each'    then not changing
            // if result is 'some_of' then not changing
          }
        }
      })
    });
    return result;
  }



  addInfoToSceduleDay(row_index:number, col_index:number, automatic=false){
    let employeeDepparts:number[] = [];
    let selectedDepparts:number[] = [];
    let statusOfSelectedDepparts:string='';
    

    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];
    sceduleDay.is_changed=true; // mark this day as changed to update it in the data base on backend
    if(this.day_type=='workshift'){
      // checking that not trying to assign an employee to departments that employee does not belong to
      const employeeScedule: EmployeeScedule = this.scheduleData[row_index];
      employeeDepparts = this.getAllEmployeeDepparts(employeeScedule);
      selectedDepparts = this.workShiftForm.get('depparts').value;
      if(this.isArrayIncludesAllElementsOfAnotherArray(employeeDepparts,selectedDepparts)){
        let workshiftInForm: Workshift = this.workShiftForm.value as Workshift;
        sceduleDay.workshift = workshiftInForm;
        sceduleDay.workshift.id=null; // because this id belongs to templates table
        this.sceduleChanged=true;
        // Проверка насколько услуги предоставляеые сотрудником соответствуют услугам частей отделений, куда его назначают
        // Checking to what extent the services provided by the employee correspond to the services of the departments parts where he is assigned
        statusOfSelectedDepparts=this.statusOfSelectedDepparts(this.scheduleData[row_index].employee_services);
        switch (statusOfSelectedDepparts) {
          case 'some_of': {
            if(!automatic)
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.warning'),message:translate('docs.msg.some_of_depparts')}})
            break;}
          case 'none': {
            if(!automatic)
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.warning'),message:translate('docs.msg.none_of_depparts')}})
            break;}
        }
      } else {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.try_empl_dep')}})
      }
      
    }
    if(this.day_type=='vacation'){
      let vacationInForm: Vacation = this.vacationForm.value as Vacation;
      sceduleDay.vacation = vacationInForm;
      sceduleDay.vacation.id=null; // because this id belongs to templates table
      this.sceduleChanged=true;
    }


  }

  editSceduleDay(row_index:number, col_index:number, data_type:string){
    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];
    if(data_type=='workshift'){ // clicked day is workshift
      if(this.day_type=='workshift' || (this.day_type=='vacation' && sceduleDay.vacation) || (this.day_type=='vacation' && !this.vacationForm.valid)){ // radio button is workshift OR radio button is vacation but already there is vacation in this day
        // edit workshift
        this.day_type='workshift';
        this.clearShiftForm();      
        this.workShiftForm.get('id').setValue(null); // because id in form is id of templates table
        this.workShiftForm.get('time_from').setValue(sceduleDay.workshift.time_from);
        this.workShiftForm.get('time_to').setValue(sceduleDay.workshift.time_to);
        this.workShiftForm.get('depparts').setValue(sceduleDay.workshift.depparts);
        setTimeout(() => {
          const controlBreak = this.getControlTablefield();
          console.log(JSON.stringify(sceduleDay))
          sceduleDay.workshift.breaks.map(brk => {
            controlBreak.push(this.formingBreakRowFromTable(brk.time_from, brk.time_to, brk.paid, brk.precent));
          });    
        }, 1);
      } else { // radio button is 'vacation' but clicked day is workshift
        // adding vacation into this day
        this.addInfoToSceduleDay(row_index, col_index);
      }
    } else { // clicked day is vacation
      if(this.day_type=='vacation' || (this.day_type=='workshift' && sceduleDay.workshift) || (this.day_type=='workshift' && !this.workShiftForm.valid)){ // radio button is vacation OR radio button is workshift but already there is workshift in this day
        // edit vacation
        this.day_type='vacation';
        this.vacationForm.get('id').setValue(null);
        this.vacationForm.get('name').setValue(sceduleDay.vacation.name);
        this.vacationForm.get('is_paid').setValue(sceduleDay.vacation.is_paid);
        this.vacationForm.get('payment_per_day').setValue(sceduleDay.vacation.payment_per_day);
      } else {// adding workshift into this day
        this.addInfoToSceduleDay(row_index, col_index);     
      }
    }
  }

// data type can be: workshift, vacation
  getDayData(row_index:number, col_index:number, data_type:string):string{
    let returnText='';
    const sceduleDay: SceduleDay = this.scheduleData[row_index].days[col_index];
    if(sceduleDay.workshift && data_type=='workshift'){
      // alert(this.timeToAmPm(sceduleDay.workshift.time_from))
      let time_from = this.timeFormat=='24'?sceduleDay.workshift.time_from:this.timeToAmPm(sceduleDay.workshift.time_from);
      let time_to =   this.timeFormat=='24'?sceduleDay.workshift.time_to:this.timeToAmPm(sceduleDay.workshift.time_to);
      returnText = time_from + ' - ' + time_to;
    }
    if(sceduleDay.vacation && data_type=='vacation'){
      returnText = returnText + sceduleDay.vacation.name;
    }
    return returnText;
  }

  getDeppartServicesNamesList(partId){    
    let currentDepparts:number[]=this.workShiftForm.get('depparts').value;
    this.servicesList=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        if(deppart.id==partId){
          deppart.deppartProducts.map(service=>{
            this.servicesList.push(service.name);
          });
        }
      });
    });
    // Clicking on anything inside <mat-option> tag will affected on its value. Need to change previous value
    setTimeout(() => { 
      this.workShiftForm.get('depparts').setValue(currentDepparts);
    }, 1);
  }

  clearEmployeeScedule(rowIndex){
    const employeeScedule: EmployeeScedule = this.scheduleData[rowIndex];
    employeeScedule.days.map(day=>{
      day.is_changed=true;
      day.workshift=null;
      day.vacation=null;
    });
    this.sceduleChanged=true;
  }
  fillEmployeeInfo(rowIndex){
    this.servicesList=[];
    const employeeScedule: EmployeeScedule = this.scheduleData[rowIndex];
    employeeScedule.employee_services.map(service=>{
      this.servicesList.push(service.name);
    });
    this.departmentsList=[];
    employeeScedule.departments.map(dep=>{
      this.departmentsList.push(dep.name);
    });
  }
  mixColors(){
    for (var i = 0; i < this.colorsDataBase.length; i++) {
      this.colors.push(this.colorsDataBase[Math.floor(Math.random()*this.colorsDataBase.length)])
    }
  }

  // display "Fast create scedule" only if in the right side of the day there is no at least 1 workshift
  displayFastSceduleIcon(row_index:number,col_index:number):boolean{
    return (!this.scheduleData[row_index].days[col_index+(col_index+1>this.scheduleData[row_index].days.length?(+1):(+0))].workshift)
  }

  createFastScedule(row_index:number,col_index:number) {
    const dialogFastDcedule = this.fastSceduleComponent.open(FastSceduleComponent, {
      width: '400px', 
      data: {},
    });
    dialogFastDcedule.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      if(result){
        let amount_tick = 1; // Response for fill working days. 1 because current day also matters
        let step_tick = 0;   // Response for 
        let fillDayMode = amount_tick < result.amount || result.step == 0; // if step = 0 then each day is a working day (fillDayMode=true)

        // until next day is workshift or next day = the end day of selected period
        while (this.getDayType(row_index, col_index+1)!='workshift' && col_index+2!=this.scheduleData[row_index].days.length){
          col_index++;
          if(fillDayMode){
            amount_tick++;
            this.onDayClick(row_index,col_index,'undefined', true);
            fillDayMode = amount_tick < result.amount || result.step == 0;
            step_tick= 0;
          } else {
            step_tick++;
            fillDayMode = step_tick >= result.step;
            amount_tick=0;
          }
        }
      }
    });
  }
}
