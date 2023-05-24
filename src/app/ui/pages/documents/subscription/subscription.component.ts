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
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';

// import { MomentDefault } from 'src/app/services/moment-default';
// import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
// import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// const MY_FORMATS = MomentDefault.getMomentFormat();
// const moment = MomentDefault.getMomentDefault();


interface ProfitLossSerie{
  name:string;
  value:number;
}
interface Plan{
  n_companies: number;
  n_departments: number;
  n_users: number;
  n_products: number;
  n_counterparties: number;
  n_megabytes: number;
  n_stores: number;
  n_stores_woo: number;
  name:string;
  version: number;
  daily_price: number;
  is_nolimits:boolean;
  is_free:boolean;
  id: number;
}
interface DocResponse {
  money: number;                       // how much money on main account
  plan_id: number;             // id of tariff plan
  plan_name: string;           // the name of tariff plan
  plan_version: number;        // the version of tariff plan
  plan_price: number;          // how much writeoff per day for tariff plan
  plan_no_limits: boolean;     // tariff plan has no limits
  plan_free: boolean;          // for free plans the billing is not applied, also users that use it can't use an additional options
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
  
  // limits of options quantity
  quantity_limit_companies: number;
  quantity_limit_counterparties: number;
  quantity_limit_departments: number;
  quantity_limit_megabytes: number;
  quantity_limit_products: number;
  quantity_limit_stores: number;
  quantity_limit_stores_woo: number;
  quantity_limit_users: number;

  // options quantity steps 
  step_companies: number;
  step_counterparties: number;
  step_departments: number;
  step_megabytes: number;
  step_products: number;
  step_stores: number;
  step_stores_woo: number;
  step_users: number;

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
    // { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]},
    // {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class SubscriptionComponent implements OnInit {
  queryForm:any;//форма для отправки запроса 
  // queryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<any>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  companiesColumns: string[] = [];
  departmentsColumns: string[] = [];
  usersColumns: string[] = [];
  productsColumns: string[] = [];
  counterpartiesColumns: string[] = [];
  megabytesColumns: string[] = [];
  storesColumns: string[] = [];
  stores_wooColumns: string[] = [];


  // selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  // checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  subscription: DocResponse;
  plansList: Plan[];
  
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  gettingTableData:boolean=true;
  // settingsForm: any; // форма с настройками
  plan_free:boolean = false;
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
    public ConfirmDialog: MatDialog,
    public cu: CommonUtilitesService,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<SubscriptionComponent>, //+++
    private service: TranslocoService,
    // private _adapter: DateAdapter<any>
    ) { }

    ngOnInit() {
      // this.queryForm = new UntypedFormGroup({ //форма для отправки запроса 
      //   companyId: new UntypedFormControl(0,[]), // предприятие, по которому идет запрос данных
      //   dateFrom: new UntypedFormControl(moment().startOf('year'),[]),   // дата С
      //   dateTo: new UntypedFormControl(moment(),[]),     // дата По
      //   filterOptionsIds: new UntypedFormControl([],[]), //
      // });


      this.formBaseInformation = new UntypedFormGroup({
        plan_id:              new UntypedFormControl      (null,[]),
        n_companies_add:      new UntypedFormControl      (0,[]),
        n_departments_add:    new UntypedFormControl      (0,[]),
        n_users_add:          new UntypedFormControl      (0,[]),
        n_products_add:       new UntypedFormControl      (0,[]),
        n_counterparties_add: new UntypedFormControl      (0,[]),
        n_megabytes_add:      new UntypedFormControl      (0,[]),
        n_stores_add:         new UntypedFormControl      (0,[]),
        n_stores_woo_add:     new UntypedFormControl      (0,[]),
      });


        //+++ getting base data from parent component
        // this.getBaseData('myId');    
        // this.getBaseData('myCompanyId');  
        // this.getBaseData('companiesList');      
        this.getSetOfPermissions();

    }
  get writeoffDay(){
    let result=this.subscription.plan_price +
    this.subscription.n_companies_add*this.subscription.companies_ppu +
    this.subscription.n_departments_add*this.subscription.departments_ppu +
    this.subscription.n_users_add*this.subscription.users_ppu +
    this.subscription.n_products_add*this.subscription.products_ppu +
    this.subscription.n_counterparties_add*this.subscription.counterparties_ppu +
    this.subscription.n_megabytes_add*this.subscription.megabytes_ppu +
    this.subscription.n_stores_add*this.subscription.stores_ppu +
    this.subscription.n_stores_woo_add*this.subscription.stores_woo_ppu
    ;
    return result;
  }

  get daysLeft(){
    return Math.trunc(this.subscription.money/this.writeoffDay);
  }
  get formValid() {
    if(this.formBaseInformation!=undefined)
      return (this.formBaseInformation.valid);
    else return true;
  }
  get userCanChangePlan(){
    return true;
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
      // this.getTable();
      this.getMasterAccountInfo();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('name');
    if(!this.subscription.plan_no_limits) this.displayedColumns.push('plan');
    if(!this.plan_free) this.displayedColumns.push('add_option','limitation');
    this.displayedColumns.push('in_use');
    
    this.companiesColumns = ['companies_name'];
    if(!this.subscription.plan_no_limits) this.companiesColumns.push('companies_plan');
    if(!this.plan_free) this.companiesColumns.push('companies_option','companies_plan_plus_option');
    this.companiesColumns.push('companies_in_use');

    this.departmentsColumns = ['departments_name'];
    if(!this.subscription.plan_no_limits) this.departmentsColumns.push('departments_plan');
    if(!this.plan_free) this.departmentsColumns.push('departments_option','departments_plan_plus_option');
    this.departmentsColumns.push('departments_in_use');

    this.usersColumns = ['users_name'];
    if(!this.subscription.plan_no_limits) this.usersColumns.push('users_plan');
    if(!this.plan_free) this.usersColumns.push('users_option','users_plan_plus_option');
    this.usersColumns.push('users_in_use');

    this.productsColumns = ['products_name'];
    if(!this.subscription.plan_no_limits) this.productsColumns.push('products_plan');
    if(!this.plan_free) this.productsColumns.push('products_option','products_plan_plus_option');
    this.productsColumns.push('products_in_use');

    this.counterpartiesColumns = ['counterparties_name'];
    if(!this.subscription.plan_no_limits) this.counterpartiesColumns.push('counterparties_plan');
    if(!this.plan_free) this.counterpartiesColumns.push('counterparties_option','counterparties_plan_plus_option');
    this.counterpartiesColumns.push('counterparties_in_use');

    this.megabytesColumns = ['megabytes_name'];
    if(!this.subscription.plan_no_limits) this.megabytesColumns.push('megabytes_plan');
    if(!this.plan_free) this.megabytesColumns.push('megabytes_option','megabytes_plan_plus_option');
    this.megabytesColumns.push('megabytes_in_use');

    this.storesColumns = ['stores_name'];
    if(!this.subscription.plan_no_limits) this.storesColumns.push('stores_plan');
    if(!this.plan_free) this.storesColumns.push('stores_option','stores_plan_plus_option');
    this.storesColumns.push('stores_in_use');

    this.stores_wooColumns = ['stores_woo_name'];
    if(!this.subscription.plan_no_limits) this.stores_wooColumns.push('stores_woo_plan');
    if(!this.plan_free) this.stores_wooColumns.push('stores_woo_option','stores_woo_plan_plus_option');
    this.stores_wooColumns.push('stores_woo_in_use');
  }

  getMasterAccountInfo(){    
    this.gettingTableData=true;
    this.http.get('/api/auth/getMasterAccountInfo')
        .subscribe(
            data => { 
                this.subscription=data as DocResponse; 
                this.plan_free=this.subscription.plan_free;
                this.getTableHeaderTitles();
                this.gettingTableData=false;                                       
                this.dataSource.data = [];
                this.getPlansList();
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

   getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  clickPlusMinus(option:string, action:string){
    switch (option){
      case "companies":{
        if(action=='plus') {
          if(this.subscription.n_companies_add+this.subscription.n_companies<=(this.subscription.quantity_limit_companies-this.subscription.step_companies))
            this.subscription.n_companies_add=this.subscription.n_companies_add+this.subscription.step_companies;
        }          
        else {
          if(this.subscription.n_companies+this.subscription.n_companies_add-this.subscription.step_companies>=this.subscription.n_companies_fact)
            this.subscription.n_companies_add=this.subscription.n_companies_add-this.subscription.step_companies;
        }                  
        break;
      }
      case "departments":{
        if(action=='plus') {
          if(this.subscription.n_departments_add+this.subscription.n_departments<=(this.subscription.quantity_limit_departments-this.subscription.step_departments))
            this.subscription.n_departments_add=this.subscription.n_departments_add+this.subscription.step_departments;
        }          
        else {
          if(this.subscription.n_departments+this.subscription.n_departments_add-this.subscription.step_departments>=this.subscription.n_departments_fact)
            this.subscription.n_departments_add=this.subscription.n_departments_add-this.subscription.step_departments;
        }                  
        break;
      }
      case "users":{
        if(action=='plus') {
          if(this.subscription.n_users_add+this.subscription.n_users<=(this.subscription.quantity_limit_users-this.subscription.step_users))
            this.subscription.n_users_add=this.subscription.n_users_add+this.subscription.step_users;
        }          
        else {
          if(this.subscription.n_users+this.subscription.n_users_add-this.subscription.step_users>=this.subscription.n_users_fact)
            this.subscription.n_users_add=this.subscription.n_users_add-this.subscription.step_users;
        }                  
        break;
      }
      case "products":{
        if(action=='plus') {
          if(this.subscription.n_products_add+this.subscription.n_products<=(this.subscription.quantity_limit_products-this.subscription.step_products))
            this.subscription.n_products_add=this.subscription.n_products_add+this.subscription.step_products;
        }
        else {
          if(this.subscription.n_products+this.subscription.n_products_add-this.subscription.step_products>=this.subscription.n_products_fact)
            this.subscription.n_products_add=this.subscription.n_products_add-this.subscription.step_products;
        }
        break;
      }
      case "counterparties":{
        if(action=='plus') {
          if(this.subscription.n_counterparties_add+this.subscription.n_counterparties<=(this.subscription.quantity_limit_counterparties-this.subscription.step_counterparties))
            this.subscription.n_counterparties_add=this.subscription.n_counterparties_add+this.subscription.step_counterparties;
        }          
        else {
          if(this.subscription.n_counterparties+this.subscription.n_counterparties_add-this.subscription.step_counterparties>=this.subscription.n_counterparties_fact)
            this.subscription.n_counterparties_add=this.subscription.n_counterparties_add-this.subscription.step_counterparties;
        }
        break;
      }
      case "megabytes":{
        if(action=='plus') {
          if(this.subscription.n_megabytes+this.subscription.n_megabytes_add<=(this.subscription.quantity_limit_megabytes-this.subscription.step_megabytes))
            this.subscription.n_megabytes_add=this.subscription.n_megabytes_add+this.subscription.step_megabytes;
        }          
        else {
          if(this.subscription.n_megabytes_add+this.subscription.n_megabytes+this.subscription.n_megabytes_add-this.subscription.step_megabytes>=this.subscription.n_megabytes_fact)
            this.subscription.n_megabytes_add=this.subscription.n_megabytes_add-this.subscription.step_megabytes;
        }
        break;
      }
      case "stores":{
        if(action=='plus') {
          if(this.subscription.n_stores_add+this.subscription.n_stores<=(this.subscription.quantity_limit_stores-this.subscription.step_stores))
            this.subscription.n_stores_add=this.subscription.n_stores_add+this.subscription.step_stores;
        }          
        else {
          if(this.subscription.n_stores+this.subscription.n_stores_add-this.subscription.step_stores>=this.subscription.n_stores_fact)
            this.subscription.n_stores_add=this.subscription.n_stores_add-this.subscription.step_stores;
        }
        break;
      }
      case "stores_woo":{
        if(action=='plus') {
          if(this.subscription.n_stores_woo_add+this.subscription.n_stores_woo<=(this.subscription.quantity_limit_stores_woo-this.subscription.step_stores_woo))
            this.subscription.n_stores_woo_add=this.subscription.n_stores_woo_add+this.subscription.step_stores_woo;
        }          
        else {
          if(this.subscription.n_stores_woo+this.subscription.n_stores_woo_add-this.subscription.step_stores_woo>=this.subscription.n_stores_woo_fact)
            this.subscription.n_stores_woo_add=this.subscription.n_stores_woo_add-this.subscription.step_stores_woo;
        }
        break;
      }
    }
  }

  updateDocument(){ 

    this.formBaseInformation.get('plan_id').setValue              (this.subscription.plan_id);
    this.formBaseInformation.get('n_companies_add').setValue      (this.subscription.n_companies_add);
    this.formBaseInformation.get('n_departments_add').setValue    (this.subscription.n_departments_add);
    this.formBaseInformation.get('n_users_add').setValue          (this.subscription.n_users_add);
    this.formBaseInformation.get('n_products_add').setValue       (this.subscription.n_products_add);
    this.formBaseInformation.get('n_counterparties_add').setValue (this.subscription.n_counterparties_add);
    this.formBaseInformation.get('n_megabytes_add').setValue      (this.subscription.n_megabytes_add);
    this.formBaseInformation.get('n_stores_add').setValue         (this.subscription.n_stores_add);
    this.formBaseInformation.get('n_stores_woo_add').setValue     (this.subscription.n_stores_woo_add);  
     
    return this.http.post('/api/auth/updateAddOptions', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
                break;
              }
              case -1:{//недостаточно прав
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

  getPlansList(){
    this.http.get('/api/auth/getPlansList').subscribe(
            data => { 
                this.plansList = data as Plan[]; 
            },
            error => {this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
        );
  }
  stopTrialPeriod(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:{head: translate('docs.msg.del_trial'),
      warning: translate('docs.msg.del_trial_q'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.http.get('/api/auth/stopTrialPeriod').subscribe(
        data => { 
            this.getData();
        },
          error => {this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
        );
      }});  


    
  }
  onPlanSelection(){
    this.plansList.forEach(plan=>{
      if(plan.id == this.subscription.plan_id){
        this.subscription.n_companies=plan.n_companies;
        this.subscription.n_departments=plan.n_departments;
        this.subscription.n_users=plan.n_users;
        this.subscription.n_products=plan.n_products;
        this.subscription.n_counterparties=plan.n_counterparties;
        this.subscription.n_megabytes=plan.n_megabytes;
        this.subscription.n_stores=plan.n_stores;
        this.subscription.n_stores_woo=plan.n_stores_woo;
        this.subscription.plan_free=plan.is_free;
        this.subscription.plan_price=plan.daily_price;
        this.subscription.plan_no_limits=plan.is_nolimits;
        this.subscription.plan_free=plan.is_free;
      }
    });
    this.plan_free=this.subscription.plan_free;
    this.getTableHeaderTitles();
  }

}
