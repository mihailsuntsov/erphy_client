import { Component, EventEmitter, OnInit, Output} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();


interface ProfitLossSerie{
  name:string;
  value:number;
}
interface DocResponse {
  money: number;                       // how much money on main account
  plan_name: string;           // the name of tariff plan
  plan_version: number;        // the version of tariff plan
  plan_price: number;          // how much writeoff per day for tariff plan
  plan_no_limits: boolean;     // tariff plan has no limits
  companies_ppu: number;       // writeoff per day for 1 additional company
  departments_ppu: number;     // writeoff per day for 1 additional department
  users_ppu: number;           // writeoff per day for 1 additional user
  products_ppu: number;        // writeoff per day for 1 additional product or service
  counterparties_ppu: number;  // writeoff per day for 1 additional counterparty
  megabytes_ppu: number;       // writeoff per day for 1 additional Mb
  stores_ppu: number;          // writeoff per day for 1 additional WooCommerce store connection (document "Store")
  stores_woo_ppu: number;      // writeoff per day for 1 additional WooCommerce hosting

  // plan
  n_companies: number;
  n_departments: number;
  n_users: number;
  n_products: number;
  n_counterparties: number;
  n_megabytes: number;
  n_stores: number;
  n_stores_woo: number;

  // additional options
  n_companies_add: number;
  n_departments_add: number;
  n_users_add: number;
  n_products_add: number;
  n_counterparties_add: number;
  n_megabytes_add: number;
  n_stores_add: number;
  n_stores_woo_add: number;
  free_trial_days: number;

  // using in fact
  n_companies_fact: number;
  n_departments_fact: number;
  n_users_fact: number;
  n_products_fact: number;
  n_counterparties_fact: number;
  n_megabytes_fact: number;
  n_stores_fact: number;
  n_stores_woo_fact: number;
}
export interface idAndName {
  id: number;
  name:string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
  providers: [LoadSpravService, CommonUtilitesService, Cookie,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class SubscriptionComponent implements OnInit {
  queryForm:any;//форма для отправки запроса 
  // queryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<any>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  // selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  // checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  
  subscription: DocResponse;
  
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  gettingTableData:boolean=true;
  // settingsForm: any; // форма с настройками

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

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public cu: CommonUtilitesService,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<SubscriptionComponent>, //+++
    private service: TranslocoService,
    private _adapter: DateAdapter<any>) { }

    ngOnInit() {
      this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
        companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new UntypedFormControl(moment().startOf('year'),[]),   // дата С
        dateTo: new UntypedFormControl(moment(),[]),     // дата По
        filterOptionsIds: new UntypedFormControl([],[]), //
      });

        //+++ getting base data from parent component
        this.getBaseData('myId');    
        this.getBaseData('myCompanyId');  
        this.getBaseData('companiesList');      
        this.getSetOfPermissions();

    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=55')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getCRUD_rights();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
            );
  }

  getCRUD_rights(){
    this.allowToView =   this.permissionsSet.some(  function(e){return(e==681)});
    this.allowToUpdate = this.permissionsSet.some(  function(e){return(e==682)});
    this.getData();
  }

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(this.allowToView)
    {
      this.getTableHeaderTitles();
      // this.getTable();
      this.getMasterAccountInfo();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('name');
    this.displayedColumns.push('limitation');
    this.displayedColumns.push('in_use');
  }

  getMasterAccountInfo(){    
    this.gettingTableData=true;
        this.http.get('/api/auth/getMasterAccountInfo')
            .subscribe(
                data => { 
                    this.gettingTableData=false;
                    this.subscription=data as DocResponse;
                    this.dataSource.data = [];
                },
                error => {this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            );
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

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
   getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}
