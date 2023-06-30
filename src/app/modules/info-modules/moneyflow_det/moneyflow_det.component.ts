import { Component, EventEmitter, Inject, OnInit, Optional, Output} from '@angular/core';
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

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

export interface CheckBox {
  id: number;
  is_completed:boolean;
  company_id: number;
  department_id: number;
  creator_id: number;
}
interface DocResponse {
  summ_before_pa: number;
  summ_before_bx: number;
  summ_before_all: number;
  summ_result_pa: number;
  summ_result_bx: number;
  summ_result_all: number;
  total_summ_in_pa: number;
  total_summ_out_pa: number;
  total_summ_in_bx: number;
  total_summ_out_bx: number;
  total_summ_in_all: number;
  total_summ_out_all: number;
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
  selector: 'app-moneyflow_det',
  templateUrl: './moneyflow_det.component.html',
  styleUrls: ['./moneyflow_det.component.css'],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    /*QueryFormService,*/LoadSpravService,Cookie]
})
export class MoneyflowDetComponent implements OnInit {
  queryForm:any;//форма для отправки запроса 
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  myId:number=0;
  paymentAccounts:any[]=[];// список расчётных счетов предприятия
  boxofficesAccounts:any[]=[];// список касс предприятия

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToView:boolean = false;
  gettingTableData:boolean=true;

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

  //переменные для начальных и конечных балансов
  summ_before_pa: number=0;
  summ_before_bx: number=0;
  summ_before_all: number=0;
  summ_result_pa: number=0;
  summ_result_bx: number=0;
  summ_result_all: number=0;
  total_summ_in_pa: number=0;
  total_summ_out_pa: number=0;
  total_summ_in_bx: number=0;
  total_summ_out_bx: number=0;
  total_summ_in_all: number=0;
  total_summ_out_all: number=0;
  
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  // @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  constructor(
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public moneyflowDetDialog: MatDialogRef<MoneyflowDetComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public _adapter: DateAdapter<any>) {_adapter.setLocale(this.data.locale) }

    ngOnInit() {

      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(this.data.companyId,[]), // предприятие, по которому идет запрос данных (передаётся из вызывающего окна)
        // cagentId: new FormControl(this.data.cagentId,[]), // контрагент, по которому идет запрос данных (передаётся из вызывающего окна)
        dateFrom: new UntypedFormControl(this.data.date?moment(this.data.date,this.data.dateFormat):moment().startOf('year'),[]),   // дата С
        dateTo: new UntypedFormControl(this.data.date?moment(this.data.date,this.data.dateFormat):moment(),[]),     // дата По
        sortColumn: new UntypedFormControl('date_time_created_sort',[]), //
        sortAsc: new UntypedFormControl('desc',[]), //
        offset: new UntypedFormControl(0,[]), //
        result: new UntypedFormControl(10,[]), //
        filterOptionsIds: new UntypedFormControl([],[]), //
        searchString: new UntypedFormControl('',[]), //
        accountsIds: new UntypedFormControl     (this.data.accountsIds,[]),   
        boxofficesIds: new UntypedFormControl     (this.data.boxofficesIds,[]),
      });

      // if(Cookie.get('moneyflow_det_companyId')=='undefined' || Cookie.get('moneyflow_det_companyId')==null)     
        // Cookie.set('moneyflow_det_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('moneyflow_det_companyId')=="0"?"0":+Cookie.get('moneyflow_det_companyId'));
      if(Cookie.get('moneyflow_det_sortAsc')=='undefined' || Cookie.get('moneyflow_det_sortAsc')==null)       
        Cookie.set('moneyflow_det_sortAsc',this.queryForm.get('sortAsc').value); else this.queryForm.get('sortAsc').setValue(Cookie.get('moneyflow_det_sortAsc'));
      // if(Cookie.get('moneyflow_det_sortColumn')=='undefined' || Cookie.get('moneyflow_det_sortColumn')==null)    
        // Cookie.set('moneyflow_det_sortColumn',this.queryForm.get('sortColumn').value); else this.queryForm.get('sortColumn').setValue(Cookie.get('moneyflow_det_sortColumn'));
      // if(Cookie.get('moneyflow_det_offset')=='undefined' || Cookie.get('moneyflow_det_offset')==null)        
        // Cookie.set('moneyflow_det_offset',this.queryForm.get('offset').value); else this.queryForm.get('offset').setValue(Cookie.get('moneyflow_det_offset'));
      // if(Cookie.get('moneyflow_det_result')=='undefined' || Cookie.get('moneyflow_det_result')==null)        
        // Cookie.set('moneyflow_det_result',this.queryForm.get('result').value); else this.queryForm.get('result').setValue(Cookie.get('moneyflow_det_result'));
      
      this.fillOptionsList();//заполняем список опций фильтра

      this.myId = this.data.myId;
      this.myCompanyId = this.data.myCompanyId;
      this.receivedCompaniesList=this.data.companiesList;

      if(this.data.locale==null) 
        this.getSettings();
      
      this.getCompaniesList();// 
    }
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
    return this.http.get('/api/auth/getMyPermissions?id=48')// права на приосмотр регулируются документом Взаиморасчёты
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }

  getCRUD_rights(){
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==587)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==588)});
    this.getData();
  }

  refreshPermissions():boolean{
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany)?true:false;
    console.log("allowToView - "+this.allowToView);
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
      this.getMoneyflowBalances();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Нет прав на просмотр"}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('opendoc');
    this.displayedColumns.push('doc_name');
    this.displayedColumns.push('doc_number');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('obj_name');
    this.displayedColumns.push('summ_in');
    this.displayedColumns.push('summ_out');
    this.displayedColumns.push('cagent');
    this.displayedColumns.push('status');
  }
 
  onNoClick(): void {
    this.moneyflowDetDialog.close();
    }
  getPagesList(){
    this.http.post('/api/auth/getMoneyflowDetailedPagesList', this.queryForm.getRawValue())
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
    this.http.post('/api/auth/getMoneyflowDetailedTable', this.queryForm.getRawValue())
            .subscribe(
                (data) => {
                  this.dataSource.data = data as any []; 
                  if(this.dataSource.data && this.dataSource.data.length==0 && +this.queryForm.get('offset').value>0) this.setPage(0);
                  this.gettingTableData=false;
                },
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} 
            );
  }
  
  getMoneyflowBalances(){
    this.http.post('/api/auth/getMoneyflowBalances', this.queryForm.getRawValue())
            .subscribe(
                data => { 
                  
                    let documentValues=data as DocResponse;// <- засовываем данные в интерфейс для принятия данных
                    this.summ_before_pa=    documentValues.summ_before_pa;
                    this.summ_before_bx=    documentValues.summ_before_bx;
                    this.summ_before_all=   documentValues.summ_before_all;
                    this.summ_result_pa=    documentValues.summ_result_pa;
                    this.summ_result_bx=    documentValues.summ_result_bx;
                    this.summ_result_all=   documentValues.summ_result_all;
                    this.total_summ_in_pa=documentValues.total_summ_in_pa;
                    this.total_summ_out_pa=documentValues.total_summ_out_pa;
                    this.total_summ_in_bx=documentValues.total_summ_in_bx;
                    this.total_summ_out_bx=documentValues.total_summ_out_bx;
                    this.total_summ_in_all=documentValues.total_summ_in_all;
                    this.total_summ_out_all=documentValues.total_summ_out_all;
                  
                },
                error =>{console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})} 
        );
  }

  setNumOfPages(){
    this.queryForm.get('offset').setValue(this.queryForm.get('result').value);
    // Cookie.set('moneyflow_det_result',this.queryForm.get('result').value);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.queryForm.get('offset').setValue(value);
    // Cookie.set('moneyflow_det_offset',value);
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
      Cookie.set('moneyflow_det_sortAsc',this.queryForm.sortAsc);
      } else {
          this.queryForm.get('sortColumn').setValue(valueSortColumn);
          this.queryForm.get('sortAsc').setValue("asc");
          Cookie.set('moneyflow_det_sortAsc',"asc");
          // Cookie.set('moneyflow_det_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    // Cookie.set('moneyflow_det_companyId',this.queryForm.get('companyId').value);
    this.resetOptions();
    this.queryForm.get('accountsIds').value=[];
    this.queryForm.get('boxofficesIds').value=[];
    this.getCompaniesPaymentAccounts();
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
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              this.getSetOfPermissions();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
    else this.getSetOfPermissions();
  }
  getMyId(){ //+++
    if(+this.myId==0)
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();
  }
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.setDefaultCompany();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.setDefaultCompany();
  }

  setDefaultCompany(){
    if(+this.queryForm.get('companyId').value==0)
      this.queryForm.get('companyId').setValue(this.myCompanyId);
    this.getCompaniesPaymentAccounts();
  }
  
  getCompaniesPaymentAccounts(){
    return this.http.get('/api/auth/getCompaniesPaymentAccounts?id='+this.queryForm.get('companyId').value).subscribe(
        (data) => { 
          this.paymentAccounts=data as any [];
          this.getBoxofficesList();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  getBoxofficesList(){
      this.http.get('/api/auth/getBoxofficesList?id='+this.queryForm.get('companyId').value).subscribe(
          (data) => { 
            this.boxofficesAccounts=data as any [];
            this.pushAllFields();
            this.getCRUD_rights();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  pushAllFields(){
    if(this.queryForm.get('accountsIds').value.length==0 && this.queryForm.get('boxofficesIds').value.length==0){
      let ids: number[]=[];
      this.paymentAccounts.map(i=>{ids.push(i.id);});
      this.queryForm.get('accountsIds').setValue(ids);
      ids=[];
      this.boxofficesAccounts.map(i=>{ids.push(i.id);});
      this.queryForm.get('boxofficesIds').setValue(ids);
    }
    
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

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/

  resetOptions(){
    this.displayingDeletedDocs=false;
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
    this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
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
