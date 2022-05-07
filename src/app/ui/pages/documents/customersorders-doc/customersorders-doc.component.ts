import { ChangeDetectorRef, Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
// import { KkmAtolService } from '../../../../services/kkm_atol';
// import { KkmAtolChequesService } from '../../../../services/kkm_atol_cheques';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, tap, switchMap, mergeMap, concatMap  } from 'rxjs/operators';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { graphviz }  from 'd3-graphviz';
import { SettingsCustomersordersDialogComponent } from 'src/app/modules/settings/settings-customersorders-dialog/settings-customersorders-dialog.component';
import { ProductSearchAndTableComponent } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.component';
import { BalanceCagentComponent } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.component';
import { TemplatesDialogComponent } from 'src/app/modules/settings/templates-dialog/templates-dialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatAccordion } from '@angular/material/expansion';
import { DelCookiesService } from './del-cookies.service';
import { Router, NavigationExtras  } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { Input } from '@angular/core';
import { translate } from '@ngneat/transloco'; //+++

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface RetailSalesProductTable {
  product_id: any,
  department_id: any,
  product_count: any,
  product_price: any,
  price_type_id: any,
  is_material: boolean,
  product_price_of_type_price: any,
  product_sumprice: any,
  nds_id: any,
  edizm: string,
  ppr_name_api_atol: string,
  name: string,
  available: any,
  reserved: any,
  total: any,
  priority_type_price: string,
  shipped: any,
  reserved_current: any,
}
interface CustomersOrdersProductTable { //интерфейс для формы, массив из которых будет содержать форма customersOrdersProductTable, входящая в formBaseInformation, которая будет включаться в formBaseInformation
  id: number;
  row_id: number;
  product_id: number;
  customers_orders_id:number;
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
interface IdAndName_ru{
  id: number;
  name_ru: string;
}
interface SpravTaxesSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}
interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}
interface Region{
  id: number;
  name_ru: string;
  country_id: number;
  country_name_ru: string;
}
interface City{
  id: number;
  name_ru: string;
  country_id: number;
  country_name_ru: string;
  region_id: number;
  region_name_ru: string;
  area_ru: string;
}
interface docResponse {//интерфейс для получения ответа в методе getCustomersOrdersValuesById
  id: number;
  company: string;
  company_id: number;
  department: string;
  department_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  is_completed: boolean;
  changer:string;
  nds: boolean;
  cagent: string;
  cagent_id: number;
  nds_included: boolean;
  changer_id: number;
  doc_number: string;
  shipment_date: string;//планируемая дата отгрузки
  date_time_changed: string;
  date_time_created: string;
  description : string;
  // overhead: string;
  is_archive: boolean;
  department_type_price_id: number;
  cagent_type_price_id: number;
  default_type_price_id: number;
  name: string;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  uid:string;
  fio: string;
  email: string;
  telephone: string;
  zip_code: string;
  country_id: string;
  region_id: string;
  city_id: number;
  additional_address: string;
  track_number: string;
  country: string;
  region: string;
  area: string;
  city: string;
  street: string;
  home: string;
  flat: string;
}

interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface idNameDescription{
  id: number;
  name: string;
  description: string;
}
interface idAndNameAndShorname{ //универсалный интерфейс для выбора из справочников
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
interface statusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
interface TemplatesList{
    id: number;                   // id из таблицы template_docs
    company_id: number;           // id предприятия, для которого эти настройки
    template_type_name: string;   // наименование шаблона. Например, Товарный чек
    template_type: string;        // обозначение типа шаблона. Например, для товарного чека это product_receipt
    template_type_id: number;     // id типа шаблона
    file_id: number;              // id из таблицы files
    file_name: string;            // наименование файла как он хранится на диске
    file_original_name: string;   // оригинальное наименование файла
    document_id: number;          // id документа, в котором будет возможность печати данного шаблона (соответствует id в таблице documents)
    is_show: boolean;             // показывать шаблон в выпадающем списке на печать
    output_order: number;         // порядок вывода наименований шаблонов в списке на печать
}

@Component({
  selector: 'app-customersorders-doc',
  templateUrl: './customersorders-doc.component.html',
  styleUrls: ['./customersorders-doc.component.css'],
  providers: [LoadSpravService,
    // KkmAtolService,
    // KkmAtolChequesService,
    Cookie,DelCookiesService,ProductSearchAndTableComponent,BalanceCagentComponent,
    // KkmComponent,
    CommonUtilitesService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})

export class CustomersordersDocComponent implements OnInit/*, OnChanges */{

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedUsersList  : any [];//массив для получения списка пользователей
  myCompanyId:number=0;
  
  allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  myId:number=0;
  creatorId:number=0;
  is_addingNewCagent: boolean = false; // при создании документа создаём нового получателя (false) или ищем уже имеющегося (true)
  panelContactsOpenState = true;
  panelAddressOpenState = false;
  addressString: string = ''; // строка для свёрнутого блока Адрес
  gettingTableData:boolean=false;//идет загрузка данных - нужно для спиннера
  canCreateNewDoc: boolean=false;// можно ли создавать новый документ (true если выполнились все необходимые для создания действия)
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeCreateNewDoc:number=0;// количество выполненных действий, необходимых чтобы создать новый документ
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (форму товаров)
  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  netCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
 priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation

  department_type_price_id: number; //id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  cagent_type_price_id: number; //id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  default_type_price_id: number; //id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  spravTaxesSet: SpravTaxesSet[] = []; //массив имен и id для ндс 
  secondaryDepartments:SecondaryDepartment[]=[];// склады в выпадающем списке складов формы поиска товара
  spravSysEdizmOfProductAll: idAndNameAndShorname[] = [];// массив, куда будут грузиться все единицы измерения товара
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен

  //печать документов
  gettingTemplatesData: boolean = false; // идёт загрузка шаблонов
  templatesList:TemplatesList[]=[]; // список загруженных шаблонов

  //поиск адреса и юр. адреса (Страна, Район, Город):
  // Страны 
  spravSysCountries: IdAndName_ru[] = [];// массив, куда будут грузиться все страны 
  filteredSpravSysCountries: Observable<IdAndName_ru[]>; //массив для отфильтрованных Страна 
  // Регионы
  //для поиска района по подстроке
  searchRegionCtrl = new FormControl();//поле для поиска
  isRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredRegions: Region[];//массив для загрузки найденных по подстроке регионов
  // Города
  //для поиска района по подстроке
  searchCityCtrl = new FormControl();//поле для поиска
  isCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCities: City[];//массив для загрузки найденных по подстроке городов
  // Районы 
  area:string = '';

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: FormGroup; //массив форм для накопления информации о Заказе покупателя
  settingsForm: any; // форма с настройками
  globalSettingsForm: any; // форма с общими настройками
  formLinkedDocs:any// Форма для отправки при создании Возврата покупателя

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  //для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу)
  loadingDocsScheme:boolean = false;
  linkedDocsSchemeDisplayed:boolean = false;
  showGraphDiv:boolean=true;

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

  //****************************                   Взаимодействие с ККМ                    ************************************
  cheque_nds=false; //нужно ли проставлять НДС в чеке.

  displayedColumns:string[];
  @ViewChild("countInput", {static: false}) countInput;
  @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("doc_number", {static: false}) doc_number; 
  @ViewChild("form", {static: false}) form; 
  @ViewChild("formCashierLogin", {static: false}) formCashierLogin; 
  @ViewChild("formBI", {static: false}) formBI; 
  @ViewChild(MatAccordion) accordion: MatAccordion;
  @ViewChild(ProductSearchAndTableComponent, {static: false}) public productSearchAndTableComponent:ProductSearchAndTableComponent;
  // @ViewChild(KkmComponent, {static: false}) public kkmComponent:KkmComponent;
  @ViewChild(BalanceCagentComponent, {static: false}) public balanceCagentComponent:BalanceCagentComponent;
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  @Input() authorized: boolean;

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  is_completed=false;

  //для поиска контрагента (получателя) по подстроке
  searchCagentCtrl = new FormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;

  constructor(
    private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: FormBuilder, //чтобы билдить группу форм customersOrdersProductTable
    private http: HttpClient,
    public ShowImageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private templatesDialogComponent: MatDialog,
    public commonUtilites: CommonUtilitesService,
    public dialogAddFiles: MatDialog,
    public ProductReservesDialogComponent: MatDialog,
    public PricingDialogComponent: MatDialog,
    public SettingsCustomersordersDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private _router:Router,
    private _adapter: DateAdapter<any>) 
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
      shipment_date: new FormControl      ('',[Validators.required]),
      description: new FormControl        ('',[]),
      department: new FormControl         ('',[]),
      is_completed: new FormControl       (false,[]),
      customersOrdersProductTable: new FormArray([]),
      nds: new FormControl                (false,[]),
      nds_included: new FormControl       (true,[]),
      name: new FormControl               ('',[]),
      status_id: new FormControl          ('',[]),
      status_name: new FormControl        ('',[]),
      status_color: new FormControl       ('',[]),
      status_description: new FormControl ('',[]),
      fio: new FormControl                ('',[]),
      email: new FormControl              ('',[]),
      telephone: new FormControl          ('',[]),
      zip_code: new FormControl           ('',[]),
      country_id: new FormControl         ('',[]),
      // region_id: new FormControl          ('',[]),
      // city_id: new FormControl            ('',[]),
      additional_address: new FormControl ('',[]),
      track_number: new FormControl       ('',[]),
      country: new FormControl            ('',[]),
      region: new FormControl             ('',[]),
      city: new FormControl               ('',[]),
      new_cagent: new FormControl          ({disabled: true, value: '' },[Validators.required]),
      street:  new FormControl            ('',[Validators.maxLength(120)]),
      home:  new FormControl              ('',[Validators.maxLength(16)]),
      flat:  new FormControl              ('',[Validators.maxLength(8)]),
      discount_card:   new FormControl    ('',[Validators.maxLength(30)]),
      uid: new FormControl                ('',[]),// uuid идентификатор для создаваемой отгрузки
    });
    // Форма для отправки при создании связанных документов
    this.formLinkedDocs = new FormGroup({
      customers_orders_id: new FormControl    (null,[]),
      date_return: new FormControl        ('',[]),
      summ: new FormControl               ('',[]),
      nds: new FormControl                ('',[]),
      nds_included: new FormControl       ('',[]),
      is_completed: new FormControl       (null,[]),
      cagent_id: new FormControl          (null,[Validators.required]),
      company_id: new FormControl         (null,[Validators.required]),
      department_id: new FormControl      (null,[Validators.required]),
      description: new FormControl        ('',[]),
      shipment_date: new FormControl      ('',[Validators.required]),
      retailSalesProductTable: new FormArray([]),
      shipmentProductTable: new FormArray   ([]),
      invoiceoutProductTable: new FormArray   ([]),
      linked_doc_id: new FormControl      (null,[]),//id связанного документа (в данном случае Отгрузка)
      parent_uid: new FormControl         (null,[]),// uid родительского документа
      child_uid: new FormControl          (null,[]),// uid дочернего документа
      linked_doc_name: new FormControl    (null,[]),//имя (таблицы) связанного документа
      uid: new FormControl                ('',[]),  //uid создаваемого связанного документа
      // параметры для входящих ордеров и платежей
      payment_account_id: new FormControl ('',[]),//id расчтёного счёта      
      boxoffice_id: new FormControl       ('',[]), // касса предприятия или обособленного подразделения
      internal: new FormControl           (false,[]), // внутренний платеж     

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

    // // Форма настроек
    // this.settingsForm = new FormGroup({
    //   // Валюта (краткое наименование)
    //   currShortName: new FormControl             (null,[]),
    // });


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
      autocreateOnStart: new FormControl        (false,[]),
      //статус при проведении
      statusIdOnAutocreateOnCheque: new FormControl(null,[]),
    });

    //формы по кассе :
    //форма настроек кассира
    /*this.kassaSettingsForm = new FormGroup({
      selected_kassa_id: new FormControl             (null,[Validators.required]), // id кассы
      cashier_value_id: new FormControl         ('current',[Validators.required]), //кассир: 'current'-текущая учетная запись, 'another'-другая учетная запись, 'custom' произвольные ФИО
      customCashierFio: new FormControl         ('',[Validators.required]), // значение поля ФИО при выборе пункта "Произвольное ФИО"
      customCashierVatin: new FormControl       ('',[Validators.required,Validators.pattern('^[0-9]{12}$'),Validators.maxLength(12),Validators.minLength(12)]),// значение поля ИНН при выборе пункта "Произвольное ФИО"
      billing_address: new FormControl           ('settings',[]),// id адреса места расчётов. 'settings' - как в настройках кассы, 'customer' - брать из адреса заказчика, 'custom' произвольный адрес. Если 2 или 3 нет но один из них выбран - печатается settings
      custom_billing_address: new FormControl     ('',[Validators.required]),// адрес места расчетов типа г.Такой-то, ул.... и т.д.
    });
    //логин другого кассира
    this.loginform = new FormGroup({
      username: new FormControl ('',[Validators.required,Validators.minLength(6)]),
      password: new FormControl ('',[Validators.required]),
    });
    if(Cookie.get('anotherCashierVatin')=='undefined' || Cookie.get('anotherCashierVatin')==null)    
      Cookie.set('anotherCashierVatin',''); else this.anotherCashierVatin=Cookie.get('anotherCashierVatin');

    if(Cookie.get('anotherCashierFio')=='undefined' || Cookie.get('anotherCashierFio')==null)    
      Cookie.set('anotherCashierFio',''); else this.anotherCashierFio=Cookie.get('anotherCashierFio');

    this.kassaSettingsForm.get("customCashierFio").disable();
    this.kassaSettingsForm.get("customCashierVatin").disable();
*/

    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.getSetOfPermissions();//
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
    this.getBaseData('myDepartmentsList');    

    //слушалки на изменение полей адреса
    this.filteredSpravSysCountries=this.formBaseInformation.get('country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_country(value)));
    // this.onRegionSearchValueChanges();
    // this.onCitySearchValueChanges();

  }
  ngAfterContentChecked() {

    this.cdRef.detectChanges();

  }
  get childFormValid() {
    if(this.productSearchAndTableComponent!=undefined)
    //если нет ошибок в форме, включая отсутствие дробного количества у неделимых товаров
      return (this.productSearchAndTableComponent.getControlTablefield().valid && !this.productSearchAndTableComponent.indivisibleErrorOfProductTable);
    else return true;    //чтобы не было ExpressionChangedAfterItHasBeenCheckedError. Т.к. форма создается пустая и с .valid=true, а потом уже при заполнении проверяется еще раз.
  }
  get sumPrice() {
    if(this.productSearchAndTableComponent!=undefined){
      return this.productSearchAndTableComponent.totalProductSumm;
    } else return 0;
  }
  get sumNds() {
    if(this.productSearchAndTableComponent!=undefined){
      return this.productSearchAndTableComponent.getTotalNds();
    } else return 0;
  }
  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=23')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==280)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==281)});
    this.allowToCreateMyDepartments = this.permissionsSet.some(        function(e){return(e==282)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==287)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==288)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==289)});
    this.allowToViewMyDocs = this.permissionsSet.some(                 function(e){return(e==290)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==291)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==292)});
    this.allowToUpdateMyDepartments = this.permissionsSet.some(        function(e){return(e==293)});
    this.allowToUpdateMyDocs = this.permissionsSet.some(               function(e){return(e==294)});
    this.allowToCompleteAllCompanies = this.permissionsSet.some(       function(e){return(e==400)});
    this.allowToCompleteMyCompany = this.permissionsSet.some(          function(e){return(e==401)});
    this.allowToCompleteMyDepartments = this.permissionsSet.some(      function(e){return(e==402)});
    this.allowToCompleteMyDocs = this.permissionsSet.some(             function(e){return(e==403)});
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

  refreshPermissions(){
    // alert(2)
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
    
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.allowToUpdate;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // return true;
    this.rightsDefined=true;//!!!
    this.necessaryActionsBeforeAutoCreateNewDoc();
    this.necessaryActionsBeforeGetChilds();
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
      this.setDefaultDate();
      this.accordion.openAll();
      this.getSpravSysCountries();
    }

  }
  // т.к. всё грузится и обрабатывается асинхронно, до авто-создания документа необходимо чтобы выполнились все нужные для этого действия
  necessaryActionsBeforeAutoCreateNewDoc(){
    if(+this.id==0){
      // canCreateNewDoc
      this.actionsBeforeCreateNewDoc++;
      //Если набрано необходимое кол-во действий для создания вручную (по кнопке)
      if(this.actionsBeforeCreateNewDoc==4) this.canCreateNewDoc=true;
      
      if(
        this.actionsBeforeCreateNewDoc==5 && //Если набрано необходимое кол-во действий для АВТОсоздания
        this.settingsForm.get('autocreateOnStart').value && //и есть автоматическое создание на старте (autocreateOnStart)
        +this.formBaseInformation.get('department_id').value>0 && // и отделение выбрано
        +this.formBaseInformation.get('cagent_id').value>0 // и покупатель выбран
      ){
        this.canCreateNewDoc=true;
        // alert(this.actionsBeforeGetChilds)
        this.createNewDocument();
      }
    }
  }
  //нужно загруить всю необходимую информацию, прежде чем вызывать детей (Поиск и добавление товара, Кассовый модуль), иначе их ngOnInit выполнится быстрее, чем загрузится вся информация в родителе
  //вызовы из:
  //getDocumentValuesById()-> getPriceTypesList()*
  //getDocumentValuesById()-> refreshPermissions()
  //getDocumentValuesById()-> getSettings()*
  //getDocumentValuesById()-> getSpravTaxes()
  //getDocumentValuesById()-> getSetOfTypePrices() 
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    //Если набрано необходимое кол-во действий
    if(this.actionsBeforeGetChilds==5){
      // console.log("company - "+this.formAboutDocument.get('company').value);
      // console.log("default_type_price_id - "+this.default_type_price_id);
      // console.log("priorityTypePriceSide - "+this.settingsForm.get('priorityTypePriceSide').value);
      this.canGetChilds=true;
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
          this.getMyDepartmentsList();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getMyDepartmentsList();
  }
  getMyDepartmentsList(){ //+++
    if(this.receivedMyDepartmentsList.length==0)
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.getCRUD_rights();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getCRUD_rights();
  }

  onCompanyChange(){
    this.formBaseInformation.get('department_id').setValue(null);
    this.formBaseInformation.get('cagent_id').setValue(null);
    this.formBaseInformation.get('cagent').setValue('');
    
    this.resetAddressForm();
    this.resetContactsForm();
    this.formBaseInformation.get('status_id').setValue(null);
    this.searchCagentCtrl.setValue('');
    this.actionsBeforeGetChilds=0;

    this.formAboutDocument.get('company').setValue(this.getCompanyNameById(this.formBaseInformation.get('company_id').value));

    this.getDepartmentsList();
    this.getPriceTypesList();
    this.getSpravTaxes(this.formBaseInformation.get('company_id').value);//загрузка налогов
    this.formExpansionPanelsString();
  }

  onDepartmentChange(){
      this.getSetOfTypePrices();
      this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
      this.productSearchAndTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);
      // if(this.kkmComponent){
      //   this.kkmComponent.department_id=this.formBaseInformation.get('department_id').value;
      //   this.kkmComponent.getKassaListByDepId();
      // }
  }


  resetAddressForm(){
    this.formBaseInformation.get('zip_code').setValue('');         
    this.formBaseInformation.get('country_id').setValue('');          
    // this.formBaseInformation.get('region_id').setValue('');           
    // this.formBaseInformation.get('city_id').setValue('');             
    this.formBaseInformation.get('additional_address').setValue('');   
    this.formBaseInformation.get('track_number').setValue('');        
    this.formBaseInformation.get('country').setValue('');             
    this.formBaseInformation.get('region').setValue('');              
    this.formBaseInformation.get('city').setValue('');  
    this.formBaseInformation.get('street').setValue('');
    this.formBaseInformation.get('home').setValue('');
    this.formBaseInformation.get('flat').setValue('');
    this.searchRegionCtrl.setValue('');              
    this.searchCityCtrl.setValue('');              
  }
  resetContactsForm(){
    this.formBaseInformation.get('email').setValue('');               
    this.formBaseInformation.get('telephone').setValue('');           
  }
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    // this.formBaseInformation.get('department_id').setValue('');
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
      .subscribe(
          (data) => {this.receivedDepartmentsList=data as any [];
            this.doFilterDepartmentsList();
            if(+this.id==0) this.setDefaultDepartment();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }


  setDefaultDepartment(){
    //если в настройках не было предприятия, и в списке предприятий только одно предприятие - ставим его по дефолту
    if(+this.formBaseInformation.get('department_id').value==0 && this.receivedDepartmentsList.length==1){
      this.formBaseInformation.get('department_id').setValue(this.receivedDepartmentsList[0].id);
      //Если дочерние компоненты уже загружены - устанавливаем данный склад как склад в форме поиска и добавления товара
      if(this.canGetChilds){
        this.productSearchAndTableComponent.formSearch.get('secondaryDepartmentId').setValue(this.formBaseInformation.get('department_id').value);  
        this.productSearchAndTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
      }
    }
    //если отделение было выбрано (через настройки или же в этом методе) - определяем его наименование (оно будет отправляться в дочерние компоненты)
    if(+this.formBaseInformation.get('department_id').value>0)
    this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
    
    //загрузка типов цен для покупателя, склада и по умолчанию  
    this.getSetOfTypePrices();
    //различные проверки
    this.checkAnyCases();
    this.getStatusesList();    
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
    // if(!this.canGetChilds) this.refreshPermissions();
  }

  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,23) //23 - id предприятия из таблицы documents
            .subscribe(
                (data) => {this.receivedStatusesList=data as statusInterface[];
                  if(+this.id==0){this.setDefaultStatus();}},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
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
    this.refreshPermissions();
  }

  getSpravSysEdizm():void {    
    let companyId=+this.formBaseInformation.get('company_id').value;
    this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5)"})  // все типы ед. измерения
    .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
            },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

  setDefaultDate(){
    this.formBaseInformation.get('shipment_date').setValue(moment());
    this.necessaryActionsBeforeAutoCreateNewDoc();
  }
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)//!!!!! отсюда загружаем настройки только если документ новый. Если уже создан - настройки грузятся из get<Document>ValuesById
      this.getSettings(); // настройки документа Заказ покупателя
  }
  doFilterDepartmentsList(){
    // console.log('doFilterDepartmentsList');
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
    this.secondaryDepartments=this.receivedDepartmentsList;
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
    // alert("this.receivedDepartmentsList.length - "+this.receivedDepartmentsList.length)
    this.receivedDepartmentsList.forEach(depth =>{
      depth.id==id?inDepthsId=true:null;
    });
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
    this.getCagentValuesById(id);
    //Загрузим тип цены для этого Покупателя, и 
    //если в форме поиска товаров приоритет цены выбран Покупатель, то установится тип цены этого покупателя (если конечно он у него есть)
    this.getSetOfTypePrices();
  }

  getCagentValuesById(id:number){
    const body = {"id": id};
    this.http.post('/api/auth/getCagentValues', body).subscribe(
        data => { 
            let documentValues: docResponse=data as any;

            this.formBaseInformation.get('telephone').setValue(documentValues.telephone==null?'':documentValues.telephone);
            this.formBaseInformation.get('email').setValue(documentValues.email==null?'':documentValues.email);
            this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code==null?'':documentValues.zip_code);
            this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
            // this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
            // this.formBaseInformation.get('city_id').setValue(documentValues.city_id);            
            this.formBaseInformation.get('region').setValue(documentValues.region);
            this.formBaseInformation.get('city').setValue(documentValues.city);
            this.formBaseInformation.get('street').setValue(documentValues.street==null?'':documentValues.street);
            this.formBaseInformation.get('home').setValue(documentValues.home==null?'':documentValues.home);
            this.formBaseInformation.get('flat').setValue(documentValues.flat==null?'':documentValues.flat);
            this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address==null?'':documentValues.additional_address);
            this.searchRegionCtrl.setValue(documentValues.region==null?'':documentValues.region);
            this.area=documentValues.area==null?'':documentValues.area;
            this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
            if(+this.formBaseInformation.get('country_id').value!=0)
            {
              this.spravSysCountries.forEach(x => {
                if(x.id==this.formBaseInformation.get('country_id').value){
                  this.formBaseInformation.get('country').setValue(x.name_ru);
                }
              })
            }
            this.formExpansionPanelsString();
            this.necessaryActionsBeforeAutoCreateNewDoc();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  
  //загрузка настроек
  getSettings(){
    // alert(3)
    let result:any;
    this.http.get('/api/auth/getSettingsCustomersOrders')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
           
            this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'priceType');
            this.settingsForm.get('priceTypeId').setValue(result.priceTypeId);
            this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
            this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:50);
            this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
            this.settingsForm.get('hideTenths').setValue(result.hideTenths);
            this.settingsForm.get('saveSettings').setValue(result.saveSettings);
            this.settingsForm.get('name').setValue(result.name?result.name:'');
            this.settingsForm.get('priorityTypePriceSide').setValue(result.priorityTypePriceSide?result.priorityTypePriceSide:'defprice');
            this.settingsForm.get('autocreateOnStart').setValue(result.autocreateOnStart);
            
            this.necessaryActionsBeforeGetChilds();
            // для нового документа
            if(+this.id==0){
              //если предприятия из настроек больше нет в списке предприятий (например, для пользователя урезали права, и выбранное предприятие более недоступно)
              //необходимо не загружать эти настройки
              if(this.isCompanyInList(+result.companyId)){
                this.settingsForm.get('companyId').setValue(result.companyId);
                this.settingsForm.get('departmentId').setValue(result.departmentId);
                this.settingsForm.get('customerId').setValue(result.customerId);
                this.settingsForm.get('customer').setValue(result.customer);
                this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(result.statusIdOnAutocreateOnCheque);
              }
                //вставляем Отделение и Покупателя (вставится только если новый документ)
              this.setDefaultInfoOnStart(+result.departmentId,+result.customerId,result.customer,result.name?result.name:'');
              this.setDefaultCompany();
            }
            
            
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  setDefaultCompany(){
    if(+this.formBaseInformation.get('company_id').value==0)//если в настройках не было предприятия - ставим своё по дефолту
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.getDepartmentsList(); 
    this.getPriceTypesList();
    this.getSpravTaxes(this.formBaseInformation.get('company_id').value);//загрузка налогов
  }
  //если новый документ - вставляем Отделение и Покупателя (но только если они принадлежат выбранному предприятию, т.е. предприятие в Основной информации и предприятие, для которого были сохранены настройки совпадают)
  setDefaultInfoOnStart(departmentId:number, customerId:number, customer:string, name:string){
    if(+this.id==0){//документ новый
      // if(+this.formBaseInformation.get('company_id').value==+this.settingsForm.get('companyId').value || +this.formBaseInformation.get('company_id').value==0){
        this.formBaseInformation.get('company_id').setValue(+this.settingsForm.get('companyId').value)
        if(+departmentId>0){
          this.formBaseInformation.get('department_id').setValue(departmentId);
        }
        if(+customerId>0){
          this.searchCagentCtrl.setValue(customer);
          this.formBaseInformation.get('cagent_id').setValue(customerId);
          this.getCagentValuesById(customerId);
        } else {
          this.searchCagentCtrl.setValue('');
          this.formBaseInformation.get('cagent_id').setValue(null);
        }
        if(this.formBaseInformation.get('name').value=='')
          this.formBaseInformation.get('name').setValue(name);
      // }
      this.necessaryActionsBeforeAutoCreateNewDoc();
    }
  }
  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }
  //при стирании наименования полностью нужно удалить id покупателя в скрытьм поле cagent_id 
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('cagent_id').setValue(null);
      this.resetAddressForm();
      this.resetContactsForm();
      this.formExpansionPanelsString();
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
  getDocumentValuesById(){
    this.http.get('/api/auth/getCustomersOrdersValuesById?id='+ this.id)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //!!!
                if(data!=null&&documentValues.company_id!=null){
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
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                  this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                  this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                  this.formBaseInformation.get('fio').setValue(documentValues.fio);
                  this.formBaseInformation.get('email').setValue(documentValues.email);
                  this.formBaseInformation.get('telephone').setValue(documentValues.telephone);
                  this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code);
                  this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
                  // this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
                  // this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
                  this.formBaseInformation.get('street').setValue(documentValues.street);
                  this.formBaseInformation.get('home').setValue(documentValues.home);
                  this.formBaseInformation.get('flat').setValue(documentValues.flat);
                  this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address);
                  this.formBaseInformation.get('track_number').setValue(documentValues.track_number);
                  this.formBaseInformation.get('country').setValue(documentValues.country);
                  this.formBaseInformation.get('region').setValue(documentValues.region);
                  this.formBaseInformation.get('city').setValue(documentValues.city);
                  this.formBaseInformation.get('uid').setValue(documentValues.uid);
                  this.searchRegionCtrl.setValue(documentValues.region);
                  this.area=documentValues.area;
                  this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
                  if(+this.formBaseInformation.get('country_id').value!=0)
                  {
                    this.spravSysCountries.forEach(x => {
                      if(x.id==this.formBaseInformation.get('country_id').value){
                        this.formBaseInformation.get('country').setValue(x.name_ru);
                      }
                    })
                  }
                  this.department_type_price_id=documentValues.department_type_price_id;
                  this.cagent_type_price_id=documentValues.cagent_type_price_id;
                  this.default_type_price_id=documentValues.default_type_price_id;
                  this.creatorId=+documentValues.creator_id;
                  this.searchCagentCtrl.setValue(documentValues.cagent);
                  this.is_completed=documentValues.is_completed;
                  this.getSpravSysEdizm();//справочник единиц измерения
                  this.getSetOfTypePrices(); //загрузка цен по типам цен для выбранных значений (предприятие, отделение, контрагент)
                  this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                  this.formExpansionPanelsString();
                  this.getPriceTypesList();
                  this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                  this.getDepartmentsList();//отделения
                  this.getStatusesList();//статусы документа Заказ покупателя
                  this.getSpravSysCountries();//Страны
                  this.hideOrShowNdsColumn();//расчет прятать или показывать колонку НДС
                  this.getSettings(); // настройки документа Заказ покупателя
                  this.getSpravTaxes(this.formBaseInformation.get('company_id').value);//загрузка налогов
                  this.cheque_nds=documentValues.nds;//нужно ли передавать в кассу (в чек) данные об НДС
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }
  
  formExpansionPanelsString(){
    this.addressString='';
    if(this.formBaseInformation.get('zip_code').value!='') this.addressString+=this.formBaseInformation.get('zip_code').value+' ';
    if(this.formBaseInformation.get('country').value!='') this.addressString+=this.formBaseInformation.get('country').value+', ';
    if(this.formBaseInformation.get('region').value!='') this.addressString+=this.formBaseInformation.get('region').value+', ';
    if(this.formBaseInformation.get('city').value!='') this.addressString+=this.formBaseInformation.get('city').value+', ';
    if(this.formBaseInformation.get('street').value!='') this.addressString+='ул. '+this.formBaseInformation.get('street').value+' ';
    if(this.formBaseInformation.get('home').value!='') this.addressString+='д. '+this.formBaseInformation.get('home').value+' ';
    if(this.formBaseInformation.get('flat').value!='') this.addressString+='кв. '+this.formBaseInformation.get('flat').value+' ';
    if(this.formBaseInformation.get('additional_address').value!='') this.addressString+='('+this.formBaseInformation.get('additional_address').value+')';
  }
  getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.customersOrdersProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    this.getProductsTable();
    return (this.formBaseInformation.value.customersOrdersProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
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
    this.formBaseInformation.value.customersOrdersProductTable.map(i => 
        {
        if(+i['product_id']==productId){retIndex=formIndex}
        formIndex++;
        });return retIndex;}

  formingProductRowFromApiResponse(row: CustomersOrdersProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      product_id: new FormControl (row.product_id,[]),
      customers_orders_id: new FormControl (+this.id,[]),
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
    //елси не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  }

  hideOrShowNdsColumn(){
    if(this.formBaseInformation.get('nds').value){
      this.displayedColumns = ['select','name','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','nds','department',/*'id','row_id','indx',*/'delete'];
    } else {
      this.displayedColumns = ['select','name','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','department',/*'id','row_id','indx',*/'delete'];
    }
  }

  getControlTablefield(){
    const control = <FormArray>this.formBaseInformation.get('customersOrdersProductTable');
    return control;
  }

  EditDocNumber(): void {
    if(this.allowToUpdate && !this.is_completed){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('docs.msg.doc_num_head'),
          query: translate('docs.msg.doc_num_query'),
          warning: translate('docs.msg.doc_num_warn')
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.doc_number_isReadOnly = false ;
          setTimeout(() => { this.doc_number.nativeElement.focus(); }, 500);}
      });  
    } 
  }

  checkDocNumberUnical(tableName:string) { //+++
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
                          if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head: translate('docs.msg.attention'),message: translate('docs.msg.num_not_unic'),}});
                          this.isDocNumberUnicalChecking=false;
                      },
              error => {console.log(error);this.isDocNumberUnicalChecking=false;}
          );
        }
    }, 1000);
  }

  createNewDocument(){
    this.createdDocId=null;
    //если отправляем нового контрагента, в cagent_id отправляем null, и backend понимает что нужно создать нового контрагента:
    this.formBaseInformation.get('cagent_id').setValue(this.is_addingNewCagent?null:this.formBaseInformation.get('cagent_id').value);
    this.formBaseInformation.get('uid').setValue(uuidv4());
    this.getProductsTable();
    this.http.post('/api/auth/insertCustomersOrders', this.formBaseInformation.value)
    .subscribe(
      (data) =>   {
        let response=data as any;
        //создание документа было успешным  
        if(response.success){
          this.actionsBeforeGetChilds=0;
          this.id=response.id;
          this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.c_order')}), translate('docs.msg.close'));
          this._router.navigate(['/ui/customersordersdoc', this.id]);
          this.formBaseInformation.get('id').setValue(this.id);
          this.formBaseInformation.get('cagent_id').enable();//иначе при сохранении он не будет отпраляться
          if(response.fail_to_reserve>0){//если у 1 или нескольких позиций резервы при сохранении были отменены
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.res_not_saved')}});
          }
          this.productSearchAndTableComponent.parentDocId=response.id;
          this.productSearchAndTableComponent.getProductsTable();
          this.rightsDefined=false; //!!!
          this.getData();        
        //создание документа было не успешным
        } else {
          switch(response.errorCode){
            case 1:{// 1 возвращает если не удалось создать документ из-за ошибки 
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.c_order')})}}); 
              break;
            }
            case 2:{// 2 возвращает если не удалось сохранить таблиу товаров из-за ошибки 
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.c_order')})}}); 
              break;
            }
            case 0:{//недостаточно прав
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
              break;
            }
          }
        }
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  completeDocument(notShowDialog?:boolean){ //+++
    if(!notShowDialog){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
          head:    translate('docs.msg.complet_head'),
          warning: translate('docs.msg.complet_warn'),
          query:   translate('docs.msg.complet_query')},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.updateDocument(true);
        }
      });
    } else this.updateDocument(true);
  }

  decompleteDocument(notShowDialog?:boolean){ //+++
    if(this.allowToComplete){
      if(!notShowDialog){
        const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',data:{
          head:    translate('docs.msg.cnc_com_head'),
          warning: translate('docs.msg.cnc_com_warn'),
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
    this.http.post('/api/auth/setCustomersOrdersAsDecompleted',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось завершить операцию из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.cnc_com_error')}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              case -60:{//Документ уже снят с проведения
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.alr_cnc_com')}});
                break;
              }
              case 1:{// Успешно
                this.openSnackBar(translate('docs.msg.cnc_com_succs',{name:translate('docs.docs.c_order')}), translate('docs.msg.close'));
                this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                this.formBaseInformation.get('is_completed').setValue(false);
                this.is_completed=false;
                if(this.productSearchAndTableComponent){
                  this.productSearchAndTableComponent.hideOrShowNdsColumn(); //чтобы показать столбцы после отмены проведения 
                  this.productSearchAndTableComponent.getProductsTable();
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
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - временно устанавливаем true, временно - чтобы это ушло в запросе на сервер, но не повлияло на внешний вид документа, если вернется не true
      if(this.settingsForm.get('statusIdOnAutocreateOnCheque').value){//если в настройках есть "Статус при проведении" - временно выставляем его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);}
    }
    return this.http.post('/api/auth/updateCustomersOrders',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            if(complete){
              this.formBaseInformation.get('is_completed').setValue(false);//если сохранение с завершением - удаляем временную установку признака завершенности, 
              this.formBaseInformation.get('status_id').setValue(currentStatus);//и возвращаем предыдущий статус
            }

            let response=data as any;
            
            //сохранение было успешным  
            if(response.success){

              this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.c_order')}) + (complete?translate('docs.msg.completed'):translate('docs.msg.saved')), translate('docs.msg.close'));
              this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов - чтобы обновился "Проведён Да/Нет" и статус
              if(response.fail_to_reserve>0){//если у 1 или нескольких позиций резервы при сохранении были отменены
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.res_not_saved')}});
              }
              if(complete) {
                this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - окончательно устанавливаем признак завершенности = true
                this.is_completed=true;
                if(this.productSearchAndTableComponent){
                  this.productSearchAndTableComponent.readonly=true;// иначе эта переменная не успеет измениться через @Input и следующие 2 строки не выполнятся                  
                  this.productSearchAndTableComponent.hideOrShowNdsColumn(); //чтобы спрятать столбцы чекбоксов и удаления строк в таблице товаров
                  this.productSearchAndTableComponent.tableNdsRecount();
                }
                if(this.settingsForm.get('statusIdOnAutocreateOnCheque').value){//если в настройках есть "Статус при завершении" - выставим его
                  this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);}
                this.setStatusColor();//чтобы обновился цвет статуса
              }
              this.productSearchAndTableComponent.getProductsTable();
              this.getData();            
            //сохранение было не успешным
            } else {
              switch(response.errorCode){
                case 0: {
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
                  break;
                }
                case 1: { // ошибка сохранения 
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.save_error')}});
                  break;
                }
                case 2: { // ошибка сохранения таблицы товаров
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.save_error')}});
                  break;
                }
                case -50:{ //Документ уже проведён
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.already_cmplt')}});
                  break;
                }
              }
            }
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
  } 
  //забирает таблицу товаров из дочернего компонента и помещает ее в основную форму
  getProductsTable(){
    const control = <FormArray>this.formBaseInformation.get('customersOrdersProductTable');
    control.clear();
    if(this.productSearchAndTableComponent)// т.к. может стоять опция "Автосоздание", и при начальном создании таблицы с товарами еще не будет
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
          head:translate('docs.msg.error'),
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
    const dialogSettings = this.SettingsCustomersordersDialogComponent.open(SettingsCustomersordersDialogComponent, {
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
        if(result.get('name')) this.settingsForm.get('name').setValue(result.get('name').value);
        if(result.get('priorityTypePriceSide')) this.settingsForm.get('priorityTypePriceSide').setValue(result.get('priorityTypePriceSide').value);
        this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
        this.settingsForm.get('saveSettings').setValue(result.get('saveSettings').value);
        this.settingsForm.get('autocreateOnStart').setValue(result.get('autocreateOnStart').value);
        this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(result.get('statusIdOnAutocreateOnCheque').value);
        this.saveSettingsCustomersOrders();
 
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
  saveSettingsCustomersOrders(){
    return this.http.post('/api/auth/saveSettingsCustomersOrders', this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
                          
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }
  getPriceTypesList(){
    // alert(1)
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(this.formBaseInformation.get('company_id').value)
    .subscribe(
      (data) => {
        this.receivedPriceTypesList=data as any [];
        this.necessaryActionsBeforeGetChilds();
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  getSpravTaxes(companyId:number){
    // alert(4)
      this.loadSpravService.getSpravTaxes(companyId)
        .subscribe((data) => {
          this.spravTaxesSet=data as any[];
          this.necessaryActionsBeforeGetChilds();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

//******************************************************************************************************************************************/
//*******************************           В Ы Б О Р  С Т Р А Н Ы,  Р А Й О Н А,  Г О Р О Д А       ***************************************/
//******************************************************************************************************************************************/
  //фильтрация при каждом изменении в поле Страна
  private filter_country(value: string): IdAndName_ru[] {
    const filterValue = value.toLowerCase();
    return this.spravSysCountries.filter(option => option.name_ru.toLowerCase().includes(filterValue));
  }  
  getSpravSysCountries():void {    
    this.http.post('/api/auth/getSpravSysCountries', {})  // 
    .subscribe((data) => {
      this.spravSysCountries = data as IdAndName_ru[];
      // this.spravSysJrCountries = data as IdAndName[];
    this.updateValuesSpravSysCountries(); },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    }
  //если значение уже выбрано (id загрузилось), надо из массива объектов найти имя, соответствующее этому id 
  updateValuesSpravSysCountries(){
    if(+this.formBaseInformation.get('country_id').value!=0)
      {
        this.spravSysCountries.forEach(x => {
          if(x.id==this.formBaseInformation.get('country_id').value){
            this.formBaseInformation.get('country').setValue(x.name_ru);
          }
        })
      } 
      else //иначе обнулить поля id и имени. Без этого при установке курсора в поле список выскакивать не будет (х.з. почему так)
      {
        this.formBaseInformation.get('country').setValue('');
        this.formBaseInformation.get('country_id').setValue('');
      }
      this.necessaryActionsBeforeAutoCreateNewDoc();
  }
  //вызывается из html. необходима для сброса уже имеющегося значения. когда имя стирается, в id установится 0 
  checkEmptyCountryField(){
    if( this.formBaseInformation.get('country').value.length==0){
      this.formBaseInformation.get('country_id').setValue('');
    }
  }
  
  //  -----------------------     ***** поиск по подстроке для Региона  ***    --------------------------
  // onRegionSearchValueChanges(){
  //   this.searchRegionCtrl.valueChanges
  //   .pipe( 
  //     debounceTime(500),
  //     tap(() => {
  //       this.filteredRegions = [];}),       
  //     switchMap(fieldObject =>  
  //       this.getSpravSysRegions()))
  //   .subscribe(data => {
  //     this.isRegionListLoading = false;
  //     if (data == undefined) {
  //       this.filteredRegions = [];
  //     } else {
  //       this.filteredRegions = data as Region[];
  // }});}
  // onSelectRegion(id:number,country_id:number,country:string){
  //   this.formBaseInformation.get('region_id').setValue(+id);
  //   //если выбрали регион, а страна не выбрана
  //   if((this.formBaseInformation.get('country_id').value==null || this.formBaseInformation.get('country_id').value=='') && country_id>0){
  //     this.formBaseInformation.get('country_id').setValue(country_id);
  //     this.formBaseInformation.get('country').setValue(country);
  //   }
  // }
  // checkEmptyRegionField(){
  //   if(this.searchRegionCtrl.value.length==0){
  //     this.formBaseInformation.get('region_id').setValue(null);
  // }};     
  // getSpravSysRegions(){ //заполнение Autocomplete
  //   try {
  //     if(this.canRegionAutocompleteQuery && this.searchRegionCtrl.value.length>1){
  //       const body = {
  //         "searchString":this.searchRegionCtrl.value,
  //         "id":this.formBaseInformation.get('country_id').value};
  //       this.isRegionListLoading  = true;
  //       return this.http.post('/api/auth/getSpravSysRegions', body);
  //     }else return [];
  //   } catch (e) {
  //     return [];}}
  //---------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Города  ***    -----------------------------------
  // onCitySearchValueChanges(){
  //   this.searchCityCtrl.valueChanges
  //   .pipe( 
  //     debounceTime(500),
  //     tap(() => {
  //       this.filteredCities = [];}),       
  //     switchMap(fieldObject =>  
  //       this.getSpravSysCities()))
  //   .subscribe(data => {
  //     this.isCityListLoading = false;
  //     if (data == undefined) {
  //       this.filteredCities = [];
  //     } else {
  //       this.filteredCities = data as City[];
  // }});}
  // onSelectCity(id:any,area:string,region_id:number,region:string,country_id:number,country:string){
  //   this.formBaseInformation.get('city_id').setValue(+id);
  //   this.area=area;
  //   if(area!=''){
  //     setTimeout(()=> {
  //       this.searchCityCtrl.setValue(this.searchCityCtrl.value+' ('+area+')'); 
  //     },200); 
  //   }//если выбрали город, а регион не выбран
  //   if((this.formBaseInformation.get('region_id').value==null || this.formBaseInformation.get('region_id').value=='') && region_id>0){//если у города есть регион и он не выбран - устанавливаем регион
  //     this.formBaseInformation.get('region_id').setValue(region_id);
  //     this.searchRegionCtrl.setValue(region);
  //   }//если выбрали регион, а страна не выбрана
  //   if((this.formBaseInformation.get('country_id').value==null || this.formBaseInformation.get('country_id').value=='') && country_id>0){//если у города есть страна и она не выбрана - устанавливаем страну
  //     this.formBaseInformation.get('country_id').setValue(country_id);
  //     this.formBaseInformation.get('country').setValue(country);
  //   }
  // }
  // checkEmptyCityField(){
  //   if(this.searchCityCtrl.value.length==0){
  //     this.formBaseInformation.get('city_id').setValue(null);
  //     this.area='';
  // }};     
  // getSpravSysCities(){ //заполнение Autocomplete
  //   try {
  //     if(this.canCityAutocompleteQuery && this.searchCityCtrl.value.length>1){
  //       const body = {
  //         "searchString":this.searchCityCtrl.value,
  //         "id":this.formBaseInformation.get('country_id').value,
  //         "id2":this.formBaseInformation.get('region_id').value}
  //       this.isCityListLoading  = true;
  //       return this.http.post('/api/auth/getSpravSysCities', body);
  //     }else return [];
  //   } catch (e) {
  //     return [];}}    

//*****************************************************************************************************************************************/
//***************************************************    добавление файлов          *******************************************************/
//*****************************************************************************************************************************************/
/*
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
      if(result)this.addFilesToCustomersOrders(result);
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
  
  addFilesToCustomersOrders(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addFilesToCustomersOrders', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Изображения добавлены", "Закрыть");
                    this.loadFilesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
              );
  }
  loadFilesInfo(){//                                     загружает информацию по картинкам товара
    const body = {"id":this.id};//any_boolean: true - полные картинки, false - их thumbnails
          return this.http.post('/api/auth/getListOfCustomersOrdersFiles', body) 
            .subscribe(
                (data) => {  
                            this.filesInfo = data as any[]; 
                            this.loadMainImage();
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }
  clickBtnDeleteFile(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.file_del_head'),
      query: translate('docs.msg.file_del_qury'),
      warning: translate('docs.msg.file_del_warn'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteFile(id);}
    });        
  }

  deleteFile(id:number){
    const body = {id: id, any_id:this.id}; 
    return this.http.post('/api/auth/deleteCustomersOrdersFile',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.loadFilesInfo();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );  
  }
*/
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
    // if(this.kkmComponent!=undefined) {
    //   this.kkmComponent.totalSumPrice=$event; 
    //   // console.log($event);  
    // }
  }  

  // sendingProductsTableHandler() {
    // this.kkmComponent.productsTable=[];
    // this.productSearchAndTableComponent.getProductTable().forEach(row=>{
    //   this.kkmComponent.productsTable.push(row);
    // });
    // this.kkmComponent.productsTable=this.productSearchAndTableComponent.getProductTable();
  // }

  
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
    // alert(5)
    return this.http.get('/api/auth/getSetOfTypePrices?company_id='+this.formBaseInformation.get('company_id').value+
    '&department_id='+(+this.formBaseInformation.get('department_id').value)+'&cagent_id='+(+this.formBaseInformation.get('cagent_id').value))
      .subscribe(
          (data) => {   
                      const setOfTypePrices=data as any;
                      this.department_type_price_id=setOfTypePrices.department_type_price_id;
                      this.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                      this.default_type_price_id=setOfTypePrices.default_type_price_id;
                      if(this.canGetChilds){
                        this.productSearchAndTableComponent.department_type_price_id=setOfTypePrices.department_type_price_id;
                        this.productSearchAndTableComponent.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                        this.productSearchAndTableComponent.default_type_price_id=setOfTypePrices.default_type_price_id;
                        console.log("parent department_type_price_id - "+this.department_type_price_id);
                        this.productSearchAndTableComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
                      } 
                        
                      if(!this.canGetChilds && this.id==0) 
                        this.checkAnyCases();

                      this.necessaryActionsBeforeGetChilds(); 
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
  }

  //создание нового документа Заказ покупателя
  goToNewDocument(){
    this._router.navigate(['ui/customersordersdoc',0]);
    this.id=0;
    this.clearFormSearchAndProductTable();//очистка формы поиска и таблицы с отобранными на продажу товарами
    this.setDefaultStatus();//устанавливаем статус документа по умолчанию
    this.formBaseInformation.get('id').setValue(null);
    this.formBaseInformation.get('doc_number').setValue('');
    this.formBaseInformation.get('description').setValue('');
    this.formBaseInformation.get('is_completed').setValue(false);
    this.formBaseInformation.get('cagent_id').setValue(null);
    this.formBaseInformation.get('uid').setValue('');
    this.formBaseInformation.get('cagent').setValue('');
    this.actionsBeforeGetChilds=0;
    this.actionsBeforeCreateNewDoc=0;
    this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
    this.resetAddressForm();
    this.resetStatus();
    this.resetContactsForm();
    this.formExpansionPanelsString();
    this.is_completed=false;
    this.refreshShowAllTabs();
    this.getData();
  }
  clearFormSearchAndProductTable(){
    this.productSearchAndTableComponent.resetFormSearch();
    this.productSearchAndTableComponent.getControlTablefield().clear();
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

  //создание связанных документов
  createLinkedDoc(docname:string){// принимает аргументы: Return
    let uid = uuidv4();
    let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDoc.can){
      // switch (docname){
      //   case 'Paymentin':{
      //     this.formLinkedDocs.get('summ').setValue(this.sumPrice); 
      //     this.formLinkedDocs.get('nds').setValue(this.sumNds); 
      //     break;
      //   }
      //   default:{
        
      this.formLinkedDocs.get('department_id').setValue(this.formBaseInformation.get('department_id').value);
      this.formLinkedDocs.get('nds').setValue(this.formBaseInformation.get('nds').value);
      this.formLinkedDocs.get('nds_included').setValue(this.formBaseInformation.get('nds_included').value);
      this.formLinkedDocs.get('shipment_date').setValue(this.formBaseInformation.get('shipment_date').value?moment(this.formBaseInformation.get('shipment_date').value,'DD.MM.YYYY'):"");
      this.formLinkedDocs.get('description').setValue(translate('docs.msg.created_from')+translate('docs.docs.c_order')+' '+translate('docs.top.number')+this.formBaseInformation.get('doc_number').value);
      this.formLinkedDocs.get('customers_orders_id').setValue(this.id);
      
      // параметры для входящих ордеров и платежей (Paymentin, Orderin)
      if(docname=='Paymentin'||docname=='Orderin'){
        this.formLinkedDocs.get('payment_account_id').setValue(null);//id расчтёного счёта      
        this.formLinkedDocs.get('boxoffice_id').setValue(null);
        this.formLinkedDocs.get('summ').setValue(this.productSearchAndTableComponent.totalProductSumm)
        this.formLinkedDocs.get('nds').setValue(this.productSearchAndTableComponent.getTotalNds());
      }

      if(docname!=='Paymentin'&&docname!=='Orderin')// для данных документов таблица с товарами не нужна
          this.getProductsTableLinkedDoc(docname);//формируем таблицу товаров для создаваемого документа
      //   }
      // }

      this.formLinkedDocs.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formLinkedDocs.get('cagent_id').setValue(this.formBaseInformation.get('cagent_id').value);
      this.formLinkedDocs.get('uid').setValue(uid);
      this.formLinkedDocs.get('linked_doc_id').setValue(this.id);//id связанного документа (того, из которого инициируется создание данного документа)
      this.formLinkedDocs.get('parent_uid').setValue(this.formBaseInformation.get('uid').value);// uid исходящего (родительского) документа
      this.formLinkedDocs.get('child_uid').setValue(uid);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      this.formLinkedDocs.get('linked_doc_name').setValue('customers_orders');//имя (таблицы) связанного документа
      this.formLinkedDocs.get('is_completed').setValue(false);
      
      
      // т.к. Розничная продажа проводится по факту ее создания, то мы не можем просто создать ее, как это делаем с другими связанными документами. Нужно только открыть ее страницу и передать туда все данные из Заказа покупателя.
      if(docname=='RetailSales'){
        let retailSalesProductTable: Array <RetailSalesProductTable> =this.getRetailSalesProductsTable();
        let objToSend: NavigationExtras = //NavigationExtras - спец. объект, в котором можно передавать данные в процессе роутинга
        {
          queryParams: {
            company_id:               this.formBaseInformation.get('company_id').value,
            department_id:            this.formBaseInformation.get('department_id').value,
            cagent_id:                this.formBaseInformation.get('cagent_id').value,
            cagent:                   this.formBaseInformation.get('cagent').value,
            nds:                      this.formBaseInformation.get('nds').value,
            nds_included:             this.formBaseInformation.get('nds_included').value,
            linked_doc_id:            this.id,
            parent_uid:               this.formBaseInformation.get('uid').value,
            doc_number:               this.formBaseInformation.get('doc_number').value,
            child_uid:                uid,
            linked_doc_name:          'customers_orders',
            customers_orders_id:      this.id,
            uid:                      uid,
            retailSalesProductTable:  retailSalesProductTable
          },
          skipLocationChange: false,
          fragment: 'top' 
        };

        this._router.navigate(['ui/retailsalesdoc'], { 
          state: { productdetails: objToSend }
        });
      }else
        this.http.post('/api/auth/insert'+docname, this.formLinkedDocs.value)
        .subscribe(
        (data) => {
                    let createdDocId=data as number;
                    switch(createdDocId){
                      case null:{// null возвращает если не удалось создать документ из-за ошибки
                        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))})}});
                        break;
                      }
                      case -1:{//недостаточно прав
                        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))})}});
                        break;
                      }
                      default:{// Документ успешно создался в БД 
                        this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))}), translate('docs.msg.close'));
                        this.getLinkedDocsScheme(true);//обновляем схему этого документа
                      }
                    }
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
        );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:canCreateLinkedDoc.reason}});
  }

  // забирает таблицу товаров из дочернего компонента и помещает ее в массив, предназначенный для передачи в дочернюю розничную продажу
  getRetailSalesProductsTable(){
    let retailSalesProductTable: Array <RetailSalesProductTable> =[];
    let canAddRow: boolean;
    this.productSearchAndTableComponent.getProductTable().forEach(row=>{
      if(this.productSearchAndTableComponent.checkedList.length>0){  //если есть выделенные чекбоксами позиции - надо взять только их, иначе берем все позиции
        canAddRow=this.isRowInCheckedList(row.row_id)
      }
      else canAddRow=true;
      if(canAddRow)
        retailSalesProductTable.push({
          product_id:                   row.product_id, 
          department_id:                row.department_id,
          product_count:                (row.product_count-row.shipped)>=0?row.product_count-row.shipped:0,
          product_price:                row.product_price,
          price_type_id:                row.price_type_id,
          is_material:                  row.is_material,
          product_price_of_type_price:  row.product_price_of_type_price,
          product_sumprice:             ((row.product_count)*row.product_price).toFixed(2),
          nds_id:                       row.nds_id,
          edizm:                        row.edizm,
          ppr_name_api_atol:            row.ppr_name_api_atol,
          name:                         row.name,
          available:                    row.available,
          reserved:                     row.reserved,
          total:                        row.total,
          priority_type_price:          row.priority_type_price,
          shipped:                      row.shipped,
          reserved_current:             row.reserved_current,
        });
    });
    return retailSalesProductTable;
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
  formingProductRowLinkedDoc(row: CustomersOrdersProductTable) {
    return this._fb.group({
      product_id: new FormControl (row.product_id,[]),
      department_id: new FormControl (row.department_id,[]),
      product_count: new FormControl ((row.product_count-row.shipped)>=0?row.product_count-row.shipped:0,[]),
      product_price:  new FormControl (row.product_price,[]),
      price_type_id:  new FormControl (row.price_type_id,[]),
      is_material:  new FormControl (row.is_material,[]),
      product_price_of_type_price:  new FormControl (row.product_price_of_type_price,[]),
      product_sumprice: new FormControl (((row.product_count)*row.product_price).toFixed(2),[]),
      nds_id:  new FormControl (row.nds_id,[]),
    });
  }
  // можно ли создать связанный документ (да - если есть товары, подходящие для этого)
  canCreateLinkedDoc(docname:string):CanCreateLinkedDoc{
    if(!(this.productSearchAndTableComponent && this.productSearchAndTableComponent.getProductTable().length>0)){
      return {can:false, reason:translate('docs.msg.cnt_crt_items',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))})};
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
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.err_load_lnkd')}});
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
        error => {this.loadingDocsScheme=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
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

  //**************************** ПЕЧАТЬ ДОКУМЕНТОВ  ******************************/
  // открывает диалог печати
  openDialogTemplates() { 
    const dialogTemplates = this.templatesDialogComponent.open(TemplatesDialogComponent, {
      maxWidth: '1000px',
      maxHeight: '95vh',
      // height: '680px',
      width: '95vw', 
      minHeight: '95vh',
      data:
      { //отправляем в диалог:
        company_id: +this.formBaseInformation.get('company_id').value, //предприятие
        document_id: 23, // id документа из таблицы documents
      },
    });
    dialogTemplates.afterClosed().subscribe(result => {
      if(result){
        
      }
    });
  }
  // при нажатии на кнопку печати - нужно подгрузить список шаблонов для этого типа документа
  printDocs(){
    this.gettingTemplatesData=true;
    this.templatesList=[];
    this.http.get('/api/auth/getTemplatesList?company_id='+this.formBaseInformation.get('company_id').value+"&document_id="+23+"&is_show="+true).subscribe
    (data =>{ 
        this.gettingTemplatesData=false;
        this.templatesList=data as TemplatesList[];
      },error => {console.log(error);this.gettingTemplatesData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }
  clickOnTemplate(template:TemplatesList){
    const baseUrl = '/api/auth/customersOrdersPrint/';
    this.http.get(baseUrl+ 
                  "?file_name="+template.file_name+
                  "&doc_id="+this.id+
                  "&tt_id="+template.template_type_id,
                  { responseType: 'blob' as 'json', withCredentials: false}).subscribe(
      (response: any) =>{
          let dataType = response.type;
          let binaryData = [];
          binaryData.push(response);
          let downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
          downloadLink.setAttribute('download', template.file_original_name);
          document.body.appendChild(downloadLink);
          downloadLink.click();
      }, 
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
    //**************************** КАССОВЫЕ ОПЕРАЦИИ  ******************************/

  //обработчик события успешной печати чека - в Заказе покупателя это выставление статуса документа, сохранение и создание нового.  
  // onSuccesfulChequePrintingHandler(){
  //   //установим статус из настроек при автосоздании перед сохранением
  //   if(this.settingsForm.get('autocreateOnCheque').value) 
  //     this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);
  //   //потом сохраним:
  //   if(this.updateDocument(true)){
  //     //если стоит чекбокс Автосоздание нового после печати чека:
  //     if(this.settingsForm.get('autocreateOnCheque').value){
  //       this._router.navigate(['ui/customersordersdoc']);
  //       this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);
  //     }
  //     this.openSnackBar("Чек был успешно напечатан. Создание нового Заказа покупателя", "Закрыть");
  //   }
  // }
}