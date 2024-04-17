import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
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
import { User } from 'src/app/modules/calendar/day-view-scheduler/day-view-scheduler.component';
// const users: User[] = [
//   {
//     id: 0,
//     name: 'John smith',
//     color: {primary: 'black', secondary: '#fdf1ba'},
//   },
//   {
//     id: 1,
//     name: 'Jane Doe',
//     color: {primary: 'black', secondary: '#d1e8ff'},
//   },
// ];
enum CalendarView {
  Month = "month",
  Week = "week",
  Day = "day",
  Scheduler = "scheduler"
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
  documntsList: IdAndName[] = [
    {
      id: 60,
      name: ''
    }
  ]
  companySettings: CompanySettings = null;
  activeDayIsOpen: boolean = false;
  setView(view: CalendarView) {
    this.view = view;
  }
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



   users: User[] = []; 


  constructor(
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    public MessageDialog: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    private storesSelectComponent: MatDialog,
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
      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new UntypedFormControl(moment().startOf('month'),[]),   // дата С
        dateTo: new UntypedFormControl(moment().endOf('month'),[]),     // дата По
        depparts: new UntypedFormControl([],[]), // set of department parts
        departments: new UntypedFormControl([],[]), // set of departments IDs
        jobtitles: new UntypedFormControl([],[]), // set of job titles
        documents: new UntypedFormControl([59],[]), // set of documents to show in calendar
      });
      
      this.cdf.timeFormat="HH:mm";
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');
      this.getBaseData('myDepartmentsList');
      this.getBaseData('timeFormat');
      this.getCompaniesList();
      moment.updateLocale(this.locale, {week: {
          dow: this.weekStartsOn, // set start of week to monday instead
          doy: 0,
      },});

      //sending time formaf of user to injectable provider where it need to format time
      this.dataService.setData(this.timeFormat=='24'?'HH:mm':'h:mm a');
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
    this.getCalendarEventsList();
  }

  getCompanySettings(){
    this.http.get('/api/auth/getCompanySettings?id='+this.queryForm.get('companyId').value)
      .subscribe(
        (data) => {   
          this.companySettings=data as CompanySettings;
            this.showDocumntsField=true;
            console.log("this.showDocumntsField",this.showDocumntsField);
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
                      this.refreshView();
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
                      this.refreshView();
                      this.getData();
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
        events=data as CalendarEvent[];
        events.map(event=>{
          this.events.push({
            "id": event.id,
            "start": new Date(event.start),
            "end": new Date(event.end),
            "title": event.title,
            "color": {
                "primary": event.meta.user.color.primary,
                "secondary": event.meta.user.color.secondary
            },
            meta: {
              user: event.meta.user,
            },
            resizable: {
              beforeStart: true,
              afterEnd: true,
          },
          draggable:true,
          });
          
          const objectList = [
            { id: 10, name: "Jane" },
            { id: 36, name: "Steven" }
          ];
          


          if(this.users.find((obj) => obj.id === event.meta.user.id) == undefined)
            this.users.push( event.meta.user);
          

          
        });
        console.log("this.events",this.events)
        // this.events.push({
        //   title: 'An event',
        //   color: users[0].color,
        //   start: moment().startOf('day').add(5,'hours').toDate(),
        //   meta: {
        //     user: users[0],
        //   },
        //   resizable: {
        //     beforeStart: true,
        //     afterEnd: true,
        //   },
        //   draggable: true,
        // },
        // {
        //   title: 'Another event',
        //   color: users[1].color,
        //   start: moment().startOf('day').add(2,'hours').toDate(),
        //   meta: {
        //     user: users[1],
        //   },
        //   resizable: {
        //     beforeStart: true,
        //     afterEnd: true,
        //   },
        //   draggable: true,
        // },
        // {
        //   title: 'A 3rd event',
        //   color: users[0].color,
        //   start: moment().startOf('day').add(7,'hours').toDate(),
        //   meta: {
        //     user: users[0],
        //   },
        //   resizable: {
        //     beforeStart: true,
        //     afterEnd: true,
        //   },
        //   draggable: true,
        // },
        // {
        //   title: 'An all day event',
        //   color: users[0].color,
        //   start: new Date(),
        //   meta: {
        //     user: users[0],
        //   },
        //   draggable: true,
        //   allDay: true,
        // },
        // {
        //   title: 'Another all day event',
        //   color: users[1].color,
        //   start: new Date(),
        //   meta: {
        //     user: users[1],
        //   },
        //   draggable: true,
        //   allDay: true,
        // },
        // {
        //   title: 'A 3rd all day event',
        //   color: users[0].color,
        //   start: new Date(),
        //   meta: {
        //     user: users[0],
        //   },
        //   draggable: true,
        //   allDay: true,
        // },)
    this.refreshView();
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
    this.refresh.next();
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
      this.changeDateMatCalendar(this.viewDate);
      // if(this.view=='month') this.activeDayIsOpen = true;
    }
    onClickNextButton(){
      if(this.view=='day') this.changeDateMatCalendar(this.viewDate);
    }
    
    onClickPreviousButton(){
      if(this.view=='day') this.changeDateMatCalendar(this.viewDate);
    }
    matCalendarOnclickDay(event:Moment): void {
      this.changeDateAngularCalendar(event.toDate());
      this.activeDayIsOpen = false;
      console.log('event1',event.toDate());
    }
    angularCalendarOnClickDay(event:any): void {
      this.changeDateMatCalendar(new Date(event))
    }

    changeDateAngularCalendar(date: Date) {
      this.viewDate = date;
    }
    changeDateMatCalendar(date: Date) {
      let date_ = this._adapter.parse(moment(date).format('YYYY-MM-DD'), 'YYYY-MM-DD');
      this.calendar._goToDateInView(this._adapter.getValidDateOrNull(date_), 'month');
      // this.calendar.activeDate=this._adapter.getValidDateOrNull(date_);
      this.calendar.selected=this._adapter.getValidDateOrNull(date_);
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
        this.viewDate = date;
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

    wordsToUpperCase(str:string){
      // console.log(str)
      return (str);
      // return(str.split(/\ s+/).map(word =>{
        
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
    // setView(view: CalendarView) {
    //   console.log('this.view - ',this.view)
    //   this.view = view;
    // }

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
    // uncheckPlacesOfWork(){
    //   let allDeppartsOfSelectedDepartments:number[]=[];
    //   this.queryForm.get('departments').value.map(i=>{
    //     allDeppartsOfSelectedDepartments=allDeppartsOfSelectedDepartments.concat(this.getAllDeppartsIdsOfOneDep(i));
    //   });
    //   this.workShiftForm.get('depparts').setValue(this.workShiftForm.get('depparts').value.filter(
    //     id => allDeppartsOfSelectedDepartments.includes(id)
    //   ));
    // }
}