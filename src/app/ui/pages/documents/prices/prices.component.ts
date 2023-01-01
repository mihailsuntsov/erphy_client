import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-prices-table.service';
import { PricesDialogComponent } from 'src/app/ui/dialogs/prices-dialog/prices-dialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { UntypedFormControl  } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++


interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
}
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
export interface DocTable {
  id: number;
}
export interface TableAndPagesData {//для получения в одном объекте и номеров страниц для пагинации, и самих данных для таблицы
  receivedPagesList: number[];
  table: any[];
}

export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
}
interface idNameDescription{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  description: string;
}
@Component({
  selector: 'app-prices',
  templateUrl: './prices.component.html',
  styleUrls: ['./prices.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService]//+++
})
export class PricesComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DocTable [] = [];//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DocTable>(true, []);//Class to be used to power selecting one or more options from a list.
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  completedStartQueries:number=0;
  myCompanyId:number=0;//
  TREE_DATA: CategoryNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;


  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;

  showOpenDocIcon:boolean=false;
  gettingTableData:boolean=true;


  numRows: NumRow[] = [
    {value: '5', viewValue: '5'},
    {value: '10', viewValue: '10'},
    {value: '25', viewValue: '25'},
    {value: '50', viewValue: '50'},
    {value: '100', viewValue: '100'},
  ];
  
  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  //переменные для управления динамическим отображением элементов
  visBtnEditPrices = false;
  visBtnCopy = false;
  visBtnDelete = false;

  //Управление чекбоксами
  checkedList:number[]=[]; //строка для накапливания id вида [2,5,27...]

  //tree
  private _transformer = (node: CategoryNode, level: number) => {
    
      return {
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        id: node.id,
        level: level,
      };
  }
  treeControl = new FlatTreeControl<ExampleFlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  //для поиска контрагента (поставщика) по подстроке
  searchCagentCtrl = new UntypedFormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  optionsIds: idAndName [] = [{id:"3", name:"menu.top.hide_nonbuy"},
                              {id:"4", name:"menu.top.hide_selloff"},
                              // {id:"1", name:"Мало"},
                              // {id:"2 ", name:"Достаточно"},
                            ]//список опций для вывода во всплывающем меню опций для фильтра
  checkedOptionsList:number[]=[]; //массив для накапливания id выбранных опций чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
//***********************************************************************************************************************/
@Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)


  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    public pricesDialogComponent: MatDialog,
    private Cookie: Cookie,
    public ConfirmDialog: MatDialog,
    private MessageDialog: MatDialog,
    public ProductDuplicateDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,) { 
      //this.treeDataSource.data = TREE_DATA;
    }
      
  ngOnInit() {
    this.sendingQueryForm.sortAsc="asc";
    this.sendingQueryForm.sortColumn="p.name";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="10";
    this.sendingQueryForm.companyId="0";
    this.sendingQueryForm.priceTypeId="0";
    this.sendingQueryForm.cagentId="0";
    this.sendingQueryForm.selectedNodeId="0";
    this.sendingQueryForm.searchCategoryString="";
    this.searchCagentCtrl.setValue("");


    if(Cookie.get('prices_companyId')=='undefined' || Cookie.get('prices_companyId')==null)     
      Cookie.set('prices_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('prices_companyId')=="0"?"0":+Cookie.get('prices_companyId'));
    if(Cookie.get('prices_priceTypeId')=='undefined' || Cookie.get('prices_priceTypeId')==null)  
      Cookie.set('prices_priceTypeId',this.sendingQueryForm.priceTypeId); else this.sendingQueryForm.priceTypeId=(Cookie.get('prices_priceTypeId')=="0"?"0":+Cookie.get('prices_priceTypeId'));
    if(Cookie.get('prices_sortAsc')=='undefined' || Cookie.get('prices_sortAsc')==null)       
      Cookie.set('prices_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('prices_sortAsc');
    if(Cookie.get('prices_sortColumn')=='undefined' || Cookie.get('prices_sortColumn')==null)    
      Cookie.set('prices_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('prices_sortColumn');
    if(Cookie.get('prices_offset')=='undefined' || Cookie.get('prices_offset')==null)        
      Cookie.set('prices_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('prices_offset');
    if(Cookie.get('prices_result')=='undefined' || Cookie.get('prices_result')==null)        
      Cookie.set('prices_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('prices_result');
    if(Cookie.get('prices_selectedNodeId')=='undefined' || Cookie.get('prices_selectedNodeId')==null)        
      Cookie.set('prices_selectedNodeId',this.sendingQueryForm.selectedNodeId); else this.sendingQueryForm.selectedNodeId=Cookie.get('prices_selectedNodeId');
    if(Cookie.get('prices_selectedNodeName')=='undefined' || Cookie.get('prices_selectedNodeName')==null)        
      Cookie.set('prices_selectedNodeName',this.sendingQueryForm.selectedNodeName); else this.sendingQueryForm.selectedNodeName=Cookie.get('prices_selectedNodeName');
    if(Cookie.get('prices_selectedCagentId')=='undefined' || Cookie.get('prices_selectedCagentId')==null)        
      Cookie.set('prices_selectedCagentId',this.sendingQueryForm.cagentId); else this.sendingQueryForm.cagentId=Cookie.get('prices_selectedCagentId');
    if(Cookie.get('prices_selectedCagentName')=='undefined' || Cookie.get('prices_selectedCagentName')==null)        
      Cookie.set('prices_selectedCagentName',this.searchCagentCtrl.value); else this.searchCagentCtrl.setValue(Cookie.get('prices_selectedCagentName'));

    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');   
    // this.getBaseData('myDepartmentsList');      

    this.optionsIds.forEach(z=>{this.selectionFilterOptions.select(z);this.checkedOptionsList.push(+z.id);});//включаем все чекбоксы в фильтре, и заполняем ими список для отправки запроса
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Поставщик"
    this.getStartData();
  
     
  }

  getStartData(){
    this.getCompaniesList();
    this.getMyCompanyId();// ->
    this.getSetOfPermissions();// -> 
  }

  //1я группа параллельных стартовых запросов
  getData(){
    if(this.allowToView)
    {
      this.getTable();
      this.loadTrees();
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} //+++
  }
  //2я группа параллельных стартовых запросов
  onStartQueries(){
    this.completedStartQueries++;
    if(this.completedStartQueries==3){
      this.setDefaultCompany();
    }
  }  
  onStartQueries0(){
    this.definePermissions(true);
  }
  onStartQueries1(){
    if(this.allowToView){
      this.completedStartQueries=0;
      this.getTableHeaderTitles();
      this.doFilterCompaniesList();
      this.getPriceTypesList(true);
    }  else{
      this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})
    }
  }
  //3я группа параллельных стартовых запросов
  onStartQueries2(){
    this.completedStartQueries++;
    if(this.completedStartQueries==2){
      this.completedStartQueries=0;
      this.setDefaultPriceType(true);
    }
  }
  onStartQueries3(){
    this.getData();
  }

 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=19')
      .subscribe(
        (data) => {   
                  this.permissionsSet=data as any [];
                  this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==239)});
                  this.allowToUpdateMyCompany =this. permissionsSet.some(            function(e){return(e==240)});
                  this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==242)});
                  this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==243)});
                  this.refreshPermissions();
                  this.onStartQueries();                          
                },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
      );
  }
  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log(" - ");
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    return true;
  }

  definePermissions(start:boolean){
    this.allowToView=(this.allowToViewAllCompanies||(this.allowToViewMyCompany&&this.sendingQueryForm.companyId==this.myCompanyId))?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||(this.allowToUpdateMyCompany&&this.sendingQueryForm.companyId==this.myCompanyId))?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate); 
    if(start)this.onStartQueries1();
  }

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToUpdate) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('article');
    this.displayedColumns.push('productgroup');
    this.checkedOptionsList.some(function(e){return(e==3)})?null:this.displayedColumns.push('not_buy');
    this.checkedOptionsList.some(function(e){return(e==4)})?null:this.displayedColumns.push('not_sell');
    this.displayedColumns.push('price');
  }

  getTable(){
    let dataObjectArray: any;
    this.gettingTableData=true;
    this.sendingQueryForm.filterOptionsIds=this.checkedOptionsList;
    this.clearCheckboxSelection();
    this.sendingQueryForm.priceTypesIdsList=JSON.stringify(this.getIds(this.receivedPriceTypesList)).replace("[", "").replace("]", "");
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.gettingTableData=false;
                  dataObjectArray=data as TableAndPagesData; 
                  this.receivedMatTable=dataObjectArray.table;
                  this.dataSource.data = this.receivedMatTable;

                  if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
                  this.receivedPagesList=dataObjectArray.receivedPagesList;
                  this.size=this.receivedPagesList[0];
                  this.pagenum=this.receivedPagesList[1];
                  this.listsize=this.receivedPagesList[2];
                  this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1]);
                },
                error => {this.gettingTableData=false;console.log(error);
                if(+this.sendingQueryForm.offset>0) this.setPage(0);
              }
            );
  }

  getIds(mass: any[]):number[]{
    let result:number[]=[];
    mass.forEach(element => {result.push(+element.id);});
    return result;
  };
  onCompanySelection(){
    Cookie.set('prices_companyId',this.sendingQueryForm.companyId);
    Cookie.set('prices_priceTypeId','0');
    //this.setPage(0);
    this.definePermissions(false);
    this.getTableHeaderTitles();
    this.sendingQueryForm.priceTypeId="0"; 
    this.getPriceTypesList(false);
    this.clearCheckboxSelection();
    this.resetSelectedCagent(false);
    this.resetSelectedCategory(false);
    this.sendingQueryForm.offset=0;
    Cookie.set('prices_offset',"0");
    this.onStartQueries1();
  } 
  onPriceTypeSelection(){
    Cookie.set('prices_priceTypeId',this.sendingQueryForm.priceTypeId);
    // console.log('prices_companyId - '+Cookie.get('prices_companyId'));
    // console.log('prices_priceTypeId - '+Cookie.get('prices_priceTypeId'));
    this.getTable();
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;//true если все строки выбраны
  }  
  
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
        this.createCheckedList();
  }
  
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: DocTable): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();

  }

  createCheckedList(){
    this.checkedList = [];

    for (var i = 0; i < this.receivedMatTable.length; i++) {
      if(this.selection.isSelected(this.receivedMatTable[i]))
        this.checkedList.push(this.receivedMatTable[i].id);
    }
    this.calcVisBtnEditPrices();
    console.log("checkedList - "+this.checkedList);
  }

    
  setNumOfPages(){
    this.clearCheckboxSelection();
    this.createCheckedList();
    this.sendingQueryForm.offset=0;
    Cookie.set('prices_result',this.sendingQueryForm.result);
    this.getTableHeaderTitles();
    this.getTable();
  }
  
  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('prices_offset',value);
    this.getTable();
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
          Cookie.set('prices_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('prices_sortAsc',"asc");
          Cookie.set('prices_sortColumn',valueSortColumn);
      }
      this.getTable();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.onStartQueries();
      }, error => console.log(error));
    else this.onStartQueries();
  } 
  
  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.onStartQueries();
                },
                error => console.log(error)
            );
    else this.onStartQueries();
  }

  setDefaultCompany(){
    if(Cookie.get('prices_companyId')=="0"||!this.companyIdInList(Cookie.get('prices_companyId'))){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('prices_companyId',this.sendingQueryForm.companyId);
    }
    this.onStartQueries0();
  }

  getPriceTypesList(start:boolean){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.sendingQueryForm.companyId)
            .subscribe(
                (data) => {this.receivedPriceTypesList=data as any [];
                  if(start)this.onStartQueries2();
                  else this.setDefaultPriceType(false);
                },
                error => console.log(error)
            );
  }

  setDefaultPriceType(start:boolean){
    console.log("this.receivedPriceTypesList.length="+this.receivedPriceTypesList.length);
    if(this.receivedPriceTypesList.length==1)
    {
      this.sendingQueryForm.priceTypeId=+this.receivedPriceTypesList[0].id;
      Cookie.set('prices_priceTypeId',this.sendingQueryForm.priceTypeId);
    }
    if(start)this.onStartQueries3();
  }
  
  resetSelectedCategory(getTable:boolean){
    this.sendingQueryForm.selectedNodeId='';
    this.sendingQueryForm.selectedNodeName='';
    this.sendingQueryForm.searchCategoryString='';
    Cookie.delete('prices_selectedNodeId');
    Cookie.delete('prices_selectedNodeName');
    if(getTable)this.getTable();
  }

  resetSelectedCagent(getTable:boolean){
    this.searchCagentCtrl.setValue('');
    this.checkEmptyCagentField(getTable);
  }

  searchCategory(){
    if(this.sendingQueryForm.searchCategoryString!=''){
      const body={
        companyId:this.sendingQueryForm.companyId,
        searchString:this.sendingQueryForm.searchCategoryString
      }
      return this.http.post('/api/auth/searchProductCategory',body)
      .subscribe(
        (data) => {
          this.treeDataSource.data=data as any [];
          // this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
    
        }, error => console.log(error)
        );
      } else this.getData();
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToViewAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    this.onStartQueries2();
  }

  clickBtnEditPrices(): void {
    const dialogRef = this.pricesDialogComponent.open(PricesDialogComponent, {
      width: '800px', 
      data:
      { 
        companyId:+this.sendingQueryForm.companyId,
        priceTypeId:+this.sendingQueryForm.priceTypeId,
        priceTypeName: this.getPriceNameById(+this.sendingQueryForm.priceTypeId),
        productsIds: this.checkedList,
        priceTypesIds: this.receivedPriceTypesList
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.getTable()}
    });        
  }

  getPriceNameById(id:number):string{
    let priceName:string='';
    this.receivedPriceTypesList.forEach(e=>{
      if (+e.id==id){
        priceName = e.name;
      }
    })
    return priceName;
  }

  calcVisBtnEditPrices(){//отображать ли кнопку "Установить минимальное количество"
    // console.log("allowToUpdateAllCompanies  - "+this.allowToUpdateAllCompanies);
    // console.log("allowToUpdateMyCompany     - "+this.allowToUpdateMyCompany);
    // if
    // (   this.allowToUpdateAllCompanies ||//если есть право на установку мин. количества у всех предприятий головной учетной записи
        // (this.allowToUpdateMyCompany && this.sendingQueryForm.companyId==this.myCompanyId)||//или есть право на установку мин. количества у всех отделений своего предприятия, и выбрано своё предприятие
        //или есть право на установку мин. количества у своих отделений, и выбранное отделение или все доступные отделения в выпадающем списке (привыбранном пункте "Все доступные отделения") яволяются моими.
        // (this.allowToUpdateMyDepartments && ((this.sendingQueryForm.priceTypeId==0)?(this.isItMyDepartments()):(this.isItMyDepartment(this.sendingQueryForm.priceTypeId)))))
        this.visBtnEditPrices=true;
    // else this.visBtnEditPrices=false;
  }

  
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  //  -------------     ***** поиск по подстроке для поставщика ***    --------------------------
  onCagentSearchValueChanges(){
    this.searchCagentCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredCagents = [];}),       
      switchMap(fieldObject =>  
        this.getCagentsList()))
    .subscribe(data => {
      this.isCagentListLoading = false;
      if (data == undefined) {
        this.filteredCagents = [];
      } else {
        this.filteredCagents = data as any;
  }});}
  onSelectCagent(id:any,name:string){
    this.sendingQueryForm.cagentId=+id;
    //this.sendingQueryForm.cagentName=name;
    this.setPage(0);
    Cookie.set('prices_selectedCagentId',id);
    Cookie.set('prices_selectedCagentName',name);
    this.getTable();
  }
  checkEmptyCagentField(getTable:boolean){
    if(this.searchCagentCtrl.value.length==0){
      this.sendingQueryForm.cagentId='0';
      Cookie.delete('prices_selectedCagentId');
      Cookie.delete('prices_selectedCagentName');
      if(getTable)this.getTable();
  }};     
  getCagentsList(){ //заполнение Autocomplete 
    try {
      if(this.canCagentAutocompleteQuery && this.searchCagentCtrl.value.length>1){
        const body = {
          "searchString":this.searchCagentCtrl.value,
          "companyId":this.sendingQueryForm.companyId};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {
      return [];}}
//-------------------------------------------------------------------------------
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.onStartQueries2();
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
        if(+this.sendingQueryForm.selectedNodeId>0){
          this.expandParents(this.getNodeById(+this.sendingQueryForm.selectedNodeId));
        };
      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.expandWayToNodeAndItsChildrensByIndex(this.getNodeIndexById(nodeId));
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
      }, error => console.log(error)
    );
  }

  expandParents(node: any) {
    const parent = this.getParent(node);
    if(parent){console.log("parent:"+parent.name);}
     this.treeControl.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(parent);
    }
  }  
  selectNode(node: any){
    this.sendingQueryForm.selectedNodeId=node.id;
    this.sendingQueryForm.selectedNodeName=node.name;
    this.recountNumChildsOfSelectedCategory();
    this.sendingQueryForm.offset=0;
    Cookie.set('prices_offset',this.sendingQueryForm.offset);
    Cookie.set('prices_selectedNodeId',this.sendingQueryForm.selectedNodeId);
    Cookie.set('prices_selectedNodeName',this.sendingQueryForm.selectedNodeName);
    this.getTable();
  }
  getNodeId(node: any):number{
    return(node.id);
  }
  getParent(node: any) {
    const currentLevel = this.treeControl.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node);
    for (let i = startIndex; i >= 0; i--) {
      let currentNode:any = this.treeControl.dataNodes[i];
      if (this.treeControl.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }
  getNodeIndexById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return i;
      }
    }
  }
  getNodeById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return this.treeControl.dataNodes[i];
      }
    }
  }
  expandWayToNodeAndItsChildrensByIndex(index: any) {
    try{
    let currentNode:any = this.treeControl.dataNodes[index];
    //console.log("currentNode:"+currentNode.name);
    this.expandParents(currentNode);
    this.treeControl.expand(currentNode);
    }catch (e){}
  } 

  recountNumRootCategories(){//считает количество корневых категорий
  this.numRootCategories=0;
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.treeControl.dataNodes[i].level==0){
        this.numRootCategories++;
      }
    }
    console.log("this.numRootCategories: "+this.numRootCategories);
  }
  recountNumChildsOfSelectedCategory(){//считает количество подкатегорий в выбранной категории
    let parentNode:any;
    let parentOfCurrentNode:any;
    parentNode=this.getNodeById(+this.sendingQueryForm.selectedNodeId);
    this.numChildsOfSelectedCategory=0;
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      parentOfCurrentNode=this.getParent(this.treeControl.dataNodes[i]);
      if(parentOfCurrentNode){
        console.log("parentOfCurrentNode: "+parentOfCurrentNode.id);
        if(parentOfCurrentNode.id==parentNode.id){
          this.numChildsOfSelectedCategory++;
    }}}
  }

  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  createFilterOptionsCheckedList(){//checkedOptionsList - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при загрузке страницы и при нажатии на чекбокс, а при 
    this.checkedOptionsList = [];//                                                       отправке данных внедряется в поле формы 
    // console.log("createCheckedList!!!");
    this.optionsIds.forEach(z=>{
      console.log("object z - "+z+", z.id - "+z.id+", z.name - "+z.name)
      if(this.selectionFilterOptions.isSelected(z))
        this.checkedOptionsList.push(+z.id);
    });
  }
  // sometimes in cookie "..._companyId" there value that not exists in list of companies. If it happens, company will be not selected and data not loaded until user select company manually
  companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}

}