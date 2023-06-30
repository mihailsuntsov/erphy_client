import { Component, OnInit , Inject, Optional, Output, EventEmitter} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl, UntypedFormBuilder} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { HttpClient} from '@angular/common/http';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { Observable } from 'rxjs';
import { translate } from '@ngneat/transloco'; //+++

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  name: string;
  description: string;
  original_name: string;
  extention: string;
  alt: string;
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
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;
  myId:number=0;
  

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
rightsDefined:boolean = false;//!!!

checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов

searchFileGroupsCtrl = new UntypedFormControl();

fieldsForm: UntypedFormGroup;
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

@Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private MessageDialog: MatDialog,
  private fb: UntypedFormBuilder,
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

    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl                         (this.id,[]),
      original_name: new UntypedFormControl              ('',[Validators.required]),
      description: new UntypedFormControl                ('',[Validators.maxLength(1000)]),
      anonyme_access: new UntypedFormControl             (false,[]),
      // slideToggle: new FormControl             ('',[]),
      company_id: new UntypedFormControl                 ('',[Validators.required]),
      company: new UntypedFormControl                    ('',[]),
      selectedFileCategories:new UntypedFormControl      ([],[]),
      //для этих полей нет, но они нужны:
      name: new UntypedFormControl                       ('',[Validators.maxLength(500)]),
      extention: new UntypedFormControl                  ('',[]),
      alt: new UntypedFormControl                        ('',[Validators.maxLength(120)]),
      file_size: new UntypedFormControl                  ('',[]),
      mime_type: new UntypedFormControl                  ('',[]),
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl                         ('',[]),
      master: new UntypedFormControl                     ('',[]),
      creator: new UntypedFormControl                    ('',[]),
      changer: new UntypedFormControl                    ('',[]),
      company: new UntypedFormControl                    ('',[]),
      date_time_created: new UntypedFormControl          ('',[]),
      date_time_changed: new UntypedFormControl          ('',[]),
    });
    this.selectedFileCategory = new UntypedFormGroup({
      selectedNodeId: new UntypedFormControl             ('',[]),
      SelectedNodeName: new UntypedFormControl           ('',[]),
    });
    this.checkedList = [];
    this.getSetOfPermissions();
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');   
    
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
                    this.getMyId();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
                );
  }
  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList()
        .subscribe(
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              this.doFilterCompaniesList();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
    else this.doFilterCompaniesList();
  }
  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)
      this.setDefaultCompany();
  }
  getMyId(){ //+++
    if(+this.myId==0)
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();
  }
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getCRUD_rights();
  }
  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==146)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==147)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==150)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==151)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==152)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==153)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    this.allowToCreate=((documentOfMyCompany && (this.allowToCreateAllCompanies || this.allowToCreateMyCompany))||(documentOfMyCompany==false && this.allowToCreateAllCompanies))?true:false;

    this.loadTrees();
    // console.log("formBaseInformation.get('company_id').value - "+this.formBaseInformation.get('company_id').value);
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log(" - ");
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!
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
        if(data!=null&&documentValues.company_id!=null){
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
          this.formBaseInformation.get('alt').setValue(documentValues.alt);
          this.formBaseInformation.get('file_size').setValue(documentValues.file_size);
          this.formBaseInformation.get('mime_type').setValue(documentValues.mime_type);
          this.checkedList=documentValues.file_categories_id;
          this.loadFileImage();
          
        } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
        this.refreshPermissions();
    },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
);
}

  get is_picture(){
    if(
      this.formBaseInformation.get('extention').value.toUpperCase() == '.PNG' || 
      this.formBaseInformation.get('extention').value.toUpperCase() == '.JPG' || 
      this.formBaseInformation.get('extention').value.toUpperCase() == '.JPEG')
        return true; else return false;
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }

  updateDocument(){
    this.formBaseInformation.get('selectedFileCategories').setValue(this.checkedList);
    return this.http.post('/api/auth/updateFiles', this.formBaseInformation.value)
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case 1:{this.getData(); this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));break;} 
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  aboutSharedFiles(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.shared_file'),
        message: translate('docs.msg.shared_file_')
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }
  getDomain(): string{
    return(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: ''));
  }
  copyFileAddress(){
    navigator.clipboard.writeText(this.getDomain()+'/api/public/getFile/'+this.formBaseInformation.get('name').value);
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
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
  if(this.is_picture){
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
      case '.rar':
        return( 'rar' );
      default:
        return( 'any' );
    }
  }
}
