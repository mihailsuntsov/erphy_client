import { ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { KkmAtolService } from '../../../../services/kkm_atol';
import { KkmAtolChequesService } from '../../../../services/kkm_atol_cheques';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { SettingsShipmentDialogComponent } from 'src/app/modules/settings/settings-shipment-dialog/settings-shipment-dialog.component';
import { ProductSearchAndTableComponent } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.component';
import { BalanceCagentComponent } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.component';
import { KkmComponent } from 'src/app/modules/trade-modules/kkm/kkm.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { v4 as uuidv4 } from 'uuid';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { graphviz }  from 'd3-graphviz';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
const moment = _rollupMoment || _moment;
import { MomentDateAdapter} from '@angular/material-moment-adapter';
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

interface ShipmentProductTable { //интерфейс для формы, массив из которых будет содержать форма shipmentProductTable, входящая в formBaseInformation
  id: number;
  row_id: number;
  product_id: number;
  retail_sales_id:number;
  name: string;
  product_count: number;
  edizm: string;
  edizm_id: number;
  product_price: number;
  product_price_of_type_price: number;//цена товара по типу цены. Т.к. цену можно редактировать в таблице товаров, при несовпадении новой цены с ценой типа цены нужно будет сбросить тип цены в 0 (не выбран), т.к. это уже будет не цена типа цены
  product_sumprice: number;
  price_type: string;
  price_type_id: number;
  available: number; 
  nds: string;
  nds_id: number;
  reserve: boolean;// зарезервировано                                                                                (formSearch.reserve)
  priority_type_price: string;// приоритет типа цены: Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)  (formSearch.priorityTypePriceSide)
  department_id: number; // склад с которого будет производиться отгрузка товара.     
  department: string; // склад с которого будет производиться отгрузка товара.                                   (secondaryDepartmentId)
  shipped:number; //отгружено        
  total: number; //всего на складе
  reserved: number; // сколько зарезервировано в других Заказах покупателя
  reserved_current: number; // сколько зарезервировано в данном заказе покупателя  
  ppr_name_api_atol: string; //Признак предмета расчета в системе Атол. Невидимое поле. Нужно для передачи в таблицу товаров в качестве тега для чека на ккм Атол
  is_material: boolean; //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)            
}
interface SpravSysNdsSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}
interface DocResponse {//интерфейс для получения ответа в методе getShipmentValuesById
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
  nds: boolean;
  cagent: string;
  cagent_id: number;
  nds_included: boolean;
  changer_id: number;
  doc_number: string;
  date_time_changed: string;
  date_time_created: string;
  description : string;
  is_archive: boolean;
  department_type_price_id: number;
  cagent_type_price_id: number;
  default_type_price_id: number;
  // name: string;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  additional_address: string;
  // receipt_id: number;
  shipment_date: string;
  uid:string;
  is_completed: boolean;
  customers_orders_id:number;
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
interface SecondaryDepartment{
  id: number;
  name: string;
  pricetype_id: number;
  reserved: number;
  total: number;
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
interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}
interface LinkedDocs {//интерфейс для загрузки связанных документов
  id:number;
  doc_number:number;
  date_time_created:string;
  description:string;
  is_completed:boolean;
}
@Component({
  selector: 'app-shipment-doc',
  templateUrl: './shipment-doc.component.html',
  styleUrls: ['./shipment-doc.component.css'],
  providers: [LoadSpravService,KkmAtolService,KkmAtolChequesService,Cookie,ProductSearchAndTableComponent,KkmComponent,CommonUtilitesService,BalanceCagentComponent,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class ShipmentDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: number;//получение id созданного документа
  receivedCompaniesList: IdAndName [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedStatusesList: StatusInterface [] = []; // массив для получения статусов
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  // receivedUsersList  : any [];//массив для получения списка пользователей
  myCompanyId:number=0;
  
  // allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  filesInfo : FilesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  myId:number=0;
  creatorId:number=0;
  startProcess: boolean=true; // идеут стартовые запросы. после того как все запросы пройдут - будет false.
  is_addingNewCagent: boolean = false; // при создании документа создаём нового получателя (false) или ищем уже имеющегося (true)
  // panelContactsOpenState = true;
  // panelAddressOpenState = false;
  addressString: string = ''; // строка для адреса расположения ККМ
  // gettingTableData:boolean=false;//идет загрузка данных - нужно для спиннера
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  // actionsBeforeCreateNewDoc:number=0;// количество выполненных действий, необходимых чтобы создать новый документ
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)
  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  // productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  // netCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
  // priceUpDownFieldName:string = 'Наценка'; // Наименование поля с наценкой-скидкой
  // priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  // companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation
  // receipt_id: number = 0; // id чека Отгрузки
  department_type_price_id: number; //id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  cagent_type_price_id: number; //id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  default_type_price_id: number; //id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 
  // secondaryDepartments:SecondaryDepartment[]=[];// склады в выпадающем списке складов формы поиска товара
  spravSysEdizmOfProductAll: IdAndNameAndShortname[] = [];// массив, куда будут грузиться все единицы измерения товара
  receivedPriceTypesList: IdNameDescription [] = [];//массив для получения списка типов цен
  displayedColumns:string[];//отображаемые колонки таблицы с товарами

  //для загрузки связанных документов
  linkedDocsReturn:LinkedDocs[]=[];
  panelReturnOpenState=false;

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: FormGroup; //массив форм для накопления информации о Заказе покупателя
  settingsForm: any; // форма с настройками
  formLinkedDocs:any// Форма для отправки при создании Возврата покупателя

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

  //для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу)
  loadingDocsScheme:boolean = false;
  linkedDocsSchemeDisplayed:boolean = false;



  //****************************                   Взаимодействие с ККМ                    ************************************
  cheque_nds=false; //нужно ли проставлять НДС в чеке.

  // @ViewChild("countInput", {static: false}) countInput;
  // @ViewChild("nameInput", {static: false}) nameInput; 
  // @ViewChild("formCashierLogin", {static: false}) formCashierLogin; 
  // @ViewChild("form", {static: false}) form; 
  // @ViewChild("formBI", {static: false}) formBI; 
  // @ViewChild(MatAccordion) accordion: MatAccordion;
  // @Input() authorized: boolean;
  @ViewChild("doc_number", {static: false}) doc_number; //для редактирования номера документа
  @ViewChild(ProductSearchAndTableComponent, {static: false}) public productSearchAndTableComponent:ProductSearchAndTableComponent;
  @ViewChild(KkmComponent, {static: false}) public kkmComponent:KkmComponent;
  @ViewChild(BalanceCagentComponent, {static: false}) public balanceCagentComponent:BalanceCagentComponent;
  

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность 
  doc_number_isReadOnly=true;
  is_completed=false;

  //для поиска контрагента (получателя) по подстроке
  searchCagentCtrl = new FormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;

  constructor(private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: FormBuilder, //чтобы билдить группу форм shipmentProductTable
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    public SettingsShipmentDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    public MessageDialog: MatDialog,
    private commonUtilites: CommonUtilitesService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private _router:Router) 
    { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];
    }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl                 (this.id,[]),
      company_id: new FormControl         (null,[Validators.required]),
      department_id: new FormControl      (null,[Validators.required]),
      doc_number: new FormControl         ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      cagent_id: new FormControl          ({disabled: false, value: '' },[Validators.required]),
      cagent: new FormControl             ('',[]),
      is_completed: new FormControl       (false,[]),
      description: new FormControl        ('',[]),
      department: new FormControl         ('',[]),
      shipmentProductTable: new FormArray([]),
      nds: new FormControl                (false,[]),
      nds_included: new FormControl       (true,[]),
      // name: new FormControl               ('',[]),
      shipment_date: new FormControl      ('',[Validators.required]),
      status_id: new FormControl          ('',[]),
      customers_orders_id: new FormControl('',[]),
      status_name: new FormControl        ('',[]),
      status_color: new FormControl       ('',[]),
      status_description: new FormControl ('',[]),
      new_cagent: new FormControl         ({disabled: true, value: '' },[Validators.required]),
      uid: new FormControl                ('',[]),// uuid идентификатор для создаваемой отгрузки
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

    // Форма для отправки при создании связанных документов
    this.formLinkedDocs = new FormGroup({
      retail_sales_id: new FormControl    (null,[]),
      date_return: new FormControl        ('',[]),
      nds: new FormControl                ('',[]),
      parent_tablename: new FormControl   ('',[]), //для счёта фактуры выданного
      shipment_id: new FormControl        ('',[]), //для счёта фактуры выданного
      cagent_id: new FormControl          (null,[Validators.required]),
      company_id: new FormControl         (null,[Validators.required]),
      department_id: new FormControl      (null,[Validators.required]),
      description: new FormControl        ('',[]),
      invoiceoutProductTable: new FormArray  ([]),
      returnProductTable: new FormArray   ([]),
      linked_doc_id: new FormControl      (null,[]),//id связанного документа (в данном случае Отгрузка)
      parent_uid: new FormControl         (null,[]),// uid родительского документа
      child_uid: new FormControl          (null,[]),// uid дочернего документа
      linked_doc_name: new FormControl    (null,[]),//имя (таблицы) связанного документа
      uid: new FormControl                ('',[]),  //uid создаваемого связанного документа
      // параметры для входящих ордеров и платежей
      payment_account_id: new FormControl ('',[]),//id расчтёного счёта      
      boxoffice_id: new FormControl       ('',[]), // касса предприятия или обособленного подразделения
      internal: new FormControl           (false,[]), // внутренний платеж     
      summ:     new FormControl           ('',[]),
    });

    // Форма настроек
    this.settingsForm = new FormGroup({
      // id отделения
      departmentId: new FormControl             (null,[]),
      //покупатель по умолчанию
      customerId: new FormControl               (null,[]),
      //наименование покупателя
      customer: new FormControl                 ('',[]),
      //наименование заказа по умолчанию
      orderName:  new FormControl               ('',[]),
      // тип расценки. priceType - по типу цены, costPrice - себестоимость, manual - вручную
      pricingType: new FormControl              ('priceType',[]),
      //тип цены
      priceTypeId: new FormControl              (null,[]),
      //наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new FormControl              (50,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // Наценка (plus) или скидка (minus)
      plusMinus: new FormControl                ('plus',[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new FormControl          ('procents',[]),
      //убрать десятые (копейки)
      hideTenths: new FormControl               (true,[]),
      //сохранить настройки
      saveSettings: new FormControl             (true,[]),
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
      //наименование заказа
      name:  new FormControl                    ('',[]),
      //приоритет типа цены : Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      priorityTypePriceSide: new FormControl    ('defprice',[]),
      //настройки операций с ККМ
      //Оплата чека прихода (наличными - nal безналичными - electronically смешанная - mixed)
      selectedPaymentType:   new FormControl    ('cash',[]),
      //автосоздание на старте документа, если автозаполнились все поля
      // autocreateOnStart: new FormControl        (false,[]),
      //автосоздание нового документа, если в текущем успешно напечатан чек
      autocreate: new FormControl       (false,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnComplete: new FormControl(null,[]),
      //показывать блок ККМ
      showKkm: new FormControl                  (null,[]),
      // автодобавление товара из формы поиска в таблицу
      autoAdd: new FormControl                  (false,[]),            
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
    //     [getCompaniesList, getSpravSysNds* ]
    //     |
    //     [getSettings, doFilterCompaniesList]
    //     |
    //     setDefaultInfoOnStart
    //     |
    //     setDefaultCompany 
    //     |
    //     [getDepartmentsList, getPriceTypesList*] 
    //     |
    //     [setDefaultDepartment, getSetOfTypePrices, doFilterDepartmentsList]
    //     | (если идет стартовая загрузка):
    //     getStatusesList, getSpravSysEdizm
    //     |
    //     setDefaultStatus
    //     |
    //     setStatusColor
    //     |
    //     refreshPermissions*
    
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.getSetOfPermissions();//
  }
  //чтобы не было ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }
  get childFormValid() {
    if(this.productSearchAndTableComponent!=undefined)
    //если нет ошибок в форме, включая отсутствие дробного количества у неделимых товаров
      return (this.productSearchAndTableComponent.getControlTablefield().valid && !this.productSearchAndTableComponent.indivisibleErrorOfProductTable);
    else return true;    //чтобы не было ExpressionChangedAfterItHasBeenCheckedError. Т.к. форма создается пустая и с .valid=true, а потом уже при заполнении проверяется еще раз.
  }

  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=21')
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
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // return true;
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
    if(this.actionsBeforeGetChilds==3){
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
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==253)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==254)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==255)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==260)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==261)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==262)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==263)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==264)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==265)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==266)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==267)});
    this.allowToCompleteAllCompanies = permissionsSet.some(       function(e){return(e==396)});
    this.allowToCompleteMyCompany = permissionsSet.some(          function(e){return(e==397)});
    this.allowToCompleteMyDepartments = permissionsSet.some(      function(e){return(e==398)});
    this.allowToCompleteMyDocs = permissionsSet.some(             function(e){return(e==399)});
   
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
      this.getSpravSysNds();
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
            if(+this.id==0){
              this.setDefaultDate();
            }
          },                      
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }

  onCompanyChange(){
    this.formBaseInformation.get('department_id').setValue(null);
    this.formBaseInformation.get('cagent_id').setValue(null);
    this.formBaseInformation.get('cagent').setValue('');
    this.formBaseInformation.get('status_id').setValue(null);
    this.searchCagentCtrl.setValue('');
    
    this.actionsBeforeGetChilds=0;
    this.formAboutDocument.get('company').setValue(this.getCompanyNameById(this.formBaseInformation.get('company_id').value));
    this.getDepartmentsList();
    this.getPriceTypesList();
  }

  onDepartmentChange(){
      this.getSetOfTypePrices();
      this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
      this.productSearchAndTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);
      if(this.kkmComponent){
        this.kkmComponent.department_id=this.formBaseInformation.get('department_id').value;
        this.kkmComponent.getKassaListByDepId();
      }
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
      //Если дочерние компоненты уже загружены - устанавливаем данный склад по дефолту как склад в форме поиска и добавления товара
      if(!this.startProcess){
        this.productSearchAndTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);  
        this.productSearchAndTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
      }
    }
    //если отделение было выбрано (через настройки или же в этом методе) - определяем его наименование (оно будет отправляться в дочерние компоненты)
    if(+this.formBaseInformation.get('department_id').value>0)
      this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
    
    //загрузка типов цен для покупателя, склада и по умолчанию  
    this.getSetOfTypePrices();
      //если идет стартовая прогрузка - продолжаем цепочку запросов. Если это была, например, просто смена предприятия - продолжать далее текущего метода смысла нет
    if(this.startProcess) 
      this.getStatusesList();
      this.getSpravSysEdizm(); //загрузка единиц измерения. Загружаем тут, т.к. нужно чтобы сначала определилось предприятие, его id нужен для загрузки
  }
  setDefaultDate(){
    this.formBaseInformation.get('shipment_date').setValue(moment());
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
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,21) //21 - id документа из таблицы documents
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
    // this.getSpravSysEdizm(); //загрузка единиц измерения. Загружаем тут, т.к. нужно чтобы сначала определилось предприятие, его id нужен для загрузки
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
  searchOrCreateNewCagent(is_adding:boolean){
    this.is_addingNewCagent=is_adding;
    if(is_adding){
      this.formBaseInformation.get('cagent_id').disable();
      this.formBaseInformation.get('new_cagent').enable();
    } else{
      this.formBaseInformation.get('cagent_id').enable();
      this.formBaseInformation.get('new_cagent').disable();
    }
    this.searchCagentCtrl.setValue('');
    this.formBaseInformation.get('new_cagent').setValue('');
    this.checkEmptyCagentField();
  }
  //  -------------     ***** поиск по подстроке для покупателя ***    --------------------------
  onCagentSearchValueChanges(){
    this.searchCagentCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredCagents = [];}),       
      switchMap(fieldObject =>  
        this.getCagentsList()))
    .subscribe(data => {
      this.isCagentListLoading = false;
      if (data == undefined) {
        this.filteredCagents = [];
      } else {
        this.filteredCagents = data as any;
  }});}

  onSelectCagent(id:number,name:string){
    this.formBaseInformation.get('cagent_id').setValue(+id);
    this.formBaseInformation.get('cagent').setValue(name);
    //Загружим тип цены для этого Покупателя, и 
    //если в форме поиска товаров приоритет цены выбран Покупатель, то установится тип цены этого покупателя (если конечно он у него есть)
    this.getSetOfTypePrices();
  }


  //загрузка настроек
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsShipment')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
            
            this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'priceType');
            this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
            this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:50);
            this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
            this.settingsForm.get('hideTenths').setValue(result.hideTenths);
            this.settingsForm.get('saveSettings').setValue(result.saveSettings);
            this.settingsForm.get('priorityTypePriceSide').setValue(result.priorityTypePriceSide?result.priorityTypePriceSide:'defprice');
            // this.settingsForm.get('autocreateOnStart').setValue(result.autocreateOnStart);
            this.settingsForm.get('autocreate').setValue(result.autocreate);
            this.settingsForm.get('statusIdOnComplete').setValue(result.statusIdOnComplete);
            this.settingsForm.get('showKkm').setValue(result.showKkm);
            this.settingsForm.get('autoAdd').setValue(result.autoAdd);

            //если предприятия из настроек больше нет в списке предприятий (например, для пользователя урезали права, и выбранное предприятие более недоступно)
            //необходимо сбросить данное предприятие в null 
            if(this.isCompanyInList(+result.companyId)){
              this.settingsForm.get('companyId').setValue(result.companyId);
              this.settingsForm.get('departmentId').setValue(result.departmentId);
              this.settingsForm.get('customerId').setValue(result.customerId);
              this.settingsForm.get('customer').setValue(result.customer);
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
    if(this.receivedCompaniesList)
      this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }

  //если новый документ - вставляем Отделение и Покупателя (но только если они принадлежат выбранному предприятию, т.е. предприятие в Основной информации и предприятие, для которого были сохранены настройки совпадают)
  setDefaultInfoOnStart(){
    if(+this.id==0){//документ новый
      this.formBaseInformation.get('company_id').setValue(this.settingsForm.get('companyId').value)
      // if(+departmentId>0){
        this.formBaseInformation.get('department_id').setValue(this.settingsForm.get('departmentId').value);
      // }
      if(+this.settingsForm.get('customerId').value>0){
        this.searchCagentCtrl.setValue(this.settingsForm.get('customer').value);
        this.formBaseInformation.get('cagent_id').setValue(this.settingsForm.get('customerId').value);
        this.formBaseInformation.get('cagent').setValue(this.settingsForm.get('customer').value);
      } else {
        this.searchCagentCtrl.setValue(null);
        this.formBaseInformation.get('cagent_id').setValue(null);
        this.formBaseInformation.get('cagent').setValue('');
      }
      
      if(!this.startProcess){
        // меняем отделение в модуле "Поиск и добавление товара" и перезапускаем модуль
        this.productSearchAndTableComponent.department_id=this.formBaseInformation.get('department_id').value;
        this.productSearchAndTableComponent.doOnInit();
        // this.afterChangeSettings=false;
      }
    }
  }
  //при стирании наименования полностью нужно удалить id покупателя в скрытьм поле cagent_id 
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('cagent_id').setValue(null);
      // this.resetAddressForm();
      // this.resetContactsForm();
      // this.formExpansionPanelsString();
  }};     
  getCagentsList(){ //заполнение Autocomplete
    try {
      if(this.canCagentAutocompleteQuery && this.searchCagentCtrl.value.length>1){
        const body = {
          "searchString":this.searchCagentCtrl.value,
          "companyId":this.formBaseInformation.get('company_id').value};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {return [];}
  }
  getDocumentValuesById(onlyBaseInformation?:boolean){
    this.http.get('/api/auth/getShipmentValuesById?id='+ this.id)
        .subscribe(
            data => { 
              
                let documentValues: DocResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                this.formAboutDocument.get('id').setValue(+documentValues.id);
                this.formAboutDocument.get('master').setValue(documentValues.master);
                this.formAboutDocument.get('creator').setValue(documentValues.creator);
                this.formAboutDocument.get('changer').setValue(documentValues.changer);
                this.formAboutDocument.get('company').setValue(documentValues.company);
                this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                this.formBaseInformation.get('id').setValue(+documentValues.id);
                this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                this.formBaseInformation.get('cagent_id').setValue(documentValues.cagent_id);
                this.formBaseInformation.get('cagent').setValue(documentValues.cagent);
                this.formBaseInformation.get('department_id').setValue(documentValues.department_id);
                this.formBaseInformation.get('department').setValue(documentValues.department);
                this.formBaseInformation.get('shipment_date').setValue(documentValues.shipment_date?moment(documentValues.shipment_date,'DD.MM.YYYY'):"");
                this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                this.formBaseInformation.get('description').setValue(documentValues.description);
                this.formBaseInformation.get('nds').setValue(documentValues.nds);
                this.formBaseInformation.get('nds_included').setValue(documentValues.nds_included);
                // this.formBaseInformation.get('name').setValue(documentValues.name);
                this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                this.formBaseInformation.get('uid').setValue(documentValues.uid);
                this.formBaseInformation.get('is_completed').setValue(documentValues.is_completed);
                this.formBaseInformation.get('customers_orders_id').setValue(documentValues.customers_orders_id);
                this.is_completed=documentValues.is_completed;
                this.department_type_price_id=documentValues.department_type_price_id;
                this.cagent_type_price_id=documentValues.cagent_type_price_id;
                this.default_type_price_id=documentValues.default_type_price_id;
                this.creatorId=+documentValues.creator_id;
                this.searchCagentCtrl.setValue(documentValues.cagent);
                // this.receipt_id = documentValues.receipt_id; //id чека этой отгрузки (0 - чека нет)
                if(!onlyBaseInformation){
                  this.getSpravSysEdizm();//справочник единиц измерения
                  this.getSpravSysNds();// загрузка справочника НДС
                  this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                  this.getPriceTypesList();
                  this.getDepartmentsList();//отделения
                  this.getStatusesList();//статусы документа Отгрузка
                  this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                  this.hideOrShowNdsColumn();//расчет прятать или показывать колонку НДС
                  this.refreshPermissions();//пересчитаем права
                }
                
                this.cheque_nds=documentValues.nds;//нужно ли передавать в кассу (в чек) данные об НДС
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
        );
  }

  //??????????
  getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.shipmentProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.shipmentProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
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
    this.formBaseInformation.value.shipmentProductTable.map(i => 
        {
        if(+i['product_id']==productId){retIndex=formIndex}
        formIndex++;
        });return retIndex;}

  formingProductRowFromApiResponse(row: ShipmentProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      product_id: new FormControl (row.product_id,[]),
      retail_sales_id: new FormControl (+this.id,[]),
      name: new FormControl (row.name,[]),
      product_count: new FormControl (row.product_count,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      edizm: new FormControl (row.edizm,[]),
      edizm_id:  new FormControl (row.edizm_id,[]), 
      product_price:  new FormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),ValidationService.priceMoreThanZero]),
      product_price_of_type_price: new FormControl (row.product_price,[]),
      product_sumprice: new FormControl (this.numToPrice(row.product_sumprice,2),[]),
      available:  new FormControl ((row.total)-(row.reserved),[]),
      price_type:  new FormControl (row.price_type,[]),
      price_type_id: [row.price_type_id],
      nds:  new FormControl (row.nds,[]),
      nds_id: new FormControl (row.nds_id,[]),
      reserve:  new FormControl (row.reserve,[]),// переключатель Резерв
      reserved:  new FormControl (row.reserved,[]), // сколько зарезервировано этого товара в других документах за исключением этого
      total: new FormControl (row.total,[]),
      priority_type_price: new FormControl (row.priority_type_price,[]),// приоритет типа цены: Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      department_id: new FormControl (row.department_id,[]), //id отделения, выбранного в форме поиска 
      department: new FormControl (row.department,[]), //имя отделения, выбранного в форме поиска 
      shipped:  new FormControl (row.shipped,[]),
      ppr_name_api_atol:  new FormControl (row.ppr_name_api_atol,[]), //Признак предмета расчета в системе Атол
      is_material:  new FormControl (row.is_material,[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      reserved_current:  new FormControl (row.reserved_current,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),// зарезервировано единиц товара в отделении (складе) в ЭТОМ (текущем) Заказе покупателя
    });
  }
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

  hideOrShowNdsColumn(){
    if(this.formBaseInformation.get('nds').value){
      this.displayedColumns = ['select','shipment_date','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','nds','department',/*'id','row_id','indx',*/'delete'];
    } else {
      this.displayedColumns = ['select','shipment_date','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','department',/*'id','row_id','indx',*/'delete'];
    }
  }
//????????????????
  // getControlTablefield(){
  //   const control = <FormArray>this.formBaseInformation.get('shipmentProductTable');
  //   return control;
  // }

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
      return this.http.get('/api/auth/isDocumentNumberUnical?company_id='+this.formBaseInformation.get('company_id').value+'&doc_number='+this.formBaseInformation.get('doc_number').value+'&doc_id='+this.id+'&table=retail_sales')
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

  //создание нового документа Отгрузка
  createNewDocument(withReceipt:boolean){// с true запрос придет при нажатии на кнопку Отбить чек
    // if(this.productSearchAndTableComponent && this.productSearchAndTableComponent.getProductTable().length>0){
      console.log('Создание нового документа Отгрузка');
      this.createdDocId=null;
      //если отправляем нового контрагента, в cagent_id отправляем null, и backend понимает что нужно создать нового контрагента:
      this.formBaseInformation.get('cagent_id').setValue(this.is_addingNewCagent?null:this.formBaseInformation.get('cagent_id').value);
      this.getProductsTable();
      this.formBaseInformation.get('uid').setValue(uuidv4());
      this.http.post('/api/auth/insertShipment', this.formBaseInformation.value)
        .subscribe(
        (data) => {
                    this.actionsBeforeGetChilds=0;
                    this.createdDocId=data as number;
                    if (this.createdDocId==0){// 0 возвращает если не удалось сохранить изза превышения количества покупаемого товара над доступным количеством
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Невозможно создать документ. У одной или нескольких позиций количество товара к продаже превышает доступное количество товара"}})
                      this.kkmComponent.kkmIsFree=true; //освобождаем ККМ для приема заданий на следующие чеки
                    } else if (this.createdDocId==null){ //ошибка создания
                      this.openSnackBar("Ошибка создания документа \"Отгрузка\"", "Закрыть");
                      console.log('Отгрузка успешно создана');
                    } else {// Отгрузка успешно создалась в БД 
                      this.openSnackBar("Документ \"Отгрузка\" успешно создан", "Закрыть");
                      console.log('Отгрузка успешно создана');
                      //действия после создания нового документа Отгрузка (это самый последний этап)
                      this.afterCreateShipment(withReceipt);
                      //если нужна печать чека - печатаем чек, по успешному завершению печати создастся событие, 
                      //обработчик которого выплнит действия, идущие после успешной печати чека (например создание новой Отгрузки)
                      if (withReceipt){
                        console.log('Запрос на печать чека из новой Отгрузки');
                        this.kkmComponent.printReceipt(21, this.createdDocId);//21 - Отгрузка);
                      //если печать чека не нужна - переходим сразу к этим действиям (afterCreateShipment)
                      } 
                    }
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});this.kkmComponent.kkmIsFree=true;},
        );
    // } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Невозможно создать продажу без товарных позиций. Сначала необходимо выбрать товар для продажи.'}});}
  }

  // Действия после создания нового документа Отгрузка (это самый последний этап).
  // Делаем эти действия не дожидаясь успешной печати чека. 
  // Иначе может случиться что при неуспешно напечатанном чеке эти действия так и не выполнятся, 
  // и впоследствии, когда чек напечатаем, Отгрузка создастся снова
  afterCreateShipment(withReceipt:boolean){// с true запрос придет при отбиваемом в данный момент чеке
    // Сначала обживаем текущий документ:
    this.id=+this.createdDocId;
    this._router.navigate(['/ui/shipmentdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.setStatusColor();//чтобы обновился цвет статуса
    this.formBaseInformation.get('cagent_id').enable();//иначе при сохранении он не будет отпраляться
    this.productSearchAndTableComponent.hideOrShowNdsColumn();//чтобы убрать столбцы выбора и удаления товара из таблицы
    this.getDocumentValuesById(true);//чтобы обновить значения в Основной информации (например, Покупателя)

    //если чек не отбивается, и стоит чекбокс Автосоздание нового после создания Отгрузки:
    // if(!withReceipt && this.settingsForm.get('autocreate').value)
    //   this.goToNewDocument();

  }

  completeDocument(notShowDialog?:boolean){
    if(!notShowDialog){//notShowDialog=false - показывать диалог
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
          head: 'Проведение отгрузки',
          warning: 'Вы хотите провести данную отгрузку?',
          query: 'После проведения документ станет недоступным для редактирования.'},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.updateDocument(true);
        }
      });
    } else this.updateDocument(true);
  }

  updateDocument(complete?:boolean){ 
    this.getProductsTable();    
    let currentStatus:number=this.formBaseInformation.get('status_id').value;
    if(complete){
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - временно устанавливаем true, временно - чтобы это ушло в запросе на сервер, но не повлияло на внешний вид документа, если вернется не true
      if(this.settingsForm.get('statusIdOnComplete').value){//если в настройках есть "Статус при завершении" - временно выставляем его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnComplete').value);}
    }
    this.http.post('/api/auth/updateShipment',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            if(complete){
              this.formBaseInformation.get('is_completed').setValue(false);//если сохранение с завершением - удаляем временную установку признака завершенности, 
              this.formBaseInformation.get('status_id').setValue(currentStatus);//и возвращаем предыдущий статус
            }
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось создать документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка "+ (complete?"завершения":"сохренения") + " документа \"Отгрузка\""}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для сохранения или проведения документа \"Отгрузка\""}});
                break;
              }
              case 0:{// недостаточно товара на складе
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Количество товара к отгрузке в одной из позиций больше доступного количества товара на складе"}});
                break;
              }
              default:{// Успешно
                this.openSnackBar("Документ \"Отгрузка\" "+ (complete?"проведён.":"сохренён."), "Закрыть");
                this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                if(complete) {
                  this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - окончательно устанавливаем признак завершенности = true
                  this.is_completed=true;
                  this.balanceCagentComponent.getBalance();//пересчитаем баланс покупателя, ведь мы отгрузили ему товар, и теперь он должен больше 
                  if(this.productSearchAndTableComponent){
                    this.productSearchAndTableComponent.hideOrShowNdsColumn(); //чтобы спрятать столбцы после завершения 
                    this.productSearchAndTableComponent.tableNdsRecount();
                  }
                  if(this.settingsForm.get('statusIdOnComplete').value){//если в настройках есть "Статус при завершении" - выставим его
                    this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnComplete').value);}
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
    this.productSearchAndTableComponent.resetFormSearch();
    this.productSearchAndTableComponent.getControlTablefield().clear();
    this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
  }
  //забирает таблицу товаров из дочернего компонента и помещает ее в основную форму
  getProductsTable(){
    const control = <FormArray>this.formBaseInformation.get('shipmentProductTable');
    control.clear();
    this.productSearchAndTableComponent.getProductTable().forEach(row=>{
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
    const dialogSettings = this.SettingsShipmentDialogComponent.open(SettingsShipmentDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      // height: '680px',
      width: '400px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        priceTypesList:   this.receivedPriceTypesList, //список типов цен
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        receivedDepartmentsList: this.receivedDepartmentsList, //список отделений
        company_id: this.formBaseInformation.get('company_id').value, // текущее предприятие (нужно для поиска покупателя)
        department_type_price_id: this.department_type_price_id,
        cagent_type_price_id: this.cagent_type_price_id,
        default_type_price_id: this.default_type_price_id,
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
        if(result.get('customerId')) this.settingsForm.get('customerId').setValue(result.get('customerId').value);
        if(result.get('customer')) this.settingsForm.get('customer').setValue(result.get('customer').value);
        if(result.get('pricingType')) this.settingsForm.get('pricingType').setValue(result.get('pricingType').value);
        if(result.get('plusMinus')) this.settingsForm.get('plusMinus').setValue(result.get('plusMinus').value);
        if(result.get('changePrice')) this.settingsForm.get('changePrice').setValue(result.get('changePrice').value);
        if(result.get('changePriceType')) this.settingsForm.get('changePriceType').setValue(result.get('changePriceType').value);
        if(result.get('shipment_date')) this.settingsForm.get('shipment_date').setValue(result.get('shipment_date').value);
        if(result.get('priorityTypePriceSide')) this.settingsForm.get('priorityTypePriceSide').setValue(result.get('priorityTypePriceSide').value);
        this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
        this.settingsForm.get('saveSettings').setValue(result.get('saveSettings').value);
        this.settingsForm.get('autocreate').setValue(result.get('autocreate').value);
        this.settingsForm.get('statusIdOnComplete').setValue(result.get('statusIdOnComplete').value);
        this.settingsForm.get('showKkm').setValue(result.get('showKkm').value);
        this.settingsForm.get('autoAdd').setValue(result.get('autoAdd').value);
        this.saveSettingsShipment();
        // если это новый документ, и ещё нет выбранных товаров - применяем настройки 
        if(+this.id==0 && this.productSearchAndTableComponent.getProductTable().length==0)  {
          //если в настройках сменили предприятие - нужно сбросить статусы, чтобы статус от предыдущего предприятия не прописался в актуальное
          if(+this.settingsForm.get('companyId').value!= +this.formBaseInformation.get('company_id').value) 
            this.resetStatus();
          this.getData();
        }
        //чтобы настройки применились к модулю Поиск и добавление товара"
        this.productSearchAndTableComponent.applySettings(result);
      }
    });
  }
  saveSettingsShipment(){
    return this.http.post('/api/auth/saveSettingsShipment', this.settingsForm.value)
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
  getSpravSysNds(){
      this.loadSpravService.getSpravSysNds()
        .subscribe((data) => {
          this.spravSysNdsSet=data as any[];
          this.necessaryActionsBeforeGetChilds();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
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

  //принимает от product-search-and-table.component сумму к оплате и передает ее в kkm.component  
  totalSumPriceHandler($event: any) {
    if(this.kkmComponent!=undefined) {
      this.kkmComponent.totalSumPrice=$event; 
      // console.log($event);  
    }
  }  

  sendingProductsTableHandler() {
    this.kkmComponent.productsTable=[];
    this.productSearchAndTableComponent.getProductTable().forEach(row=>{
      this.kkmComponent.productsTable.push(row);
    });
  }

  //создание нового документа
  goToNewDocument(){
      this._router.navigate(['ui/shipmentdoc',0]);
      this.id=0;
      this.clearFormSearchAndProductTable();//очистка формы поиска и таблицы с отобранными товарами
      this.formBaseInformation.get('id').setValue(null);
      this.formBaseInformation.get('uid').setValue('');
      this.formBaseInformation.get('is_completed').setValue(false);
      this.formBaseInformation.get('nds').setValue(false);
      this.formBaseInformation.get('company_id').setValue(null);
      this.formBaseInformation.get('department_id').setValue(null);
      this.formBaseInformation.get('cagent_id').setValue(null);
      this.formBaseInformation.get('doc_number').setValue('');
      this.formBaseInformation.get('cagent').setValue('');
      this.formBaseInformation.get('shipment_date').setValue('');
      this.formBaseInformation.get('description').setValue('');
      this.searchCagentCtrl.reset();
      this.is_completed=false;
      
      this.resetStatus();
      this.getLinkedDocsScheme(true);
      this.actionsBeforeGetChilds=0;
      this.startProcess=true;
  
      this.getData();
      this.clearFormSearchAndProductTable();//очистка формы поиска и таблицы с отобранными на продажу товарами
      this.kkmComponent.clearFields(); //сбрасываем поля "К оплате", "Наличными" и "Сдача" кассового блока
  }

  resetStatus(){
    this.formBaseInformation.get('status_id').setValue(null);
    this.formBaseInformation.get('status_name').setValue('');
    this.formBaseInformation.get('status_color').setValue('ff0000');
    this.formBaseInformation.get('status_description').setValue('');
    this.receivedStatusesList = [];
  }
//**********************************************************************************************************************************************/  
//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/
//**********************************************************************************************************************************************/  

  //создание Списания или Оприходования
  createLinkedDoc(docname:string){// принимает аргументы: Return
    let uid = uuidv4();
    let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDoc.can){
      // this.formLinkedDocs.get('retail_sales_id').setValue(this.id);
      this.formLinkedDocs.get('cagent_id').setValue(this.formBaseInformation.get('cagent_id').value);
      this.formLinkedDocs.get('nds').setValue(this.formBaseInformation.get('nds').value);
      this.formLinkedDocs.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formLinkedDocs.get('department_id').setValue(this.formBaseInformation.get('department_id').value);
      this.formLinkedDocs.get('description').setValue('Создано из Отгрузки №'+ this.formBaseInformation.get('doc_number').value);
      this.formLinkedDocs.get('linked_doc_id').setValue(this.id);//id связанного документа (того, из которого инициируется создание данного документа)
     
      this.formLinkedDocs.get('linked_doc_name').setValue('shipment');//имя (таблицы) связанного документа
      this.formLinkedDocs.get('uid').setValue(uid);

      // параметры для входящих ордеров и платежей (Paymentin, Orderin)
      if(docname=='Paymentin'||docname=='Orderin'){
        this.formLinkedDocs.get('payment_account_id').setValue(null);//id расчтёного счёта      
        this.formLinkedDocs.get('boxoffice_id').setValue(null);
        this.formLinkedDocs.get('summ').setValue(this.productSearchAndTableComponent.totalProductSumm)
        this.formLinkedDocs.get('nds').setValue(this.productSearchAndTableComponent.getTotalNds());
      }
      
      //поля для счёта-фактуры выданного
      this.formLinkedDocs.get('parent_tablename').setValue('shipment');
      this.formLinkedDocs.get('shipment_id').setValue(this.id);

      if(docname=='Invoiceout'){// Счёт покупателю для Отгрузки является родительским, но может быть создан из Отгрузки (Счёт покупателю будет выше по иерархии в диаграмме связей)
        this.formLinkedDocs.get('parent_uid').setValue(uid);// uid исходящего (родительского) документа
        this.formLinkedDocs.get('child_uid').setValue(this.formBaseInformation.get('uid').value);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      } else {
        this.formLinkedDocs.get('parent_uid').setValue(this.formBaseInformation.get('uid').value);// uid исходящего (родительского) документа
        this.formLinkedDocs.get('child_uid').setValue(uid);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      }

      if(docname!=='Vatinvoiceout'&&docname!=='Paymentin'&&docname!=='Orderin')
        this.getProductsTableLinkedDoc(docname);//формируем таблицу товаров для создаваемого документа
      
      this.http.post('/api/auth/insert'+docname, this.formLinkedDocs.value)
      .subscribe(
      (data) => {
                  let createdDocId=data as number;
                  switch(createdDocId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа "+(this.commonUtilites.getDocNameByDocAlias(docname))}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа "+(this.commonUtilites.getDocNameByDocAlias(docname))}});
                      break;
                    }
                    case -20:{//расчётный счёт не определен
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Не удалось определить расчётный счёт для создаваемого документа "+(this.commonUtilites.getDocNameByDocAlias(docname))}});
                      break;
                    }
                    case -21:{//касса не определена
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Не удалось определить кассу для создаваемого документа "+(this.commonUtilites.getDocNameByDocAlias(docname))}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar("Документ "+this.commonUtilites.getDocNameByDocAlias(docname)+" успешно создан", "Закрыть");
                      this.getLinkedDocsScheme(true);//обновляем схему этого документа
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
      );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:canCreateLinkedDoc.reason}});
  }

  
  isRowInCheckedList(rowId):boolean{
    let result:boolean = false;
    this.productSearchAndTableComponent.checkedList.forEach(i=>{
      if(i==rowId)
        result=true;
    });
    return result;
  }
// забирает таблицу товаров из дочернего компонента и помещает ее в форму, предназначенную для создания дочерних документов
  getProductsTableLinkedDoc(docname:string){
    let methodNameProductTable:string;//для маппинга в соответствующие названия сетов в бэкэнде (например private Set<PostingProductForm> postingProductTable;)
    let canAddRow: boolean;
    //Получим название метода для маппинга в соответствующее название сета в бэкэнде (например для аргумента 'Posting' отдаст 'postingProductTable', который замаппится в этоn сет: private Set<PostingProductForm> postingProductTable;)
    methodNameProductTable=this.commonUtilites.getMethodNameByDocAlias(docname);
    const control = <FormArray>this.formLinkedDocs.get(methodNameProductTable);
    control.clear();
    this.productSearchAndTableComponent.getProductTable().forEach(row=>{
      if(this.productSearchAndTableComponent.checkedList.length>0){  //если есть выделенные чекбоксами позиции - надо взять только их, иначе берем все позиции
        canAddRow=this.isRowInCheckedList(row.row_id)
      }
      else canAddRow=true;
      if(canAddRow)
          control.push(this.formingProductRowLinkedDoc(row));
    });
  }
  formingProductRowLinkedDoc(row: ShipmentProductTable) {
    return this._fb.group({
      product_id: new FormControl (row.product_id,[]),
      department_id: new FormControl (row.department_id,[]),
      product_count: new FormControl (row.product_count,[]),
      product_price:  new FormControl (row.product_price,[]),
      product_sumprice: new FormControl (((row.product_count)*row.product_price).toFixed(2),[]),
      nds_id:  new FormControl (row.nds_id,[]),
    });
  }
  // можно ли создать связанный документ (да - если есть товары, подходящие для этого)
  canCreateLinkedDoc(docname:string):CanCreateLinkedDoc{
    if(!(this.productSearchAndTableComponent && this.productSearchAndTableComponent.getProductTable().length>0)){
        return {can:false, reason:'Невозможно создать '+this.commonUtilites.getDocNameByDocAlias(docname)+', так как нет товарных позиций'};
    }else
      return {can:true, reason:''};
  }
//******************************************************** ДИАГРАММА СВЯЗЕЙ ************************************************************/
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
    if(!this.linkedDocsSchemeDisplayed) this.loadingDocsScheme=true;
    setTimeout(() => { this.drawLinkedDocsScheme(); }, 500);
  }
    
}
getLinkedDocsScheme(draw?:boolean){
  let result:any;
  this.loadingDocsScheme=true;
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
      graphviz("#graph").renderDot(this.linkedDocsText);
      this.loadingDocsScheme=false;
      this.linkedDocsSchemeDisplayed = true;
    } catch (e){
      this.loadingDocsScheme=false;
      console.log(e.message);
    }
  } else this.loadingDocsScheme=false;
}

//**************************** КАССОВЫЕ ОПЕРАЦИИ  ******************************/
  //принимает от кассового модуля запрос на итоговую цену. цена запрашивается у returnProductsTableComponent и отдаётся в totalSumPriceHandler обратно в кассовый модуль
  getTotalSumPriceHandler() {
    if(this.productSearchAndTableComponent!=undefined) {
      this.productSearchAndTableComponent.finishRecount();
    }
  }  
  //обработчик события успешной печати чека - в Заказе покупателя это выставление статуса документа, сохранение и создание нового.  
  onSuccesfulChequePrintingHandler(){
    console.log("Чек был успешно напечатан");
    this.openSnackBar("Чек был успешно напечатан", "Закрыть");
    //если стоит чекбокс Автосоздание нового после создания Отгрузки:
    // if(this.settingsForm.get('autocreate').value){
    //   this.goToNewDocument();
    // }
  }
  //обработка события нажатия на кнопку "Отбить чек", испущенного в компоненте кассовых операций
  onClickChequePrintingHandler(){
    if (+this.id>0){//если Отгрузка уже была создана ранее, и нажали Отбить чек
      //нужно сделать запрос, создавался ли из этой Отгрузки чек такого типа ранее
      console.log('Отгрузка производит запрос, создавался ли из этой Отгрузки чек такого типа (sell) ранее');
      this.http.get('/api/auth/isReceiptPrinted?company_id='+this.formBaseInformation.get('company_id').value+
      '&document_id=21'+'&id='+(this.id)+'&operation_id='+(this.kkmComponent?this.kkmComponent.operationId:'sell'))// за id операции выбираем тот, что сейчас выбран в модуле ККМ
      .subscribe(
          (data) => {   
                      const result=data as boolean;
                      if (result){
                        console.log('Чек sell ранее печатался.')
                        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Чек такого типа уже отбивался из данной Отгрузки'}});
                        this.kkmComponent.kkmIsFree=true;
                      }
                      else {
                        console.log('Чек sell ранее не печатался. Обращаемся к кассовому модулю с заданием напечатать чек (printReceipt)')
                        this.kkmComponent.printReceipt(21, this.id);//21 - Отгрузка
                      }
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});this.kkmComponent.kkmIsFree=true;},
      )
    } else { //если отгрузка еще не создана:
      console.log('Отгрузка еще не создана');
      this.createNewDocument(true) //отправляем запрос на создание отгрузки с параметром withReceipt=true (с печатью чека)
    }
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

  getSetOfTypePrices(){
    return this.http.get('/api/auth/getSetOfTypePrices?company_id='+this.formBaseInformation.get('company_id').value+
    '&department_id='+(+this.formBaseInformation.get('department_id').value)+'&cagent_id='+(+this.formBaseInformation.get('cagent_id').value))
      .subscribe(
          (data) => {   
                      const setOfTypePrices=data as any;
                      this.department_type_price_id=setOfTypePrices.department_type_price_id;
                      this.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                      this.default_type_price_id=setOfTypePrices.default_type_price_id;
                      if(!this.startProcess){
                        this.productSearchAndTableComponent.department_type_price_id=setOfTypePrices.department_type_price_id;
                        this.productSearchAndTableComponent.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                        this.productSearchAndTableComponent.default_type_price_id=setOfTypePrices.default_type_price_id;
                        console.log("parent department_type_price_id - "+this.department_type_price_id);
                        this.productSearchAndTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
                      } 
                        
                      if(this.startProcess) 
                        this.checkAnyCases();
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
  }

}

