import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit, Optional, Inject, Output, EventEmitter } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-cagents-table.service';
import { UniversalCategoriesDialogComponent } from 'src/app/ui/dialogs/universal-categories-dialog/universal-categories-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++
import { CagentCategoriesSelectComponent } from 'src/app/modules/trade-modules/cagent-categories-select/cagent-categories-select.component';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
export interface CheckBox {
  id: number;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-cagents',
  templateUrl: './cagents.component.html',
  styleUrls: ['./cagents.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService,CagentCategoriesSelectComponent]
})
export class CagentsComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  TREE_DATA: TreeNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, select_docs - оконный режим выбора
  selectedObjects: number[]=[]; // выбранные во всплывающем окне выбора категорий объекты (категории), для массового присвоения контрагентам

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
  allowCategoryCreate:boolean = false;
  allowCategoryUpdate:boolean = false;
  allowCategoryDelete:boolean = false;

  showOpenDocIcon:boolean=false;
  gettingTableData:boolean=true;//!!!
  


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

  //переменные для управления динамическим отображением элементов
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //Управление чекбоксами
  checkedList:number[]=[]; //строка для накапливания id вида [2,5,27...]

  
  //tree
  private _transformer = (node: TreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      id: node.id,
      level: level,
    };
  }

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: FlatNode) => node.expandable;

  constructor(private queryFormService:   QueryFormService,
      private httpService:   LoadSpravService,
      private loadSpravService:   LoadSpravService,
      private _snackBar: MatSnackBar,
      private universalCategoriesDialog: MatDialog,
      private MessageDialog: MatDialog,
      private Cookie: Cookie,
      private ConfirmDialog: MatDialog,
      private http: HttpClient,
      private deleteDialog: MatDialog,
      private cagentCategoriesSelectComponent: MatDialog,
      private dialogRef1: MatDialogRef<CagentsComponent>,
      public cu: CommonUtilitesService, //+++
      private service: TranslocoService,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any) { 
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
    if(Cookie.get('cagents_companyId')=='undefined' || Cookie.get('cagents_companyId')==null)     
      Cookie.set('cagents_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('cagents_companyId')=="0"?"0":+Cookie.get('cagents_companyId'));
    if(Cookie.get('cagents_sortAsc')=='undefined' || Cookie.get('cagents_sortAsc')==null)       
      Cookie.set('cagents_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('cagents_sortAsc');
    if(Cookie.get('cagents_sortColumn')=='undefined' || Cookie.get('cagents_sortColumn')==null)    
      Cookie.set('cagents_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('cagents_sortColumn');
    if(Cookie.get('cagents_offset')=='undefined' || Cookie.get('cagents_offset')==null)        
      Cookie.set('cagents_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('cagents_offset');
    if(Cookie.get('cagents_result')=='undefined' || Cookie.get('cagents_result')==null)        
      Cookie.set('cagents_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('cagents_result');

    if(this.data)
    {
      this.mode=this.data.mode;
      this.sendingQueryForm.companyId=this.data.companyId;
    }
    
      //+++ getting base data from parent component
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');      

    this.fillOptionsList();//заполняем список опций фильтра
    this.getCompaniesList();// -> getSetOfPermissions() -> getMyCompanyId() -> setDefaultCompany() -> getCRUD_rights() -> getData() 
    //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId
  }
    

 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=12')
    .subscribe(
        (data) => {   
            this.permissionsSet=data as any [];
            this.getMyCompanyId();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==129)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==130)});
    this.allowToDeleteAllCompanies = this.permissionsSet.some(         function(e){return(e==131)});
    this.allowToDeleteMyCompany = this.permissionsSet.some(            function(e){return(e==132)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==133)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==134)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==135)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==136)});
    this.allowCategoryCreateAllCompanies = this.permissionsSet.some(   function(e){return(e==137)});
    this.allowCategoryCreateMyCompany = this.permissionsSet.some(      function(e){return(e==138)});
    this.allowCategoryUpdateAllCompanies = this.permissionsSet.some(   function(e){return(e==139)});
    this.allowCategoryUpdateMyCompany = this.permissionsSet.some(      function(e){return(e==140)});
    this.allowCategoryDeleteAllCompanies = this.permissionsSet.some(   function(e){return(e==141)});
    this.allowCategoryDeleteMyCompany = this.permissionsSet.some(      function(e){return(e==142)});   
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
      this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
      this.updateSortOptions(); 
      this.getTableHeaderTitles();
      this.getPagesList();
      this.getTable();
      this.loadTrees();
      //!!!
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} 
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete/* || this.allowToCreate*/) this.displayedColumns.push('select');
    if(this.showOpenDocIcon && this.mode=='standart') this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('contacts');
    this.displayedColumns.push('status');
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            ); 
  }

  getTable(){//!!!
    this.gettingTableData=true;
    this.queryFormService.getTable(this.sendingQueryForm)
      .subscribe(
          (data) => {
            this.dataSource.data = data as any []; 
            if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
            this.gettingTableData=false;
          },
          error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            ); 
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
    checkboxLabel(row?: CheckBox): string {
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
      for (var i = 0; i < this.dataSource.data.length; i++) {
        if(this.selection.isSelected(this.dataSource.data[i]))
          this.checkedList.push(this.dataSource.data[i].id);
      }
      if(this.checkedList.length>0){
          this.hideAllBtns();
          if(this.allowToDelete) this.visBtnDelete = true;
          if(this.checkedList.length==1){this.visBtnCopy = true}
      }else{this.showOnlyVisBtnAdd()}
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
      Cookie.set('cagents_result',this.sendingQueryForm.result);
      this.getData();
    }
    
    setPage(value:any) // set pagination
    {
      this.clearCheckboxSelection();
      this.sendingQueryForm.offset=value;
      Cookie.set('cagents_offset',value);
      this.getData();
    }
    
    clearCheckboxSelection(){
      this.selection.clear();
      this.createCheckedList();//тут перерасчитывается vizBtnDelete
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
        Cookie.set('cagents_sortAsc',this.sendingQueryForm.sortAsc);
        } else {
            this.sendingQueryForm.sortColumn=valueSortColumn;
            this.sendingQueryForm.sortAsc="asc";
            Cookie.set('cagents_sortAsc',"asc");
            Cookie.set('cagents_sortColumn',valueSortColumn);
        }
        this.getData();
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
    clickBtnRestore(): void {
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
          return this.http.post('/api/auth/deleteCagents', body) 
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
        return this.http.post('/api/auth/undeleteCagents', body) 
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
      if(this.data)//если документ открыт в окне - ставим предприятие родительского документа (из которгого открыт)
      {
        this.sendingQueryForm.companyId=this.data.companyId;
        this.getCRUD_rights();
      } 
      else 
      {
        if(Cookie.get('cagents_companyId')=='0'||!this.companyIdInList(Cookie.get('cagents_companyId'))){
          this.sendingQueryForm.companyId=this.myCompanyId;
          Cookie.set('cagents_companyId',this.sendingQueryForm.companyId);
        }
        this.getCRUD_rights();
      }
    }

    clickBtnAddCategory(): void {
      const dialogRef = this.universalCategoriesDialog.open(UniversalCategoriesDialogComponent, {
        width: '800px', 
        data:
        { 
          actionType:"create",
          parentCategoryName: this.sendingQueryForm.selectedNodeName , 
          parentCategoryId: +this.sendingQueryForm.selectedNodeId,
          title:translate('menu.dialogs.ctg_creation'),
          companyId:+this.sendingQueryForm.companyId,
          docName:"Cagent"
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        console.log("createdCategoryId: "+result);
        this.loadTreesAndOpenNode(result);
      });        
    }
    
    clickBtnEditCategory(): void {
      const dialogRef = this.universalCategoriesDialog.open(UniversalCategoriesDialogComponent, {
        width: '800px', 
        data:
        { 
          actionType:"update",
          categoryName: this.sendingQueryForm.selectedNodeName , 
          categoryId: +this.sendingQueryForm.selectedNodeId,
          title:translate('menu.dialogs.ctg_edit'),
          docName:"Cagent"
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        this.loadTreesAndOpenNode(+this.sendingQueryForm.selectedNodeId);
        this.resetSelectedCategory();
      });        
    }
  
    resetSelectedCategory(){
      this.sendingQueryForm.selectedNodeId='';
      this.sendingQueryForm.selectedNodeName='';
      this.sendingQueryForm.searchCategoryString='';
      this.getData();
    }

    changeOrderOfCategories(){
      const dialogRef = this.universalCategoriesDialog.open(UniversalCategoriesDialogComponent, {
        width: '800px', 
        data:
        { 
          actionType:"changeOrder",
          parentCategoryId: +this.sendingQueryForm.selectedNodeId,
          title:translate('menu.dialogs.order_edit'), //+++
          companyId: +this.sendingQueryForm.companyId,
          docName:"Cagent"
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
        return this.http.post('/api/auth/searchCagentCategory',body)
        .subscribe(
          (data) => {
            this.treeDataSource.data=data as any [];
          }, error => console.log(error)
          );
        } else this.getData();
    }

    onCompanySelection(){
      Cookie.set('cagents_companyId',this.sendingQueryForm.companyId);
      this.sendingQueryForm.offset=0;
      this.resetOptions();
      this.getData();
    }
    getBaseData(data) {    //+++ emit data to parent component
      this.baseData.emit(data);
    }

    clickBtnDeleteCagentCategory(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('menu.dialogs.deleting_ctg'), //+++
          query: translate('menu.dialogs.q_del_ctg',{name: this.sendingQueryForm.selectedNodeName}),
          warning: translate('menu.dialogs.del_ctg_f_wrn',{name:this.cu.cap(translate('menu.docs.cparties'))}),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){this.deleteCagentCategory(+this.sendingQueryForm.selectedNodeId);}
      });        
    }

    deleteCagentCategory(id:number){
      const body = {categoryId: id}; 
      console.log("this.getParent(this.getNodeById(id)): "+this.getParent(this.getNodeById(id)))
      const parentId = this.getParent(this.getNodeById(id))!=null?this.getNodeId(this.getParent(this.getNodeById(id))):0;//возвращает id родителя или 0 если корневая категория
      return this.http.post('/api/auth/deleteCagentCategory',body)
      .subscribe(
          (data) => {   
                      this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));
                      if (parentId>0) {this.loadTreesAndOpenNode(parentId)} else {this.loadTrees()};
                      this.resetSelectedCategory();
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );  
    }

//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getCagentCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)

      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getCagentCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
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
    this.getPagesList();
    this.sendingQueryForm.offset=0;
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

openDialogCagentCategoriesSelect(){
  const dialogSettings = this.cagentCategoriesSelectComponent.open(CagentCategoriesSelectComponent, {
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
      this.setCategoriesToCagents();
    }
  });
}
setCategoriesToCagents(){
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
    const body = {"cagentsIds":     this.checkedList,
                  "categoriesIds":  this.selectedObjects,
                  "save":           result==1?true:false
    };
    this.clearCheckboxSelection();
    return this.http.post('/api/auth/setCategoriesToCagents', body) 
      .subscribe(
          (data) => { 
            let result = data as any;
            switch(result){
              case 1:{this.getData();this.openSnackBar(translate('menu.msg.changed_succ'), translate('menu.msg.close'));
                this.openSnackBar(translate('menu.msg.sep_prod_cat'), translate('menu.msg.close')); //+++
                this.showOnlyVisBtnAdd();
                this.getPagesList();
                this.getTable();
                break;}  //+++
              case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
              case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
            }  
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
      );
  });      
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

  copyToClipboard(text: string){
    navigator.clipboard.writeText(text);
  }

}
