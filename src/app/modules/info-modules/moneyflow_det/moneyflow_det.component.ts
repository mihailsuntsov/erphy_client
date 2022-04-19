import { Component, Inject, OnInit, Optional} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { LoadSpravService } from '../../../services/loadsprav';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { FormGroup, FormControl } from '@angular/forms';
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

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
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

      this.queryForm = new FormGroup({ //форма для отправки запроса 
        companyId: new FormControl(this.data.companyId,[]), // предприятие, по которому идет запрос данных (передаётся из вызывающего окна)
        // cagentId: new FormControl(this.data.cagentId,[]), // контрагент, по которому идет запрос данных (передаётся из вызывающего окна)
        dateFrom: new FormControl(this.data.date?moment(this.data.date,'DD.MM.YYYY'):moment().startOf('year'),[]),   // дата С
        dateTo: new FormControl(this.data.date?moment(this.data.date,'DD.MM.YYYY'):moment(),[]),     // дата По
        sortColumn: new FormControl('date_time_created_sort',[]), //
        sortAsc: new FormControl('desc',[]), //
        offset: new FormControl(0,[]), //
        result: new FormControl(10,[]), //
        filterOptionsIds: new FormControl([],[]), //
        searchString: new FormControl('',[]), //
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
    
      this.getCompaniesList();// 

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

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==587)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==588)});
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
    // if(Cookie.get('moneyflow_det_companyId')=='0'){
      this.queryForm.get('companyId').setValue(this.myCompanyId);
      // Cookie.set('moneyflow_det_companyId',this.queryForm.get('companyId').value);
    // }
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
