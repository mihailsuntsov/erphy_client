import { ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { SettingsInventoryDialogComponent } from 'src/app/modules/settings/settings-inventory-dialog/settings-inventory-dialog.component';
import { InventoryProductsTableComponent } from 'src/app/modules/trade-modules/inventory-products-table/inventory-products-table.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { WriteoffDockComponent } from '../writeoff-dock/writeoff-dock.component';
import { PostingDockComponent } from '../posting-dock/posting-dock.component';
import { FilesComponent } from '../files/files.component';
import { FilesDockComponent } from '../files-dock/files-dock.component';

interface InventoryProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма inventoryProductTable, входящая в formBaseInformation)
  id: number;
  row_id: number;
  product_id: number;
  inventory_id:number;
  name: string;
  estimated_balance: number;
  actual_balance: number;
  edizm: string;
  // edizm_id: number;
  product_price: number;
  department_id: number; // склад инвентаризации
  department: string; // название склада, с которого будет производиться инвентаризация.                                  
}
interface DockResponse {//интерфейс для получения ответа в методе getInventoryValuesById
  id: number;
  company: string;
  company_id: number;
  department: string;
  department_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  changer:string;
  changer_id: number;
  date_time_created: string;
  date_time_changed: string;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  doc_number: string;
  name: string;
  description : string;
  is_deleted: boolean;
  is_completed: boolean;
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
interface CanCreateLinkedDock{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}

@Component({
  selector: 'app-inventory-dock',
  templateUrl: './inventory-dock.component.html',
  styleUrls: ['./inventory-dock.component.css'],
  providers: [LoadSpravService,Cookie,]
})
export class InventoryDockComponent implements OnInit {

  id: number = 0;// id документа
  createdDockId: number;//получение id созданного документа
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
  panelWriteoffOpenState=false;
  panelPostingOpenState=false;

  //для загрузки связанных документов
  LinkedDocsWriteoff:LinkedDocs[]=[];
  LinkedDocsPosting:LinkedDocs[]=[];

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: FormGroup; //массив форм для накопления информации о Заказе покупателя
  settingsForm: any; // форма с настройками
  formWP:any// Форма для отправки при создании Списания или Оприходования

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
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  showOpenDocIcon:boolean=false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ создаётся, или есть право на редактирование и документ создан

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  @ViewChild("doc_number", {static: false}) doc_number; //для редактирования номера документа
  @ViewChild(InventoryProductsTableComponent, {static: false}) public inventoryProductsTableComponent:InventoryProductsTableComponent;

  constructor(private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: FormBuilder, //чтобы билдить группу форм inventoryProductTable
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    public SettingsInventoryDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
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
      id: new FormControl                 (this.id,[]),
      company_id: new FormControl         (null,[Validators.required]),
      department_id: new FormControl      (null,[Validators.required]),
      doc_number: new FormControl         ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      description: new FormControl        ('',[]),
      department: new FormControl         ('',[]),
      name: new FormControl               ('',[]),
      status_id: new FormControl          ('',[]),
      status_name: new FormControl        ('',[]),
      status_color: new FormControl       ('',[]),
      status_description: new FormControl ('',[]),
      is_completed: new FormControl       (false,[]),
      inventoryProductTable: new FormArray([]),
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
    
    // Форма для отправки при создании Списания или Оприходования
      this.formWP = new FormGroup({
        inventory_id: new FormControl       (null,[]),
        posting_date: new FormControl       ('',[]),
        writeoff_date: new FormControl      ('',[]),
        company_id: new FormControl         (null,[Validators.required]),
        department_id: new FormControl      (null,[Validators.required]),
        description: new FormControl        ('',[]),
        writeoffProductTable: new FormArray ([]),
        postingProductTable: new FormArray  ([]),
      });
    // Форма настроек
    this.settingsForm = new FormGroup({
      companyId: new FormControl                (null,[]),            // предприятие, для которого создаются настройки
      departmentId: new FormControl             (null,[]),            // id отделения
      name:  new FormControl                    ('',[]),              // наименование инвертаризации по умолчанию
      pricingType: new FormControl              ('avgCostPrice',[]),  // по умолчанию ставим "Средняя закупочная цена"// тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
      priceTypeId: new FormControl              (null,[]),            // тип цены
      changePrice: new FormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]), // наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType, по умолчанию "плюс 10%"
      plusMinus: new FormControl                ('plus',[]),          // Наценка (plus) или скидка (minus)
      changePriceType: new FormControl          ('procents',[]),      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      hideTenths: new FormControl               (true,[]),            // убрать десятые (копейки)
      statusOnFinishId: new FormControl         ('',[]),              // статус после завершения инвентаризации
      defaultActualBalance: new FormControl     ('',[]),              //  фактический баланс по умолчанию. "estimated" - как расчётный, "other" - другой (выбирается в other_actual_balance)
      otherActualBalance: new FormControl       (0,[Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),// "другой" фактический баланс по умолчанию. Например, 1
      autoAdd: new FormControl                  (false,[]),            // автодобавление товара из формы поиска в таблицу
    });

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
    if(this.inventoryProductsTableComponent!=undefined) 
      return this.inventoryProductsTableComponent.getControlTablefield().valid;
    else return true;    
  }
  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=27')
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
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    this.necessaryActionsBeforeGetChilds();
  }

  //нужно загруить всю необходимую информацию, прежде чем вызывать детей (Поиск и добавление товара, Кассовый модуль), иначе их ngOnInit выполнится быстрее, чем загрузится вся информация в родителе
  //вызовы из:
  //getPriceTypesList()*
  //getSpravSysNds()
  //refreshPermissions()
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    //Если набрано необходимое кол-во действий для отображения модуля Формы поиска и добавления товара, и кассововго модуля
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
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==329)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==330)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==331)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==336)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==337)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==338)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==339)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==340)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==341)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==342)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==343)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;this.allowToCreateMyDepartments=true}
    if(this.allowToCreateMyCompany)this.allowToCreateMyDepartments=true;
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyCompany){this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyDepartments)this.allowToViewMyDocs=true;
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;this.allowToUpdateMyDepartments=true;this.allowToUpdateMyDocs=true;}
    if(this.allowToUpdateMyCompany){this.allowToUpdateMyDepartments=true;this.allowToUpdateMyDocs=true;}
    if(this.allowToUpdateMyDepartments)this.allowToUpdateMyDocs=true;
    // console.log("allowToCreateAllCompanies - "+this.allowToCreateAllCompanies);
    // console.log("allowToCreateMyCompany - "+this.allowToCreateMyCompany);
    // console.log("allowToCreateMyDepartments - "+this.allowToCreateMyDepartments);
    this.getData();
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
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
            if(+this.id==0)
              this.getSettings();
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
      //Если дочерние компоненты уже загружены - устанавливаем предприятие по дефолту как склад в форме поиска и добавления товара
      // if(!this.startProcess){
      //   this.inventoryProductsTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);  
      //   this.inventoryProductsTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
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
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,27) //27 - id документа из таблицы documents
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
    this.http.get('/api/auth/getSettingsInventory')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
            this.settingsForm.get('companyId').setValue(result.companyId);
            //данная группа настроек зависит от предприятия
            this.settingsForm.get('departmentId').setValue(result.departmentId);
            this.settingsForm.get('statusOnFinishId').setValue(result.statusOnFinishId);
            this.settingsForm.get('priceTypeId').setValue(result.priceTypeId);
            //данная группа настроек не зависит от предприятия
            this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'avgCostPrice');
            this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
            this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:50);
            this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
            this.settingsForm.get('hideTenths').setValue(result.hideTenths);
            this.settingsForm.get('name').setValue(result.name/*?result.name:''*/);
            this.settingsForm.get('defaultActualBalance').setValue(result.defaultActualBalance);
            this.settingsForm.get('otherActualBalance').setValue(result.otherActualBalance);
            this.settingsForm.get('autoAdd').setValue(result.autoAdd);
            
            //если предприятия из настроек больше нет в списке предприятий (например, для пользователя урезали права, и выбранное предприятие более недоступно)
            //необходимо сбросить данное предприятие в null 
            if(!this.isCompanyInList(+result.companyId)){
              this.formBaseInformation.get('company_id').setValue(null);
            } else { 
              //вставляем Отделение и Покупателя (вставится только если новый документ)
              this.setDefaultInfoOnStart();
            }
            this.setDefaultCompany();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
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
      this.formBaseInformation.get('name').setValue(this.settingsForm.get('name').value);
    }
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getInventoryValuesById?id='+ this.id)
        .subscribe(
            data => { 
                let documentValues: DockResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                this.formAboutDocument.get('id').setValue(+documentValues.id);
                this.formAboutDocument.get('master').setValue(documentValues.master);
                this.formAboutDocument.get('creator').setValue(documentValues.creator);
                this.formAboutDocument.get('changer').setValue(documentValues.changer);
                this.formAboutDocument.get('company').setValue(documentValues.company);
                this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                this.formBaseInformation.get('id').setValue(+documentValues.id);
                this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                this.formBaseInformation.get('department_id').setValue(documentValues.department_id);
                this.formBaseInformation.get('department').setValue(documentValues.department);
                this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                this.formBaseInformation.get('description').setValue(documentValues.description);
                this.formBaseInformation.get('name').setValue(documentValues.name);
                this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                this.formBaseInformation.get('is_completed').setValue(documentValues.is_completed);
                this.creatorId=+documentValues.creator_id;
                this.getSettings(); // настройки документа Инвентаризация
                // this.getSpravSysEdizm();//справочник единиц измерения
                this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                this.getPriceTypesList();
                this.loadFilesInfo();
                this.getDepartmentsList();//отделения
                this.getStatusesList();//статусы документа Инвентаризация
                this.getLinkedDocs(); //загрузка связанных документов
                this.refreshPermissions();//пересчитаем права
                // if(this.inventoryProductsTableComponent) this.inventoryProductsTableComponent.showColumns(); //чтобы спрятать столбцы после завершения Инвентаризации
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
        );
  }

  formingProductRowFromApiResponse(row: InventoryProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      product_id: new FormControl (row.product_id,[]),
      inventory_id: new FormControl (+this.id,[]),
      name: new FormControl (row.name,[]),
      estimated_balance: new FormControl (row.estimated_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      actual_balance: new FormControl (row.actual_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price:  new FormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),ValidationService.priceMoreThanZero]),
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

  checkDocNumberUnical() {
    if(!this.formBaseInformation.get('doc_number').errors)
    {
      let Unic: boolean;
      this.isDocNumberUnicalChecking=true;
      return this.http.get('/api/auth/isDocumentNumberUnical?company_id='+this.formBaseInformation.get('company_id').value+'&doc_number='+this.formBaseInformation.get('doc_number').value+'&doc_id='+this.id+'&table=inventory')
      .subscribe(
          (data) => {   
                      Unic = data as boolean;
                      if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Введённый номер документа не является уникальным.',}});
                      this.isDocNumberUnicalChecking=false;
                  },
          error => {console.log(error);this.isDocNumberUnicalChecking=false;}
      );
    }
  }

  //создание нового документа Инвентаризация
  createNewDocument(){
    this.createdDockId=null;
    this.getProductsTable();
    this.http.post('/api/auth/insertInventory', this.formBaseInformation.value)
      .subscribe(
      (data) => {
                  this.actionsBeforeGetChilds=0;
                  this.createdDockId=data as number;
                  switch(this.createdDockId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа Инвентаризация"}});
                      console.log("3-"+!this.formBaseInformation.valid);
                      break;
                    }
                    case 0:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа Инвентаризация"}});
                      break;
                    }
                    default:{// Инвентаризация успешно создалась в БД 
                      this.openSnackBar("Документ \"Инвентаризация\" успешно создан", "Закрыть");
                      this.afterCreateInventory();
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
      );
  }

  //действия после создания нового документа Инвентаризиция
  afterCreateInventory(){
      this.id=+this.createdDockId;
      this._router.navigate(['/ui/inventorydock', this.id]);
      this.formBaseInformation.get('id').setValue(this.id);
      this.getData();
  }

  completeDocument(notShowDialog?:boolean){
    if(!notShowDialog){//notShowDialog=false - показывать диалог
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
          head: 'Завершение инвентаризации',
          warning: 'Вы хотите завершить инвентаризацию?',
          query: 'После завершения документ станет недоступным для редактирования.'},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.updateDocument(true);
        }
      });
    } else this.updateDocument(true);
  }

  updateDocument(complete?:boolean){ 
    this.getProductsTable();    
    if(complete) {
      if(this.settingsForm.get('statusOnFinishId').value)//если в настройках есть "Статус при завершении" - выставим его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusOnFinishId').value);
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением
    }
    return this.http.post('/api/auth/updateInventory',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            this.setStatusColor();//чтобы обновился цвет статуса
            if(this.inventoryProductsTableComponent) this.inventoryProductsTableComponent.showColumns(); //чтобы спрятать столбцы после завершения Инвентаризации
            this.openSnackBar("Документ \"Инвентаризация\" "+ (complete?"завершён.":"сохренён."), "Закрыть");
          },
          error => {
            this.showQueryErrorMessage(error);
            },
      );
  } 
  clearFormSearchAndProductTable(){
    this.inventoryProductsTableComponent.resetFormSearch();
    this.inventoryProductsTableComponent.getControlTablefield().clear();
    this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
  }
  //забирает таблицу товаров из дочернего компонента и помещает ее в основную форму
  getProductsTable(){
    const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
    control.clear();
    this.inventoryProductsTableComponent.getProductTable().forEach(row=>{
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
    const dialogSettings = this.SettingsInventoryDialogComponent.open(SettingsInventoryDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        priceTypesList:   this.receivedPriceTypesList, //список типов цен
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        receivedDepartmentsList: this.receivedDepartmentsList, //список отделений
        company_id: this.formBaseInformation.get('company_id').value, // текущее предприятие (нужно для поиска покупателя)
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
        if(result.get('name')) this.settingsForm.get('name').setValue(result.get('name').value);
        if(result.get('defaultActualBalance')) this.settingsForm.get('defaultActualBalance').setValue(result.get('defaultActualBalance').value);
        if(result.get('otherActualBalance')) this.settingsForm.get('otherActualBalance').setValue(result.get('otherActualBalance').value);
        if(result.get('autoAdd')) this.settingsForm.get('autoAdd').setValue(result.get('autoAdd').value);
        this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
        this.settingsForm.get('statusOnFinishId').setValue(result.get('statusOnFinishId').value);
        this.saveSettingsInventory();
        
        // если это новый документ, и ещё нет выбранных товаров - применяем настройки 
        if(+this.id==0 && this.inventoryProductsTableComponent.getProductTable().length==0)  {
          this.getData();
        }
      }
    });
  }

  saveSettingsInventory(){
    return this.http.post('/api/auth/saveSettingsInventory', this.settingsForm.value)
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
    if(this.inventoryProductsTableComponent.getProductTable().length>0) this.canEditCompAndDepth=false; else this.canEditCompAndDepth=true;
  }

//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/



  //создание Списания или Оприходования
  createLinkedDock(dockname:string){// принимает аргументы: Writeoff или Posting
    let canCreateLinkedDock:CanCreateLinkedDock=this.canCreateLinkedDock(dockname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDock.can){
      this.formWP.get('inventory_id').setValue(this.id);
      this.formWP.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formWP.get('department_id').setValue(this.formBaseInformation.get('department_id').value);
      this.formWP.get('description').setValue('Создано из Инвентаризации №'+ this.formBaseInformation.get('doc_number').value);
      this.getProductsTableWP(dockname);//формируем таблицу товаров для создаваемого документа
      this.http.post('/api/auth/insert'+dockname, this.formWP.value)
      .subscribe(
      (data) => {
                  let createdDockId=data as number;
                  switch(createdDockId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа "+(dockname=="Writeoff"?"Списание":"Оприходование")}});
                      break;
                    }
                    case 0:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа "+(dockname=="Writeoff"?"Списание":"Оприходование")}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar("Документ "+(dockname=='Writeoff'?'Списание':'Оприходование')+" успешно создан", "Закрыть");
                      this.getInventoryLinkedDocsList(dockname.toLowerCase());//обновляем список этого документа
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
      );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:canCreateLinkedDock.reason}});
  }
//забирает таблицу товаров из дочернего компонента и помещает ее в форму, предназначенную для создания Оприходования или Списания
  getProductsTableWP(dockname:string){
    let tableName:string;//для маппинга в соответствующие названия сетов в бэкэнде (например private Set<PostingProductForm> postingProductTable;)
    if(dockname=='Writeoff') tableName='writeoffProductTable'; else tableName='postingProductTable';
    const control = <FormArray>this.formWP.get(tableName);
    control.clear();
    this.inventoryProductsTableComponent.getProductTable().forEach(row=>{
      if(dockname=='Writeoff'){// Если Списание - отбираем из всего списка только товары с недостачей
        if((row.actual_balance-row.estimated_balance)<0)
          control.push(this.formingProductRowWP(row,dockname));
      } else { // 'Posting'       Если Оприходование - отбираем из всего списка только товары с избытком 
        if((row.actual_balance-row.estimated_balance)>0)
          control.push(this.formingProductRowWP(row,dockname));
      }
    });
  }

  //можно ли создать связанный документ (да - если есть товары, подходящие для этого, и нет уже завершённого документа)
  canCreateLinkedDock(dockname:string):CanCreateLinkedDock{
    let isThereCompletedLinkedDocks:boolean = this.isThereCompletedLinkedDocks(dockname);
    let noProductsToCreateLinkedDock:boolean = this.getProductsCountToLinkedDock(dockname)==0;
    if(isThereCompletedLinkedDocks || noProductsToCreateLinkedDock){
      if(isThereCompletedLinkedDocks)
        return {can:false, reason:'Невозможно создать '+(dockname=='Writeoff'?'Списание':'Оприходование')+', так как уже есть завершенный документ '+(dockname=='Writeoff'?'Списание':'Оприходование')};
      else
        return {can:false, reason:'Невозможно создать '+(dockname=='Writeoff'?'Списание':'Оприходование')+', так как нет позиций с '+(dockname=='Writeoff'?'отрицательной':'положительной')+' разницей'};
    }else
      return {can:true, reason:''};
  }

  //есть ли уже завершенный связанный документ (для возможности создания их при их отсутствии) Например, не получится создать Списание, если уже есть завершенные Списания
  isThereCompletedLinkedDocks(dockname:string):boolean{
    let isThere:boolean=false;
    if(dockname=='Writeoff'){// Если Списание
      this.LinkedDocsWriteoff.map(i=>{
        if(i.is_completed)
          isThere=true;
      });
    } else {// 'Posting'       Если Оприходование
      this.LinkedDocsPosting.map(i=>{
        if(i.is_completed)
          isThere=true;
      });
    }
    return isThere;
  }
  //возвращает количество товаров, подходящих для связанных документов (для возможности создания их при количестве >0) Например, не получится создать Списание, если кол-во товаров с недостачей = 0, т.е списывать нечего
  getProductsCountToLinkedDock(dockname:string):number{
    let count:number=0;
    this.inventoryProductsTableComponent.getProductTable().forEach(row=>{
      if(dockname=='Writeoff'){// Если Списание - отбираем из всего списка только товары с недостачей
        if((row.actual_balance-row.estimated_balance)<0)
          count++
      } else { // 'Posting'       Если Оприходование - отбираем из всего списка только товары с избытком 
        if((row.actual_balance-row.estimated_balance)>0)
          count++
      }
    });
    return count;
  }
  formingProductRowWP(row: InventoryProductTable, dockname:string) {
    let product_count:number;
    if(dockname=='Writeoff') product_count=row.estimated_balance-row.actual_balance; else product_count=row.actual_balance-row.estimated_balance;// чтобы в insertWriteoff ушло положительное число
    return this._fb.group({
      product_id: new FormControl (row.product_id,[]),
      product_count: new FormControl (product_count,[]),
      product_price:  new FormControl (row.product_price,[]),
      product_sumprice: new FormControl (((product_count)*row.product_price).toFixed(2),[]),
      reason_id: new FormControl (3,[]), // 3 - Недостачи и потери от порчи ценностей
    });
  }

  getLinkedDocs(){
    this.getInventoryLinkedDocsList('writeoff');//загрузка связанных списаний
    this.getInventoryLinkedDocsList('posting'); //загрузка связанных оприходований
  }

  getInventoryLinkedDocsList(docName:string, fromDialog?:boolean){
    this.http.get('/api/auth/getInventoryLinkedDocsList?id='+this.id+'&docName='+docName)
    .subscribe(
        (data) => {   
                    if(docName=='writeoff'){
                      this.LinkedDocsWriteoff=data as LinkedDocs [];
                    }
                    else 
                    {
                      this.LinkedDocsPosting =data as LinkedDocs [];
                    }
                    if(fromDialog) this.offerToComplete();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
    );
  }

  //если после закрытия диалога связанного документа в документе больше нечего делать (всё что можно было - было создано и закрыто) - предложим пользователю завершить Инвентаризацию
  offerToComplete(){
    let thereCompletedWriteoff=this.isThereCompletedLinkedDocks('Writeoff');
    let thereCompletedPosting=this.isThereCompletedLinkedDocks('Posting');
    let productsCountToWriteoff=this.getProductsCountToLinkedDock('Writeoff');
    let productsCountToPosting=this.getProductsCountToLinkedDock('Posting');
    if(!this.formBaseInformation.get('is_completed').value && // если инвентаризация еще не завершена и...
        (
          (thereCompletedWriteoff && thereCompletedPosting) || //если есть завершенные Списание и Оприходование или...
          (thereCompletedWriteoff && productsCountToPosting==0) || // есть завершенное Списание, и оприходовать нечего или...
          (thereCompletedPosting && productsCountToWriteoff==0) // есть завершенное Оприходование, и списывать нечего
        )
      )

    {// то предложим завершить данную Инвентаризацию
      let warning:string;
      if(thereCompletedWriteoff && thereCompletedPosting) warning='Списание и Оприходование по данной Инвентаризации завершены. ';
      if(thereCompletedWriteoff && productsCountToPosting==0) warning='Списание по данной Инвентаризации завершено. Товарных позиций для Оприходования нет. ';
      if(thereCompletedPosting && productsCountToWriteoff==0) warning='Оприходование по данной Инвентаризации завершено. Товарных позиций для Списания нет. ';
      warning=warning+'Инвентаризацию можно завершить.';
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Внимание',
          query: warning,
          warning: 'Завершить эту Инвентаризацию?',
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.completeDocument(true);//завершаем Инвентаризацию без дополнительного диалога, т.к. пользователь уже дал согласие
        }
      });  
    }


  }

  clickButtonDeleteLinkedDock(docName:string,id:number): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Удаление',
          warning: 'Удалить данное '+(docName=='Writeoff'?'Списание?':'Оприходование?'),
          query: '',
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.deleteLinkedDock(docName,id);
        }
      });  
  }
  dialogOpenPosting(id:number) {
    const dialogRef = this.dialogCreateProduct.open(PostingDockComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'window',
        id: id
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      if(result) this.getInventoryLinkedDocsList('posting',true);//если вернулось true - значит, возможно, зайдя в Списание его закрыли. Обновим список списаний. Да, возможно заходили в уже закрытый документ, и запрос на обновление списка документов будет произведен зря
    });
  }
  dialogOpenWriteoff(id:number) {
    const dialogRef = this.dialogCreateProduct.open(WriteoffDockComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'window',
        id: id
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
      if(result) this.getInventoryLinkedDocsList('writeoff',true);//если вернулось true - значит, возможно, зайдя в Списание его закрыли. Обновим список списаний. Да, возможно заходили в уже закрытый документ, и запрос на обновление списка документов будет произведен зря
    });
  }
  deleteLinkedDock(docName:string,id:number){
    const body = {"checked": id}; 
        return this.http.post('/api/auth/delete'+docName, body) 
        .subscribe(
            (data) => {   
                        let result=data as boolean;
                        if(result){
                          this.openSnackBar("Успешно удалено", "Закрыть");
                          this.getInventoryLinkedDocsList(docName.toLowerCase());
                        }else
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав для удаления'}});
                      },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
        );
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
    if(result)this.addFilesToInventory(result);
  });
}
openFileCard(dockId:number) {
  const dialogRef = this.dialogAddFiles.open(FilesDockComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'window',
      dockId: dockId
    },
  });
}
loadFilesInfo(){//                                     загружает информацию по прикрепленным файлам
  const body = {"id":this.id};
        return this.http.post('/api/auth/getListOfInventoryFiles', body) 
          .subscribe(
              (data) => {  
                          this.filesInfo = data as any[]; 
                        },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
          );
}
addFilesToInventory(filesIds: number[]){
  const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
          return this.http.post('/api/auth/addFilesToInventory', body) 
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
      query: 'Удалить файл из инвентаризации?',
      warning: 'Файл не будет удалён безвозвратно, он останется в библиотеке "Файлы".',
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    if(result==1){this.deleteFile(id);}
  });        
}

deleteFile(id:number){
  const body = {id: id, any_id:this.id}; 
  return this.http.post('/api/auth/deleteInventoryFile',body)
  .subscribe(
      (data) => {   
                  this.loadFilesInfo();
                  this.openSnackBar("Успешно удалено", "Закрыть");
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
  );  
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
    return (this.formBaseInformation.value.inventoryProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.inventoryProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
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
    this.formBaseInformation.value.inventoryProductTable.map(i => 
        {
        if(+i['product_id']==productId){retIndex=formIndex}
        formIndex++;
        });return retIndex;}
}

