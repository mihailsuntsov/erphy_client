import { Component, EventEmitter, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { translate, TranslocoService } from '@ngneat/transloco';
import { SelectionModel } from '@angular/cdk/collections';
import { CalendarEvent, CalendarView, CalendarDateFormatter, DAYS_OF_WEEK } from 'angular-calendar';
import moment, { Moment } from 'moment';
import { MatDrawer } from '@angular/material/sidenav';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
const MY_FORMATS = MomentDefault.getMomentFormat();
// const moment = MomentDefault.getMomentDefault();
import { CustomDateFormatter } from './custom-date-formatter.provider';
import { DataService } from './data.service';
import { MatCalendar } from '@angular/material/datepicker';

export interface IdAndName {
  id: number;
  name:string;
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
    },] 
})
export class CalendarComponent implements OnInit {

  // Angular Calendar
  view: CalendarView = CalendarView.Month;
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

  setView(view: CalendarView) {
    this.view = view;
  }
  locale:string='en-us';// locale (for dates, calendar etc.)
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  // allowToViewAllCompanies:boolean = false;
  // allowToViewMyCompany:boolean = false;
  // allowToUpdateAllCompanies:boolean = false;
  // allowToUpdateMyCompany:boolean = false;
  // allowToCreateMyCompany:boolean = false;
  // allowToCreateAllCompanies:boolean = false;
  // allowToDeleteMyCompany:boolean = false;
  // allowToDeleteAllCompanies:boolean = false;
  // allowToRecoverFilesMyCompany:boolean = false;
  // allowToRecoverFilesAllCompanies:boolean = false;
  // allowToClearTrashMyCompany:boolean = false;
  // allowToClearTrashAllCompanies:boolean = false;
  // allowToDeleteFromTrashMyCompany:boolean = false;
  // allowToDeleteFromTrashAllCompanies:boolean = false;
  // allowToView:boolean = false;
  // allowToUpdate:boolean = false;
  // allowToCreate:boolean = false;
  // allowToDelete:boolean = false;
  // allowToRecoverFiles:boolean = false;
  // allowToClearTrash:boolean = false;
  // allowToDeleteFromTrash:boolean = false;

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<IdAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: IdAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  @ViewChild('calendar', {static: false}) calendar: MatCalendar<Date>;
  
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
    private _adapter: DateAdapter<any>,
    public cu: CommonUtilitesService, 
    private dataService: DataService,
    public cdf: CustomDateFormatter,
    private service: TranslocoService,) {
      
    }

    ngOnInit() {
      this.cdf.timeFormat="HH:mm";
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');
      this.getBaseData('myDepartmentsList');
      this.getBaseData('timeFormat');

      // this.getBaseData('timeFormat');
      moment.updateLocale(this.locale, {
        week: {
          dow: this.weekStartsOn, // set start of week to monday instead
          doy: 0,
        },
      });
      //sending time formaf of user to injectable provider where it need to format time
      this.dataService.setData(this.timeFormat=='24'?'HH:mm':'h:mm a');
    }

    onClickTodayButton(){
      this.changeDateMatCalendar(this.viewDate)
    }
    onClickNextButton(){
      if(this.view=='day') this.changeDateMatCalendar(this.viewDate);
    }
    
    onClickPreviousButton(){
      if(this.view=='day') this.changeDateMatCalendar(this.viewDate);
    }
    matCalendarOnclickDay(event:Moment): void {
      this.changeDateAngularCalendar(event.toDate());
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
    }


    get day_today(){
      this.today.locale(this.locale);
      // var d2 = moment(today).add(2, 'days').format('ddd').toUpperCase();
      // var d3 = moment(today).add(3, 'days').format('ddd').toUpperCase();
      var d0 = this.today.format('dddd, D MMMM');
      return(this.wordsToUpperCase(d0));
    }

    wordsToUpperCase(str:string){
      return(str.split(/\s+/).map(word => word[0].toUpperCase() + word.substring(1)).join(' '))
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

}