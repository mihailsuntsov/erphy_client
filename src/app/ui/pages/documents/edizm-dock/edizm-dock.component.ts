import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';

interface dockResponse {//интерфейс для получения ответа в запросе значений полей документа
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

  interface isIt_Dock_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ предприятий мастер-аккаунта?)
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyMastersCompanies:boolean;
  }

@Component({
  selector: 'app-edizm-dock',
  templateUrl: './edizm-dock.component.html',
  styleUrls: ['./edizm-dock.component.css'],
  providers: [LoadSpravService,]
})
export class EdizmDockComponent implements OnInit {
  id: number;// id документа
  createdDockId: string[];//массив для получение id созданного документа
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
  canUpdateThisDock:boolean = false;

  type_short_name:string = '';

  constructor(private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
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
    
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    const body = {"documentId": 11};//11=Единицы измерения
          return this.http.post('/api/auth/giveMeMyPermissions', body) 
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            console.log("perm="+this.permissionsSet);
                            if(+this.id>0) this.IsItMy_DockCheckings(+this.id); else this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
  }
  IsItMy_DockCheckings(id:number){// проверки на документ (документ моего предприятия?) 
    const body = {"documentId": id};//
          return this.http.post('/api/auth/getIsItMy_SpravSysEdizm_JSON', body) 
            .subscribe(
                (data) => {   let isItMy_Dock: isIt_Dock_Response=data as any;  
                  this.itIsDocumentOfMyCompany = isItMy_Dock.itIsDocumentOfMyCompany;
                  this.itIsDocumentOfMyMastersCompanies= isItMy_Dock.itIsDocumentOfMyMastersCompanies;
                            this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
  }
  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
    this.allowToUpdateAllCompanies = permissionsSet.some(this.isAllowToUpdateAllCompanies);
    this.allowToUpdateMyCompany = permissionsSet.some(this.isAllowToUpdateMyCompany);
  console.log("perm="+this.permissionsSet);  

  if  (this.allowToUpdateAllCompanies ||                                     //если есть права изменять доки всех предприятий
      (this.itIsDocumentOfMyCompany && this.allowToUpdateMyCompany)||             //или это мое предприятие и есть права изменять доки своего предприятия
      ((this.allowToUpdateAllCompanies||this.allowToUpdateAllCompanies) && this.allowToCreate && +this.id==0))//или документ только создаётся и я могу всё что выше
      {this.canUpdateThisDock=true;}

    // this.visAfterCreatingBlocks=!this.allowToCreate;
    // console.log("visAfterCreatingBlocks="+this.visAfterCreatingBlocks);


    this.getData();
  }
  isAllowToCreate   (e){return(e==120);}             //создание
  isAllowToUpdateAllCompanies(e){return(e==124);}    //редактирование доков всех доступных предприятий
  isAllowToUpdateMyCompany(e){return(e==125);}       //редактирование доков моего предприятия

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
      console.log("getDocumentValuesById");
    }else {
      this.getCompaniesList();
      console.log("getCompaniesList");
    }
    this.refreshShowAllTabs();
  }

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
      //this.getDepartmentsList();
    }//else this.getDepartmentsList();
  }
  getDocumentValuesById(){
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getSpravSysEdizmValuesById', dockId)
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
                this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
                this.formBaseInformation.get('company').setValue(documentResponse.company);
                this.formBaseInformation.get('name').setValue(documentResponse.name);
                this.formBaseInformation.get('short_name').setValue(documentResponse.short_name);
                this.formBaseInformation.get('type_id').setValue(+documentResponse.type_id);
                this.formBaseInformation.get('equals_si').setValue(documentResponse.equals_si);

                this.changeTypeId();
            },
            error => console.log(error)
        );
  }
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  
  createNewDocument(){
    this.createdDockId=null;
    this.http.post('/api/auth/insertSpravSysEdizm', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
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
    return this.http.post('/api/auth/updateSpravSysEdizm', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Документ \"Типы цен\" сохранён", "Закрыть");
                        },
                error => console.log(error),
            );
  }


  changeTypeId(){
    
    switch (+this.formBaseInformation.get('type_id').value) {
      case 2:
        this.type_short_name='1 килограмму';
        break;
      case 3:
        this.type_short_name='1 метру';
        break;
      case 4:
        this.type_short_name='1 кв. метру';
        break;
      case 5:
        this.type_short_name='1 куб. метру';
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
        head: 'Множитель для приведения к единице СИ',
        message: 'Множитель сообщает системе, во сколько раз ваша единица больше общепринятых международных единиц. Например, для массы международной единицей является килограмм. Тогда для тонны множитель: 1000, для килограмма: 1, для грамма: 0.001'
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }

}
