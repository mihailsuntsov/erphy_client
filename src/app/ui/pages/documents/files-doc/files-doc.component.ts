import { Component, OnInit , Inject, Optional} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, FormGroup, FormControl, FormBuilder} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { HttpClient} from '@angular/common/http';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { Observable } from 'rxjs';

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  name: string;
  description: string;
  original_name: string;
  extention: string;
  file_size:string;
  mime_type: string;
  anonyme_access: boolean;
  company: string;
  company_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  changer:string;
  changer_id: string;
  date_time_changed: string;
  date_time_created: string;
  file_categories: string[];
  file_categories_id: string[];
  }
  interface FileCategoriesTreeNode {
    id: string;
    name: string;
    children?: FileCategoriesTreeNode[];
  }
  interface FileCategoriesFlatNode {
    expandable: boolean;
    name: string;
    level: number;
  }

@Component({
  selector: 'app-files-doc',
  templateUrl: './files-doc.component.html',
  styleUrls: ['./files-doc.component.css'],
  providers: [LoadSpravService]
})
export class FilesDocComponent implements OnInit {

  id: number;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;
  

//Формы
formBaseInformation:any;//форма для основной информации, содержащейся в документе
formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
selectedFileCategory:any;//форма, содержащая информацию о выбранной категории товара (id, name)

//переменные для управления динамическим отображением элементов
visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
visBtnUpdate = false;

//переменные прав
permissionsSet: any[];//сет прав на документ

allowToViewAllCompanies:boolean = false;
allowToViewMyCompany:boolean = false;
allowToUpdateAllCompanies:boolean = false;
allowToUpdateMyCompany:boolean = false;
allowToCreateMyCompany:boolean = false;
allowToCreateAllCompanies:boolean = false;
allowToView:boolean = false;
allowToUpdate:boolean = false;
allowToCreate:boolean = false;

checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов

searchFileGroupsCtrl = new FormControl();

fieldsForm: FormGroup;
dataFields: any;
receivedSetsOfFields: any [] = [] ;//массив для получения сетов полей
fieldIdEditNow:number=0;    //     id редактируемого кастомного поля в fieldsForm  
fieldIndexEditNow:number=0; //  index редактируемого кастомного поля в fieldsForm  
imageToShow:any; // переменная в которую будет подгружаться картинка файла (если он jpg или png)
filteredFileGroups: any;
isLoading = false;
canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
errorMsg: string;

// *****  переменные tree  ***** 
private _transformer = (node: FileCategoriesTreeNode, level: number) => {
  return {
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    id: node.id,
    level: level,
  };
}
treeControl = new FlatTreeControl<FileCategoriesFlatNode>(node => node.level, node => node.expandable);
treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
hasChild = (_: number, node: FileCategoriesFlatNode) => node.expandable;
numRootCategories: number=0;
numChildsOfSelectedCategory: number=0;
categoriesExpanded=false;//открыты или закрыты категории, в которых содержится товар или услуга
mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра карточки файла

// *****  переменные картинок  ***** 
selectedFiles: FileList;
currentFileUpload: File;
progress: { percentage: number } = { percentage: 0 };
mainImageAddress: string; // имя или адрес главной картинки



constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private MessageDialog: MatDialog,
  private fb: FormBuilder,
  public ConfirmDialog: MatDialog,
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  public ShowImageDialog: MatDialog) { 
    console.log(this.activateRoute);
    this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }


  ngOnInit() {
    this.fieldsForm = this.fb.group({
        fields: this.fb.array([])
     });

    this.formBaseInformation = new FormGroup({
      id: new FormControl                         (this.id,[]),
      original_name: new FormControl              ('',[Validators.required]),
      description: new FormControl                ('',[]),
      anonyme_access: new FormControl             ('',[]),
      // slideToggle: new FormControl             ('',[]),
      company_id: new FormControl                 ('',[Validators.required]),
      company: new FormControl                    ('',[]),
      selectedFileCategories:new FormControl      ([],[]),
      //для этих полей нет, но они нужны:
      name: new FormControl                       ('',[]),
      extention: new FormControl                  ('',[]),
      file_size: new FormControl                  ('',[]),
      mime_type: new FormControl                  ('',[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl                         ('',[]),
      master: new FormControl                     ('',[]),
      creator: new FormControl                    ('',[]),
      changer: new FormControl                    ('',[]),
      company: new FormControl                    ('',[]),
      date_time_created: new FormControl          ('',[]),
      date_time_changed: new FormControl          ('',[]),
    });
    this.selectedFileCategory = new FormGroup({
      selectedNodeId: new FormControl             ('',[]),
      SelectedNodeName: new FormControl           ('',[]),
    });
    this.checkedList = [];
    this.getSetOfPermissions();//->getMyCompanyId->getCRUD_rights->getData->__getCompaniesList->setDefaultCompany->refreshPermissions->loadTrees (новый док)
    //                                                                      |_getDocumentValuesById     ->         refreshPermissions->loadTrees (док существует) 
    
    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.docId; this.formBaseInformation.get('id').setValue(this.id);}
    } 

  }

//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=13')
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
  this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==150)});
  this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==151)});
  this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==152)});
  this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==153)});
  this.getData();
}

refreshPermissions():boolean{
  let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
  this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
  this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
  this.allowToCreate=((documentOfMyCompany && (this.allowToCreateAllCompanies || this.allowToCreateMyCompany))||(documentOfMyCompany==false && this.allowToCreateAllCompanies))?true:false;
  
  if(this.id>0){//если в документе есть id
    this.visAfterCreatingBlocks = true;
    this.visBeforeCreatingBlocks = false;
    this.visBtnUpdate = this.allowToUpdate;
  }else{
    this.visAfterCreatingBlocks = false;
    this.visBeforeCreatingBlocks = true;
  }
  this.loadTrees();
  console.log("formBaseInformation.get('company_id').value - "+this.formBaseInformation.get('company_id').value);
  console.log("myCompanyId - "+this.myCompanyId);
  console.log("documentOfMyCompany - "+documentOfMyCompany);
  console.log(" - ");
  console.log("allowToView - "+this.allowToView);
  console.log("allowToUpdate - "+this.allowToUpdate);
  console.log("allowToCreate - "+this.allowToCreate);
  return true;
}

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
    }
  }

  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => console.log(error));
  }

  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.refreshPermissions();
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
          this.http.post('/api/auth/getFileValues', docId)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                this.formAboutDocument.get('id').setValue(+documentValues.id);
                this.formAboutDocument.get('master').setValue(documentValues.master);
                this.formAboutDocument.get('creator').setValue(documentValues.creator);
                this.formAboutDocument.get('changer').setValue(documentValues.changer);
                this.formAboutDocument.get('company').setValue(documentValues.company);
                this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                this.formBaseInformation.get('company').setValue(documentValues.company);
                this.formBaseInformation.get('description').setValue(documentValues.description);
                this.formBaseInformation.get('original_name').setValue(documentValues.original_name);
                this.formBaseInformation.get('anonyme_access').setValue(documentValues.anonyme_access);
                this.formBaseInformation.get('name').setValue(documentValues.name);
                this.formBaseInformation.get('extention').setValue(documentValues.extention);
                this.formBaseInformation.get('file_size').setValue(documentValues.file_size);
                this.formBaseInformation.get('mime_type').setValue(documentValues.mime_type);

                this.checkedList=documentValues.file_categories_id;
                this.refreshPermissions();
                this.loadFileImage();

            },
            error => console.log(error)
        );
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }
  updateDocument(){ // сохраняется в 2 захода - 1й сам док и категории, 2й - настраиваемые поля (если есть)
    this.formBaseInformation.get('selectedFileCategories').setValue(this.checkedList);
    return this.http.post('/api/auth/updateFiles', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
                  this.getData();
                  this.openSnackBar("Файл сохранён", "Закрыть");

          },
          error => console.log(error),
      );
  }
  aboutSharedFiles(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: 'Файл для общего доступа',
        message: 'Если файл открыт для общего доступа, на него не распространяются права категорий, к которым он относится, и его можно скачать по внешней ссылке. Данная опция нужна для для картинок сайта, фото товаров интернет-магазина и др.'
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }
  getDomain(): string{
    return(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: ''));
  }
  copyFileAddress(){
    // let domain=this.getDomain();
    navigator.clipboard.writeText(this.getDomain()+'/api/public/getFile/'+this.formBaseInformation.get('name').value);
  }
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    //console.log("loadTrees");
    this.loadSpravService.getFileCategoriesTrees(this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)

      }, error => console.log(error)
      );
  }
  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getFileCategoriesTrees(this.formBaseInformation.get('company_id').value).subscribe(
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
    console.log("node Id:"+node.id);
    this.selectedFileCategory.selectedNodeId=node.id;
    this.selectedFileCategory.selectedNodeName=node.name;
    //this.recountNumChildsOfSelectedCategory();
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
  // взять node по индексу
    let currentNode:any = this.treeControl.dataNodes[index];
    //console.log("currentNode:"+currentNode.name);
    this.expandParents(currentNode);
    this.treeControl.expand(currentNode);
  } 
  recountNumRootCategories(){//считает количество корневых категорий
  this.numRootCategories=0;
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.treeControl.dataNodes[i].level==0){
        this.numRootCategories++;
      }
    }
    // console.log("this.numRootCategories: "+this.numRootCategories);
  }
  expandAllCheckedNodes(){
    for (let i = 0; i < this.checkedList.length; i++) {
      this.expandParents(this.getNodeById(this.checkedList[i]));
    }
  }
  collapseAllNodes(){
    this.treeControl.collapseAll();
  }
//*****************************************************************************************************************************************/
//******************************************              F I L E S             ***********************************************************/
//*****************************************************************************************************************************************/

loadFileImage(){
  if(this.formBaseInformation.get('extention').value.toUpperCase() == '.PNG' || 
     this.formBaseInformation.get('extention').value.toUpperCase() == '.JPG' || 
     this.formBaseInformation.get('extention').value.toUpperCase() == '.JPEG'){
      this.getImage('/api/auth/getFileImageThumb/'+this.formBaseInformation.get('name').value).subscribe(blob => {
        // console.log("WAY="+'/api/auth/getFileImageThumb/'+this.formBaseInformation.get('name').value);
        this.createImageFromBlob(blob);
      });
     }
}

getImage(imageUrl: string): Observable<Blob> {
  return this.http.get(imageUrl, {responseType: 'blob'});
}

createImageFromBlob(image: Blob) {
  let reader = new FileReader();
  reader.addEventListener("load", () => {
     this.imageToShow = reader.result;
  }, false);
  if (image) {
     reader.readAsDataURL(image);
  }
}

  // при нажатии на кнопку Скачать
  downloadFile(route: string, filename: string = null): void{
    const baseUrl = '/api/auth/getFile/';
    console.log("baseUrl + route - "+baseUrl + route);
    this.http.get(baseUrl + route,{ responseType: 'blob' as 'json'}).subscribe(
        (response: any) =>{
            let dataType = response.type;
            let binaryData = [];
            binaryData.push(response);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
            if (filename)
                downloadLink.setAttribute('download', filename);
            document.body.appendChild(downloadLink);
            downloadLink.click();
        }
    )
}




//*****************************************************************************************************************************************/
//******************************************          C H E C K B O X E S       ***********************************************************/
//*****************************************************************************************************************************************/

  isSelectedCheckbox(id: number){
    if(this.checkedList.includes(id))
      return true;
    else return false; 
  }
  clickTableCheckbox(id:number){
    if(this.checkedList.includes(id)){
      this.checkedList.splice(this.checkedList.indexOf(id),1);
    }else this.checkedList.push(id);
    console.log("checkedList - "+this.checkedList);
  } 

//*****************************************************************************************************************************************/
//***************************************************          I M A G E S      ***********************************************************/
//*****************************************************************************************************************************************/

  showImage(){
    const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
      data:
      { 
        link: this.formBaseInformation.get('name').value,
      },
    });
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
