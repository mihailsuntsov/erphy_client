import { Component, EventEmitter, OnInit, Output } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Router } from '@angular/router';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { translate } from '@ngneat/transloco'; //+++


interface docResponse {//интерфейс для получения ответа в методе getUserValuesById
  id: number;
  name: string;
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
  userGroupPermissionsId: string[];
  description: string;
  }
  interface docListResponse {//интерфейс для получения ответа в методе getDocumentsWithPermissionList
    id: number;
    name: string;
    permissions:listPermissions [];
    }
  interface listPermissions {
    id: number;
    name: string;
  }

@Component({
  selector: 'app-usergroup-doc',
  templateUrl: './usergroup-doc.component.html',
  styleUrls: ['./usergroup-doc.component.css'],
  providers: [LoadSpravService,]
})
export class UsergroupDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDocumentsWithPermissions: docListResponse []=[] ;//массив для получения JSON со списком документов и правами (listPermissions) у каждого документа
  receivedPermissions:listPermissions[]=[];
  nonSortedReceivedPermissions:listPermissions[];


  visBtnUpdate = false;

  id: number=0;// id документа
  myCompanyId:number=0;
  myId:number=0;

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/именён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)

  //Управление чекбоксами
  checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  selection = new SelectionModel<listPermissions>(true, []);//Class to be used to power selecting one or more options from a list - думаю, понятно
  dataSource = new MatTableDataSource<docListResponse>(this.receivedDocumentsWithPermissions); //источник данных для прав
  dataOfPermissions = new MatTableDataSource<listPermissions>(this.receivedPermissions);
  
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyMastersCompanies:boolean = false;
  allowToUpdate:boolean = false;
  allowToView:boolean = false;
  rightsDefined:boolean = false;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    //public dialogCreateDepartment: MatDialog,
    private _snackBar: MatSnackBar) 
    {
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0 
    }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      name: new FormControl      ('',[Validators.required]),
      company_id: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
      selectedUserGroupPermissions:new FormControl      ([],[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl      ('',[]),
      master: new FormControl      ('',[]),
      creator: new FormControl      ('',[]),
      changer: new FormControl      ('',[]),
      company: new FormControl      ('',[]),
      date_time_created: new FormControl      ('',[]),
      date_time_changed: new FormControl      ('',[]),
    });
    this.checkedList = [];
    this.getSetOfPermissions();
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
  }

// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=6')
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
  this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==31)});
  this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==31)});
  this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==29)});
  this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==30)});
  this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==34)});
  this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==33)});
 
  if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
  if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
  if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
  this.getData();
}

getData(){
  if(+this.id>0){
    this.getDocumentValuesById();
  }else {
    this.getCompaniesList(); 
  }
}

refreshPermissions(){
  let documentOfMyCompany:boolean = (+this.formBaseInformation.get('company_id').value==this.myCompanyId);
  this.allowToView=(
    (this.allowToViewAllCompanies)||
    (this.allowToViewMyCompany&&documentOfMyCompany)
  )?true:false;
  this.allowToUpdate=(
    (this.allowToUpdateAllCompanies)||
    (this.allowToUpdateMyCompany&&documentOfMyCompany)
  )?true:false;
  this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
  // console.log("myCompanyId - "+this.myCompanyId);
  // console.log("documentOfMyCompany - "+documentOfMyCompany);
  // console.log("allowToView - "+this.allowToView);
  // console.log("allowToUpdate - "+this.allowToUpdate);
  // console.log("allowToCreate - "+this.allowToCreate);
  this.rightsDefined=true;//!!!
}

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    this.setDefaultCompany();
  }

  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.refreshPermissions();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }
  
  onCompanyChange(){
    this.refreshPermissions();
  }

  updateDocument(){
    this.updateDocumentResponse=null;
    this.formBaseInformation.get('selectedUserGroupPermissions').setValue(this.checkedList);
    return this.http.post('/api/auth/updateUserGroup', this.formBaseInformation.value)
        .subscribe(
          (data) => {   
                      this.updateDocumentResponse=data as string;
                      this.getData();
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                    },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
  }
  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.http.post('/api/auth/getUserGroupValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                if(data!=null&&documentResponse.company_id!=null){
                  this.formAboutDocument.get('id').setValue(+documentResponse.id);
                  this.formAboutDocument.get('master').setValue(documentResponse.master);
                  this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                  this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                  this.formAboutDocument.get('company').setValue(documentResponse.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
                  this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                  this.formBaseInformation.get('description').setValue(documentResponse.description);
                  this.checkedList=documentResponse.userGroupPermissionsId;
                  this.getDocumentsWithPermissionList();                  
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  getDocumentsWithPermissionList(){
    //console.log("we re in  getDocumentsWithPermissionList()");
    const docId = {"searchString": ""};  
    this.http.post('/api/auth/getDocumentsWithPermissionList', docId)//загружает список документов с их правами (чекбоксами). Далее 
        .subscribe(                                                           //чекбоксы зажигаются из полученных в методе getDocumentValuesById данных (checkedList)
            data1stLvl => 
            {
              this.receivedDocumentsWithPermissions=data1stLvl as any;// <- Данные 1го уровня - документы. В каждом документе есть поле 
              this.dataSource.data = this.receivedDocumentsWithPermissions; // "permissions" c данными 2го уровня
              this.dataSource.data.forEach(data2ndLvl => 
                {
                  this.nonSortedReceivedPermissions=data2ndLvl.permissions as any; // <- Данные 2го уровня - права (permissions).
                  this.receivedPermissions = this.nonSortedReceivedPermissions.sort();
                  this.dataOfPermissions.data=this.receivedPermissions;
                  this.dataOfPermissions.data.forEach(row => 
                    {
                      if(this.checkedList.includes(row.id)) this.selection.select(row);
                    });
                });
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
  }
  isSelectedPermission(){
    // console.log("checking row with id=");
    //return true;
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
 
  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
  }
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertUserGroup', this.formBaseInformation.value)
    .subscribe(
      (data) =>   {
        let result=data as any;
        switch(result){
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
          default:{  
                      this.id=result;
                      this._router.navigate(['/ui/usergroupdoc', this.id]);
                      this.formBaseInformation.get('id').setValue(this.id);
                      this.rightsDefined=false; //!!!
                      this.getData();
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
          }
        }
      },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
  );
}

  createCheckedList(){//массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при загрузке страницы и при нажатии на чекбокс, а при 
    this.checkedList = [];//                                                       отправке данных внедряется в поле формы selectedUserGroupPermissions
    for (var i = 0; i < this.receivedDocumentsWithPermissions.length; i++) 
    {
      //console.log("length - "+this.receivedDocumentsWithPermissions[i].permissions.length);
      for (var z = 0; z < this.receivedDocumentsWithPermissions[i].permissions.length; z++)
      {
      if(this.selection.isSelected(this.receivedDocumentsWithPermissions[i].permissions[z]))
      this.checkedList.push(this.receivedDocumentsWithPermissions[i].permissions[z].id);
      }
    }
    //this.checkedList = JSON.stringify(this.checkedList);
    console.log("checkedList - "+this.checkedList);
  }
  
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }



}
