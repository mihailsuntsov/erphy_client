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
import { QueryFormService } from './get-remains-table.service';
import { ProductCategoriesDialogComponent } from 'src/app/ui/dialogs/product-categories-dialog/product-categories-dialog.component';
import { RemainsDialogComponent } from 'src/app/ui/dialogs/remains-dialog/remains-dialog.component';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { UntypedFormControl  } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
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
interface IdAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
@Component({
  selector: 'app-remains',
  templateUrl: './remains.component.html',
  styleUrls: ['./remains.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService]//+++
})
export class RemainsComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DocTable [] = [] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DocTable>(true, []);//Class to be used to power selecting one or more options from a list.
  selectionFilterOptions = new SelectionModel<IdAndName>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: IdAndName [] = [];//массив для получения списка СВОИХ отделений
  completedStartQueries:number=0;
  myCompanyId:number=0;//
  
  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
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
  visBtnSetRemains = false;

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
  TREE_DATA: CategoryNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  //для поиска контрагента (поставщика) по подстроке
  searchCagentCtrl = new UntypedFormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  optionsIds: IdAndName [] = [];
  checkedOptionsList:number[]=[]; //массив для накапливания id выбранных опций чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)



  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private MessageDialog: MatDialog,
    public productCategoriesDialog: MatDialog,
    public remainsDialogComponent: MatDialog,
    private Cookie: Cookie,
    public ConfirmDialog: MatDialog,
    public ProductDuplicateDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,) { 
    }
      
  ngOnInit() {
    this.sendingQueryForm.sortAsc="desc";
    this.sendingQueryForm.sortColumn="p.name";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="10";
    this.sendingQueryForm.companyId="0";
    this.sendingQueryForm.departmentId="0";
    this.sendingQueryForm.cagentId="0";
    this.sendingQueryForm.selectedNodeId="0";
    this.sendingQueryForm.searchCategoryString="";
    this.searchCagentCtrl.setValue("");


    if(Cookie.get('remains_companyId')=='undefined' || Cookie.get('remains_companyId')==null)     
      Cookie.set('remains_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('remains_companyId')=="0"?"0":+Cookie.get('remains_companyId'));
    if(Cookie.get('remains_departmentId')=='undefined' || Cookie.get('remains_departmentId')==null)  
      Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId); else this.sendingQueryForm.departmentId=(Cookie.get('remains_departmentId')=="0"?"0":+Cookie.get('remains_departmentId'));
    if(Cookie.get('remains_sortAsc')=='undefined' || Cookie.get('remains_sortAsc')==null)       
      Cookie.set('remains_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('remains_sortAsc');
    if(Cookie.get('remains_sortColumn')=='undefined' || Cookie.get('remains_sortColumn')==null)    
      Cookie.set('remains_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('remains_sortColumn');
    if(Cookie.get('remains_offset')=='undefined' || Cookie.get('remains_offset')==null)        
      Cookie.set('remains_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('remains_offset');
    if(Cookie.get('remains_result')=='undefined' || Cookie.get('remains_result')==null)        
      Cookie.set('remains_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('remains_result');
    if(Cookie.get('remains_selectedNodeId')=='undefined' || Cookie.get('remains_selectedNodeId')==null)        
      Cookie.set('remains_selectedNodeId',this.sendingQueryForm.selectedNodeId); else this.sendingQueryForm.selectedNodeId=Cookie.get('remains_selectedNodeId');
    if(Cookie.get('remains_selectedNodeName')=='undefined' || Cookie.get('remains_selectedNodeName')==null)        
      Cookie.set('remains_selectedNodeName',this.sendingQueryForm.selectedNodeName); else this.sendingQueryForm.selectedNodeName=Cookie.get('remains_selectedNodeName');
    if(Cookie.get('remains_selectedCagentId')=='undefined' || Cookie.get('remains_selectedCagentId')==null)        
      Cookie.set('remains_selectedCagentId',this.sendingQueryForm.cagentId); else this.sendingQueryForm.cagentId=Cookie.get('remains_selectedCagentId');
    if(Cookie.get('remains_selectedCagentName')=='undefined' || Cookie.get('remains_selectedCagentName')==null)        
      Cookie.set('remains_selectedCagentName',this.searchCagentCtrl.value); else this.searchCagentCtrl.setValue(Cookie.get('remains_selectedCagentName'));

    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');   
    this.getBaseData('myDepartmentsList');      
    this.fillOptionsList();//заполняем список опций фильтра

    this.optionsIds.forEach(z=>{this.selectionFilterOptions.select(z);this.checkedOptionsList.push(+z.id);});//включаем все чекбоксы в фильтре, и заполняем ими список для отправки запроса
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Поставщик"
    
      
    this.getCompaniesList();
  }
  
 // -------------------------------------- *** ПРАВА *** ------------------------------------
 getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=18')
  .subscribe(
      (data) => {   
                  this.permissionsSet=data as any [];
                  this.getMyCompanyId();
                },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}, //+++
    );
  }

  getCRUD_rights(){
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==232)});
    this.allowToUpdateMyCompany =this. permissionsSet.some(            function(e){return(e==233)});
    this.allowToUpdateMyDepartments = this.permissionsSet.some(        function(e){return(e==234)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==235)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==236)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==237)});
    this.getData();
  }

  refreshPermissions():boolean{
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments)?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToUpdateMyDepartments)?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    // this.visBtnAdd = (this.allowToCreate)?true:false;    
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // console.log("allowToDelete - "+this.allowToDelete);
    // console.log("allowToDeleteAllCompanies - "+this.allowToDeleteAllCompanies);
    return true;
  }


  // getSetOfPermissions(){
  //   return this.http.get('/api/auth/getMyPermissions?id=18')
  //   .subscribe(
  //     (data) => {   
  //       this.permissionsSet=data as any [];
  //       this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==232)});
  //       this.allowToUpdateMyCompany =this. permissionsSet.some(            function(e){return(e==233)});
  //       this.allowToUpdateMyDepartments = this.permissionsSet.some(        function(e){return(e==234)});
  //       this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==235)});
  //       this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==236)});
  //       this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==237)});
  //       this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
  //       this.refreshPermissions();
  //     },
  //     error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
  //   );
  // }

  // refreshPermissions():boolean{
  //   let itIsMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
  //   this.allowToView=(this.allowToViewAllCompanies || (itIsMyCompany && this.allowToViewMyCompany))||(itIsMyCompany==false && this.allowToViewAllCompanies))?true:false;
  //   this.allowToUpdate=((itIsMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(itIsMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
  //   this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
  //   // console.log("itIsMyCompany - "+itIsMyCompany);
  //   console.log(" - ");
  //   console.log("allowToView - "+this.allowToView);
  //   console.log("allowToUpdate - "+this.allowToUpdate);
  //   return true;
  // }

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
getData(){
  if(this.refreshPermissions() && this.allowToView)
  {
    this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
    this.doFilterDepartmentsList();//если нет просмотра по свому предприятию - фильтруем список отделений предприятия до своих отделений
    this.getTableHeaderTitles();
    this.loadTrees();
    this.getTable();
  } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} //+++
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
// getMyId(){ //+++
//   if(+this.myId==0)
//    this.loadSpravService.getMyId()
//           .subscribe(
//               (data) => {this.myId=data as any;
//                 this.getMyCompanyId();},
//                 error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
//           );
//     else this.getMyCompanyId();
// }
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
  if(Cookie.get('remains_companyId')=='0'||!this.companyIdInList(Cookie.get('remains_companyId'))){
    this.sendingQueryForm.companyId=this.myCompanyId;
    Cookie.set('remains_companyId',this.sendingQueryForm.companyId);
  }
    this.getDepartmentsList();
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
getMyDepartmentsList(){ //+++
  if(this.receivedMyDepartmentsList.length==0)
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
    .subscribe(
        (data) => {this.receivedMyDepartmentsList=data as any [];
          this.getCRUD_rights();},
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
    );
    else this.getCRUD_rights();
}
setDefaultDepartment(){
  if(this.receivedDepartmentsList.length==1)
    this.sendingQueryForm.departmentId=+this.receivedDepartmentsList[0].id;    
  else this.sendingQueryForm.departmentId="0";
  Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId);
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
  let myCompany:IdAndName;
  if(!this.allowToViewAllCompanies){
    this.receivedCompaniesList.forEach(company=>{
    if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
    this.receivedCompaniesList=[];
    this.receivedCompaniesList.push(myCompany);
  }
}

doFilterDepartmentsList(){
  if(!this.allowToViewAllCompanies && !this.allowToViewMyCompany && this.allowToViewMyDepartments){
    this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  this.setDefaultDepartment();// 
}





























  

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToUpdate) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('article');
    // this.displayedColumns.push('productgroup');
    this.checkedOptionsList.some(function(e){return(e==3)})?null:this.displayedColumns.push('not_buy');
    this.checkedOptionsList.some(function(e){return(e==4)})?null:this.displayedColumns.push('not_sell');
    this.displayedColumns.push('quantity');
    this.displayedColumns.push('min_quantity');
    this.displayedColumns.push('estimate_quantity');
  }

  getTable(){
    let dataObjectArray: any;
    this.gettingTableData=true;
    this.sendingQueryForm.filterOptionsIds=this.checkedOptionsList;
    this.clearCheckboxSelection();
    this.sendingQueryForm.departmentsIdsList=JSON.stringify(this.getIds(this.receivedDepartmentsList)).replace("[", "").replace("]", "");
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
    Cookie.set('remains_companyId',this.sendingQueryForm.companyId);
    Cookie.set('remains_departmentId','0');
    this.setPage(0);
    this.resetSelectedCagent(false);
    this.resetSelectedCategory(false);
    this.sendingQueryForm.departmentId="0"; 
    this.getDepartmentsList();
  }
  onDepartmentSelection(){
    Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId);
    // console.log('remains_companyId - '+Cookie.get('remains_companyId'));
    // console.log('remains_departmentId - '+Cookie.get('remains_departmentId'));
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
    this.calcVisBtnSetRemains();
    console.log("checkedList - "+this.checkedList);
  }

    
  setNumOfPages(){
    this.clearCheckboxSelection();
    this.createCheckedList();
    this.sendingQueryForm.offset=0;
    Cookie.set('remains_result',this.sendingQueryForm.result);
    this.getTableHeaderTitles();
    this.getTable();
  }
  
  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('remains_offset',value);
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
          Cookie.set('remains_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('remains_sortAsc',"asc");
          Cookie.set('remains_sortColumn',valueSortColumn);
      }
      this.getTable();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

 

  resetSelectedCategory(getTable:boolean){
    this.sendingQueryForm.selectedNodeId='';
    this.sendingQueryForm.selectedNodeName='';
    this.sendingQueryForm.searchCategoryString='';
    Cookie.delete('remains_selectedNodeId');
    Cookie.delete('remains_selectedNodeName');
    if(getTable)this.getTable();
  }

  resetSelectedCagent(getTable:boolean){
    this.searchCagentCtrl.setValue('');
    this.checkEmptyCagentField(getTable);
  }

  changeOrderOfCategories(){
    const dialogRef = this.productCategoriesDialog.open(ProductCategoriesDialogComponent, {
      width: '800px', 
      data:
      { 
        actionType:"changeOrder",
        parentCategoryId: +this.sendingQueryForm.selectedNodeId,
        docName:translate('menu.dialogs.order_edit'), //+++
        companyId: +this.sendingQueryForm.companyId
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadTreesAndOpenNode(+this.sendingQueryForm.selectedNodeId);
    });        
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
        }, error => console.log(error)
        );
      } else this.loadTrees();
  }

  clickBtnCreateMinRemains(): void {
    const dialogRef = this.remainsDialogComponent.open(RemainsDialogComponent, {
      width: '800px', 
      data:
      { 
        companyId:+this.sendingQueryForm.companyId,
        departmentId:+this.sendingQueryForm.departmentId,//выбранное отделение. если отправится 0 то будет уже отрабатывать departmentsList
        departmentsList: this.receivedDepartmentsList,//здесь надо будет сделать в зависимости от прав - слать только свои отделения или все отделения предприятия
        productsIds: this.checkedList,
        docName:translate('menu.dialogs.min_remains'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.getTable()}
    });        
  }
  calcVisBtnSetRemains(){//отображать ли кнопку "Установить минимальное количество"
    console.log("allowToUpdateAllCompanies  - "+this.allowToUpdateAllCompanies);
    console.log("allowToUpdateMyCompany     - "+this.allowToUpdateMyCompany);
    console.log("allowToUpdateMyDepartments - "+this.allowToUpdateMyDepartments);
    if
    (   this.allowToUpdateAllCompanies ||//если есть право на установку мин. количества у всех предприятий головной учетной записи
        (this.allowToUpdateMyCompany && this.sendingQueryForm.companyId==this.myCompanyId)||//или есть право на установку мин. количества у всех отделений своего предприятия, и выбрано своё предприятие
        //или есть право на установку мин. количества у своих отделений, и выбранное отделение или все доступные отделения в выпадающем списке (привыбранном пункте "Все доступные отделения") яволяются моими.
        (this.allowToUpdateMyDepartments && ((this.sendingQueryForm.departmentId==0)?(this.isItMyDepartments()):(this.isItMyDepartment(this.sendingQueryForm.departmentId)))))
        this.visBtnSetRemains=true;
    else this.visBtnSetRemains=false;
  }
  isItMyDepartments():boolean{
    // console.log("isItMyDepartments");
    let ret: boolean = true;
    let depId: number = 0;
    alert(this.receivedDepartmentsList)
    if(this.receivedDepartmentsList.length>0){
      this.receivedDepartmentsList.forEach(m=>
      {
          depId=+m.id;
          ret?(ret=this.isItMyDepartment(depId)):ret;//если хотя бы 1 из отделений в выпадающем списке не моё - false
      })
    }else ret=false;
    return ret;
  }
  isItMyDepartment(depId:number):boolean{
    let myDepId: number = 0;
    let ret: boolean = false;
    this.receivedMyDepartmentsList.forEach(m=>{
      myDepId=+m.id;
      console.log("depId - " + depId + ", myDepId - " +myDepId)
      ret?ret:(ret=(depId == myDepId))//если выбранное отделение из выпадающего списка является одним из моих отделений - true
    });
    return ret;
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
    Cookie.set('remains_selectedCagentId',id);
    Cookie.set('remains_selectedCagentName',name);
    this.getTable();
  }
  checkEmptyCagentField(getTable:boolean){
    if(this.searchCagentCtrl.value.length==0){
      this.sendingQueryForm.cagentId='0';
      Cookie.delete('remains_selectedCagentId');
      Cookie.delete('remains_selectedCagentName');
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

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
//-------------------------------------------------------------------------------
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
        if(+this.sendingQueryForm.selectedNodeId>0){
          this.expandParents(this.getNodeById(+this.sendingQueryForm.selectedNodeId));
        };
      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.expandWayToNodeAndItsChildrensByIndex(this.getNodeIndexById(nodeId));
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
      }, error => console.log(error)
    );
  }

  expandParents(node: any) {
    //console.log("expanding Carrots:"+node.name);
    const parent = this.getParent(node);
    if(parent){console.log("parent:"+parent.name);}
     this.treeControl.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(parent);
    }
  }  
  selectNode(node: any){
    //console.log("node Id:"+node.id);
    this.sendingQueryForm.selectedNodeId=node.id;
    this.sendingQueryForm.selectedNodeName=node.name;
    this.recountNumChildsOfSelectedCategory();
    this.sendingQueryForm.offset=0;
    Cookie.set('remains_offset',this.sendingQueryForm.offset);
    Cookie.set('remains_selectedNodeId',this.sendingQueryForm.selectedNodeId);
    Cookie.set('remains_selectedNodeName',this.sendingQueryForm.selectedNodeName);
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
    //console.log("currentLevel:"+currentLevel);
    const startIndex = this.treeControl.dataNodes.indexOf(node);
    //console.log("Index:"+startIndex);
    //цикл по уровню, пока не уменьшится
    //как только уменьшился, этот node и есть parent
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
  // взять node по индексу
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
    //console.log("this.numChildsOfSelectedCategory: "+this.numChildsOfSelectedCategory);
  }


//***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  resetOptions(){
    // this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
    this.sendingQueryForm.filterOptionsIds = [];
  }
  fillOptionsList(){
    this.optionsIds = [
    {id:3, name:'menu.top.hide_nonbuy'},
    {id:4, name:'menu.top.hide_selloff'},
    {id:0, name:'menu.top.not_available'},
    {id:1, name:'menu.top.few'},
    {id:2, name:'menu.top.enough'}
  ]//список опций для вывода во всплывающем меню опций для фильтра
  }
  clickApplyFilters(){
    let showOnlyDeletedCheckboxIsOn:boolean = false; //присутствует ли включенный чекбокс "Показывать только удалённые"
    // this.selectionFilterOptions.selected.forEach(z=>{
    //   if(z.id==1){showOnlyDeletedCheckboxIsOn=true;}
    // })
    // this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=0;//сброс пагинации
    this.getData();
  }
  // updateSortOptions(){//после определения прав пересматриваем опции на случай, если права не разрешают действия с определенными опциями, и исключаем эти опции
  //   let i=0; 
  //   this.optionsIds.forEach(z=>{
  //     console.log("allowToDelete - "+this.allowToDelete);
  //     if(z.id==1 && !this.allowToDelete){this.optionsIds.splice(i,1)}//исключение опции Показывать удаленные, если нет прав на удаление
  //     i++;
  //   });
  //   if (this.optionsIds.length>0) this.displaySelectOptions=true; else this.displaySelectOptions=false;//если опций нет - не показываем меню опций
  // }

  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  // createFilterOptionsCheckedList(){//this.sendingQueryForm.filterOptionsIds - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при нажатии на чекбокс
  //   this.sendingQueryForm.filterOptionsIds = [];//                                                     
  //   this.selectionFilterOptions.selected.forEach(z=>{
  //     this.sendingQueryForm.filterOptionsIds.push(+z.id);
  //   });
  // }
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