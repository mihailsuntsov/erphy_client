import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit , Inject, Optional, Output, EventEmitter} from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { QueryFormService } from './get-files-table.service';
import { UniversalCategoriesDialogComponent } from 'src/app/ui/dialogs/universal-categories-dialog/universal-categories-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { HttpClient} from '@angular/common/http';
import { FilesUploadDialogComponent } from 'src/app/ui/dialogs/files-upload-dialog/files-upload-dialog.component';
import { Observable } from 'rxjs';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
export interface CheckBox {
  id: number;
  image?: any;
}
export interface File {
  anonyme_access: boolean;
  changer: string;
  company: string;
  creator: string;
  date_time_changed: string;
  date_time_created: string;
  description: string;
  extention: string;
  file_size: string;
  id: number;
  master: string;
  mime_type: string;
  name: string;
  original_name: string;
  path: string;
  image: any;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService //+++
  ]
})
export class FilesComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string []=[];//массив для получения данных пагинации
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any []=[];//массив для получения списка предприятий
  myCompanyId:number=0;//
  TREE_DATA: TreeNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  myId:number=0;
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, select - оконный режим выбора файлов
  gettingTableData:boolean=true;//!!!
  
  files: File[] = [];//массив данных для таблицы, картинок-миниатюр и чекбоксов (чекбоксы берут из него id, таблица -всё)



  //переменные прав
  permissionsSet: any[];//сет прав на документ
  // allowToShowMenuTableMyCompany:boolean = false;
  // allowToShowMenuTableAllCompanies:boolean = false;
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
    {value: '8', viewValue: '8'},
    {value: '16', viewValue: '16'},
    {value: '24', viewValue: '24'}
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
  visBtnRecover = false;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  // *****  переменные картинок  ***** 
// imagesInfo : imagesInfo []; //массив для получения информации по картинкам товара
selectedFiles: FileList;
progress: { percentage: number } = { percentage: 0 };
mainImageAddress: string; // имя или адрес главной картинки
imgBegin:string='<img src="../../../../../../assets/images/ext_icons/';
imgEnd:string='" width=50>';
viewMode:string = "grid"; // способ отображения файлов - таблицей table или сеткой grid 

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
  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: FlatNode) => node.expandable;

  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public filesUploadDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private MessageDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    private Cookie: Cookie,
    public dialogRef1: MatDialogRef<FilesComponent>,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,
   @Optional() @Inject(MAT_DIALOG_DATA) public data: any
) { 
      //this.treeDataSource.data = TREE_DATA;
    }
    onNoClick(): void {
      this.dialogRef1.close();
    }

    ngOnInit() {
      if(this.data)
      {
        this.mode=this.data.mode;
        this.sendingQueryForm.companyId=this.data.companyId;
        // this.sendingQueryForm.showOnlyAnonymeAccessFiles =true; //показывать только файлы с разрешенным анонимным доступом. Нужно для mode = select
        this.sendingQueryForm.showOnlyAnonymeAccessFiles =false; 
        Cookie.set('files_trash',"false");
      } else {
        this.sendingQueryForm.companyId="0";
        this.sendingQueryForm.showOnlyAnonymeAccessFiles = false; //показывать все файлы. Нужно для mode = select
      }
      this.sendingQueryForm.sortAsc="desc";
      this.sendingQueryForm.sortColumn="date_time_created_sort";
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result="16";
      
      this.sendingQueryForm.selectedNodeId="0";
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.trash=false;

      
      // console.log("Cookie.get('files_result') - "+Cookie.get('files_result'));

      
      //+++ getting base data from parent component
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');      

      this.getCompaniesList();// -> getSetOfPermissions() -> getMyCompanyId() -> setDefaultCompany() -> getCRUD_rights() -> getData() 
      //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId

      //сохраненные в куках параметры
      try{
      this.sendingQueryForm.trash=Cookie.get('files_trash')=="true"?true:false;
      // alert(Cookie.get('files_companyId'))
      if(Cookie.get('files_companyId')=='undefined' || Cookie.get('files_companyId')==null)     
        Cookie.set('files_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('files_companyId')=="0"?"0":+Cookie.get('files_companyId'));
        // alert(this.sendingQueryForm.companyId)
      if(Cookie.get('files_sortAsc')=='undefined' || Cookie.get('files_sortAsc')==null)       
        Cookie.set('files_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('files_sortAsc');
      if(Cookie.get('files_sortColumn')=='undefined' || Cookie.get('files_sortColumn')==null)    
        Cookie.set('files_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('files_sortColumn');
      if(Cookie.get('files_offset')=='undefined' || Cookie.get('files_offset')==null)        
        Cookie.set('files_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('files_offset');
      if(Cookie.get('files_result')=='undefined' || Cookie.get('files_result')==null)        
        Cookie.set('files_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('files_result');
      if(Cookie.get('files_viewMode')=='undefined' || Cookie.get('files_viewMode')==null)        
        Cookie.set('files_viewMode',this.viewMode); else this.viewMode=Cookie.get('files_viewMode');



      } catch (e){
        console.log(e);
      }
      // this.getImageFromService("/api/auth/getFile/c5033a08-5b7-2020-01-14-17-14-05-739.png");
    }
    
 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=13')
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          this.getMyId();
                      },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
          );
  }
  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==146)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==147)});
    this.allowToDeleteAllCompanies = this.permissionsSet.some(         function(e){return(e==148)});
    this.allowToDeleteMyCompany = this.permissionsSet.some(            function(e){return(e==149)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==150)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==151)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==152)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==153)});
    this.allowCategoryCreateAllCompanies = this.permissionsSet.some(   function(e){return(e==154)});
    this.allowCategoryCreateMyCompany = this.permissionsSet.some(      function(e){return(e==155)});
    this.allowCategoryUpdateAllCompanies = this.permissionsSet.some(   function(e){return(e==156)});
    this.allowCategoryUpdateMyCompany = this.permissionsSet.some(      function(e){return(e==157)});
    this.allowCategoryDeleteAllCompanies = this.permissionsSet.some(   function(e){return(e==158)});
    this.allowCategoryDeleteMyCompany = this.permissionsSet.some(      function(e){return(e==159)});
    this.allowToRecoverFilesAllCompanies = this.permissionsSet.some(   function(e){return(e==177)});
    this.allowToRecoverFilesMyCompany = this.permissionsSet.some(      function(e){return(e==178)});
    this.allowToDeleteFromTrashAllCompanies = this.permissionsSet.some(function(e){return(e==179)});
    this.allowToDeleteFromTrashMyCompany = this.permissionsSet.some(   function(e){return(e==180)});
    this.allowToClearTrashAllCompanies = this.permissionsSet.some(     function(e){return(e==181)});
    this.allowToClearTrashMyCompany = this.permissionsSet.some(        function(e){return(e==182)});
    
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    this.allowToCreate=((documentOfMyCompany && (this.allowToCreateAllCompanies || this.allowToCreateMyCompany))||(documentOfMyCompany==false && this.allowToCreateAllCompanies))?true:false;
    this.allowToDelete=((documentOfMyCompany && (this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany))||(documentOfMyCompany==false && this.allowToDeleteAllCompanies))?true:false;
    this.allowToRecoverFiles=((documentOfMyCompany && (this.allowToRecoverFilesAllCompanies || this.allowToRecoverFilesMyCompany))||(documentOfMyCompany==false && this.allowToRecoverFilesAllCompanies))?true:false;
    this.allowToDeleteFromTrash=((documentOfMyCompany && (this.allowToDeleteFromTrashAllCompanies || this.allowToDeleteFromTrashMyCompany))||(documentOfMyCompany==false && this.allowToDeleteFromTrashAllCompanies))?true:false;
    this.allowToClearTrash=((documentOfMyCompany && (this.allowToClearTrashAllCompanies || this.allowToClearTrashMyCompany))||(documentOfMyCompany==false && this.allowToClearTrashAllCompanies))?true:false;
    this.allowCategoryCreate=((documentOfMyCompany && (this.allowCategoryCreateAllCompanies || this.allowCategoryCreateMyCompany))||(documentOfMyCompany==false && this.allowCategoryCreateAllCompanies))?true:false;
    this.allowCategoryUpdate=((documentOfMyCompany && (this.allowCategoryUpdateAllCompanies || this.allowCategoryUpdateMyCompany))||(documentOfMyCompany==false && this.allowCategoryUpdateAllCompanies))?true:false;
    this.allowCategoryDelete=((documentOfMyCompany && (this.allowCategoryDeleteAllCompanies || this.allowCategoryDeleteMyCompany))||(documentOfMyCompany==false && this.allowCategoryDeleteAllCompanies))?true:false;
    
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    this.visBtnAdd = (this.allowToCreate && !this.sendingQueryForm.trash)?true:false;
    
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToRecoverFilesMyCompany - "+this.allowToRecoverFilesMyCompany);
    // console.log("allowToRecoverFilesAllCompanies - "+this.allowToRecoverFilesAllCompanies);
    // console.log(" - ");
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // console.log("allowToDelete - "+this.allowToDelete);
    // console.log("allowToRecoverFiles - "+this.allowToRecoverFiles);
    // console.log("allowToDeleteFromTrash - "+this.allowToDeleteFromTrash);
    // console.log("allowToClearTrash - "+this.allowToClearTrash);
    // console.log("allowCategoryCreate - "+this.allowCategoryCreate);
    // console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    // console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    // console.log("allowCategoryDelete - "+this.allowCategoryDelete);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete || this.mode=='select') this.displayedColumns.push('select');
    if(this.mode=='standart') this.displayedColumns.push('extention');
    this.displayedColumns.push('original_name');
    this.displayedColumns.push('description');
    this.displayedColumns.push('anonyme_access');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('file_size');
  }

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
        this.getTableHeaderTitles();
        this.getPagesList();
        this.getTable();
        this.doFilterCompaniesList();
        this.loadTrees();
        //!!!
      } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} 
    }

  getPagesList(){
    this.donePagesList = false;
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(this.sendingQueryForm)
            .subscribe(
                data => {this.receivedPagesList=data as string []; this.donePagesList=true;
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            ); 
  }

    clickShowTrashBtn(){
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
      this.sendingQueryForm.trash=!this.sendingQueryForm.trash;
      this.sendingQueryForm.showOnlyAnonymeAccessFiles=false;
      this.sendingQueryForm.offset=0;
      Cookie.set('files_trash',this.sendingQueryForm.trash?"true":"false");
      
      this.getPagesList();
      this.getTable();
      if(this.allowToCreate && !this.sendingQueryForm.trash) this.visBtnAdd = true; else  this.visBtnAdd = false;
      //сброс категорий
      this.sendingQueryForm.selectedNodeId='';
      this.sendingQueryForm.selectedNodeName='';
      this.sendingQueryForm.searchCategoryString='';
    }

    clickAnonymeAccessFilesBtn(){
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
      this.sendingQueryForm.showOnlyAnonymeAccessFiles=!this.sendingQueryForm.showOnlyAnonymeAccessFiles;
      this.sendingQueryForm.offset=0;
      Cookie.set('files_show_only_anonyme',this.sendingQueryForm.showOnlyAnonymeAccessFiles?"true":"false");
      
      this.getPagesList();
      this.getTable();
      //if(this.allowToCreate && !this.sendingQueryForm.trash) this.visBtnAdd = true; else  this.visBtnAdd = false;

    }

    getTable(){
      //console.log("перед вызовом 1");
      this.gettingTableData=true;
      this.queryFormService.getTable(this.sendingQueryForm)
        .subscribe(
        (data) => {
          this.gettingTableData=false;
          this.files=data as File[]; 
          // загрузка картинок в полученный массив. Поясняю: Мы запрашиваем картинки через GET-запрос, отправляя JWT-ключ (иначе по /api/auth/.. ничего не получить)
          // ссылка на картинку приходит в data
          // картинка приходит в виде blob, который отправляется на конвертацию в createImageFromBlob, там она догружается 
          // (т.к. цикл бежи быстрее загрузки) и после загрузки пишется в массив files
          for (let i = 0; i < this.files.length; i++) {
            if( this.files[i].extention.toUpperCase() == '.PNG' || 
                this.files[i].extention.toUpperCase() == '.JPG' || 
                this.files[i].extention.toUpperCase() == '.JPEG'){
                this.getImage('/api/auth/getFileImageThumb/' + this.files[i].name).subscribe(blob => {
                    this.createImageFromBlob(blob,i);
                });
            }
          }
        },
        error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
        ); 
  }

  onCompanySelection(){
    Cookie.set('files_companyId',this.sendingQueryForm.companyId);
    // this.resetOptions();
    this.getData();
  }

    setViewMode(value){
      this.viewMode=value;
      Cookie.set('files_viewMode',value);
    }

    isAllSelected() {
      const numSelected = this.selection.selected.length;
      const numRows = this.files.length;
      return numSelected === numRows;//true если все строки выбраны
    }  
    
    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
      this.isAllSelected() ?
          this.selection.clear() :
          this.files.forEach(row => this.selection.select(row));
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
  
      for (var i = 0; i < this.files.length; i++) {
        if(this.selection.isSelected(this.files[i]))
          this.checkedList.push(this.files[i].id);
      }
      if(this.checkedList.length>0){
          this.hideAllBtns();
          if((this.allowToDelete && !this.sendingQueryForm.trash) || (this.sendingQueryForm.trash && this.allowToClearTrash)) this.visBtnDelete = true;//если не в корзине и можно удалять в корзину, или если в корзине и можно удалять окончательно
          if(this.checkedList.length==1){this.visBtnCopy = true}
          if(this.sendingQueryForm.trash && this.allowToRecoverFiles){this.visBtnRecover = true;}
      }else{this.showOnlyVisBtnAdd()}
      console.log("checkedList - "+this.checkedList);
    }

    hideAllBtns(){
      this.visBtnAdd = false;
      this.visBtnDelete = false;
      this.visBtnRecover = false;
    }
    showOnlyVisBtnAdd(){
      if(this.allowToCreate && !this.sendingQueryForm.trash) this.visBtnAdd = true;
      this.visBtnDelete = false;
      this.visBtnRecover = false;
    }
    
    setNumOfPages(){
      this.clearCheckboxSelection();
      this.createCheckedList();
      this.sendingQueryForm.offset=0;
      Cookie.set('files_result',this.sendingQueryForm.result);
      this.getData();
    }
    
    setPage(value:any) // set pagination
    {
      this.clearCheckboxSelection();
      this.sendingQueryForm.offset=value;
      Cookie.set('files_offset',value);
      this.getData();
    }
    
    clearCheckboxSelection(){
      this.selection.clear();
      this.files.forEach(row => this.selection.deselect(row));
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
            Cookie.set('files_sortAsc',this.sendingQueryForm.sortAsc);
        } else {
            this.sendingQueryForm.sortColumn=valueSortColumn;
            this.sendingQueryForm.sortAsc="asc";
            Cookie.set('files_sortAsc',"asc");
            Cookie.set('files_sortColumn',valueSortColumn);
        }
        this.getData();
    }

    clickBtnDeleteFileCategory(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('menu.dialogs.deleting_ctg'), //+++
          query: translate('menu.dialogs.q_del_ctg',{name: this.sendingQueryForm.selectedNodeName}),
          warning: translate('menu.dialogs.del_ctg_f_wrn',{name:this.cu.cap(translate('menu.docs.files'))}),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){this.deleteFileCategory(+this.sendingQueryForm.selectedNodeId);}
      });        
    }

    deleteFileCategory(id:number){
      const body = {categoryId: id}; 
      console.log("this.getParent(this.getNodeById(id)): "+this.getParent(this.getNodeById(id)))
      const parentId = this.getParent(this.getNodeById(id))!=null?this.getNodeId(this.getParent(this.getNodeById(id))):0;//возвращает id родителя или 0 если корневая категория
      return this.http.post('/api/auth/deleteFileCategory',body)
      .subscribe(
          (data) => {   
                      this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close')); //+++
                      if (parentId>0) {this.loadTreesAndOpenNode(parentId)} else {this.loadTrees()};
                      this.resetSelectedCategory();
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

    deleteDocs(){
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/deleteFiles', body) 
        .subscribe(
          (data) => {   
            let result=data as any;
            switch(result){
              case 1:{this.getData();this.openSnackBar(translate('menu.msg.del_bin_succ'), translate('menu.msg.close'));break;}  //+++
              case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
              case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
            }
          },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    }  
      
    clickBtnRecover() {
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/recoverFilesFromTrash', body) 
          .subscribe(
            (data) => {   
              let result=data as any;
              switch(result){
                case 1:{this.getData();this.openSnackBar(translate('menu.msg.rec_file_succ'), translate('menu.msg.close'));break;}  //+++
                case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
                case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
              }
            },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
      }  

    clickBtnDeleteFromTrash(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('menu.dialogs.deleting_bin'), //+++
          query: translate('menu.dialogs.q_d_s_bin_fls'),
          warning: translate('menu.dialogs.del_bin_fls_w'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){this.deleteFromTrash();}
      });        
    }
    
    deleteFromTrash(){
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/deleteFilesFromTrash', body) 
              .subscribe(
                (data) => {   
                  let result=data as any;
                  switch(result){
                    case 1:{this.getData();this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));break;}  //+++
                    case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
                    case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
                  }
                },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
          }  

    clickBtnClearTrash(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('menu.dialogs.bin_clearing'), //+++
          query: translate('menu.dialogs.q_d_a_bin_fls'),
          warning: translate('menu.dialogs.del_bin_fls_w'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){this.clearTrash ();}
      });       
    }
    clearTrash(){
      const body = {"company_id": this.sendingQueryForm.companyId}; 
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/clearTrash', body) 
        .subscribe(
          (data) => {   
            let result=data as any;
            switch(result){
              case 1:{this.getData();this.openSnackBar(translate('menu.msg.bin_clr_succ'), translate('menu.msg.close'));break;}  //+++
              case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
              case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
            }
          },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
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
    
    getMyId(){ //+++
      if(+this.myId==0)
      this.loadSpravService.getMyId()
              .subscribe(
                  (data) => {this.myId=data as any;
                    this.getMyCompanyId();},
                    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
              );
        else this.getMyCompanyId();
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

    // setDefaultCompany(){
    //   if(this.data)
    //     this.sendingQueryForm.companyId=this.data.companyId;
    //   else 
    //     this.sendingQueryForm.companyId=this.myCompanyId;
    //   this.getCRUD_rights();
    // }

    setDefaultCompany(){
      if(Cookie.get('files_companyId')=='0'||!this.companyIdInList(Cookie.get('files_companyId'))){
        // alert((Cookie.get('files_companyId')=='0') + ' --- ' + (!this.companyIdInList(Cookie.get('files_companyId'))))
        this.sendingQueryForm.companyId=this.myCompanyId;
        Cookie.set('files_companyId',this.sendingQueryForm.companyId);
      }
        this.getCRUD_rights();
    }

    clickBtnAddCategory(): void {
      const dialogRef = this.universalCategoriesDialog.open(UniversalCategoriesDialogComponent, {
        width: '800px', 
        data:
        { 
          actionType:"create",
          parentCategoryName: this.sendingQueryForm.selectedNodeName , 
          parentCategoryId: +this.sendingQueryForm.selectedNodeId,
          title:translate('menu.dialogs.ctg_creation'), //+++
          companyId:+this.sendingQueryForm.companyId,
          docName:"File"
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
          title:translate('menu.dialogs.ctg_edit'), //+++
          docName:"File"
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        this.loadTreesAndOpenNode(+this.sendingQueryForm.selectedNodeId);
        this.resetSelectedCategory();
      });        
    }

    clickBtnSelectFiles(){

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
          docName:"File"
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
        return this.http.post('/api/auth/searchFileCategory',body)
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
    }

//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getFileCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)

      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getFileCategoriesTrees(this.sendingQueryForm.companyId).subscribe(
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
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
//*****************************************************************************************************************************************/
//*******************************************************        F I L E S      ***********************************************************/
//*****************************************************************************************************************************************/

getImage(imageUrl: string): Observable<Blob> {
  return this.http.get(imageUrl, {responseType: 'blob'});
}

createImageFromBlob(image: Blob, index:number) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    this.files[index].image = reader.result;
  }, false);
  if (image) {
    reader.readAsDataURL(image);
  }
}

clickBtnFileUplioad(){
  const dialogRef = this.filesUploadDialog.open(FilesUploadDialogComponent, {
    width: '800px', 
    data:
    { 
      categoryId: +this.sendingQueryForm.selectedNodeId,
      categoryName: this.sendingQueryForm.selectedNodeName , 
      title:translate('menu.dialogs.files_upload'), //+++
      companyId:+this.sendingQueryForm.companyId,
    },
  });
  dialogRef.afterClosed().subscribe(result => {

    //после загрузки картинки устанавливается автосортировка по времени загрузки, чтобы новые файлы были вверху
    this.sendingQueryForm.sortColumn='date_time_created_sort'; // колонка сортировки
    this.sendingQueryForm.sortAsc='asc'; // установится asc, setSort перевернёт ее в desc
    this.setSort('date_time_created_sort')

    this.getPagesList();
    this.getTable();
  });   

}

  // clickBtnDeleteImage(id: number): void {
  //   const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
  //     width: '400px',
  //     data:
  //     { 
  //       head: 'Удаление изображения',
  //       query: 'Удалить изображение из карточки товара?',
  //       warning: 'Изображение не будет удалено безвозвратно, оно останется в Медиа-библиотеке.',
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     if(result==1){this.deleteImage(id);}
  //   });        
  // }

  // deleteImage(id:number){
  //   const body = {id: id, any_id:/*this.id*/1}; 
  //   return this.http.post('/api/auth/deleteProductImage',body)
  //   .subscribe(
  //       (data) => {   
  //                   this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
  //                   //this.refreshImages();
  //               },
  //       error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
  //   );  
  // }

  ConvertBytes(bytes, decimals = 1) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // sometimes in cookie "..._companyId" there value that not exists in list of companies. If it happens, company will be not selected and data not loaded until user select company manually
  companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}

  getIcon(ext:string){
    switch (ext.toLowerCase()) {
      case '.ai':
        return('ai');
      case '.csv':
        return( 'csv' );
      case '.doc':
        return( 'doc' );
      case '.dwg':
        return( 'dwg' );
      case '.exe':
        return( 'exe' );
      case '.jpg':
        return( 'jpg' );
      case '.jpeg':
          return( 'jpg' );  
      case '.json':
        return( 'json' );
      case '.mp3':
        return( 'mp3' );
      case '.pdf':
        return( 'pdf' );
      case '.docx':
        return( 'doc' );
      case '.png':
        return( 'png' );
      case '.ppt':
        return( 'ppt' );
      case '.psd':
        return( 'psd' );
      case '.rtf':
        return( 'rtf' );
      case '.svg':
        return( 'svg' );
      case '.txt':
        return( 'txt' );
      case '.xls':
        return( 'xls' );
      case '.xlsx':
        return( 'xls' );
      case '.zip':
        return( 'zip' );
      default:
        return( 'any' );
    }
  }

}
