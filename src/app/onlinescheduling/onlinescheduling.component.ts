import { Component, OnInit, Inject, Renderer2, ElementRef, SimpleChanges, AfterViewInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {  Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router'; //import package from module
import { HttpParams, HttpClient } from '@angular/common/http';
import { OsDialogComponent } from './osdialog.component';

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Observable } from 'rxjs';
import { CalendarEvent, CalendarDateFormatter, DAYS_OF_WEEK, CalendarEventTimesChangedEvent, CalendarEventTitleFormatter } from 'angular-calendar';
import { DOCUMENT } from '@angular/common';
import { Moment } from 'moment';
import { MatCalendar } from '@angular/material/datepicker';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();
import { Contact, ContactType } from 'src/app/modules/other/contacts/contacts.component';
import { SanitizedHtmlPipe } from 'src/app/services/sanitized-html.pipe';

interface ProductCategory{
  id: number;
  parent_id: number;
  description: string;
  name: string;
  slug: string;
  img_original_name: string
  img_address: string;
  img_alt: string;
  img_anonyme_access: boolean;
  menu_order: number;
}

interface OnlineSchedulingFieldsTranslation{
  langCode: string;
  txt_btn_select_time: string;
  txt_btn_select_specialist: string;
  txt_btn_select_services: string;
  txt_summary_header: string;
  txt_summary_date: string;
  txt_summary_time_start: string;
  txt_summary_time_end: string;
  txt_summary_duration: string;
  txt_summary_specialist: string;
  txt_summary_services: string; 
  txt_btn_create_order: string;
  txt_btn_send_order: string;
  txt_msg_send_successful: string;
  txt_msg_send_error: string;
  txt_msg_time_not_enable: string;
  txt_fld_your_name: string;
  txt_fld_your_tel: string;
  txt_fld_your_email: string;
}

interface OnlineSchedulingLanguage{
  id: number;
  suffix: string;
  name: string;
  fileName: string;
}

interface CompanySettings{
  fld_step: number;
  fld_max_amount_services: number;
  fld_locale_id: number;
  fld_time_format: string;
  fld_duration: string;
  fld_predefined_duration: number;
  fld_predefined_duration_unit_id: number;
  fld_tel_prefix: string;
  fld_ask_telephone: boolean;
  fld_ask_email: boolean;
  fld_url_slug: string;
  txt_btn_select_time: string;
  txt_btn_select_specialist: string;
  txt_btn_select_services: string;
  txt_summary_header: string;
  txt_summary_date: string;
  txt_summary_time_start: string;
  txt_summary_time_end: string;
  txt_summary_duration: string;
  txt_summary_specialist: string;
  txt_summary_services: string;
  txt_btn_create_order: string;
  txt_btn_send_order: string;
  txt_msg_send_successful: string;
  txt_msg_send_error: string;
  txt_msg_time_not_enable: string;
  txt_fld_your_name: string;
  txt_fld_your_tel: string;
  txt_fld_your_email: string;
  stl_color_buttons: string;
  stl_color_buttons_text: string;
  stl_color_text: string;
  stl_corner_radius: string;
  stl_font_family: string;
  company_name: string;
  txt_any_specialist: string;
  txt_hour: string;
  txt_minute: string;
  txt_nearest_app_time: string;
  txt_today: string;
  txt_tomorrow: string;
  txt_morning: string;
  txt_day: string;
  txt_evening: string;
  txt_night: string;
  stl_background_color: string;
  stl_panel_color: string;
  stl_panel_max_width: number;
  stl_panel_max_width_unit: string;
  stl_not_selected_elements_color: string;
  stl_selected_elements_color: string;
  stl_job_title_color: string;
  date_format: string;
  onlineSchedulingLanguagesList: OnlineSchedulingLanguage[];
  onlineSchedulingFieldsTranslations: OnlineSchedulingFieldsTranslation[];
  onlineSchedulingContactsList: Contact[];

  // to add (there are no in database at this moment)
  fld_toolbar_show: boolean;
  fld_toolbar_title: string;
  fld_show_hero: boolean;
  fld_hero_heigth: string;
  fld_hero_img_link: string;
  fld_hero_cover_width: string; // (%)
  fld_hero_cover_color: string;
  fld_hero_big_sign: string;
  fld_hero_small_sign: string;
  fld_currency_place: string; //      (before/after price)
  
  txt_srvc_unavlbl_reasons: string; // This service is unavailable next reasons:
  txt_unav_by_selected_employee: string;
  txt_unav_by_employees_who_available_by_selected_services: string;
  txt_unav_srvc_by_departament: string;
  txt_spec_unavlbl_reasons: string; // This specialist is unavailable next reasons:
  txt_unav_by_selected_services: string;
  txt_unav_spec_by_departament: string;
  txt_unav_by_time: string;

  stl_color_no_active_element: string;
  str_color_toolbar_buttons: string,
  
  
  company_about: string;
}

interface Department{
  department_id: number;
  department_name: string;
  department_address: string;
  parts: Deppart[];
}
interface Deppart{
  id:number;
  name: string;
  description: string;
  is_active: boolean;
  deppartProducts:DeppartProduct[];
  resources:DepPartResource[]
}
interface DepPartResource{
  resource_id: number;
  name: string;
  description: string;
  resource_qtt: number;
  dep_part_id: number;
  isActive: boolean       // for example, room may be under construction, car is on repairing, etc.
  now_used: number;       // filled only in getNowUsedResourcesList http query
}
interface DeppartProduct{
  id:number;
  name: string;
  employeeRequired:boolean;
}
interface Employee{
  id: number;
  name: string;
  jobtitle_id: number;
  jobtitle_name:string;
  departmentPartsWithServicesIds: DepartmentPartWithServicesIds[];
  state: string; // free / busyByAppointments / busyBySchedule
  available_by_selected_services:boolean;
  available_by_departament:boolean;
  available_by_time:boolean;
}
interface DepartmentPartWithServicesIds{
  id: number;
  servicesIds:number[];
}
export interface User {
  id: number;
  name: string;
  jobtitle: string;
}
export interface WorkShiftPart {
  employee_id: number;
  end: string;
  start: string;
  workshift_id: number;
  department_parts_ids: number[];
}
interface Image{
  img_original_name: string;
  img_address: string;
  img_alt: string;
}
interface Service{
  id: number;
  name: string;
  type: string;
  price: string;
  sku: string;
  categories: number[];
  images: Image[];
  available_by_selected_employee:boolean;
  available_by_employees_who_available_by_selected_services:boolean;
  available_by_departament:boolean;
}
interface TimeSlot{
  id:number;
  employeeId: number;
  start: string;
}
@Component({
  selector: 'app-onlinescheduling',
  templateUrl: './onlinescheduling.component.html',
  styleUrls: ['./onlinescheduling.component.css'],
  providers:[ SanitizedHtmlPipe,   
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class OnlineschedulingComponent implements AfterViewInit {

  constructor(
    private http: HttpClient,
    public MessageDialog: MatDialog,
    private renderer: Renderer2, 
    private el: ElementRef,
    private osDialogComponent: MatDialog,
    private ref: ChangeDetectorRef,
    public sanitizedHtml:SanitizedHtmlPipe,
    // private rendererFactory: RendererFactory2,
    private _adapter: DateAdapter<any>,
    private route: ActivatedRoute //dependency injection
  ){

  }

  @Inject(DOCUMENT) private document: Document

  contactTypes:ContactType[]=[
    {
      name:'Email',
      value:'email',
      placeholder:'myname@postservice.com',
      icon: ['fas', 'envelope']
    },
    {
      name:'Phone',
      value:'telephone',
      placeholder:'+12223334455',
      icon: ['fas', 'phone']
    },
    {
      name:'Website',
      value:'website',
      placeholder:'www.mysite.com',
      icon:['fas', 'globe']
    },
    {
      name:'WhatsApp',
      value:'whatsapp',
      placeholder:'https://wa.me/12223334455',
      icon:['fab', 'whatsapp']
    },
    {
      name:'Instagram',
      value:'instagram',
      placeholder:'https://www.instagram.com/myinstagramnickname/',
      icon:['fab', 'instagram']
    },
    {
      name:'Facebook',
      value:'facebook',
      placeholder:'https://www.facebook.com/profile.php?id=100070105646282',
      icon:['fab', 'facebook']
    },
    {
      name:'Github',
      value:'github',
      placeholder:'https://github.com/mygithubnickname',
      icon:['fab', 'github']
    },
    {
      name:'StackOverflow',
      value:'stackoverflow',
      placeholder:'https://stackoverflow.com/users/1234567890/mynickname',
      icon:['fab', 'stack-overflow']
    },
    {
      name:'TikTok',
      value:'tiktok',
      placeholder:'https://www.tiktok.com/@mytiktok',
      icon:['fab', 'tiktok']
    },
    {
      name:'LinkedIn',
      value:'linkedin',
      placeholder:'https://www.linkedin.com/in/mylinkedin/',
      icon:['fab', 'linkedin']
    },
    {
      name:'PayPal',
      value:'paypal',
      placeholder:'https://paypal.me/YourName/XXX',
      icon:['fab', 'paypal']
    },
    {
      name:'YouTube',
      value:'youtube',
      placeholder:'https://www.youtube.com/@ERPHY-APP',
      icon:['fab', 'youtube']
    },
    {
      name:'Discord',
      value:'discord',
      placeholder:'https://discordapp.com/users/12345678901234567890',
      icon:['fab', 'discord']
    },
    {
      name:'Telegram',
      value:'telegram',
      placeholder:'https://t.me/mytelegram',
      icon:['fab', 'telegram']
    },
    {
      name:'x-twitter',
      value:'twitter',
      placeholder:'https://x.com/mytwitter',
      icon:['fab', 'x-twitter']
    },
    {
      name:'Viber',
      value:'viber',
      placeholder:'viber://add?number=12223334455',
      icon:['fab', 'viber']
    },
    {
      name:'VK',
      value:'vk',
      placeholder:'https://vk.com/myvkid',
      icon:['fab', 'vk']
    }
  ]


  company: any;
  lang: any;
  gettingData=false;
  onlineSchedulingSettings:CompanySettings={
    fld_step: 15,// step of time slots (10,15,30,60 minutes)
    fld_max_amount_services: 10,// max amount of services that customer can select at once
    fld_locale_id: 3, // date format: 3 = "English (United States)"
    fld_time_format: '12',// 12 or 24
    date_format: 'DD/MM/YYYY',
    fld_duration: 'summary',// duration of vizit: "summary" - as sum of all services duration. "longest" - duration of a longest service. "defined" - predefined duration
    fld_predefined_duration: 1,
    fld_predefined_duration_unit_id: null,
    fld_tel_prefix: '+1',
    fld_ask_telephone: true,
    fld_ask_email: true,
    fld_url_slug: '',
    txt_btn_select_time: 'Seelct time',
    txt_btn_select_specialist: 'Select specialist',
    txt_btn_select_services: 'Select services',
    txt_summary_header: 'Summary',
    txt_summary_date: 'Date',
    txt_summary_time_start: 'Start time',
    txt_summary_time_end: 'End time',
    txt_summary_duration: 'Duration',
    txt_summary_specialist: 'Specialist',
    txt_summary_services: 'Selected services',
    txt_btn_create_order: 'Create order',
    txt_btn_send_order: 'Send order',
    txt_msg_send_successful: 'Your appointment reservation was successfully sent',
    txt_msg_send_error: 'Error of appointment reservation sending',
    txt_msg_time_not_enable: 'Sorry, but the selected time slot is no longer available. Please choose another time slot',
    txt_fld_your_name: 'Your name',
    txt_fld_your_tel: 'Telephone',
    txt_fld_your_email: 'Email',
    stl_color_buttons: '#223559',
    stl_color_buttons_text: '#ffffff',
    stl_color_text: '#333333',
    stl_corner_radius: '5',
    stl_font_family: 'Roboto, sans-serif',
    company_name: '',
    txt_any_specialist: 'Any specialist',
    txt_hour: 'hour',
    txt_minute: 'minutes',
    txt_nearest_app_time: 'The nearest appointment time',
    txt_today: 'Today',
    txt_tomorrow: 'Tomorrow',
    txt_morning: 'Morning',
    txt_day: 'Day',
    txt_evening: 'Evening',
    txt_night: 'Night',
    stl_background_color: '#f5f5f5',
    stl_panel_color: '#ffffff',
    stl_panel_max_width: 600,
    stl_panel_max_width_unit: 'px',
    stl_not_selected_elements_color: '#c2c2c2',
    stl_selected_elements_color: '#223559',
    stl_job_title_color: '#545454',
    onlineSchedulingLanguagesList: [],
    onlineSchedulingFieldsTranslations: [],
    onlineSchedulingContactsList:[],
    // to add (there are no in database at this moment)
    fld_toolbar_show: true,
    fld_toolbar_title: '',
    fld_show_hero: true,
    fld_hero_heigth: '250',
    fld_hero_img_link: '2f7a20ac-84f-2024-10-01-12-11-38-722_encrypted.jpg',
    fld_hero_cover_width: '80', // (%)
    fld_hero_cover_color: '17003476',
    fld_hero_big_sign: 'Imagination',
    fld_hero_small_sign: 'Beauty nails studio',
    fld_currency_place: 'before', //      (before/after price)
    
    txt_srvc_unavlbl_reasons: 'This service is unavailable for the following reasons:', // This service is unavailable next reasons:
    txt_unav_by_selected_employee: 'The selected specialist does not perform this service',
    txt_unav_by_employees_who_available_by_selected_services: 'This service cannot be provided together with selected services within the same appointment.',
    txt_unav_srvc_by_departament: 'This service is not available at the selected location.',
    txt_spec_unavlbl_reasons: 'This specialist is unavailable for the following reasons:', // This specialist is unavailable next reasons:
    txt_unav_by_selected_services: 'This specialist does not provide the selected services',
    txt_unav_spec_by_departament: 'This specialist is not available in the selected location.',
    txt_unav_by_time: 'This specialist is not available at the selected time.',
  
    stl_color_no_active_element: '#dcdcdc',
    str_color_toolbar_buttons: '',
    company_about: '',
  
  };
  initialLoading=true;// to handle the end of loading document
  employeesListLoadQtt = 0; // if == 3 then indication of list loading will shown
  receivedDepartmentsWithPartsList: Department [] = [];// array to getting the list of departments with theys parts
  receivedEmployeesList  : Employee[] = [];//array to get the list of employees
  allEmployeesList: Employee[]=[];
  events: CalendarEvent[] = [];
  // employeesHaveScheduleInSelectedDepartment:      number[]=[]; //* IDs of employees which have work shifts in selected department 
  // employeesHaveServicesInSelectedDepartment:      number[]=[]; //* IDs of employees which have services in selected department
  // employeesHaveServicesSelectedByUser:            number[]=[]; //* IDs of employees who can provide services selected by user
  // employeesFreeByScheduleForSelectedUserTime:     number[]=[]; //* IDs of available by schedule employees (minimum 1 hour) for the time selected by the user 
  // employeesFreeByAppointmentsForSelectedUserTime: number[]=[]; // IDs of available by appointments employees (minimum 1 hour) for the time selected by the user 
  allTimeSlots: TimeSlot[]=[]; // includes all time slots for all employees
  resultTimeSlotsList: TimeSlot[]=[]; // result united list of non-repeating time slots of all available employees
  // filteredServices:            number[]=[]; //

  allServicesList: Service[]=[];
  // selectedCategoryServicesList: Service[]=[];
  // servicesIdsNotAccessibleBySelectedEmployee:number[]=[];
  // allServicesIdsOfSelectedEmployee:number[]=[];
  // allServicesIdsOfSelectedDepartment:number[]=[];


  formBaseInformation:any;// the form of main information
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)
  currentView: string = 'main'; // main, location, specialist, services, time,
  selectedDepartment:Department={department_id:null,department_name:'',department_address: '',parts: []};
  selectedEmployeeId:number=null; // null: not selected;  0: any specialist; 1,2,...: ID of specialist
  selectedDateTime:string=''; // selected appointment date in ISO 8601 format
  selectedCategoryId:number=0; // 0 -no selected category
  selectedServicesIds:number[]=[];

  // Time variables
  locale:string='en-us';// locale (for dates, calendar etc.)
  viewDate: Date = new Date();
  selected: Date | null;
  @ViewChild('calendar', {static: false}) calendar: MatCalendar<Date>;
  // displayNoAccessibleSlotsMessage:boolean = true;
  // myFilter = (d: Date | null): boolean => {
  //   const day = (d || new Date()).getDay();
  //   return day !== 0 && day !== 6;
  // };
  myFilter = (date: Date | null): boolean => {
    const today = new Date()
    console.log('date.toDateString()',moment(date).format('DD.MM.YYYY').toString())
    // console.log('today',today)
    // if(!date) { return false }
    return date >= today || (moment(date).format('DD.MM.YYYY').toString() === moment(today).format('DD.MM.YYYY').toString());
  };
  
  // Styles variables
  corner_radius:number = 15;
  // inner_background_color='#ffffff';
  panel_max_width=600;
  panel_max_width_uq='px';
  color_buttons='gray';

  styles='<style></style>'

  workShiftParts: WorkShiftPart[] = [];
  allProductCategories: ProductCategory[]=[];
  allDepartmentPartsIdsOfEmployees:number[]=[];
  allServicesIdsOfEmployees:number[]=[];
  private element: HTMLElement;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // getting URL parameters from the string like http://localhost:4200/onlinescheduling?company=mycompany372686173&lang=en
      this.company = params['company'];
      this.lang = params['lang'];
   });

   this.formBaseInformation = new UntypedFormGroup({
    departmentId: new UntypedFormControl (null,[]),
    employeeId: new UntypedFormControl   (null,[]),
    employeeName: new UntypedFormControl ('',[]),
    servicesIds: new UntypedFormControl  ([],[]),
   });



   this._adapter.setLocale(this.locale);
   this.getOnlineSchedulingSettings();
   this.getDepartmentsWithPartsList();// -----------------------------------------------------------
  //                                                        |                                      |
  //                                        |getEmployeesWithSchedulingList |      getOnlineSchedulingProductCategories
  //                                        |getEmployeeWorkingTimeAndPlaces|
  //                                                        |
  //                                                        

   

  //  this.rendererFactory.end = () => {
  //   this.setDynamicStyle();
  //  }
  }
  ngOnChanges(changes: SimpleChanges) {

  }

  ngAfterViewInit(){
    this.setDynamicStyle();
  }

  setDynamicStyle() {
    // if(this.currentView == 'main'){
    //   this.element = this.el.nativeElement.querySelector("#topaccordeon .mat-expansion-panel:last-of-type");
    //   this.renderer.setStyle(this.element, "border-bottom-right-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
    //   this.renderer.setStyle(this.element, "border-bottom-left-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
    //   this.element = this.el.nativeElement.querySelector("#topaccordeon .mat-expansion-panel:first-of-type");
    //   this.renderer.setStyle(this.element, "border-top-right-radius", '0px');
    //   this.renderer.setStyle(this.element, "border-top-left-radius", '0px');
    //   this.element = this.el.nativeElement.querySelector(".department-address");
    //   this.renderer.setStyle(this.element, "color", this.onlineSchedulingSettings.stl_job_title_color);
    // }

    
    let toolbarIcons = this.el.nativeElement.querySelectorAll("#toolbar button");
    toolbarIcons.forEach(icon => {
      this.renderer.setStyle(icon, "color", this.onlineSchedulingSettings.str_color_toolbar_buttons);
    });
    // wide buttons
    let elements = this.el.nativeElement.querySelectorAll("button.mat-mdc-extended-fab");
    elements.forEach(element => {
      this.renderer.setStyle(element, "border-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
      this.renderer.setStyle(element, "background-color", this.onlineSchedulingSettings.stl_color_buttons);
      this.renderer.setStyle(element, "color", this.onlineSchedulingSettings.stl_color_buttons_text);
      this.renderer.setStyle(element, "max-width", this.panel_max_width+this.panel_max_width_uq);
      // this.renderer.setStyle(element, "box-shadow", 'none');
    });
    elements = this.el.nativeElement.querySelectorAll("button.mat-mdc-mini-fab .mat-mdc-button-persistent-ripple");
    elements.forEach(element => {
      this.renderer.setStyle(element, "border-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
    });

    // mini-buttons
    elements = this.el.nativeElement.querySelectorAll("button.mat-mdc-mini-fab");
    elements.forEach(element => {
      this.renderer.setStyle(element, "border-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
      this.renderer.setStyle(element, "background-color", this.onlineSchedulingSettings.stl_color_buttons);
      this.renderer.setStyle(element, "color", this.onlineSchedulingSettings.stl_color_buttons_text);
      this.renderer.setStyle(element, "box-shadow", 'none');
    });
    elements = this.el.nativeElement.querySelectorAll("button.mat-mdc-mini-fab .mat-mdc-button-persistent-ripple");
    elements.forEach(element => {
      this.renderer.setStyle(element, "border-radius", this.onlineSchedulingSettings.stl_corner_radius+'px');
    });


    let userSlotsChips = this.el.nativeElement.querySelectorAll("mat-chip");
    if(userSlotsChips && userSlotsChips.length>0)
      userSlotsChips.forEach(element => {
        this.renderer.setStyle(element, "background-color", 'rgb(224, 224, 224)');
    })
    userSlotsChips = this.el.nativeElement.querySelectorAll("mat-chip .mdc-evolution-chip__text-label");
    if(userSlotsChips && userSlotsChips.length>0)
      userSlotsChips.forEach(element => {
        this.renderer.setStyle(element, "color", this.onlineSchedulingSettings.stl_color_text);
    })
    userSlotsChips = this.el.nativeElement.querySelectorAll("mat-chip.selected");
    if(userSlotsChips && userSlotsChips.length>0)
      userSlotsChips.forEach(element => {
        this.renderer.setStyle(element, "background-color", this.onlineSchedulingSettings.stl_color_buttons);
    })
    userSlotsChips = this.el.nativeElement.querySelectorAll("mat-chip.selected .mdc-evolution-chip__text-label");
    if(userSlotsChips && userSlotsChips.length>0)
      userSlotsChips.forEach(element => {
        this.renderer.setStyle(element, "color", this.onlineSchedulingSettings.stl_color_buttons_text);
    })
    console.log('Dynamic styles refreshed')
}
  getOnlineSchedulingSettings(){ 
    this.http.get('/api/public/getOnlineSchedulingSettings?company_id='+this.company).subscribe(data => { 
            this.onlineSchedulingSettings = data as CompanySettings;
            switch(this.onlineSchedulingSettings){
                case null:{
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:"Error",message:"Error loading settings"}});
                  break;
                }default:{
                  this.panel_max_width=this.onlineSchedulingSettings.stl_panel_max_width;
                  this.panel_max_width_uq=this.onlineSchedulingSettings.stl_panel_max_width_unit;
                  this.color_buttons=this.onlineSchedulingSettings.stl_color_buttons;
                  // this.onlineSchedulingSettings.onlineSchedulingContactsList=
                  // non-created backend parameters

                  this.onlineSchedulingSettings.fld_toolbar_show=true;
                  this.onlineSchedulingSettings.fld_toolbar_title='';
                  this.onlineSchedulingSettings.fld_show_hero=true;
                  this.onlineSchedulingSettings.fld_hero_heigth='250';
                  this.onlineSchedulingSettings.fld_hero_img_link='2f7a20ac-84f-2024-10-01-12-11-38-722_encrypted.jpg';
                  this.onlineSchedulingSettings.fld_hero_cover_width='80'; // (%)
                  this.onlineSchedulingSettings.fld_hero_cover_color='17003476';
                  this.onlineSchedulingSettings.fld_hero_big_sign='Imagination';
                  this.onlineSchedulingSettings.fld_hero_small_sign='Beauty nails studio';
                  this.onlineSchedulingSettings.fld_currency_place='before'; //      (before/after price)
                  
                  this.onlineSchedulingSettings.txt_srvc_unavlbl_reasons='This service is unavailable for the following reasons:'; // This service is unavailable next reasons:
                  this.onlineSchedulingSettings.txt_unav_by_selected_employee='The selected specialist does not perform this service';
                  this.onlineSchedulingSettings.txt_unav_by_employees_who_available_by_selected_services='This service cannot be provided together with selected services within the same appointment.';
                  this.onlineSchedulingSettings.txt_unav_srvc_by_departament='This service is not available at the selected location.';
                  this.onlineSchedulingSettings.txt_spec_unavlbl_reasons='This specialist is unavailable for the following reasons:'; // This specialist is unavailable next reasons:
                  this.onlineSchedulingSettings.txt_unav_by_selected_services='This specialist does not provide the selected services';
                  this.onlineSchedulingSettings.txt_unav_spec_by_departament='This specialist is not available in the selected location.';
                  this.onlineSchedulingSettings.txt_unav_by_time='This specialist is not available at the selected time.';
                
                  this.onlineSchedulingSettings.stl_color_no_active_element='#dcdcdc';
                  this.onlineSchedulingSettings.company_about='Hello, my name is Bella, and I’m a nail technician with 5 years of experience. I specialize in nail art, manicures and pedicures!'
                  this.onlineSchedulingSettings.str_color_toolbar_buttons='#ffffff';

                  this.setDynamicStyle();
                  break;}
            }this.gettingData = false;},
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:"Error",message:error.error}})}
  )}
  setSelectedDepartment(id:number){
    this.receivedDepartmentsWithPartsList.map(dep=>{
      if(dep.department_id==id){
        this.selectedDepartment={
          department_id:id,department_name:dep.department_name,department_address:dep.department_address,parts:dep.parts
        }
      }
    })
  }

  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/public/getDepartmentsWithPartsList?company_id='+this.company).subscribe(data => {  
      this.receivedDepartmentsWithPartsList=data as Department[];
      this.formBaseInformation.get('departmentId').setValue(this.receivedDepartmentsWithPartsList[0].department_id);
      this.setSelectedDepartment(this.receivedDepartmentsWithPartsList[0].department_id);
      this.getEmployeesWithSchedulingList();
      this.getEmployeeWorkingTimeAndPlaces();
      this.getOnlineSchedulingProductCategories();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:"Error",message:error.error}})},
  )}

  getEmployeesWithSchedulingListBody(){
    return  {
      companyUrlSlug: this.company,
      dateFrom:       moment(),
      dateTo:         moment().add(+1,'y')/*.format("HH:mm")*/,
      depPartsIds:    this.getSelectedDeppartsIds(),
    }
  }

  getEmployeesWithSchedulingList(){
    const body = this.getEmployeesWithSchedulingListBody();
    this.http.post('/api/public/getEmployeesWithSchedulingList', body)
    .subscribe(
        (data) => {   
          this.allEmployeesList=data as Employee[];
          this.necessaryActionsBeforeGetChilds();
        },error => {
          this.initialLoading=false;
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},);
  }

  getEmployeeWorkingTimeAndPlacesBody(){
    return  {
      companyUrlSlug: this.company,
      dateFrom:       moment(),
      dateTo:         moment().add(+1,'y')/*.format("HH:mm")*/,
      depparts:       this.getSelectedDeppartsIds(),
    }
  }

  getEmployeeWorkingTimeAndPlaces(){
    this.http.post('/api/public/getEmployeeWorkingTimeAndPlaces', this.getEmployeeWorkingTimeAndPlacesBody()).subscribe(
      (data) => {
        if(!data){
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:'Executing query error!'}})
        }
        this.workShiftParts=data as WorkShiftPart[];
        this.necessaryActionsBeforeGetChilds();
        // this.breaks.map(break_=>{
        //   if(this.queryForm.get('employees').value.includes(break_.user.id) && this.usersOfBreaks.find((obj) => obj.id === break_.user.id) == undefined)
        //     this.usersOfBreaks.push(break_.user);
        // });
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})}
    );
  }

  getOnlineSchedulingProductCategories(){
    this.http.get('/api/public/getOnlineSchedulingProductCategories?companyUrlSlug='+this.company+'&langCode='+this.lang).subscribe(
      (data) => {   
        this.allProductCategories=data as ProductCategory[];
      },error => {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},);
  }

  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    if(this.actionsBeforeGetChilds==2){
      this.getAllDepartmentPartsIdsOfEmployees();
      this.getAllServicesIdsOfEmployees();
      this.getOnlineSchedulingServices();   // --> recalculateServices
      this.getCalendarEventsList();         // --> calculateTimeSlots, recalculateEmployees
      console.log('this.allServicesIdsOfEmployees=',this.allServicesIdsOfEmployees)
    }
  }

  getCalendarEventsList(){
    this.http.post('/api/public/getCalendarEventsList', {
      companyId: null,
      dateFrom: moment(),
      dateTo: moment().add(+1,'y'),
      departments: [],
      depparts: this.getSelectedDeppartsIds(),
      documents: [59],
      employees: this.getAllIdsOfEmployees(),
      ifNoEmployeesThenNoEvents: true,
      jobtitles: [],
      timeFrom: "00:00",
      timeTo: "23:59",
      withCancelledEvents: false,
      companyUrlSlug: this.company,
    }).subscribe(
      (data) => {
        if(!data){
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:'Executing query error!'}})
        }
        this.events = data as CalendarEvent[];
        this.calculateTimeSlots();
        this.recalculateEmployees();
        this.recalculateTimeSlots();
      })
  }

  // check intersect the slot with time range ( slot_start < range_end AND slot_end > range_start )
  slotHasTimeOverlapping(slot_start:string, slot_end:string, range_start:string, range_end:string):boolean{
    return(moment(slot_start).isBefore(moment(range_end)) && moment(slot_end).isAfter(moment(range_start)));
  }

  // calculate te word for the nearest dates
  // return 'today','tomorrow','date'
  getNearestTimeWord(employeeId):string{
    let result='date';
    let today = moment();
    let firstSlotDate: string='';
    for (var i = 0; i < this.allTimeSlots.length; i++) {
      if(employeeId == this.allTimeSlots[i].employeeId){
        firstSlotDate = moment(this.allTimeSlots[i].start).format(this.onlineSchedulingSettings.date_format);
        let currentSlotStart = moment(this.allTimeSlots[i].start);
        if(currentSlotStart.isBefore(today.endOf('day'))){
            result = 'today';
        }
        else if(currentSlotStart.isSameOrAfter(today.endOf('day')) &&
           currentSlotStart.isBefore(today.add(1,'day').endOf('day'))){
            result = 'tomorrow';
        }
      }
      if(firstSlotDate != '') break;
    }
    switch(result){
      case 'today':
        return this.onlineSchedulingSettings.txt_today;
      case 'tomorrow':
        return this.onlineSchedulingSettings.txt_tomorrow;
      default:
        return firstSlotDate;
    }
  }

  getNearestUserSlots(employeeId):string[]{
    let result: string[]=[];
    let firstSlotDay: string='';
    let slotCounter=0;
    let maxUserSlots:number = this.onlineSchedulingSettings.fld_time_format=='12'?3:4;
    // let timeFormat = this.onlineSchedulingSettings.fld_time_format=='12'?'hh:mm A':'HH:mm';
    for (var i = 0; i < this.allTimeSlots.length; i++) {
      if(employeeId == this.allTimeSlots[i].employeeId){
        if(firstSlotDay=='') firstSlotDay = moment(this.allTimeSlots[i].start).format("DD");
        if(moment(this.allTimeSlots[i].start).format("DD") === firstSlotDay) // to not get slots of the next day
          result.push(moment(this.allTimeSlots[i].start).toDate().toISOString());
        // result.push(moment(this.allTimeSlots[i].start).format(timeFormat));
        slotCounter++;
      }
      if(slotCounter >=maxUserSlots) break;
    }
    // console.log('Nearest user slote for '+ employeeId +' = ',result)
    return result;
  }

  getTimeFromSlot(dateTime:string){
    // this.hideNoAccessibleSlotsMessage();
    return moment(dateTime).format(this.onlineSchedulingSettings.fld_time_format=='12'?'hh:mm A':'HH:mm')
  }

  setSelectedDateTimeAndEmployee(dateTime:string, employee:Employee){
    this.selectedDateTime = dateTime;
    this.recalculateEmployees();
    this.onSelectEmployee(employee); // if it is new employee - it will be changed, and acceptible services will be recalculated
    setTimeout(() => {this.setDynamicStyle(); }, 10);
  }
  setSelectedDateTime(dateTime:string){
    this.selectedDateTime = dateTime;
    this.recalculateEmployees();
    setTimeout(() => {this.setDynamicStyle(); }, 10);
  }
  isUserTimeSlotSelected(dateTime:string, employeeId:number){
    return(dateTime == this.selectedDateTime && employeeId == this.selectedEmployeeId)
  }
  isTimeSlotSelected(dateTime:string){
    return(dateTime == this.selectedDateTime)
  }
  isArraysIntersect(array1:number[],array2:number[]){
    return array1.filter(value => array2.includes(value)).length > 0;
  }

  recalculateServices(){
    let allServicesIdsOfSelectedEmployee:number[]=[];
    if(this.selectedEmployeeId==null || this.selectedEmployeeId==0)
      allServicesIdsOfSelectedEmployee=this.allServicesIdsOfEmployees;
    else 
      allServicesIdsOfSelectedEmployee=this.getAllServicesIdsOfSelectedEmployee(this.selectedEmployeeId);
    let allServicesIdsOfSelectedDepartment:number[]= this.getAllServicesIdsOfSelectedDepartment();
    // console.log('allServicesIdsOfSelectedEmployee',allServicesIdsOfSelectedEmployee);
    // console.log('allServicesIdsOfSelectedDepartment',allServicesIdsOfSelectedDepartment);
    this.allServicesList.map(service=>{
      service.available_by_selected_employee=(this.selectedEmployeeId==null || this.selectedEmployeeId==0) || allServicesIdsOfSelectedEmployee.includes(service.id);
      service.available_by_departament=allServicesIdsOfSelectedDepartment.includes(service.id);
      service.available_by_employees_who_available_by_selected_services = this.getServicesIdsAvailableByEmployeesWhoAvailableBySelectedServices().includes(service.id);
      // service.available_by_employees_who_available_by_selected_services = this.getAllServicesIds().includes(service.id);
    })
  }
  
  recalculateEmployees(){
    let allEmployeesIdsOfSelectedDepartment:number[] = this.getAllEmployeesIdsOfSelectedDepartment();
    let allEmployeesIdsOfSelectedServices:number[] = this.getEmployeesIdsAvailableBySelectedServices();
    let allEmployeesIdsOfSelectedTimeSlot:number[] = this.getAllEmployeesIdsOfSelectedTimeSlot();
    this.allEmployeesList.map(employee=>{
      employee.available_by_departament=allEmployeesIdsOfSelectedDepartment.includes(employee.id);
      employee.available_by_selected_services=allEmployeesIdsOfSelectedServices.includes(employee.id); //employees who can provide all selected services in selected department
      employee.available_by_time=allEmployeesIdsOfSelectedTimeSlot.includes(employee.id);
    });
  }

  // Calculating of result united list of non-repeating time slots of all available employees
  recalculateTimeSlots(){
    let resultTimeSlotsList:TimeSlot[]=[...this.allTimeSlots];

    // Sorting by "Oldest first"
    resultTimeSlotsList.sort((a, b) => a.start.localeCompare(b.start));

    this.resultTimeSlotsList = [];
    
    let availableEmployeesIds = (this.selectedEmployeeId==null || this.selectedEmployeeId==0)?this.getEmployeesIdsAvailableBySelectedServicesAndDepartment():[this.selectedEmployeeId];
    let currentTime = '';
    resultTimeSlotsList.map(slot=>{
      if(availableEmployeesIds.includes(slot.employeeId) && currentTime != slot.start){
        this.resultTimeSlotsList.push(slot);
        currentTime=slot.start;
      }        
    })



    console.log('resultTimeSlotsList',this.resultTimeSlotsList)

  }

  // Calculating start slots time for each employee
  // Runs only once, because the result array of this function is not changing
  // result like:   
  // employee: 1; start: date_time
  // employee: 1; start: date_time
  // employee: 2; start: date_time
  // employee: 2; start: date_time
  // ...
  calculateTimeSlots(){
    this.allTimeSlots = [];
    let slotId=0;
    this.setDynamicStyle();
    this.workShiftParts.map(workShiftPart=>{
      // if employee in this work shift part is working in one of department parts that belong to the selected department
      if(this.isArraysIntersect(workShiftPart.department_parts_ids, this.getSelectedDeppartsIds())){
        let slotCount = 0;
        while(
          moment(workShiftPart.start).
          add((this.onlineSchedulingSettings.fld_step * slotCount),'minutes').
          add(60,'minutes'). // за 60 минут до окончания рабочего отрезка (до конца смены или перерыва на обед) заказы не принимаются
                             // 60 minutes before the end of the working period (before the end of the shift or lunch break) orders are not accepted
          isSameOrBefore(workShiftPart.end)
        ){
          let canAddSlot = true;
          for (var i = 0; i < this.events.length; i++) {
            if( moment(workShiftPart.start).
                add((this.onlineSchedulingSettings.fld_step * slotCount),'minutes').
                add(60,'minutes').// за 60 минут до начала уже запланированной встречи (с другим клиентом) заказы не принимаются
                                  // 60 minutes before the start of an already scheduled appointment (with another client) orders are not accepted
                isBetween(this.events[i].start, moment(this.events[i].end).add(60,'minutes')) // это те же самые 60 минут выше
            ){
              canAddSlot=false;
              break; // that is because I do not use ".map" here
            }                                                                                 // it's the same 60 minutes above
            
          }
          // check that the time of slot is not in the past
          if((moment(workShiftPart.start).
              subtract(60,'minutes').   // не принимать заказы менее чем за 60 минут до начала встречи
                                        // do not accept orders less than 60 minutes before the Acceptance starts
              add((this.onlineSchedulingSettings.fld_step * slotCount),'minutes')).
              isSameOrBefore(moment())
          )
            canAddSlot=false;
          if(canAddSlot){
            this.allTimeSlots.push(
              {
                id: slotId,
                employeeId: workShiftPart.employee_id,
                start: (moment(workShiftPart.start).
                add((this.onlineSchedulingSettings.fld_step * slotCount),'minutes')).toDate().toISOString()
              }
            )
            slotId++;
          }
          slotCount++;
        }
      }
    });
    // console.log(this.allTimeSlots);
  }
  onSelectService(service:Service){
    
    if(service.available_by_selected_employee && service.available_by_departament && service.available_by_employees_who_available_by_selected_services){
      console.log('service in onSelectService',service)

      if(!this.selectedServicesIds.includes(service.id)){
        this.selectedServicesIds.push(service.id);
        console.log('this.selectedServicesIds1',this.selectedServicesIds) 
      }else
        this.selectedServicesIds.splice(this.selectedServicesIds.indexOf(service.id),1);


      console.log('this.selectedServicesIds2',this.selectedServicesIds)  
      this.recalculateEmployees();
      this.recalculateServices();
      this.recalculateTimeSlots();
      
      setTimeout(() => {this.setDynamicStyle(); }, 10);
    } else this.openOsDialog('service_reason', service);
     
    // console.log('indexOf(serviceId)=',this.selectedServicesIds.indexOf(serviceId))
    // console.log('selectedServicesIds', this.selectedServicesIds)

  }

  getSelectedCategoryServicesIds(){ 
    let result:number[] = [];
    this.allServicesList.map(service=>{
      if(this.selectedCategoryId == 0 && result.indexOf(service.id) === -1)
        result.push(service.id);
      else {
        service.categories.map(serviceCategory=>{
          if(serviceCategory==this.selectedCategoryId && result.indexOf(service.id) === -1)
            result.push(service.id);
        })
      }
    })
    return result;
  }
    

  getCurrentLevelCategories():ProductCategory[]{
    let result:ProductCategory[] = [];
    if(this.selectedCategoryId == 0){
      // console.log('selectedCategoryId = 0')
      this.allProductCategories.map(category=>{
        if(category.parent_id==0)
          result.push(category)
      })
      // console.log('Root categories:',result)
      return result;
    } else if(this.selectedCategoryHasChildrens()){
      
      this.allProductCategories.map(category=>{
        if(category.parent_id==this.selectedCategoryId)
          result.push(category)
      })
      return result;
    } else {
      let parentOfSelectedCategory = this.getParentOfSelectedCategory();
      this.allProductCategories.map(category=>{
        if(category.parent_id==parentOfSelectedCategory)
          result.push(category)
      })
      return result;
    }
  }

  getParentOfSelectedCategory():number{
    let result = 0;
    this.allProductCategories.map(category=>{
      if(category.id==this.selectedCategoryId)
        result=category.parent_id;
    })
    return result;
  }

  selectedCategoryHasChildrens():boolean{
    let result=false;
    this.allProductCategories.map(category=>{
      if(category.parent_id==this.selectedCategoryId)
        result=true;
    })
    return result;
  }

  setSelectedCategoryId(categoryId){
    this.selectedCategoryId = categoryId;
    this.recalculateServices();
    setTimeout(() => {this.setDynamicStyle(); }, 10);
  }

  getAllDepartmentPartsIdsOfEmployees(){
    this.allDepartmentPartsIdsOfEmployees=[];
    this.workShiftParts.map(workShiftPart=>{
      workShiftPart.department_parts_ids.map(depPartId=>{
        if(this.allDepartmentPartsIdsOfEmployees.indexOf(depPartId) === -1) 
          this.allDepartmentPartsIdsOfEmployees.push(depPartId);
      })
    })
  }

  isCategorySelected(categoryId){
    return(categoryId == this.selectedCategoryId)
  }

  goCategoriesHighLevel(){
    // if(!this.selectedCategoryHasChildrens())
    this.selectedCategoryId=this.getParentOfSelectedCategory();
    this.recalculateServices();
    setTimeout(() => {this.setDynamicStyle(); }, 10);
  }
  getSelectedCategoryName():string{
    let result='';
    this.allProductCategories.map(category=>{
      if(category.id==this.selectedCategoryId)
        result=category.name;
    })
    return result;
  }
  
  getServicesIdsAvailableByEmployeesWhoAvailableBySelectedServices(){
    let employeesIdsAvailableBySelectedServices = this.getEmployeesIdsAvailableBySelectedServices();
    let result:number[]=[];
    let allDepPartsOfSelectedDepartment = this.getSelectedDeppartsIds();
    if(this.selectedServicesIds.length==0) return(this.getAllServicesIds())
    else {
      this.allEmployeesList.map(employee=>{
        if(employeesIdsAvailableBySelectedServices.includes(employee.id)){
          employee.departmentPartsWithServicesIds.map(depPart=>{
            if(allDepPartsOfSelectedDepartment.includes(depPart.id)){
              depPart.servicesIds.map(serviceId=>{
                if(result.indexOf(serviceId) === -1)
                  result.push(serviceId);
              })
            }
          })
        }
      })
      return result;
    }    
  }

  getAllServicesIds(){
    let result:number[]=[];
    this.allServicesList.map(service=>{result.push(service.id)});
    return result;
  }

  getAllServicesIdsOfEmployees(){
    this.allServicesIdsOfEmployees=[];
    this.allEmployeesList.map(employee=>{
      employee.departmentPartsWithServicesIds.map(depPart=>{
        if(this.allDepartmentPartsIdsOfEmployees.indexOf(depPart.id) !== -1){
          depPart.servicesIds.map(serviceId=>{
            if(this.allServicesIdsOfEmployees.indexOf(serviceId) === -1) 
              this.allServicesIdsOfEmployees.push(serviceId);
          })
        }
      })
    })
  }

  // Returns IDs of all employees who can provide its services in selected department
  getAllEmployeesIdsOfSelectedDepartment():number[]{
    let result:number[]=[];
    let allDepPartsOfSelectedDepartment = this.getSelectedDeppartsIds();
    this.allEmployeesList.map(employee=>{
      employee.departmentPartsWithServicesIds.map(depPart=>{
        if(allDepPartsOfSelectedDepartment.indexOf(depPart.id) !== -1 && result.indexOf(employee.id) === -1){
          result.push(employee.id)
        }
      })
    })
    return result;
  }

  // Returns IDs of employees who can provide services at the time of selected time slot (selectedDateTime)
  getAllEmployeesIdsOfSelectedTimeSlot():number[]{
    if(this.selectedDateTime=='')
      return this.getAllIdsOfEmployees();
    else{
      let result:number[]=[];
      this.allEmployeesList.map(employee=>{
        for (var i = 0; i < this.allTimeSlots.length; i++) {
          // if time slot of employee is the same than selected time slot (selectedDateTime)
          if(this.allTimeSlots[i].employeeId == employee.id && this.allTimeSlots[i].start==this.selectedDateTime){
            result.push(employee.id);
            break;
          }
        }
      })
      return result;
    }
  }

  // Returns IDs of employees who can provide all selected services in selected department
  getEmployeesIdsAvailableBySelectedServices():number[]{
    if(this.selectedServicesIds.length==0)
      return this.getAllIdsOfEmployees();
    else{
      let result:number[]=[];
      let allDepPartsOfSelectedDepartment = this.getSelectedDeppartsIds();
      this.allEmployeesList.map(employee=>{
        let employeeServicesIds:number[]=[];
        employee.departmentPartsWithServicesIds.map(depPart=>{
          if(allDepPartsOfSelectedDepartment.includes(depPart.id)){
            depPart.servicesIds.map(serviceId=>{
              employeeServicesIds.push(serviceId);
            })
          }
        })
        // if employee services includes all selected services - this employee can be selected as employee who can provide all selected services in selected department
        // let checker = (arr, target) => target.every(v => arr.includes(v))
        if(this.selectedServicesIds.every(r => employeeServicesIds.includes(r))){
          result.push(employee.id);
          // console.log('Found all of ', this.selectedServicesIds, ' in ', employeeServicesIds);
        }else{
          // console.log('Did not find all of ', this.selectedServicesIds, ' in ', employeeServicesIds);
        }
      })
      return result;
    }
  }
  getEmployeesIdsAvailableBySelectedServicesAndDepartment():number[]{
    let result:number[]=[];
    this.allEmployeesList.map(employee=>{
      if(employee.available_by_departament && employee.available_by_selected_services)
        result.push(employee.id);
    });
    return result;
  }
  // getAllServicesIdsOfEmployeeInCurrentDepartment(employeeId):number[]{
  //   let result:number[]=[];
  //   let allDepPartsOfSelectedDepartment = this.getSelectedDeppartsIds();
  //   this.allEmployeesList.map(employee=>{
  //     if(employee.id==employeeId)
  //       employee.departmentPartsWithServicesIds.map(depPart=>{
  //         if(allDepPartsOfSelectedDepartment.indexOf(depPart.id) !== -1){
  //           depPart.servicesIds.map(serviceId=>{
  //             if(result.indexOf(serviceId) === -1)
  //               result.push(serviceId)
  //           })
  //         }
  //       })
  //   })
  //   return result;
  // }

  // All employee's services IDs (selected department is mo matter)
  getAllServicesIdsOfSelectedEmployee(employeeId):number[]{
    let result:number[]=[];
    this.allEmployeesList.map(employee=>{
      if(employee.id==employeeId)
        employee.departmentPartsWithServicesIds.map(depPart=>{
            depPart.servicesIds.map(serviceId=>{
              if(result.indexOf(serviceId) === -1)
                result.push(serviceId)
            })
        })
    })
    return result;
  }

  // All selected department's services IDs  (selected employee is mo matter)
  getAllServicesIdsOfSelectedDepartment():number[]{
    let result:number[]=[];
    let allDepPartsOfSelectedDepartment = this.getSelectedDeppartsIds();
    this.allEmployeesList.map(employee=>{
      employee.departmentPartsWithServicesIds.map(depPart=>{
        if(allDepPartsOfSelectedDepartment.indexOf(depPart.id) !== -1){
          depPart.servicesIds.map(serviceId=>{
            if(result.indexOf(serviceId) === -1)
              result.push(serviceId)
          })
        }
      })
    })
    return result;
  }

  getAllIdsOfEmployees():number[]{
    let result:number[]=[];
    this.allEmployeesList.map(employee=>{
     result.push(employee.id);
    })
    return result;
  }

  getSelectedDeppartsIds():number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      if(department.department_id==this.formBaseInformation.get('departmentId').value)
        department.parts.map(deppart=>{
          depparts.push(deppart.id);
        })
    });
    return depparts;
  }

  getOnlineSchedulingServices(){
    this.http.post('/api/public/getOnlineSchedulingServices', {
      companyUrlSlug: this.company,
      langCode: this.lang,
      servicesIds: this.allServicesIdsOfEmployees,
      depId:     this.formBaseInformation.get('departmentId').value
    })
    .subscribe(
        (data) => {
          let allServicesList = data as Service[];
          allServicesList.map(service=>{
            if(this.allServicesList.find(obj => obj.id === service.id) == null)
              this.allServicesList.push(service)
          })
          this.recalculateServices();
        },error => {
          this.initialLoading=false;
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},);
  }

  clickBtnToMainScreen(){
    this.currentView = 'main';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
    
  }
  clickBtnSelectSpecialist(){
    this.currentView = 'specialist';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }
  clickBtnSelectTime(){
    this.currentView = 'time';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }
  clickBtnSelectServices(){
    this.currentView = 'services';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }
  onSelectEmployee(employee:Employee){    
      if(employee.available_by_departament && employee.available_by_selected_services && employee.available_by_time){
        if(this.selectedEmployeeId != employee.id){
          this.selectedEmployeeId=employee.id;
          this.recalculateServices();
          this.recalculateEmployees();
          this.recalculateTimeSlots();
          setTimeout(() => {this.setDynamicStyle(); }, 1);
        }        
      } else this.openOsDialog('employee_reason',employee);
  }
  onSelectAnyEmployee(){
    this.selectedEmployeeId=0;
    this.selectedDateTime='';
    this.recalculateServices();
    this.recalculateEmployees();
    this.recalculateTimeSlots();
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }
  onClickBtnSelectServices(){
    this.currentView = 'services';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }
  onClickBtnSelectTime(){
    this.currentView = 'time';
    this.ref.detectChanges();
  }

  onClickBtnReady(){}
  
  onClickBtnSelectEmployee(){
    this.currentView = 'specialist';
    setTimeout(() => {this.setDynamicStyle(); }, 1);
  }

  matCalendarOnclickDay(event:Moment): void {
    this.viewDate = event.toDate();
    setTimeout(() => {this.setDynamicStyle(); }, 10);    
  }
  isDateEqualsViewDate(dateIso:string){
    return(moment(dateIso).format('YYYY-MM-DD') === moment(this.viewDate).format('YYYY-MM-DD'));
  }
  changeDateMatCalendar(date: Date) {
    let date_ = this._adapter.parse(moment(date).format('YYYY-MM-DD'), 'YYYY-MM-DD');
    this.calendar._goToDateInView(this._adapter.getValidDateOrNull(date_), 'month');
    this.calendar.selected=this._adapter.getValidDateOrNull(date_);
  }
  timeTo24h(time:string){
    // In ru locale MomentJs has 'утра' and 'вечера' instead of AM and PM
    // if current locale is ru - moment to convert string to time format needs to have string contained 'утра','вечера' instead of AM PM  
    if(this.locale=='ru') time=time.replace('PM','вечера').replace('AM','утра');
    return(this.isTimeFormatAmPm(time)?moment(time, 'hh:mm A').format('HH:mm'):time);
  }
  isTimeFormatAmPm(time:string){
    return((time.includes("AM") || time.includes("PM") || time.includes("утра") || time.includes("вечера")));
  }

  handleEndOfInitialLoading(){
  }

  // screen: 
  // 'employee_reason'
  // 'service_reason'

  openOsDialog(screen:string, object:any) {
    let data:any = {};
    switch (screen){
      case 'employee_reason':{
        data.object = object;
        data.screen = screen;
        data.txt_spec_unavlbl_reasons = this.onlineSchedulingSettings.txt_spec_unavlbl_reasons;
        data.txt_unav_by_selected_services = this.onlineSchedulingSettings.txt_unav_by_selected_services;
        data.txt_unav_spec_by_departament = this.onlineSchedulingSettings.txt_unav_spec_by_departament;
        data.txt_unav_by_time = this.onlineSchedulingSettings.txt_unav_by_time;
      };
      case 'service_reason':{
        data.object = object;
        data.screen = screen;
        data.txt_srvc_unavlbl_reasons = this.onlineSchedulingSettings.txt_srvc_unavlbl_reasons;
        data.txt_unav_by_selected_employee = this.onlineSchedulingSettings.txt_unav_by_selected_employee;
        data.txt_unav_by_employees_who_available_by_selected_services = this.onlineSchedulingSettings.txt_unav_by_employees_who_available_by_selected_services;
        data.txt_unav_srvc_by_departament = this.onlineSchedulingSettings.txt_unav_srvc_by_departament;
      }
    }
    const dialogFastDcedule = this.osDialogComponent.open(OsDialogComponent, {
      width: '80vw',
      maxWidth: '400px',
      data: data,
    });
    dialogFastDcedule.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      if(result){
        
      }
    });
  }

  onDepartmentSelect(){
    this.receivedDepartmentsWithPartsList.map(department=>{
      if(department.department_id == this.formBaseInformation.get('departmentId').value){
        this.selectedDepartment = department;        
      }
    });
  }
  getContactIcon(contact_type:string):string[]{
    let result = ['',''];
    this.contactTypes.map(type=>{
      if(type.value===contact_type){
        result=type.icon;
      }
    })
    return result;
  }
  getContactLink(contact_type:string, contact_value:string):string{
    let result ='';
    this.contactTypes.map(type=>{
      if(type.value===contact_type){
        switch(contact_type){
          case 'email' :{
            result='mailto:'+contact_value;
            break;
          }
          case 'telephone' :{
            result='tel:'+contact_value;
            break;
          }
          case 'website' :{
            result='https://'+contact_value;
            break;
          }
          default:
            result=contact_value;
        }
      }
    })
    return result;
  }
  clickContactListItem(){

  }
  
}
