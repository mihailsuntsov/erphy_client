import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import { Router } from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  name: string;
  short_name: string;
  type_id: string;
  equals_si: string;
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
  }

  interface isIt_Doc_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ предприятий мастер-аккаунта?)
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyMastersCompanies:boolean;
  }

@Component({
  selector: 'app-edizm-doc',
  templateUrl: './edizm-doc.component.html',
  styleUrls: ['./edizm-doc.component.css'],
  providers: [LoadSpravService,]
})
export class EdizmDocComponent implements OnInit {
  id: number=0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  defaultId:number=0;//для подстановки дефолтных значений выпадающих списков
  receivedSpravSysPriceRole: any [];//Справочник роли цены (Основная, Скидочная)

  myCompanyId:number=0;
  myId:number=0;

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;

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

  type_short_name:string = '';
  
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private _router:Router,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar) { 
     
      if(activateRoute.snapshot.params['id']){
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
      }
    }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      company: new FormControl      ('',[]),
      name: new FormControl      ('',[Validators.required]),
      short_name: new FormControl      ('',[Validators.required]),
      type_id: new FormControl      ('',[Validators.required]),
      equals_si: new FormControl      ('1',[Validators.required]),

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
   // this.checkedList = [];
   
    this.getSetOfPermissions();
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');     
    
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=11')
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
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==120)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==120)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==122)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==123)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==124)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==125)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    this.getData();
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
    // return true;
    this.rightsDefined=true;//!!!
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
    this.http.post('/api/auth/getSpravSysEdizmValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                //Заполнение формы из интерфейса documentResponse:
                if(data!=null&&documentResponse.company_id!=null){
                  this.formAboutDocument.get('id').setValue(+documentResponse.id);
                  this.formAboutDocument.get('master').setValue(documentResponse.master);
                  this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                  this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                  this.formAboutDocument.get('company').setValue(documentResponse.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                  this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                  this.formBaseInformation.get('company').setValue(documentResponse.company);
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
                  this.formBaseInformation.get('short_name').setValue(documentResponse.short_name);
                  this.formBaseInformation.get('type_id').setValue(+documentResponse.type_id);
                  this.formBaseInformation.get('equals_si').setValue(documentResponse.equals_si);
                  this.changeTypeId();                  
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  
  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertSpravSysEdizm', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this._router.navigate(['/ui/edizmdoc', this.id]);
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
                            },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
    return this.http.post('/api/auth/updateSpravSysEdizm', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }


  changeTypeId(){    
    switch (+this.formBaseInformation.get('type_id').value) {
      case 2:
        this.type_short_name=translate('docs.msg.one_kg');
        break;
      case 3:
        this.type_short_name=translate('docs.msg.one_meter');
        break;
      case 4:
        this.type_short_name=translate('docs.msg.one_sqmeter');
        break;
      case 5:
        this.type_short_name=translate('docs.msg.one_qmeter');
        break;
      default:
        {this.type_short_name='';
        this.formBaseInformation.get('equals_si').setValue('1');
      }
    }
  }

  aboutMultiplify(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.multplr'),
        message: translate('docs.msg.abt_multplr')
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}
