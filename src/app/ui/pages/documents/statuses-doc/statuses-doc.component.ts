import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface docResponse {//интерфейс для получения ответа в методе getStatusDocsTableById
  id: number;
  company: string;
  company_id: number;
  document: string;
  document_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  changer:string;
  changer_id: number;
  date_time_changed: string;
  date_time_created: string;
  name: string;
  description: string;
  color: string;
  doc_id: number;
  doc: string;
  status_type: number;//тип статуса 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
}
interface statusesList {//интерфейс массива для получения всех статусов текущего документа
  id: string;
  name: string;
  output_order: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}

@Component({
  selector: 'app-statuses-doc',
  templateUrl: './statuses-doc.component.html',
  styleUrls: ['./statuses-doc.component.css'],
  providers: [LoadSpravService,]
})
export class StatusesDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDocumentsList: idAndName [] = [];//массив для получения списка отделений
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

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
  rightsDefined:boolean; // определены ли права !!!


  statusColor: string;
  statusesList : statusesList [] = []; //массив для получения всех статусов текущего документа

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    private _snackBar: MatSnackBar) { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      // statusesIdsInOrderOfList:new FormControl      ([],[]),//массив для формирования необходимого порядка вывода статусов
      name: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
      color: new FormControl      ('#d0d0d0',[Validators.required]),
      doc_id: new FormControl      (0,[Validators.required]),
      doc:new FormControl      ('',[]),
      status_type: new FormControl      (1,[Validators.required]),//тип статуса 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
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

    this.getSetOfPermissions();//
    // ->getMyId()
    // ->getMyCompanyId()
    // ->getCRUD_rights()
    // ->getDocumentsList()
    // ->getData()------>(если созданный док)---> this.getDocumentValuesById(); --> refreshPermissions()     
    // ->(если новый док):
    // ->getCompaniesList() 
    // ->setDefaultCompany()
    // ->setDefaultDocument()
    // ->refreshPermissions() 
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=22')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => console.log(error),
    );
}

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==271)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==272)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==275)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==276)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==277)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==278)});
    this.getDocumentsList();
  }

  refreshPermissions():boolean{//!!!
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
    // return true;
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
  refreshShowAllTabs(){
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.allowToUpdate;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }

  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => console.log(error)
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);},
       error => console.log(error));
  }

  getCompaniesList(){
    console.log("getCompaniesList");
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.doFilterCompaniesList();
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }
  setDefaultCompany(){
    if(this.receivedDocumentsList.length>1)
    {
      this.formBaseInformation.get('company_id').setValue(Cookie.get('satusdoc_companyId')=="0"?this.myCompanyId:+Cookie.get('satusdoc_companyId'));
    } else {
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    }
    this.setDefaultDocument();
  }

  getDocumentsList(){
    this.receivedDocumentsList=this.loadSpravService.getDocumentsList();
    this.getData();
  }

  setDefaultDocument(){
    console.log('Document length = '+this.receivedDocumentsList.length);
    if(this.receivedDocumentsList.length>1)
    {
      this.formBaseInformation.get('doc_id').setValue(Cookie.get('satusdoc_documentId')=="0"?this.receivedDocumentsList[0].id:+Cookie.get('satusdoc_documentId'))
    //} else {
      //this.formBaseInformation.get('doc_id').setValue(+this.receivedDocumentsList[0].id);
      //Cookie.set('satusdoc_documentId',this.formBaseInformation.get('doc_id').value);
    }
    this.refreshPermissions();
  }
  
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
          this.http.post('/api/auth/getSpravStatusDocsValuesById', docId)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                //!!!
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                  this.formBaseInformation.get('doc_id').setValue(+documentValues.doc_id);
                  this.formBaseInformation.get('doc').setValue(documentValues.doc);
                  this.formBaseInformation.get('color').setValue(documentValues.color);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formBaseInformation.get('status_type').setValue(+documentValues.status_type);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.getStatusesList();
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();         

            },
            error => console.log(error)
        );
  }

  createNewDocument(){
    this.http.post('/api/auth/insertSpravStatusDocs', this.formBaseInformation.value)
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
        default:{
          this.id=result;
          this.afterCreateDoc();
          this.openSnackBar("Статус документа успешно создан", "Закрыть");
          break;
        } 
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
  }

  updateDocument(){ 
    const body= {
      "id":                       this.formBaseInformation.get('id').value,
      "doc_id":                  this.formBaseInformation.get('doc_id').value,
      "company_id":               this.formBaseInformation.get('company_id').value,
      "name":                     this.formBaseInformation.get('name').value,
      "description":              this.formBaseInformation.get('description').value,
      "color":                    this.formBaseInformation.get('color').value,
      "status_type":              this.formBaseInformation.get('status_type').value,
      "statusesIdsInOrderOfList": this.getStatusesIdsInOrderOfList()
    }
      return this.http.post('/api/auth/updateSpravStatusDocs', body)
        
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case 1:{this.getData();this.openSnackBar("Успешно сохранено", "Закрыть");break;} 
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getStatusesList(){//возвращает список всех статусов документа, который нужен для изменения порядка вывода статусов
    const body = {  searchString: '', 
      sortColumn:'output_order', 
      offset:'0', 
      sortAsc:'asc', 
      result:'1000',
      filterOptionsIds:[],
      companyId: this.formBaseInformation.get('company_id').value,
      documentId: this.formBaseInformation.get('doc_id').value};
      return this.http.post('/api/auth/getStatusDocsTable', body)
            .subscribe(
                (data) => {
                  this.statusesList = data as any [];
                  this.refreshPermissions(); 
                },
                error => console.log(error) 
            );
  }

  getStatusesIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.statusesList.forEach(x => {
      i.push(+x.id);
    })
    return i;
  }

  dropCagent(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.statusesList, event.previousIndex, event.currentIndex);
  }

  
  // Действия после создания нового документа Счёт покупателю (это самый последний этап).
  afterCreateDoc(){// с true запрос придет при отбиваемом в данный момент чеке
    // Сначала обживаем текущий документ:
    this.rightsDefined=false; //!!!
    this._router.navigate(['/ui/statusesdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/statusesdoc',0]);
    this.id=0;
    this.formBaseInformation.get('id').setValue(null);
    this.formBaseInformation.get('name').setValue('');
    this.formBaseInformation.get('color').setValue('#d0d0d0');
    this.formBaseInformation.get('status_type').setValue(1);
    this.statusesList=[];
    this.getData();
}


}
