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
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { translate } from '@ngneat/transloco'; //+++
import { Cookie } from 'ng2-cookies/ng2-cookies';


interface docResponse {//интерфейс для получения ответа в методе getUserValuesById
  id: number;
  name: string;
  // company: string;
  // company_id: string;
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
  // receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDocumentsWithPermissions: docListResponse []=[] ;//массив для получения JSON со списком документов и правами (listPermissions) у каждого документа
  receivedPermissions:listPermissions[]=[];
  nonSortedReceivedPermissions:listPermissions[];


  visBtnUpdate = false;

  id: number=0;// id документа
  // myCompanyId:number=0;
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
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToViewAllCompanies:boolean = false;
  itIsDocumentOfMyMastersCompanies:boolean = false;
  allowToUpdate:boolean = false;
  allowToView:boolean = false;
  rightsDefined:boolean = false;

blackListedPermissions = [ 3,   4,   6,   8,  25,  27,  14,  16,  95,  97, 
131, 122, 124, 129, 131, 133, 135, 137, 138, 139, 140, 141, 142, 146, 148, 150, 152, 154, 156, 158, 177, 179, 181, 163, 165, 167, 169, 171, 173, 175,
188, 190, 184, 186, 611, 200, 203, 207, 211, 627, 216, 219, 223, 227, 623, 232, 235, 253, 256, 260, 264, 396, 271, 273, 275, 277, 280,
283, 287, 291, 400, 309, 312, 316, 320, 296, 299, 302, 305, 325, 592, 594, 596, 598, 600, 602, 604, 606, 609, 329, 332, 336, 340, 631, 345, 348,
352, 356, 619, 361, 364, 368, 372, 615, 377, 380, 384, 388, 392, 405, 408, 412, 416, 420, 425, 428, 432, 436, 440, 445, 448, 452, 456, 460,
465, 467, 469, 471, 473, 476, 478, 480, 482, 484, 486, 487, 489, 491, 493, 495, 498, 500, 502, 504, 507, 509, 511, 513, 515, 518, 520, 522, 524, 526,
528, 529, 531, 533, 535, 537, 540, 542, 544, 546, 548, 550, 551, 553, 555, 557, 560, 563, 568, 571, 576, 579, 584, 587, 590, 
636, 638, 640, 642, 239, 242, 112, 645, 647, 649, 651, 654, 656, 658, 660, 663, 665, 667, 669, 672, 674, 676, 678, 684, 686,
688, 690, 683, 684, 686, 688, 690, 693, 695, 697, 699, 705, 708, 712, 716, 720, 725, 726, 733]

selectAllPermissions = [183,185,189,191,187,612,704,706,709,713,717,721,653,655,659,661,657,724,725,726,559,561, 18, 5,  7,
  539,541,545,547,543,549,126,130,134,136,132,138,140,142,475,477,481,483,479,485,644,646,650,652,648,
  279,281,288,292,284,401,324,601,603,605,595,597,599,326,593,607,610,517,519,523,525,521,527, 17, 11, 13, 15, 12,
  268,272,276,278,274,701,702,703,497,499,503,505,501,143,147,151,153,149,178,182,180,155,734,157,159,231,236,233,
  464,466,470,472,468,474,328,330,337,341,333,632,404,406,413,417,409,421,486,488,492,494,490,496,692,694,698,700,696,
  586,588,376,378,385,389,381,393,583,585,671,673,677,679,675,506,508,512,514,510,516,589,591,199,201,208,212,204,628,
   90, 93, 94, 96, 98,238,240,243,662,664,668,670,666,160,164,168,170,166,172,174,186,424,426,433,437,429,441,
  528,530,534,536,532,538,683,685,689,691,687,360,362,369,373,365,616, 28, 31, 29, 34, 32,252,254,261,265,257,397,
  680,681,682,444,446,453,457,449,461,635,637,641,643,639,117,120,123,125,121, 19, 22, 23, 24, 26,
  215,217,224,228,220,624,550,552,556,558,554,344,346,353,357,349,620,176];

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
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      name: new UntypedFormControl      ('',[Validators.required]),
      description: new UntypedFormControl      ('',[]),
      selectedUserGroupPermissions:new UntypedFormControl      ([],[]),
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl      ('',[]),
      master: new UntypedFormControl      ('',[]),
      creator: new UntypedFormControl      ('',[]),
      changer: new UntypedFormControl      ('',[]),
      date_time_created: new UntypedFormControl      ('',[]),
      date_time_changed: new UntypedFormControl      ('',[]),
    });
    this.checkedList = [];
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getSetOfPermissions();
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

  getMyId(){ //+++
    if(+this.myId==0)
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getCRUD_rights();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getCRUD_rights();
  }

getCRUD_rights(){
  this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==31)});
  this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==29)});
  this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==34)});
  this.getData();
}

getData(){
  if(+this.id>0){
    this.getDocumentValuesById();
  }else {
    this.refreshPermissions(); 
  }
}

refreshPermissions(){
  this.allowToView=(
    (this.allowToViewAllCompanies)
  )?true:false;
  this.allowToUpdate=(
    (this.allowToUpdateAllCompanies)
  )?true:false;
  this.allowToCreate=(this.allowToCreateAllCompanies)?true:false;
  // console.log("myCompanyId - "+this.myCompanyId);
  // console.log("documentOfMyCompany - "+documentOfMyCompany);
  // console.log("allowToView - "+this.allowToView);
  // console.log("allowToUpdate - "+this.allowToUpdate);
  // console.log("allowToCreate - "+this.allowToCreate);
  this.rightsDefined=true;//!!!
}

// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
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
                if(data!=null){
                  this.formAboutDocument.get('id').setValue(+documentResponse.id);
                  this.formAboutDocument.get('master').setValue(documentResponse.master);
                  this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                  this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                  this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
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
    // console.log("checkedList - "+this.checkedList);
  }
  
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  selectAllDocChBoxes(docId:number){
    this.receivedDocumentsWithPermissions.map(document=>{
      if(document.id==docId){
        document.permissions.map(row=>{
          if(!this.selection.isSelected(row) && this.selectAllPermissions.includes(row.id))  this.selection.toggle(row);
        })
      }
    });
    this.createCheckedList();
  }

  unselectAllDocChBoxes(docId:number){
    this.receivedDocumentsWithPermissions.map(document=>{
      if(document.id==docId){
        document.permissions.map(row=>{
          if(this.selection.isSelected(row))  this.selection.toggle(row);
        })
      }
    });
    this.createCheckedList();
  }

  selectAllChBoxes(){
    this.receivedDocumentsWithPermissions.map(document=>{
        document.permissions.map(row=>{
          if(!this.selection.isSelected(row) && this.selectAllPermissions.includes(row.id))  this.selection.toggle(row);
        })
    });
    this.createCheckedList();
  }
  unselectAllChBoxes(){
    this.receivedDocumentsWithPermissions.map(document=>{
        document.permissions.map(row=>{
          if(this.selection.isSelected(row)) this.selection.toggle(row);
        })
    });
    this.createCheckedList();
  }
}
