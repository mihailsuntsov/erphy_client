import { Component, OnInit } from '@angular/core';
import {  Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router'; //import package from module
import { HttpParams, HttpClient } from '@angular/common/http';

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Observable } from 'rxjs';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface ProductCategories{
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
  onlineSchedulingLanguagesList: OnlineSchedulingLanguage[];
  onlineSchedulingFieldsTranslations: OnlineSchedulingFieldsTranslation[];
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
@Component({
  selector: 'app-onlinescheduling',
  templateUrl: './onlinescheduling.component.html',
  styleUrls: ['./onlinescheduling.component.css'],
  providers:[    
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class OnlineschedulingComponent {

  constructor(
    private http: HttpClient,
    public MessageDialog: MatDialog,
    private _adapter: DateAdapter<any>,
    private route: ActivatedRoute //dependency injection
  ){

  }


  inner_background_color='#ffffff';
  panel_max_width=600;
  panel_max_width_uq='px';

  company: any;
  lang: any;
  gettingData=false;
  onlineSchedulingSettings:any={};
  initialLoading=true;// to handle the end of loading document
  employeesListLoadQtt = 0; // if == 3 then indication of list loading will shown
  receivedDepartmentsWithPartsList: Department [] = [];// array to getting the list of departments with theys parts
  receivedEmployeesList  : Employee[] = [];//array to get the list of employees
  allEmployeesList: Employee[]=[];
  formBaseInformation:any;// the form of main information
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)


  // Time variables
  locale:string='en-us';// locale (for dates, calendar etc.)
  workShiftParts: WorkShiftPart[] = [];
  productCategories: ProductCategories[]=[];
  allDepartmentPartsIdsOfEmployees:number[]=[];
  allServicesIdsOfEmployees:number[]=[];


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
   this.getDepartmentsWithPartsList();// -> |getEmployeesWithSchedulingList|
   //                                       |getCalendarUsersBreaksList    |
   
  }

  getOnlineSchedulingSettings(){ 
    this.http.get('/api/public/getOnlineSchedulingSettings?company_id='+this.company).subscribe(data => { 
            this.onlineSchedulingSettings = data as CompanySettings;
            switch(this.onlineSchedulingSettings){
                case null:{
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:"Error",message:"Error loading settings"}});
                  break;
                }default:{break;}
            }this.gettingData = false;},
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:"Error",message:error.error}})}
  )}
    
  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/public/getDepartmentsWithPartsList?company_id='+this.company).subscribe(data => {  
      this.receivedDepartmentsWithPartsList=data as Department[];
      this.formBaseInformation.get('departmentId').setValue(this.receivedDepartmentsWithPartsList[0].department_id);
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
        this.productCategories=data as ProductCategories[];
      },error => {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},);
  }

  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    if(this.actionsBeforeGetChilds==2){
      this.getAllDepartmentPartsIdsOfEmployees();
      this.getAllServicesIdsOfEmployees();
      console.log('this.allServicesIdsOfEmployees=',this.allServicesIdsOfEmployees)
    }
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



  // getProductsIdsThat
/*
  getEmployeesListQueryBody(isFree:boolean, kindOfNoFree?:string){
  return  {
      isAll:        false,               // all or only free/not_free
      isFree:       isFree, 
      kindOfNoFree: kindOfNoFree,        // busyByAppointments or busyBySchedule
      appointmentId:0,
      companyId:    this.formBaseInformation.get('company_id').value,
      dateFrom:     this.formBaseInformation.get('date_start').value,
      timeFrom:     this.timeTo24h(this.formBaseInformation.get('time_start').value),
      dateTo:       this.formBaseInformation.get('date_end').value,
      timeTo:       this.timeTo24h(this.formBaseInformation.get('time_end').value),
      servicesIds:  [],
      depPartsIds:  this.getSelectedDeppartsIds(),
      jobTitlesIds: [],
      employeesIds: []
    }
  }
  getEmployeesList(isFree:boolean=true){
    const body = this.getEmployeesListQueryBody(isFree); 
    this.employeesListLoadQtt=3;  
    this.http.post('/api/public/getEmployeesList', body)
    .subscribe(
        (data) => {   
          this.receivedEmployeesList=data as Employee[];
          this.updateEmployeeValues();
          this.employeesListLoadQtt--;
          if(isFree){
            this.getBusyEmployeesList('busyByAppointments');
            this.getBusyEmployeesList('busyBySchedule');
          }
        },error => {
          this.employeesListLoadQtt=0;
          this.initialLoading=false;
          console.log(error);
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},); //+++
  }

  getBusyEmployeesList(kindOfNoFree:string){
    const body = this.getEmployeesListQueryBody(false, kindOfNoFree); 
    this.http.post('/api/auth/getEmployeesList', body) 
    .subscribe(
        (data) => {   
          this.receivedEmployeesList.push(...data as Employee[]);
          this.updateEmployeeValues();
          this.employeesListLoadQtt--;  
          if(this.employeesListLoadQtt==0 && this.initialLoading){
            //getBusyEmployeesList - is the last function of document initial loading
            this.initialLoading=false;
            this.handleEndOfInitialLoading();
          }
        },error => {
          this.employeesListLoadQtt=0;
          this.initialLoading=false;
          console.log(error);
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Error',message:error.error}})},); //+++
  } 

  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateEmployeeValues(){
    if(+this.formBaseInformation.get('employeeId').value!=0){
      this.receivedEmployeesList.forEach(x => {
        if(x.id==this.formBaseInformation.get('employeeId').value){
          this.formBaseInformation.get('employeeName').setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.formBaseInformation.get('employeeName').setValue('');
      this.formBaseInformation.get('employeeId').setValue(null);
    }
  }
*/
  getSelectedDeppartsIds():number[]{
    // alert(this.formBaseInformation.get('departmentId').value)
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      if(department.department_id==this.formBaseInformation.get('departmentId').value)
        department.parts.map(deppart=>{
          depparts.push(deppart.id);
        })
    });
    return depparts;
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

}
