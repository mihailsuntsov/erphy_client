import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { ResizeEvent } from 'angular-resizable-element';
import { translate, TranslocoService } from '@ngneat/transloco';
import { SelectionModel } from '@angular/cdk/collections';
import { CalendarEvent, CalendarDateFormatter, DAYS_OF_WEEK, CalendarEventTimesChangedEvent } from 'angular-calendar';
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

enum CalendarView {
  Month = "month",
  Week = "week",
  Day = "day",
  Scheduler = "scheduler",
  Resources = "resources"
}
export interface Day {
  dayOfMonth:  string;
  weekDayName: string;
  monthName:   string;
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
    }
  ] 
})
export class CalendarComponent implements OnInit {

  // Angular Calendar
  view: CalendarView = CalendarView.Scheduler;
  viewDate: Date = new Date();
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
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  servicesList: string[] = []; // list of services that will be shown in an information panel of employee or department part
  booking_doc_name_variation: string = 'appointment';
  dayHeaderHeight=43; // heigth of day header, that contained date and badge
  dayEventClicked=false;
  dayAddEventBtnClicked=false;
  allDayEventRows: WeekViewAllDayEventRow[]=[];
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (форму товаров)
  documntsList: IdAndName[] = [
    {
      id: 60,
      name: ''
    }
  ]
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
  // Forms
  queryForm:any;// form for sending query / форма для отправки запроса 
  canDrawView=true;
  // dataLoadedFrom:string = ''; // dates to monitoring when need to refresh data
  // dataLoadedTo:string = '';


  usersOfEvents:  User[]  = [];
  usersOfBreaks:  User[]  = [];
  users:  User[]  = []; 
  breaks: Break[] = [];
  currentMonthDaysArray: Day[] = []; // days in the head of table to construct view for depparts-and-resources component

  constructor(
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
    private service: TranslocoService,) {}

    ngOnInit() {
      // this.dataService.setData('HH:mm');
      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new UntypedFormControl(moment().startOf('month'),[]),   // дата С
        dateTo: new UntypedFormControl(moment().endOf('month'),[]),     // дата По
        depparts: new UntypedFormControl([],[]), // set of department parts
        departments: new UntypedFormControl([],[]), // set of departments IDs
        jobtitles: new UntypedFormControl([],[]), // set of job titles
        documents: new UntypedFormControl([59],[]), // set of documents to show in calendar
      });
      
      // this.cdf.timeFormat="HH:mm";
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');
      this.getBaseData('myDepartmentsList');
      this.getBaseData('timeFormat');
      // this.getBaseData('locale');
      // this.onClickTodayButton();
      this.getCompaniesList();
      moment.updateLocale(this.locale, {week: {
          dow: this.weekStartsOn, // set start of week to monday instead
          doy: 0,
      },});


      //sending time formaf of user to injectable provider where it need to format time
      this.dataService.setData(this.timeFormat=='24'?'HH:mm':'h:mm a');
      console.log("Parent timeFormat", this.timeFormat=='24'?'HH:mm':'h:mm a');
      this.setCurrentMonthDaysArray(moment(new Date()).startOf('month'), moment(new Date()).endOf('month'));
      // setTimeout(() => { 
      //   console.log('Now let show view...');
      //   this.canDrawView=true;
      //   this.changeDateMatCalendar(new Date());
      //   this.refreshView();
      // }, 1);
    }

  getAlternateDay(date:Date){
    return new Date(date);
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
  getData(){
      if(this.allowToView)
      {
        this.getCalendarUsersBreaksList();
        this.getCalendarEventsList();

      } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
  }
  getCompaniesList(){ //+++
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
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    else this.setDefaultCompany();
  } 

  setDefaultCompany(){
    this.queryForm.get('companyId').setValue(this.myCompanyId);
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
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
    if(this.actionsBeforeGetChilds==4){
      setTimeout(() => {
        this.afterLoadData();
        this.refreshView();
        this.changeDateMatCalendar(this.viewDate);
      }, 1);
    }
  }
  afterLoadData(){
    // составляем объединенный список пользователей, которые присутствуют в списке записей и перерывов
        // create a combined list of users who are present in the list of appointments and breaks
        this.usersOfEvents.map(user=>{
          if(this.users.find((obj) => obj.id === user.id) == undefined)
            this.users.push(user);
        })
        this.usersOfBreaks.map(user=>{
          if(this.users.find((obj) => obj.id === user.id) == undefined)
            this.users.push(user);
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
  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
                      this.selectAllCheckList('depparts','queryForm');
                      this.necessaryActionsBeforeGetChilds();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getJobtitleList(){ 
    this.http.get('/api/auth/getJobtitlesList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesList=data as any [];
                      this.selectAllCheckList('jobtitles','queryForm');
                      this.necessaryActionsBeforeGetChilds();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
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
                // "primary": event.meta.user.color.primary,
                // "secondary": event.meta.user.color.secondary
                "primary": event.color.primary,
                "secondary": event.color.secondary
            },
            meta: {
              user: event.meta.user,
              itemResources: event.meta.itemResources?event.meta.itemResources:[],
              departmentPartId:event.meta.departmentPartId?event.meta.departmentPartId:null,
            },
            resizable: {
              beforeStart: true,
              afterEnd: true,
          },
          draggable:true,
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
        this.breaks=data as Break[];
        this.breaks.map(break_=>{
          if(this.usersOfBreaks.find((obj) => obj.id === break_.user.id) == undefined)
            this.usersOfBreaks.push(break_.user);
        });

        this.necessaryActionsBeforeGetChilds();
        // setTimeout(() => { 
        //   console.log('refreshing view');
        //   this.changeDateMatCalendar(new Date());
        //   this.refreshView();
        // }, 1000);
        
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
    );
  }

  onCompanySelection(){
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    this.getData();
  }

  refreshView(): void {
    this.events = [...this.events];
    this.breaks = [...this.breaks];
    this.refresh.next();
  }
  console(name:string, value:any){
    console.log(name,value);
  }
  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    console.log('eventTimesChanged')
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
      if(this.view=='week') this.viewDate_=new Date(this.viewDate);
      this.checkIsNeedToLoadData();
      // if(this.view=='month') this.activeDayIsOpen = true;
    }
    onClickNextButton(){
      if(this.view=='day'||this.view=='scheduler') this.changeDateMatCalendar(this.viewDate);
      if(this.view=='week') this.viewDate_=new Date(this.viewDate);
      console.log('this.viewDate',this.viewDate);
      this.checkIsNeedToLoadData();
    }
    onClickPreviousButton(){
      if(this.view=='day'||this.view=='scheduler') this.changeDateMatCalendar(this.viewDate);
      if(this.view=='week') this.viewDate_=new Date(this.viewDate);
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
      if(this.view=='week') this.viewDate_=new Date(this.viewDate);
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
      if(this.isMonthChanged()){
        const startOfMonth = moment(this.viewDate).startOf('month');
        const endOfMonth = moment(this.viewDate).endOf('month');
        this.queryForm.get('dateFrom').setValue(startOfMonth.format('DD.MM.YYYY'));
        this.queryForm.get('dateTo').setValue(endOfMonth.format('DD.MM.YYYY'));
        this.actionsBeforeGetChilds=2;
        this.setCurrentMonthDaysArray(startOfMonth, endOfMonth);
        this.getData();   
      }
    }
   
    // forming array of dates for displaying the table header of "depparts-and-resources" view
    setCurrentMonthDaysArray(startOfPeriod:moment.Moment, endOfPeriod:moment.Moment){
      this.currentMonthDaysArray = [];
      var day = startOfPeriod;
      while (day <= endOfPeriod) {
        this.currentMonthDaysArray.push({
          dayOfMonth:  day.date().toString(),
          weekDayName: day.format('ddd'),
          monthName:   day.format('MMM'),
        });
        day = day.clone().add(1, 'd');
      }
      console.log(' this.currentMonthDaysArray - ', this.currentMonthDaysArray);
    }


    isMonthChanged(){
      var currDate = moment(this.viewDate);
      var startDate   = moment(this.queryForm.get('dateFrom').value, 'DD.MM.YYYY');
      var endDate     = moment(this.queryForm.get('dateTo').value, 'DD.MM.YYYY');
      console.log('currDate',currDate)
      console.log('startDate',startDate)
      console.log('endDate',endDate)
      console.log('isMonthChanged',!currDate.isBetween(startDate, endDate, 'days', '[]'))

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
    onEventClick(event: CalendarEvent): void{
      console.log('event',event);
      // this.dayEventClicked=true;
      // console.log('onEventClick') 
    }
    onDayAddEventBtnClick(date: Date){
      console.log('Will be added event at ' + date);
      this.openAppointmentCard(null, date);
    }
    handleEvent(action: string, event: CalendarEvent): void {
      console.log('action',action)
      console.log('event',event)
    }
    closeOpenMonthViewDay() {
      this.activeDayIsOpen = false;
    }
    @HostListener('window:resize', ['$event'])
    onWindowResize() {
      this.refreshView();
    }
    // get eventDayMaxWidth(){
    //   categories-sidenav-content
    // }
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
        case 'resources': return 'month';
        default: return this.view;
      }
    }

    wordsToUpperCase(str:string){
      // console.log(str)
      return (str);
      // return (str.split(/\ s+/).map(word =>{
      //   word[0].toUpperCase() + word.substring(1);
      // }).join(' '))
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
    // get viewBtnName(){
    //   this.view.
    // }
    setView(view: CalendarView) {
      this.view = view;
      console.log('viewDate - ', this.viewDate);
    }

    // getSettings(){
    //   let result:any;
    //   this.http.get('/api/auth/getMySettings')
    //     .subscribe(
    //         data => { 
    //           result=data as any;
    //           this._adapter.setLocale(result.locale?result.locale:'en-gb')        // setting locale in moment.js
    //         },
    //         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    //     );
    // }
    selectAllCheckList(field:string, form:string){
      let depparts = field=='depparts'?this.getAllDeppartsIds():this.getAllJobtitlesIds();
      this.queryForm.get(field).setValue(depparts);
    }
    
    selectAllDepPartsOneDep(dep_id:number, form:string){
      const depparts = this.getAllDeppartsIdsOfOneDep(dep_id);
      const ids_now = this.queryForm.get('depparts').value;
      this.queryForm.get('depparts').setValue(depparts.concat(ids_now));
    }
  
    unselectAllCheckList(field:string, form:string){
      this.queryForm.get(field).setValue([]);
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

    openAppointmentCard(docId: number, date?: Date){
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
          date:       date,
          company:    this.getCompanyNameById(this.queryForm.get('companyId').value),
          booking_doc_name_variation: this.booking_doc_name_variation,

        },
      });
      dialogRef.afterClosed().subscribe(result => {
        console.log(`Dialog result: ${result}`);
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


    // interface WeekViewAllDayEvent {
    //   event: CalendarEvent;
    //   offset: number;
    //   span: number;
    //   startsBeforeWeek: boolean;
    //   endsAfterWeek: boolean;
    // }
    // interface WeekViewAllDayEventRow {
    //   id?: string;
    //   row: WeekViewAllDayEvent[]; // Cтрока (Часть отделения или ресурс) содержит ivents, которые к ней относятся (услуга использует ресурсы, которые находятся в этой части отделения).
    // }




    getAllDayEventRows(){
      this.allDayEventRows=[];
      let events: WeekViewAllDayEvent[]=[];
      this.events.map(event=>{
        // console.log('event - ', event);

        // getting only events that use resources
        if(event.meta.itemResources.length>0){
          console.log('event.meta.itemResources')
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
      this.allDayEventRows.length
      // console.log("allDayEventRows",this.allDayEventRows);


    }







}