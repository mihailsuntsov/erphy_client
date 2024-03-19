import { Component, EventEmitter, OnInit, Output} from '@angular/core';
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
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();
import { LOCALE_ID, Inject } from '@angular/core';

interface DocResponse {
  
}
interface depparts{
  product_id: number;
  product_name: string;
  dep_parts_ids: number[];
}
export interface idAndName {
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

  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  myId:number=0;
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedDepartmentsWithPartsList: any [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  receivedWorkShiftsList: any[]=[]; // array of previously saved work shifts templates
  receivedVacationsList: any[]=[]; // array of previously saved vacations templates
  day_type:string = 'workshift'; //   type of the day: workshift or vacation
  selectedWorkShiftTemplateId: number = null;
  selectedVacationTemplateId:  number = null;
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)
  timeFormat:string='24';   //12 or 24
  displayedColumns:string[] = [];//columnss of the table of work shift breaks
  gettingTableData: boolean = false;//идет загрузка товарных позиций
  shift_time_from_value: number=0; // start time of shift, time stamp like 946728000000
  shift_time_to_value: number=0; // end timof shift, time stamp like 946728000000
  shiftAndBreaksTimeArray: number[]=[];
  workShiftDaysSelectingMode: boolean = false;//идет загрузка товарных позиций
  vacationDaysSelectingMode: boolean = false;//идет загрузка товарных позиций
  settingsGeneral:any;
  userSettings:any;
  dateFormat:string = 'YYYY-MM-DD'; // user's format of the date
  suffix:string = "en"; // language suffix 
  table_dates: string[] = [];       // array of dates (in format dateFormat) between date range dateFrom and dateTo
  table_dates_days: string[] = [];  // array of names of days of week in accordance of table_dates
  
  //Формы
  queryForm:any;//форма для отправки запроса 
  scheduleData: DocResponse;
  gettingSceduleData:boolean=false;  
  workShiftForm: any; // form for work shift
  vacationForm: any;  // form for vacation



  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  // selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  // optionsIds: idAndName [];
  // displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
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
        time_from_value: new UntypedFormControl     (0,[Validators.required]),
        time_to_value: new UntypedFormControl     (0,[Validators.required]),
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
    if(this.datesExistAndValid)
      if(this.allowToView)
      {
        this.getEmployeeWorkSchedule();
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
    this.formColumns();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.queryForm.get('companyId').value,false)
    .subscribe(
      (data) => {this.receivedDepartmentsList=data as any [];
        this.selectAllDepartments();},
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}, //+++
    );
  }

  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
                      this.selectAllCheckList('depparts','queryForm');
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
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}

  clickApplyFilters(){
    // this.getData();
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

  // updateDocument(){ 
  //   return this.http.post('/api/auth/updateEmployeeWorkSchedule', this.queryForm.value)
  //     .subscribe(
  //         (data) => 
  //         {   
  //           let result:number=data as number;
  //           switch(result){
  //             case null:{// null возвращает если не удалось сохранить документ из-за ошибки
  //               this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
  //               break;
  //             }
  //             case -1:{// недостаточно прав
  //                      // not enought permissions
  //               this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
  //               break;
  //             }
  //             default:{// Успешно
  //               this.getData();
  //               this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
  //             }
  //           }                  
  //         },
  //         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
  //     );
  // }

 
  getEmployeeWorkSchedule(){ 
  this.http.post('/api/auth/getEmployeeWorkSchedule', this.queryForm)
    .subscribe(
        (data) => {
          this.gettingSceduleData=false;
          if(!data){
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
          }
          this.scheduleData=data as DocResponse []; 
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
  }
  // unselectAllDepartments(){
    // this.queryForm.get(field).setValue([])
  // }
  selectAllCheckList(field:string, form:string){
    let depparts = field=='depparts'?this.getAllDeppartsIds():this.getAllJobtitlesIds();
    form=='queryForm'?this.queryForm.get(field).setValue(depparts):this.workShiftForm.get(field).setValue(depparts);
  }
  
  selectAllDepPartsOneDep(dep_id:number, form:string){
    const depparts = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = form=='queryForm'?this.queryForm.get('depparts').value:this.workShiftForm.get('depparts').value;
    form=='queryForm'?this.queryForm.get('depparts').setValue(depparts.concat(ids_now)):this.workShiftForm.get('depparts').setValue(depparts.concat(ids_now));
  }

  unselectAllCheckList(field:string, form:string){
    form=='queryForm'?this.queryForm.get(field).setValue([]):this.workShiftForm.get(field).setValue([]);
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
      if(department.department_id==dep_id)
        department.parts.map(deppart=>{
          depparts.push(deppart.id);
        })
    });
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

  formColumns(){
    this.displayedColumns=[];
    this.displayedColumns.push('time_from');
    this.displayedColumns.push('time_to');
    this.displayedColumns.push('paid');
    this.displayedColumns.push('precent');
    if(this.editability)
      this.displayedColumns.push('delete');
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
    this.workShiftForm.value.breaks.map(i => 
    { // Cписок не должен содержать пересекающиеся временные отрезки
      // The list should not contain overlapping time periods
      if(false)
      {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
        thereOverlapping=true; 
      }
    });
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
      time_from_value: new UntypedFormControl     (0,[Validators.required]),
      time_to_value: new UntypedFormControl     (0,[Validators.required]),
      paid: new UntypedFormControl (false,[]),
      precent: new UntypedFormControl (0,[Validators.required,Validators.pattern('^[0-9]{1,3}$'),Validators.max(100),Validators.min(0)]),
    });
  }
  clearTable(): void {
    const control = this.getControlTablefield();
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('menu.dialogs.deleting'),warning: translate('docs.msg.delete_all_rows'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        control.clear();
      }});  
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
    return((time.includes("AM") || time.includes("PM")));
  }

  timeTo24h(time:string){
    return(this.isTimeFormatAmPm(time)?moment(time, 'hh:mm A').format('HH:mm'):time);
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
    this.workShiftDaysSelectingMode=false;
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
  onClickWorkShiftDayAddBtn(){
    this.workShiftDaysSelectingMode=!this.workShiftDaysSelectingMode;
  }
  
  //при изменении поля Цена в таблице товаров
  onChangePaymentOneDay(){
    this.commaToDotInVacationForm('payment_per_day');  // замена запятой на точку
  } 

  clearVacationForm(){
    this.vacationDaysSelectingMode=false;
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
  onClickVacationAddBtn(){
    this.vacationDaysSelectingMode=!this.vacationDaysSelectingMode;
  }
  onWorkshiftTemplateSelection(){

  }

  onVacationsSelection(){
    
  }

  getTextDateRange(firstDate:string, lastDate:string){
    if (moment(firstDate, this.dateFormat).isSame(moment(lastDate, this.dateFormat), 'day'))
      return [lastDate];
    let date = firstDate;
    const dates = [date+', '+moment(date, this.dateFormat).format('dddd')];
    this.table_dates = [date];
    this.table_dates_days = [moment(date, this.dateFormat).format('dddd')];
    do {
      date = moment(date, this.dateFormat).add(1, 'day').format(this.dateFormat);
      dates.push(date+', '+moment(date, this.dateFormat).format('dddd'));
      this.table_dates.push(date);
      this.table_dates_days.push(moment(date, this.dateFormat).format('dddd'))
    } while (moment(date, this.dateFormat).isBefore(moment(lastDate, this.dateFormat)));
    return dates;
  };
  onGetTextDatesClick(){
    const dates = this.getTextDateRange(this.queryForm.get('dateFrom').value.format(this.dateFormat), this.queryForm.get('dateTo').value.format(this.dateFormat));
    console.log('table_dates: ', this.table_dates);
    console.log('table_dates_days: ', this.table_dates_days);
  }
  

}
