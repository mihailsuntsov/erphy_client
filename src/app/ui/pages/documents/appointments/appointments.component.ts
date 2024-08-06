import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute} from '@angular/router'; //!!!
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-appointments-table.service';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { SettingsAppointmentDialogComponent } from 'src/app/modules/settings/settings-appointment-dialog/settings-appointment-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {MessageDialog} from 'src/app/ui/dialogs/messagedialog.component';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++

export interface CheckBox {
  id: number;
  is_completed:boolean;
  company_id: number;
  department_id: number;
  creator_id: number;
}
export interface idAndName {
  id: number;
  name:string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}
interface idNameDescription{
  id: number;
  name: string;
  description: string;
}
@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService] //+++
})
export class AppointmentsComponent implements OnInit {

  // if calling as module from Appointment or other parent document
  @Input() company_id:    number;
  @Input() customer_id:     number;
  @Input() appointment_id:     number;
  @Input() booking_doc_name_variation:      string;
  
  constructor(private queryFormService:   QueryFormService,
    private activateRoute: ActivatedRoute,// !!!
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public MessageDialog: MatDialog,
    private settingsAppointmentDialogComponent: MatDialog,
    public dialogRef1: MatDialogRef<AppointmentsComponent>,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,) {
      // !!!
      if(activateRoute.snapshot.params['option']){
        this.option = +activateRoute.snapshot.params['option'];
        this.company = +activateRoute.snapshot.params['company'];    
      }
     }

  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);// специальный класс для удобной работы с чекбоксами
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка СВОИХ отделений
  myCompanyId:number=0;//
  myId:number=0;
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  settingsForm: any; // форма с настройками
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  companySettings:any={booking_doc_name_variation:'reservation'};
  timeFormat:string='24';   //12 or 24
  mode:string = 'window';
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToViewMyDocs:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMyDocs:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToDeleteMyDepartments:boolean = false;
  allowToDeleteMyDocs:boolean = false;

  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;

  showOpenDocIcon:boolean=false;

  gettingTableData:boolean=true;

  numRows: NumRow[] = [
    {value: '5', viewValue: '5'},
    {value: '10', viewValue: '10'},
    {value: '25', viewValue: '25'}
  ];
  
  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  //переменные для управления динамическим отображением элементов
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние 
  optionsIds: idAndName [] = [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  option:number = 0; // опция для фильтра при переходе в данный модуль по роутеру
  company:number = 0; // опция для фильтра при переходе в данный модуль по роутеру // !!!
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  ngOnInit() {
    this.sendingQueryForm.companyId = this.mode == 'standart'?this.company:this.company_id;
    this.sendingQueryForm.departmentId='0';
    this.sendingQueryForm.sortAsc='desc';
    this.sendingQueryForm.sortColumn='date_time_start_sort';
    this.sendingQueryForm.offset='0';
    this.sendingQueryForm.result='10';
    this.sendingQueryForm.searchCategoryString="";
    this.sendingQueryForm.appointmentId = this.appointment_id?this.appointment_id:0;
    this.sendingQueryForm.customerId = this.customer_id?this.customer_id:0;
    this.sendingQueryForm.filterOptionsIds = [];
      // !!!
    this.sendingQueryForm.filterOptionsIds = [this.option];

    if(this.booking_doc_name_variation) this.companySettings.booking_doc_name_variation=this.booking_doc_name_variation;
    
    this.mode = this.company_id?'window':'standart';

    if(this.company==0 && this.mode=='standart'){
     if(Cookie.get('appointments_companyId')=='undefined' || Cookie.get('appointments_companyId')==null)     
       Cookie.set('appointments_companyId',this.sendingQueryForm.companyId, 30, '/'); else this.sendingQueryForm.companyId=(Cookie.get('appointments_companyId')=="0"?"0":+Cookie.get('appointments_companyId'));
      if(Cookie.get('appointments_departmentId')=='undefined' || Cookie.get('appointments_departmentId')==null)  
        Cookie.set('appointments_departmentId',this.sendingQueryForm.departmentId, 30, '/'); else this.sendingQueryForm.departmentId=(Cookie.get('appointments_departmentId')=="0"?"0":+Cookie.get('appointments_departmentId'));
    }
    if(this.mode=='standart'){
      if(Cookie.get('appointments_sortAsc')=='undefined' || Cookie.get('appointments_sortAsc')==null)       
        Cookie.set('appointments_sortAsc',this.sendingQueryForm.sortAsc, 30, '/'); else this.sendingQueryForm.sortAsc=Cookie.get('appointments_sortAsc');
      if(Cookie.get('appointments_sortColumn')=='undefined' || Cookie.get('appointments_sortColumn')==null)    
        Cookie.set('appointments_sortColumn',this.sendingQueryForm.sortColumn, 30, '/'); else this.sendingQueryForm.sortColumn=Cookie.get('appointments_sortColumn');
      if(Cookie.get('appointments_offset')=='undefined' || Cookie.get('appointments_offset')==null)        
        Cookie.set('appointments_offset',this.sendingQueryForm.offset, 30, '/'); else this.sendingQueryForm.offset=Cookie.get('appointments_offset');
      if(Cookie.get('appointments_result')=='undefined' || Cookie.get('appointments_result')==null)        
        Cookie.set('appointments_result',this.sendingQueryForm.result, 30, '/'); else this.sendingQueryForm.result=Cookie.get('appointments_result');
    }
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');
    this.getBaseData('myDepartmentsList');
    this.getBaseData('timeFormat');
    
    this.fillOptionsList();//заполняем список опций фильтра
    if(this.option>0){        
      this.selectionFilterOptions.select(this.optionsIds[this.option-1]);
    } 

    this.settingsForm = new UntypedFormGroup({     
      companyId: new UntypedFormControl          (null,[]),
      startTime: new UntypedFormControl          ('current',[]),        // current / set_manually
      endDateTime: new UntypedFormControl        ('sum_all_length',[]), // no_calc / sum_all_length / max_length 
      startTimeManually: new UntypedFormControl  ('00:00',[]),          // 'HH:mm' if start_time = 'set_manually'
      endTimeManually: new UntypedFormControl    ('00:01',[]),          // 'HH:mm' if end_time = 'calc_date_but_time'
      hideEmployeeField: new UntypedFormControl  (false ,[]),           // If for all services of company employees are not needed
      calcDateButTime: new UntypedFormControl    (false ,[]),           // if user wants to calc only dates. Suitable for hotels for checkout time
    });
    
      this.getCompaniesList();// 
    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=59')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
    },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
    );
  }

  getCRUD_rights(permissionsSet:any[]){    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==705)});
    this.allowToCreateMyCompany = this.permissionsSet.some(             function(e){return(e==706)});
    this.allowToCreateMyDepartments = this.permissionsSet.some(         function(e){return(e==707)});
    this.allowToViewAllCompanies = this.permissionsSet.some(            function(e){return(e==708)});
    this.allowToViewMyCompany = this.permissionsSet.some(               function(e){return(e==709)});
    this.allowToViewMyDepartments = this.permissionsSet.some(           function(e){return(e==710)});
    this.allowToViewMyDocs = this.permissionsSet.some(                  function(e){return(e==711)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(          function(e){return(e==712)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(             function(e){return(e==713)});
    this.allowToUpdateMyDepartments = this.permissionsSet.some(         function(e){return(e==714)});
    this.allowToUpdateMyDocs = this.permissionsSet.some(                function(e){return(e==715)});
    this.allowToDeleteAllCompanies = permissionsSet.some(               function(e){return(e==716)});
    this.allowToDeleteMyCompany = permissionsSet.some(                  function(e){return(e==717)});
    this.allowToDeleteMyDepartments = permissionsSet.some(              function(e){return(e==718)});
    this.allowToDeleteMyDocs = permissionsSet.some(                     function(e){return(e==719)});

    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments||this.allowToViewMyDocs)?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToUpdateMyDepartments||this.allowToUpdateMyDocs)?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany || this.allowToDeleteMyDepartments || this.allowToDeleteMyDocs)?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    this.visBtnAdd = (this.allowToCreate)?true:false;
    
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------



  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      // console.log('department 1 = '+this.sendingQueryForm.departmentId);
      this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
      this.doFilterDepartmentsList();//если нет просмотра по свому предприятию - фильтруем список отделений предприятия до своих отделений
      // console.log('department 2 = '+this.sendingQueryForm.departmentId);
      this.getTableHeaderTitles();
      this.getPagesList();
      this.getTable();
      // this.getPriceTypesList();
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} //+++
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete && this.mode == 'standart') this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    if(this.mode == 'standart') this.displayedColumns.push('doc_number');
    this.displayedColumns.push('name'); 
    this.displayedColumns.push('dep_part');
    this.displayedColumns.push('status');
    this.displayedColumns.push('product_count');
    this.displayedColumns.push('sum_price');
    this.displayedColumns.push('is_completed');
    this.displayedColumns.push('description');
    if(this.mode == 'standart') this.displayedColumns.push('creator');
    this.displayedColumns.push('date_time_start');
  }

  getPagesList(){
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(this.sendingQueryForm)
    .subscribe(
        data => {this.receivedPagesList=data as string [];
        this.size=this.receivedPagesList[0];
        this.pagenum=this.receivedPagesList[1];
        this.listsize=this.receivedPagesList[2];
        this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
        error =>  {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    ); 
  }

  getTable(){    
    this.gettingTableData=true;
    this.queryFormService.getTable(this.sendingQueryForm)
    .subscribe(
        (data) => {
          this.dataSource.data = data as any []; 
          if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
          this.gettingTableData=false;
        },
        error =>  {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }
  /**                               ЧЕКБОКСЫ                                  */
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
        this.dataSource.data.forEach(row => {
          // if(!row.is_completed){this.selection.select(row);}
          if(this.showCheckbox(row)){this.selection.select(row);}//если чекбокс отображаем, значит можно удалять этот документ
        });
        this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }
  resetSelecion(){
    this.selection.clear(); 
  }
  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }
  createCheckedList(){
    this.checkedList = [];
    // console.log("1");
    for (var i = 0; i < this.dataSource.data.length; i++) {
      // console.log("2");
      if(this.selection.isSelected(this.dataSource.data[i]))
        this.checkedList.push(this.dataSource.data[i].id);
    }
    if(this.checkedList.length>0){
      // console.log("3");
        this.hideAllBtns();
        if(this.allowToDelete) this.visBtnDelete = true;
        if(this.checkedList.length==1){this.visBtnCopy = true}
    }else{console.log("");this.showOnlyVisBtnAdd()}
    // console.log("checkedList - "+this.checkedList);
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:CheckBox):boolean{
    if(!row.is_completed && (
      (this.allowToDeleteAllCompanies)||
      (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId)||
      (this.allowToDeleteMyDepartments && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id))||
      (this.allowToDeleteMyDocs && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id) && row.creator_id==this.myId))
      )return true; else return false;
  }
  /**                              КОНЕЦ ЧЕКБОКСОВ                                  */

  hideAllBtns(){
    this.visBtnAdd = false;
    this.visBtnDelete = false;
  }
  showOnlyVisBtnAdd(){
    if(this.allowToCreate) this.visBtnAdd = true;
    this.visBtnDelete = false;
  }

  setNumOfPages(){
    this.clearCheckboxSelection();
    this.createCheckedList();
    this.sendingQueryForm.offset=0;
    Cookie.set('appointments_result',this.sendingQueryForm.result, 30, '/');
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('appointments_offset',value, 30, '/');
    this.getData();
  }

  clearCheckboxSelection(){
    this.selection.clear();
    this.dataSource.data.forEach(row => this.selection.deselect(row));
  }

  setSort(valueSortColumn:any) // set sorting column
  {
      this.clearCheckboxSelection();
      if(valueSortColumn==this.sendingQueryForm.sortColumn){// если колонка, на которую ткнули, та же, по которой уже сейчас идет сортировка
          if(this.sendingQueryForm.sortAsc=="asc"){
              this.sendingQueryForm.sortAsc="desc"
          } else {  
              this.sendingQueryForm.sortAsc="asc"
          }
      Cookie.set('appointments_sortAsc',this.sendingQueryForm.sortAsc, 30, '/');
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('appointments_sortAsc',"asc", 30, '/');
          Cookie.set('appointments_sortColumn',valueSortColumn, 30, '/');
      }
      this.getData();
  }
  getCompanyId(){
    return Cookie.get('appointments_companyId')
  }
  onCompanySelection(){
    Cookie.set('appointments_companyId',this.sendingQueryForm.companyId, 30, '/');
    Cookie.set('appointments_departmentId','0', 30, '/');
    // console.log('appointments_companyId - '+Cookie.get('appointments_companyId'));
    // console.log('appointments_departmentId - '+Cookie.get('appointments_departmentId'));
    this.sendingQueryForm.departmentId="0"; 
    this.resetOptions();
    this.getDepartmentsList();
    this.getCompanySettings();
  }
  onDepartmentSelection(){
    Cookie.set('appointments_departmentId',this.sendingQueryForm.departmentId, 30, '/');
    // console.log('appointments_companyId - '+Cookie.get('appointments_companyId'));
    // console.log('appointments_departmentId - '+Cookie.get('appointments_departmentId'));
    this.resetOptions();
    this.getData();
  }
  clickBtnDelete(): void {
    const dialogRef = this.deleteDialog.open(DeleteDialog, {
      width: '300px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  deleteDocs(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
    return this.http.post('/api/auth/deleteAppointments', body) 
    .subscribe(
    (data) => {
      let result=data as any;
      switch(result.result){
        case 0:{this.getData();this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));break;} 
        case 1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
        case 2:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
        case 3:{let numbers:string='';
          for(var i=0;i<result.docs.length;i++){numbers=numbers+' <a href="ui/appointmentsdoc/'+result.docs[i].id+'">'+result.docs[i].doc_number+'</a>';}
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.no_del_childs')+numbers}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
  }
  clickBtnRestore(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.restore'), //+++
        query: translate('menu.dialogs.q_restore'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.undeleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  undeleteDocs(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
    return this.http.post('/api/auth/undeleteAppointments', body) 
    .subscribe(
    (data) => {   
      let result=data as any;
      switch(result){ //+++
        case 1:{this.getData();this.openSnackBar(translate('menu.msg.rec_success'), translate('menu.msg.close'));break;}  //+++
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
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
  getMyDepartmentsList(){ //+++
    if(this.receivedMyDepartmentsList.length==0)
      this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
      .subscribe(
          (data) => {this.receivedMyDepartmentsList=data as any [];
            this.setDefaultDepartment();},
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
      );
      else this.setDefaultDepartment();
  }

  setDefaultCompany(){
    // console.log("Cookie CompanyId=",+Cookie.get('appointments_companyId'))
    // console.log("this.mode",this.mode)
    // console.log(+Cookie.get('appointments_companyId')==0)
    // console.log("!companyIdInList",!this.companyIdInList(+Cookie.get('appointments_companyId')))
    if(this.mode=='standart'){
      if(Cookie.get('appointments_companyId')!='undefined' && +Cookie.get('appointments_companyId')!=0){
        if(this.companyIdInList(+Cookie.get('appointments_companyId')))
          this.sendingQueryForm.companyId=+Cookie.get('appointments_companyId');
        else {
          this.sendingQueryForm.companyId=this.myCompanyId;
          Cookie.set('appointments_companyId', this.myCompanyId.toString(), 30, '/');}
      } else {
        this.sendingQueryForm.companyId=this.myCompanyId;
        Cookie.set('appointments_companyId', this.myCompanyId.toString(), 30, '/');
      }        
    }
    this.getDepartmentsList();
    this.getCompanySettings();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.sendingQueryForm.companyId,false)
    .subscribe(
      (data) => {this.receivedDepartmentsList=data as any [];
      this.getMyDepartmentsList();},
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}, //+++
    );
  }

  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      this.sendingQueryForm.departmentId=+this.receivedDepartmentsList[0].id;
      Cookie.set('appointments_departmentId',this.sendingQueryForm.departmentId, 30, '/');
    }
  this.getCRUD_rights(this.permissionsSet);
  }

  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    let inMyDepthsId:boolean = false;
    if(this.receivedMyDepartmentsList){//проверяем, т.к. может быть ".forEach of null", если выбираем не свое предприятие
      this.receivedMyDepartmentsList.forEach(myDepth =>{
        myDepth.id==id?inMyDepthsId=true:null;
      });
    }
  return inMyDepthsId;
  }

  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToViewAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }

  doFilterDepartmentsList(){
    if( (!this.allowToViewAllCompanies && !this.allowToViewMyCompany && this.allowToViewMyDepartments)||
        (!this.allowToViewAllCompanies && !this.allowToViewMyCompany && !this.allowToViewMyDepartments && this.allowToViewMyDocs)){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }

  // ------------------------------------ User settings ------------------------------------
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsAppointment').subscribe
    (data => 
      { 
        result=data as any;
          this.settingsForm.get('startTime').setValue(result.startTime);
          this.settingsForm.get('endDateTime').setValue(result.endDateTime);
          this.settingsForm.get('startTimeManually').setValue(result.startTimeManually);
          this.settingsForm.get('endTimeManually').setValue(result.endTimeManually);
          this.settingsForm.get('hideEmployeeField').setValue(result.hideEmployeeField);
          this.settingsForm.get('calcDateButTime').setValue(result.calcDateButTime);
      },
      error => console.log(error)
    );
  }

  openDialogSettings() { 
    const dialogSettings = this.settingsAppointmentDialogComponent.open(SettingsAppointmentDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      data:
      {
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        timeFormat: this.timeFormat,
        companyId: this.sendingQueryForm.companyId
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        this.settingsForm.get('companyId').setValue(this.sendingQueryForm.companyId);
        this.settingsForm.get('startTime').setValue(result.get('startTime').value);
        this.settingsForm.get('endDateTime').setValue(result.get('endDateTime').value);
        this.settingsForm.get('startTimeManually').setValue(result.get('startTimeManually').value);
        this.settingsForm.get('endTimeManually').setValue(result.get('endTimeManually').value);
        this.settingsForm.get('hideEmployeeField').setValue(result.get('hideEmployeeField').value);
        this.settingsForm.get('calcDateButTime').setValue(result.get('calcDateButTime').value);
        this.saveSettingsAppointment();
      }
    });
  }
  
  saveSettingsAppointment(){
    return this.http.post('/api/auth/saveSettingsAppointment', this.settingsForm.getRawValue())
    .subscribe(
      (data) => {   
        this.openSnackBar(translate('menu.msg.settngs_saved'), translate('menu.msg.close')); //+++
        this.getSettings();  
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
    );
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
  getCompanySettings(){
    this.http.get('/api/auth/getCompanySettings?id='+this.sendingQueryForm.companyId).subscribe(data => {this.companySettings = data as any;},error => {console.log(error);});
  }
//***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  resetOptions(){
    this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
    this.sendingQueryForm.filterOptionsIds = [];
  }
  fillOptionsList(){
    this.optionsIds=[
    {id:1, name:"menu.top.only_del"},
    // {id:2, name:"menu.top.only_exprd_or"},
    // {id:3, name:"menu.top.only_new_ordr"}
    ];
  }
  clickApplyFilters(){
    let showOnlyDeletedCheckboxIsOn:boolean = false; //присутствует ли включенный чекбокс "Показывать только удалённые"
    this.selectionFilterOptions.selected.forEach(z=>{
      if(z.id==1){showOnlyDeletedCheckboxIsOn=true;}
    })
    this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=0;//сброс пагинации
    this.getData();
  }
  updateSortOptions(){//после определения прав пересматриваем опции на случай, если права не разрешают действия с определенными опциями, и исключаем эти опции
    let i=0; 
    this.optionsIds.forEach(z=>{
      // console.log("allowToDelete - "+this.allowToDelete);
      if(z.id==1 && !this.allowToDelete){this.optionsIds.splice(i,1)}//исключение опции Показывать удаленные, если нет прав на удаление
      i++;
    });
    if (this.optionsIds.length>0) this.displaySelectOptions=true; else this.displaySelectOptions=false;//если опций нет - не показываем меню опций
  }
  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  createFilterOptionsCheckedList(){//this.sendingQueryForm.filterOptionsIds - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при нажатии на чекбокс
    this.sendingQueryForm.filterOptionsIds = [];//                                                     
    this.selectionFilterOptions.selected.forEach(z=>{
      this.sendingQueryForm.filterOptionsIds.push(+z.id);
    });
  }
  // sometimes in cookie "..._companyId" there value that not exists in list of companies. If it happens, company will be not selected and data not loaded until user select company manually
  companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}
}
