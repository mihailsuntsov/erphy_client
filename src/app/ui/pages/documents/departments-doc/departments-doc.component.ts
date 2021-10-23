import { Component, OnInit } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';

interface docResponse {//интерфейс для получения ответа в методе getDepartmentValuesById
    id: number;
    company_id: string;
    company: string;
    name: string;
    address: string;
    master_id: string;
    creator_id: string;
    changer_id: string;
    price_id: string;
    owner: string;
    creator: string;
    changer: string;
    parent_id: string;
    parent: string;
    date_time_created: string;
    date_time_changed: string;
    additional: string;
}
interface idNameDescription{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-departments-doc',
  templateUrl: './departments-doc.component.html',
  styleUrls: ['./departments-doc.component.css'],
  providers: [LoadSpravService]
})
export class DepartmentsDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен

  visBtnUpdate = false;

  id: number;// id документа

  //Формы
  formBaseInformation:any;//форма основной информации и банк. реквизитов
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/именён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowToUpdateMy:boolean = false;
  allowToUpdateAll:boolean = false;
  allowToViewMy:boolean = false;
  allowToViewAll:boolean = false;
  isItMyDoc:boolean = false;
  canUpdateThisDoc:boolean = false;

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar
    ){
    console.log(this.activateRoute);
    this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }


  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      name: new FormControl      ('',[Validators.required]),
      company_id: new FormControl      ('',[Validators.required]),
      parent_id: new FormControl      ('',[]),
      price_id: new FormControl      ('',[]),
      address: new FormControl      ('',[]),
      additional: new FormControl      ('',[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl      ('',[]),
      owner: new FormControl      ('',[]),
      creator: new FormControl      ('',[]),
      changer: new FormControl      ('',[]),
      parent: new FormControl      ('',[]),
      company: new FormControl      ('',[]),
      date_time_created: new FormControl      ('',[]),
      date_time_changed: new FormControl      ('',[]),
    });
    this.getCompaniesList();
    this.getSetOfPermissions();
  }

  getData(){
    console.log("('company_id').value->"+this.formBaseInformation.get('company_id').value+"<-")
    if(+this.id==0 && this.formBaseInformation.get('company_id').value!='' && this.formBaseInformation.get('company_id').value!=0)
    {
       console.log("goingTo Get Depth List at creating doc");
      this.formBaseInformation.get('parent_id').setValue(0);
      this.getDepartmentsList();
    };
    if(+this.id>0){this.getDocumentValuesById();}

    this.refreshShowAllTabs();
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=4')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            // console.log("permissions:"+this.permissionsSet);
                            if(+this.id>0) this.isItMyDocument(+this.id); else this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
  }
  isItMyDocument(id:number){// В данном случае:  мое ли это отделение
    const body = {"documentId": id};//
          return this.http.post('/api/auth/isItMyDepartment', body) 
            .subscribe(
                (data) => {   
                            this.isItMyDoc=data as boolean;
                            // console.log("isItMyDoc-1:"+this.isItMyDoc);
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
      this.canUpdateThisDoc=true;
      if(!this.allowToUpdateAll){//если нет прав на Отделения: "Редактирование всех"
        if(!this.isItMyDoc)//значит остаются на "Редактирование своего", НО если это не мое отделение:
          this.canUpdateThisDoc=false;
      }
      if(!this.allowToUpdateMy){//если нет прав на Отделения: "Редактирование своего"
        if(this.isItMyDoc)//значит остаются на "Редактирование всех", НО если это мое отделение:
          this.canUpdateThisDoc=false;
      }
    }
    this.visAfterCreatingBlocks=!this.allowToCreate;
    this.getData();
  }
  isAllowToCreate   (e){return(e==11);}
  isAllowToDelete   (e){return(e==12);}
  isAllowToUpdateMy (e){return(e==15);}
  isAllowToUpdateAll(e){return(e==16);}
  isAllowToViewMy   (e){return(e==13);}
  isAllowToViewAll  (e){return(e==14);}

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    console.log("gettingDepthList");
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];console.log("receivedDepartmentsList-"+this.receivedDepartmentsList)},
                error => console.log(error)
            );
  }

  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }

  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }

  updateDocument(){
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateDepartment', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Отделение сохранено", "Закрыть");
                        },
                error => console.log(error),
            );
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  getDocumentValuesById(){
    console.log("we re in  GetDocumentValuesById");
    const docId = {"id": this.id};
        this.http.post('/api/auth/getDepartmentValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                this.formBaseInformation.get('name').setValue(documentResponse.name);
                this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                this.formBaseInformation.get('parent_id').setValue(+documentResponse.parent_id);
                this.formBaseInformation.get('price_id').setValue(+documentResponse.price_id);
                this.formBaseInformation.get('address').setValue(documentResponse.address);
                this.formBaseInformation.get('additional').setValue(documentResponse.additional);
                this.formAboutDocument.get('id').setValue(+documentResponse.id);
                this.formAboutDocument.get('owner').setValue(documentResponse.owner);
                this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                this.formAboutDocument.get('parent').setValue(documentResponse.parent);
                this.formAboutDocument.get('company').setValue(documentResponse.company);
                this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);

                this.getDepartmentsList();  // если отделения и типы цен грузить не здесь, а в месте где вызывалась getDocumentValuesById,
                this.getPriceTypesList();   // то из-за асинхронной передачи данных company_id будет еще null, 
                                            // и запрашиваемые списки не загрузятся
            },
            error => console.log(error)
        );
  }

  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertDepartment', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Отделение создано", "Закрыть");
                            },
                error => console.log(error),
            );
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
  refreshShowAllTabs(){
    console.log("Id of company = "+this.id);
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.canUpdateThisDoc;
      }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }
  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.formBaseInformation.get('company_id').value)
            .subscribe(
                (data) => {this.receivedPriceTypesList=data as any [];
                this.setDefaultPriceType();
                },
                error => console.log(error)
            );
  }

  setDefaultPriceType(){
    // console.log("this.receivedPriceTypesList.length="+this.receivedPriceTypesList.length);
    if(this.receivedPriceTypesList.length==1)
    {
      this.formBaseInformation.get('priceTypeId').setValue(+this.receivedPriceTypesList[0].id);
      // Cookie.set('prices_priceTypeId',this.sendingQueryForm.priceTypeId);
    }
  }

}
