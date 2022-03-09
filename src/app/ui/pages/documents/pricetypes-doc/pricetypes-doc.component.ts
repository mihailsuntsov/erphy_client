import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { MatDialog } from '@angular/material/dialog';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  company: string;
  company_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  pricerole: string;
  pricerole_id: string;
  changer:string;
  changer_id: string;
  date_time_changed: string;
  date_time_created: string;
  name: string;
  description: string;
  }

  interface isIt_Doc_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ предприятий мастер-аккаунта?)
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyMastersCompanies:boolean;
  }


@Component({
  selector: 'app-pricetypes-doc',
  templateUrl: './pricetypes-doc.component.html',
  styleUrls: ['./pricetypes-doc.component.css'],
  providers: [LoadSpravService,]

})
export class PricetypesDocComponent implements OnInit {

  id: number=0;// id документа
  myCompanyId:number=0;
  myId:number=0;
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  defaultId:number=0;//для подстановки дефолтных значений выпадающих списков
  receivedSpravSysPriceRole: any [];//Справочник роли цены (Основная, Скидочная)

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
  rightsDefined:boolean = false;//!!!

  constructor(private activateRoute: ActivatedRoute,
    private http: HttpClient,
    public MessageDialog: MatDialog,
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
      company: new FormControl      ('',[]),
      pricerole_id: new FormControl      ('',[Validators.required]),
      pricerole: new FormControl      ('',[]),
      name: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
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
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=9')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
    );
}

  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  IsItMy_DocCheckings(id:number){// проверки на документ (документ моего предприятия?)
    const body = {"documentId": id};//
            return this.http.post('/api/auth/getIsItMy_TypePrices_JSON', body) 
            .subscribe(
                (data) => {   let isItMy_Doc: isIt_Doc_Response=data as any;  
                  this.itIsDocumentOfMyCompany = isItMy_Doc.itIsDocumentOfMyCompany;
                  this.itIsDocumentOfMyMastersCompanies= isItMy_Doc.itIsDocumentOfMyMastersCompanies;
                            this.getCRUD_rights(this.permissionsSet);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
 
  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==93)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==93)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==95)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==96)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==97)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==98)});
   
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
      // console.log("getDocumentValuesById");
    }else {
      this.getCompaniesList();
      // console.log("getCompaniesList");
    }
    this.getSpravSysPriceRole();
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.refreshPermissions();
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
          this.http.post('/api/auth/getTypePricesValuesById', docId)
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
                  this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                  this.formBaseInformation.get('company').setValue(documentResponse.company);
                  this.formBaseInformation.get('pricerole_id').setValue(+documentResponse.pricerole_id);
                  this.formBaseInformation.get('pricerole').setValue(documentResponse.pricerole);
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
                  this.formBaseInformation.get('description').setValue(documentResponse.description);
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
        );
  }
  
  createNewDocument(){
    this.http.post('/api/auth/insertTypePrices', this.formBaseInformation.value)
      .subscribe(
        (data) =>   {
          let result=data as any;
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
            default:{           
                      this.id=result;
                      this._router.navigate(['/ui/pricetypesdoc', this.id]);
                      this.formBaseInformation.get('id').setValue(this.id);
                      this.rightsDefined=false; //!!!
                      this.getData();
                      this.openSnackBar("Документ успешно создан", "Закрыть");
                    }
          }
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
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
    return this.http.post('/api/auth/updateTypePrices', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
          let result=data as any;
          switch(result){
            case 1:{this.getData();this.openSnackBar("Успешно сохранено", "Закрыть");break;} 
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
          }
        },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
  }

  getSpravSysPriceRole(){
    this.receivedSpravSysPriceRole=null;
    this.loadSpravService.getSpravSysPriceRole()
            .subscribe(
                (data) => {this.receivedSpravSysPriceRole=data as any [];},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }


}
