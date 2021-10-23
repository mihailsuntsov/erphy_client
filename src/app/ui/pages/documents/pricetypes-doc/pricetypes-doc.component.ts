import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
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

  id: number;// id документа
  createdDocId: string[];//массив для получение id созданного документа
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
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyMastersCompanies:boolean = false;
  canUpdateThisDoc:boolean = false;

  constructor(private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar) { 
      console.log(this.activateRoute);
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
                            // console.log("permissions:"+this.permissionsSet);
                            if(+this.id>0) this.IsItMy_DocCheckings(+this.id); else this.getCRUD_rights(this.permissionsSet);
                            //this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
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
                error => console.log(error),
            );
  }
  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
    this.allowToUpdateAllCompanies = permissionsSet.some(this.isAllowToUpdateAllCompanies);
    this.allowToUpdateMyCompany = permissionsSet.some(this.isAllowToUpdateMyCompany);
    
  if  (this.allowToUpdateAllCompanies ||                                     //если есть права изменять доки всех предприятий
      (this.itIsDocumentOfMyCompany && this.allowToUpdateMyCompany)||             //или это мое предприятие и есть права изменять доки своего предприятия
      ((this.allowToUpdateAllCompanies||this.allowToUpdateAllCompanies) && this.allowToCreate && +this.id==0))//или документ только создаётся и я могу всё что выше
      {this.canUpdateThisDoc=true;}

    //this.visAfterCreatingBlocks=!this.allowToCreate;

    this.getData();
  }
  isAllowToCreate   (e){return(e==93);}
  isAllowToUpdateAllCompanies(e){return(e==97);}    //редактирование доков всех доступных предприятий
  isAllowToUpdateMyCompany(e){return(e==98);}       //редактирование доков моего предприятия

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
      console.log("getDocumentValuesById");
    }else {
      this.getCompaniesList();
      console.log("getCompaniesList");
    }
    this.getSpravSysPriceRole();
    this.refreshShowAllTabs();
  }

  refreshShowAllTabs(){
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.canUpdateThisDoc;
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
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }
  setDefaultCompany(){
    if(this.receivedCompaniesList.length==1)
    {
      this.receivedCompaniesList.forEach(data =>{this.defaultId=+data.id;});
      this.formBaseInformation.get('company_id').setValue(this.defaultId);
    }
  }
  getDocumentValuesById(){
    const docId = {"id": this.id};
          this.http.post('/api/auth/getTypePricesValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
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
            },
            error => console.log(error)
        );
  }
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  
  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertTypePrices', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Документ \"Типы цен\" успешно создан", "Закрыть");
                            },
                error => console.log(error),
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
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Документ \"Типы цен\" сохранён", "Закрыть");
                        },
                error => console.log(error),
            );
  }

  getSpravSysPriceRole(){
    this.receivedSpravSysPriceRole=null;
    this.loadSpravService.getSpravSysPriceRole()
            .subscribe(
                (data) => {this.receivedSpravSysPriceRole=data as any [];},
                error => console.log(error)
            );
  }


}
