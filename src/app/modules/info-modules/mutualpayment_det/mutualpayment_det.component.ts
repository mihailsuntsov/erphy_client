import { Component, Inject, Input, OnInit, Optional} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { LoadSpravService } from '../../../services/loadsprav';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { translate } from '@ngneat/transloco'; //+++
import { CommonUtilitesService } from '../../../services/common_utilites.serviсe'; //+++
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();
// import { LOCALE_ID } from '@angular/core';

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
  value: number;
  viewValue: string;
}

@Component({
  selector: 'app-mutualpayment_det',
  templateUrl: './mutualpayment_det.component.html',
  styleUrls: ['./mutualpayment_det.component.css'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    LoadSpravService,CommonUtilitesService,Cookie]
})
export class MutualpaymentDetComponent implements OnInit {
  queryForm:any;//форма для отправки запроса 
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  myId:number=0;
  mode='viewInWindow'; // opening in window

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToView:boolean = false;
  gettingTableData:boolean=true;

  bal_on_begin: number = 0;
  bal_on_end: number = 0;
  income: number = 0;
  expendtr: number = 0;

  numRows: NumRow[] = [
    {value: 5, viewValue: '5'},
    {value: 10, viewValue: '10'},
    {value: 25, viewValue: '25'}
  ];
  
  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  // displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  
  // if it calls from the tab oа Counterparty document - mode will be 'viewInTab'
  @Input() companyId:number;
  @Input() cagentId:number;
  @Input() cagent:string;
  // @Input() locale:string;
  
  constructor(
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public cu: CommonUtilitesService,
    // @Inject(LOCALE_ID) public locale: string,
    public deleteDialog: MatDialog,
    public mutualpaymentDetDialog: MatDialogRef<MutualpaymentDetComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    // 
    public _adapter: DateAdapter<any>) { }
    // public _adapter: DateAdapter<any>) {_adapter.setLocale('en-us') }
    ngOnInit() {
      // alert('--'+this.data.dateFrom+'--');
      this._adapter.setLocale(this.data?this.data.locale:'en-gb')
      if(this.cagent && this.cagent!='') this.mode='viewInTab'; else this.mode='viewInWindow';
      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(this.mode=='viewInWindow'?this.data.companyId:this.companyId,[]), // предприятие, по которому идет запрос данных (передаётся из вызывающего окна)
        cagentId: new UntypedFormControl(this.mode=='viewInWindow'?this.data.cagentId:this.cagentId,[]), // контрагент, по которому идет запрос данных (передаётся из вызывающего окна)
        dateFrom: new UntypedFormControl((this.data && this.data.dateFrom!=null)?moment(this.data.dateFrom,'DD.MM.YYYY'):moment('01.01.2000','DD.MM.YYYY'),[]),   // дата С
        dateTo: new UntypedFormControl((this.data && this.data.dateTo!=null)?moment(this.data.dateTo,'DD.MM.YYYY'):moment(),[]),     // дата По
        sortColumn: new UntypedFormControl('date_time_created_sort',[]), //
        sortAsc: new UntypedFormControl('desc',[]), //
        offset: new UntypedFormControl(0,[]), //
        result: new UntypedFormControl(10,[]), //
        filterOptionsIds: new UntypedFormControl([],[]), //
        searchString: new UntypedFormControl('',[]), //
      });

      // if(Cookie.get('mutualpayment_det_companyId')=='undefined' || Cookie.get('mutualpayment_det_companyId')==null)     
        // Cookie.set('mutualpayment_det_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('mutualpayment_det_companyId')=="0"?"0":+Cookie.get('mutualpayment_det_companyId'));
      if(Cookie.get('mutualpayment_det_sortAsc')=='undefined' || Cookie.get('mutualpayment_det_sortAsc')==null)       
        Cookie.set('mutualpayment_det_sortAsc',this.queryForm.get('sortAsc').value); else this.queryForm.get('sortAsc').setValue(Cookie.get('mutualpayment_det_sortAsc'));
      // if(Cookie.get('mutualpayment_det_sortColumn')=='undefined' || Cookie.get('mutualpayment_det_sortColumn')==null)    
        // Cookie.set('mutualpayment_det_sortColumn',this.queryForm.get('sortColumn').value); else this.queryForm.get('sortColumn').setValue(Cookie.get('mutualpayment_det_sortColumn'));
      // if(Cookie.get('mutualpayment_det_offset')=='undefined' || Cookie.get('mutualpayment_det_offset')==null)        
        // Cookie.set('mutualpayment_det_offset',this.queryForm.get('offset').value); else this.queryForm.get('offset').setValue(Cookie.get('mutualpayment_det_offset'));
      // if(Cookie.get('mutualpayment_det_result')=='undefined' || Cookie.get('mutualpayment_det_result')==null)        
        // Cookie.set('mutualpayment_det_result',this.queryForm.get('result').value); else this.queryForm.get('result').setValue(Cookie.get('mutualpayment_det_result'));
      
      this.fillOptionsList();//заполняем список опций фильтра
    
      this.getCompaniesList();// 
      // alert(this.data.locale)
      if(!this.data || this.data.locale==null) this.getSettings();
    }
// settings loading
getSettings(){
  let result:any;
  this.http.get('/api/auth/getMySettings')
    .subscribe(
        data => { 
          result=data as any;
          this._adapter.setLocale(result.locale?result.locale:'en-gb')        // setting locale in moment.js
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
}
    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=47')// права на приосмотр регулируются документом Взаиморасчёты
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==584)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==585)});
    this.getData();
  }

  refreshPermissions():boolean{
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany)?true:false;
    // console.log("allowToView - "+this.allowToView);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------



  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
      this.getTableHeaderTitles();
      this.getPagesList();
      this.getTable();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Нет прав на просмотр"}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('opendoc');
    this.displayedColumns.push('doc_name');
    this.displayedColumns.push('doc_number');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('summ_in');
    this.displayedColumns.push('summ_out');
    this.displayedColumns.push('status');
  }

  getPagesList(){
    this.http.post('/api/auth/getMutualpaymentDetailedPagesList', this.queryForm.getRawValue())
            .subscribe(
                data => {this.receivedPagesList=data as string [];
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            ); 
  }

  getTable(){
    this.gettingTableData=true;
    this.http.post('/api/auth/getMutualpaymentDetailedTable', this.queryForm.getRawValue())
            .subscribe(
                (data) => {
                  let retObj = data as any; 
                  this.dataSource.data = retObj.table;
                  this.bal_on_begin = retObj.summ_on_start;
                  this.bal_on_end = retObj.summ_on_end;
                  this.income = retObj.summ_in;
                  this.expendtr = retObj.summ_out;
                  if(this.dataSource.data && this.dataSource.data.length==0 && +this.queryForm.get('offset').value>0) this.setPage(0);
                  this.gettingTableData=false;
                },
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} 
            );
  }

  setNumOfPages(){
    this.queryForm.get('offset').setValue(this.queryForm.get('result').value);
    // Cookie.set('mutualpayment_det_result',this.queryForm.get('result').value);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.queryForm.get('offset').setValue(value);
    // Cookie.set('mutualpayment_det_offset',value);
    this.getData();
  }

  setSort(valueSortColumn:any) // set sorting column
  {
      if(valueSortColumn==this.queryForm.get('sortColumn').value){// если колонка, на которую ткнули, та же, по которой уже сейчас идет сортировка
          if(this.queryForm.get('sortAsc').value=="asc"){
              this.queryForm.get('sortAsc').setValue("desc")
          } else {  
              this.queryForm.get('sortAsc').setValue("asc")
          }
      Cookie.set('mutualpayment_det_sortAsc',this.queryForm.sortAsc);
      } else {
          this.queryForm.get('sortColumn').setValue(valueSortColumn);
          this.queryForm.get('sortAsc').setValue("asc");
          Cookie.set('mutualpayment_det_sortAsc',"asc");
          // Cookie.set('mutualpayment_det_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    // Cookie.set('mutualpayment_det_companyId',this.queryForm.get('companyId').value);
    this.resetOptions();
    this.getData();
  }
    
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.getSetOfPermissions();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }
  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

  setDefaultCompany(){
    if(+this.queryForm.get('companyId').value==0)
      this.queryForm.get('companyId').setValue(this.myCompanyId);
    this.getCRUD_rights(this.permissionsSet);
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

  onNoClick(): void {
    this.mutualpaymentDetDialog.close();
    }
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/

  resetOptions(){
    // this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
    this.queryForm.get('filterOptionsIds').setValue([]);
  }
  fillOptionsList(){
    this.optionsIds=[/*{id:1, name:"Показать только удалённые"},*/];
  }
  clickApplyFilters(){
    let showOnlyDeletedCheckboxIsOn:boolean = false; //присутствует ли включенный чекбокс "Показывать только удалённые"
    this.selectionFilterOptions.selected.forEach(z=>{
      if(z.id==1){showOnlyDeletedCheckboxIsOn=true;}
    })
    // this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
    this.queryForm.get('offset').setValue(0);//сброс пагинации
    this.getData();
  }
  updateSortOptions(){//после определения прав пересматриваем опции на случай, если права не разрешают действия с определенными опциями, и исключаем эти опции
    // let i=0; 
    // this.optionsIds.forEach(z=>{
    //   console.log("allowToDelete - "+this.allowToDelete);
    //   if(z.id==1 && !this.allowToDelete){this.optionsIds.splice(i,1)}//исключение опции Показывать удаленные, если нет прав на удаление
    //   i++;
    // });
    if (this.optionsIds.length>0) this.displaySelectOptions=true; else this.displaySelectOptions=false;//если опций нет - не показываем меню опций
  }
  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  createFilterOptionsCheckedList(){//this.queryForm.filterOptionsIds - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при нажатии на чекбокс
    this.queryForm.get('filterOptionsIds').setValue([]);//                                                     
    this.selectionFilterOptions.selected.forEach(z=>{

      const control = this.queryForm.get('filterOptionsIds');
      control.push(+z.id);

      // this.queryForm.filterOptionsIds.push(+z.id);
    });
  } 
}
