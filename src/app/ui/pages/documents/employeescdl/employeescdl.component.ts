import { Component, EventEmitter, OnInit, Output} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray } from '@angular/forms';
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
interface filterDepparts{
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
  receivedDepartmentsWithPartsList: any [] = [];//массив для получения списка отделений с их частями
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей

  //Формы
  queryForm:any;//форма для отправки запроса 
  scheduleData: DocResponse;
  gettingSceduleData:boolean=false;  

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  allowToUpdate:boolean = false;

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
    public cu: CommonUtilitesService,
    public deleteDialog: MatDialog,
    private service: TranslocoService,
    @Inject(LOCALE_ID) public locale: string,
    private _adapter: DateAdapter<any>
    ) { }

    ngOnInit() {
      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new UntypedFormControl(moment().startOf('month'),[]),   // дата С
        dateTo: new UntypedFormControl(moment().endOf('month'),[]),     // дата По
        filterDepparts: new UntypedFormControl([],[]), // set of department parts
        filterJobtitles: new UntypedFormControl([],[]), // set of job titles
      });

      if(Cookie.get('employeescdl_companyId')=='undefined' || Cookie.get('employeescdl_companyId')==null)     
      Cookie.set('employeescdl_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('employeescdl_companyId')=="0"?"0":+Cookie.get('employeescdl_companyId'));

      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');      
      this.getCompaniesList();// 

    }
  
  get formValid() {
    if(this.queryForm!=undefined)
      return (this.queryForm.valid);
    else return true;
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
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    this.getCRUD_rights();
  }

  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
                      this.selectAllCheckList('filterDepparts');
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getJobtitleList(){ 
    return this.http.get('/api/auth/getJobtitlesList?company_id='+this.queryForm.get('companyId').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesList=data as any [];
                      this.selectAllCheckList('filterJobtitles');
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
    this.getDepartmentsWithPartsList();
    this.getJobtitleList();
    // this.getData();
  }

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  updateDocument(){ 
    return this.http.post('/api/auth/updateEmployeeWorkSchedule', this.queryForm.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
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
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }

 
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
  
  selectAllCheckList(field:string){
    let depparts = field=='filterDepparts'?this.getAllDeppartsIds():this.getAllJobtitlesIds();
    this.queryForm.get(field).setValue(depparts);
  }
  selectAllDepPartsOneDep(dep_id:number){
    const depparts = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = this.queryForm.get('filterDepparts').value;
    this.queryForm.get('filterDepparts').setValue(depparts.concat(ids_now));
  }
  unselectAllCheckList(field:string){
    this.queryForm.get(field).setValue([]);
  }
  unselectAllDepPartsOneDep(dep_id:number){
    const ids_in_deppat = this.getAllDeppartsIdsOfOneDep(dep_id);
    const ids_now = this.queryForm.get('filterDepparts').value;
    this.queryForm.get('filterDepparts').setValue(ids_now.filter(e => !ids_in_deppat.includes(e)));
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
























}
