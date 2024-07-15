import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy, HostListener, ViewEncapsulation, Injectable, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
// import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
// import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
// import { ResizeEvent } from 'angular-resizable-element';
import { translate, TranslocoService } from '@ngneat/transloco';
import { SelectionModel } from '@angular/cdk/collections';
import { CalendarEvent, CalendarDateFormatter, DAYS_OF_WEEK, CalendarEventTimesChangedEvent, CalendarEventTitleFormatter } from 'angular-calendar';
import { WeekViewHourSegment } from 'calendar-utils';
import { fromEvent } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Moment } from 'moment';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { CustomDateFormatter } from './custom-date-formatter.provider';
import { DataService } from './data.service';
import { MatCalendar } from '@angular/material/datepicker';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import { AppointmentsDocComponent } from '../appointments-doc/appointments-doc.component';
// import { DayViewSchedulerComponent } from 'src/app/modules/calendar/day-view-scheduler/day-view-scheduler.component';
const  MY_FORMATS = MomentDefault.getMomentFormat();
const  moment = MomentDefault.getMomentDefault();
import { User,Break } from 'src/app/modules/calendar/day-view-scheduler/day-view-scheduler.component';
import { SettingsCalendarDialogComponent } from 'src/app/modules/settings/settings-calendar-dialog/settings-calendar-dialog.component';

function floorToNearest(amount: number, precision: number) {
  return Math.floor(amount / precision) * precision;
}

function ceilToNearest(amount: number, precision: number) {
  return Math.ceil(amount / precision) * precision;
}

@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
  weekTooltip(event: CalendarEvent, title: string) {
    if (!event.meta || !event.meta.tmpEvent) {
      return super.weekTooltip(event, title);
    }
  }
  dayTooltip(event: CalendarEvent, title: string) {
    if (!event.meta || !event.meta.tmpEvent) {
      return super.dayTooltip(event, title);
    }
  }
}

export enum CalendarView {
  Month = "month",
  Week = "week",
  Day = "day",
  Scheduler = "scheduler",
  ResourcesMonth = "resources_month",
  ResourcesWeek = "resources_week",
  ResourcesDay = "resources_day"
}
export enum ResourceView {
  Month = "month",
  Week = "week",
  Day = "day"
}
export interface Day {
  dayOfMonth:  string;
  weekDayName: string;
  monthName:   string;
  date:        Date;
}
interface WeekViewAllDayEvent {
  event: CalendarEvent;
  offset: number;
  span: number;
  startsBeforeWeek: boolean;
  endsAfterWeek: boolean;
}
interface WeekViewAllDayEventRow {
  id?: string;
  row: WeekViewAllDayEvent[];
}
interface IdAndName {
  id: number;
  name:string;
}
interface Department{
  department_id:  number;
  department_name:string;
  parts:          Deppart[];
}
interface Deppart{
  id:             number;
  name:           string;
  description:    string;
  is_active:      boolean;
  deppartProducts:DeppartProduct[];
  resources:      Resource[];
}
interface DeppartProduct{
  id: number;
  name:string;
  employeeRequired:boolean;
}
interface Resource{
  active:         boolean;
  dep_part_id:    number;
  description:    string;
  name:           string;
  resource_id:    number;
  resource_qtt:   number;
}
interface CompanySettings{
  booking_doc_name_variation: string; 
  booking_doc_name_variation_id: number;
  is_store: boolean;
  netcost_policy: string;
  st_prefix_barcode_packed: number;
  st_prefix_barcode_pieced: number;
  time_zone_id: number;
  vat: boolean;
  vat_included: boolean;
}
interface EmployeeWithServices {
  id: number;
  name:string;
  services: IdAndName[];
}
interface JobtitleWithEmployees {
  id: number;
  name:string;
  description:string;
  employees: EmployeeWithServices[];
}



@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoadSpravService,CommonUtilitesService,CustomDateFormatter,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatter,
    },
    {
        provide: MAT_SELECT_CONFIG,
        useValue: { overlayPanelClass: 'expandable-overlay-panel' }
    },
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter,
    },
  ] 
})



export class CalendarComponent implements OnInit {

  view: CalendarView = CalendarView.Month;
  resourceView: ResourceView = ResourceView.Month; // resource view by default or last selected
  viewDate: Date = new Date();
  startOfPeriod = moment(new Date()).startOf(this.view=='resources_month'?'month':(this.view=='resources_week'?'week':'day'));
  endOfPeriod = moment(new Date()).endOf(this.view=='resources_month'?'month':(this.view=='resources_week'?'week':'day'));
  viewDate_: Date = new Date(); // current date for a week view because pipe changes original viewDate (I do not know why)
  events: CalendarEvent[] = [];
  // weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  today = moment();
  receivedCompaniesList: any [] = [];
  myCompanyId:number=0;//
  timeFormat:string='';
  selected: Date | null;
  @ViewChild('drawercalendar') public drawercalendar: MatDrawer;
  CalendarView = CalendarView;
  myId:number=0;
  showDocumntsField=false;
  refresh = new Subject<void>();
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedDepartmentsWithPartsList: Department [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesWithEmployeesList: JobtitleWithEmployees [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  servicesList: string[] = []; // list of services that will be shown in an information panel of employee or department part
  booking_doc_name_variation: string = 'appointment';
  dayHeaderHeight=43; // heigth of day header, that contained date and badge
  dayEventClicked=false;
  dayAddEventBtnClicked=false;
  allDayEventRows: WeekViewAllDayEventRow[]=[];
  // dragToCreateActive = false;
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (форму товаров)
  documntsList: IdAndName[] = [
    {
      id: 60,
      name: ''
    }
  ]
  
  needAgainOfAfterChangeFiltersApiCalls:boolean=false;
  waitingOfAfterChangeFiltersApiCalls:boolean=false;
  isPageReloading:boolean=true;

  settingsForm: any; // форма с настройками
  companySettings: CompanySettings = null;
  activeDayIsOpen: boolean = false;
  trackByIndex = (i) => i;
  locale:string='en-us';// locale (for dates, calendar etc.)
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  editability:boolean = false;//редактируемость.
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<IdAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: IdAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  @ViewChild('calendar', {static: false}) calendar: MatCalendar<Date>;
  queryForm:any;// form for sending query / форма для отправки запроса 
  canDrawView=true;
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)

  // to avoid the circular structure when dep. parts synchronize by employees and employees synchronize by dep. parts
  syncDepPartsByEmployeesProcess:boolean=false;
  syncEmployeesByDepPartsProcess:boolean=false;


  usersOfEvents:  User[]  = [];
  usersOfBreaks:  User[]  = [];
  users:  User[]  = []; 
  breaks: Break[] = [];
  currentMonthDaysArray: Day[] = []; // days in the head of table to construct view for depparts-and-resources component
  userOfDraggingToCreateEvent:  User = null;

  // -----    SETTINGS     -----
  dayStartHour:number = 0;
  dayEndHour:number   = 23;
  dayStartMinute:number = 0;
  dayEndMinute:number   = 59;
  hourDuration:number = 30;
  hourSegments:number = 2;
  // ----- END OF SETTINGS -----

  constructor(
    private _fb: UntypedFormBuilder,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    public MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public dialogDocumentCard: MatDialog,
    private _adapter: DateAdapter<any>,
    public cu: CommonUtilitesService, 
    private dataService: DataService,
    public cdf: CustomDateFormatter,
    private service: TranslocoService,
    private settingsCalendarDialogComponent: MatDialog,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
      companyId: new UntypedFormControl(null,[]), // предприятие, по которому идет запрос данных
      dateFrom: new UntypedFormControl(moment().startOf('month'),[]),   // дата С
      dateTo: new UntypedFormControl(moment().endOf('month'),[]),     // дата По
      timeFrom: new UntypedFormControl('00:00',[]),   // время С
      timeTo: new UntypedFormControl('23:59',[]),     // время По
      depparts: new UntypedFormControl([],[Validators.required]), // set of department parts
      employees: new UntypedFormControl([],[]), // set of employees
      departments: new UntypedFormControl([],[]), // set of departments IDs
      jobtitles: new UntypedFormControl([],[]), // set of job titles
      documents: new UntypedFormControl([59],[]), // set of documents to show in calendar
    });
    this.settingsForm = new UntypedFormGroup({
      companyId: new UntypedFormControl                 (null,[]),    // company by default
      startView: new UntypedFormControl                 ('month',[]),    // month / scheduler / resources
      timelineStep: new UntypedFormControl              (30,[]),      // step of timeline in minutes (15 / 30 / 60)
      dayStartMinute: new UntypedFormControl            (0,[]),    // minute of day start (0-1438) that means 00:00 - 23:58
      dayEndMinute: new UntypedFormControl              (1439,[]),    // minute of day end (1-1439)   that means 00:01 - 23:59
      resourcesScreenScale: new UntypedFormControl      ('month',[]),    // month / week / day
      displayCancelled: new UntypedFormControl          (false,[]),    // display or not cancelled events by default
    });
  
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');
    this.getBaseData('myDepartmentsList');
    this.getBaseData('timeFormat');
    this.getBaseData('accountingCurrency');

    this.getCompaniesList();
    moment.updateLocale(this.locale, {week: {
        dow: this.weekStartsOn, // set start of week to monday instead
        doy: 0,
    },});

    //sending time formaf of user to injectable provider where it need to format time
    this.dataService.setData(this.timeFormat=='24'?'HH:mm':'h:mm a');
    // console.log("Parent timeFormat", this.timeFormat=='24'?'HH:mm':'h:mm a');

    this.queryForm.controls.employees.valueChanges.subscribe(() => {
      if(!this.syncEmployeesByDepPartsProcess){
        this.syncDepPartsByEmployeesProcess=true;
        this.syncDepPartsByEmployees();
        this.afterChangeFiltersApiCalls();
        // console.log('employees.valueChanges')
        setTimeout(() => {this.syncDepPartsByEmployeesProcess=false;
          }, 10);
      }
    });
    this.queryForm.controls.depparts.valueChanges.subscribe(() => {
      if(!this.syncDepPartsByEmployeesProcess){
        this.syncEmployeesByDepPartsProcess=true;
        this.syncEmployeesByDepParts();
        this.afterChangeFiltersApiCalls();
        // console.log('depparts.valueChanges')
        setTimeout(() => {this.syncEmployeesByDepPartsProcess=false;
          }, 10);
      }
    });
  }

  getAlternateDay(date:Date){
    return new Date(date);
  }
  afterChangeFiltersApiCalls(){
    if(!this.waitingOfAfterChangeFiltersApiCalls){ // если не в режиме отложенного срабатывания / if not in delayed triggering mode
      this.waitingOfAfterChangeFiltersApiCalls=true; // ставим в режим отложенного срабатывания / delayed triggering mode is "ON"
      console.log('!this.waitingOfAfterChangeFiltersApiCalls before timeOut()')
      setTimeout(() => { //ожидание / delayed triggering
        // отложенное срабатывание случилось: / delayed triggering happened:
        // отключаем режим отложенного срабатывания / disable delayed triggering mode
        this.waitingOfAfterChangeFiltersApiCalls=false;        
        if(!this.needAgainOfAfterChangeFiltersApiCalls){ // если повторные запросы во время ожидания больше не "прилетали" / if repeated requests no longer arrived
          //выполняем код, частоту которого нужно ограничить / execute code whose frequency needs to be limited
          this.reloadPage();
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
  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=60').subscribe(
      (data) => {   
        this.permissionsSet=data as any [];
        this.getMyId();
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
  }

  getCRUD_rights(){
    this.allowToView =   this.permissionsSet.some(  function(e){return(e==724)});
    this.editability=this.allowToView;  
  }

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  reloadPage(){
    this.isPageReloading=true;
    this.actionsBeforeGetChilds=0;
    this.getDepartmentsWithPartsList(false);
    this.getJobtitlesWithEmployeesList();
  }
  getData(){
      if(this.allowToView)
      {
        // if(this.queryForm.valid){
          this.getCalendarUsersBreaksList();
          this.getCalendarEventsList();
        // }
      } else {this.isPageReloading=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
  }

  getCompaniesList(){ 
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList().subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.getSetOfPermissions();
                },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
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
        this.getSettings();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    else this.getSettings();
  }

  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsCalendar')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
            //данная группа настроек не зависит от предприятия
            this.settingsForm.get('startView').setValue(result.startView);
            this.settingsForm.get('timelineStep').setValue(result.timelineStep);
            this.settingsForm.get('dayStartMinute').setValue(result.dayStartMinute);
            this.settingsForm.get('dayEndMinute').setValue(result.dayEndMinute);
            this.settingsForm.get('resourcesScreenScale').setValue(result.resourcesScreenScale);
            this.settingsForm.get('displayCancelled').setValue(result.displayCancelled);

            // stage of initial loading of Calendar
            if(this.actionsBeforeGetChilds<4){
              
              switch ( this.settingsForm.get('resourcesScreenScale').value) {
                case 'week': {
                  this.resourceView = ResourceView.Week;
                  break;}
                case 'day': {
                  this.resourceView = ResourceView.Day; 
                  break;}
                default: {
                  this.resourceView = ResourceView.Month; 
                }
              }

              switch (this.settingsForm.get('startView').value) {
                case 'month': {
                  this.setView(CalendarView.Month);
                  break;}
                case 'scheduler': {
                  this.setView(CalendarView.Scheduler);
                  break;}
                default: { //resources
                  this.onResourcesButtonClick();
                }
              } 
              switch (this.settingsForm.get('timelineStep').value) {
                case 15: {
                  this.hourDuration = 30; this.hourSegments = 2;
                  break;}
                case 30: {
                  this.hourDuration = 60; this.hourSegments = 2;
                  break;}
                default: { //60
                  this.hourDuration = 60; this.hourSegments = 1;
                }
              } 1440
              if(this.settingsForm.get('dayEndMinute').value==1440) this.settingsForm.get('dayEndMinute').setValue(1439);

              this.dayStartHour=  +moment().startOf('day').add(this.settingsForm.get('dayStartMinute').value, 'minutes').format('HH');
              this.dayEndHour=    +moment().startOf('day').add(this.settingsForm.get('dayEndMinute').value, 'minutes').format('HH');
              this.dayStartMinute=+moment().startOf('day').add(this.settingsForm.get('dayStartMinute').value, 'minutes').format('mm');
              this.dayEndMinute=  +moment().startOf('day').add(this.settingsForm.get('dayEndMinute').value, 'minutes').format('mm');

              this.refreshView();

              // this.onSelectResourcesViewode(result.resourcesScreenScale);
              
            } 
            //если предприятия из настроек больше нет в списке предприятий (например, для пользователя урезали права, и выбранное предприятие более недоступно)
            //настройки не принимаем
            if(+this.queryForm.get('companyId').value==0 && this.isCompanyInList(+result.companyId)){
              this.queryForm.get('companyId').setValue(result.companyId);
              //данная группа настроек зависит от предприятия
              // (таких нет)
            }
            this.setDefaultCompany();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList) this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }
  setDefaultCompany(){
    if(+this.queryForm.get('companyId').value==0)
      if(this.isCompanyInList(this.myCompanyId))
        this.queryForm.get('companyId').setValue(this.myCompanyId);
      else if (this.receivedCompaniesList.length>0 )this.queryForm.get('companyId').setValue(this.receivedCompaniesList[0].id);
    this.getDepartmentsWithPartsList();
    this.getJobtitlesWithEmployeesList();
    // this.getJobtitleList();
    this.getCompanySettings();
    this.getCRUD_rights();
  }
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    // Если набрано необходимое кол-во действий - все остальные справочники загружаем тут, т.к. 
    // нужно чтобы сначала определилось предприятие, его id нужен для загрузки
    if(this.actionsBeforeGetChilds==2){
      this.getData();
    }

    
    // after  this.getCalendarUsersBreaksList() and  this.getCalendarEventsList():
    if(this.actionsBeforeGetChilds==4){
      setTimeout(() => {
        this.afterLoadData();
        this.setResourcesPeriod();
        this.setResourcesDaysArray();
        this.refreshView();
        this.changeDateMatCalendar(this.viewDate);
        this.isPageReloading=false;
      }, 1);
    }
  }
  afterLoadData(){
    // console.log('afterLoadData')
    // составляем объединенный список пользователей, которые присутствуют в списке записей и перерывов
        // create a combined list of users who are present in the list of appointments and breaks
        this.users = [];
        // this.breaks = [];
        this.usersOfEvents.map(user=>{
          if(user.id && this.users.find((obj) => obj.id === user.id) == undefined)
            this.users.push(user);
        })
        this.usersOfBreaks.map(user=>{
          if(user.id && this.users.find((obj) => obj.id === user.id) == undefined)
            this.users.push(user);
        })

        // Если у выбранных в фильтре пользователей нет рабочих смен или событий - их всё равно нужно показать на экране
        // Поэтому добавим недостающих пользователей
        // If the users selected in the filter do not have work shifts or events, they still need to be shown on the screen
        // Therefore, we will add the missing users
        this.receivedJobtitlesWithEmployeesList.map(jobtitle=>{
          jobtitle.employees.map(employee=>{
            // if employee is selected and it is still not in users list
            if(this.queryForm.get('employees').value.includes(employee.id) && this.breaks.find((obj) => obj.user.id === employee.id) == undefined){
              this.users.push({
                "id": employee.id,
                "name": employee.name,
                "color": {
                  "primary": "#008000",
                  "secondary": "#FDF1BA"
                },
              });
            }         
          })
        })
        // if user has no scedule of its work shifts, but he there is in a list because he has an appointments - need to add to him the break for the full time from the start to the end of data range
        // если у пользователя нет расписания его рабочих смен (перерывов), но он есть в списке, потому что у него есть записи - нужно добавить ему перерыв на все время от начала до конца диапазона данных. 
        this.users.map(user=>{
          if(this.breaks.find((obj) => obj.user.id === user.id) == undefined)
            this.breaks.push({
              "user": {
                  "id": user.id,
                  "name": user.name,
                  "color": user.color
              },
              "start": moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY').format('YYYY-MM-DD')+"T00:00:00Z",
              "end": moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY').format('YYYY-MM-DD')+"T23:59:59Z",
            });
        })
        
        console.log('usersOfEvents',this.usersOfEvents)
        console.log(' usersOfBreaks', this.usersOfBreaks)
        
        console.log('users',this.users)
        console.log(' breaks', this.breaks)
  }
  getCompanySettings(){
    this.http.get('/api/auth/getCompanySettings?id='+this.queryForm.get('companyId').value)
      .subscribe(
        (data) => {   
          this.companySettings=data as CompanySettings;
            this.showDocumntsField=true;
            // console.log("this.showDocumntsField",this.showDocumntsField);
            this.refreshView();
            this.booking_doc_name_variation=this.companySettings.booking_doc_name_variation;
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  getDepartmentsWithPartsList(selectAll=true){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
                      if(selectAll) this.selectAllCheckList('depparts','queryForm');
                      this.necessaryActionsBeforeGetChilds();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  
  getJobtitlesWithEmployeesList(){ 
    return this.http.get('/api/auth/getJobtitlesWithEmployeesList?id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesWithEmployeesList=data as JobtitleWithEmployees [];
                      // this.selectAllCheckList('employees','queryForm'); // employees will be selected by selected dep. parts in syncEmployeesByDepParts()
                      this.necessaryActionsBeforeGetChilds();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  // getJobtitleList(){ 
  //   this.http.get('/api/auth/getJobtitlesList?company_id='+this.queryForm.get('companyId').value)
  //     .subscribe(
  //         (data) => {   
  //                     this.receivedJobtitlesList=data as any [];
  //                     this.selectAllCheckList('jobtitles','queryForm');
  //                     this.necessaryActionsBeforeGetChilds();
  //     },
  //     error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
  //     );
  // }
  getCalendarEventsList(){
    let events:any[]=[];
    this.http.post('/api/auth/getCalendarEventsList', this.queryForm.value).subscribe(
      (data) => {
        if(!data){
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
        }
        this.usersOfEvents=[];
        this.events=[];
        events=data as CalendarEvent[];
        events.map(event=>{
          this.events.push({
            "id": event.id,
            "start": new Date(event.start),
            "end": new Date(event.end),
            "title": event.title,
            "color": {
                "primary": event.color.primary,
                "secondary": event.color.secondary
            },
            "allDay":false,
            "meta": {
              "user": event.meta.user,
              "itemResources": event.meta.itemResources?event.meta.itemResources:[],
              "departmentPartId":event.meta.departmentPartId?event.meta.departmentPartId:null,
              "statusName": event.meta.statusName,
              "statusType": event.meta.statusType //тип статуса : 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
            },                                    //status type:  1 - normal;  2 - final positive         3 - final negative
            "resizable": {
              "beforeStart": true,
              "afterEnd": true,
            },
            "draggable":true,
          });
          
          // Creating array of User
          if(this.usersOfEvents.find((obj) => obj.id === event.meta.user.id) == undefined)
            this.usersOfEvents.push( event.meta.user);
        });
        // setTimeout(() => { 
        //   this.changeDateMatCalendar(new Date());
        //   this.refreshView();
        // }, 1);
        
        this.getAllDayEventRows();
        this.necessaryActionsBeforeGetChilds();
        this.refreshView();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
    );
  }

  getCalendarUsersBreaksList(){
    this.http.post('/api/auth/getCalendarUsersBreaksList', this.queryForm.value).subscribe(
      (data) => {
        if(!data){
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
        }
        this.breaks=[];
        this.usersOfBreaks=[];
        this.breaks=data as Break[];
        this.breaks.map(break_=>{
          if(this.usersOfBreaks.find((obj) => obj.id === break_.user.id) == undefined)
            this.usersOfBreaks.push(break_.user);
        });

        this.necessaryActionsBeforeGetChilds();
        
        this.refreshView();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
    );
  }

  onCompanySelection(){
    
    this.actionsBeforeGetChilds=0;
    this.getCompaniesList();

    // this.getDepartmentsWithPartsList();
    // // this.getJobtitleList();
    // this.getJobtitlesWithEmployeesList();
    // this.getData();
  }

  refreshView(): void {
    this.events = [...this.events];
    this.breaks = [...this.breaks];
    this.cdr.detectChanges();
    // this.refresh.next();
  }
  // console(name:string, value:any){
    // console.log(name,value);
  // }
  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    // console.log('eventTimesChanged')
    event.start = newStart;
    event.end = newEnd;
    this.events = [...this.events];
  }

  userChanged({ event, newUser }) {
    event.color = newUser.color;
    event.meta.user = newUser;
    this.events = [...this.events];
  }

  onClickTodayButton(){
    this.changeDateMatCalendar(new Date());
    if(this.view=='week'||this.view=='resources_week') this.viewDate_=new Date(this.viewDate);
    this.checkIsNeedToLoadData();
    // if(this.view=='month') this.activeDayIsOpen = true;
  }
  onClickNextButton(){
    if(this.view=='day'||this.view=='resources_day'||this.view=='scheduler') this.changeDateMatCalendar(this.viewDate);
    if(this.view=='week'||this.view=='resources_week') this.viewDate_=new Date(this.viewDate);
    // console.log('this.viewDate',this.viewDate);
    this.checkIsNeedToLoadData();
  }
  onClickPreviousButton(){
    if(this.view=='day'||this.view=='resources_day'||this.view=='scheduler') this.changeDateMatCalendar(this.viewDate);
    if(this.view=='week'||this.view=='resources_week') this.viewDate_=new Date(this.viewDate);
    this.checkIsNeedToLoadData();
  }
  matCalendarOnclickDay(event:Moment): void {
    this.changeDateAngularCalendar(event.toDate());
    this.activeDayIsOpen = false;
    this.checkIsNeedToLoadData();
    // console.log('event1',event.toDate());
  }
  angularCalendarOnClickDay(event:any): void {
    this.changeDateMatCalendar(new Date(event));
    // console.log("event", event)
    this.viewDate=new Date(event);
    // console.log("this.viewDate1", this.viewDate)
    if(this.view=='week'||this.view=='resources_week') this.viewDate_=new Date(this.viewDate);
    // console.log("this.viewDate2", this.viewDate)
    // this.checkIsNeedToLoadData();
    // console.log("this.viewDate3", this.viewDate)
  }

  changeDateAngularCalendar(date: Date) {
    this.viewDate = date;
    this.viewDate_=new Date(this.viewDate);
  }
  changeDateMatCalendar(date: Date) {
    let date_ = this._adapter.parse(moment(date).format('YYYY-MM-DD'), 'YYYY-MM-DD');
    this.calendar._goToDateInView(this._adapter.getValidDateOrNull(date_), 'month');
    // this.calendar.activeDate=this._adapter.getValidDateOrNull(date_);
    this.calendar.selected=this._adapter.getValidDateOrNull(date_);
  }

  checkIsNeedToLoadData(){
    this.setResourcesPeriod();
    this.setResourcesDaysArray();
    if(this.isMonthChanged()){
      this.queryForm.get('dateFrom').setValue(this.startOfPeriod.format('DD.MM.YYYY'));
      this.queryForm.get('dateTo').setValue(this.endOfPeriod.format('DD.MM.YYYY'));
      this.actionsBeforeGetChilds=2;
      this.getData();   
    }
  }
  
  setResourcesPeriod(){
    // console.log('startOf(week) = ',moment(this.viewDate).startOf('week'))
    switch (this.view) {
      case 'resources_week': {
        this.startOfPeriod = moment(this.viewDate).startOf('week');
        this.endOfPeriod = moment(this.viewDate).endOf('week');
        break;}
      case 'resources_day': {
        this.startOfPeriod = moment(this.viewDate).startOf('day');
        this.endOfPeriod = moment(this.viewDate).endOf('day');
        break;}
      default: {
        this.startOfPeriod = moment(this.viewDate).startOf('month');
        this.endOfPeriod = moment(this.viewDate).endOf('month');          
      }
    }      
  }

  // forming array of dates for displaying the table header of "depparts-and-resources" view
  setResourcesDaysArray(){
    this.currentMonthDaysArray = [];
    var day = this.startOfPeriod;
    if(this.view != 'resources_day'){
      while (day <= this.endOfPeriod) {
        this.currentMonthDaysArray.push({
          dayOfMonth:  day.date().toString(),
          weekDayName: day.format('ddd'),
          monthName:   day.format('MMM'),
          date:        new Date(day.format('YYYY-MM-DD'))
        });
        day = day.clone().add(1, 'd');
      }
    } else {
      while (day <= this.endOfPeriod) {
        this.currentMonthDaysArray.push({
          dayOfMonth:  day.date().toString(),
          weekDayName: day.format('ddd'),
          monthName:   day.format('MMM'),
          date:        new Date(day.format('YYYY-MM-DD HH:mm'))
        });
        day = day.clone().add(1, 'h');
      }
    }
    // console.log(' this.currentMonthDaysArray - ', this.currentMonthDaysArray);
  }

  isMonthChanged(){
    var currDate = moment(this.viewDate);
    var startDate   = moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY');
    var endDate     = moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY');
    return !currDate.isBetween(startDate, endDate, 'days', '[]');// ()-default exclusive, (],[),[] - right, left and all inclusive
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    // console.log('same month',(moment(date).isSame(this.viewDate, "month")));
    // console.log('same day',(moment(this.viewDate).isSame(date, "day")));
    if (moment(date).isSame(this.viewDate, "month")) {
      if (
        (moment(this.viewDate).isSame(date, "day") && this.activeDayIsOpen === true)  ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        if(!this.dayEventClicked && !this.dayAddEventBtnClicked) this.activeDayIsOpen = true;
      }
      this.viewDate = new Date(date);
      this.viewDate_= new Date(date);
      this.dayEventClicked = false;
      this.dayAddEventBtnClicked = false;
    }
  }
  onMonthViewEventClick(event: CalendarEvent): void{
    // console.log('event',event);
    this.openAppointmentCard(event.id as number, null)
  }
  onDayAddEventBtnClick(date: Date){
    this.openAppointmentCard(null, date);
  }
  handleEvent(action: string, event: CalendarEvent): void {
    // console.log('action',action)
    // console.log('event',event)
    this.openAppointmentCard(event.id as number, null)
  }
  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.refreshView();
  }

  get calendarDayHeight(){
    var calculated=(window.innerHeight-98)/5;
    return calculated>100?calculated:100;
  }
  get maxNumberDayDisplayedEvents(){
    return Math.round((this.calendarDayHeight-this.dayHeaderHeight)/21.4)-1;
  }
  get day_today(){
    this.today.locale(this.locale);
    // var d2 = moment(today).add(2, 'days').format('ddd').toUpperCase();
    // var d3 = moment(today).add(3, 'days').format('ddd').toUpperCase();
    var d0 = this.today.format('dddd, D MMMM');
    return(this.wordsToUpperCase(d0));
  }
  get nextPrevButtonView(){
    return this.getNextPrevButtonView();
  }

  getNextPrevButtonView(){
    switch (this.view){
      case 'scheduler': return 'day';
      case 'resources_month': return 'month';
      case 'resources_week': return 'week';
      case 'resources_day': return 'day';
      default: return this.view;
    }
  }

  wordsToUpperCase(str:string){
    return (str);
  }

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  get localeAngular(){
    return ({
      'ru':       'ru',
      'sr-cyrl':  'sr-Cyrl',
      'me':       'sr-Latn-ME',
      'en-au':    'en-AU',
      'en-ca':    'en-CA',
      'en-us':    'en',
      'en-gb':    'en-GB',
      'en-ie':    'en-IE',
      'en-il':    'en-IL',
      'en-in':    'en-IN',
      'en-nz':    'en-NZ',
      'en-sg':    'en-SG',
      'bs':       'bs-Latn',
      'hr':       'hr'
    })[this.locale]
  }    
  get weekStartsOn(){
    return ({
      'ru':       DAYS_OF_WEEK.MONDAY,
      'sr-cyrl':  DAYS_OF_WEEK.MONDAY,
      'me':       DAYS_OF_WEEK.MONDAY,
      'en-au':    DAYS_OF_WEEK.SUNDAY,
      'en-ca':    DAYS_OF_WEEK.SUNDAY,
      'en-us':    DAYS_OF_WEEK.SUNDAY,
      'en-gb':    DAYS_OF_WEEK.MONDAY,
      'en-ie':    DAYS_OF_WEEK.SUNDAY,
      'en-il':    DAYS_OF_WEEK.MONDAY,
      'en-in':    DAYS_OF_WEEK.SUNDAY,
      'en-nz':    DAYS_OF_WEEK.MONDAY,
      'en-sg':    DAYS_OF_WEEK.MONDAY,
      'bs':       DAYS_OF_WEEK.MONDAY,
      'hr':       DAYS_OF_WEEK.MONDAY
    })[this.locale]
  }

  setView(view: CalendarView) {
    this.view = view;
    // console.log('viewDate - ', this.viewDate);
  }

  selectAllCheckList(field:string, form:string){
    let ids = field=='depparts'?this.getAllDeppartsIds():this.getAllEmployeesIds();
    this.queryForm.get(field).setValue(ids);
  }

  unselectAllCheckList(field:string, form:string){
    this.queryForm.get(field).setValue([]);
  }
  // ------------------------------------ User settings ------------------------------------
  //открывает диалог настроек
  openDialogSettings() { 
    const dialogSettings = this.settingsCalendarDialogComponent.open(SettingsCalendarDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      data:
      { //отправляем в диалог:
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        timeFormat: this.timeFormat
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        //если нажата кнопка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
        this.settingsForm.get('companyId').setValue(result.get('companyId').value);
        this.settingsForm.get('startView').setValue(result.get('startView').value);
        this.settingsForm.get('timelineStep').setValue(result.get('timelineStep').value);
        this.settingsForm.get('dayStartMinute').setValue(result.get('dayStartMinute').value);
        this.settingsForm.get('dayEndMinute').setValue(result.get('dayEndMinute').value);
        this.settingsForm.get('resourcesScreenScale').setValue(result.get('resourcesScreenScale').value);
        this.settingsForm.get('displayCancelled').setValue(result.get('displayCancelled').value);
        this.saveSettingsCalendar();
        // если это новый документ, и ещё нет выбранных товаров - применяем настройки 
        // this.getData();
      }
    });
  }
  
  saveSettingsCalendar(){
    return this.http.post('/api/auth/saveSettingsCalendar', this.settingsForm.value)
    .subscribe(
      (data) => {   
        this.actionsBeforeGetChilds=0;
        this.getCompaniesList();
        this.openSnackBar(translate('menu.msg.settngs_saved'), translate('menu.msg.close')); //+++
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  // ---------------------------------Job titles and Employees------------------------------
  
  selectAllDepPartsOneDep(dep_id:number, form:string){
    const depparts = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = this.queryForm.get('depparts').value;
    this.queryForm.get('depparts').setValue(depparts.concat(ids_now));
  }
  unselectAllDepPartsOneDep(dep_id:number, form:string){
    const ids_in_deppat = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = this.queryForm.get('depparts').value;
    this.queryForm.get('depparts').setValue(ids_now.filter(e => !ids_in_deppat.includes(e)));
  }
  getDeppartServicesNamesList(partId){    
    let currentDepparts:number[]=this.queryForm.get('depparts').value;
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
      this.queryForm.get('depparts').setValue(currentDepparts);
    }, 1);
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
  getAllDeppartsIdsOfOneDep(dep_id:number):number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      if(department.department_id==dep_id)
        department.parts.map(deppart=>{
          depparts.push(deppart.id);
        })
    });
    return depparts;
  }


  // ---------------------------------Job titles and Employees------------------------------

  selectAllEmployeesOneJobtitle(jt_id:number, form:string){
    const employees = this.getAllEmployeesIdsOfOneJobtitle(jt_id);
    const ids_now = this.queryForm.get('employees').value;
    this.queryForm.get('employees').setValue(employees.concat(ids_now));
  }
  unselectAllEmployeesOneJobtitle(jt_id:number, form:string){
    const employees = this.getAllEmployeesIdsOfOneJobtitle(jt_id);
    const ids_now = this.queryForm.get('employees').value;
    this.queryForm.get('employees').setValue(ids_now.filter(e => !employees.includes(e)));
  }
  getEmployeeServiceNamesList(emp_id){    
    let currentEmployees:number[]=this.queryForm.get('employees').value;
    this.servicesList=[];
    this.receivedJobtitlesWithEmployeesList.map(jobtitle=>{
      jobtitle.employees.map(employee=>{
        if(employee.id==emp_id){
          employee.services.map(service=>{
            this.servicesList.push(service.name);
          });
        }
      });
    });
    // Clicking on anything inside <mat-option> tag will affected on its value. Need to change previous value
    setTimeout(() => { 
      this.queryForm.get('employees').setValue(currentEmployees);
    }, 1);
  }

  getAllEmployeesIds():number[]{
    let employees:number[]=[];
    this.receivedJobtitlesWithEmployeesList.map(jobtitle=>{
      jobtitle.employees.map(emp=>{
        employees.push(emp.id);
      });      
    });
    return employees;
  }  

  getAllEmployeesIdsOfOneJobtitle(jt_id:number):number[]{
    let employees:number[]=[];
    this.receivedJobtitlesWithEmployeesList.map(jt=>{
      if(jt.id==jt_id)
        jt.employees.map(employee=>{
          employees.push(employee.id);
        })
    });
    return employees;
  }
// -------------------------------------------------------------------------------------


  openAppointmentCard(docId: number, date: Date, dragCreatedEvent?:CalendarEvent){
    // console.log("locale in calendar = ",this.locale);
    const dialogRef = this.dialogDocumentCard.open(AppointmentsDocComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode:       'window',
        companyId:  this.queryForm.get('companyId').value,
        docId:         docId,
        calendarViewDayDate:       date,
        company:    this.getCompanyNameById(this.queryForm.get('companyId').value),
        booking_doc_name_variation: this.booking_doc_name_variation,
        locale:     this.locale,
        jobtitles:            this.receivedJobtitlesList,
        departmentsWithParts: this.receivedDepartmentsWithPartsList,
        dragCreatedEvent: dragCreatedEvent
      },
    });
    dialogRef.componentInstance.baseData.subscribe((data) => {
      let query=data as string;
      switch (query) {
      //   case 'myId': {
      //     dialogRef.componentInstance.myId=this.myId;;
      //     break;}
      //   case 'myCompanyId': {
      //     dialogRef.componentInstance.myCompanyId=this.myCompanyId;
      //     break;}          
      //   case 'companiesList': {
      //     dialogRef.componentInstance.receivedCompaniesList=this.receivedCompaniesList;
      //     break;}
        case 'accountingCurrency':{
          dialogRef.componentInstance.accountingCurrency=this.accountingCurrency;
          break;}
        case 'timeFormat':{
          dialogRef.componentInstance.timeFormat=this.timeFormat;
          break;}
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      this.getCalendarEventsList();
      // if(result)
      //   this.addFilesToappointments(result);
    });
  }



  getCompanyNameById(id:number):string{
    let name:string;
    if(this.receivedCompaniesList){
      this.receivedCompaniesList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }



  getAllDayEventRows(){
    this.allDayEventRows=[];
    let events: WeekViewAllDayEvent[]=[];
    this.events.map(event=>{
      // console.log('event - ', event);

      // getting only events that use resources
      if(event.meta.itemResources.length>0){
        // console.log('event.meta.itemResources')
        events.push({
          event,
          offset:1,
          span:1,
          startsBeforeWeek: false,
          endsAfterWeek: false
        });
      }
    });

    this.allDayEventRows.push({
      row:events
    });
  }

  onResourcesButtonClick(){
    switch (this.resourceView) {
      case 'week': {
        this.setView(CalendarView.ResourcesWeek); 
        this.viewDate_ = this.getAlternateDay(this.viewDate);
        break;}
      case 'day': {
        this.setView(CalendarView.ResourcesDay); 
        this.refreshView()
        break;}
      default: {
        this.setView(CalendarView.ResourcesMonth); 
      }
    }
    this.checkIsNeedToLoadData(); 
    this.refreshView();
  }
 
  onSelectResourcesViewode(mode:string){
    switch (mode) {
      case 'week': {
        this.setView(CalendarView.ResourcesWeek); 
        this.resourceView = ResourceView.Week;
        this.viewDate_ = this.getAlternateDay(this.viewDate); 
        break;}
      case 'day': {
        this.setView(CalendarView.ResourcesDay); 
        this.resourceView = ResourceView.Day; 
        break;}
      default: {
        this.setView(CalendarView.ResourcesMonth); 
        this.resourceView = ResourceView.Month; 
      }
    }
    this.checkIsNeedToLoadData(); 
    this.refreshView();
  }

  prepareToDragCreate( segment: WeekViewHourSegment,
    mouseDownEvent: any,
    segmentElement: HTMLElement){
    setTimeout(() => {
      this.startDragToCreate(segment,mouseDownEvent,segmentElement)
    }, 1);
  }

  startDragToCreate(
    segment: WeekViewHourSegment,
    mouseDownEvent: any,
    segmentElement: HTMLElement
  ) {
    const dragToSelectEvent: CalendarEvent = {
      id: null,
      title: '',
      start: segment.date,
      meta: {
        tmpEvent: true,
        "user": this.userOfDraggingToCreateEvent
      },
    };
    // console.log('dragToSelectEvent',dragToSelectEvent)
    if(!dragToSelectEvent.end) // just pressed on a ceil, without dragging down - in this case there is no "end" in event's object
      dragToSelectEvent.end = moment(dragToSelectEvent.start).add(this.hourDuration/this.hourSegments,"minutes").toDate();
    this.events = [...this.events, dragToSelectEvent];
    const segmentPosition = segmentElement.getBoundingClientRect();
    let oneTimeMouseupControl = true;
    // this.dragToCreateActive = true;
    const endOfView = moment(this.viewDate).endOf("week").add(1,"millisecond").toDate();// Чтобы можно было "дотянуть" event до самого конца дня
    fromEvent(document, 'mousemove')                                                    // So that we can “strech” the event until the very end of the day
      .pipe(
        finalize(() => {
          delete dragToSelectEvent.meta.tmpEvent;
          // this.dragToCreateActive = false;
          this.refreshView();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        const minutesDiff = ceilToNearest(
          mouseMoveEvent.clientY - segmentPosition.top,
          (this.hourDuration/this.hourSegments)*(30/this.hourDuration*this.hourSegments) // Подходит для: (hourDuration:number = 30; hourSegments:number = 2;),(hourDuration:number = 60; hourSegments:number = 2;),(hourDuration:number = 60; hourSegments:number = 1;)
        );                      30/2*30/30*2                                                         // Suitable for: (hourDuration:number = 30; hourSegments:number = 2;),(hourDuration:number = 60; hourSegments:number = 2;),(hourDuration:number = 60; hourSegments:number = 1;)
        // console.log('minutesDiff',minutesDiff)
        const daysDiff =
          floorToNearest(
            mouseMoveEvent.clientX - segmentPosition.left,
            segmentPosition.width
          ) / segmentPosition.width;

        const newEnd = moment(segment.date).add(minutesDiff/(30/this.hourDuration*this.hourSegments), 'minutes').add(daysDiff, 'days').toDate();
        if (newEnd > segment.date && newEnd < endOfView) {
          dragToSelectEvent.end = newEnd;
        }
        dragToSelectEvent.title=moment(dragToSelectEvent.start).format(this.timeFormat=='12'?'hh:mm A':'HH:mm') + ' - ' + moment(dragToSelectEvent.end).format(this.timeFormat=='12'?'hh:mm A':'HH:mm');
        this.refreshView();
        
      });
      // fromEvent(document, 'mouseup')
      // .subscribe(() => { 
      //   alert('111111111111111111') })
      fromEvent(document, 'mouseup').subscribe(() =>{
        if(oneTimeMouseupControl){
          oneTimeMouseupControl=false;
          // console.log('dragToSelectEvent',dragToSelectEvent);
          this.openAppointmentCard(null, new Date(), dragToSelectEvent)
        }
          
        } 
      );
  }

  syncDepPartsByEmployees(){
    // collect selected dep. parts with services no employee needed
    let depPartsIdsNoNeedEmployees:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        let employeeRequired=false;
        deppart.deppartProducts.map(service=>{
          if(service.employeeRequired)
            employeeRequired=true;
        })
        if(!employeeRequired && !depPartsIdsNoNeedEmployees.includes(deppart.id) && this.queryForm.get('depparts').value.includes(deppart.id))
          depPartsIdsNoNeedEmployees.push(deppart.id)
      })
    })
    //reset DepParts form (only dep. parts with services no employee needed are staying)
    console.log('depPartsIdsNoNeedEmployees', depPartsIdsNoNeedEmployees)
    // this.queryForm.get('depparts').setValue(depPartsIdsNoNeedEmployees);
    // collect IDs of services of selected employees
    let servicesIds:number[] = [];
    let resultIds:number[] = depPartsIdsNoNeedEmployees;
    this.receivedJobtitlesWithEmployeesList.map(jobtitle=>{
      jobtitle.employees.map(employee=>{
        if(this.queryForm.get('employees').value.includes(employee.id)){
          employee.services.map(service=>{
            if(!servicesIds.includes(service.id)) 
              servicesIds.push(service.id)
          })
        }         
      })
    })
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        deppart.deppartProducts.map(service=>{
          if(servicesIds.includes(service.id)){
            resultIds.push(deppart.id)
          }
        })
      })
    })
    this.queryForm.get('depparts').setValue(resultIds);
  }

  syncEmployeesByDepParts(){
    //reset Employees form
    this.queryForm.get('employees').setValue([]);
    // collect IDs of services of depparts employees
    let servicesIds:number[] = [];
    let resultIds:number[] = [];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(part=>{
        if(this.queryForm.get('depparts').value.includes(part.id)){
          part.deppartProducts.map(service=>{
            if(!servicesIds.includes(service.id)) 
              servicesIds.push(service.id)
          })
        }         
      })
    })
    this.receivedJobtitlesWithEmployeesList.map(jobtitle=>{
      jobtitle.employees.map(employee=>{
        employee.services.map(service=>{
          if(servicesIds.includes(service.id)){
            resultIds.push(employee.id)
          }
        })
      })
    })
    this.queryForm.get('employees').setValue(resultIds);
  }

  setUserOfDraggingToCreateEvent(user:User) {
    // console.log('UserOnFrontend - ',user)
    this.userOfDraggingToCreateEvent = user;
  }

  onClickSchedulerHoour($event){
    // console.log('$event - ',$event)
  }
}