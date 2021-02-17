import { Component, OnInit } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { LoadSpravService } from './loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';


interface dockResponse {//интерфейс для получения ответа в методе getUserValuesById
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
  interface dockListResponse {//интерфейс для получения ответа в методе getDocumentsWithPermissionList
    id: number;
    name: string;
    permissions:listPermissions [];
    }
  interface listPermissions {
    id: number;
    name: string;
  }

@Component({
  selector: 'app-usergroup-dock',
  templateUrl: './usergroup-dock.component.html',
  styleUrls: ['./usergroup-dock.component.css'],
  providers: [LoadSpravService,]
})
export class UsergroupDockComponent implements OnInit {

  createdDockId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDocumentsWithPermissions: dockListResponse []=[] ;//массив для получения JSON со списком документов и правами (listPermissions) у каждого документа
  receivedPermissions:listPermissions[]=[];
  nonSortedReceivedPermissions:listPermissions[];


  visBtnUpdate = false;

  id: number;// id документа

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/именён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)

  //Управление чекбоксами
  checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  selection = new SelectionModel<listPermissions>(true, []);//Class to be used to power selecting one or more options from a list - думаю, понятно
  dataSource = new MatTableDataSource<dockListResponse>(this.receivedDocumentsWithPermissions); //источник данных для прав
  dataOfPermissions = new MatTableDataSource<listPermissions>(this.receivedPermissions);
  
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowToUpdateMy:boolean = false;
  allowToUpdateAll:boolean = false;
  allowToViewMy:boolean = false;
  allowToViewAll:boolean = false;
  isItMyDock:boolean = false;
  canUpdateThisDock:boolean = false;


  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    //public dialogCreateDepartment: MatDialog,
    private _snackBar: MatSnackBar) 
    {
      console.log(this.activateRoute);
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
  }

  getData(){
    this.getCompaniesList();
    // console.log("('company_id').value->"+this.formBaseInformation.get('company_id').value+"<-")
    if(+this.id>0){
      this.getDocumentValuesById();
      //this.formBaseInformation.controls.password.disable();
    }
    this.refreshShowAllTabs();
  }

// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=6')
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          // console.log("permissions:"+this.permissionsSet);
                          if(+this.id>0) this.isItMyDocument(+this.id); else this.getCRUD_rights(this.permissionsSet);
                          //this.getCRUD_rights(this.permissionsSet);
                      },
              error => console.log(error),
          );
}
isItMyDocument(id:number){// В данном случае:  моего ли предприятия эта группа пользователей
  const body = {"documentId": id};//
        return this.http.post('/api/auth/isItMyUserGroup', body) 
          .subscribe(
              (data) => {   
                          this.isItMyDock=data as boolean;
                          // console.log("isItMyDock-1:"+this.isItMyDock);
                          this.getCRUD_rights(this.permissionsSet);
                      },
              error => console.log(error),
          );
}
getCRUD_rights(permissionsSet:any[]){
  this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
  //this.allowToDelete = permissionsSet.some(this.isAllowToDelete);
  this.allowToUpdateMy = permissionsSet.some(this.isAllowToUpdateMy);
  this.allowToUpdateAll = permissionsSet.some(this.isAllowToUpdateAll);
  if(this.allowToUpdateMy||this.allowToUpdateAll)
  {  
    this.canUpdateThisDock=true;
    if(!this.allowToUpdateAll){//если нет прав на Группы пользователей: "Редактирование всех"
      if(!this.isItMyDock)//значит остаются на "Редактирование своей", НО если это не моего предприятия группа пользователей:
      this.canUpdateThisDock=false;
    }
    if(!this.allowToUpdateMy){//если нет прав на Группы пользователей: "Редактирование своей"
      if(this.isItMyDock)//значит остаются на "Редактирование всех", НО если это моего предприятия группа пользователей:
      this.canUpdateThisDock=false;
    }
  }
  this.visAfterCreatingBlocks=!this.allowToCreate;
  // console.log("isItMyDock-2:"+this.isItMyDock);
  // console.log("allowToCreate:"+this.allowToCreate);
  // console.log("allowToDelete:"+this.allowToDelete);
  // console.log("allowToUpdateMy:"+this.allowToUpdateMy);
  // console.log("allowToUpdateAll:"+this.allowToUpdateAll);
  // console.log("canUpdateThisDock:"+this.canUpdateThisDock);
  this.getData();
}
isAllowToCreate   (e){return(e==31);}
isAllowToDelete   (e){return(e==32);}
isAllowToUpdateMy (e){return(e==33);}//своего предприятия
isAllowToUpdateAll(e){return(e==34);}//всех предприятий
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  refreshShowAllTabs(){
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.canUpdateThisDock;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  //this.getDepartmentsList();
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
  updateDocument(){
    this.updateDocumentResponse=null;
    this.formBaseInformation.get('selectedUserGroupPermissions').setValue(this.checkedList);
    return this.http.post('/api/auth/updateUserGroup', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Группа пользователей сохранена", "Закрыть");
                        },
                error => console.log(error),
            );
  }
  getDocumentValuesById(){
    const dockId = {"id": this.id};
        this.http.post('/api/auth/getUserGroupValuesById', dockId)
        .subscribe(
            data => {  let documentResponse: dockResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
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
            },
            error => console.log(error)
        );
  }
  getDocumentsWithPermissionList(){
    //console.log("we re in  getDocumentsWithPermissionList()");
    const dockId = {"searchString": ""};  
        this.http.post('/api/auth/getDocumentsWithPermissionList', dockId)//загружает список документов с их правами (чекбоксами). Далее 
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
            error => console.log(error)
        );
  }
  isSelectedPermission(){
    console.log("checking row with id=");
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
    this.createdDockId=null;
    this.http.post('/api/auth/insertUserGroup', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Группа пользователей создана", "Закрыть");
                            },
                error => console.log(error),
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



}
