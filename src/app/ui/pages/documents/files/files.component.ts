import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit , Inject, Optional} from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-files-table.service';
import { UniversalCategoriesDialogComponent } from 'src/app/ui/dialogs/universal-categories-dialog/universal-categories-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { HttpClient} from '@angular/common/http';
import { FilesUploadDialogComponent } from 'src/app/ui/dialogs/files-upload-dialog/files-upload-dialog.component';
import { Observable } from 'rxjs';

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
  providers: [QueryFormService,LoadSpravService,Cookie
  ]
})
export class FilesComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;//
  TREE_DATA: TreeNode[]=[];
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, select - оконный режим выбора файлов
  
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
    private http: HttpClient,
    public deleteDialog: MatDialog,
    private Cookie: Cookie,
    public dialogRef1: MatDialogRef<FilesComponent>,
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
      this.sendingQueryForm.sortAsc="asc";
      this.sendingQueryForm.sortColumn="p.name";
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result="10";
      
      this.sendingQueryForm.selectedNodeId="0";
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.trash=false;
      
        this.getCompaniesList();// -> getSetOfPermissions() -> getMyCompanyId() -> setDefaultCompany() -> getCRUD_rights() -> getData() 
      //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId

      //сохраненные в куках параметры
      try{
      this.viewMode=(Cookie.get('files_viewMode').length>0?Cookie.get('files_viewMode'):this.viewMode);
      this.sendingQueryForm.result=Cookie.get('files_result').length>0?Cookie.get('files_result'):'10';
      this.sendingQueryForm.sortColumn=Cookie.get('files_sortColumn').length>0?Cookie.get('files_sortColumn'):'p.name';
      this.sendingQueryForm.sortAsc=Cookie.get('files_sortAsc').length>0?Cookie.get('files_sortAsc'):'asc';
      this.sendingQueryForm.trash=Cookie.get('files_trash')=="true"?true:false;
      } catch (e){
        console.log(e);
      }
      // this.getImageFromService("/api/auth/getFile/c5033a08-5b7-2020-01-14-17-14-05-739.png");
    }
    
 // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    const body = {"documentId": 13};//13= "Файлы"
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
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==146)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==147)});
    this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==148)});
    this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==149)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==150)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==151)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==152)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==153)});
    this.allowCategoryCreateAllCompanies = permissionsSet.some(   function(e){return(e==154)});
    this.allowCategoryCreateMyCompany = permissionsSet.some(      function(e){return(e==155)});
    this.allowCategoryUpdateAllCompanies = permissionsSet.some(   function(e){return(e==156)});
    this.allowCategoryUpdateMyCompany = permissionsSet.some(      function(e){return(e==157)});
    this.allowCategoryDeleteAllCompanies = permissionsSet.some(   function(e){return(e==158)});
    this.allowCategoryDeleteMyCompany = permissionsSet.some(      function(e){return(e==159)});
    this.allowToRecoverFilesAllCompanies = permissionsSet.some(   function(e){return(e==177)});
    this.allowToRecoverFilesMyCompany = permissionsSet.some(      function(e){return(e==178)});
    this.allowToDeleteFromTrashAllCompanies = permissionsSet.some(function(e){return(e==179)});
    this.allowToDeleteFromTrashMyCompany = permissionsSet.some(   function(e){return(e==180)});
    this.allowToClearTrashAllCompanies = permissionsSet.some(     function(e){return(e==181)});
    this.allowToClearTrashMyCompany = permissionsSet.some(       function(e){return(e==182)});
    
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
    
    console.log("documentOfMyCompany - "+documentOfMyCompany);
    console.log("allowToRecoverFilesMyCompany - "+this.allowToRecoverFilesMyCompany);
    console.log("allowToRecoverFilesAllCompanies - "+this.allowToRecoverFilesAllCompanies);
    console.log(" - ");
    console.log("allowToView - "+this.allowToView);
    console.log("allowToUpdate - "+this.allowToUpdate);
    console.log("allowToCreate - "+this.allowToCreate);
    console.log("allowToDelete - "+this.allowToDelete);
    console.log("allowToRecoverFiles - "+this.allowToRecoverFiles);
    console.log("allowToDeleteFromTrash - "+this.allowToDeleteFromTrash);
    console.log("allowToClearTrash - "+this.allowToClearTrash);
    console.log("allowCategoryCreate - "+this.allowCategoryCreate);
    console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    console.log("allowCategoryUpdate - "+this.allowCategoryUpdate);
    console.log("allowCategoryDelete - "+this.allowCategoryDelete);
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
        this.getPagesList(this.sendingQueryForm);
        this.getTable(this.sendingQueryForm);
        this.doFilterCompaniesList();
        this.loadTrees();
    }
  }

  getPagesList(sendingQueryForm: QueryForm){
    this.donePagesList = false;
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(sendingQueryForm)
            .subscribe(
                data => {this.receivedPagesList=data as string []; this.donePagesList=true;
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => console.log(error)
            ); 
  }

    clickShowTrashBtn(){
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
      this.sendingQueryForm.trash=!this.sendingQueryForm.trash;
      this.sendingQueryForm.showOnlyAnonymeAccessFiles=false;
      this.sendingQueryForm.offset=0;
      Cookie.set('files_trash',this.sendingQueryForm.trash?"true":"false");
      
      this.getPagesList(this.sendingQueryForm);
      this.getTable(this.sendingQueryForm);
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
      
      this.getPagesList(this.sendingQueryForm);
      this.getTable(this.sendingQueryForm);
      //if(this.allowToCreate && !this.sendingQueryForm.trash) this.visBtnAdd = true; else  this.visBtnAdd = false;

    }

    getTable(sendingQueryForm: QueryForm){
      //console.log("перед вызовом 1");
      this.queryFormService.getTable(sendingQueryForm)
        .subscribe(
            (data) => {
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
            error => console.log(error) 
        );
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
          head: 'Удаление категории файлов',
          query: 'Удалить категорию "'+this.sendingQueryForm.selectedNodeName+'"?',
          warning: 'Файлы, привязакнные к данной категории не удалятся, но их привязка к ней будет утрачена.',
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
                      this.openSnackBar("Успешно удалено", "Закрыть");
                      if (parentId>0) {this.loadTreesAndOpenNode(parentId)} else {this.loadTrees()};
                      this.resetSelectedCategory();
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
        return this.http.post('/api/auth/deleteFiles', body) 
              .subscribe(
                  (data) => {   
                              this.openSnackBar("Файлы успешно удалены в корзину", "Закрыть");
                              this.getData();
                          },
                  error => console.log(error),
              );
      }
      
    clickBtnRecover() {
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
        return this.http.post('/api/auth/recoverFilesFromTrash', body) 
            .subscribe(
                (data) => {   
                  this.openSnackBar("Файлы успешно восстановлены", "Закрыть");
                  this.getData();
                          },
                  error => console.log(error),
            );        
    }

    clickBtnDeleteFromTrash(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Удаление',
          query: 'Удалить выбранные файлы из корзины"?',
          warning: 'Внимание: файлы, привязанные к документам (например, картинки товаров в документе "Товары и услуги") также удалятся из содержащих их документов.',
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
                              this.openSnackBar("Файлы успешно удалены", "Закрыть");
                              this.getData();
                          },
                  error => console.log(error),
              );  
    }

    clickBtnClearTrash(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Очистка корзины',
          query: 'Удалить все файлы из корзины?',
          warning: 'Внимание: файлы, привязанные к документам (например, картинки товаров в документе "Товары и услуги") также удалятся из содержащих их документов.',
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
                              this.openSnackBar("Корзина успешно очищена", "Закрыть");
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

    getMyCompanyId(){
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          //console.log("myCompanyId="+this.myCompanyId);
          this.setDefaultCompany();
        }, error => console.log(error));
    }

    setDefaultCompany(){
      if(this.data)
      {
        this.sendingQueryForm.companyId=this.data.companyId;
        this.getCRUD_rights(this.permissionsSet);
      } 
      else 
      {
        this.sendingQueryForm.companyId=this.myCompanyId;
        this.getCRUD_rights(this.permissionsSet);
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
          title:"Создание категории",
          companyId:+this.sendingQueryForm.companyId,
          dockName:"File"
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
          title:"Редактирование категории",
          dockName:"File"
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
          title:"Изменение порядка вывода",
          companyId: +this.sendingQueryForm.companyId,
          dockName:"File"
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
    this.getPagesList(this.sendingQueryForm);
    this.sendingQueryForm.offset=0;
    this.getTable(this.sendingQueryForm);
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
      title:"Загрузка файлов",
      companyId:+this.sendingQueryForm.companyId,
    },
  });
  dialogRef.afterClosed().subscribe(result => {

    //после загрузки картинки устанавливается автосортировка по времени загрузки, чтобы новые файлы были вверху
    this.sendingQueryForm.sortColumn='date_time_created_sort'; // колонка сортировки
    this.sendingQueryForm.sortAsc='asc'; // установится asc, setSort перевернёт ее в desc
    this.setSort('date_time_created_sort')

    this.getPagesList(this.sendingQueryForm);
    this.getTable(this.sendingQueryForm);
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

  deleteImage(id:number){
    const body = {id: id, any_id:/*this.id*/1}; 
    return this.http.post('/api/auth/deleteProductImage',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    //this.refreshImages();
                },
        error => console.log(error),
    );  
  }

  ConvertBytes(bytes, decimals = 1) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

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
