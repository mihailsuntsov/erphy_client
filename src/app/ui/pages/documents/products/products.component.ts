import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-products-table.service';
import { ProductDuplicateDialog } from 'src/app//ui/dialogs/product-duplicate-dialog.component';
import { ProductCategoriesDialogComponent } from 'src/app/ui/dialogs/product-categories-dialog/product-categories-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';

interface FoodNode {
  id: string;
  name: string;
  children?: FoodNode[];
}
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
export interface DockTable {
  id: number;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class ProductsComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DockTable []=[] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DockTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DockTable>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  TREE_DATA: FoodNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;


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

  //tree
  private _transformer = (node: FoodNode, level: number) => {
    
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

  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    private Cookie: Cookie,
    public ConfirmDialog: MatDialog,
    public ProductDuplicateDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog) { 
      //this.treeDataSource.data = TREE_DATA;
    }
      
    ngOnInit() {
      this.sendingQueryForm.sortAsc="desc";
      this.sendingQueryForm.sortColumn="p.name";
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result="10";
      this.sendingQueryForm.companyId="0";
      this.sendingQueryForm.selectedNodeId="0";
      this.sendingQueryForm.searchCategoryString="";

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

      this.getCompaniesList();// -> getSetOfPermissions() -> getMyCompanyId() -> setDefaultCompany() -> getCRUD_rights() -> getData() 
    //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId


    }
    

 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    const body = {"documentId": 14};//14= "Товары и услуги"
          return this.http.post('/api/auth/giveMeMyPermissions', body) 
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyCompanyId();
                        },
                error => console.log(error),
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
    
    console.log("documentOfMyCompany - "+documentOfMyCompany);
    console.log("allowToRecoverFilesMyCompany - "+this.allowToRecoverFilesMyCompany);
    console.log("allowToRecoverFilesAllCompanies - "+this.allowToRecoverFilesAllCompanies);
    console.log(" - ");
    console.log("allowToView - "+this.allowToView);
    console.log("allowToUpdate - "+this.allowToUpdate);
    console.log("allowToCreate - "+this.allowToCreate);
    console.log("allowToDelete - "+this.allowToDelete);
    console.log("allowCategoryCreate - "+this.allowCategoryCreate);
    console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    console.log("allowCategoryDelete - "+this.allowCategoryDelete);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.getTableHeaderTitles();

      this.getTable();
      this.doFilterCompaniesList();
      this.loadTrees();
    }
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete || this.allowToCreate) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('article');
    this.displayedColumns.push('productgroup');
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
                error => console.log(error)
            ); 
  }

  getTable(){
    this.getPagesList();
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.receivedMatTable=data as any []; 
                  this.dataSource.data = this.receivedMatTable;
                  if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
                },
                error => console.log(error) 
            );
  }
  onCompanySelection(){
    Cookie.set('products_companyId',this.sendingQueryForm.companyId);
    this.resetSelectedCategory(false);
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
  checkboxLabel(row?: DockTable): string {
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
        head: 'Удаление категории товаров',
        query: 'Удалить категорию "'+this.sendingQueryForm.selectedNodeName+'"?',
        warning: 'Товары данной категории не удалятся, но их привязка к категории будет утрачена.',
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
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    if (parentId>0) {this.loadTreesAndOpenNode(parentId)} else {this.loadTrees()};
                    this.resetSelectedCategory(true);
                },
        error => console.log(error),
    );  
  }
  clickBtnDelete(): void {
    const dialogRef = this.deleteDialog.open(DeleteDialog, {
      width: '300px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteDocks();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }

  deleteDocks(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/deleteProducts', body) 
            .subscribe(
                (data) => {   
                            this.receivedMatTable=data as any []; 
                            this.dataSource.data = this.receivedMatTable;
                            this.getData();
                        },
                error => console.log(error),
            );
    }
    
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => console.log(error));
  }
  
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.httpService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.getSetOfPermissions();
                },
                error => console.log(error)
            );
  }

  setDefaultCompany(){
    if(Cookie.get('products_companyId')=='0'){
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
        dockName:"Создание категории",
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
        dockName:"Редактирование категории",
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadTreesAndOpenNode(+this.sendingQueryForm.selectedNodeId);
      this.resetSelectedCategory(true);
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
        dockName:"Изменение порядка вывода",
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
          // this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
    
        }, error => console.log(error)
        );
      } else this.getData();
  }

  clickBtnDuplicateProduct(): void {
    const dialogRef = this.ProductDuplicateDialog.open(ProductDuplicateDialog, {
      width: '600px',
      data:
      { 
        head: 'Дублирование',
        warning: 'Выберите нужные опиции дублирования:',
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
      console.log("parentOfCurrentNode: "+parentOfCurrentNode.id);
      if(parentOfCurrentNode.id==parentNode.id){
        this.numChildsOfSelectedCategory++;
  }}}
  //console.log("this.numChildsOfSelectedCategory: "+this.numChildsOfSelectedCategory);
}



}