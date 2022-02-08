import { Component, OnInit} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
// import { ProfitlossDetComponent } from 'src/app/modules/info-modules/profitloss_det/profitloss_det.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
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
interface ProfitLossSerie{
  name:string;
  value:number;
}
interface DocResponse {
  revenue:number                     // выручка
  cost_price:number                  // себестоимость
  gross_profit:number                // валовая прибыль
  operating_expenses:number          // операционые расходы
  operating_profit:number            // операционная прибыль
  taxes_and_fees:number              // налоги и сборы
  net_profit:number                  // чистая прибыль
  operational:ProfitLossSerie[]      // список операционных расходов типа Имя - Значение
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
  selector: 'app-profitloss',
  templateUrl: './profitloss.component.html',
  styleUrls: ['./profitloss.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    /*QueryFormService,*/LoadSpravService, CommonUtilitesService, Cookie]
})
export class ProfitlossComponent implements OnInit {
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
  //переменные для значений отчета
  revenue:number=0;                     // выручка
  cost_price:number=0;                  // себестоимость
  gross_profit:number=0;                // валовая прибыль
  operating_expenses:number=0;          // операционые расходы
  operating_profit:number=0;            // операционная прибыль
  taxes_and_fees:number=0;              // налоги и сборы
  net_profit:number=0;                  // чистая прибыль
  operational:ProfitLossSerie[]=[];     // список операционных расходов типа Имя - Значение
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
    // public profitlossDetDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public commonUtilites: CommonUtilitesService,
    // private settingsProfitlossDialogComponent: MatDialog,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<ProfitlossComponent>,) { }

    ngOnInit() {
      this.queryForm = new FormGroup({ //форма для отправки запроса 
        companyId: new FormControl(0,[]), // предприятие, по которому идет запрос данных
        dateFrom: new FormControl(moment().startOf('year'),[]),   // дата С
        dateTo: new FormControl(moment(),[]),     // дата По
        filterOptionsIds: new FormControl([],[]), //
      });

      if(Cookie.get('profitloss_companyId')=='undefined' || Cookie.get('profitloss_companyId')==null)     
        Cookie.set('profitloss_companyId',this.queryForm.get('companyId').value); else this.queryForm.get('companyId').setValue(Cookie.get('profitloss_companyId')=="0"?"0":+Cookie.get('profitloss_companyId'));
      
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
    return this.http.get('/api/auth/getMyPermissions?id=49')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==590)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==591)});
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
      // this.getTable();
      this.getProfitlossBalances();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Нет прав на просмотр"}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('name');
    this.displayedColumns.push('value');
  }

  getProfitlossBalances(){    
    this.gettingTableData=true;
        this.http.post('/api/auth/getProfitLoss', this.queryForm.getRawValue())
            .subscribe(
                data => { 
                  this.gettingTableData=false;
                    let documentValues=data as DocResponse;
                    this.revenue=documentValues.revenue;                        // выручка
                    this.cost_price=documentValues.cost_price;                  // себестоимость
                    this.gross_profit=documentValues.gross_profit;              // валовая прибыль
                    this.operating_expenses=documentValues.operating_expenses;  // операционые расходы
                    this.operating_profit=documentValues.operating_profit;      // операционная прибыль
                    this.taxes_and_fees=documentValues.taxes_and_fees;          // налоги и сборы
                    this.net_profit=documentValues.net_profit;                  // чистая прибыль
                    this.operational=documentValues.operational;                // список операционных расходов типа Имя - Значение
                    this.dataSource.data = documentValues.operational;
                },
                error => {this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
            );
      }
    
  onCompanySelection(){
    Cookie.set('profitloss_companyId',this.queryForm.get('companyId').value);
    this.resetOptions();
    this.dataSource.data=[];
    this.revenue=0;
    this.cost_price=0;
    this.gross_profit=0;
    this.operating_expenses=0;
    this.operating_profit=0;
    this.taxes_and_fees=0;
    this.net_profit=0;
    this.operational=[];
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
    if(Cookie.get('profitloss_companyId')=='0'){
      this.queryForm.get('companyId').setValue(this.myCompanyId);
      Cookie.set('profitloss_companyId',this.queryForm.get('companyId').value);
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