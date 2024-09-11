import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}
interface TreeFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
export interface DocTable {
  id: number;
}
interface IdAndName {// интерфейс для выбранных объектов (категории или товары)
  id: number;
  name:string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-cagent-categories-select',
  templateUrl: './cagent-categories-select.component.html',
  styleUrls: ['./cagent-categories-select.component.css'],
  providers: [LoadSpravService]
})
export class CagentCategoriesSelectComponent implements OnInit {
  receivedMatTable: DocTable []=[] ;//массив для получения данных для дерева
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для дерева
  myCompanyId:number=0;//
  TREE_DATA: TreeNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  selectedObjects: IdAndName[] = []; // выбранные объекты (категории)
  idTypes: string;  // что нужно выбрать - категории ( categories / cagents )
  companyId:number; //предприятие, по которому будут отображаться товары и категории
  selectable = true;
  removable = true;


  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToView:boolean = false;
  showOpenDocIcon:boolean=false;//отображать иконку открытия карточки товара
  showNotEnoughPermissionsMessage:boolean = false;

  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  //tree
  private _transformer = (node: TreeNode, level: number) => {
      return {
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        id: node.id,
        level: level,
      };
  }
  treeControl = new FlatTreeControl<TreeFlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: TreeFlatNode) => node.expandable;
  selectedNodeId: any = 0;
  selectedNodeName:string = '';

  // @Input() 


  constructor(
    public cagentCategoriesSelectDialog: MatDialogRef<CagentCategoriesSelectComponent>,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public cagentCategoriesDialog: MatDialog,
    public MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    public CagentDuplicateDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
      
    ngOnInit() {

      this.idTypes = this.data.idTypes; // что выбираем - категории или товары (categories / cagents) Параметр передается из родительского компонента
      this.companyId = this.data.companyId; //предприятие, по которому будут отображаться товары и категории
      this.getSetOfPermissions(); // -> getCRUD_rights() -> getData() 
      
     

    }
    

 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=13')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyCompanyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => console.log(error));
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==150)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==151)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.companyId==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.showOpenDocIcon=(this.allowToView);
    this.showNotEnoughPermissionsMessage=true;//можно показывать сообщение о недостаточности прав на просмотр списка товаров и услуг.
    // console.log("allowToView - "+this.allowToView);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.loadTrees();
    }
  }

 
  onNoClick(): void {
    this.cagentCategoriesSelectDialog.close();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  // searchCategory(){
  //   if(this.sendingQueryForm.searchCategoryString!=''){
  //     const body={
  //       companyId:this.companyId,
  //       searchString:this.sendingQueryForm.searchCategoryString
  //     }
  //     return this.http.post('/api/auth/searchCagentCategory',body)
  //     .subscribe(
  //       (data) => {
  //         this.treeDataSource.data=data as any [];
  //       }, error => console.log(error)
  //       );
  //     } else this.getData();
  // }


//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getCagentCategoriesTrees(this.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
        if(+this.selectedNodeId>0){
          this.expandParents(this.getNodeById(+this.selectedNodeId));
        };
      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getCagentCategoriesTrees(this.companyId).subscribe(
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
    this.selectedNodeId=node.id;
    this.selectedNodeName=node.name;
    this.recountNumChildsOfSelectedCategory();
    this.getData();
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
    parentNode=this.getNodeById(+this.selectedNodeId);
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
  //нажали "Выбрать"
  applySelect(){
    // this.cagentCategoriesSelectDialog.close(this.selectedObjects);

    this.cagentCategoriesSelectDialog.close(this.selectedObjects);
  }
  //добавляет категорию в список выбранных
  addCategory(node: TreeNode){
    this.selectedObjects.push({id:+node.id,name:node.name});
  }
  //удаляет категорию списка выбранных
  remove(obj: IdAndName): void {
    const index = this.selectedObjects.indexOf(obj);
    if (index >= 0) {
      this.selectedObjects.splice(index, 1);
    }
  }
}