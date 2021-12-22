import { Component, OnInit} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MoneyflowDetComponent } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
// import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { FormGroup, FormControl } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE}  from '@angular/material/core';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
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

@Component({
  selector: 'app-moneyflow',
  templateUrl: './moneyflow.component.html',
  styleUrls: ['./moneyflow.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    /*QueryFormService,*/LoadSpravService,Cookie]
})
export class MoneyflowComponent implements OnInit {
  queryForm:any;//форма для отправки запроса 
  // queryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<any>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  // selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  myId:number=0;
  // checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
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
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToView:boolean = false;
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
  constructor(
    /*private queryFormService:   QueryFormService,*/
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    private MessageDialog: MatDialog,
    public moneyflowDetDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    // private settingsMoneyflowDialogComponent: MatDialog,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<MoneyflowComponent>,) { }

    ngOnInit() {
      this.queryForm = new FormGroup({ //форма для отправки запроса 
        companyId: new FormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new FormControl(moment().startOf('year'),[]),   // дата С
        dateTo: new FormControl(moment(),[]),     // дата По
        sortColumn: new FormControl('date_created',[]), //
        sortAsc: new FormControl('desc',[]), //
        offset: new FormControl(0,[]), //
        result: new FormControl(10,[]), //
        filterOptionsIds: new FormControl([],[]), //
        searchString: new FormControl('',[]), //
      });

      if(Cookie.get('moneyflow_companyId')=='undefined' || Cookie.get('moneyflow_companyId')==null)     
        Cookie.set('moneyflow_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('moneyflow_companyId')=="0"?"0":+Cookie.get('moneyflow_companyId'));
      if(Cookie.get('moneyflow_sortAsc')=='undefined' || Cookie.get('moneyflow_sortAsc')==null)       
        Cookie.set('moneyflow_sortAsc',this.queryForm.get('sortAsc').value); else this.queryForm.get('sortAsc').setValue(Cookie.get('moneyflow_sortAsc'));
      // if(Cookie.get('moneyflow_sortColumn')=='undefined' || Cookie.get('moneyflow_sortColumn')==null)    
        // Cookie.set('moneyflow_sortColumn',this.queryForm.get('sortColumn').value); else this.queryForm.get('sortColumn').setValue(Cookie.get('moneyflow_sortColumn'));
      if(Cookie.get('moneyflow_offset')=='undefined' || Cookie.get('moneyflow_offset')==null)        
        Cookie.set('moneyflow_offset',this.queryForm.get('offset').value); else this.queryForm.get('offset').setValue(Cookie.get('moneyflow_offset'));
      if(Cookie.get('moneyflow_result')=='undefined' || Cookie.get('moneyflow_result')==null)        
        Cookie.set('moneyflow_result',this.queryForm.get('result').value); else this.queryForm.get('result').setValue(Cookie.get('moneyflow_result'));
      
      this.fillOptionsList();//заполняем список опций фильтра
    //   // Форма настроек
    // this.settingsForm = new FormGroup({
    //   //покупатель по умолчанию
    //   cagentId: new FormControl                 (null,[]),
    //   //наименование покупателя
    //   cagent: new FormControl                   ('',[]),
    //   //предприятие, для которого создаются настройки
    //   companyId: new FormControl                (null,[]),
    //   //статус после успешного отбития чека, перед созданием нового документа
    //   statusIdOnComplete: new FormControl       ('',[]),
    // });

      this.getCompaniesList();// 
      // -> getSetOfPermissions() 
      // -> getMyId()
      // -> getMyCompanyId() 
      // -> setDefaultCompany() 
      // -> getCRUD_rights() 
      // -> getData() 
      //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId
    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=48')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
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
      this.getMoneyflowBalances();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Нет прав на просмотр"}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('opendoc');
    this.displayedColumns.push('date_created');
    this.displayedColumns.push('summ_in_pa');
    this.displayedColumns.push('summ_out_pa'); 
    this.displayedColumns.push('summ_result_pa');
    this.displayedColumns.push('summ_in_bx');
    this.displayedColumns.push('summ_out_bx');
    this.displayedColumns.push('summ_result_bx');
    this.displayedColumns.push('summ_in_all');
    this.displayedColumns.push('summ_out_all');
    this.displayedColumns.push('summ_result_all');
  }

  getPagesList(){
    this.http.post('/api/auth/getMoneyflowPagesList', this.queryForm.getRawValue())
            .subscribe(
                data => {this.receivedPagesList=data as string [];
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            ); 
  }

  getTable(){
    this.gettingTableData=true;
    this.http.post('/api/auth/getMoneyflowTable', this.queryForm.getRawValue())
            .subscribe(
                (data) => {
                  this.dataSource.data = data as any []; 
                  if(this.dataSource.data.length==0 && +this.queryForm.get('offset').value>0){
                    this.setPage(0);
                  } 
                  this.gettingTableData=false;
                },
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})} 
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
            );
      }
    
  // isGroup(index): boolean{
  //   return index==0;
  // }
  setNumOfPages(){
    this.queryForm.get('offset').setValue(this.queryForm.get('result').value);
    Cookie.set('moneyflow_result',this.queryForm.get('result').value);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.queryForm.get('offset').setValue(value);
    Cookie.set('moneyflow_offset',value);
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
      Cookie.set('moneyflow_sortAsc',this.queryForm.sortAsc);
      } else {
          this.queryForm.get('sortColumn').setValue(valueSortColumn);
          this.queryForm.get('sortAsc').setValue("asc");
          Cookie.set('moneyflow_sortAsc',"asc");
          Cookie.set('moneyflow_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    Cookie.set('moneyflow_companyId',this.queryForm.get('companyId').value);
    this.resetOptions();
    this.dataSource.data=[];
    this.summ_before_pa=0;
    this.summ_before_bx=0;
    this.summ_before_all=0;
    this.summ_result_pa=0;
    this.summ_result_bx=0;
    this.summ_result_all=0;
    this.total_summ_in_pa=0;
    this.total_summ_out_pa=0;
    this.total_summ_in_bx=0;
    this.total_summ_out_bx=0;
    this.total_summ_in_all=0;
    this.total_summ_out_all=0;
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  setDefaultCompany(){
    if(Cookie.get('moneyflow_companyId')=='0'){
      this.queryForm.get('companyId').setValue(this.myCompanyId);
      Cookie.set('moneyflow_companyId',this.queryForm.get('companyId').value);
    }
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
  openDetailslWindow(date:string) {
    this.moneyflowDetDialog.open(MoneyflowDetComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        date: date,
        companyId: this.queryForm.get('companyId').value,
        // dateFrom:this.queryForm.get('dateFrom').value,
        // dateTo:this.queryForm.get('dateTo').value,
        // cagent:cagent,
      },
    });
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
