import { ChangeDetectorRef, Component, OnInit, ViewChild, Output, EventEmitter, Optional, Inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { UntypedFormGroup, UntypedFormArray,  UntypedFormBuilder,  Validators, UntypedFormControl, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { map, startWith, debounceTime, tap, switchMap, mergeMap, concatMap, expand, reduce  } from 'rxjs/operators';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { MatTabChangeEvent } from '@angular/material/tabs';
// import { graphviz }  from 'd3-graphviz';
import { BalanceCagentComponent } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.component';
import { TemplatesDialogComponent } from 'src/app/modules/settings/templates-dialog/templates-dialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { DelCookiesService } from './del-cookies.service';
import { Router, NavigationExtras  } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { setValue, translate } from '@ngneat/transloco'; //+++
import { CalendarEvent } from 'angular-calendar';
import { SettingsAppointmentDialogComponent } from 'src/app/modules/settings/settings-appointment-dialog/settings-appointment-dialog.component';
import { AppointmentsComponent } from 'src/app/ui/pages/documents/appointments/appointments.component';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { EMPTY, Observable } from 'rxjs';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface AppointmentServiceSearchResponse{//интерфейс получения данных из бд 
  id:number;
  name: string;
  departmentId: number;
  departmentName: string;
  departmentPartsWithResourcesIds: DepartmentPartWithResourcesIds[];
  edizm_id:number;
  edizm: string;
  edizm_type_id: number;
  edizm_multiplier:number;
  filename:string;
  nds_id:number;
  available: number; // доступно на складе отделения, у которого выбрана часть отделения
  priceOfTypePrice:number;// цена по запрошенному id типа цены
  reserved:number;// сколько зарезервировано в других Заказах покупателя
  total:number; // всего единиц товара в отделении (складе):
  reserved_in_all_my_depths:number; //зарезервировано в моих отделениях
  total_in_all_my_depths:number; //всего в моих отделениях
  ppr_name_api_atol:string; //Признак предмета расчета в системе Атол. Невидимое поле. Нужно для передачи в таблицу товаров в качестве тега для чека на ккм Атол
  is_material:boolean; //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
  reserved_current:number;// зарезервировано единиц товара в отделении (складе) в ЭТОМ (текущем) Заказе покупателя:
  indivisible: boolean; // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
  employeeRequired:boolean; // employee is necessary required to run thiss service job
  maxPersOnSameTime: number; // max number of persons on one appointment
  srvcDurationInSeconds: number; // minimem duration of service in seconds. Needs to calculate the end time of appointment
  atLeastBeforeTimeInSeconds: number; // minimum time before customer can get an appointment
  unitOfMeasureTimeInSeconds: number; // If unit of measure is 'Time' type - it will be as 1 unit converted into seconds, else 0
  isServiceByAppointment:boolean;     // It's a service and it's a service by appointment
}
interface DepartmentPartWithResourcesIds{
  id:number;
  name: string;
  resourcesOfDepartmentPart:ResourceOfDepartmentPart[];
}
interface ResourceOfDepartmentPart{
  id:number;
  name: string;
  need_res_qtt: number;
  now_used: number;
  quantity_in_dep_part: number;
}

interface AppointmentsProductTable { //интерфейс для формы, массив из которых будет содержать форма appointmentsProductTable, входящая в formBaseInformation, которая будет включаться в formBaseInformation
  
  id: number;
  name: string;
  product_count: number;
  edizm_type_id: number;
  edizm: string;
  edizm_id: number;
  edizm_multiplier: number;
  product_price: number;
  product_sumprice: number;
  price_type_id: number;
  indivisible:boolean;
  priceOfTypePrice:number;//цена товара по типу цены. Т.к. цену можно редактировать в таблице товаров, при несовпадении новой цены с ценой типа цены нужно будет сбросить тип цены в 0 (не выбран), т.к. это уже будет не цена типа цены
  maxPersOnSameTime:number;
  srvcDurationInSeconds:number;
  atLeastBeforeTimeInSeconds:number;
  cagent_id:number;
  cagent_row_id:number;
  serviceByAppointment:boolean;
  nds_id: number;                                                             
  departmentId: number; // склад с которого будет производиться отгрузка товара.     
  departmentName: string; // склад с которого будет производиться отгрузка товара.                                   (secondaryDepartmentId)
  total: number; //всего на складе
  reserved: number; // сколько зарезервировано в других Заказах покупателя
  is_material: boolean; //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)            
  employeeRequired:boolean; // employee is necessary required to run thiss service job
  departmentPartsWithResourcesIds: DepartmentPartWithResourcesIds[];
  unitOfMeasureTimeInSeconds: number; // If unit of measure is 'Time' type - it will be as 1 unit converted into seconds, else 0
  isServiceByAppointment:boolean;     // It's a service and it's a service by appointment
}

interface SpravTaxesSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: boolean;
  calculated: boolean;
  value:number;
  multiplier:number;
}

interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}

interface docResponse {//интерфейс для получения ответа в методе getappointmentValuesById
  id: number;
  company: string;
  company_id: number;
  department: string;
  // department_id: number;
  dep_part_id: number;
  dep_part: string;
  creator: string;
  creator_id: number;
  is_completed: boolean;
  changer:string;
  nds: boolean;
  nds_included: boolean;
  changer_id: number;
  owner:string;
  owner_id: number;
  doc_number: string;
  date_start: string;
  date_end: string;
  time_start:string;
  time_end:string;
  date_time_changed: string;
  date_time_created: string;
  description : string;
  name: string;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  uid:string;
  customersTable:AppointmentCustomer[];
  appointmentsProductTable: AppointmentsProductTable[];
  jobtitle_id: number;
  jobtitle: string;
  employeeId: number;
  employeeName: string;
}

class AppointmentCustomer {
  id: number;
  row_id: number;
  name: string;
  email: string;
  telephone: string;
}
interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}
interface Department{
  department_id: number;
  department_name: string;
  parts: Deppart[];
}
interface Deppart{
  id:number;
  name: string;
  description: string;
  is_active: boolean;
  deppartProducts:DeppartProduct[];
  resources:DepPartResource[]
}
interface DepPartResource{
  resource_id: number;
  name: string;
  description: string;
  resource_qtt: number;
  dep_part_id: number;
  isActive: boolean       // for example, room may be under construction, car is on repairing, etc.
  now_used: number;       // filled only in getNowUsedResourcesList http query
}
interface DeppartProduct{
  id:number;
  name: string;
  employeeRequired:boolean;
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
// interface CompanySettings{
//   vat: boolean;
//   vat_included:boolean;
// }
interface Employee{
  id: number;
  name: string;
  jobtitle_id;
  departmentPartsWithServicesIds: DepartmentPartWithServicesIds[];
  state: string; // free / busyByAppointments / busyBySchedule
}
interface AppointmentChildDoc{
  id:number;
  docName:string;
  sum:number;
  customerId:number;
  docNumber:string;
  date:string;
}
interface DepartmentPartWithServicesIds{
  id: number;
  servicesIds:number[];
}
@Component({
  selector: 'app-appointments-doc',
  templateUrl: './appointments-doc.component.html',
  styleUrls: ['./appointments-doc.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [LoadSpravService,
    // KkmAtolService,
    // KkmAtolChequesService,
    Cookie,DelCookiesService,BalanceCagentComponent,AppointmentsComponent,
    // KkmComponent,
    CommonUtilitesService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})

export class AppointmentsDocComponent implements OnInit/*, OnChanges */{

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedDepartmentsWithPartsList: Department [] = [];//массив для получения списка отделений с их частями
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedEmployeesList  : Employee[] = [];//массив для получения списка сотрудников
  filteredEmployeesList: Observable<Employee[]>; // here will be filtered languages for showing in select list
  employeesListLoadQtt = 0; // if == 3 then indication of list loading will shown  
  customer:any; //information about row of customer, for which searching product or service
  notEnoughResourcesInDepParts = new Map();
  myCompanyId:number=0;
  showBalanceModules=true;
  appointmentChildDocs:AppointmentChildDoc[]=[];
  // companySettings:CompanySettings={vat:false,vat_included:true};  
  allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  myId:number=0;
  creatorId:number=0;
  // is_addingNewCustomer: boolean = false; // при создании документа создаём нового получателя (false) или ищем уже имеющегося (true)
  panelContactsOpenState = true;
  panelAddressOpenState = false;
  addressString: string = ''; // строка для свёрнутого блока Адрес
  oneClickSaveControl:boolean=false;//блокировка кнопок Save и Complete для защиты от двойного клика
  isMainDataLoading:boolean=false;
  initialLoading=true;// to handle the end of loading document
  //canCreateNewDoc: boolean=false;// можно ли создавать новый документ (true если выполнились все необходимые для создания действия)
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeCreateNewDoc:number=0;// количество выполненных действий, необходимых чтобы создать новый документ
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (форму товаров)
  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  netCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
  priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation
  company:string='';
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра карточки документа
  department_type_price_id: number; //id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  cagent_type_price_id: number; //id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  default_type_price_id: number; //id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  spravTaxesSet: SpravTaxesSet[] = []; //массив имен и id для ндс 
  secondaryDepartments:SecondaryDepartment[]=[];// склады в выпадающем списке складов формы поиска товара
  spravSysEdizmOfProductAll: idAndNameAndShorname[] = [];// массив, куда будут грузиться все единицы измерения товара
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)
  timeFormat:string='24';   //12 or 24
  receivedJobtitlesList: any [] = [];//массив для получения списка наименований должностей
  servicesList: string[] = []; // list of services that will be shown in an information panel of employee or department part
  documentChanged:boolean=false;
  isEndDateTimeRecounting:boolean=false;
  waitingOfAfterRecountEndDateTime=false;
  needAgainOfAfterRecountEndDateTime=false;
  applyingInitialTimeSettings=false;
  isEndDateTimEditing:boolean=false;
  //печать документов
  gettingTemplatesData: boolean = false; // идёт загрузка шаблонов
  templatesList:TemplatesList[]=[]; // список загруженных шаблонов
  locale:string='en-us';// locale (for dates, calendar etc.)
  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: UntypedFormGroup; //массив форм для накопления информации о Заказе покупателя
  settingsForm: any; // форма с настройками
  globalSettingsForm: any; // форма с общими настройками
  formLinkedDocs:any// Форма для отправки при создании Возврата покупателя
  expandedElement: any | null;
  indivisibleErrorOfProductTable:boolean;// дробное кол-во товара при неделимом товаре в таблице товаров
  gettingAppointmentChildDocsTableData:boolean = false;

  //для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  // linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  // linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу)
  loadingDocsScheme:boolean = false;
  linkedDocsSchemeDisplayed:boolean = false;
  // showGraphDiv:boolean=true;

  //чекбоксы
  selection = new SelectionModel<any>(true, []);// специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  
  // Customers variables +++
  customersList : any [] = []; 
  gettingCustomersTableData: boolean = false;//идет загрузка списка ресурсов
  formCustomerSearch:any;// форма для выбора ресурса и последующего формирования строки таблицы
  showCustomerSearchFormFields:boolean = false;
  showSearchCustomerFormFields:boolean = true;
  displayedCustomersColumns: string[]=[];//массив отображаемых столбцов таблицы с ресурсами
  displayedCustomerProductsColumns: string[]=[];//массив отображаемых столбцов таблицы с ресурсами
  displayedAppointmentChildDocsColumns: string[]=[];//массив отображаемых столбцов таблицы с производными документами

  customerHasBeenSearched: boolean=false; // чтобы не показывало сразу что клиент не найден, а только после первого поиска
  isCustomerListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  isCagentValuesLoading = false;//true когда идет запрос и загрузка данных по контрагенту (клиенту). Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCustomers: any;
  searchCustomerCtrl = new UntypedFormControl();//поле для поиска клиентов
  totalNds = new Map(); //  total Tax for each client in format "row_id - tax"
  totalProductSumm = new Map(); //  total sum for each client in format "row_id - tax"
  // mainProduct: AppointmentServiceSearchResponse; // хранение инфориации о главной услуге
  
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

  displayedColumns:string[];
  @ViewChild("countInput", {static: false}) countInput;
  @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("doc_number", {static: false}) doc_number; 
  @ViewChild("form", {static: false}) form; 
  @ViewChild("formBI", {static: false}) formBI; 
  // // @ViewChild(BalanceCagentComponent, {static: false}) public balanceCagentComponent:BalanceCagentComponent;  
  @ViewChild("customersSearchFieldValue", {static: false}) customersSearchFieldValue;
  @ViewChild("productSearchFieldValue", {static: false}) productSearchFieldValue;
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  is_completed=false;
  // dragToSelectEvent: CalendarEvent; // initial event that created by draggable selection and open the window with new Appointment
  //для Autocomplete по поиску ГЛАВНОЙ УСЛУГИ
  searchProductCtrl = new UntypedFormControl();//поле для поиска товаров
  isProductListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredProducts: AppointmentServiceSearchResponse[] = [];
  productImageName:string = null;
  mainImageAddress:string = 'assets_/images/no_foto.jpg';
  thumbImageAddress:string = 'assets_/images/no_foto.jpg';
  imageToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)
  companySettings:any={booking_doc_name_variation:'reservation'};
  canLoadHistoryTableData=false; // to prevent all requests to load history data until user click on "History" tab

  //для Autocomplete по поиску ДОПОЛНИТЕЛЬНЫХ ТОВАРОВ И УСЛУГ ДЛЯ КЛИЕНТОВ
  searchProductCustomerCtrl = new UntypedFormControl();//поле для поиска товаров
  isProductCustomerListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  filteredProductsCustomer: AppointmentServiceSearchResponse[] = [];
  productCustomerImageName:string = null;
  imageCustomerToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)
  // product_customer_id:number; // ID of selec

  // Filtration system
  // Если сотрудник не выбран - содержит все ID отделений, в которых доступные сотрудники могут оказывать услуги
  // Если сотрудник выбран - содержит ID отделений, где этот сотрудник может оказывать услуги
  possibleDepPartsByEmployees:number[] = [];

  constructor(
    private activateRoute: ActivatedRoute,
    // private cdRef:ChangeDetectorRef,
    private _fb: UntypedFormBuilder, //чтобы билдить группу форм appointmentsProductTable
    private http: HttpClient,
    public ShowImageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private templatesDialogComponent: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public commonUtilites: CommonUtilitesService,
    public dialogAddFiles: MatDialog,
    private settingsAppointmentDialogComponent: MatDialog,
    public MessageDialog: MatDialog,
    public dialogRef: MatDialogRef<AppointmentsDocComponent>,
    private loadSpravService: LoadSpravService,
    private _snackBar: MatSnackBar,
    private _router:Router,
    private _adapter: DateAdapter<any>) 
    { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];
    }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl                    (this.id,[]),
      company_id: new UntypedFormControl            (null,[Validators.required]),
      // department_id: new UntypedFormControl         (null,[Validators.required]),
      // product_id: new UntypedFormControl            (null,[Validators.required]),
      department_part_id: new UntypedFormControl    (null,[Validators.required]),
      department_part: new UntypedFormControl          ('',[]),
      jobtitle_id: new UntypedFormControl              (0,[]),
      jobtitle: new UntypedFormControl              ('',[]),
      doc_number: new UntypedFormControl            ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      employeeId: new UntypedFormControl            (null,[]),
      employeeName: new UntypedFormControl          ('',[]),
      // cagent: new UntypedFormControl                ('',[]),
      date_start: new UntypedFormControl            ('',[Validators.required]),
      date_end: new UntypedFormControl              ('',[Validators.required]),
      description: new UntypedFormControl           ('',[]),
      department: new UntypedFormControl            ('',[]),
      is_completed: new UntypedFormControl          (false,[]),
      appointmentsProductTable: new UntypedFormArray([]),
      nds: new UntypedFormControl                   (false,[]),
      nds_included: new UntypedFormControl          (true,[]),
      name: new UntypedFormControl                  ('',[Validators.maxLength(1000)]),
      status_id: new UntypedFormControl             ('',[]),
      status_name: new UntypedFormControl           ('',[]),
      status_color: new UntypedFormControl          ('',[]),
      status_description: new UntypedFormControl    ('',[]),
      // discount_card:   new UntypedFormControl    ('',[Validators.maxLength(30)]),
      uid: new UntypedFormControl                   ('',[]),// uuid идентификатор для создаваемой отгрузки
      time_start: new UntypedFormControl            ('',[Validators.required]),
      time_end:  new UntypedFormControl             ('',[Validators.required]),
      customersTable: new UntypedFormArray   ([]),//массив с клиентами / array uf customers
      cagent_id : new UntypedFormControl           ('',[]),// customer's ID, needed to create documents from Appointments (Shipment, incoming payments) // ID клиента, для создания документов из Записи (Отгрузка, входящие платежи) 
      total_nds : new UntypedFormControl           ('',[]), // Total VAT of customer, needed to create documents from Appointments (incoming payments) // Сумма НДС клиента, для создания документов из Записи (входящие платежи) 
      total_summ: new UntypedFormControl           ('',[]), // Total sum of customer, needed to create documents from Appointments (incoming payments) // Сумма клиента, для создания документов входящих платежей из Записи
      // payment_doc_type: new UntypedFormControl     ('',[]),// to create documents from Appointments, can be "paymentin" or "orderin"// для создания документов входящих платежей, может принимать значения  "paymentin" или "orderin"
    });
    // Форма для отправки при создании связанных документов
    this.formLinkedDocs = new UntypedFormGroup({
      customers_orders_id: new UntypedFormControl   (null,[]),
      date_return: new UntypedFormControl           ('',[]),
      summ: new UntypedFormControl                  ('',[]),
      nds: new UntypedFormControl                   ('',[]),
      nds_included: new UntypedFormControl          ('',[]),
      is_completed: new UntypedFormControl          (null,[]),
      cagent_id: new UntypedFormControl             (null,[Validators.required]),
      company_id: new UntypedFormControl            (null,[Validators.required]),
      department_id: new UntypedFormControl         (null,[Validators.required]),
      description: new UntypedFormControl           ('',[]),
      date_start: new UntypedFormControl            ('',[Validators.required]),
      retailSalesProductTable: new UntypedFormArray ([]),
      shipmentProductTable: new UntypedFormArray    ([]),
      invoiceoutProductTable: new UntypedFormArray  ([]),
      linked_doc_id: new UntypedFormControl         (null,[]),//id связанного документа (в данном случае Отгрузка)
      parent_uid: new UntypedFormControl            (null,[]),// uid родительского документа
      child_uid: new UntypedFormControl             (null,[]),// uid дочернего документа
      linked_doc_name: new UntypedFormControl       (null,[]),//имя (таблицы) связанного документа
      uid: new UntypedFormControl                   ('',[]),  //uid создаваемого связанного документа
      // параметры для входящих ордеров и платежей
      payment_account_id: new UntypedFormControl    ('',[]),//id расчтёного счёта      
      boxoffice_id: new UntypedFormControl          ('',[]), // касса предприятия или обособленного подразделения
      internal: new UntypedFormControl              (false,[]), // внутренний платеж     

    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl                       ('',[]),
      creator: new UntypedFormControl                  ('',[]),
      changer: new UntypedFormControl                  ('',[]),
      owner: new UntypedFormControl                    ('',[]),
      company: new UntypedFormControl                  ('',[]),
      date_time_created: new UntypedFormControl        ('',[]),
      date_time_changed: new UntypedFormControl        ('',[]),
    });
    this.formCustomerSearch = new UntypedFormGroup({
      id: new UntypedFormControl ('' ,[]),
      email: new UntypedFormControl ('' ,[Validators.maxLength(254)]),
      telephone: new UntypedFormControl ('' ,[Validators.maxLength(60)]),
      // description: new UntypedFormControl ('' ,[]),      
    });

    // Форма настроек
    this.settingsForm = new UntypedFormGroup({     
      //предприятие, для которого создаются настройки
      companyId: new UntypedFormControl          (null,[]),
      startTime: new UntypedFormControl          ('current',[]),        // current / set_manually
      endDateTime: new UntypedFormControl        ('sum_all_length',[]), // no_calc / sum_all_length / max_length 
      startTimeManually: new UntypedFormControl  ('00:00',[]),          // 'HH:mm' if start_time = 'set_manually'
      endTimeManually: new UntypedFormControl    ('00:01',[]),          // 'HH:mm' if end_time = 'calc_date_but_time'
      hideEmployeeField: new UntypedFormControl  (false ,[]),           // If for all services of company employees are not needed
      calcDateButTime: new UntypedFormControl    (false ,[]),           // if user wants to calc only dates. Suitable for hotels for checkout time
    });

    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.onProductSearchValueChanges();//отслеживание изменений поля "Услуга"
    // this.onProductCustomerSearchValueChanges();//отслеживание изменений поля "Услуга"
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
    // this.getBaseData('myDepartmentsList');
    this.getBaseData('accountingCurrency');  
    this.getBaseData('timeFormat');
    this.setDefaultDate();
    // console.log("locale = ",this.locale);
    this._adapter.setLocale(this.locale);
    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.docId; this.formBaseInformation.get('id').setValue(this.id);}
      this.formBaseInformation.get('company_id').setValue(this.data.companyId);
      this.company=this.data.company;
      this.companySettings.booking_doc_name_variation=this.companySettings.booking_doc_name_variation;
      this.id = +this.data.docId;
      this.locale=this.data.locale;
      this.receivedJobtitlesList=this.data.jobtitles;
      this.receivedDepartmentsWithPartsList=this.data.departmentsWithParts;
      this._adapter.setLocale(this.locale);
      // if(this.data && this.data.transmittedEvent)
      // console.log("locale = ",this.locale);
    }


    // listener of employee search field change
    this.filteredEmployeesList = this.formBaseInformation.get('employeeName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.receivedEmployeesList))
    );
    
    this.getSetOfPermissions();//
    
  }
  // ngAfterContentChecked() {

  //   this.cdRef.detectChanges();

  // }
  get childFormValid() {
    if(this.getControlTablefield!=undefined)
    //если нет ошибок в форме, включая отсутствие дробного количества у неделимых товаров
      return (this.getControlTablefield().valid);
    else return true;    //чтобы не было ExpressionChangedAfterItHasBeenCheckedError. Т.к. форма создается пустая и с .valid=true, а потом уже при заполнении проверяется еще раз.
  }
  get createUpdateButtonDisabled(){
    return(
      this.oneClickSaveControl||
      !this.childFormValid||
      !this.formBaseInformation.valid||
      +this.formBaseInformation.get('department_part_id').value==0 ||
      !this.isDatesValid||
      (this.formBaseInformation.get('department_part_id').value>0 && !this.accessibleDepPartsIdsAll.includes(+this.formBaseInformation.get('department_part_id').value))||
      (this.isThereAreServicesInTableWithEmployeeRequired() && +this.formBaseInformation.get('employeeId').value==0) ||
      (this.isThereAreServicesInTableWithEmployeeRequired() && +this.formBaseInformation.get('employeeId').value>0 && (!this.accessibleEmployeesIdsAll.includes(+this.formBaseInformation.get('employeeId').value)))
    );
  }
  // get sumPrice() {
  //   if(this.productSearchAndTableByCustomersComponent!=undefined){
  //     return this.productSearchAndTableByCustomersComponent.totalProductSumm;
  //   } else return 0;
  // }
  // get sumNds() {
  //   if(this.productSearchAndTableByCustomersComponent!=undefined){
  //     return this.productSearchAndTableByCustomersComponent.getTotalNds();
  //   } else return 0;
  // }
  // filtration on each change of text field
  private _filter(value: string, list:Employee[]): Employee[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getDepartmentIdByDepPartId(depPartId?:number){
    let depId=null;
    let dpId=depPartId?depPartId:this.formBaseInformation.get('department_part_id').value
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(depPart=>{
        if(depPart.id==dpId)
          depId=department.department_id;
      })
    });
    return depId;
  }

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=59')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                      // this.necessaryActionsBeforeGetChilds();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==705)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==706)});
    this.allowToCreateMyDepartments = this.permissionsSet.some(        function(e){return(e==707)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==708)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==709)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==710)});
    this.allowToViewMyDocs = this.permissionsSet.some(                 function(e){return(e==711)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==712)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==713)});
    this.allowToUpdateMyDepartments = this.permissionsSet.some(        function(e){return(e==714)});
    this.allowToUpdateMyDocs = this.permissionsSet.some(               function(e){return(e==715)});
    this.allowToCompleteAllCompanies = this.permissionsSet.some(       function(e){return(e==720)});
    this.allowToCompleteMyCompany = this.permissionsSet.some(          function(e){return(e==721)});
    this.allowToCompleteMyDepartments = this.permissionsSet.some(      function(e){return(e==722)});
    this.allowToCompleteMyDocs = this.permissionsSet.some(             function(e){return(e==723)});
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
    let documentOfMyDepartments:boolean = (this.inMyDepthsId(+this.getDepartmentIdByDepPartId()));
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
    // console.log("allowToCreateAllCompanies - "+this.allowToCreateAllCompanies);
    // return true;
    this.rightsDefined=true;//!!!
    this.formCustomerTableColumns();
    // this.addExampleInfo();
    // this.necessaryActionsBeforeAutoCreateNewDoc();
    // this.necessaryActionsBeforeGetChilds();
  }

  getData(){
    this.canGetChilds=true;
    if(+this.id>0){
      this.isMainDataLoading=true;
      this.getDocumentValuesById();
    }else {
      this.setDefaultCompany();
    }
  }
  getCompanyId(){
    return Cookie.get('appointments_companyId')
  }
  setDefaultCompany(){
    if(+this.formBaseInformation.get('company_id').value==0) // если не в режиме окна, то тут будет null
      this.formBaseInformation.get('company_id').setValue( // и тогда берем из куков, которые выставляются в /appointments через выбор предприятия.
        Cookie.get('appointments_companyId')=="0"? // если в куках нет информации о выбранном предприятии - ставим своё по дефолту
        (this.myCompanyId):+Cookie.get('appointments_companyId')
      );
      this.getPriceTypesList();
      this.getSpravTaxes();
      // this.getSetOfTypePrices();//загрузка типов цен для покупателя, склада и по умолчанию  
      this.getDepartmentsList();
      this.getStatusesList(); 
      this.getCompanySettings();
      this.getDepartmentsWithPartsList();
      this.getJobtitleList();
      this.getSettings();
      this.getSpravSysEdizm(); //загрузка единиц измерения.
  }
  getCompanySettings(){
    this.http.get('/api/auth/getCompanySettings?id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
        data => {         
          this.companySettings = data as any;
          this.formBaseInformation.get('nds').setValue(this.companySettings.vat);
          this.formBaseInformation.get('nds_included').setValue(this.companySettings.vat_included);
          this.hideOrShowNdsColumn();//формирование столбцов для таблицы товаров уже после того как определилось, есть ли налоги в предприятии
                                     //forming of columns for the table of services and products after it has been determined whether there are taxes in the enterprise
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  // т.к. всё грузится и обрабатывается асинхронно, до авто-создания документа необходимо чтобы выполнились все нужные для этого действия
  // necessaryActionsBeforeAutoCreateNewDoc(){
  //   if(+this.id==0){
  //     this.actionsBeforeCreateNewDoc++;
  //     //Если набрано необходимое кол-во действий для создания вручную (по кнопке)
  //     if(this.actionsBeforeCreateNewDoc==4) this.canCreateNewDoc=true;
      
  //     if(
  //       this.actionsBeforeCreateNewDoc==5 && //Если набрано необходимое кол-во действий для АВТОсоздания
  //       this.settingsForm.get('autocreateOnStart').value && //и есть автоматическое создание на старте (autocreateOnStart)
  //       +this.formBaseInformation.get('department_part_id').value>0  // и часть отделения выбрана
  //     ){
  //       this.canCreateNewDoc=true;
  //       this.createNewDocument();
  //     }
  //   }
  // }

  // necessaryActionsBeforeGetChilds(){
  //   this.actionsBeforeGetChilds++;
  //   // Если набрано необходимое кол-во действий - все остальные справочники загружаем тут, т.к. 
  //   // нужно чтобы сначала определилось предприятие, его id нужен для загрузки
  //   if(this.actionsBeforeGetChilds==4 && +this.id==0){
  //     console.log("Can get second part!")
  //     this.canGetChilds=true;
  //     this.getPriceTypesList();
  //     this.getSpravTaxes();
  //     this.getSetOfTypePrices();//загрузка типов цен для покупателя, склада и по умолчанию  
  //     this.getDepartmentsList();
  //     this.getStatusesList(); 
  //     this.getCompanySettings(); // because at this time companySettings loads only the info that needs on creation document stage (when document id=0)
  //     this.getDepartmentsWithPartsList();
  //     this.getJobtitleList();
  //     this.getSpravSysEdizm(); //загрузка единиц измерения. 
  //   }
  // }

  getMyId(){
    if(+this.myId==0)
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  
                  this.getMyCompanyId();
                  // this.necessaryActionsBeforeGetChilds();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();    
  }

  getMyCompanyId(){
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          // this.necessaryActionsBeforeGetChilds();
          this.getMyDepartmentsList();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else {
      // this.necessaryActionsBeforeGetChilds();
      this.getMyDepartmentsList();
    }    
  }

  getMyDepartmentsList(){
    if(this.receivedMyDepartmentsList.length==0)
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
      .subscribe(
          (data) => {this.receivedMyDepartmentsList=data as any [];            
          this.getCRUD_rights();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
    else this.getCRUD_rights();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
      .subscribe(
          (data) => {this.receivedDepartmentsList=data as any [];
            this.doFilterDepartmentsList();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  getDepartmentsWithPartsList(){ 
    if(this.receivedDepartmentsWithPartsList.length==0)
      return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.formBaseInformation.get('company_id').value)
        .subscribe(
            (data) => {   
              this.receivedDepartmentsWithPartsList=data as any [];
              if(+this.id==0) 
                this.setDefaultDepartmentPart();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
    else if(+this.id==0) this.setDefaultDepartmentPart();
  }
  setDefaultDepartmentPart(){
    // console.log("Setting default department part")
    //если в настройках не было предприятия, и в списке предприятий только одно предприятие - ставим его по дефолту
    //if(+this.formBaseInformation.get('department_part_id').value==0 && this.receivedDepartmentsWithPartsList.length>0){
      //this.formBaseInformation.get('department_part_id').setValue(this.receivedDepartmentsWithPartsList[0].parts[0].id);
    //}
    //если часть отделения была выбрана (через настройки или же в этом методе) - определяем наименование её отделения (оно будет отправляться в дочерние компоненты)
    // if(+this.formBaseInformation.get('department_part_id').value>0)
      // this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.getDepartmentIdByDepPartId()));
    //загрузка типов цен для склада и по умолчанию  
    this.getSetOfTypePrices();
  }

  getJobtitleList(){ 
    this.http.get('/api/auth/getJobtitlesList?company_id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {   
                      this.receivedJobtitlesList=data as any [];
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  getAppointmentChildDocs(){ 
    this.gettingAppointmentChildDocsTableData=true;
    this.http.get('/api/auth/getAppointmentChildDocs?id='+this.id)
      .subscribe(
          (data) => {   
                      this.appointmentChildDocs=data as AppointmentChildDoc[];
                      this.gettingAppointmentChildDocsTableData=false;
      },
      error => {this.gettingAppointmentChildDocsTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  delAppointmentChildDoc(doc:AppointmentChildDoc){

  }
  // проверки на различные случаи
  checkAnyCases(){
    //проверка на то, что часть отделения все еще числится в отделениях предприятия (не было удалено и т.д.)
    if(!this.inDepthsId(+this.getDepartmentIdByDepPartId())){
      this.formBaseInformation.get('department_part_id').setValue(0);
    }
    //проверка на то, что отделение подходит под ограничения прав (если можно создавать только по своим отделениям, но выбрано отделение, не являющееся своим - устанавливаем null в выбранное id отделения)
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      if(!this.inMyDepthsId(+this.getDepartmentIdByDepPartId())){
        this.formBaseInformation.get('department_part_id').setValue(0);
      }
    }
    // if(!this.canGetChilds) this.refreshPermissions();
  }

  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,59)
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
    this.refreshPermissions();
  }

  getSpravSysEdizm():void {    
    let companyId=+this.formBaseInformation.get('company_id').value;
    this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5,6)"})  // все типы ед. измерения
    .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
            },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

  get isDatesValid():boolean{
    // if(
    //   !moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm', true).isValid() ||
    //   !moment(moment(new Date(this.formBaseInformation.get('date_end').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_end').value), 'DD.MM.YYYY HH:mm', true).isValid()
    // ) return false; else return true;
    var beginningTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm');
    var endTime = moment(moment(new Date(this.formBaseInformation.get('date_end').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_end').value), 'DD.MM.YYYY HH:mm');
    if(beginningTime.isBefore(endTime)) return true; else return false;
  }
  
  setDefaultDate(){
    if(this.data){
      // If Appointment is creating by dragging in "CalendarView.Scheduler" screen
      
      if(this.data.transmittedEvent){ 
        this.formBaseInformation.get('date_start').setValue(moment(this.data.transmittedEvent.start));
        this.formBaseInformation.get('time_start').setValue(moment(this.data.transmittedEvent.start).format("HH:mm"));
        if(this.data.transmittedEvent.end){
          this.formBaseInformation.get('date_end').  setValue(moment(this.data.transmittedEvent.end));
          this.formBaseInformation.get('time_end').setValue(moment(this.data.transmittedEvent.end).format("HH:mm"));
        } else {
          this.formBaseInformation.get('date_end').setValue(moment(this.data.transmittedEvent.start));
          this.formBaseInformation.get('time_end').setValue(moment(this.data.transmittedEvent.start).add(+30,'minutes').format("HH:mm"));
        }
      } else
      // If Appointment is creating by clicking on (+) in "CalendarView.Day" screen
      if(this.data.calendarViewDayDate){
        this.formBaseInformation.get('date_start').setValue(moment(this.data.calendarViewDayDate));
      } // All other times will be getted from settings in applyInitialTimeSettings()
    }

   



    //  else { 
    //   this.formBaseInformation.get('date_start').setValue(moment());
    //   this.formBaseInformation.get('date_end').  setValue(moment().add(0,'d'));
    //   this.formBaseInformation.get('time_start').setValue(moment().format("HH:mm"));
    //   this.formBaseInformation.get('time_end').  setValue(moment().add(+1,'h').format("HH:mm"));    }
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
  // searchOrCreateNewCagent(is_adding:boolean){
  //   this.is_addingNewCustomer=is_adding;
  //   if(is_adding){
  //     this.formBaseInformation.get('cagent_id').disable();
  //     this.formBaseInformation.get('new_cagent').enable();
  //   } else{
  //     this.formBaseInformation.get('cagent_id').enable();
  //     this.formBaseInformation.get('new_cagent').disable();
  //   }
    // this.searchCustomerCtrl.setValue('');
  //   this.formBaseInformation.get('new_cagent').setValue('');
  //   this.checkEmptyCagentField();
  // }
  //  -------------     ***** поиск по подстроке для покупателя ***    --------------------------
  onCagentSearchValueChanges(){
    if(!this.isCustomerListLoading)
      this.searchCustomerCtrl.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => {
          this.filteredCustomers = [];}),       
        switchMap(fieldObject =>  
          this.getCustomersList()))
      .subscribe(data => {
        this.isCustomerListLoading = false;
        if (data == undefined) {
          this.filteredCustomers = [];
        } else {
          this.filteredCustomers = data as any;
  }});}
  
  onSelectCustomer(id:number, name:string){
    this.formCustomerSearch.get('id').setValue(+id);
    // this.searchCustomerCtrl.setValue(name);
    // this.formCustomerSearch.get('customer').setValue(name);
    this.getCagentValuesById(id);
    //Загрузим тип цены для этого Покупателя, и 
    //если в форме поиска товаров приоритет цены выбран Покупатель, то установится тип цены этого покупателя (если конечно он у него есть)
    this.getSetOfTypePrices();
  }

  getCagentValuesById(id:number){
    this.isCagentValuesLoading=true;
    const body = {"id": id};
    this.http.post('/api/auth/getCagentValues', body).subscribe(
        data => { 
            let documentValues: any = data as any;
            this.formCustomerSearch.get('telephone').setValue(documentValues.telephone==null?'':documentValues.telephone);
            this.formCustomerSearch.get('email').setValue(documentValues.email==null?'':documentValues.email);
            this.isCagentValuesLoading=false;
            this.addCustomerRow(documentValues.id,documentValues.name);
        },
        error => {this.isCagentValuesLoading=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  //--------------------------------------- **** поиск по подстроке для товара  ***** ------------------------------------
  onProductSearchValueChanges(){
    this.searchProductCtrl.valueChanges
    .pipe(
      debounceTime(800),
      tap(() => {
        this.filteredProducts = [];
        // if(+this.formBaseInformation.get('product_id').value==0) this.canAutocompleteQuery=true;
        // console.log(this.searchProductCtrl.value)
      }),      
      
      switchMap(fieldObject => 
        this.getProductsList()),

    ).subscribe(data => {
      this.isProductListLoading = false;
      if (data == undefined) {
        this.filteredProducts = [];
      } else {
        this.filteredProducts = data as AppointmentServiceSearchResponse[];
        if(this.filteredProducts.length==1 && (this.accessibleServicesIdsAll().includes(this.filteredProducts[0].id)||!this.filteredProducts[0].isServiceByAppointment)){
          this.canAutocompleteQuery=false;
          // this.searchProductCtrl.setValue(this.filteredProducts[0].name);
          this.onSelectProductCustomer(this.filteredProducts[0]);
        }
    }}
      ,error => {this.isProductListLoading = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  } 
  resetProductFormSearch(){
    this.searchProductCtrl.reset();
    // this.formBaseInformation.get('product_id').setValue(null);
    // this.mainProduct= null;
    // this.deleteAllCustomersProducts(true);
    // this.getTotalSumPrice;
  }
  // onProductCustomerSearchValueChanges(){
  //   this.searchProductCustomerCtrl.valueChanges
  //   .pipe(
  //     debounceTime(500),
  //     tap(() => {
  //       this.filteredProductsCustomer = [];
  //       //this.canAutocompleteQuery=true;
  //       console.log(this.searchProductCustomerCtrl.value)
  //     }),      
  //     switchMap(fieldObject => 
  //       this.getProductsCustomerList()),
  //   ).subscribe(data => {
  //     this.isProductCustomerListLoading = false;
  //     if (data == undefined) {
  //       this.filteredProductsCustomer = [];
  //     } else {
  //       this.filteredProductsCustomer = data as any;
  //       // if(this.filteredProducts.length==1){
  //         // this.onAutoselectProduct();
  //       // }
  //   }}
  //     ,error => {this.isProductCustomerListLoading = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
  //     );
  // }
  resetProductCustomerFormSearch(){
    this.searchProductCustomerCtrl.reset();
  }
  deleteAllCustomerProductsByRowId(row_id:number){
    const control = this.getControlTablefield();
    var i = control.controls.length;
    console.log('i',i)
    console.log('control.length',control.length)
    while (i > 0) { 
      i--;
        if (control.at(i).get('customerRowId').value==row_id) {
          control.removeAt(i);
        }
    }
  }
  deleteAllCustomersProducts(){
    const control = this.getControlTablefield();
    var i = control.controls.length;
    while (i > 0) { 
      i--;
      // console.log('i1',i)
        // if (!onlyMain || control.at(i).get('is_main').value) {
          control.removeAt(i);
        // }
      // console.log('i2',i)
    }
  } 
  deleteProductRow(index:number) {
    // console.log('index',index)
    // const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
    //   width: '400px',
    //   data:
    //   { 
    //     head: translate('docs.msg.del_prod_item'),
    //     warning: translate('docs.msg.del_prod_quer',{name:row.name})+'?',
    //   },
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   if(result==1){
      this.documentChanged=true;
        const control = this.getControlTablefield();
        // console.log('Trying remove at ',index)
        control.removeAt(index);
        this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
        this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
        this.finishRecount(); // подсчёт тоталов в таблице
        this.recountEndDateTime();
    //   }
    // }); 
  }
  refreshTableColumns(){
    this.displayedCustomerProductsColumns=[];
    setTimeout(() => { 
      this.hideOrShowNdsColumn();
    }, 1);
  }
  clearCustomerProductsTable(row:any): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.documentChanged=true;
          // console.log('customerRowId = ',row.row_id)
          this.deleteAllCustomerProductsByRowId(row.row_id)
          this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
          this.recountEndDateTime();
        }});  
  }
  getEdizmNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysEdizmOfProductAll.forEach(a=>{
      if(+a.id == srchId) name=a.short_name
    }); return name;}

  getProductsListQueryBody(){
    return  {
        searchString: this.searchProductCtrl.value,
        appointmentId:this.id,
        employeeId:   this.formBaseInformation.get('employeeId').value,
        companyId:    this.formBaseInformation.get('company_id').value,
        dateFrom:     this.formBaseInformation.get('date_start').value,
        timeFrom:     this.timeTo24h(this.formBaseInformation.get('time_start').value),
        dateTo:       this.formBaseInformation.get('date_end').value,
        timeTo:       this.timeTo24h(this.formBaseInformation.get('time_end').value),
        servicesIds:  []/*+this.formBaseInformation.get('product_id').value==0?[]:[this.formBaseInformation.get('product_id').value]*/,
        depPartsIds:  this.formBaseInformation.get('department_part_id').value==0?[]:[this.formBaseInformation.get('department_part_id').value],
        jobTitlesIds: this.formBaseInformation.get('jobtitle_id').value==0?[]:[this.formBaseInformation.get('jobtitle_id').value],
        priceTypeId:  +this.default_type_price_id,
        querySource:  'manually'
      }
  }

  getProductsList(){
    if(!this.isProductListLoading){// смысла долбить сервер, пока он формирует ответ, нет. Плюс иногда onProductSearchValueChanges отрабатывает дуплетом, что приводит к двойному добавлению товара
      try{
        const body = this.getProductsListQueryBody(); 
        if(this.canAutocompleteQuery && this.searchProductCtrl.value.length>1){
          this.isProductListLoading  = true;
          return this.http.post('/api/auth/getAppointmentServicesSearchList',body);
        }else return [];
      } catch (e) {return []}
    } else return [];
  }
  
  getCalendarEventsQueryBody(){
    return  {
        // appointmentId:+this.id,
        companyId:    this.formBaseInformation.get('company_id').value,
        dateFrom:     this.formBaseInformation.get('date_start').value,
        timeFrom:     this.timeTo24h(this.formBaseInformation.get('time_start').value),
        dateTo:       this.formBaseInformation.get('date_end').value,
        timeTo:       this.timeTo24h(this.formBaseInformation.get('time_end').value),
        depparts:     [],
        employees:    []
      }
  }





  refreshNowUsedResources(){
    let events:any[]=[];
    this.http.post('/api/auth/getCalendarEventsList', this.getCalendarEventsQueryBody()).subscribe(
      (data) => {
        if(!data){
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
        }
        events=data as CalendarEvent[];
        let control = this.getControlTablefield();
        control.value.map(service=>{
          service.departmentPartsWithResourcesIds.map(depPart=>{
              depPart.resourcesOfDepartmentPart.map(depPartResource=>{
                depPartResource.now_used=this.getMaxUsedResourceQtt(depPart.id, depPartResource.id, events);
              })
          });
        });
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
    );
  }

  getMaxUsedResourceQtt(depPartId:number, resourceId:number, allEvents:CalendarEvent[]):number{ 

    let maxSumOfQueriedResource =0;
    // Каждое событие имеет список ресурсов, которые используются в услугах этого события
    // Эта функция помогает узнать, есть ли ресурс с идентификатором в списке ресурсов события
    // Each event has a list of resources that used in services of this event
    // This function helps to know whether resource with ID is in the list of resources of event
    function isEventResourcesHasResource(resources:any[],resourceId:number){
      let result=false;
      resources.map(resource=>{
        if(resource.id === resourceId) result=true; 
      });
      return result;
    }
    if(allEvents.length>0){
        // Создаем локальный список событий, оставляя из общего списка только те события, что относятся к запрашиваемым части отделения и ресурсу
        // Create a local list of events, leaving from the general list only those events that relate to the queried part of the department and resource
      let events: CalendarEvent[] = allEvents.filter(
        function (event) {
          return (
            isEventResourcesHasResource(event.meta.itemResources, resourceId)
            && event.meta.departmentPartId==depPartId
            ) 
        }
      )
    
      events.map(mainCycleEvent=>{
        // if(!result){ // если в одном из циклов уже было получено положительное значение (т.е. ресурса не хватает) - все остальные нужно пропусить
        let intersectedWithEachOtherEventsGroup: CalendarEvent[]=[];
        intersectedWithEachOtherEventsGroup.push(mainCycleEvent);

        events.map(compareCycleEvent=>{
          if(mainCycleEvent.id != compareCycleEvent.id){ // сравниваем с каждым другим, но не с самим собой

            let countOfIntersectionsWithGroupEvents = 0;
            intersectedWithEachOtherEventsGroup.map(eventOfIntersectiondGroup=>{
              if(compareCycleEvent.start < eventOfIntersectiondGroup.end && compareCycleEvent.end > eventOfIntersectiondGroup.start)
                countOfIntersectionsWithGroupEvents++;
            })
            if(countOfIntersectionsWithGroupEvents==intersectedWithEachOtherEventsGroup.length)
              intersectedWithEachOtherEventsGroup.push(compareCycleEvent);
          }
        });

        // Сейчас у получившейся группы событий, у events которой есть общее одновременное пересечение, нужно получить сумму по запрашиваемому ресурсу
        let sumOfQueriedResource = 0;
        intersectedWithEachOtherEventsGroup.map(eventOfIntersectiondGroup=>{
          eventOfIntersectiondGroup.meta.itemResources.map(resource=>{
            
            if(resource.id == resourceId && 
              // не берем во внимание ресурсы из текущего документа // do not take into account resources from the current document 
              eventOfIntersectiondGroup.id != +this.id &&
              // не берем во внимание ресурсы из отменённых документов // do not take into account resources from the cancelled documents
              eventOfIntersectiondGroup.meta.statusType !=3 
              ) sumOfQueriedResource = sumOfQueriedResource + resource.usedQuantity;
          })
        })
        // и если единовременное использование ресурса больше чем его количество, имеющееся в части отделения, то значит ресурса не хватает
        if(sumOfQueriedResource>maxSumOfQueriedResource) 
          maxSumOfQueriedResource=sumOfQueriedResource;
        // }
      })   
    }
    return maxSumOfQueriedResource;
  }
  getProductsCustomerList(){
    if(!this.isProductCustomerListLoading){
      try{
        if(this.canAutocompleteQuery && this.searchProductCustomerCtrl.value.length>1){
          this.isProductCustomerListLoading  = true;
          return this.http.get('/api/auth/getProductsList?searchString='+this.searchProductCustomerCtrl.value+'&companyId='+this.formBaseInformation.get('company_id').value+'&departmentId='+this.getDepartmentIdByDepPartId()+'&document_id=0&priceTypeId='+(+this.default_type_price_id)+'&showRemovedFromSale=false&showNotPurchased=true&showServices=true');
        }else return [];
      } catch (e) {return []}
    } else return [];
  }
  checkEmptyProductField(){if(!this.searchProductCtrl.value || this.searchProductCtrl.value.length==0) this.resetProductFormSearch();}
  // checkEmptyProductCustomerField(){if(!this.searchProductCustomerCtrl.value || this.searchProductCustomerCtrl.value.length==0) this.resetProductCustomerFormSearch();}

  /*
  onAutoselectProduct(){
    this.canAutocompleteQuery=false;
    this.formSearch.get('product_count').setValue('1');
    this.formSearch.get('available').setValue(this.filteredProducts[0].total-this.filteredProducts[0].reserved); //Поле "Доступно" = "Всего" - "В резервах"
    this.formSearch.get('total').setValue(this.filteredProducts[0].total); //Поле "Всего" - всего единиц товара в отделении (складе)
    this.formSearch.get('reserved').setValue(this.filteredProducts[0].reserved);//Поле "В резервах" - зарезервировано в этом отделении в других Заказах покупателя
    this.formSearch.get('product_id').setValue(+this.filteredProducts[0].id);
    this.searchProductCtrl.setValue(this.filteredProducts[0].name);
    this.formSearch.get('nds_id').setValue(+this.filteredProducts[0].nds_id);
    this.formSearch.get('edizm_id').setValue(+this.filteredProducts[0].edizm_id);
    this.productImageName = this.filteredProducts[0].filename;
    this.formSearch.get('ppr_name_api_atol').setValue(this.filteredProducts[0].ppr_name_api_atol);
    this.formSearch.get('is_material').setValue(this.filteredProducts[0].is_material);
    this.formSearch.get('reserved_current').setValue(this.filteredProducts[0].reserved_current);
    this.formSearch.get('indivisible').setValue(this.filteredProducts[0].indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    this.afterSelectProduct();
  }
  onPriceTypeSelection(){
    this.selected_type_price_id = +this.formSearch.get('price_type_id').value;
    if(this.priorityTypePriceId!=this.selected_type_price_id && +this.priorityTypePriceId!=0){//если тип цены, выбранный через поле "Приоритет типа цены" отличен от типа цены, выбранного через поле "Тип цены"
      //показываем предупреждение
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.diff_pricetyp')+" ("+this.getPriceTypesNameById(this.priorityTypePriceId)+")"}});
    }
    if(+this.formSearch.get('product_id').value>0){//если товар в форме поиска выбран
      this.getProductsPriceAndRemains();
    }
  }*/
  // onClickProductInSelectList(product:AppointmentServiceSearchResponse){
  //   if(this.accessibleServicesIdsAll.includes(product.id)) {this.onSelectProduct(product)}
  // }
  // onSelectProduct(product:AppointmentServiceSearchResponse){
    // this.formBaseInformation.get('product_id').setValue(+product.id);
    // this.mainProduct=product;
    // this.productImageName = product.filename;
    // this.addMainProductToPayingCustomers();
    // this.afterSelectProduct();
  // }
  
  onSelectProductCustomer(product:AppointmentServiceSearchResponse, customer=this.customer){
    if(!product.isServiceByAppointment || (product.isServiceByAppointment && this.accessibleServicesIdsAll().includes(product.id))){ // if not [disabled]
      if(!this.isThereProductInTable(customer.row_id, product.id)){
        this.documentChanged=true;
        // console.log(console.log('Selected customer: ',JSON.stringify(customer)));
        const control = <UntypedFormArray>this.formBaseInformation.get('appointmentsProductTable');
        control.push(this.formingProductRowFromMainBlock(product,customer.id,customer.row_id));
        let row_index = 0;
        control.value.map(service=>{this.setRowSumPrice(row_index);row_index++})// re-calculating all sum prices
        // this.setRowSumPrice(control.value.length-1);// re-calculating sum price of added row
        setTimeout(() => {this.searchProductCtrl.reset();}, 1);
        this.getTotalSumPrice();
        this.recountEndDateTime();
        if(control.length>0 && !this.isThereAreServicesInTableWithEmployeeRequired()){ // if there are selected services but no one of selected sevices required employee
          this.formBaseInformation.get('employeeId').setValue(null);
          this.formBaseInformation.get('employeeName').setValue('');
          this.formBaseInformation.get('jobtitle_id').setValue(0);
        }
      } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.prd_alr_slctd')}});
    } 
  }
  
  afterSelectProduct(){
      // this.edizmName=this.getEdizmNameBySelectedId(+this.formSearch.get('edizm_id').value);
      // this.formSearchReadOnly=true;
      // if(!this.autoAdd)this.loadMainImage();//если автодобавление, то картинку грузить ни к чему
      // this.getProductsPriceAndRemains();
  }

  // addMainProductToPayingCustomers(){
  //   if(+this.formBaseInformation.get('product_id').value>0){
  //     this.formBaseInformation.get('customersTable').value.map(customer=>{
  //       if(customer.is_payer && !this.customerHasMainProduct(customer.row_id)){
  //         console.log('Payer: ', customer.name);
  //         const control = <UntypedFormArray>this.formBaseInformation.get('appointmentsProductTable');
  //         control.push(this.formingProductRowFromMainBlock(this.mainProduct,customer.id,customer.row_id));
  //       }
  //     });
  //     this.getTotalSumPrice;
  //   }    
  // }

  // customerHasMainProduct(customerRowId:number){
  //   let has = false;
  //   this.formBaseInformation.value.appointmentsProductTable.map(i =>{
  //     if(i.is_main && i.customerRowId==customerRowId) has = true;
  //   });
  //   return has;
  // }
  // customerHasNoMainProducts(customerRowId:number){
  //   let has = false;
  //   this.formBaseInformation.value.appointmentsProductTable.map(i =>{
  //     if(!i.is_main && i.customerRowId==customerRowId) has = true;
  //   });
  //   return has;
  // }
  // addMainProductToNewPayingCustomer(row_id:number, customer_id:number){
  //   const control = <UntypedFormArray>this.formBaseInformation.get('appointmentsProductTable');
  //   if(this.formBaseInformation.get('product_id').value && !this.customerHasMainProduct(row_id)){
  //       control.push(this.formingProductRowFromMainBlock(this.mainProduct,customer_id,row_id)); 
  //   }
  //   this.getTotalSumPrice;
  // }
  
  formingProductRowFromMainBlock(product: AppointmentServiceSearchResponse, customerId:number, customerRowId:number) {
    return this._fb.group({
      customerRowId:customerRowId,
      customerId:customerId,
      product_id: new UntypedFormControl (product.id,[]),
      appointment_id: new UntypedFormControl (+this.id,[]),
      name: new UntypedFormControl (product.name,[]),
      product_count: new UntypedFormControl (this.getProductTimeQtt(product),[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      edizm: new UntypedFormControl (product.edizm,[]),
      edizm_id:  new UntypedFormControl (product.edizm_id,[]),
      edizm_type_id:  new UntypedFormControl (product.edizm_type_id,[]),
      product_price:  new UntypedFormControl (this.numToPrice(product.priceOfTypePrice,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')/*,ValidationService.priceMoreThanZero*/]),
      product_price_of_type_price: new UntypedFormControl (product.priceOfTypePrice,[]),
      product_sumprice: new UntypedFormControl (this.numToPrice(product.priceOfTypePrice,2),[]),
      available:  new UntypedFormControl ((product.total)-(product.reserved),[]),
      price_type_id: [this.default_type_price_id],
      nds_id: new UntypedFormControl (product.nds_id,[]),
      total: new UntypedFormControl (product.total,[]),
      department_id: new UntypedFormControl (this.getDepartmentIdByDepPartId(),[]), //id отделения, выбранного в форме поиска 
      is_material:  new UntypedFormControl (product.is_material,[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      shipped:  new UntypedFormControl (0,[]),
      indivisible: new UntypedFormControl (product.indivisible,[]),
      // is_main:  new UntypedFormControl (is_main,[]), // Main product (service) of this appointment or reservation
      employeeRequired: new UntypedFormControl (product.employeeRequired,[]),
      departmentPartsWithResourcesIds: new UntypedFormControl (product.departmentPartsWithResourcesIds,[]),
      unitOfMeasureTimeInSeconds: new UntypedFormControl (product.unitOfMeasureTimeInSeconds,[]),
      isServiceByAppointment: new UntypedFormControl (product.isServiceByAppointment,[]),     // It's a service and it's a service by appointment
      srvcDurationInSeconds:  new UntypedFormControl (product.srvcDurationInSeconds,[]), 

      //---------------------------------
      // department: new UntypedFormControl (product.department,[]), //имя отделения, выбранного в форме поиска 
      // shipped:  new UntypedFormControl (product.shipped,[]),
      // ppr_name_api_atol:  new UntypedFormControl (product.ppr_name_api_atol,[]), //Признак предмета расчета в системе Атол
      // price_type:  new UntypedFormControl (product.price_type,[]),
      // edizm_type_id: new UntypedFormControl (product.edizm_type_id,[]),
      // edizm_multiplier:new UntypedFormControl (product.edizm_multiplier,[]),
    });
  }

  formingProductRowFromApiResponse(row: AppointmentsProductTable) {
    return this._fb.group({
      product_id: new UntypedFormControl (row.id,[]),
      customerRowId: new UntypedFormControl (row.cagent_row_id,[]),
      customerId:  new UntypedFormControl (row.cagent_id,[]),
      name: new UntypedFormControl (row.name,[]),
      appointment_id: new UntypedFormControl (this.id,[]),
      product_count: new UntypedFormControl (row.product_count,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      edizm: new UntypedFormControl (row.edizm,[]),
      edizm_id:  new UntypedFormControl (row.edizm_id,[]), 
      edizm_type_id:  new UntypedFormControl (row.edizm_type_id,[]),
      product_price:  new UntypedFormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')/*,ValidationService.priceMoreThanZero*/]),
      product_price_of_type_price: new UntypedFormControl (row.priceOfTypePrice,[]),
      product_sumprice: new UntypedFormControl (this.numToPrice(row.product_sumprice,2),[]),
      available:  new UntypedFormControl ((row.total)-(row.reserved),[]),
      price_type_id: [row.price_type_id],
      nds_id: new UntypedFormControl (row.nds_id,[]),
      reserved:  new UntypedFormControl (row.reserved,[]), // сколько зарезервировано этого товара в других документах за исключением этого
      total: new UntypedFormControl (row.total,[]),
      department_id: new UntypedFormControl (row.departmentId,[]), //id отделения, выбранного в форме поиска 
      department: new UntypedFormControl (row.departmentName,[]), //имя отделения, выбранного в форме поиска 
      employeeRequired: new UntypedFormControl (row.employeeRequired,[]),
      is_material:  new UntypedFormControl (row.is_material,[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      unitOfMeasureTimeInSeconds:  new UntypedFormControl (row.unitOfMeasureTimeInSeconds,[]),
      isServiceByAppointment: new UntypedFormControl (row.isServiceByAppointment,[]),     // It's a service and it's a service by appointment
      indivisible:  new UntypedFormControl (row.indivisible,[]), 
      maxPersOnSameTime:  new UntypedFormControl (row.maxPersOnSameTime,[]), 
      srvcDurationInSeconds:  new UntypedFormControl (row.srvcDurationInSeconds,[]), 
      atLeastBeforeTimeInSeconds:  new UntypedFormControl (row.atLeastBeforeTimeInSeconds,[]),
      departmentPartsWithResourcesIds: new UntypedFormControl (row.departmentPartsWithResourcesIds,[]),
    });
  }
  // loadMainImage(){
  //   if(this.productImageName!=null){
  //     this.getImageService('/api/auth/getFileImageThumb/' + this.productImageName).subscribe(blob => {
  //       this.createImageFromBlob(blob);
  //     });
  //   } 
  // }
  // showImage(name:string){
  //   if(this.productImageName!=null){
  //     // console.log("productImageName - "+this.productImageName);
  //     const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
  //       data:
  //       { 
  //         link: name,
  //       },
  //     });
  //   }
  // }
  // getImageService(imageUrl: string): Observable<Blob> {
  //   return this.http.get(imageUrl, {responseType: 'blob'});
  // }
  // createImageFromBlob(image: Blob) {
  //   let reader = new FileReader();
  //   reader.addEventListener("load", () => {
  //       this.imageToShow = reader.result;
  //   }, false);
  //   if (image) {
  //       reader.readAsDataURL(image);
  //   }
  // }
  //--------------------------------------- **** Конец поиска по подстроке для товара  ***** ------------------------------------

  //если новый документ - вставляем Отделение и Покупателя (но только если они принадлежат выбранному предприятию, т.е. предприятие в Основной информации и предприятие, для которого были сохранены настройки совпадают)
  setDefaultInfoOnStart(departmentPartId:number){
    if(+this.id==0){//документ новый
        this.formBaseInformation.get('company_id').setValue(+this.settingsForm.get('companyId').value)
        if(+departmentPartId>0){
          this.formBaseInformation.get('department_part_id').setValue(departmentPartId);
        }
        if(this.formBaseInformation.get('name').value=='')
          this.formBaseInformation.get('name').setValue(name);
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
    if(this.searchCustomerCtrl.value.length==0){
      this.resetFormCustomerSearch();
      // this.formExpansionPanelsString();
    }
  };

  getDocumentValuesById(){
    this.http.get('/api/auth/getAppointmentValuesById?id='+ this.id)
        .subscribe(
            data => {              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //!!!
                if(data!=null&&documentValues.company_id!=null){
                  //Заполнение формы из интерфейса documentValues:
                  this.formAboutDocument.get('id').setValue(+documentValues.id);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('owner').setValue(documentValues.owner);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                  this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('department_part_id').setValue(documentValues.dep_part_id);
                  this.formBaseInformation.get('department_part').setValue(documentValues.dep_part);
                  this.formBaseInformation.get('date_start').setValue((this.data&&this.data.transmittedEvent)?moment(this.data.transmittedEvent.start):(documentValues.date_start?moment(documentValues.date_start,'DD.MM.YYYY'):''));
                  this.formBaseInformation.get('date_end').setValue((this.data&&this.data.transmittedEvent)?moment(this.data.transmittedEvent.end):(documentValues.date_end?moment(documentValues.date_end,'DD.MM.YYYY'):''));
                  this.formBaseInformation.get('time_start').setValue((this.data&&this.data.transmittedEvent)?moment(this.data.transmittedEvent.start).format("HH:mm"):documentValues.time_start);
                  this.formBaseInformation.get('time_end').setValue((this.data&&this.data.transmittedEvent)?moment(this.data.transmittedEvent.end).format("HH:mm"):documentValues.time_end);
                  this.formBaseInformation.get('jobtitle_id').setValue((this.data&&this.data.transmittedEvent)?this.data.transmittedEvent.meta.user.jobtitle_id:documentValues.jobtitle_id);
                  this.formBaseInformation.get('jobtitle').setValue(documentValues.jobtitle);
                  this.formBaseInformation.get('employeeId').setValue((this.data&&this.data.transmittedEvent)?this.data.transmittedEvent.meta.user.id:documentValues.employeeId);
                  this.formBaseInformation.get('employeeName').setValue((this.data&&this.data.transmittedEvent)?this.data.transmittedEvent.meta.user.name:(documentValues.employeeName?documentValues.employeeName:''));
                  // this.formBaseInformation.get('department').setValue(documentValues.department);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formBaseInformation.get('nds').setValue(documentValues.nds);
                  this.formBaseInformation.get('nds_included').setValue(documentValues.nds_included);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                  this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                  this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                  this.formBaseInformation.get('uid').setValue(documentValues.uid);
                  this.oneClickSaveControl=false;
                  this.creatorId=+documentValues.creator_id;
                  this.is_completed=documentValues.is_completed;
                  this.showSearchCustomerFormFields=false;
                  this.formAppointmentChildDocsColumns();
                  this.getSpravSysEdizm();//справочник единиц измерения
                  this.getCompanySettings();
                  this.getSetOfTypePrices(); //загрузка цен по типам цен для выбранных значений (предприятие, отделение, контрагент)
                  this.getPriceTypesList();
                  // this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                  this.getDepartmentsList();//отделения
                  this.getStatusesList();//статусы документа Заказ покупателяthis.
                  this.getDepartmentsWithPartsList();
                  this.getJobtitleList();
                  this.getAppointmentChildDocs();
                  // this.hideOrShowNdsColumn();//расчет прятать или показывать колонку НДС
                  this.getSpravTaxes();//загрузка налогов
                  this.loadFilesInfo();
                  this.fillCustomersObjectListFromApiResponse(documentValues.customersTable);
                  this.fillProductsListFromApiResponse(documentValues.appointmentsProductTable);
                  this.getTotalSumPrice();
                  this.getSettings();
                  
                  this.isMainDataLoading=false;
                  this.showBalanceModules=false;
                  setTimeout(() => { 
                    this.showBalanceModules=true;
                  }, 1);
                  // this.cheque_nds=documentValues.nds;//нужно ли передавать в кассу (в чек) данные об НДС 
                  
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {this.gettingAppointmentChildDocsTableData=false;this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }
  getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    // this.getProductsTable();
    return (this.formBaseInformation.value.appointmentsProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
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
  
  getControl(formControlName){
    const control = <UntypedFormArray>this.formBaseInformation.get(formControlName);
    return control;
  }
  // hideOrShowNdsColumn(){
  //   if(this.formBaseInformation.get('nds').value){
  //     this.displayedColumns = ['select','name','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','nds','department',/*'id','row_id','indx',*/'delete'];
  //   } else {
  //     this.displayedColumns = ['select','name','product_count','edizm','product_price','product_sumprice','reserved_current','available','total','reserved','shipped','price_type','department',/*'id','row_id','indx',*/'delete'];
  //   }
  // }

  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('appointmentsProductTable');
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

  onCreateUpdateDocumentButtonClick(operationName:string){
    if(this.getControlTablefield().length==0 || this.getControl('customersTable').length==0){
      console.log('this.getControlTablefield.length',this.getControlTablefield().length),
      console.log('this.getControl("customersTable").length',this.getControl('customersTable').length)
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.select_customer')}}); 
    } else {
      switch(operationName){
        case 'create':{
          this.createNewDocument();
          break;}
        case 'update':{
          this.updateDocument();
          break;}
  }}}

  createNewDocument(){
    this.oneClickSaveControl=true;
    this.createdDocId=null;
    this.formBaseInformation.get('uid').setValue(uuidv4());
    if(this.formBaseInformation.get('name').value==''){this.formBaseInformation.get('name').setValue(this.generateName())}
    if(this.timeFormat=='12') {
      this.formBaseInformation.get('time_start').setValue(this.timeTo24h(this.formBaseInformation.get('time_start').value));
      this.formBaseInformation.get('time_end').setValue(this.timeTo24h(this.formBaseInformation.get('time_end').value));
    }

    this.http.post('/api/auth/insertAppointment', this.formBaseInformation.value)
    .subscribe(
      (data) =>   {
        let response=data as any;
        //создание документа было успешным
        if(response.success){
          this.documentChanged=false;
          this.actionsBeforeGetChilds=0;
          this.id=response.id;
          this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)}), translate('docs.msg.close'));
          if(this.mode == 'standart') this._router.navigate(['/ui/appointmentsdoc', this.id]);
          this.formBaseInformation.get('id').setValue(this.id);
          this.rightsDefined=false; //!!!
          if(this.data) this.data.transmittedEvent=null; // for in the case of creating by gragging, in getData() to not get data of begin time, end time and employee from transmittedEvent
          this.getData();
          this.showSearchCustomerFormFields=false;          
          this.baseData.emit('documentUpdated');// to refresh events in Calendar
        //создание документа было не успешным
        } else {
          switch(response.errorCode){
            case 1:{// 1 возвращает если не удалось создать документ из-за ошибки 
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)})}}); 
              break;
            }
            case 2:{// 2 возвращает если не удалось сохранить таблиу товаров из-за ошибки 
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)})}}); 
              break;
            }
            case -1:{//недостаточно прав
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
              break;
            }
          }
        }
      },
      error => {this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  // completeDocument(notShowDialog?:boolean){ //+++
  //   if(!notShowDialog){
  //     const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
  //       width: '400px',data:{
  //         head:    translate('docs.msg.complet_head'),
  //         warning: translate('docs.msg.complet_warn'),
  //         query:   translate('docs.msg.complet_query')},});
  //     dialogRef.afterClosed().subscribe(result => {
  //       if(result==1){
  //         this.updateDocument(true);
  //       }
  //     });
  //   } else this.updateDocument(true);
  // }

  // decompleteDocument(notShowDialog?:boolean){ //+++
  //   if(this.allowToComplete){
  //     if(!notShowDialog){
  //       const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
  //         width: '400px',data:{
  //         head:    translate('docs.msg.cnc_com_head'),
  //         warning: translate('docs.msg.cnc_com_warn'),
  //         query: ''},});
  //       dialogRef.afterClosed().subscribe(result => {
  //         if(result==1){
  //           this.setDocumentAsDecompleted();
  //         }
  //       });
  //     } else this.setDocumentAsDecompleted();
  //   }
  // }

  // setDocumentAsDecompleted(){
  //   this.getProductsTable();    
  //   this.http.post('/api/auth/setappointmentsAsDecompleted',  this.formBaseInformation.value)
  //     .subscribe(
  //         (data) => 
  //         {   
  //           let result:number=data as number;
  //           switch(result){
  //             case null:{// null возвращает если не удалось завершить операцию из-за ошибки
  //               this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.cnc_com_error')}});
  //               break;
  //             }
  //             case -1:{//недостаточно прав
  //               this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
  //               break;
  //             }
  //             case -60:{//Документ уже снят с проведения
  //               this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.alr_cnc_com')}});
  //               break;
  //             }
  //             case 1:{// Успешно
  //               this.openSnackBar(translate('docs.msg.cnc_com_succs',{name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)}), translate('docs.msg.close'));
  //               this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
  //               this.formBaseInformation.get('is_completed').setValue(false);
  //               this.is_completed=false;
  //               if(this.productSearchAndTableByCustomersComponent){
  //                 this.productSearchAndTableByCustomersComponent.hideOrShowNdsColumn(); //чтобы показать столбцы после отмены проведения 
  //                 this.productSearchAndTableByCustomersComponent.getProductsTable();
  //               }
  //             }
  //           }
  //         },
  //         error => {
  //           this.showQueryErrorMessage(error);
  //         },
  //     );
  // }
  updateDocument(complete=false, closeOnSuccess=false){ 
    this.oneClickSaveControl=true;
    // this.getProductsTable();    
    let currentStatus:number=this.formBaseInformation.get('status_id').value;
    if(this.formBaseInformation.get('name').value==''){this.formBaseInformation.get('name').setValue(this.generateName())}
    if(complete){
      if(this.getControlTablefield.length==0){
        this.oneClickSaveControl=false;
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.no_prods')}});      
        return;
      }
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - временно устанавливаем true, временно - чтобы это ушло в запросе на сервер, но не повлияло на внешний вид документа, если вернется не true
      if(this.settingsForm.get('statusIdOnAutocreateOnCheque').value){// если в настройках есть "Статус при проведении" - временно выставляем его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);}
    }
    if(this.timeFormat=='12') {
      this.formBaseInformation.get('time_start').setValue(this.timeTo24h(this.formBaseInformation.get('time_start').value));
      this.formBaseInformation.get('time_end').setValue(this.timeTo24h(this.formBaseInformation.get('time_end').value));
    }
    this.http.post('/api/auth/updateAppointment',  this.formBaseInformation.value)
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
              this.documentChanged=false;
              this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)}) + (complete?translate('docs.msg.completed'):translate('docs.msg.saved')), translate('docs.msg.close'));
              // this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов - чтобы обновился "Проведён Да/Нет" и статус
              // if(response.fail_to_reserve>0){//если у 1 или нескольких позиций резервы при сохранении были отменены
                // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.res_not_saved')}});
              // }
              if(complete) {
                this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с завершением - окончательно устанавливаем признак завершенности = true
                this.is_completed=true;
                // if(this.productSearchAndTableByCustomersComponent){
                  // this.productSearchAndTableByCustomersComponent.readonly=true;// иначе эта переменная не успеет измениться через @Input и следующие 2 строки не выполнятся                  
                  // this.productSearchAndTableByCustomersComponent.hideOrShowNdsColumn(); //чтобы спрятать столбцы чекбоксов и удаления строк в таблице товаров
                  // this.productSearchAndTableByCustomersComponent.tableNdsRecount();
                // }
                if(this.settingsForm.get('statusIdOnAutocreateOnCheque').value){// если в настройках есть "Статус при завершении" - выставим его
                  this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);}
                this.setStatusColor();//чтобы обновился цвет статуса
              }
              // this.productSearchAndTableByCustomersComponent.getProductsTable();
              this.actionsBeforeGetChilds=0;
              this.rightsDefined=false;
              this.showSearchCustomerFormFields=false;
              this.baseData.emit('documentUpdated');// to refresh events in Calendar
              if(!closeOnSuccess)
                this.getData();
              else {
                this.dialogRef.close();
              }
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
              this.oneClickSaveControl=false;
            }
          },
          error => {this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
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

  // ------------------------------------ User settings ------------------------------------
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsAppointment').subscribe
    (data => 
      { 
        result=data as any;
          this.settingsForm.get('startTime').setValue(result.startTime);
          this.settingsForm.get('endDateTime').setValue(result.endDateTime);
          this.settingsForm.get('startTimeManually').setValue(result.startTimeManually);
          this.settingsForm.get('endTimeManually').setValue(result.endTimeManually);
          this.settingsForm.get('hideEmployeeField').setValue(result.hideEmployeeField);
          this.settingsForm.get('calcDateButTime').setValue(result.calcDateButTime);
          if(+this.id == 0) this.applyInitialTimeSettings();
          //Загрузка списка сотрудников / loading employees
          // for employees need the end time, which is geting from the settings.
          // that is because employees are loading after settings
          this.getEmployeesList(true);
      },
      error => console.log(error)
    );
  }

  openDialogSettings() { 
    const dialogSettings = this.settingsAppointmentDialogComponent.open(SettingsAppointmentDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      data:
      {
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        timeFormat: this.timeFormat,
        companyId: this.formBaseInformation.get('company_id').value
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        this.settingsForm.get('companyId').setValue(this.formBaseInformation.get('company_id').value);
        this.settingsForm.get('startTime').setValue(result.get('startTime').value);
        this.settingsForm.get('endDateTime').setValue(result.get('endDateTime').value);
        this.settingsForm.get('startTimeManually').setValue(result.get('startTimeManually').value);
        this.settingsForm.get('endTimeManually').setValue(result.get('endTimeManually').value);
        this.settingsForm.get('hideEmployeeField').setValue(result.get('hideEmployeeField').value);
        this.settingsForm.get('calcDateButTime').setValue(result.get('calcDateButTime').value);
        this.saveSettingsAppointment();
      }
    });
  }
  
  saveSettingsAppointment(){
    return this.http.post('/api/auth/saveSettingsAppointment', this.settingsForm.getRawValue())
    .subscribe(
      (data) => {   
        // this.actionsBeforeGetChilds=0;
        this.openSnackBar(translate('menu.msg.settngs_saved'), translate('menu.msg.close')); //+++
        this.getSettings();  
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
    );
  }

  applyInitialTimeSettings(){

    // if user or this function is still not fill the time and date fields
    if(this.formBaseInformation.get('date_start').value=='' || this.formBaseInformation.get('time_start').value=='' || this.formBaseInformation.get('date_end').value=='' || this.formBaseInformation.get('time_end').value==''){
      // If the document is creating in a "standart" mode, or in a "window" mode but document is not creating or opening by gragging action
      // (in which start and end time are defined)
      // then start and end dates/times will be calculated in accordance of settings
      if(!this.data || (this.data && !this.data.transmittedEvent)){
        this.applyingInitialTimeSettings=true;
        //                               Calculating start date and time 
        if(this.data && this.data.calendarViewDayDate)
            this.formBaseInformation.get('date_start').setValue(moment(this.data.calendarViewDayDate, 'DD.MM.YYYY'));
          else 
            this.formBaseInformation.get('date_start').setValue(moment());

          // Settings -> startTime = 'current'
          if(this.settingsForm.get('startTime').value=='current'){
            this.formBaseInformation.get('time_start').setValue(moment().format("HH:mm"));
          // Settings -> startTime = 'set_manually'
          } else {
            this.formBaseInformation.get('time_start').setValue(this.settingsForm.get('startTimeManually').value);
          }

        //                               Calculating end date and time 

        var beginningTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm');
        // if the end time is defined in settings - then just need to calculate end date ( because the end time can be before the start time )
        if(this.settingsForm.get('calcDateButTime').value){ // End time is from settings
          var endTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.settingsForm.get('endTimeManually').value), 'DD.MM.YYYY HH:mm');
          if(!beginningTime.isBefore(endTime)) endTime.add(1,'day');
        } else {// if the end time is not defined in settings - the default time shift is 1 hour
          var endTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm').add(1,'hour');
        } 
        this.formBaseInformation.get('date_end').setValue(endTime);
        this.formBaseInformation.get('time_end').setValue(endTime.format("HH:mm"));
        
        setTimeout(() => { 
          this.applyingInitialTimeSettings=false;
        }, 1000);   
      }
    }
  }

  recountEndDateTime(byUserDemand=false){
    // If in the settings endDateTime = 'sum_all_length' or 'max_length', and:
    // (before document has been created and document is creating not by gragging action) or recount by user demand by clicking on "Recount the finish time" button
    // console.log('recountEndDateTime');
    if(!this.isEndDateTimEditing && (['sum_all_length','max_length'].includes(this.settingsForm.get('endDateTime').value)) && ((!this.data || (this.data && !this.data.transmittedEvent)) || byUserDemand)){
      // Can do time recounting

      let sumOfSeconds = 3600; // 3600 is the minimal length if there are no services by Appointment - 1 hour by default
      let thereAreServicesByAppointment:boolean = false;
      this.getControlTablefield().value.map(product=>{
        // console.log('product:',product)
        if(product.isServiceByAppointment){
          this.isEndDateTimeRecounting=true;
          // console.log('serviceByAppointment')
          if(!thereAreServicesByAppointment) sumOfSeconds = 0; // if there are services by Appointment - count by their time length (not bu default) 
          thereAreServicesByAppointment=true;
          if(product.edizm_type_id == 6){ // unit of measure is "Time"
            if(this.settingsForm.get('endDateTime').value == 'sum_all_length')
              sumOfSeconds = sumOfSeconds + (product.unitOfMeasureTimeInSeconds * product.product_count);
            else sumOfSeconds = (product.unitOfMeasureTimeInSeconds * product.product_count)>sumOfSeconds?(product.unitOfMeasureTimeInSeconds * product.product_count):sumOfSeconds;
          }
          if(product.edizm_type_id == 7){ // unit of measure is "Uncountable"
            if(this.settingsForm.get('endDateTime').value == 'sum_all_length'){ // by the sum of all services length
              // console.log('sumOfSeconds before',sumOfSeconds)
              sumOfSeconds = sumOfSeconds + product.srvcDurationInSeconds;
            
              // console.log('sumOfSeconds after',sumOfSeconds)
            }
            else sumOfSeconds = (product.srvcDurationInSeconds)>sumOfSeconds?(product.srvcDurationInSeconds):sumOfSeconds; // endDateTime == 'max_length' - by service with the maximal length
          }
        }
      })
      // console.log('sumOfSeconds overall',sumOfSeconds)
      if(this.isEndDateTimeRecounting){
        // console.log('EndDateTimeRecounting')
        var endTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.settingsForm.get('calcDateButTime').value?this.settingsForm.get('endTimeManually').value:this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm').add(sumOfSeconds,'seconds');
        this.formBaseInformation.get('date_end').setValue(endTime);
        // if(!this.settingsForm.get('calcDateButTime').value)
        this.formBaseInformation.get('time_end').setValue(endTime.format("HH:mm"));
        this.afterRecountEndDateTime();
        setTimeout(() => { 
          this.isEndDateTimeRecounting = false;
          }, 2000);         
      }
    }
  }

  // afterRecountEndDateTime(){
  //   if(!this.waitingOfAfterRecountEndDateTime){
  //     this.waitingOfAfterRecountEndDateTime=true;
  //     // Part of Backend calls that should be restricted by frequency - no more than 1 per length of 'setTimeout'
  //     this.getEmployeesList();
  //     this.refreshNowUsedResources();
  //     //------------------------------------------------------------
  //     setTimeout(() => { 
  //       this.waitingOfAfterRecountEndDateTime=false;  
  //       if(this.needAgainOfAfterRecountEndDateTime){
  //         this.needAgainOfAfterRecountEndDateTime=false;
  //         this.afterRecountEndDateTime(); // recursive call
  //       }
  //     }, 3000);
  //   } else this.needAgainOfAfterRecountEndDateTime=true;
  // }

  afterRecountEndDateTime(){
    if(!this.waitingOfAfterRecountEndDateTime){ // если не в режиме отложенного срабатывания / if not in delayed triggering mode
      this.waitingOfAfterRecountEndDateTime=true; // ставим в режим отложенного срабатывания / delayed triggering mode is "ON"
      console.log('!this.waitingOfAfterRecountEndDateTime before timeOut()')
      setTimeout(() => { //ожидание / delayed triggering
        // отложенное срабатывание случилось: / delayed triggering happened:
        // отключаем режим отложенного срабатывания / disable delayed triggering mode
        this.waitingOfAfterRecountEndDateTime=false;        
        if(!this.needAgainOfAfterRecountEndDateTime){ // если повторные запросы во время ожидания больше не "прилетали" / if repeated requests no longer arrived
          //выполняем код, частоту которого нужно ограничить / execute code whose frequency needs to be limited
          this.getEmployeesList();
          this.refreshNowUsedResources();
        } else {// если повторные запросы "прилетали" во время ожидания / if repeated requests arrived while waiting
          // сбросили отметку о наличии повторных запросов / cleared the mark for repeated requests
          this.needAgainOfAfterRecountEndDateTime=false;
          // обратились к данной функции снова, чтобы включить отложенное срабатывание / turned to this function again to enable delayed triggering (recursive call)
          this.afterRecountEndDateTime();
        }
      }, 1000);
      // режим отложенного срабатывания, но продолжают "прилетать" повторные запросы / delayed triggering mode, but repeated requests continue to arrive
    } else this.needAgainOfAfterRecountEndDateTime=true; 
  } 

  getPriceTypesList(){
    // alert(1)
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(this.formBaseInformation.get('company_id').value)
    .subscribe(
      (data) => {
        this.receivedPriceTypesList=data as any [];
        // this.necessaryActionsBeforeGetChilds();
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  getSpravTaxes(){
    // alert(4)
      this.loadSpravService.getSpravTaxes(this.formBaseInformation.get('company_id').value)
        .subscribe((data) => {
          this.spravTaxesSet=data as any[];
          // this.necessaryActionsBeforeGetChilds();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }



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
      if(result)this.addFilesToAppointment(result);
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
  
  addFilesToAppointment(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addFilesToAppointment', body) 
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
          return this.http.post('/api/auth/getListOfappointmentsFiles', body) 
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
    return this.http.post('/api/auth/deleteappointmentsFile',body)
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
    // this.productSearchAndTableByCustomersComponent.getProductTable().forEach(row=>{
    //   this.kkmComponent.productsTable.push(row);
    // });
    // this.kkmComponent.productsTable=this.productSearchAndTableByCustomersComponent.getProductTable();
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
    return this.http.get('/api/auth/getSetOfTypePrices?company_id='+this.formBaseInformation.get('company_id').value+
    '&department_id='+(+this.getDepartmentIdByDepPartId())+'&cagent_id=0')
      .subscribe(
          (data) => {   
                      const setOfTypePrices=data as any;
                      this.department_type_price_id=setOfTypePrices.department_type_price_id;
                      this.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                      this.default_type_price_id=setOfTypePrices.default_type_price_id;
                      // if(this.canGetChilds && this.productSearchAndTableByCustomersComponent){
                        // this.productSearchAndTableByCustomersComponent.department_type_price_id=setOfTypePrices.department_type_price_id;
                        // this.productSearchAndTableByCustomersComponent.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
                        // this.productSearchAndTableByCustomersComponent.default_type_price_id=setOfTypePrices.default_type_price_id;
                        // this.productSearchAndTableByCustomersComponent.setCurrentTypePrice();//если сменили отделение - нужно проверить, есть ли у него тип цены. И если нет - в вызываемом методе выведется предупреждение для пользователя
                      // } 
                        
                      if(!this.canGetChilds && this.id==0) 
                        this.checkAnyCases();

                      // this.necessaryActionsBeforeGetChilds(); 
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );

  }
  // getCustomersListForAppointment(){
  //   return this.http.get('/api/auth/getCustomersListForAppointment?'+
  //   'company_id='+this.formBaseInformation.get('company_id').value+
  //   '&department_part_id='+(+this.formBaseInformation.get('department_part_id').value)+
  //   '&jobtitle_id='+(+this.formBaseInformation.get('department_part_id').value)+
  //   'date_start='+this.formBaseInformation.get('date_start').value+
  //   'date_end='+this.formBaseInformation.get('date_end').value+
  //   'time_start='+this.formBaseInformation.get('time_start').value+
  //   'time_end='+this.formBaseInformation.get('time_end').value  
  // )
  //     .subscribe(
  //         (data) => {   
  //                     const setOfTypePrices=data as any;
  //                     this.department_type_price_id=setOfTypePrices.department_type_price_id;
  //                     this.cagent_type_price_id=setOfTypePrices.cagent_type_price_id;
  //                     this.default_type_price_id=setOfTypePrices.default_type_price_id;                        
  //                     if(!this.canGetChilds && this.id==0) 
  //                       this.checkAnyCases();

  //                     this.necessaryActionsBeforeGetChilds(); 
  //                 },
  //         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
  //     );
  // }
  //создание нового документа Заказ покупателя
  goToNewDocument(){
    this._router.navigate(['ui/appointmentsdoc',0]);
    this.id=0;
    // this.clearFormSearchAndProductTable();//очистка формы поиска и таблицы с отобранными на продажу товарами
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
    // this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
    this.resetStatus();
    // this.formExpansionPanelsString();
    this.is_completed=false;
    this.getData();
  }
  // clearFormSearchAndProductTable(){
  //   this.productSearchAndTableByCustomersComponent.resetFormSearch();
  //   this.productSearchAndTableByCustomersComponent.getControlTablefield().clear();
  // }
  resetStatus(){
    this.formBaseInformation.get('status_id').setValue(null);
    this.formBaseInformation.get('status_name').setValue('');
    this.formBaseInformation.get('status_color').setValue('ff0000');
    this.formBaseInformation.get('status_description').setValue('');
    this.receivedStatusesList = [];
  }
  // **********************************************************************************************************************
  // *****************************************    Quantity by customers    ************************************************
  // **********************************************************************************************************************
  getCustomersList(){ //заполнение Autocomplete
    try {
      if(this.canCagentAutocompleteQuery && this.searchCustomerCtrl.value.length>1){
        const body = {
          "searchString":this.searchCustomerCtrl.value,
          "companyId":this.formBaseInformation.get('company_id').value};
        this.isCustomerListLoading  = true;
        this.customerHasBeenSearched = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {this.isCustomerListLoading=false; this.customerHasBeenSearched=false; return [];}
  }
  
  trackByIndex(i) { return i; }
  trackByCustomerProductsIndex(i) { return i; }
  // getCustomersList(){ 
  //   return this.http.get('/api/auth/getCustomersList?company_id='+this.formBaseInformation.get('company_id').value)
  //     .subscribe(
  //         (data) => {   
  //                     this.customersList=data as any [];
  //     },
  //     error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //
  //     );
  // }
  formAppointmentChildDocsColumns(){
    this.displayedAppointmentChildDocsColumns=[];
        this.displayedAppointmentChildDocsColumns.push('open');
        this.displayedAppointmentChildDocsColumns.push('docType');
        this.displayedAppointmentChildDocsColumns.push('docName');
        this.displayedAppointmentChildDocsColumns.push('docNumber');
        this.displayedAppointmentChildDocsColumns.push('sum');
        this.displayedAppointmentChildDocsColumns.push('date');
    if(!this.formBaseInformation.get('is_completed').value)
      this.displayedAppointmentChildDocsColumns.push('delete');
  }
  formCustomerTableColumns(){
    this.displayedCustomersColumns=[];
    // if(this.editability)
        // this.displayedCustomersColumns.push('select');
        // this.displayedCustomersColumns.push('row_id');
        this.displayedCustomersColumns.push('expand');
        this.displayedCustomersColumns.push('name');
        this.displayedCustomersColumns.push('email');
        this.displayedCustomersColumns.push('telephone');
        this.displayedCustomersColumns.push('sum');
        this.displayedCustomersColumns.push('shipped');
        this.displayedCustomersColumns.push('paid');
        // this.displayedCustomersColumns.push('unpaid');
        // this.displayedCustomersColumns.push('child');
        // this.displayedCustomersColumns.push('is_payer');
    if(this.editability)
      this.displayedCustomersColumns.push('delete');
  }

  hideOrShowNdsColumn(){
    this.displayedCustomerProductsColumns=[];
    // if(this.editability)
    //     this.displayedCustomerProductsColumns.push('select');
    this.displayedCustomerProductsColumns.push('name','product_count','product_price','product_sumprice');
    // this.displayedCustomerProductsColumns.push('reserved_current');
    // this.displayedCustomerProductsColumns.push('available','total','reserved');
    // this.displayedCustomerProductsColumns.push('shipped');
    this.displayedCustomerProductsColumns.push('price_type');
    if(this.formBaseInformation.get('nds').value)
      this.displayedCustomerProductsColumns.push('nds');
    // this.displayedCustomerProductsColumns.push('department');
    if(this.editability)
      this.displayedCustomerProductsColumns.push('delete');
  }

  clearCustomersTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.documentChanged=true;
        this.getControl('customersTable').clear();
        this.deleteAllCustomersProducts();
        this.showSearchCustomerFormFields=true;
        this.recountEndDateTime();
        if(this.showSearchCustomerFormFields)
          setTimeout(() => { this.customersSearchFieldValue.nativeElement.focus(); }, 200);
      }});
  }
  refreshCustomerTableColumns(){
    this.displayedCustomersColumns=[];
    setTimeout(() => { 
      this.formCustomerTableColumns();
    }, 1);
  }

  deleteCustomerRow(row: any,index:number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_prod_item'),
        warning: translate('docs.msg.del_prod_quer',{name:row.name})+'?',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.documentChanged=true;
        const control = <UntypedFormArray>this.formBaseInformation.get('customersTable');
        control.removeAt(index);
        this.deleteAllCustomerProductsByRowId(row.row_id);
        this.refreshCustomerTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
        this.showSearchCustomerFormFields=this.getControl("customersTable").value.length==0?true:false;
        this.recountEndDateTime();
        if(this.showSearchCustomerFormFields)
          setTimeout(() => { this.customersSearchFieldValue.nativeElement.focus(); }, 200);
      }
    }); 
  }


  // addExampleInfo(){
  //   const control = <UntypedFormArray>this.formBaseInformation.get('customersTable');
  //   this.guests.map(guest=>{
  //     control.push(this.formingCustomerRow(guest));
  //   });
  // }

  formingCustomerRow(guest:any) {
    return this._fb.group({
      id: new UntypedFormControl (guest.id,[]),
      row_id:     [this.getCustomerRowId()],
      // is_payer:   new UntypedFormControl (guest.is_payer,[]),
      name:       new UntypedFormControl (guest.name,[]),
      email:      new UntypedFormControl (guest.email,[]),
      telephone:  new UntypedFormControl (guest.telephone,[]),
      // child:      new UntypedFormControl (guest.child,[]),
      // products:   new UntypedFormArray   ([]),//массив с услугами клиента / array of customer's services
    });
  }

  addCustomerRow(customerId:number,customerName:string) 
  { 
    // this.customerHasBeenSearched=false;
    // let thereSamePart:boolean=false;
    // this.formBaseInformation.value.customersTable.map(i => 
    // { // Cписок не должен содержать одинаковые ресурсы. Тут проверяем на это
      // Table shouldn't contain the same customers. Here is checking about it
      // if(+i['id']==this.formCustomerSearch.get('id').value)
      // {
        // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
        // thereSamePart=true; 
      // }
    // });
    // if(!thereSamePart){
      // console.log('customerId',customerId)
      // console.log('customerName',customerName)
    let row=this.formingCustomerRowFromSearchForm(customerName);
    if(!this.isThereCustomerInTable(customerId,customerName)){
      this.documentChanged=true;
      const control = <UntypedFormArray>this.formBaseInformation.get('customersTable');
      control.push(row);
    }
    
    
    this.expandedElement = this.getRowIdOfCustomerInTable(customerId,customerName); // I don't get row.row_id because if customer is already there is in the table - I need to expand its table row by row_id, but I don't know its row_id in this case
    
    setTimeout(() => { this.productSearchFieldValue.nativeElement.focus(); }, 500);
      // this.addMainProductToPayingCustomers();
    // }
    
    // alert(this.getControlTablefield().value.length);
    this.showSearchCustomerFormFields=this.getControl("customersTable").value.length==1?false:this.showSearchCustomerFormFields;
    // if(this.showSearchCustomerFormFields)
      // setTimeout(() => { this.customersSearchFieldValue.nativeElement.focus(); }, 200);
    this.resetFormCustomerSearch();//подготовка формы поиска к дальнейшему вводу товара
  }
  onCustomerAddClick(){    
    this.showSearchCustomerFormFields=!this.showSearchCustomerFormFields;
    this.expandedElement=null;
    if(this.showSearchCustomerFormFields)
      setTimeout(() => { this.customersSearchFieldValue.nativeElement.focus(); }, 200);
    this.refreshCustomerTableColumns();
  }
  formingCustomerRowFromSearchForm(customerName:string) {
    return this._fb.group({
      id: new UntypedFormControl (this.formCustomerSearch.get('id').value,[]),
      row_id:     [this.getCustomerRowId()],
      // is_payer:   new UntypedFormControl (this.formBaseInformation.get('customersTable').value.length>0?false:true),
      name:       new UntypedFormControl (customerName,[]),
      email:      new UntypedFormControl (this.formCustomerSearch.get('email').value,[]),
      telephone:  new UntypedFormControl (this.formCustomerSearch.get('telephone').value,[]),
      // child:      new UntypedFormControl (false,[]),
      products:   new UntypedFormControl ([],[])
    });
  }

  fillCustomersObjectListFromApiResponse(customersArray:AppointmentCustomer[]){
    this.getControl('customersTable').clear();
    const control = <UntypedFormArray>this.formBaseInformation.get('customersTable');
    customersArray.forEach(row=>{
      control.push(this.formingProductCustomerRow(row));
    });
    this.refreshCustomerTableColumns();
  }
  fillProductsListFromApiResponse(productsArray:AppointmentsProductTable[]){
    const control = <UntypedFormArray>this.getControlTablefield();
    control.clear(); 
    productsArray.forEach(row=>{
      control.push(this.formingProductRowFromApiResponse(row));
    });
    this.refreshTableColumns();
  }
  
  formingProductCustomerRow(row: AppointmentCustomer) {
    return this._fb.group({
      row_id: [row.row_id],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      id: new UntypedFormControl (row.id,[]),
      name: new UntypedFormControl (row.name,[]),
      email: new UntypedFormControl (row.email,[]),
      telephone: new UntypedFormControl (row.telephone,[])
    });
  }
  resetFormCustomerSearch(){
    console.log('resetFormCustomerSearch')
    this.customerHasBeenSearched=false;
    this.formCustomerSearch.get('id').setValue(null);
    this.formCustomerSearch.get('telephone').setValue('');
    this.formCustomerSearch.get('email').setValue('');
    this.searchCustomerCtrl.setValue('');
    this.formCustomerSearch.reset();
    this.searchCustomerCtrl.reset();
  }
  getCustomerRowId():number{
    let rowIndex=0;
    while (this.customerRowIdIsBusy(rowIndex)){rowIndex++}
    return rowIndex;
  }
  customerRowIdIsBusy(row_id:number):boolean{
    let result=false;
    const control = <UntypedFormArray>this.formBaseInformation.get('customersTable');
    control.value.map(i=>{if(i.row_id==row_id)result=true;});
    return result;
  }
  customerNotFound():boolean{
    return ((this.filteredCustomers && this.filteredCustomers.length==0) && 
    +this.formCustomerSearch.get('id').value==0 && 
    this.customerHasBeenSearched && 
    !this.searchCustomerCtrl.pristine && 
    !this.isCustomerListLoading &&
    !(this.searchCustomerCtrl.value==null || this.searchCustomerCtrl.value==''));
  }
  getAmountOfChildDocs(customerId:number,type:string){
    let result = 0;
    this.appointmentChildDocs.map(doc=>{if(doc.customerId==customerId && (type=='all'||type==doc.docName)) result++;})
      return result;
  }
//*****************************************************************************************************************************************/
//***********************************************************         ФАЙЛЫ          *******************************************************/
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
    if(result)this.addFilesToAppointment(result);
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
loadFilesInfo(){ //+++                                     загружает информацию по прикрепленным файлам
    return this.http.get('/api/auth/getListOfAppointmentFiles?id='+this.id) 
          .subscribe(
              (data) => {  
                          this.filesInfo = data as any[]; 
                        },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
          );
}
addFilesToAppointment(filesIds: number[]){ //+++
  const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
    return this.http.post('/api/auth/addFilesToAppointment', body) 
            .subscribe(
                (data) => {  
                  this.loadFilesInfo();
                  this.openSnackBar(translate('docs.msg.files_added'), translate('docs.msg.close'));
                          },
                 error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
}

clickBtnDeleteFile(id: number): void { //+++
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
  return this.http.get('/api/auth/deleteAppointmentFile?doc_id='+this.id+'&file_id='+id)
  .subscribe(
      (data) => {   
                  this.loadFilesInfo();
                  this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
  );  
}
//**********************************************************************************************************************************************/  
//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/
//**********************************************************************************************************************************************/  

  //создание связанных документов
  createLinkedDoc(docname:string, cagentId:number){// принимает аргументы: Return
    let uid = uuidv4();
    let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDoc.can){
        
      this.formLinkedDocs.get('department_id').setValue(this.getDepartmentIdByDepPartId());
      this.formLinkedDocs.get('nds').setValue(this.formBaseInformation.get('nds').value);
      this.formLinkedDocs.get('nds_included').setValue(this.formBaseInformation.get('nds_included').value);
      this.formLinkedDocs.get('date_start').setValue(this.formBaseInformation.get('date_start').value?moment(this.formBaseInformation.get('date_start').value,'DD.MM.YYYY'):"");
      this.formLinkedDocs.get('description').setValue(translate('docs.msg.created_from')+translate('docs.docs.'+this.companySettings.booking_doc_name_variation)+' '+translate('docs.top.number')+this.formBaseInformation.get('doc_number').value);
      this.formLinkedDocs.get('appointment_id').setValue(this.id);
      
      // параметры для входящих ордеров и платежей (Paymentin, Orderin)   {name:translate('docs.docs.'+this.companySettings.booking_doc_name_variation)}
      if(docname=='Paymentin'||docname=='Orderin'){
        this.formLinkedDocs.get('payment_account_id').setValue(null);//id расчтёного счёта      
        this.formLinkedDocs.get('boxoffice_id').setValue(null);
        // !!!*** Следующие параметры нужно вычислять по каждому клиенту, для которого создается Linked document ***!!!
        // this.formLinkedDocs.get('summ').setValue(this.productSearchAndTableByCustomersComponent.totalProductSumm)
        // this.formLinkedDocs.get('nds').setValue(this.productSearchAndTableByCustomersComponent.getTotalNds());
      }
      
      if(docname!=='Paymentin'&&docname!=='Orderin')// для данных документов таблица с товарами не нужна
          this.getProductsTableLinkedDoc(docname);//формируем таблицу товаров для создаваемого документа

      this.formLinkedDocs.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formLinkedDocs.get('cagent_id').setValue(cagentId);
      this.formLinkedDocs.get('uid').setValue(uid);
      this.formLinkedDocs.get('linked_doc_id').setValue(this.id);//id связанного документа (того, из которого инициируется создание данного документа)
      this.formLinkedDocs.get('parent_uid').setValue(this.formBaseInformation.get('uid').value);// uid исходящего (родительского) документа
      this.formLinkedDocs.get('child_uid').setValue(uid);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      this.formLinkedDocs.get('linked_doc_name').setValue('appointments');//имя (таблицы) связанного документа
      this.formLinkedDocs.get('is_completed').setValue(false);
      
      
      // т.к. Розничная продажа проводится по факту ее создания, то мы не можем просто создать ее, как это делаем с другими связанными документами. Нужно только открыть ее страницу и передать туда все данные из Заказа покупателя.
      if(docname=='RetailSales'){
        // let retailSalesProductTable: Array <RetailSalesProductTable> =this.getRetailSalesProductsTable();
        let objToSend: NavigationExtras = //NavigationExtras - спец. объект, в котором можно передавать данные в процессе роутинга
        {
          queryParams: {
            company_id:               this.formBaseInformation.get('company_id').value,
            department_id:            this.getDepartmentIdByDepPartId(),
            cagent_id:                cagentId,
            cagent:                   'Create function getCagentNameById',
            nds:                      this.formBaseInformation.get('nds').value,
            nds_included:             this.formBaseInformation.get('nds_included').value,
            linked_doc_id:            this.id,
            parent_uid:               this.formBaseInformation.get('uid').value,
            doc_number:               this.formBaseInformation.get('doc_number').value,
            child_uid:                uid,
            linked_doc_name:          'appointments',
            customers_orders_id:      this.id,
            uid:                      uid,
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
                        // this.getLinkedDocsScheme(true);//обновляем схему этого документа
                        this._router.navigate(['/ui/'+docname.toLowerCase()+'doc', createdDocId]);
                      }
                    }
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
        );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:canCreateLinkedDoc.reason}});
  }

  // забирает таблицу товаров из дочернего компонента и помещает ее в массив, предназначенный для передачи в дочернюю розничную продажу
  // getRetailSalesProductsTable(){
  //   let retailSalesProductTable: Array <RetailSalesProductTable> =[];
  //   let canAddRow: boolean;
  //   this.productSearchAndTableByCustomersComponent.getProductTable().forEach(row=>{
  //     if(this.productSearchAndTableByCustomersComponent.checkedList.length>0){  //если есть выделенные чекбоксами позиции - надо взять только их, иначе берем все позиции
  //       canAddRow=this.isRowInCheckedList(row.row_id)
  //     }
  //     else canAddRow=true;
  //     if(canAddRow)
  //       retailSalesProductTable.push({
  //         product_id:                   row.product_id, 
  //         department_id:                row.department_id,
  //         product_count:                (row.product_count-row.shipped)>=0?row.product_count-row.shipped:0,
  //         product_price:                row.product_price,
  //         price_type_id:                row.price_type_id,
  //         is_material:                  row.is_material,
  //         product_price_of_type_price:  row.product_price_of_type_price,
  //         product_sumprice:             ((row.product_count)*row.product_price).toFixed(2),
  //         nds_id:                       row.nds_id,
  //         edizm:                        row.edizm,
  //         ppr_name_api_atol:            row.ppr_name_api_atol,
  //         name:                         row.name,
  //         available:                    row.available,
  //         reserved:                     row.reserved,
  //         total:                        row.total,
  //         priority_type_price:          row.priority_type_price,
  //         shipped:                      row.shipped,
  //         reserved_current:             row.reserved_current,
  //       });
  //   });
  //   return retailSalesProductTable;
  // }
  // isRowInCheckedList(rowId):boolean{
  //   let result:boolean = false;
  //   this.productSearchAndTableByCustomersComponent.checkedList.forEach(i=>{
  //     if(i==rowId)
  //       result=true;
  //   });
  //   return result;
  // }
// забирает таблицу товаров из дочернего компонента и помещает ее в форму, предназначенную для создания дочерних документов
  getProductsTableLinkedDoc(docname:string){
  //   let methodNameProductTable:string;//для маппинга в соответствующие названия сетов в бэкэнде (например private Set<PostingProductForm> postingProductTable;)
  //   let canAddRow: boolean;
  //   //Получим название метода для маппинга в соответствующее название сета в бэкэнде (например для аргумента 'Posting' отдаст 'postingProductTable', который замаппится в этоn сет: private Set<PostingProductForm> postingProductTable;)
  //   methodNameProductTable=this.commonUtilites.getMethodNameByDocAlias(docname);
  //   const control = <UntypedFormArray>this.formLinkedDocs.get(methodNameProductTable);
  //   control.clear();
  //   this.productSearchAndTableByCustomersComponent.getProductTable().forEach(row=>{
  //     if(this.productSearchAndTableByCustomersComponent.checkedList.length>0){  //если есть выделенные чекбоксами позиции - надо взять только их, иначе берем все позиции
  //       canAddRow=this.isRowInCheckedList(row.row_id)
  //     }
  //     else canAddRow=true;
  //     if(canAddRow)
  //         control.push(this.formingProductRowLinkedDoc(row));
  //   });
  // }
  // formingProductRowLinkedDoc(row: AppointmentsProductTable) {
  //   return this._fb.group({
  //     product_id: new UntypedFormControl (row.product_id,[]),
  //     department_id: new UntypedFormControl (row.department_id,[]),
  //     product_count: new UntypedFormControl ((row.product_count-row.shipped)>=0?row.product_count-row.shipped:0,[]),
  //     product_price:  new UntypedFormControl (row.product_price,[]),
  //     price_type_id:  new UntypedFormControl (row.price_type_id,[]),
  //     is_material:  new UntypedFormControl (row.is_material,[]),
  //     product_price_of_type_price:  new UntypedFormControl (row.product_price_of_type_price,[]),
  //     product_sumprice: new UntypedFormControl (((row.product_count)*row.product_price).toFixed(2),[]),
  //     nds_id:  new UntypedFormControl (row.nds_id,[]),
  //   });
  }
  // можно ли создать связанный документ (да - если есть товары, подходящие для этого)
  canCreateLinkedDoc(docname:string):CanCreateLinkedDoc{
    if(!(this.getControlTablefield && this.getControlTablefield.length>0)){
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
    // console.log('Animation is done.');
    if(this.tabIndex==1)  {
      if(!this.linkedDocsSchemeDisplayed) {
        this.loadingDocsScheme=true;
        setTimeout(() => {
            // this.drawLinkedDocsScheme(); 
          }, 1);   
      }      
    }    
  }
  // getLinkedDocsScheme(draw?:boolean){
  //   let result:any;
  //   this.loadingDocsScheme=true;
  //   this.linkedDocsSchemeDisplayed = false;
  //   this.linkedDocsText ='';
  //   this.loadingDocsScheme=true;
  //   this.http.get('/api/auth/getLinkedDocsScheme?uid='+this.formBaseInformation.get('uid').value)
  //     .subscribe(
  //         data => { 
  //           result=data as any;
            
  //           if(result==null){
  //             this.loadingDocsScheme=false;
  //             this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.err_load_lnkd')}});
  //           } else if(result.errorCode==0){//нет результата
  //             this.linkedDocsSchemeDisplayed = true;
  //             this.loadingDocsScheme=false;
  //           } else {
  //             this.linkedDocsCount=result.count==0?result.count:result.count-1;// т.к. если документ в группе будет только один (данный) - result.count придёт = 1, т.е. связанных нет. Если документов в группе вообще нет - придет 0.
  //             this.linkedDocsText = result.text;
  //             if(draw)
  //               this.drawLinkedDocsScheme()
  //             else
  //               this.loadingDocsScheme=false;
  //           } 
  //       },
  //       error => {this.loadingDocsScheme=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
  //   );
  // }

  // drawLinkedDocsScheme(){
  //   if(this.tabIndex==1){
  //     try{
  //       console.log(this.linkedDocsText);
  //       this.loadingDocsScheme=false;
  //       this.linkedDocsSchemeDisplayed = true;
  //       this.showGraphDiv=false;
  //       setTimeout(() => {
  //         this.showGraphDiv=true;
  //         setTimeout(() => {
  //           graphviz("#graph").renderDot(this.linkedDocsText);
  //           }, 1);
  //         }, 1);
  //     } catch (e){
  //       this.loadingDocsScheme=false;
  //       console.log(e.message);
  //     }
  //   } else this.loadingDocsScheme=false;
  // }

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
        document_id: 59, // id документа из таблицы documents
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
    this.http.get('/api/auth/getTemplatesList?company_id='+this.formBaseInformation.get('company_id').value+"&document_id="+59+"&is_show="+true).subscribe
    (data =>{ 
        this.gettingTemplatesData=false;
        this.templatesList=data as TemplatesList[];
      },error => {console.log(error);this.gettingTemplatesData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }
  clickOnTemplate(template:TemplatesList,cagent_id:number){
    const baseUrl = '/api/auth/appointmentPrint/';
    this.http.get(baseUrl+ 
                  "?file_name="+template.file_name+
                  "&doc_id="+this.id+
                  "&cagent_id="+cagent_id+
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
  getEmployeesListQueryBody(isFree:boolean, kindOfNoFree?:string){
  return  {
      isAll:        false,               // all or only free/not_free
      isFree:       isFree, 
      kindOfNoFree: kindOfNoFree,        // busyByAppointments or busyBySchedule
      appointmentId:this.id,
      companyId:    this.formBaseInformation.get('company_id').value,
      dateFrom:     this.formBaseInformation.get('date_start').value,
      timeFrom:     this.timeTo24h(this.formBaseInformation.get('time_start').value),
      dateTo:       this.formBaseInformation.get('date_end').value,
      timeTo:       this.timeTo24h(this.formBaseInformation.get('time_end').value),
      servicesIds:  []/*+this.formBaseInformation.get('product_id').value==0?[]:[this.formBaseInformation.get('product_id').value]*/,
      depPartsIds:  []/*this.formBaseInformation.get('department_part_id').value==0?[]:[this.formBaseInformation.get('department_part_id').value]*/,
      jobTitlesIds: []/*this.formBaseInformation.get('jobtitle_id').value==0?[]:[this.formBaseInformation.get('jobtitle_id').value]*/,
      employeesIds: []
    }
  }
  getEmployeesList(isFree:boolean=true){
    // console.log('getEmployeesList isFree = '+isFree)
    const body = this.getEmployeesListQueryBody(isFree); 
    this.employeesListLoadQtt=3;  
    this.http.post('/api/auth/getEmployeesList', body) 
    .subscribe(
        (data) => {   
          this.receivedEmployeesList=data as Employee[];
          this.updateEmployeeValues();
          this.employeesListLoadQtt--;
          if(this.data && this.data.transmittedEvent && this.data.transmittedEvent.meta.user.id){
            let jobtitleId = null;
            this.formBaseInformation.get('employeeId').setValue(this.data.transmittedEvent.meta.user.id);
            this.receivedEmployeesList.map(empl=>{if(empl.id==this.data.transmittedEvent.meta.user.id) jobtitleId = empl.jobtitle_id})
            this.onEmployeeChange(this.data.transmittedEvent.meta.user.id,jobtitleId);
          }
          if(isFree){
            this.getBusyEmployeesList('busyByAppointments');
            this.getBusyEmployeesList('busyBySchedule');
          }
        },error => {
          this.employeesListLoadQtt=0;
          this.initialLoading=false;
          console.log(error);
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
  }

  getBusyEmployeesList(kindOfNoFree:string){
    const body = this.getEmployeesListQueryBody(false, kindOfNoFree); 
    this.http.post('/api/auth/getEmployeesList', body) 
    .subscribe(
        (data) => {   
          this.receivedEmployeesList.push(...data as Employee[]);
          this.updateEmployeeValues();
          this.employeesListLoadQtt--;  
          if(this.employeesListLoadQtt==0 && this.initialLoading){
            //getBusyEmployeesList - is the last function of document initial loading
            this.initialLoading=false;
            this.handleEndOfInitialLoading();
          }
        },error => {
          this.employeesListLoadQtt=0;
          this.initialLoading=false;
          console.log(error);
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
  } 

  getEmployeeById(id:number):Employee{
    let result:Employee=null;
    this.receivedEmployeesList.map(employee=>{
      if(employee.id==id) result = employee;
    });
    return result;
  }

  handleEndOfInitialLoading(){
    if(this.data){
      // In the next cases I need to try automatically save and close window 
      if(['onEventDragged','onEventResized'].includes(this.data.source)){
        console.log('onEventDragged!!!');
        if(!this.createUpdateButtonDisabled){
          console.log('Updating Document');
          this.updateDocument(false, true);
        } else {
          console.log('Emitting expandDialogWindow');
          this.baseData.emit('expandDialogWindow');
        }
          
          
      }
    }
  }

  onSelectTab(a){
    // this.selectedTab.setValue(a.index);
    if(a.index==1) this.canLoadHistoryTableData=true;
  }
  onDatesTimesChange(){
    // on create or update document times can be updated from ap/mp to 24h and it can be trigger to run this function. oneClickSaveControl can prevent it, because it is true on create or update
    // on data loading dates and times can be changed and it can 
    // isEndDateTimeRecounting - to deny change date/time in the case of changing services table, because it can produce circular queries
    // applyingInitialTimeSettings - to deny triggering of this function on initial setting the time 
    if(!this.oneClickSaveControl&&!this.initialLoading&&!this.isMainDataLoading&&(this.isDatesValid||+this.id>0)&&!this.isEndDateTimeRecounting&&!this.applyingInitialTimeSettings){
      this.isEndDateTimEditing=true;
      this.documentChanged=true;
      this.getEmployeesList();
      this.refreshNowUsedResources();
      let row_index:number=0;
      let control = this.getControlTablefield();
      control.value.map(service=>{
        if(service.edizm_type_id==6){
          control.controls[row_index].get('product_count').setValue(this.getProductTimeQtt(service));
          this.onChangeProductCount(row_index);//->setRowSumPrice(row_index) - пересчёт суммы по товарной позиции
        }
        row_index++;
      });
      setTimeout(() => {this.isEndDateTimEditing=false;}, 1000); 
      
    }
  }
  
  checkEmptyEmployeeField(){
    if( this.formBaseInformation.get('employeeName').value.length==0){
      this.formBaseInformation.get('employeeId').setValue(null);
      // this.formBaseInformation.get('jobtitle_id').setValue(null);
    }
  }
  clearEmployeeField(){
    this.formBaseInformation.get('employeeName').setValue('');
  }
  onEmployeeChange(id:number, jobtitleId:number){
    if(this.accessibleEmployeesIdsAll.includes(id)){
      this.documentChanged=true;
      this.formBaseInformation.get('employeeId').setValue(id);
      this.formBaseInformation.get('jobtitle_id').setValue(jobtitleId);

      // autoselect the department part id it is only one of accessibles
      if(this.accessibleDepPartsIdsAll.length==1) 
        this.formBaseInformation.get('department_part_id').setValue(this.accessibleDepPartsIdsAll[0]);
    }
  }

  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateEmployeeValues(){
    if(+this.formBaseInformation.get('employeeId').value!=0){
      this.receivedEmployeesList.forEach(x => {
        if(x.id==this.formBaseInformation.get('employeeId').value){
          this.formBaseInformation.get('employeeName').setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.formBaseInformation.get('employeeName').setValue('');
      this.formBaseInformation.get('employeeId').setValue(null);
    }
  }

  createShipment(row:any){
    if(this.getAmountOfChildDocs(row.id,'shipment')==0){
      if(!this.documentChanged){
        this.oneClickSaveControl=true;
        this.tableNdsRecount();
        this.formBaseInformation.get('cagent_id').setValue(row.id);
        this.formBaseInformation.get('total_nds').setValue(this.totalNds.get(row.row_id));
        this.formBaseInformation.get('total_summ').setValue(this.totalProductSumm.get(row.row_id));
        this.http.post('/api/auth/createAndCompleteShipmentFromAppointment',  this.formBaseInformation.value)
          .subscribe(
              (data) => 
              {
                let result:number=data as number;
                switch(result){
                  case null:{// null возвращает если не удалось создать документ из-за ошибки
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.shipment')})}});
                    break;
                  }
                  case -1:{//недостаточно прав
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_oper') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.shipment')})}});
                    break;
                  }
                  case 0:{// недостаточно товара на складе
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.no_gds_shipmn')}});
                    break;
                  }
                  case -50:{//Документ уже проведён
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.already_cmplt')}});
                    break;
                  }
                  case -70:{//недостаточно товара на складе
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.cnc_com_err1')}});
                    break;
                  }
                  case -80:{//Отрицательное кол-во товара на складе
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.cnc_com_err2')}});
                    break;
                  }
                  case 1:{// Успешно
                    this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.shipment')}) + (translate('docs.msg.completed')), translate('docs.msg.close'));
                    this.getData();
                    
                    break;
                  }
                  default:{// другая ошибка
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Operation error"}});
                    break;
                  }
                }
                this.oneClickSaveControl=false;
              },
              error => {
                this.showQueryErrorMessage(error);this.oneClickSaveControl=false;
                },
          );
      } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.save_first')}});
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.alr_there_doc_tp')}});
  }
  createPaymentin(row:any){
    if(this.getAmountOfChildDocs(row.id,'orderin')==0 && this.getAmountOfChildDocs(row.id,'paymentin')==0){
      if(!this.documentChanged){
        this.oneClickSaveControl=true;
        this.tableNdsRecount();
        this.formBaseInformation.get('cagent_id').setValue(row.id);
        this.formBaseInformation.get('total_nds').setValue(this.totalNds.get(row.row_id));
        this.formBaseInformation.get('total_summ').setValue(this.totalProductSumm.get(row.row_id));
        this.http.post('/api/auth/createAndCompletePaymentInFromAppointment',  this.formBaseInformation.value)
          .subscribe(
              (data) => 
              {
                let result:number=data as number;
                switch(result){
                  case null:{// null возвращает если не удалось создать документ из-за ошибки
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_comp')) + translate('docs.msg._of_doc',{name:translate('docs.docs.paymentin')})}});
                    break;
                  }
                  case -1:{//недостаточно прав
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                    break;
                  }
                  case -30:{//недостаточно средств 
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_money_op')}});
                    break;
                  }
                  case -31:{//Документ-отправитель внутреннего платежа не проведён (например, проводим приходный ордер, но незадолго до этого у исходящего платежа сняли проведение)
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.sender_n_comp')}});
                    break;
                  }
                  case -40:{//дублирование исходящего платежа  
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:(this.formBaseInformation.get('moving_type').value=='account'?translate('docs.msg.pi_w_po_compl'):translate('docs.msg.pi_w_oo_compl'))}});
                    break;
                  }
                  case -50:{//Документ уже проведён
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.already_cmplt')}});
                    break;
                  }
                  case 1:{// Успешно
                    this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.paymentin')}) + (translate('docs.msg.completed')), translate('docs.msg.close'));
                    this.getData();                
                    break;
                  }
                  default:{// другая ошибка
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Operation error"}});
                    break;
                  }
                }
                this.oneClickSaveControl=false;
              },
              error => {
                this.showQueryErrorMessage(error);this.oneClickSaveControl=false;
                },
          );
      } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.save_first')}});  
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.alr_there_doc_gm')}});  
  }
  createOrderin(row:any){
    if(this.getAmountOfChildDocs(row.id,'orderin')==0 && this.getAmountOfChildDocs(row.id,'paymentin')==0){
      if(!this.documentChanged){
        this.oneClickSaveControl=true;
        this.tableNdsRecount();
        this.formBaseInformation.get('cagent_id').setValue(row.id);
        this.formBaseInformation.get('total_nds').setValue(this.totalNds.get(row.row_id));
        this.formBaseInformation.get('total_summ').setValue(this.totalProductSumm.get(row.row_id));
        this.http.post('/api/auth/createAndCompleteOrderInFromAppointment',  this.formBaseInformation.value)
          .subscribe(
              (data) => 
              {
                let result:number=data as number;
                switch(result){
                  case null:{// null возвращает если не удалось создать документ из-за ошибки
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_comp')) + translate('docs.msg._of_doc',{name:translate('docs.docs.orderin')})}});
                    break;
                  }
                  case -1:{//недостаточно прав
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                    break;
                  }
                  case -30:{//недостаточно средств 
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_money_op')}});
                    break;
                  }
                  case -31:{//Документ-отправитель внутреннего платежа не проведён (например, проводим приходный ордер, но незадолго до этого у исходящего платежа сняли проведение)
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.sender_n_comp')}});
                    break;
                  }
                  case -40:{//дублирование исходящего платежа   
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.pi_w')+(this.formBaseInformation.get('moving_type').value=='account'?translate('docs.msg._po'):(this.formBaseInformation.get('moving_type').value=='boxoffice'?translate('docs.msg._oo'):translate('docs.msg._wd')))+translate('docs.msg._already_comp')}});
                    break;
                  }
                  case -50:{//Документ уже проведён
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.already_cmplt')}});
                    break;
                  }
                  case 1:{// Успешно
                    this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.orderin')}) + (translate('docs.msg.completed')), translate('docs.msg.close'));
                    this.getData();                
                    break;
                  }
                  default:{// другая ошибка
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Operation error"}});
                    break;
                  }
                }
                this.oneClickSaveControl=false;
              },
              error => {
                this.showQueryErrorMessage(error);this.oneClickSaveControl=false;
                },
          );
      } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.save_first')}});
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.alr_there_doc_gm')}});   
  }

  setAppointmentChildDocumentAsDecompleted(doc:AppointmentChildDoc,row_index:number){
    // alert(row_index)
    // alert(this.appointmentChildDocs.length)
    // this.appointmentChildDocs.slice(row_index,1);
    if(!this.oneClickSaveControl){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
        head:    translate('docs.msg.cnc_com_head'),
        warning: translate('docs.msg.cnc_com_warn'),
        query: ''},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.oneClickSaveControl=true;
          this.http.get('/api/auth/setAppointmentChildDocumentAsDecompleted?doc_id='+doc.id+'&doc_name='+doc.docName).subscribe(
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
                  case -30:{//недостаточно средств
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_money_op')}});
                    break;
                  }
                  case -60:{//Документ уже снят с проведения
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.alr_cnc_com')}});
                    break;
                  }
                  case -70:{//Отрицательное кол-во товара в истории движения товара
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.cnc_com_err1')}});
                    break;
                  }
                  case 1:{// Успешно
                    this.openSnackBar(translate('docs.msg.cnc_com_succs',{name:translate('docs.docs.'+doc.docName)}), translate('docs.msg.close'));
                    this.getData();        
                    this.gettingAppointmentChildDocsTableData=true;
                    this.appointmentChildDocs.splice(row_index,1);// to hide deleted row while all data is refreshing 
                    this.displayedAppointmentChildDocsColumns=[];
                    setTimeout(() => {this.formAppointmentChildDocsColumns()}, 10); 
                    break;
                  }
                  default:{// другая ошибка
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:"Operation error"}});
                    break;
                  }
                }
                this.oneClickSaveControl=false;
              },
              error => {this.showQueryErrorMessage(error);this.oneClickSaveControl=false;},
          );
        }
      });
    }    
  }




  // delAtRow(j){
  //   this.appointmentChildDocs.splice(0,1);
  //   this.displayedAppointmentChildDocsColumns=[];
  //   setTimeout(() => { 
  //     this.formAppointmentChildDocsColumns();
  //   }, 10);
  // }
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
  //       this._router.navigate(['ui/appointmentsdoc']);
  //       this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnAutocreateOnCheque').value);
  //     }
  //     this.openSnackBar("Чек был успешно напечатан. Создание нового Заказа покупателя", "Закрыть");
  //   }
  // }

  // The situation can be, that in settings there is "Status after ompletion" for company A, but document created for company B. If it happens, when completion is over, Dokio can set this status of company A to the document, but that's wrong! 
  statusIdInList(id:number):boolean{let r=false;this.receivedStatusesList.forEach(c=>{if(id==+c.id) r=true});return r}

  // get payersCnt(){
  //   let result = 0;
  //   this.formBaseInformation.controls.customersTable.value.map(row=>{
  //     if(row.is_payer)
  //       result++;
  //   })
  //   return result;
  // }
  getProductArrayIndexByCustomerRowId(row_id:number){
    let i=0;
    let indx:number = null;
    this.formBaseInformation.controls.appointmentsProductTable.value.map(row=>{
      if(row.customerRowId==row_id) indx = i;       
      i++;
    })
    return indx;
  }
  getCustomerArrayIndexByRowId(row_id:number){
    let i=0;
    let indx:number = null;
    this.formBaseInformation.controls.customersTable.value.map(row=>{
      if(row.row_id==row_id) indx = i;       
      i++;
    })
    return indx;
  }
  // [disabled] of slide toggle is not working in FormArray with formControlName. Possibility it is a bug.
  // so, I am setting it manually
  // setIsPayerValue(row_id:number, customer_id:number, value){
  //   console.log('row_id',row_id)
  //   console.log('getCustomerArrayIndexByRowId(row_id)',this.getCustomerArrayIndexByRowId(row_id))
  //   this.getControl('customersTable').controls[this.getCustomerArrayIndexByRowId(row_id)].get('is_payer').setValue(value);
  // }

  getTaxMultiplifierBySelectedId(srchId:number):number {
    //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
        let value=0;
        this.spravTaxesSet.forEach(a=>{
          if(+a.id == srchId) {value=a.multiplier}
  }); return value;} 

  // set taxes = 0 for every customer    
  resetTaxes(){
    this.formBaseInformation.value.appointmentsProductTable.map(i =>{
      this.totalNds.set(i.customerRowId,0);
    })
  }
  getTaxFromPrice(price:number, taxId:number):number {
    // вычисляет налог из цены. Например, для цены 100, уже содержащей в себе налог, и налога 20% вернёт: 100 * 20 / 120 = 16.67
    let value=0;
    this.spravTaxesSet.forEach(a=>{if(+a.id == taxId) {value=a.value}});
    return parseFloat((price*value/(100+value)).toFixed(2));
  }

  //пересчитывает НДС в таблице товаров
  tableNdsRecount(nds_included?:boolean){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      if(nds_included!=undefined)
        this.formBaseInformation.get('nds_included').setValue(nds_included);
      //перерасчет НДС в таблице товаров
      if(this.getControlTablefield().length>0){
        this.resetTaxes();
        let switcherNDS:boolean = this.formBaseInformation.get('nds').value;
        let switcherNDSincluded:boolean = this.formBaseInformation.get('nds_included').value;
        let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
        this.getControlTablefield().value.map(i =>{
            multiplifierNDS = this.getTaxMultiplifierBySelectedId(+i['nds_id']);
            //если включён переключатель "Налог", но переключатель "Налог включен" выключен,
            if(switcherNDS && !switcherNDSincluded){
            //..к сумме добавляем Налог
              i['product_sumprice']=this.numToPrice(+(+i['product_count']*(+i['product_price'])*multiplifierNDS).toFixed(2),2);
              this.totalNds.set(i.customerRowId,(this.totalNds.get(i.customerRowId)+this.numToPrice(+(+i['product_count']*(+i['product_price'])*(multiplifierNDS-1)).toFixed(2),2)));//суммируем общий налог
            }else {
              i['product_sumprice']=this.numToPrice(+((+i['product_count'])*(+i['product_price'])).toFixed(2),2);//..иначе не добавляем, и сумма - это просто произведение количества на цену
              //если включены переключатели "Налог" и "Налог включен" - Налог уже в цене, и нужно вычислить его из неё
              if(switcherNDS && switcherNDSincluded){
                this.totalNds.set(i.customerRowId,(this.totalNds.get(i.customerRowId)+this.getTaxFromPrice(i['product_sumprice'], i['nds_id'])));
              }
            }
          }
    )}}
  }
   // равна ли изменённая цена цене по выбранному Типу цены. Если нет - сбрасываем выбор Типа цены
  rowPriceEqualsToTypePrice(row_index:number){
    const control = this.getControlTablefield();
    let product_price = control.controls[row_index].get('product_price').value;
    let product_price_of_type_price = control.controls[row_index].get('product_price_of_type_price').value;
    if (+product_price != +product_price_of_type_price) control.controls[row_index].get('price_type_id').setValue(null);
  }
  // отдает цену товара в текущем предприятии по его id и id его типа цены
  getProductPrice(product_id:number,price_type_id:number){
    let price:number;
    return this.http.get('/api/auth/getProductPrice?company_id='+this.formBaseInformation.get('company_id').value+'&product_id='+product_id+'&price_type_id='+price_type_id)
  }  
  getProductTimeQtt(service:AppointmentServiceSearchResponse, currentQtt=1):number{
    let result = currentQtt;
    console.log(JSON.stringify(service))
    if(service.edizm_type_id==6 && service.edizm_id>0 && service.unitOfMeasureTimeInSeconds>0.001 && this.isDatesValid){//6=time
      let beginningTime = moment(moment(new Date(this.formBaseInformation.get('date_start').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_start').value), 'DD.MM.YYYY HH:mm');
      let endTime = moment(moment(new Date(this.formBaseInformation.get('date_end').value)).format('DD.MM.YYYY')+' '+this.timeTo24h(this.formBaseInformation.get('time_end').value), 'DD.MM.YYYY HH:mm');
      let appointmentDurationInSeconds = moment.duration(endTime.diff(beginningTime)).asSeconds();
      // The result is an appointment duration divided on the unit of measure time converted into seconds is:
      result = Math.round(appointmentDurationInSeconds/service.unitOfMeasureTimeInSeconds);
    }   
    return result<1?1:result;
  }
//------------------------------------------------- ON CHANGE...
  //при изменении поля Количество в таблице товаров
  onChangeProductCount(row_index:number){
    // this.nullToZeroInTableField(row_index, 'product_count');
    this.commaToDotInTableField(row_index, 'product_count');  // замена запятой на точку
    this.setRowSumPrice(row_index);                           // пересчёт суммы оплаты за данный товар
    this.tableNdsRecount();                                   // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                     // подсчёт TOTALS и отправка суммы в ККМ
    this.checkIndivisibleErrorOfProductTable();               // проверка на неделимость товара
    this.recountEndDateTime();
  }
  //при изменении поля Цена в таблице товаров
  onChangeProductPrice(row_index:number){
    this.commaToDotInTableField(row_index, 'product_price');  // замена запятой на точку
    this.rowPriceEqualsToTypePrice(row_index);                // равна ли изменённая цена цене по выбранному Типу цены. Если нет - сбрасываем выбор Типа цены
    this.setRowSumPrice(row_index);                           // пересчёт суммы оплаты за данный товар
    this.tableNdsRecount();                                   // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                     // подсчёт TOTALS и отправка суммы в ККМ
  } 
  onChangeReserves(row_index:number){
    this.commaToDotInTableField(row_index,'reserved_current');// замена запятой на точку
    this.checkIndivisibleErrorOfProductTable();               // проверка на неделимость товара
  }
  //при изменении Типа цены в таблице товаров
  onChangePriceTypeOfRow(row_index:number){
    this.documentChanged=true;
    const control = this.getControlTablefield();
    let product_id = control.at(row_index).get('product_id').value;
    let price_type_id = control.at(row_index).get('price_type_id').value;
    this.getProductPrice(product_id,price_type_id).subscribe( //запрашиваем цену по Типу цены для данного товара
      data => { 
      const price=data as number;
      control.controls[row_index].get('product_price').setValue((+price));
      control.controls[row_index].get('product_price_of_type_price').setValue((+price));
      this.setRowSumPrice(row_index);                         // пересчёт суммы оплаты за данный товар
      this.tableNdsRecount();                                 // пересчёт суммы оплаты за товар с учётом НДС
      this.finishRecount();                                   // подсчёт TOTALS и отправка суммы в ККМ
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})})
  }
  // при изменении "НДС" в родительском модуле
  onChangeNds(nds_included:boolean){
    setTimeout(() => { 
      this.tableNdsRecount(nds_included);                      // пересчёт Суммы оплаты за товар с учётом НДС
      this.finishRecount();                                    // подсчёт TOTALS и отправка суммы в ККМ
    }, 1);
  }
  // при изменении "НДС включено" в родительском модуле
  onChangeNdsIncluded(nds_included?:boolean){
    this.tableNdsRecount(nds_included);                        // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                      // подсчёт TOTALS и отправка суммы в ККМ
  }
  // при изменении НДС в таблице товаров
  onChangeProductNds(){
    this.documentChanged=true;
    this.tableNdsRecount();                                    // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                      // подсчёт TOTALS и отправка суммы в ККМ
  }

  //---------------------------------------------- RECOUNT ROWS -------------------------------------

  // пересчёт суммы оплаты за данный товар
  setRowSumPrice(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('product_sumprice').setValue((control.controls[row_index].get('product_count').value*control.controls[row_index].get('product_price').value).toFixed(2));
  }

  //------------------------------------------------- TOTALS ----------------------------------------
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в map <customerRowId - totl sum of customer>
    // console.log('**************** getTotalSumPrice *******************')
    this.totalProductSumm.clear();
    this.formBaseInformation.value.appointmentsProductTable.map(i =>{this.totalProductSumm.set(i.customerRowId,0);});
    this.formBaseInformation.value.appointmentsProductTable.map(i =>{
      this.totalProductSumm.set(i.customerRowId,(+this.totalProductSumm.get(i.customerRowId)+(+i.product_sumprice)));
    });
    // return  (this.formBaseInformation.value.appointmentsProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }

  getTotalSumOfCustomer(row_id:number):number{
    return this.totalProductSumm.has(row_id)?this.totalProductSumm.get(row_id):0;
  }
  getPaidCustomerSum(customerId:number){
    let result:number = 0;
    this.appointmentChildDocs.map(doc=>{if(doc.customerId==customerId && (doc.docName=='orderin' || doc.docName=='paymentin')) result = result + doc.sum;});
    return result;
  }
  getShippedCustomerSum(customerId:number){
    let result:number = 0;
    this.appointmentChildDocs.map(doc=>{if(doc.customerId==customerId && (doc.docName=='shipment')) result = result + doc.sum;});
    return result;
  }
  // getTotalNds() {//возвращает общую НДС
  //   this.tableNdsRecount();
  //   // return (this.totalNds);
  // }
  // подсчёт TOTALS и отправка суммы в ККМ
  finishRecount(){
    if(this.formBaseInformation!=undefined)//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      this.getTotalSumPrice();
  }

  //------------------------------------------------------------------- Методы для работы с признаком "Неделимость" -----------------------------------------------------------------------------
  // true - ошибка (если введено нецелое кол-во товара, при том что оно должно быть целым)

  checkIndivisibleErrorOfProductTable(){
    let result=false;// ошибки нет
    this.formBaseInformation.value.appointmentsProductTable.map(t =>{
      if(t['indivisible'] && t['product_count']!='' && !Number.isInteger(parseFloat(t['product_count']))){
        result=true;
      }
    })
    this.indivisibleErrorOfProductTable=result;
  }

  getAllDeppartsIds():number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        depparts.push(deppart.id);
      })
    });
    return depparts;
  }  
  getAllJobTitlesIds():number[]{
    let result:number[]=[];
    this.receivedJobtitlesList.map(obj=>{result.push(obj.jobtitle_id);});
    return result;
  }
  getAllEmployeeIds():number[]{
    let result:number[]=[];
    this.receivedEmployeesList.map(obj=>{result.push(obj.id);});
    return result;
  }
  getAllServicesIds(withNoEmployeeRequiredOnly):number[]{
    let result:number[]=[];
    this.filteredProducts.map(obj=>{
      if(obj.isServiceByAppointment)
        if(!withNoEmployeeRequiredOnly) // All services
          result.push(obj.id);
        else
          if(!obj.employeeRequired)
            result.push(obj.id);
    });
    return result;
  }
  getAllTableServicesIds(withNoEmployeeRequiredOnly=true):number[]{
    let result:number[]=[];
    this.getControlTablefield().value.map(obj=>{
      if(!withNoEmployeeRequiredOnly) // All services
        result.push(obj.product_id);
      else
        if(!obj.employeeRequired)
          result.push(obj.product_id);
    });
    return result;
  }
  resetMainForm(){
    this.formBaseInformation.get('department_part_id').setValue(0);
    // this.formBaseInformation.get('department_part_id').markAllAsTouched;
    this.formBaseInformation.get('employeeId').setValue(null);
    this.formBaseInformation.get('employeeName').setValue('');
    this.formBaseInformation.get('jobtitle_id').setValue(0);
    this.formBaseInformation.get('employeeId').setValue(null);

    // if(!this.data || (this.data && !this.data.transmittedEvent)){
      this.formBaseInformation.get('date_start').setValue('');
      this.formBaseInformation.get('time_start').setValue('');
      this.formBaseInformation.get('date_end').setValue('');
      this.formBaseInformation.get('time_end').setValue('');
    // }
    
    this.applyInitialTimeSettings();
    
    // this.formBaseInformation.get('product_id').setValue(null);
    this.searchProductCtrl.reset();
    // this.mainProduct= null;
    // this.deleteAllCustomersProducts(true); // delete only main product from all customers products
    this.searchProductCtrl.setValue('');
    this.refreshNowUsedResources();
    this.documentChanged=false;
  }
  
  getAllResourcesInServicesTable(depPartId:number/*,additionalService?:AppointmentServiceSearchResponse*/):ResourceOfDepartmentPart[]{
    let result:ResourceOfDepartmentPart[] = [];
    // const control = new UntypedFormArray([this.getControlTablefield()]) ;
    // if(additionalService)
    //   control.push(additionalService);
    this.getControlTablefield().value.map(service=>{
      service.departmentPartsWithResourcesIds.map(depPart=>{
        if(depPart.id==depPartId){
          depPart.resourcesOfDepartmentPart.map(resource=>{
            let index = result.findIndex((o)=>{ return o.id  === resource.id });
            //if resource is not in list
            if( index === -1){
              result.push({...resource});// add this resource as new object
              // result[result.length-1].need_res_qtt=result[result.length-1].need_res_qtt*service.product_count;
            }
            else result[index].need_res_qtt = result[index].need_res_qtt + (/*service.product_count * */resource.need_res_qtt);
          })
        }
      })
    })
    return result;
  }

  // result is not included consumed resources in other Appointments (now_used)
  // because it calculates on existed services included into THIS appointment/ But this appointment can be w/o services, and resources can be ALREADY consumed
  getFreeResourcesOfDepPart(depPartId:number):Map<number, number>{
    let resourcesMap=new Map();
    let requiredResourcesOfCurrentDepPart:ResourceOfDepartmentPart[] = this.getAllResourcesInServicesTable(depPartId);
    // 1. Collect all resources of department part into the map [<resource ID> - <resource quantity>]
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        if(deppart.id==depPartId){
          deppart.resources.map(resource=>{
            resourcesMap.set(resource.resource_id, resource.resource_qtt);
          });
    // 2. Calculate free resources based on consumed resources of existed services in this department part (need_res_qtt) 
        requiredResourcesOfCurrentDepPart.map(requiredResource=>{
          if(resourcesMap.has(requiredResource.id))
            resourcesMap.set(requiredResource.id, (resourcesMap.get(requiredResource.id)/*-requiredResource.now_used*/-requiredResource.need_res_qtt))
          });
        }
      });
    });
    return resourcesMap;
  }

  getNotEnoughResourcesOfServicesInDepPart(depPartId:number/*, serviceQtt:number=1*/):ResourceOfDepartmentPart[]{
    let result:ResourceOfDepartmentPart[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        if(deppart.id==depPartId){
          let requiredResourcesOfCurrentDepPart:ResourceOfDepartmentPart[] = this.getAllResourcesInServicesTable(deppart.id);
          requiredResourcesOfCurrentDepPart.map(requiredResource=>{
            let index = deppart.resources.findIndex((o)=>{ return o.resource_id  === requiredResource.id });
            //if department part is not contains this resource or contains but one or some resources are not enough, and this resource is still not selected 
            if((index === -1 || (deppart.resources[index].resource_qtt<(requiredResource.need_res_qtt/**serviceQtt*/+requiredResource.now_used))) && result.findIndex((o)=>{ return o.id  === requiredResource.id }) === -1)
              result.push(requiredResource);
          });
        }
      });
    });
    return result;
  }
  getNotEnoughResourcesOfServiceInDepPart(service:AppointmentServiceSearchResponse, depPartId:number):ResourceOfDepartmentPart[]{
    let result:ResourceOfDepartmentPart[] = [];
    service.departmentPartsWithResourcesIds.map(depPart=>{
      if(depPart.id==depPartId){
        let freeDepPartResources = this.getFreeResourcesOfDepPart(depPartId);
        depPart.resourcesOfDepartmentPart.map(resource=>{
          // if resource is not in free resources OR resource is not enough, and this resource still not added to the return list
          if((!freeDepPartResources.has(resource.id) || freeDepPartResources.get(resource.id) < (resource.need_res_qtt+resource.now_used)) && result.findIndex((o)=>{ return o.id  === resource.id }) === -1)
            result.push(resource);
        })
      }
    })
    return result;
  }

  getResourcesNames(resources:ResourceOfDepartmentPart[]):string {
    let result='';
    let index=0;
    resources.map(resource=>{
      if(index>0) result = result + ', ';
      result = result + resource.name;
      index++;
    })
    return result;
  }  
  isThereAreServicesInTableWithEmployeeRequired():boolean{
    const control = this.getControlTablefield();
    if(control.length==0) return false;
    let result=false;
    control.value.map(product=>{
      if(product.employeeRequired){result=true}
    })
    return result;
  }

  getSelectedDepPartName(){
    let result = '';
    if(+this.formBaseInformation.get('department_part_id').value==0)
      result = '---';
    else {
      this.receivedDepartmentsWithPartsList.map(department=>{
        department.parts.map(deppart=>{
          if(deppart.id==+this.formBaseInformation.get('department_part_id').value)
            result = deppart.name;
        });
      });
    }
    if(result!='') return result; else return '???';
  }
  // getSelectedEmployeeName(){
  //   let result = '';
  //   if(+this.formBaseInformation.get('employeeId').value==0)
  //     result = '---';
  //   else {
  //     this.receivedEmployeesList.map(employee=>{
  //       if(employee.id==+this.formBaseInformation.get('employeeId').value)
  //         result = employee.name;
  //     });
  //   }
  //   if(result!='') return result; else return '???';
  // }
  generateName(){
    let result='';
    const products = this.getControl("appointmentsProductTable");
    const customers = this.getControl("customersTable");
    let name = '';
    let product = '';
    if(customers.value[0].name) name = customers.value[0].name.length>30?customers.value[0].name.slice(0,25)+'...':customers.value[0].name;
    products.value.map(prod=>{
      if(product=='' && prod.isServiceByAppointment) product=prod.name;
    })
    if(product=='' && products.value.length>0) product = products.value[0].name.length>30?products.value[0].name.slice(0,25)+'...':products.value[0].name;
    result =  (name + ((product.length>0&&name.length>0)?', ':'') + product);
    return result;
  }
  isThereProductInTable(cuctomerRowId:number,productId:number):boolean{
    let result: boolean = false;
    this.getControlTablefield().value.map(product=>{if(product.customerRowId == cuctomerRowId && product.product_id==productId){result=true}});
    return result;
  }
  isThereCustomerInTable(cuctomerId:number, customerName:string):boolean{
    let result: boolean = false;
    this.getControl('customersTable').value.map(customer=>{
      if((cuctomerId>0 && cuctomerId==customer.id) || (cuctomerId==0 && customerName.toUpperCase()==customer.name.toUpperCase())){result=true}
    });
    return result;
  }
  getRowIdOfCustomerInTable(cuctomerId:number, customerName:string):number{
    let result: number = -1;
    this.getControl('customersTable').value.map(customer=>{
      if((cuctomerId>0 && cuctomerId==customer.id) || (cuctomerId==0 && customerName.toUpperCase()==customer.name.toUpperCase())){result=customer.row_id}
    });
    return result;
  }
  // ---------------------------------------------------- FILTRATION SYSTEM ------------------------------------------------------------------------
  // *** Employees ***
  get accessibleEmployeesIdsAll():number[]{
    let data = [this.accessibleEmployeesIdsByTimeOrSchedule, 
                this.accessibleEmployeesIdsBySelectedJobTitle, 
                this.accessibleEmployeesIdsBySelectedDepPart,
                this.accessibleEmployeesIdsBySelectedServices];
    return data.reduce((a, b) => a.filter(c => b.includes(c)));  //intersection of multiple arrays will be accessible employees at this moment
  }
  get accessibleEmployeesIdsByTimeOrSchedule():number[]{
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{if(employee.state=='free') result.push(employee.id);});
    return result;
  }
  get accessibleEmployeesIdsBySelectedJobTitle():number[]{
    // employee is accessible by job title if job title is not selected, or it is selected and it is a job title of this employee
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{if(+this.formBaseInformation.get('jobtitle_id').value==0 || (+this.formBaseInformation.get('jobtitle_id').value>0 && employee.jobtitle_id==this.formBaseInformation.get('jobtitle_id').value)) result.push(employee.id);});
    return result;
  }
  get accessibleEmployeesIdsBySelectedDepPart():number[]{
    if(+this.formBaseInformation.get('department_part_id').value == 0)
      return this.getAllEmployeeIds();
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{
      if(this.accessibleEmployeesIdsByTimeOrSchedule.includes(employee.id)){
        employee.departmentPartsWithServicesIds.map(deppart=>{
          if(deppart.id==+this.formBaseInformation.get('department_part_id').value && deppart.servicesIds.length>0)
            result.push(employee.id);
        })
      }      
    });
    return result;
  }
  get accessibleEmployeesIdsBySelectedServices():number[]{
    const control = this.getControlTablefield();
    if(!this.isThereAreServicesInTableWithEmployeeRequired())// if there are no selected services or no one of selected sevices required employee
      return this.getAllEmployeeIds(); 
    let result:number[] = [];
    let employeesMap=new Map(); 
    let countOfServicesByAppointment=0; 
    control.value.map(product=>{
      if(product.departmentPartsWithResourcesIds.length>0 && product.isServiceByAppointment && product.employeeRequired){//if Department parts of service >0 then it is service by appointment.
        this.receivedEmployeesList.map(employee=>{
          let employeeHasThisService=false;
          employee.departmentPartsWithServicesIds.map(deppart=>{
            deppart.servicesIds.map(id=>{
              if(id==product.product_id)
                employeeHasThisService=true;    
            });            
          });
          if(employeeHasThisService)
            employeesMap.set(employee.id, employeesMap.has(employee.id)?(employeesMap.get(employee.id)+1):1);
        });
        countOfServicesByAppointment++;
      }
    })
    employeesMap.forEach((value, key)=>{
      if(value==countOfServicesByAppointment) result.push(key);
    });   
    return result;
  }
  // get accessibleDepPartsIdsBySelectedServices():number[]{
  //   // if products are not selected - suitable IDs are all department parts IDs:
  //   const control = this.getControlTablefield();
  //   if(control.length==0){
  //     return this.getAllDeppartsIds(); 
  //   }
  //   // the department part is suitable if its ID included into the each service by appointment
  //   let depparts:number[] = [];
  //   let depPartsMap=new Map(); 
  //   let countOfServicesByAppointment=0; //if Department parts of service >0 then it is service by appointment.
  //   control.value.map(product=>{
  //     if(product.departmentPartsWithResourcesIds.length>0){
  //       product.departmentPartsWithResourcesIds.map(deppart=>{          
  //         depPartsMap.set(deppart.id, depPartsMap.has(deppart.id)?(depPartsMap.get(deppart.id)+1):1);
  //       });
  //       countOfServicesByAppointment++;
  //     }
  //   })
  //   depPartsMap.forEach((value, key)=>{
  //     if(value==countOfServicesByAppointment) depparts.push(key);
  //   })
  //   return depparts;
  // }



  // *** Job Titles ***
  get accessibleJobTitlesIdsAll():number[]{
    let data = [this.accessibleJobTitlesIdsByAccessibleEmployees, 
                this.accessibleJobTitlesIdsBySelectedDepPart
                // this.accessibleJobTitlesIdsBySelectedService
              ];
    return data.reduce((a, b) => a.filter(c => b.includes(c)));  //intersection of multiple arrays will be accessible Job Titles at this moment
  }
  get accessibleJobTitlesIdsByAccessibleEmployees():number[]{
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{if(employee.state=='free') result.push(employee.jobtitle_id);});
    return result;
  }
  get accessibleJobTitlesIdsBySelectedDepPart():number[]{
    //Collecting job titles IDs of accessible employees who do a services in a selected department part
    if(+this.formBaseInformation.get('department_part_id').value == 0)
      return this.getAllJobTitlesIds();
    let result:number[]=[];
    this.accessibleEmployeesIdsBySelectedDepPart.map(empId=>{
      result.push(this.getEmployeeById(empId).jobtitle_id);
    });
    return result;
  }
  // get accessibleJobTitlesIdsBySelectedService():number[]{
  //   if(!this.mainProduct)
  //     return this.getAllJobTitlesIds();
  //   let result:number[]=[];
  //   this.accessibleEmployeesIdsBySelectedServices.map(empId=>{
  //     result.push(this.getEmployeeById(empId).jobtitle_id);
  //   });
  //   return result;
  // }
  onJobTitleSelect(jobtitleId:number){
    if(this.accessibleJobTitlesIdsByAccessibleEmployees.includes(jobtitleId)){
      this.documentChanged=true;
      this.clearEmployeeField();
      this.checkEmptyEmployeeField();
      this.formBaseInformation.get('jobtitle_id').setValue(jobtitleId);    
    }
    if(this.accessibleEmployeesIdsAll.length==1){
      this.onEmployeeChange(this.accessibleEmployeesIdsAll[0], jobtitleId);
      this.updateEmployeeValues(); // setting the name of employee into its search text field
    } 
  }
  // *** Department parts ***

  get accessibleDepPartsIdsAll():number[]{
    let data = [this.accessibleDepPartsIdsByAccessibleEmployees, 
                this.accessibleDepPartsIdsBySelectedEmployee,
                this.accessibleDepPartsIdsBySelectedServices,
                this.accessibleDepPartsIdsByResourcesOfSelectedServices,
                this.accessibleDepPartsIdsByActive //toggle_off
    ];
    return data.reduce((a, b) => a.filter(c => b.includes(c)));  //intersection of multiple arrays will be accessible employees at this moment
  }

  get accessibleDepPartsIdsByAccessibleEmployees():number[]{
    let result:number[]=[];
    // if service is selected and employee is not need for this service - suitable IDs are all IDs:
    const control = this.getControlTablefield();
    if(control.length>0 && !this.isThereAreServicesInTableWithEmployeeRequired()){ // if there are selected services but no one of selected sevices required employee
      return this.getAllDeppartsIds();
    // if serviceы are not selected, or selected and employee is need for this service, 
    // then department parts IDs getting from accessible employees    
    } else {
      let allDepparts:number[] = this.getAllDeppartsIds();
      this.receivedEmployeesList.map(employee=>{
          if(this.accessibleEmployeesIdsAll.includes(employee.id)){
            employee.departmentPartsWithServicesIds.map(depPart=>{
              if(allDepparts.includes(depPart.id)) result.push(depPart.id);
            });
          } 
      });
    }
    if(+this.formBaseInformation.get('jobtitle_id').value>0)
      return result;
    else
      return result.concat(this.depPartsIdsWithNoEmployeeRequired);
  }
  get accessibleDepPartsIdsBySelectedEmployee():number[]{
    // if employee is not selected - suitable IDs are all department parts IDs:
    if(+this.formBaseInformation.get('employeeId').value == 0)
      return this.getAllDeppartsIds(); 
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{
        if(this.formBaseInformation.get('employeeId').value == employee.id){
          employee.departmentPartsWithServicesIds.map(depPart=>{
            result.push(depPart.id);
          });
        }
      })
    return result;
  }
  isThereAreServicesByAppointmentInTable(){
    let result=false;
    this.getControlTablefield().value.map(p=>{if(p.isServiceByAppointment) result = true});
    return result;
  }
  get accessibleDepPartsIdsBySelectedServices():number[]{
    // if products are not selected - suitable IDs are all department parts IDs:
    const control = this.getControlTablefield();
    if(control.length==0 || !this.isThereAreServicesByAppointmentInTable()){
      return this.getAllDeppartsIds(); 
    }
    // the department part is suitable if its ID included into the each service by appointment
    let depparts:number[] = [];
    let depPartsMap=new Map(); 
    let countOfServicesByAppointment=0; //if Department parts of service >0 then it is service by appointment.
    control.value.map(product=>{
      if(product.isServiceByAppointment && product.departmentPartsWithResourcesIds.length>0){
        product.departmentPartsWithResourcesIds.map(deppart=>{          
          depPartsMap.set(deppart.id, depPartsMap.has(deppart.id)?(depPartsMap.get(deppart.id)+1):1);
        });
        countOfServicesByAppointment++;
      }
    })
    depPartsMap.forEach((value, key)=>{
      if(value==countOfServicesByAppointment) depparts.push(key);
    })
    return depparts;
  }
  get accessibleDepPartsIdsByResourcesOfSelectedServices():number[]{
    // if main product is not selected - suitable IDs are all department parts IDs:
    if(this.getControlTablefield().length==0){
      return this.getAllDeppartsIds();
    }
    let result:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        let allResourcesEnough:boolean = true;
        let requiredResourcesOfCurrentDepPart:ResourceOfDepartmentPart[] = this.getAllResourcesInServicesTable(deppart.id);
        // console.log(JSON.stringify(requiredResourcesOfCurrentDepPart))
        requiredResourcesOfCurrentDepPart.map(requiredResource=>{

          let index = deppart.resources.findIndex((o)=>{ return o.resource_id  === requiredResource.id });
            //if department part is not contains this resource, or contains but one or some resources are not enough 
            if( index === -1 || (deppart.resources[index].resource_qtt<(requiredResource.need_res_qtt+requiredResource.now_used)))
              allResourcesEnough=false;
        })
        if(allResourcesEnough && !result.includes(deppart.id)) result.push(deppart.id)
      });
    });
    return result;
  }
  // set of dep. parts IDs where there is at least one service with no employee required
  get depPartsIdsWithNoEmployeeRequired():number[]{
    let depparts:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        deppart.deppartProducts.map(service=>{
          if(!service.employeeRequired && depparts.indexOf(deppart.id) === -1)
            depparts.push(deppart.id);
        })
      })
    });
    return depparts;
  }

  get accessibleDepPartsIdsByActive(){
    let result:number[]=[];
    this.receivedDepartmentsWithPartsList.map(department=>{
      department.parts.map(deppart=>{
        if(deppart.is_active) result.push(deppart.id)
      });
    });
    return result;
  }
  onDepartmentPartSelect(part_id:number, department_id:number){
    // this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.getDepartmentIdByDepPartId()));
    this.getSetOfTypePrices();
    if(this.accessibleEmployeesIdsAll.length==1 && !this.settingsForm.get('hideEmployeeField').value){
      // alert(!this.settingsForm.get('hideEmployeeField').value)
      this.formBaseInformation.get('employeeId').setValue(this.accessibleEmployeesIdsAll[0]);
      let employee:Employee = this.getEmployeeById(this.accessibleEmployeesIdsAll[0]);
      this.formBaseInformation.get('employeeName').setValue(employee.name);
      this.formBaseInformation.get('jobtitle_id').setValue(employee.jobtitle_id);
    }
  }

  // *** Services ***
  accessibleServicesIdsAll():number[]{
    let data = [this.accessibleServicesIdsByAccessibleEmployees, 
                this.accessibleServicesIdsBySelectedEmployee,
                this.accessibleServicesIdsBySelectedDepPart,
                this.accessibleServicesIdsByResourcesOfSelectedDepPart,
                this.servicesThatNoNeedEmployees,
    /*this.accessibleServicesIdsByResourcesOfAccessibleDepParts*/];
    // console.log('accessibleServicesIdsAll = ',data.reduce((a, b) => a.filter(c => b.includes(c))))
    return data.reduce((a, b) => a.filter(c => b.includes(c)));  //intersection of multiple arrays will be accessible employees at this moment
  }
  get servicesThatNoNeedEmployees():number[]{
    // if employee is selected - this get is no matter
    if(+this.formBaseInformation.get('employeeId').value!=0)
      return this.getAllServicesIds(false);
    // if employee is not selected - collect only IDs of services that no need employees 
    let result:number[]=[];
    this.filteredProducts.map(service=>{
      if(!service.employeeRequired)
        result.push(service.id);  
    });
    return result;
  }
  get accessibleServicesIdsByAccessibleEmployees():number[]{
    // if employee is selected - this get is no matter
    if(+this.formBaseInformation.get('employeeId').value!=0)
      return this.getAllServicesIds(false);
    let result:number[]=[];
    this.filteredProducts.map(service=>{
      this.accessibleEmployeesIdsAll.map(employeeId=>{
        this.getEmployeeById(employeeId).departmentPartsWithServicesIds.map(depPart=>{
          if(service.isServiceByAppointment && depPart.servicesIds.includes(service.id))
            result.push(service.id);  
        });
      });
    });
    if(+this.formBaseInformation.get('jobtitle_id').value>0)
      return result;
    else
      return result.concat(this.getAllServicesIds(true));
  }
  get accessibleServicesIdsBySelectedEmployee():number[]{
     // if employee is selected - this get is no matter
    if(+this.formBaseInformation.get('employeeId').value==0)
      return this.getAllServicesIds(false);
    let result:number[]=[];
    this.receivedEmployeesList.map(employee=>{
      if(this.formBaseInformation.get('employeeId').value == employee.id){
        employee.departmentPartsWithServicesIds.map(depPart=>{
          depPart.servicesIds.map(serviceId=>{
            result.push(serviceId);
          })
        });
      }
    });
    this.filteredProducts.map(p=>{
      // if it is not service by appointment of it is service by appointment and employee for this service is not required
      if(p.departmentPartsWithResourcesIds.length==0 || (p.departmentPartsWithResourcesIds.length>0 && !p.employeeRequired))
        result.push(p.id);
    });
    return result;
  }
  get accessibleServicesIdsBySelectedDepPart():number[]{
    if(+this.formBaseInformation.get('department_part_id').value == 0)
      return this.getAllServicesIds(false);
    let result:number[]=[];
    this.filteredProducts.map(p=>{
      p.departmentPartsWithResourcesIds.map(dp=>{
        if(this.formBaseInformation.get('department_part_id').value==dp.id)
          result.push(p.id)})          
    });
    return result;
  }

  get accessibleServicesIdsByResourcesOfSelectedDepPart():number[]{
    if(+this.formBaseInformation.get('department_part_id').value == 0)
      return this.getAllServicesIds(false);
    let result:number[] = [];
    let freeDepPartResources = this.getFreeResourcesOfDepPart(this.formBaseInformation.get('department_part_id').value)
    this.filteredProducts.map(service=>{
      //service is not by appointment OR service is not accessible in this department part
      if(service.isServiceByAppointment && (service.departmentPartsWithResourcesIds.length==0 || service.departmentPartsWithResourcesIds.findIndex((o)=>{ return o.id  === this.formBaseInformation.get('department_part_id').value }) === -1))
        result.push(service.id);
      service.departmentPartsWithResourcesIds.map(dp=>{        
        if(dp.id==this.formBaseInformation.get('department_part_id').value) {
          // if service do not need any resources or 
          if(dp.resourcesOfDepartmentPart.length==0)
            result.push(service.id)
          else {
            let goodService = true; // if at least one of resources is absent or not enough - it will be false and not added to the return list
            dp.resourcesOfDepartmentPart.map(resource=>{
              if(!goodService || !freeDepPartResources.has(resource.id) || freeDepPartResources.get(resource.id)<resource.need_res_qtt+resource.now_used)
                goodService = false;
            })
            if(goodService)
              result.push(service.id);
          }
        }
      })
    })
    return result;
  }
  // get accessibleServicesIdsByResourcesOfAccessibleDepParts():number[]{
  //   if(+this.formBaseInformation.get('department_part_id').value > 0 || this.accessibleDepPartsIdsAll.length==0)
  //     return this.getAllServicesIds(false);
  //   let result:number[] = [];
  //     this.filteredProducts.map(service=>{
  //       if(service.departmentPartsWithResourcesIds.length==0 /*|| service.departmentPartsWithResourcesIds.findIndex((o)=>{ return this.accessibleDepPartsIdsAll.includes(o.id) }) === -1*/)
  //         result.push(service.id);
  //       service.departmentPartsWithResourcesIds.map(dp=>{
  //         if(this.accessibleDepPartsIdsAll.includes(dp.id)) {
  //           if(dp.resourcesOfDepartmentPart.length==0 || this.getNotEnoughResourcesOfServiceInDepPart(service, dp.id).length==0)
  //             result.push(service.id)
  //           if(this.getNotEnoughResourcesOfServiceInDepPart(service, dp.id).length>0)
  //             this.notEnoughResourcesInDepParts.set(service.id, this.getResourcesNames(this.getNotEnoughResourcesOfServiceInDepPart(service, dp.id)))
  //         }
  //       })
  //     })
  //   return result;
  // }

  // get nonaccessibleEmployeesIdsBySelectedJobTitle():number[]{
  //   return this.accessibleEmployeesIdsAll.filter(n => !this.accessibleEmployeesIdsBySelectedJobTitle.includes(n));
  // }



  // isJobTitleAccessblByEmplloyees(jobtitleId:number):boolean{
    // let result=false; this.receivedEmployeesList.map(employee=>{if(employee.jobtitle_id==jobtitleId) result=true;}); return result;
  // }

  // *** Table services ***
  get accessibleTableServicesIdsByResourcesOfSelectedDepPart():number[]{
    if(+this.formBaseInformation.get('department_part_id').value == 0)
      return this.getAllTableServicesIds();
    let result:number[] = [];
    let freeDepPartResources = this.getFreeResourcesOfDepPart(this.formBaseInformation.get('department_part_id').value)
    this.getControlTablefield().value.map(service=>{
      //service is not by appointment OR service is not accessible in this department part
      if(service.departmentPartsWithResourcesIds.length==0 || service.departmentPartsWithResourcesIds.findIndex((o)=>{ return o.id  === this.formBaseInformation.get('department_part_id').value }) === -1)
        result.push(service.product_id);
      service.departmentPartsWithResourcesIds.map(dp=>{        
        if(dp.id==this.formBaseInformation.get('department_part_id').value) {
          // if service do not need any resources or 
          if(dp.resourcesOfDepartmentPart.length==0)
            result.push(service.product_id)
          else {
            let goodService = true; // if at least one of resources is absent or not enough - it will be false and not added to the return list
            //  console.log('freeDepPartResources',freeDepPartResources)
            dp.resourcesOfDepartmentPart.map(resource=>{
              // console.log('resource.id='+resource.id+', resourceQtt=',freeDepPartResources.get(resource.id))
              if(!goodService || !freeDepPartResources.has(resource.id) || freeDepPartResources.get(resource.id)<resource.now_used)
                goodService = false;
            })
            if(goodService)
              result.push(service.product_id);
          }
        }
      })
    })
    return result;
  }
  // get tableServicesThatNeedEmployees():number[]{
  //   let result:number[]=[];
  //   this.getControlTablefield().value.map(service=>{
  //     if(service.employeeRequired)
  //       result.push(service.id);  
  //   });
  //   return result;
  // }
  get tableServicesThatNoNeedEmployees():number[]{
    // if employee is selected - this get is no matter
    if(+this.formBaseInformation.get('employeeId').value!=0)
      return this.getAllTableServicesIds(false);
    // if employee is not selected - collect only IDs of services that no need employees
    let result:number[]=[];
    this.getControlTablefield().value.map(service=>{
      if(!service.employeeRequired)
        result.push(service.id);  
    });
    return result;
  }
  //--------------------------------------------------------------------------- Утилиты ---------------------------------------------------------------------------------------------------------
  //заменяет запятую на точку при вводе цены или количества в заданной ячейке
  commaToDotInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    // console.log('control.controls[row_index].get(fieldName).value=',control.controls[row_index].get(fieldName).value)
    control.controls[row_index].get(fieldName).setValue(control.controls[row_index].get(fieldName).value.toString().replace(",", "."));
  }
  nullToZeroInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    console.log('control.controls[row_index].get(fieldName).value=',control.controls[row_index].get(fieldName).value)
    
    if(control.controls[row_index].get(fieldName).value==null){
      control.controls[row_index].get(fieldName).setValue(0);
      console.log('SETTING');
    }
  }
  //для проверки в таблице с вызовом из html
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}

  timeTo24h(time:string){
    // In ru locale MomentJs has 'утра' and 'вечера' instead of AM and PM
    // if current locale is ru - moment to convert string to time format needs to have string contained 'утра','вечера' instead of AM PM  
    if(this.locale=='ru') time=time.replace('PM','вечера').replace('AM','утра');
    return(this.isTimeFormatAmPm(time)?moment(time, 'hh:mm A').format('HH:mm'):time);
  }
  isTimeFormatAmPm(time:string){
    return((time.includes("AM") || time.includes("PM") || time.includes("утра") || time.includes("вечера")));
  }
  isNumber(n) {return !isNaN(parseFloat(n)) && isFinite(n);}
  //Конвертирует число в строку типа 0.00 например 6.40, 99.25
  numToPrice(price:number,charsAfterDot:number) {
    if(price != undefined && this.isNumber(price)){
      //конертим число в строку и отбрасываем лишние нули без округления
      const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + charsAfterDot + "})?", "g")
      // console.log('price',price)
      // console.log('+price',+price)
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
  }
}