import { ChangeDetectorRef, Component, Inject, OnInit, Optional, ViewChild} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsPostingDialogComponent } from 'src/app/modules/settings/settings-posting-dialog/settings-posting-dialog.component';
import { PostingProductsTableComponent } from 'src/app/modules/trade-modules/posting-products-table/posting-products-table.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { graphviz }  from 'd3-graphviz';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {dateInput: 'DD.MM.YYYY',},
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
interface PostingProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма postingProductTable, входящая в formBaseInformation)
  id: number;                     // id строки с товаром товара в таблице return_product
  row_id: number;                 // id строки 
  product_id: number;             // id товара 
  name: string;                   // наименование товара
  edizm: string;                  // наименование единицы измерения
  product_price: number;          // цена товара
  product_count: number;          // кол-во товара
  department_id: number;          // склад
  remains: number;                // остаток на складе
  product_sumprice: number;       // сумма как product_count * product_price (высчитываем сумму и пихем ее в БД, чтобы потом на бэкэнде в SQL запросах ее не высчитывать)
}

interface DocResponse {//интерфейс для получения ответа в методе getPostingValuesById
  id: number;
  company: string;
  company_id: string;
  department: string;
  department_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  is_completed: boolean;
  changer:string;
  changer_id: string;
  doc_number: string;
  posting_date: string;
  date_time_changed: string;
  date_time_created: string;
  description : string;
  is_archive: boolean;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  uid:string;
}
interface FilesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}
interface IdAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface IdNameDescription{
  id: number;
  name: string;
  description: string;
}
interface IdAndNameAndShortname{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  short_name: string;
}
interface StatusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
interface LinkedDocs {//интерфейс для загрузки связанных документов
  id:number;
  doc_number:number;
  date_time_created:string;
  description:string;
  is_completed:boolean;
}
interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}

@Component({
  selector: 'app-posting-doc',
  templateUrl: './posting-doc.component.html',
  styleUrls: ['./posting-doc.component.css'],
  providers: [LoadSpravService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class PostingDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: number;//получение id созданного документа
  receivedCompaniesList: IdAndName [];//массив для получения списка предприятий
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedStatusesList: StatusInterface [] = []; // массив для получения статусов
  receivedMyDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  myCompanyId:number=0;
  myId:number=0;
  // allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  filesInfo : FilesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  creatorId:number=0;
  startProcess: boolean=true; // идеут стартовые запросы. после того как все запросы пройдут - будет false.
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)
  spravSysEdizmOfProductAll: IdAndNameAndShortname[] = [];// массив, куда будут грузиться все единицы измерения товара
  receivedPriceTypesList: IdNameDescription [] = [];//массив для получения списка типов цен
  displayedColumns:string[];//отображаемые колонки таблицы с товарами
  canEditCompAndDepth=true;
  // panelPostingOpenState=false;
  // panelPostingOpenState=false;
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра

  //для загрузки связанных документов
  linkedDocsReturn:LinkedDocs[]=[];
  panelReturnOpenState=false;

  // для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу файла inventory-doc.component.ts)
  loadingDocsScheme:boolean = false; // идет загрузка данных для схемы
  linkedDocsSchemeDisplayed:boolean = false; //схема была отображена
  showGraphDiv:boolean=true;

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: FormGroup; //массив форм для накопления информации о Возврате поставщику
  settingsForm: any; // форма с настройками
  formReturnsup:any// Форма для отправки при создании Возврата поставщику

  //переменные для управления динамическим отображением элементов
  // visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToViewMyDocs:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMyDocs:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToCompleteAllCompanies:boolean = false;
  allowToCompleteMyCompany:boolean = false;
  allowToCompleteMyDepartments:boolean = false; 
  allowToCompleteMyDocs:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToComplete:boolean = false;
  showOpenDocIcon:boolean=false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ создаётся, или есть право на редактирование и документ создан

  rightsDefined:boolean; // определены ли права !!!
  lastCheckedDocNumber:string=''; //!!!

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  @ViewChild("doc_number", {static: false}) doc_number; //для редактирования номера документа
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild(PostingProductsTableComponent, {static: false}) public postingProductsTableComponent:PostingProductsTableComponent;

  constructor(private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: FormBuilder, //чтобы билдить группу форм postingProductTable
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    public SettingsPostingDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private _router:Router) 
    { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];
    }

  ngOnInit(): void {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      department_id: new FormControl      ('',[Validators.required]),
      doc_number: new FormControl      ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      posting_date: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
      department: new FormControl      ('',[]),
      status_id: new FormControl          ('',[]),
      status_name: new FormControl        ('',[]),
      status_color: new FormControl       ('',[]),
      status_description: new FormControl ('',[]),
      is_completed: new FormControl       (false,[]),
      postingProductTable: new FormArray([]),
      uid: new FormControl                (uuidv4(),[]),
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl                       ('',[]),
      master: new FormControl                   ('',[]),
      creator: new FormControl                  ('',[]),
      changer: new FormControl                  ('',[]),
      company: new FormControl                  ('',[]),
      date_time_created: new FormControl        ('',[]),
      date_time_changed: new FormControl        ('',[]),
    });

    // Форма настроек
    this.settingsForm = new FormGroup({
      // предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
      // id отделения
      departmentId: new FormControl             (null,[]),
      // тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
      pricingType: new FormControl              ('avgCostPrice',[]), // по умолчанию ставим "Средняя закупочная цена"
      // тип цены
      priceTypeId: new FormControl              (null,[]),
      // наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new FormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]), // по умолчанию "плюс 10%"
      // Наценка (plus) или скидка (minus)
      plusMinus: new FormControl                ('plus',[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new FormControl          ('procents',[]),
      // убрать десятые (копейки)
      hideTenths: new FormControl               (true,[]),
      // статус после проведения инвентаризации
      statusOnFinishId: new FormControl         ('',[]),
      // автодобавление товара из формы поиска в таблицу
      autoAdd:  new FormControl                 (false,[]),
    });

    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.id; this.formBaseInformation.get('id').setValue(this.id);}
    } 
   
    //     getSetOfPermissions
    //     |
    //     getMyId
    //     |
    //     getMyCompanyId
    //     |
    //     getMyDepartmentsList
    //     |
    //     getCRUD_rights
    //     |
    //     getData(------>(если созданный док)--> [getDocumentValuesById] --> refreshPermissions 
    //     |
    //     (если новый док):
    //     [getCompaniesList ]
    //     |
    //     [getSettings, doFilterCompaniesList]
    //     |
    //     setDefaultInfoOnStart
    //     |
    //     setDefaultCompany 
    //     |
    //     [getDepartmentsList, getPriceTypesList*] 
    //     |
    //     [setDefaultDepartment, doFilterDepartmentsList]
    //     | (если идет стартовая загрузка):
    //     getStatusesList,       checkAnyCases
    //     |        		          |
    //     setDefaultStatus       refreshPermissions*  
    //     |
    //     setStatusColor, getSpravSysEdizm
    // *необходимое действие для загрузки дочерних компонентов 

    this.getSetOfPermissions();
  }
  //чтобы не было ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }
  //чтобы "на лету" чекать валидность таблицы с товарами
  get childFormValid() {
    // проверяем, чтобы не было ExpressionChangedAfterItHasBeenCheckedError. Т.к. форма создается пустая и с .valid=true, а потом уже при заполнении проверяется еще раз.
    if(this.postingProductsTableComponent!=undefined) 
      return this.postingProductsTableComponent.getControlTablefield().valid;
    else return true;    
  }

  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=16') //Оприходование = 16 в document_id
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
  }

  refreshPermissions(){
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    let documentOfMyDepartments:boolean = (this.inMyDepthsId(+this.formBaseInformation.get('department_id').value));
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)||
      (this.allowToViewMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)||
      (this.allowToViewMyDocs&&documentOfMyCompany&&documentOfMyDepartments&&(this.myId==this.creatorId))
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)||
      (this.allowToUpdateMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)||
      (this.allowToUpdateMyDocs&&documentOfMyCompany&&documentOfMyDepartments&&(this.myId==this.creatorId))
    )?true:false;
    this.allowToComplete=(
      (this.allowToCompleteAllCompanies)||
      (this.allowToCompleteMyCompany&&documentOfMyCompany)||
      (this.allowToCompleteMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)||
      (this.allowToCompleteMyDocs&&documentOfMyCompany&&documentOfMyDepartments&&(this.myId==this.creatorId))
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    this.rightsDefined=true;//!!!
    this.necessaryActionsBeforeGetChilds();
  }

//-------------------------------------------------------------------------------
  //нужно загруить всю необходимую информацию, прежде чем вызывать детей (Поиск и добавление товара, Кассовый модуль), иначе их ngOnInit выполнится быстрее, чем загрузится вся информация в родителе
  //вызовы из:
  //getPriceTypesList()*
  //refreshPermissions()
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    //Если набрано необходимое кол-во действий для отображения модуля Формы поиска и добавления товара
    if(this.actionsBeforeGetChilds==2){
      this.canGetChilds=true;
      this.startProcess=false;// все стартовые запросы прошли
    }
  }
  
  getMyId(){
    this.receivedMyDepartmentsList=null;
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
        this.getMyDepartmentsList();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }
  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.getCRUD_rights(this.permissionsSet);},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==200)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==201)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==202)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==207)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==208)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==209)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==210)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==211)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==212)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==213)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==214)});
    this.allowToCompleteAllCompanies = permissionsSet.some(       function(e){return(e==627)});
    this.allowToCompleteMyCompany = permissionsSet.some(          function(e){return(e==628)});
    this.allowToCompleteMyDepartments = permissionsSet.some(      function(e){return(e==629)});
    this.allowToCompleteMyDocs = permissionsSet.some(             function(e){return(e==630)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;this.allowToCreateMyDepartments=true}
    if(this.allowToCreateMyCompany)this.allowToCreateMyDepartments=true;
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyCompany){this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyDepartments)this.allowToViewMyDocs=true;
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;this.allowToUpdateMyDepartments=true;this.allowToUpdateMyDocs=true;}
    if(this.allowToUpdateMyCompany){this.allowToUpdateMyDepartments=true;this.allowToUpdateMyDocs=true;}
    if(this.allowToUpdateMyDepartments)this.allowToUpdateMyDocs=true;
    if(this.allowToCompleteAllCompanies){this.allowToCompleteMyCompany=true;this.allowToCompleteMyDepartments=true;this.allowToCompleteMyDocs=true;}
    if(this.allowToCompleteMyCompany){this.allowToCompleteMyDepartments=true;this.allowToCompleteMyDocs=true;}
    if(this.allowToCompleteMyDepartments)this.allowToCompleteMyDocs=true;
    this.getData();
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
      this.setDefaultDate();
    }
  }

  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
      .subscribe(
          (data) => 
          {
            this.receivedCompaniesList=data as any [];
            this.doFilterCompaniesList();
          },                      
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }

  onCompanyChange(){
    this.formBaseInformation.get('department_id').setValue(null);
    this.formBaseInformation.get('status_id').setValue(null);
    this.actionsBeforeGetChilds=0;
    this.getDepartmentsList();
    this.getPriceTypesList();
  }

  onDepartmentChange(){
      this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
      .subscribe(
          (data) => {this.receivedDepartmentsList=data as any [];
            this.doFilterDepartmentsList();
            if(+this.id==0) this.setDefaultDepartment();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }
  setDefaultDepartment(){
    //если в настройках не было отделения, и в списке предприятий только одно предприятие - ставим его по дефолту
    if(+this.formBaseInformation.get('department_id').value==0 && this.receivedDepartmentsList.length==1){
      this.formBaseInformation.get('department_id').setValue(this.receivedDepartmentsList[0].id);
      //Если дочерние компоненты уже загружены - устанавливаем предприятие по дефолту как склад в форме поиска и добавления товара !!!!!!!!
      // if(!this.startProcess){
      //   this.postingProductsTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);  
      //   this.postingProductsTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
      // }
    }
    //если отделение было выбрано (через настройки или же в этом методе) - определяем его наименование (оно будет отправляться в дочерние компоненты)
    if(+this.formBaseInformation.get('department_id').value>0)
      this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));

    //если идет стартовая прогрузка - продолжаем цепочку запросов. Если это была, например, просто смена предприятия - продолжать далее текущего метода смысла нет
    if(this.startProcess) {
      this.getStatusesList();
      this.checkAnyCases();
    }
  }
   // проверки на различные случаи
  checkAnyCases(){
    //проверка на то, что отделение все еще числится в отделениях предприятия (не было удалено и т.д.)
    if(!this.inDepthsId(+this.formBaseInformation.get('department_id').value)){
      this.formBaseInformation.get('department_id').setValue(null);
    }
    //проверка на то, что отделение подходит под ограничения прав (если можно создавать только по своим отделениям, но выбрано отделение, не являющееся своим - устанавливаем null в выбранное id отделения)
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      if(!this.inMyDepthsId(+this.formBaseInformation.get('department_id').value)){
        this.formBaseInformation.get('department_id').setValue(null);
      }
    }
    if(this.startProcess) this.refreshPermissions();
  }
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,16) //16 - id документа Оприходование в таблице documents
            .subscribe(
                (data) => {this.receivedStatusesList=data as StatusInterface[];
                  if(+this.id==0){this.setDefaultStatus();}},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  setDefaultStatus(){
    if(this.receivedStatusesList.length>0)
    {
      this.receivedStatusesList.forEach(a=>{
          if(a.is_default){
            this.formBaseInformation.get('status_id').setValue(a.id);
          }
      });
    }
    this.setStatusColor();
    this.getSpravSysEdizm(); //загрузка единиц измерения. Загружаем тут, т.к. нужно чтобы сначала определилось предприятие, его id нужен для загрузки
  }

  getSpravSysEdizm():void {    
    let companyId=+this.formBaseInformation.get('company_id').value;
    this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5)"})  // все типы ед. измерения
    .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
            },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  doFilterCompaniesList(){
    let myCompany:IdAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)//!!!!! отсюда загружаем настройки только если документ новый. Если уже создан - настройки грузятся из get<Document>ValuesById
      this.getSettings();
  }
  doFilterDepartmentsList(){
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
    // this.secondaryDepartments=this.receivedDepartmentsList;
  }
  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    let inMyDepthsId:boolean = false;
    this.receivedMyDepartmentsList.forEach(myDepth =>{
      myDepth.id==id?inMyDepthsId=true:null;
    });
  return inMyDepthsId;
  }
  inDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений предприятия
    let inDepthsId:boolean = false;
    
    this.receivedDepartmentsList.forEach(depth =>{
      console.log("depth.id - "+depth.id+", id - "+id)
      depth.id==id?inDepthsId=true:null;
      console.log("inDepthsId - "+inDepthsId);
    });
    console.log("returning inDepthsId - "+inDepthsId);
  return inDepthsId;
  }

  //загрузка настроек
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsPosting')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
            //данная группа настроек не зависит от предприятия
            this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'avgCostPrice');
            this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
            this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:0);
            this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
            this.settingsForm.get('hideTenths').setValue(result.hideTenths);
            this.settingsForm.get('autoAdd').setValue(result.autoAdd);
            //если предприятия из настроек больше нет в списке предприятий (например, для пользователя урезали права, и выбранное предприятие более недоступно)
            //необходимо не загружать эти настройки 
            if(this.isCompanyInList(+result.companyId)){
              //данная группа настроек зависит от предприятия
              this.settingsForm.get('companyId').setValue(result.companyId);
              this.settingsForm.get('departmentId').setValue(result.departmentId);
              this.settingsForm.get('statusOnFinishId').setValue(result.statusOnFinishId);
              this.settingsForm.get('priceTypeId').setValue(result.priceTypeId);
            }
            this.setDefaultInfoOnStart();
            this.setDefaultCompany();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }

  setDefaultCompany(){
    if(+this.formBaseInformation.get('company_id').value==0)//если в настройках не было предприятия - ставим своё по дефолту
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.getDepartmentsList(); 
    this.getPriceTypesList();
  }
  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList) // иначе если док создан (id>0), т.е. списка предприятий нет, и => ERROR TypeError: Cannot read property 'map' of null
      this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }

  //если новый документ
  setDefaultInfoOnStart(){
    if(+this.id==0){//документ новый
      this.formBaseInformation.get('company_id').setValue(this.settingsForm.get('companyId').value)
      this.formBaseInformation.get('department_id').setValue(this.settingsForm.get('departmentId').value);
    }
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getPostingValuesById?id='+ this.id)
        .subscribe(
            data => { 
                let documentValues: DocResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                  this.formBaseInformation.get('department_id').setValue(documentValues.department_id);
                  this.formBaseInformation.get('department').setValue(documentValues.department);
                  this.formBaseInformation.get('posting_date').setValue(documentValues.posting_date?moment(documentValues.posting_date,'DD.MM.YYYY'):"");
                  this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                  this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                  this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                  this.formBaseInformation.get('is_completed').setValue(documentValues.is_completed);
                  this.formBaseInformation.get('uid').setValue(documentValues.uid);
                  this.creatorId=+documentValues.creator_id;
                  this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                  this.getPriceTypesList();
                  this.loadFilesInfo();
                  this.getDepartmentsList();//отделения
                  this.getStatusesList();//статусы документа Оприходование
                  this.getLinkedDocsScheme(true); //загрузка связанных документов
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();

                },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
        );
  }

  formingProductRowFromApiResponse(row: PostingProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      product_id:         new FormControl (row.product_id,[]),
      posting_id:      new FormControl (this.id,[]),
      product_count:      new FormControl ((+row.product_count),[]),
      product_price:      new FormControl ((+row.product_price).toFixed(2),[]),
      product_sumprice:   new FormControl ((+row.product_count*(+row.product_price)).toFixed(2),[]),
    });
  }
  
  EditDocNumber(): void {
    if(this.allowToUpdate && +this.id==0){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Редактирование номера документа',
          warning: 'Открыть поле "Номера документа" на редактирование?',
          query: 'Номер документа присваивается системой автоматически. Если Вы хотите его редактировать, и вместе с тем оставить возможность системе генерировать код в следующих документах, пожалуйста, не исползуйте более 9 цифр в номере.',
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.doc_number_isReadOnly = false ;
          setTimeout(() => { this.doc_number.nativeElement.focus(); }, 500);}
      });  
    } 
  }

// !!!
checkDocNumberUnical(tableName:string) {
  let docNumTmp=this.formBaseInformation.get('doc_number').value;
  setTimeout(() => {
    if(!this.formBaseInformation.get('doc_number').errors && this.lastCheckedDocNumber!=docNumTmp && docNumTmp!='' && docNumTmp==this.formBaseInformation.get('doc_number').value)
      {
        let Unic: boolean;
        this.isDocNumberUnicalChecking=true;
        this.lastCheckedDocNumber=docNumTmp;
        return this.http.get('/api/auth/isDocumentNumberUnical?company_id='+this.formBaseInformation.get('company_id').value+'&doc_number='+this.formBaseInformation.get('doc_number').value+'&doc_id='+this.id+'&table='+tableName)
        .subscribe(
            (data) => {   
                        Unic = data as boolean;
                        if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Введённый номер документа не является уникальным.',}});
                        this.isDocNumberUnicalChecking=false;
                    },
            error => {console.log(error);this.isDocNumberUnicalChecking=false;}
        );
      }
   }, 1000);
}

  //создание нового документа Оприходование
  createNewDocument(){
    console.log('Создание нового документа Оприходование');
    this.createdDocId=null;
    this.getProductsTable();
    this.http.post('/api/auth/insertPosting', this.formBaseInformation.value)
      .subscribe(
      (data) => {
                  this.actionsBeforeGetChilds=0;
                  this.createdDocId=data as number;
                  switch(this.createdDocId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа Оприходование"}});
                      break;
                    }
                    case 0:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа Оприходование"}});
                      break;
                    }
                    default:{// Оприходование успешно создалась в БД 
                      this.openSnackBar("Документ \"Оприходование\" успешно создан", "Закрыть");
                      this.afterCreatePosting();
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
      );
  }

  //действия после создания нового документа Инвентаризиция
  afterCreatePosting(){
      this.id=+this.createdDocId;
      this._router.navigate(['/ui/postingdoc', this.id]);
      this.formBaseInformation.get('id').setValue(this.id);
      this.rightsDefined=false; //!!!
      this.getData();
  }

  completeDocument(notShowDialog?:boolean){
    if(!notShowDialog){//notShowDialog=false - показывать диалог
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
          head: 'Проведение оприходования',
          warning: 'Вы хотите провести данное оприходование?',
          query: 'После проведения документ станет недоступным для редактирования.'},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.updateDocument(true);
        }
      });
    } else this.updateDocument(true);
  }

  decompleteDocument(notShowDialog?:boolean){
    if(this.allowToComplete){
      if(!notShowDialog){//notShowDialog=false - показывать диалог
        const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',data:{
            head: 'Отмена проведения',
            warning: 'Вы хотите отменить проведение данного документа?',
            query: ''},});
        dialogRef.afterClosed().subscribe(result => {
          if(result==1){
            this.setDocumentAsDecompleted();
          }
        });
      } else this.setDocumentAsDecompleted();
    }
  }
  setDocumentAsDecompleted(){
    this.getProductsTable();    
    this.http.post('/api/auth/setPostingAsDecompleted',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось завершить операцию из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка снятия с проведения документа \"Оприходование\""}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для данной операции"}});
                break;
              }
              case -60:{//Документ уже снят с проведения
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Данный документ уже снят с проведения"}});
                break;
              }
              case -70:{//Отрицательное кол-во товара в истории движения товара
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"В результате пересчёта себестоимости одного из товаров приёмки, на одном из этапов его движения получено отрицательное количество данного товара"}});
                break;
              }
              case -80:{//Отрицательное кол-во товара на складе
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"В результате проводимой операции получено отрицательное количество на скаде одного из товаров документа"}});
                break;
              }
              case 1:{// Успешно
                this.openSnackBar("Документ \"Оприходование\" снят с проведения", "Закрыть");
                this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                this.formBaseInformation.get('is_completed').setValue(false);
                // this.balanceCagentComponent.getBalance();//пересчитаем баланс поставщика, ведь мы приняли ему товар, и теперь он должен больше 
                // this.balanceCagentComponent.getBalance();//пересчитаем баланс поставщика
                if(this.postingProductsTableComponent){
                  this.postingProductsTableComponent.showColumns(); //чтобы показать столбцы после отмены проведения 
                  this.postingProductsTableComponent.getProductsTable();
                }
              }
            }
          },
          error => {
            this.showQueryErrorMessage(error);
          },
      );
  }
  updateDocument(complete?:boolean){ 
    this.getProductsTable();    
    let currentStatus:number=this.formBaseInformation.get('status_id').value;
    if(complete){
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с проведением - временно устанавливаем true, временно - чтобы это ушло в запросе на сервер, но не повлияло на внешний вид документа, если вернется не true
      if(this.settingsForm.get('statusOnFinishId').value){//если в настройках есть "Статус при проведении" - временно выставляем его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusOnFinishId').value);}
    }
    this.http.post('/api/auth/updatePosting',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            if(complete){
              this.formBaseInformation.get('is_completed').setValue(false);//если сохранение с проведением - удаляем временную установку признака проведённости, 
              this.formBaseInformation.get('status_id').setValue(currentStatus);//и возвращаем предыдущий статус
            }
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось создать документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка "+ (complete?"проведения":"сохренения") + " документа \"Оприходование\""}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа \"Оприходование\""}});
                break;
              }
              case -50:{//Документ уже проведён
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Данный документ уже проведён"}});
                break;
              }
              default:{// Успешно
                this.openSnackBar("Документ \"Оприходование\" "+ (complete?"проведён.":"сохренён."), "Закрыть");
                this.getLinkedDocsScheme(true);//обновляем схему связанных документов
                if(complete) {
                  this.getLinkedDocsScheme(true);//обновим схему связанных документов )чтобы Проведено сменилось с Нет на Да
                  this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с проведением - окончательно устанавливаем признак проведённости = true
                  if(this.postingProductsTableComponent){
                    this.postingProductsTableComponent.showColumns(); //чтобы спрятать столбцы после проведения 
                    this.postingProductsTableComponent.getProductsTable();
                    // this.postingProductsTableComponent.tableRecount();
                  }
                  if(this.settingsForm.get('statusOnFinishId').value){//если в настройках есть "Статус при проведении" - выставим его
                    this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusOnFinishId').value);}
                  this.setStatusColor();//чтобы обновился цвет статуса
                }
              }
            }
          },
          error => {
            this.showQueryErrorMessage(error);
            },
      );
  } 
  clearFormSearchAndProductTable(){
    this.postingProductsTableComponent.resetFormSearch();
    this.postingProductsTableComponent.getControlTablefield().clear();
    this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
  }
  //забирает таблицу товаров из дочернего компонента и помещает ее в основную форму
  getProductsTable(){
    const control = <FormArray>this.formBaseInformation.get('postingProductTable');
    control.clear();
    this.postingProductsTableComponent.getProductTable().forEach(row=>{
      control.push(this.formingProductRowFromApiResponse(row));
    });
  }
  showQueryErrorMessage(error:any){
    console.log(error);
      let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      this.MessageDialog.open(MessageDialog,
      {
        width:'400px',
        data:{
          head:'Ошибка!',
          message:errMsg}
      })
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  //открывает диалог настроек
  openDialogSettings() { 
    const dialogSettings = this.SettingsPostingDialogComponent.open(SettingsPostingDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        priceTypesList:   this.receivedPriceTypesList, //список типов цен
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        receivedDepartmentsList: this.receivedDepartmentsList, //список отделений
        company_id: this.formBaseInformation.get('company_id').value, // текущее предприятие (нужно для поиска поставщика)
        allowToCreateAllCompanies: this.allowToCreateAllCompanies,
        allowToCreateMyCompany: this.allowToCreateMyCompany,
        allowToCreateMyDepartments: this.allowToCreateMyDepartments,
        id: this.id, //чтобы понять, новый док или уже созданный
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        //если нажата кнопка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
        if(result.get('companyId')) this.settingsForm.get('companyId').setValue(result.get('companyId').value);
        if(result.get('departmentId')) this.settingsForm.get('departmentId').setValue(result.get('departmentId').value);
        if(result.get('pricingType')) this.settingsForm.get('pricingType').setValue(result.get('pricingType').value);
        if(result.get('priceTypeId')) this.settingsForm.get('priceTypeId').setValue(result.get('priceTypeId').value);
        if(result.get('plusMinus')) this.settingsForm.get('plusMinus').setValue(result.get('plusMinus').value);
        if(result.get('changePrice')) this.settingsForm.get('changePrice').setValue(result.get('changePrice').value);
        if(result.get('changePriceType')) this.settingsForm.get('changePriceType').setValue(result.get('changePriceType').value);
        this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
        if(result.get('autoAdd')) this.settingsForm.get('autoAdd').setValue(result.get('autoAdd').value);
        this.settingsForm.get('statusOnFinishId').setValue(result.get('statusOnFinishId').value);
        this.saveSettingsPosting();
        // если это новый документ, и ещё нет выбранных товаров - применяем настройки 
        if(+this.id==0 && this.postingProductsTableComponent.getProductTable().length==0)  {
           //если в настройках сменили предприятие - нужно сбросить статусы, чтобы статус от предыдущего предприятия не прописался в актуальное
           if(+this.settingsForm.get('companyId').value!= +this.formBaseInformation.get('company_id').value) 
           this.resetStatus();
         this.getData();
        }
      }
    });
  }

  productTableRecount(){
    //т.к. нет флажка "НДС включён" (т.к. он всегда включён в цену, если "НДС"=true), то в таблице товаров ничего пересчитывать не надо - НДС не накидывается к цене, если "НДС включён" !=true
  }

  saveSettingsPosting(){
    return this.http.post('/api/auth/saveSettingsPosting', this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar("Настройки успешно сохранены", "Закрыть");
                          
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
  }

  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(this.formBaseInformation.get('company_id').value)
    .subscribe(
      (data) => {
        this.receivedPriceTypesList=data as any [];
        this.necessaryActionsBeforeGetChilds();
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.formBaseInformation.get('status_id').value){
          this.formBaseInformation.get('status_color').setValue(m.color);
        }
      });
  }
  setDefaultDate(){
    this.formBaseInformation.get('posting_date').setValue(moment());
  }
  getCompanyNameById(id:number):string{
    let name:string;
    if(this.receivedCompaniesList){
      this.receivedCompaniesList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  getDepartmentNameById(id:number):string{
    let name:string;
    if(this.receivedDepartmentsList){
      this.receivedDepartmentsList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  onChangeProductsTableLengthHandler(){
    this.setCanEditCompAndDepth();
  }
  //товары должны добавляться только для одного предприятия и одного отделения. Если 1й товар уже добавлен, на начальной стадии (когда документ еще не создан, т.е. id = 0) нужно запретить изменять предприятие и отделение
  setCanEditCompAndDepth(){
    if(+this.postingProductsTableComponent.formSearch.get('product_id').value>0 ||  this.postingProductsTableComponent.getProductTable().length>0) this.canEditCompAndDepth=false; else this.canEditCompAndDepth=true;
  }

    //принимает от product-search-and-table.component сумму к оплате и никуда ее не передает :-( (атавизм от возврата покупателя, там она передавалась в модуль ККМ)
    totalSumPriceHandler($event: any) {
    }  

  //создание нового документа после проведения текущего
  goToNewDocument(){
    this._router.navigate(['ui/postingdoc',0]);
    this.id=0;

    this.clearFormSearchAndProductTable();//очистка формы поиска и таблицы с отобранными товарами
    this.formBaseInformation.get('id').setValue(null);
    this.formBaseInformation.get('uid').setValue('');
    this.formBaseInformation.get('is_completed').setValue(false);
    this.formBaseInformation.get('company_id').setValue(null);
    this.formBaseInformation.get('department_id').setValue(null);
    this.formBaseInformation.get('doc_number').setValue('');
    this.formBaseInformation.get('posting_date').setValue('');
    this.formBaseInformation.get('description').setValue('');

    setTimeout(() => { this.postingProductsTableComponent.showColumns();}, 1000);
    this.setCanEditCompAndDepth();
    this.form.resetForm();
    this.resetStatus();
    this.getLinkedDocsScheme(true);
    this.actionsBeforeGetChilds=0;
    this.startProcess=true;
    this.getData();
  }
  
  resetStatus(){
    this.formBaseInformation.get('status_id').setValue(null);
    this.formBaseInformation.get('status_name').setValue('');
    this.formBaseInformation.get('status_color').setValue('ff0000');
    this.formBaseInformation.get('status_description').setValue('');
    this.receivedStatusesList = [];
  }

//*****************************************************************************************************************************************/
/***********************************************************         ФАЙЛЫ          *******************************************************/
//*****************************************************************************************************************************************/
openDialogAddFiles() {
  const dialogRef = this.dialogAddFiles.open(FilesComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'select',
      companyId: this.formBaseInformation.get('company_id').value
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    console.log(`Dialog result: ${result}`);
    if(result)this.addFilesToPosting(result);
  });
}
openFileCard(docId:number) {
  const dialogRef = this.dialogAddFiles.open(FilesDocComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'window',
      docId: docId
    },
  });
}
loadFilesInfo(){//                                     загружает информацию по прикрепленным файлам
  const body = {"id":this.id};
        return this.http.post('/api/auth/getListOfPostingFiles', body) 
          .subscribe(
              (data) => {  
                          this.filesInfo = data as any[]; 
                        },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
          );
}
addFilesToPosting(filesIds: number[]){
  const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
          return this.http.post('/api/auth/addFilesToPosting', body) 
            .subscribe(
                (data) => {  
                  this.loadFilesInfo();
                  this.openSnackBar("Файлы добавлены", "Закрыть");
                          },
                 error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
}

clickBtnDeleteFile(id: number): void {
  const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
    width: '400px',
    data:
    { 
      head: 'Удаление файла',
      query: 'Удалить файл из данного документа?',
      warning: 'Файл не будет удалён безвозвратно, он останется в библиотеке "Файлы".',
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    if(result==1){this.deleteFile(id);}
  });        
}

deleteFile(id:number){
  const body = {id: id, any_id:this.id}; 
  return this.http.post('/api/auth/deletePostingFile',body)
  .subscribe(
      (data) => {   
                  this.loadFilesInfo();
                  this.openSnackBar("Успешно удалено", "Закрыть");
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
  );  
}
//**********************************************************************************************************************************************/  
//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/
//**********************************************************************************************************************************************/  

//   //создание Списания или Оприходования
//   createLinkedDoc(docname:string){// принимает аргументы: Returnsup
//     let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
//     if(canCreateLinkedDoc.can){
//       this.formReturnsup.get('posting_id').setValue(this.id);
//       this.formReturnsup.get('cagent_id').setValue(this.formBaseInformation.get('cagent_id').value);
//       this.formReturnsup.get('nds').setValue(this.formBaseInformation.get('nds').value);
//       this.formReturnsup.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
//       this.formReturnsup.get('department_id').setValue(this.formBaseInformation.get('department_id').value);
//       this.formReturnsup.get('description').setValue('Создано из оприходования №'+ this.formBaseInformation.get('doc_number').value);
//       this.getProductsTableLinkedDoc(docname);//формируем таблицу товаров для создаваемого документа
//       this.http.post('/api/auth/insert'+docname, this.formReturnsup.value)
//       .subscribe(
//       (data) => {
//                   let createdDocId=data as number;
                
//                   switch(createdDocId){
//                     case null:{// null возвращает если не удалось создать документ из-за ошибки
//                       this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа "+(docname=="Returnsup"?"Возврат поставщику":"")}});
//                       break;
//                     }
//                     case 0:{//недостаточно прав
//                       this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа "+(docname=="Returnsup"?"Возврат поставщику":"")}});
//                       break;
//                     }
//                     default:{// Документ успешно создался в БД 
//                       this.openSnackBar("Документ "+(docname=='Returnsup'?'Возврат поставщику':'')+" успешно создан", "Закрыть");
//                       this.getLinkedDocsList(docname.toLowerCase());//обновляем список этого документа
//                     }
//                   }
//                 },
//         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
//       );
//     } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:canCreateLinkedDoc.reason}});
//   }
  
// // забирает таблицу товаров из дочернего компонента и помещает ее в форму, предназначенную для создания Списания
//   getProductsTableLinkedDoc(docname:string){
//     let tableName:string;//для маппинга в соответствующие названия сетов в бэкэнде (например private Set<PostingProductForm> postingProductTable;)
//     tableName='returnsupProductTable';
//     const control = <FormArray>this.formReturnsup.get(tableName);
//     control.clear();
//     this.postingProductsTableComponent.getProductTable().forEach(row=>{
//           control.push(this.formingProductRowLinkedDoc(row,docname));
//     });
//   }
//   formingProductRowLinkedDoc(row: PostingProductTable, docname:string) {
//     return this._fb.group({
//       product_id: new FormControl (row.product_id,[]),
//       product_count: new FormControl (row.product_count,[]),
//       product_price:  new FormControl (row.product_price,[]),
//       product_sumprice: new FormControl (((row.product_count)*row.product_price).toFixed(2),[]),
//       nds_id:  new FormControl (row.nds_id,[]),
//     });
//   }
//   // можно ли создать связанный документ (да - если есть товары, подходящие для этого, и нет уже проведённого документа)
//   canCreateLinkedDoc(docname:string):CanCreateLinkedDoc{
//     if(!(this.postingProductsTableComponent && this.postingProductsTableComponent.getProductTable().length>0)){
//         return {can:false, reason:'Невозможно создать '+(docname=='Returnsup'?'возврат поставщику':'')+', так как нет товарных позиций'};
//     }else
//       return {can:true, reason:''};
//   }
//   getLinkedDocs(){
//     this.getLinkedDocsList('returnsup');//загрузка связанных возвратов
//   }
//   getLinkedDocsList(docName:string, fromDialog?:boolean){
//     this.http.get('/api/auth/getPostingLinkedDocsList?id='+this.id+'&docName='+docName)
//     .subscribe(
//         (data) => {   
//                       this.linkedDocsReturn=data as LinkedDocs [];
//                   },
//         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
//     );
//   }
//   clickButtonDeleteLinkedDoc(docName:string,id:number): void {
//       const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
//         width: '400px',
//         data:
//         { 
//           head: 'Удаление',
//           warning: 'Удалить '+(docName=='Returnsup'?'возврат поставщику?':''),
//           query: '',
//         },
//       });
//       dialogRef.afterClosed().subscribe(result => {
//         if(result==1){
//           this.deleteLinkedDoc(docName,id);
//         }
//       });  
//   }
//   dialogOpenLinkedDoc(id:number) {
//     const dialogRef = this.dialogCreateProduct.open(ReturnsupDocComponent, {
//       maxWidth: '95vw',
//       maxHeight: '95vh',
//       height: '95%',
//       width: '95%',
//       data:
//       { 
//         mode: 'window',
//         id: id
//       },
//     });
//     dialogRef.afterClosed().subscribe(result => {
//       if(result) this.getLinkedDocsList('returnsup',true);//если вернулось true - значит, возможно, зайдя в Возврат поставщику, его закрыли. Обновим список возвратов.
//   })}
//   deleteLinkedDoc(docName:string,id:number){
//     const body = {"checked": id}; 
//         return this.http.post('/api/auth/delete'+docName, body) 
//         .subscribe(
//             (data) => {   
//                         let result=data as boolean;
//                         if(result){
//                           this.openSnackBar("Успешно удалено", "Закрыть");
//                           this.getLinkedDocsList(docName.toLowerCase());//загрузка связанных возвратов
//                         }else
//                           this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав для удаления'}});
//                       },
//             error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
//         );
//   }
//*****************************************************************************************************************************************/
  //------------------------------------------ Диаграммы связей ----------------------------------------
  myTabFocusChange(changeEvent: MatTabChangeEvent) {
    console.log('Tab position: ' + changeEvent.tab.position);
  }  
  myTabSelectedIndexChange(index: number) {
    console.log('Selected index: ' + index);
    this.tabIndex=index;
  }
  myTabSelectedTabChange(changeEvent: MatTabChangeEvent) {
    console.log('Index: ' + changeEvent.index);
  }  
  myTabAnimationDone() {
    console.log('Animation is done.');
    if(this.tabIndex==1)  {
      if(!this.linkedDocsSchemeDisplayed) {
        this.loadingDocsScheme=true;
        setTimeout(() => {
            this.drawLinkedDocsScheme(); 
          }, 1);   
      }      
    }    
  }
  getLinkedDocsScheme(draw?:boolean){
    let result:any;
    this.loadingDocsScheme=true;
    this.linkedDocsSchemeDisplayed = false;
    this.linkedDocsText ='';
    this.loadingDocsScheme=true;
    this.http.get('/api/auth/getLinkedDocsScheme?uid='+this.formBaseInformation.get('uid').value)
      .subscribe(
          data => { 
            result=data as any;
            
            if(result==null){
              this.loadingDocsScheme=false;
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка загрузки связанных документов"}});
            } else if(result.errorCode==0){//нет результата
              this.linkedDocsSchemeDisplayed = true;
              this.loadingDocsScheme=false;
            } else {
              this.linkedDocsCount=result.count==0?result.count:result.count-1;// т.к. если документ в группе будет только один (данный) - result.count придёт = 1, т.е. связанных нет. Если документов в группе вообще нет - придет 0.
              this.linkedDocsText = result.text;
              if(draw)
                this.drawLinkedDocsScheme()
              else
                this.loadingDocsScheme=false;
            } 
        },
        error => {this.loadingDocsScheme=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  drawLinkedDocsScheme(){
    if(this.tabIndex==1){
      try{
        console.log(this.linkedDocsText);
        this.loadingDocsScheme=false;
        this.linkedDocsSchemeDisplayed = true;
        this.showGraphDiv=false;
        setTimeout(() => {
          this.showGraphDiv=true;
          setTimeout(() => {
            graphviz("#graph").renderDot(this.linkedDocsText);
            }, 1);
          }, 1);
      } catch (e){
        this.loadingDocsScheme=false;
        console.log(e.message);
      }
    } else this.loadingDocsScheme=false;
  }
//------------------------------------------ COMMON UTILITES -----------------------------------------
  //Конвертирует число в строку типа 0.00 например 6.40, 99.25
  numToPrice(price:number,charsAfterDot:number) {
    //конертим число в строку и отбрасываем лишние нули без округления
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + charsAfterDot + "})?", "g")
    const a = price.toString().match(reg)[0];
    //находим положение точки в строке
    const dot = a.indexOf(".");
    // если число целое - добавляется точка и нужное кол-во нулей
    if (dot === -1) { 
        return a + "." + "0".repeat(charsAfterDot);
    }
    //если не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  }
  getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.postingProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.postingProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  getFormIngexByProductId(productId:number):number{
    let retIndex:number;
    let formIndex:number=0;
    this.formBaseInformation.value.postingProductTable.map(i => 
      {
      if(+i['product_id']==productId){retIndex=formIndex}
      formIndex++;
    });return retIndex;}
}

