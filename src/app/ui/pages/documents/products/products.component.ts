import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { StoresSelectComponent } from 'src/app/modules/trade-modules/stores-select/stores-select.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-products-table.service';
import { ProductDuplicateDialog } from 'src/app//ui/dialogs/product-duplicate-dialog.component';
import { ProductCategoriesDialogComponent } from 'src/app/ui/dialogs/product-categories-dialog/product-categories-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++
import { LabelsPrintDialogComponent } from 'src/app/modules/settings/labelprint-dialog/labelprint-dialog.component';
import { TemplatesDialogComponent } from 'src/app/modules/settings/templates-dialog/templates-dialog.component';
// import { FormControl } from '@angular/forms';

// Tree interfaces and classess >>>>>>>>>>
export class TodoItemNode {
  id: string;
  children?: TodoItemNode[];
  name: string;
  is_store_category: boolean;
}
// interface TreeNode {
//   id: string;
//   name: string;
//   children?: TreeNode[];
//   is_store_category: boolean;
// }
interface TodoItemFlatNode {
  id: string;
  expandable: boolean;
  name: string;
  level: number;}
// Tree interfaces and classess <<<<<<<<<<<

export interface DocTable {
  id: number;
  name: string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}
interface IdAndName {
  id: number;
  name:string;
}
interface TemplatesList{
  id: number;                   // id из таблицы template_docs
  company_id: number;           // id предприятия, для которого эти настройки
  template_type_name: string;   // наименование шаблона. Например, Товарный чек
  template_type: string;        // обозначение типа шаблона. Например, для товарного чека это product_receipt
  template_type_id: number;     // id типа шаблона
  file_id: number;              // id из таблицы files
  file_name: string;            // наименование файла как он хранится на диске
  file_original_name: string;   // оригинальное наименование файла
  document_id: number;          // id документа, в котором будет возможность печати данного шаблона (соответствует id в таблице documents)
  is_show: boolean;             // показывать шаблон в выпадающем списке на печать
  output_order: number;         // порядок вывода наименований шаблонов в списке на печать
  type: string;                 // the type of template/ It can be: "document", "label"
  num_labels_in_row:number;     // quantity of labels in the each row
}
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,ProductCategoriesSelectComponent,StoresSelectComponent,CommonUtilitesService] //+++
})
export class ProductsComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DocTable []=[] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DocTable>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  TREE_DATA: TodoItemNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  selectedObjects: number[]=[]; // выбранные во всплывающем окне выбора категорий объекты (категории), для массового присвоения товарам
  categoryStoresLoading=false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToRecoverFilesMyCompany:boolean = false;
  allowToRecoverFilesAllCompanies:boolean = false;
  allowToClearTrashMyCompany:boolean = false;
  allowToClearTrashAllCompanies:boolean = false;
  allowToDeleteFromTrashMyCompany:boolean = false;
  allowToDeleteFromTrashAllCompanies:boolean = false;
  allowCategoryCreateMyCompany:boolean = false;
  allowCategoryCreateAllCompanies:boolean = false;
  allowCategoryUpdateMyCompany:boolean = false;
  allowCategoryUpdateAllCompanies:boolean = false;
  allowCategoryDeleteMyCompany:boolean = false;
  allowCategoryDeleteAllCompanies:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowToRecoverFiles:boolean = false;
  allowToClearTrash:boolean = false;
  allowToDeleteFromTrash:boolean = false;
  allowCategoryCreate:boolean = false;
  allowCategoryUpdate:boolean = false;
  allowCategoryDelete:boolean = false;

  showOpenDocIcon:boolean=false;
  gettingTableData:boolean=true;

  //печать документов
  gettingTemplatesData: boolean = false; // идёт загрузка шаблонов
  templatesList:TemplatesList[]=[]; // список загруженных шаблонов
  productsToPrint: IdAndName[]=[];

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
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //Управление чекбоксами
  checkedList:number[]=[]; //строка для накапливания id вида [2,5,27...]
  checkedCategoriesList:number[]=[]; //строка для накапливания id категорий вида [2,5,27...]
  // Tree interfaces and classess >>>>>>>>>>
  private _transformer = (node: TodoItemNode, level: number) => {
      return {
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        id: node.id,
        level: level,
        is_store_category: node.is_store_category
      };
  }
  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  hasChild = (_: number, node: TodoItemFlatNode) => node.expandable; //_nodeData
  categoryStoresList: IdAndName[]=[];
  getLevel = (node: TodoItemFlatNode) => node.level;
  isExpandable = (node: TodoItemFlatNode) => node.expandable;
  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;
  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.name === '';
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);  /** The selection for checklist */
  
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<IdAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: IdAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    // private Cookie: Cookie,
    public MessageDialog: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    private storesSelectComponent: MatDialog,
    public ConfirmDialog: MatDialog,
    private labelsPrintDialogComponent: MatDialog,
    private templatesDialogComponent: MatDialog, 
    public ProductDuplicateDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,) {//+++ 
      //this.treeDataSource.data = TREE_DATA;
      this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
      this.treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    }

    ngOnInit() {
      this.sendingQueryForm.sortAsc="desc";
      this.sendingQueryForm.sortColumn="date_time_created_sort";
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result="10";
      this.sendingQueryForm.companyId="0";
      this.sendingQueryForm.selectedNodeId="0";
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.filterOptionsIds = [];

      if(Cookie.get('products_companyId')=='undefined' || Cookie.get('products_companyId')==null)     
        Cookie.set('products_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('products_companyId')=="0"?"0":+Cookie.get('products_companyId'));
      if(Cookie.get('products_sortAsc')=='undefined' || Cookie.get('products_sortAsc')==null)       
        Cookie.set('products_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('products_sortAsc');
      if(Cookie.get('products_sortColumn')=='undefined' || Cookie.get('products_sortColumn')==null)    
        Cookie.set('products_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('products_sortColumn');
      if(Cookie.get('products_offset')=='undefined' || Cookie.get('products_offset')==null)        
        Cookie.set('products_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('products_offset');
      if(Cookie.get('products_result')=='undefined' || Cookie.get('products_result')==null)        
        Cookie.set('products_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('products_result');
      if(Cookie.get('products_selectedNodeId')=='undefined' || Cookie.get('products_selectedNodeId')==null)        
        Cookie.set('products_selectedNodeId',this.sendingQueryForm.selectedNodeId); else this.sendingQueryForm.selectedNodeId=Cookie.get('products_selectedNodeId');
      if(Cookie.get('products_selectedNodeName')=='undefined' || Cookie.get('products_selectedNodeName')==null)        
        Cookie.set('products_selectedNodeName',this.sendingQueryForm.selectedNodeName); else this.sendingQueryForm.selectedNodeName=Cookie.get('products_selectedNodeName');

        
      //+++ getting base data from parent component
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');   
      this.getBaseData('myDepartmentsList');     

      this.fillOptionsList();//заполняем список опций фильтра

      this.getCompaniesList();// -> getSetOfPermissions() -> getMyCompanyId() -> setDefaultCompany() -> getCRUD_rights() -> getData() 
    //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId


    }
    

 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=14')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyCompanyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==163)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==164)});
    this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==165)});
    this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==166)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==167)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==168)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==169)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==170)});
    this.allowCategoryCreateAllCompanies = permissionsSet.some(   function(e){return(e==171)});
    this.allowCategoryCreateMyCompany = permissionsSet.some(      function(e){return(e==172)});
    this.allowCategoryUpdateAllCompanies = permissionsSet.some(   function(e){return(e==173)});
    this.allowCategoryUpdateMyCompany = permissionsSet.some(      function(e){return(e==174)});
    this.allowCategoryDeleteAllCompanies = permissionsSet.some(   function(e){return(e==175)});
    this.allowCategoryDeleteMyCompany = permissionsSet.some(      function(e){return(e==176)});    
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    this.allowToCreate=((documentOfMyCompany && (this.allowToCreateAllCompanies || this.allowToCreateMyCompany))||(documentOfMyCompany==false && this.allowToCreateAllCompanies))?true:false;
    this.allowToDelete=((documentOfMyCompany && (this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany))||(documentOfMyCompany==false && this.allowToDeleteAllCompanies))?true:false;
    this.allowCategoryCreate=((documentOfMyCompany && (this.allowCategoryCreateAllCompanies || this.allowCategoryCreateMyCompany))||(documentOfMyCompany==false && this.allowCategoryCreateAllCompanies))?true:false;
    this.allowCategoryUpdate=((documentOfMyCompany && (this.allowCategoryUpdateAllCompanies || this.allowCategoryUpdateMyCompany))||(documentOfMyCompany==false && this.allowCategoryUpdateAllCompanies))?true:false;
    this.allowCategoryDelete=((documentOfMyCompany && (this.allowCategoryDeleteAllCompanies || this.allowCategoryDeleteMyCompany))||(documentOfMyCompany==false && this.allowCategoryDeleteAllCompanies))?true:false;
    
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    this.visBtnAdd = (this.allowToCreate)?true:false;
    
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToRecoverFilesMyCompany - "+this.allowToRecoverFilesMyCompany);
    // console.log("allowToRecoverFilesAllCompanies - "+this.allowToRecoverFilesAllCompanies);
    // console.log(" - ");
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // console.log("allowToDelete - "+this.allowToDelete);
    // console.log("allowCategoryCreate - "+this.allowCategoryCreate);
    // console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    // console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    // console.log("allowCategoryDelete - "+this.allowCategoryDelete);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.getTableHeaderTitles();
      this.updateSortOptions(); 
      this.getTable();
      this.doFilterCompaniesList();
      this.loadTrees();
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} //+++
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete || this.allowToCreate) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('article');
    this.displayedColumns.push('ppr_id'); // 1 = product, 4 = service
    /*this.checkedOptionsList.some(function(e){return(e==3)})?null:*/this.displayedColumns.push('not_buy');
    /*this.checkedOptionsList.some(function(e){return(e==4)})?null:*/this.displayedColumns.push('not_sell');
    this.displayedColumns.push('creator');
    this.displayedColumns.push('date_time_created');
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
    this.getPagesList();
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.receivedMatTable=data as any []; 
                  this.dataSource.data = this.receivedMatTable;
                  if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
                  this.gettingTableData=false;
                },
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            );
  }
  
  onCompanySelection(){
    Cookie.set('products_companyId',this.sendingQueryForm.companyId);
    this.resetSelectedCategory(false);
    this.clearTreeCheckboxSelection();
    this.getData();
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
    this.productsToPrint =[];
    for (var i = 0; i < this.receivedMatTable.length; i++) {
      if(this.selection.isSelected(this.receivedMatTable[i])){
        this.checkedList.push(this.receivedMatTable[i].id);
        this.productsToPrint.push({id:this.receivedMatTable[i].id, name:this.receivedMatTable[i].name})
      }
    }
    if(this.checkedList.length>0){
        this.hideAllBtns();
        if(this.allowToDelete) this.visBtnDelete = true;
        if(this.checkedList.length==1){this.visBtnCopy = true}
    }else{this.showOnlyVisBtnAdd()}
    console.log("checkedList - "+this.checkedList);
  }

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
    Cookie.set('products_result',this.sendingQueryForm.result);
    this.getTable();
  }
  
  setPage(value:any) // set pagination
  {
    console.log('offset = '+value);
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    this.pagenum=value+1;
    Cookie.set('products_offset',value);
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
          Cookie.set('products_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('products_sortAsc',"asc");
          Cookie.set('products_sortColumn',valueSortColumn);
      }
      this.getData();
  }

  clickBtnDeleteProductCategory(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.deleting_ctg'), //+++
          query: translate('menu.dialogs.q_del_ctg',{name: this.sendingQueryForm.selectedNodeName}),
          warning: translate('menu.dialogs.del_ctg_f_wrn',{name:this.cu.cap(translate('menu.docs.products'))}),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteProductCategory(+this.sendingQueryForm.selectedNodeId);}
    });        
  }

  deleteProductCategory(id:number){
    const body = {categoryId: id}; 
    console.log("this.getParent(this.getNodeById(id)): "+this.getParent(this.getNodeById(id)))
    const parentId = this.getParent(this.getNodeById(id))!=null?this.getNodeId(this.getParent(this.getNodeById(id))):0;//возвращает id родителя или 0 если корневая категория
    return this.http.post('/api/auth/deleteProductCategory',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close')); //+++
                    if (parentId>0) {this.loadTreesAndOpenNode(parentId)} else {this.loadTrees()};
                    this.resetSelectedCategory(true);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
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
  clickBtnUndelete(){
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
  deleteDocs(){
    const body = {"checked": this.checkedList.join()};
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/deleteProducts', body) 
    .subscribe((data) => {   
      let result=data as any;
      switch(result){ //+++
        case 1:{this.getData();this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));break;}  //+++
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
  }

  undeleteDocs(){
    const body = {"checked": this.checkedList.join()};
    this.clearCheckboxSelection();
      return this.http.post('/api/auth/undeleteProducts', body) 
    .subscribe(
        (data) => {   
          let result=data as any;
          switch(result){ //+++
            case 1:{this.getData();this.openSnackBar(translate('menu.msg.rec_success'), translate('menu.msg.close'));break;}  //+++
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
            case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
          }
        },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
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
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    else this.setDefaultCompany();
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

  setDefaultCompany(){
    if(Cookie.get('products_companyId')=='0'||!this.companyIdInList(Cookie.get('products_companyId'))){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('products_companyId',this.sendingQueryForm.companyId);
    }
    this.getCRUD_rights(this.permissionsSet);
  }

  clickBtnAddCategory(): void {
    const dialogRef = this.productCategoriesDialog.open(ProductCategoriesDialogComponent, {
      width: '800px', 
      data:
      { 
        actionType:"create",
        parentCategoryName: this.sendingQueryForm.selectedNodeName , 
        parentCategoryId: +this.sendingQueryForm.selectedNodeId,
        docName:translate('menu.dialogs.ctg_creation'), //+++
        companyId:+this.sendingQueryForm.companyId
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log("createdCategoryId: "+result);
      this.loadTreesAndOpenNode(result);
    });        
  }
  
  clickBtnEditCategory(): void {
    const dialogRef = this.productCategoriesDialog.open(ProductCategoriesDialogComponent, {
      width: '800px', 
      data:
      { 
        actionType:"update",
        categoryName: this.sendingQueryForm.selectedNodeName , 
        categoryId: +this.sendingQueryForm.selectedNodeId,
        docName:translate('menu.dialogs.ctg_edit'), //+++
        companyId:+this.sendingQueryForm.companyId
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1)
        this.loadTreesAndOpenNode(+this.sendingQueryForm.selectedNodeId); 
      // this.resetSelectedCategory(true);
    });        
  }

  resetSelectedCategory(getData:boolean){
    this.sendingQueryForm.selectedNodeId='';
    this.sendingQueryForm.selectedNodeName='';
    this.sendingQueryForm.searchCategoryString='';
    Cookie.delete('products_selectedNodeId');
    Cookie.delete('products_selectedNodeName');
    if(getData)this.getData();
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
          this.clearTreeCheckboxSelection();
          this.treeDataSource.data=data as any [];          
        }, error => console.log(error)
        );
      } else this.getData();
  }

  clickBtnDuplicateProduct(): void {
    const dialogRef = this.ProductDuplicateDialog.open(ProductDuplicateDialog, {
      width: '600px', //+++
      data:
      { 
        head: translate('menu.dialogs.duplication'), //+++
        warning: translate('menu.dialogs.sel_dup_optio'),
        productId: this.checkedList[0]
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
      if(result==1){this.getData()}
    });        
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToViewAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  isStoreCategory(node:any){
    // console.log("node.is_store_category - "+node.id)
    return node.is_store_category;
  }
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as TodoItemNode [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
        if(+this.sendingQueryForm.selectedNodeId>0){
          this.expandParents(this.getNodeById(+this.sendingQueryForm.selectedNodeId));
        };
      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    this.checklistSelection.clear();
    this.loadSpravService.getProductCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as TodoItemNode [];
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
    Cookie.set('products_offset',this.sendingQueryForm.offset);
    Cookie.set('products_selectedNodeId',this.sendingQueryForm.selectedNodeId);
    Cookie.set('products_selectedNodeName',this.sendingQueryForm.selectedNodeName);
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
        // console.log("parentOfCurrentNode: "+parentOfCurrentNode.id);
        if(parentOfCurrentNode.id==parentNode.id){
          this.numChildsOfSelectedCategory++;
    }}}
    //console.log("this.numChildsOfSelectedCategory: "+this.numChildsOfSelectedCategory);
  }

  openDialogStoresSelect(){
    const dialogSettings = this.storesSelectComponent.open(StoresSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        companyId:  +this.sendingQueryForm.companyId, //предприятие, по которому будут запрашиваться список магазинов
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        this.selectedObjects=[];
        result.map(i => {
          this.selectedObjects.push(i.id);
        });
        let checkedCategoriesIds:number[]=[];
        this.checklistSelection.selected.forEach(m =>{
          checkedCategoriesIds.push(+m.id)
        })
        this.setStoresToCategory(checkedCategoriesIds);
      }
    });
  }
  setStoresToCategory(checkedCategoriesIds:number[]){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('modules.card.str_select'), //+++
        query: translate('menu.dialogs.q_save_cat_st'),
        warning: translate('menu.dialogs.save_p_cat_st'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result !== undefined){
        const body = {"setOfLongs2":  checkedCategoriesIds,     // categories ids
                    "setOfLongs1":  this.selectedObjects, // stores ids
                    "yesNo":        result==1?true:false,
                    "id":           this.sendingQueryForm.companyId
        };
        
        return this.http.post('/api/auth/setStoresToCategories', body).subscribe(
            (data) => {   
              this.openSnackBar(translate('menu.msg.sep_prod_cat'), translate('menu.msg.close')); //+++
              this.clearTreeCheckboxSelection();
              this.loadTrees();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
        );
      }
      
    });      
  }
  clickDeleteProductCategories(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.deleting_ctgs'), //+++
        query: translate('menu.dialogs.q_del_ctgs',{name: this.sendingQueryForm.selectedNodeName}),
        warning: translate('menu.dialogs.del_ctg_f_wrn',{name:this.cu.cap(translate('menu.docs.products'))}),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        let checkedCategoriesIds:number[]=[];
        this.checklistSelection.selected.forEach(m =>{
          checkedCategoriesIds.push(+m.id)
        });
        this.deleteProductCategories(checkedCategoriesIds);
      }
    });        
  }

  deleteProductCategories(checkedCategoriesIds:number[]){
    const body = {setOfLongs1: checkedCategoriesIds}; 
    return this.http.post('/api/auth/deleteProductCategories',body).subscribe(
      (data) => {   
        let result=data as any;
        switch(result){
          case 1:{
          this.openSnackBar(translate('docs.msg.deletet_succs'), translate('menu.msg.close'));
          this.clearTreeCheckboxSelection();
          this.loadTrees();
          this.resetSelectedCategory(true);
          break;}
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
        }
                  
                },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }

  clearTreeCheckboxSelection(){
    this.checklistSelection.deselect;
    this.checklistSelection.clear();
  }

  openDialogProductCategoriesSelect(){
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    'categories', // 
        companyId:  +this.sendingQueryForm.companyId, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        this.selectedObjects=[];
        result.map(i => {
          this.selectedObjects.push(i.id);
        });
        this.setCategoriesToProducts();
      }
    });
  }

  setCategoriesToProducts(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.cat_adding'), //+++
        query: translate('menu.dialogs.q_save_p_cat'),
        warning: translate('menu.dialogs.save_p_cat_ad'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result !== undefined){
        const body = {"setOfLongs1":  this.checkedList,
                      "setOfLongs2":  this.selectedObjects,
                      "yesNo":        result==1?true:false
        };
        this.clearCheckboxSelection();
        this.refreshPermissions(); // to show create button
        this.http.post('/api/auth/setCategoriesToProducts', body) 
          .subscribe(
              (data) => {   
                this.openSnackBar(translate('menu.msg.sep_prod_cat'), translate('menu.msg.close')); //+++
              },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
        );
      }
    });      
  }

  getCategoryStoresList(categoryId: number){
      this.categoryStoresList=[];
      this.categoryStoresLoading=true;
      this.http.get('/api/auth/getCategoryStoresList?category_id='+categoryId).subscribe(
        (data) => {
          this.categoryStoresLoading=false;
          this.categoryStoresList = data as IdAndName[];
        },
        error => {this.categoryStoresLoading=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
      );
  }

  /** Whether all the descendants of the node are selected. */
  /** Выбраны ли все потомки узла */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    try{
      const descendants = this.treeControl.getDescendants(node);
      const descAllSelected =
        descendants.length > 0 &&
        descendants.every(child => {
          return this.checklistSelection.isSelected(child);
        });
      return descAllSelected;
    } catch(e) {return false;}
  }

  /** Whether part of the descendants are selected */
  /** Выбрана ли часть потомков */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    try{
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    } catch(e) {return false;}
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);

    const descendants = this.treeControl.getDescendants(node);

    // if(this.checklistSelection.isSelected(node)) 
      // this.checklistSelection.select(...descendants);


    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
     descendants.forEach(child => this.checklistSelection.isSelected(child));
     //this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    //this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every(child => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
  isNodeSelected(node: TodoItemFlatNode): boolean {
    return this.checklistSelection.isSelected(node);
  }
//***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  resetOptions(){
    this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
    this.sendingQueryForm.filterOptionsIds = [];
  }
  fillOptionsList(){
    this.optionsIds=[{id:1, name: 'menu.top.only_del'},]; //+++
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
      console.log("allowToDelete - "+this.allowToDelete);
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
//**************************** ПЕЧАТЬ ДОКУМЕНТОВ  ******************************/
  // открывает диалог печати
  openDialogTemplates() { 
    const dialogTemplates = this.templatesDialogComponent.open(TemplatesDialogComponent, {
      maxWidth: '1000px',
      maxHeight: '95vh',
      // height: '680px',
      width: '95vw', 
      minHeight: '95vh',
      data:
      { //отправляем в диалог:
        company_id: +this.sendingQueryForm.companyId, //предприятие
        document_id: 14, // id документа из таблицы documents
      },
    });
    dialogTemplates.afterClosed().subscribe(result => {
      if(result){
        
      }
    });
  }
  // при нажатии на кнопку печати - нужно подгрузить список шаблонов для этого типа документа
  printDocs(){
    this.gettingTemplatesData=true;
    this.templatesList=[];
    this.http.get('/api/auth/getTemplatesList?company_id='+this.sendingQueryForm.companyId+"&document_id="+14+"&is_show="+true).subscribe
    (data =>{ 
        this.gettingTemplatesData=false;
        this.templatesList=data as TemplatesList[];
      },error => {console.log(error);this.gettingTemplatesData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  onClickPrintTemplate(template:TemplatesList){
    switch(template.type){
      case 'document':{;break;}
      case 'label':{this.openPrintLabelsDialog(template);break;}
    }
  }

  openPrintLabelsDialog(template:TemplatesList){
    const dialogTemplates = this.labelsPrintDialogComponent.open(LabelsPrintDialogComponent, {
      maxWidth: '1000px',
      maxHeight: '95vh',
      // height: '680px',
      width: '95vw', 
      minHeight: '95vh',
      data:
      { //отправляем в диалог:
        company_id: +this.sendingQueryForm.companyId, //предприятие
        num_labels_in_row:template.num_labels_in_row , // id документа из таблицы documents
        file_name: template.file_name, 
        // products:[
        //   {id: this.id, name: this.formBaseInformation.get('name').value},
        // ]
        products:this.productsToPrint
      },
    });
    dialogTemplates.afterClosed().subscribe(result => {
      if(result){}
    });
  }

  getProductsToPrint():IdAndName[]{
    let ret: IdAndName[] = [];


    return ret;
  }
}