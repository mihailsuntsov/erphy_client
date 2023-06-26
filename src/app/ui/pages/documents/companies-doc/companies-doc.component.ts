import { Component, OnInit , Inject, Optional, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++
import { v4 as uuidv4 } from 'uuid';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  company: string;// предприятие, которому будет принадлежать документ
  creator: string; // создатель
  creator_id: number; //id создателя
  master: string; // мастер-аккаунт
  master_id: number; //id мастер-аккаунта
  changer:string;// кто изменил
  changer_id: number;// id кто изменил
  opf:string;//организационно-правовая форма предприятия
  // opf_id: number;//id организационно-правовая форма предприятия
  name: string; //наименование
  date_time_changed: string;//дату изменения
  date_time_created: string;//дату создания

  // currency_id: number;
  nds_payer: boolean;
  fio_director: string;
  director_position: string;
  fio_glavbuh: string;
  director_signature_id: number;
  glavbuh_signature_id: number;
  stamp_id: number;
  director_signature_filename:string;
  stamp_filename:string;
  glavbuh_signature_filename:string;
  card_template_filename:string;
  card_template_original_filename:string;
  card_template_id: number;

// Апдейт Контрагентов:
  code: string;//код
  telephone: string;//телефон
  site: string;//факс
  email: string;//емейл
  //фактический адрес:
  zip_code: string;// почтовый индекс
  country_id: number;//id страна
  region_id: number;//id область
  city_id: number;//id город/нас.пункт
  country: number;//страна
  region: string;//область
  area: string; //район
  city: string;//город/нас.пункт
  street: string;//улица
  home: string;//дом
  flat: string;//квартира
  additional_address: string;//дополнение к адресу
  status_id: number;//id статус контрагента
  //Юридические реквизиты
  jr_jur_full_name: string;//полное название (для юрлиц)
  jr_jur_kpp: string;//кпп (для юрлиц)
  jr_jur_ogrn: string;//огрн (для юрлиц)
  //юридический адрес (для юрлиц) /адрес регистрации (для ип и физлиц)
  jr_zip_code: string;// почтовый индекс
  jr_country_id: number;//id страна
  jr_region_id: number;//id область
  jr_city_id: number;//id город/нас.пункт
  jr_country: number;// страна
  jr_region: string;//область
  jr_area: string; //район
  jr_city: string;//город/нас.пункт
  jr_street: string;//улица
  jr_home: string;//дом
  jr_flat: string;//квартира
  jr_additional_address: string;//дополнение к адресу
  jr_inn: string;//ИНН
  jr_vat: string;//VAT 
  jr_okpo: string;//ОКПО
  jr_fio_family: string;//Фамилия (для ИП или физлица)
  jr_fio_name: string;//Имя (для ИП или физлица)
  jr_fio_otchestvo: string;//Отчество (для ИП или физлица)
  jr_ip_ogrnip: string;//ОГРНИП (для ИП)
  jr_ip_svid_num: string; // номер свидетельства (для ИП). string т.к. оно может быть типа "серия 77 №42343232"
  jr_ip_reg_date: string; // дата регистрации ИП (для ИП)

  type: string;// entity or individual
  legal_form: string;// legal form of individual (ie entrepreneur, ...)

  //Settings
  st_prefix_barcode_pieced: number;// prefix of barcode for pieced product
  st_prefix_barcode_packed: number;// prefix of barcode for packed product
  st_netcost_policy: string;       // policy of netcost calculation by all company or by each department separately

  nds_included: boolean;                // used with nds_payer as default values for Customers orders fields "Tax" and "Tax included"

  // E-commerce integration
  /*
  is_store: boolean;                // on off the store
  store_site_address: string;       // e.g. http://localhost/DokioShop
  store_key: string;                // consumer key
  store_secret: string;             // consumer secret
  store_type: string;               // e.g. woo
  store_api_version: string;        // e.g. v3
  crm_secret_key: string;           // like UUID generated
  store_price_type_regular: number; // id of regular type price
  store_price_type_sale: number;    // id of sale type price
  store_orders_department_id: number;   // department for creation Customer order from store
  store_if_customer_not_found: string;  // "create_new" or "use_default"
  store_default_customer_id: number;    // counterparty id if store_if_customer_not_found=use_default
  cagent: string;                       // the name of store_default_customer
  store_default_creator_id: number;     // ID of default user, that will be marked as a creator of store order. Default is master user
  store_days_for_esd: number;           // number of days for ESD of created store order. Default is 0 
  store_default_creator: string;        // name of default user that will be marked as a creator of store order.
  store_auto_reserve: boolean;          // auto reserve product after getting internet store order
  companyStoreDepartments: number[];    // internet store's departments
  store_ip: string;                     // store server ip address
  */
  store_default_lang_code: string;      // internet-store basic language, e.g. EN, RU, UA, ...
}

interface IdAndName{
  id: number;
  name: string;
}
interface IdAndName_ru{
  id: number;
  name_ru: string;
}
interface CompanyStoreDepartment{
  id: number;
  name: string;
  menuOrder:number;
}
interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
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
interface statusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
interface idNameDescription{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-companies-doc',
  templateUrl: './companies-doc.component.html',
  styleUrls: ['./companies-doc.component.css'],
  providers: [LoadSpravService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})

export class CompaniesDocComponent implements OnInit {
  id: number=0;// id документа
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  myCompanyId:number=null;
  receivedSpravSysOPF: any [];//массив для получения данных справочника форм предприятий
  receivedCurrencyList: any [];// список валют
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  fileInfo : filesInfo = null; //массив для получения информации по прикрепленным к документу файлам 
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра карточки документа
  oneClickSaveControl:boolean=false;//блокировка кнопок Save и Complete для защиты от двойного клика
  //поиск адреса и юр. адреса (Страна, Район, Город):
  // Страны 
  spravSysCountries: IdAndName_ru[] = [];// массив, куда будут грузиться все страны 
  // spravSysJrCountries: IdAndName[] = [];// массив, куда будут грузиться все юр. страны 
  filteredSpravSysCountries: Observable<IdAndName_ru[]>; //массив для отфильтрованных Страна 
  filteredSpravSysJrCountries: Observable<IdAndName_ru[]>; //массив для отфильтрованных Юр Страна
  // Регионы
  //для поиска района по подстроке
  searchRegionCtrl = new UntypedFormControl();//поле для поиска
  isRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredRegions: Region[];//массив для загрузки найденных по подстроке регионов
  searchJrRegionCtrl = new UntypedFormControl();//поле для поиска
  isJrRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canJrRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredJrRegions: Region[];//массив для загрузки найденных по подстроке регионов
  // Города
  //для поиска района по подстроке
  searchCityCtrl = new UntypedFormControl();//поле для поиска
  isCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCities: City[];//массив для загрузки найденных по подстроке городов
  searchJrCityCtrl = new UntypedFormControl();//поле для поиска
  isJrCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canJrCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredJrCities: City[];//массив для загрузки найденных по подстроке городов
  // Районы 
  area:string = '';
  jr_area:string = '';

  //для отображения и скрытия полей в юридической информации, отвечающих за ИП, физлицо или юрлицо в зависимости от выбранной организационно-правовой формы
  viz_jr_jur:boolean=false;
  viz_jr_ip:boolean=false;

  idAndNameArr:IdAndName[]=[];
  receivedStatusesList: statusInterface [] = []; // массив для получения списка статусов
  status_color: string = '';
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)
  countryId:number;    // id of user's company country of jurisdiction
  organization = '';    // organization of country of jurisdiction(e.g. EU)

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //для поиска контрагента (поставщика) по подстроке
  searchCagentCtrl = new UntypedFormControl();//поле для поиска дефолтного контрагента для созданных из интернет-магазина заказов
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  //для поиска создателя интернет-заказов по подстроке
  searchDefaultCreatorCtrl = new UntypedFormControl();//поле для поиска пользователя, который будет назначен как создатель для созданных из интернет-магазина заказов 
  isDefaultCreatorListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canDefaultCreatorAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredDefaultCreators: any;
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  editability:boolean = false; // возможность редактирования полей.
  rightsDefined:boolean; // определены ли права !!!

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  public dialogAddFiles: MatDialog,
  private _router:Router,
  public MessageDialog: MatDialog,
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private _fb: UntypedFormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  public ConfirmDialog: MatDialog,
  private _adapter: DateAdapter<any>) { 
    if(activateRoute.snapshot.params['id'])
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company: new UntypedFormControl      ('',[]),
      opf: new UntypedFormControl      ('',[]),
      // opf_id: new FormControl      ('',[]),
      name: new UntypedFormControl      ('',[Validators.required,Validators.maxLength(500)]),
      code: new UntypedFormControl      ('',[Validators.maxLength(30)]),
      telephone: new UntypedFormControl      ('',[Validators.maxLength(60)]),
      site:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      email:  new UntypedFormControl      ('',[Validators.maxLength(254)]),

      nds_payer: new UntypedFormControl      (false,[]),
      nds_included:                new UntypedFormControl   (false,[]),                // used with nds_payer as default values for Customers orders fields "Tax" and "Tax included"
      fio_director: new UntypedFormControl      ('',[Validators.maxLength(120)]),
      director_position: new UntypedFormControl      ('',[Validators.maxLength(120)]),
      fio_glavbuh: new UntypedFormControl      ('',[Validators.maxLength(120)]),
      director_signature_id: new UntypedFormControl      ('',[]),
      glavbuh_signature_id: new UntypedFormControl      ('',[]),
      stamp_id: new UntypedFormControl      ('',[]),
      director_signature_filename: new UntypedFormControl      ('',[]),
      glavbuh_signature_filename: new UntypedFormControl      ('',[]),
      stamp_filename: new UntypedFormControl      ('',[]),
      card_template_filename: new UntypedFormControl      ('',[]),
      card_template_original_filename: new UntypedFormControl      ('',[]),
      card_template_id: new UntypedFormControl      ('',[]),

      //фактический адрес:
      zip_code:  new UntypedFormControl      ('',[Validators.maxLength(40)]),
      country_id:  new UntypedFormControl      (null,[]),
      // region_id:  new FormControl      ('',[]),
      // city_id:  new FormControl      ('',[]),
      region:  new UntypedFormControl      ('',[]),
      city:  new UntypedFormControl      ('',[]),
      street:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      home:  new UntypedFormControl      ('',[Validators.maxLength(16)]),
      flat:  new UntypedFormControl      ('',[Validators.maxLength(8)]),
      additional_address:  new UntypedFormControl      ('',[Validators.maxLength(240)]),
      status_id:  new UntypedFormControl      ('',[]),
      price_type_id:  new UntypedFormControl      ('',[]),
      discount_card:   new UntypedFormControl      ('',[Validators.maxLength(30)]),
      //Юридические реквизиты new FormControl      ('',[]),
      jr_jur_full_name:  new UntypedFormControl      ('',[Validators.maxLength(500)]),
      jr_jur_kpp:  new UntypedFormControl      ('',[Validators.pattern('^[0-9]{9}$')]),
      jr_jur_ogrn:  new UntypedFormControl      ('',[/*Validators.pattern('^[0-9]{13}$')*/]),
      //юридический адрес (для юрлиц) /адрес регистрации (для ип и физлиц)
      jr_zip_code:  new UntypedFormControl      ('',[Validators.maxLength(40)]),
      jr_country_id:  new UntypedFormControl      (null,[]),
      // jr_region_id:  new FormControl      ('',[]),
      // jr_city_id:  new FormControl      ('',[]),
      jr_region:  new UntypedFormControl      ('',[]),
      jr_city:  new UntypedFormControl      ('',[]),
      jr_street:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      jr_home:  new UntypedFormControl      ('',[Validators.maxLength(16)]),
      jr_flat:  new UntypedFormControl      ('',[Validators.maxLength(8)]),
      jr_additional_address:  new UntypedFormControl      ('',[Validators.maxLength(240)]),
      jr_inn:  new UntypedFormControl      ('',[/*Validators.pattern('^([0-9]{10}|[0-9]{12})$')*/]),
      jr_vat:  new UntypedFormControl      ('',[Validators.maxLength(100)]),
      jr_okpo:  new UntypedFormControl      ('',[Validators.pattern('^([0-9]{8}|[0-9]{10})$')]),
      jr_fio_family:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      jr_fio_name:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      jr_fio_otchestvo:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      jr_ip_ogrnip:  new UntypedFormControl      ('',[/*Validators.pattern('^[0-9]{15}$')*/]),
      jr_ip_svid_num:  new UntypedFormControl      ('',[Validators.maxLength(30)]),
      jr_ip_reg_date:  new UntypedFormControl      ('',[]),//на дату валидаторы не вешаются, у нее свой валидатор
      companiesPaymentAccountsTable: new UntypedFormArray ([]) ,
      country:  new UntypedFormControl      ('',[]),
      jr_country:  new UntypedFormControl      ('',[]),
      type:  new UntypedFormControl      ('entity',[]),// entity or individual
      legal_form:  new UntypedFormControl      ('',[Validators.maxLength(240)]),
      //Settings
      st_prefix_barcode_pieced: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{2}$')]), // prefix of barcode for pieced product
      st_prefix_barcode_packed: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{2}$')]), // prefix of barcode for packed product
      st_netcost_policy:        new UntypedFormControl      ('all',[]), // policy of netcost calculation by "all" company or by "each" department separately
      
      // E-commerce integration
      /*
      is_store:                 new UntypedFormControl      (false,[]),  // on off the store
      store_site_address:       new UntypedFormControl      ('',[Validators.maxLength(128)]),  // e.g. http://localhost/DokioShop
      store_key:                new UntypedFormControl      ('',[Validators.maxLength(128)]),  // consumer key
      store_secret:             new UntypedFormControl      ('',[Validators.maxLength(128)]),  // consumer secret
      store_type:               new UntypedFormControl      ('woo',[]),  // e.g. woo
      store_api_version:        new UntypedFormControl      ('v3',[]),  // e.g. v3
      crm_secret_key:           new UntypedFormControl      ('',[Validators.maxLength(36)]),  // like UUID generated
      store_price_type_regular: new UntypedFormControl      ('',[]),  // id of regular type price
      store_price_type_sale:    new UntypedFormControl      ('',[]),  // id of sale type price
      store_orders_department_id:  new UntypedFormControl   (null,[]),   // department for creation Customer order from store
      store_if_customer_not_found: new UntypedFormControl   ('create_new',[]),  // "create_new" or "use_default"
      store_default_customer_id:   new UntypedFormControl   (null,[]),    // counterparty id if store_if_customer_not_found=use_default
      store_default_creator_id:    new UntypedFormControl   (null,[]),   // ID of default user, that will be marked as a creator of store order. Default is master user
      store_days_for_esd:          new UntypedFormControl   (0,[Validators.maxLength(3),Validators.pattern('^[0-9]{1,3}$')]),// number of days for ESD of created store order. Default is 0 
      companyStoreDepartments:     new UntypedFormControl   ([],[]),
      store_auto_reserve:          new UntypedFormControl   (false,[]), // auto reserve product after getting internet store order
      store_ip:                    new UntypedFormControl   (null,[Validators.maxLength(21)]),  // internet-store ip address
      */
      store_default_lang_code:     new UntypedFormControl   ('EN',[Validators.required, Validators.minLength(2),Validators.maxLength(2)]),
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl      ('',[]),
      master: new UntypedFormControl      ('',[]),
      creator: new UntypedFormControl      ('',[]),
      changer: new UntypedFormControl      ('',[]),
      company: new UntypedFormControl      ('',[]),
      date_time_created: new UntypedFormControl      ('',[]),
      date_time_changed: new UntypedFormControl      ('',[]),
    });
    this.getSpravSysOPF();
    // this.getCurrencyList();
    this.getSpravSysCountries();
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель по умолчанию"
    this.onDefaultCreatorSearchValueChanges();//отслеживание изменений поля "Создатель интернет-заказов"
    this.getSetOfPermissions();
    //+++ getting base data from parent component
    // this.getBaseData('myId');    
    this.getBaseData('myCompanyId');      
    this.getBaseData('accountingCurrency');   
    this.getBaseData('countryId');   
    this.getBaseData('organization');  

    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.docId; this.formBaseInformation.get('id').setValue(this.id);}
    }

    //слушалки наизменение полей адресов
    this.filteredSpravSysCountries=this.formBaseInformation.get('country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_country(value)));
    this.filteredSpravSysJrCountries=this.formBaseInformation.get('jr_country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_jr_country(value)));
    // this.onRegionSearchValueChanges();
    // this.onJrRegionSearchValueChanges();
    // this.onCitySearchValueChanges();
    // this.onJrCitySearchValueChanges();
  }

  get regNumberName(){
    if(+this.formBaseInformation.get('jr_country_id').value==1)
      if(this.formBaseInformation.get('type').value=='entity') return 'ogrn'; else return 'ogrnip';
    else return 'reg_number';
  }

  get tinName(){ // TIN, Tax ID, ИНН, VAT e.t.c
    // if([47,212].includes(+this.formBaseInformation.get('jr_country_id').value)) // if not USA or US virgin lands
    //   return 'tax_id'; 
    if([17,185].includes(+this.formBaseInformation.get('jr_country_id').value)) // if Montenegro
        return 'pib';
    else return 'tin';
  }

  get vatName(){
    if([47,212].includes(+this.formBaseInformation.get('jr_country_id').value)) // if USA or US virgin lands
      return 'tax_id'; 
    if([17,185].includes(+this.formBaseInformation.get('jr_country_id').value)) // if Montenegro, Serbia
      return 'pdv';
    else return 'vat';
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=3')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyCompanyId();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
                );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==3)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==3)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==6)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==5)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==8)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==7)});
    
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('id').value==this.myCompanyId);
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));

    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!

    return true;
  }
  
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
//  -------------     ***** поиск по подстроке для контрагента ***    --------------------------
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
  onSelectCagent(id:any,name:string){
    this.formBaseInformation.get('store_default_customer_id').setValue(+id);}
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('store_default_customer_id').setValue(null);
  }}
  getCagentsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canCagentAutocompleteQuery && this.searchCagentCtrl.value.length>1){
        const body = {
          "searchString":this.searchCagentCtrl.value,
          "companyId":this.formBaseInformation.get('id').value};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {
    return [];}}
//  -------------     ***** конец поиска по подстроке для контрагента ***    --------------------------
//  -------------     ***** поиск по подстроке для создателя заказов ***    --------------------------
onDefaultCreatorSearchValueChanges(){
  this.searchDefaultCreatorCtrl.valueChanges
  .pipe(
    debounceTime(500),
    tap(() => {
      this.filteredDefaultCreators = [];}),       
    switchMap(fieldObject =>  
      this.getDefaultCreatorsList()))
  .subscribe(data => {
    this.isDefaultCreatorListLoading = false;
    if (data == undefined) {
      this.filteredDefaultCreators = [];
    } else {
      this.filteredDefaultCreators = data as any;
  }});}
  onSelectDefaultCreator(id:any,name:string){
    this.formBaseInformation.get('store_default_creator_id').setValue(+id);}
  checkEmptyDefaultCreatorField(){
    if(this.searchDefaultCreatorCtrl.value.length==0){
      this.formBaseInformation.get('store_default_creator_id').setValue(null);
  }}
  getDefaultCreatorsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canDefaultCreatorAutocompleteQuery && this.searchDefaultCreatorCtrl.value.length>1){
        this.isDefaultCreatorListLoading  = true;
        return this.http.get('/api/auth/getUsersList?company_id='+this.formBaseInformation.get('id').value+'&search_string='+this.searchDefaultCreatorCtrl.value);
      }else return [];
    } catch (e) {
    return [];}}
//  -------------     ***** конец поиска по подстроке для создателя заказов ***    --------------------------
  getData(){
      if(+this.id>0){
        this.getDocumentValuesById();
      }else {
        this.refreshPermissions();
      }
  }
  // getCurrencyList(){
  //   // console.log("getCurrencyList");
  //   this.receivedCurrencyList=null;
  //   this.http.get('/api/auth/getSpravSysCurrency')
  //           .subscribe(
  //               (data) => {this.receivedCurrencyList=data as any [];
  //                 // console.log("receivedCurrencyList-"+this.receivedCurrencyList);
  //                 this.setDefaultCurrency()},
  //               error => console.log(error)
  //           );
  // }
  // setDefaultCurrency(){
  //   if(this.receivedCurrencyList.length>0 && +this.id==0)
  //   {
  //     this.formBaseInformation.get('currency_id').setValue(this.receivedCurrencyList[0].id);
  //   }
  // }

  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getCRUD_rights();
  }

  getSpravSysOPF(){
    this.receivedSpravSysOPF=null;
    this.loadSpravService.getSpravSysOPF()
            .subscribe(
                (data) => { this.receivedSpravSysOPF=data as any [];},
                error => console.log(error)
            );
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.http.post('/api/auth/getCompanyValues', docId)
        .subscribe(
            data => { 
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                //!!!
                if(data!=null){
                  this.formAboutDocument.get('id').setValue(+documentValues.id);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.formBaseInformation.get('company').setValue(documentValues.company);
                  // this.formBaseInformation.get('opf_id').setValue(+documentValues.opf_id);
                  this.formBaseInformation.get('opf').setValue(documentValues.opf);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('code').setValue(documentValues.code);
                  this.formBaseInformation.get('telephone').setValue(documentValues.telephone);
                  this.formBaseInformation.get('site').setValue(documentValues.site);
                  this.formBaseInformation.get('email').setValue(documentValues.email);
                  this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code);
                  this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
                  this.formBaseInformation.get('country').setValue(documentValues.country);
                  // this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
                  // this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
                  this.formBaseInformation.get('region').setValue(documentValues.region);
                  this.formBaseInformation.get('city').setValue(documentValues.city);
                  this.formBaseInformation.get('street').setValue(documentValues.street);
                  this.formBaseInformation.get('home').setValue(documentValues.home);
                  this.formBaseInformation.get('flat').setValue(documentValues.flat);
                  this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('jr_jur_full_name').setValue(documentValues.jr_jur_full_name);
                  this.formBaseInformation.get('jr_jur_kpp').setValue(documentValues.jr_jur_kpp);
                  this.formBaseInformation.get('jr_jur_ogrn').setValue(documentValues.jr_jur_ogrn);
                  this.formBaseInformation.get('jr_zip_code').setValue(documentValues.jr_zip_code);
                  this.formBaseInformation.get('jr_country_id').setValue(documentValues.jr_country_id);
                  this.formBaseInformation.get('jr_country').setValue(documentValues.jr_country);
                  // this.formBaseInformation.get('jr_region_id').setValue(documentValues.jr_region_id);
                  // this.formBaseInformation.get('jr_city_id').setValue(documentValues.jr_city_id);                  
                  this.formBaseInformation.get('jr_region').setValue(documentValues.jr_region);
                  this.formBaseInformation.get('jr_city').setValue(documentValues.jr_city);
                  this.formBaseInformation.get('jr_street').setValue(documentValues.jr_street);
                  this.formBaseInformation.get('jr_home').setValue(documentValues.jr_home);
                  this.formBaseInformation.get('jr_flat').setValue(documentValues.jr_flat);
                  this.formBaseInformation.get('jr_additional_address').setValue(documentValues.jr_additional_address);
                  this.formBaseInformation.get('jr_inn').setValue(documentValues.jr_inn);
                  this.formBaseInformation.get('jr_vat').setValue(documentValues.jr_vat);
                  this.formBaseInformation.get('jr_okpo').setValue(documentValues.jr_okpo);
                  this.formBaseInformation.get('jr_fio_family').setValue(documentValues.jr_fio_family);
                  this.formBaseInformation.get('jr_fio_name').setValue(documentValues.jr_fio_name);
                  this.formBaseInformation.get('jr_fio_otchestvo').setValue(documentValues.jr_fio_otchestvo);
                  this.formBaseInformation.get('jr_ip_ogrnip').setValue(documentValues.jr_ip_ogrnip);
                  this.formBaseInformation.get('jr_ip_svid_num').setValue(documentValues.jr_ip_svid_num);
                  this.formBaseInformation.get('jr_ip_reg_date').setValue(documentValues.jr_ip_reg_date?moment(documentValues.jr_ip_reg_date,'DD.MM.YYYY'):"");
                  // this.formBaseInformation.get('currency_id').setValue(documentValues.currency_id);
                  this.formBaseInformation.get('nds_payer').setValue(documentValues.nds_payer);
                  this.formBaseInformation.get('fio_director').setValue(documentValues.fio_director);
                  this.formBaseInformation.get('director_position').setValue(documentValues.director_position);
                  this.formBaseInformation.get('fio_glavbuh').setValue(documentValues.fio_glavbuh);
                  this.formBaseInformation.get('director_signature_id').setValue(documentValues.director_signature_id);
                  this.formBaseInformation.get('glavbuh_signature_id').setValue(documentValues.glavbuh_signature_id);
                  this.formBaseInformation.get('stamp_id').setValue(documentValues.stamp_id);
                  this.formBaseInformation.get('card_template_id').setValue(documentValues.card_template_id);
                  this.formBaseInformation.get('card_template_original_filename').setValue(this.formBaseInformation.get('card_template_id').value?documentValues.card_template_original_filename:translate('docs.msg.file_slctd_no'));
                  this.formBaseInformation.get('card_template_filename').setValue(documentValues.card_template_filename);
                  this.formBaseInformation.get('director_signature_filename').setValue(this.formBaseInformation.get('director_signature_id').value?documentValues.director_signature_filename:translate('docs.msg.file_slctd_no'));
                  this.formBaseInformation.get('stamp_filename').setValue(this.formBaseInformation.get('stamp_id').value?documentValues.stamp_filename:translate('docs.msg.file_slctd_no'));
                  this.formBaseInformation.get('glavbuh_signature_filename').setValue(this.formBaseInformation.get('glavbuh_signature_id').value?documentValues.glavbuh_signature_filename:translate('docs.msg.file_slctd_no'));
                  this.formBaseInformation.get('st_prefix_barcode_pieced').setValue(documentValues.st_prefix_barcode_pieced);
                  this.formBaseInformation.get('st_prefix_barcode_packed').setValue(documentValues.st_prefix_barcode_packed);
                  this.formBaseInformation.get('st_netcost_policy').setValue(documentValues.st_netcost_policy);                  
                  this.formBaseInformation.get('type').setValue(documentValues.type);
                  this.formBaseInformation.get('legal_form').setValue(documentValues.legal_form);                   
                  this.formBaseInformation.get('nds_included').setValue(documentValues.nds_included);
                  /*                 
                  this.formBaseInformation.get('is_store').setValue(documentValues.is_store);
                  this.formBaseInformation.get('store_site_address').setValue(documentValues.store_site_address);
                  this.formBaseInformation.get('store_key').setValue(documentValues.store_key);
                  this.formBaseInformation.get('store_secret').setValue(documentValues.store_secret);
                  this.formBaseInformation.get('store_type').setValue(documentValues.store_type);
                  this.formBaseInformation.get('store_api_version').setValue(documentValues.store_api_version);
                  this.formBaseInformation.get('crm_secret_key').setValue(documentValues.crm_secret_key);
                  this.formBaseInformation.get('store_price_type_regular').setValue(documentValues.store_price_type_regular);
                  this.formBaseInformation.get('store_price_type_sale').setValue(documentValues.store_price_type_sale);
                  this.formBaseInformation.get('store_orders_department_id').setValue(documentValues.store_orders_department_id);
                  this.formBaseInformation.get('store_if_customer_not_found').setValue(documentValues.store_if_customer_not_found);
                  this.formBaseInformation.get('store_default_creator_id').setValue(documentValues.store_default_creator_id);
                  this.formBaseInformation.get('store_days_for_esd').setValue(documentValues.store_days_for_esd);         
                  this.formBaseInformation.get('store_auto_reserve').setValue(documentValues.store_auto_reserve);    
                  this.formBaseInformation.get('companyStoreDepartments').setValue(documentValues.companyStoreDepartments);    
                  this.formBaseInformation.get('store_ip').setValue(documentValues.store_ip);       
                  this.searchCagentCtrl.setValue(documentValues.cagent);       
                  this.searchDefaultCreatorCtrl.setValue(documentValues.store_default_creator);
                  */
                  this.formBaseInformation.get('store_default_lang_code').setValue(documentValues.store_default_lang_code); 

                  

                  this.searchRegionCtrl.setValue(documentValues.region);
                  this.searchJrRegionCtrl.setValue(documentValues.jr_region);
                  this.area=documentValues.area;
                  this.jr_area=documentValues.jr_area;
                  this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
                  this.searchJrCityCtrl.setValue(this.jr_area!=''?(documentValues.jr_city+' ('+this.jr_area+')'):documentValues.jr_city);
                  
                  // this.getStatusesList();
                  this.getCompaniesPaymentAccounts();
                  this.loadFilesInfo();
                  this.getPriceTypesList();
                  this.getDepartmentsList();                  
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
    this.oneClickSaveControl=true;
    this.http.post('/api/auth/insertCompany', this.formBaseInformation.value)
    .subscribe(
    (data) =>   {
      let result=data as any;
          switch(result){
            case  null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case  -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
            default:{  
              this.id=data as number;
              this._router.navigate(['/ui/companiesdoc', this.id]);
              this.formBaseInformation.get('id').setValue(this.id);
              this.getBaseData('reloadCompaniesList');  
              this.getPriceTypesList();
              this.rightsDefined=false; //!!!
              this.getData();
              this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
        }
      }
      this.oneClickSaveControl=false;
    },
    error => {this.oneClickSaveControl=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
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
    this.oneClickSaveControl=true;
    return this.http.post('/api/auth/updateCompany', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось создать документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              default:{// Успешно
                this.getData();
                this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
              }
            }   
            
          this.oneClickSaveControl=false;               
          },
          error => {this.oneClickSaveControl=false; console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }

  getPriceTypesList(){
    this.receivedPriceTypesList=[];
    this.loadSpravService.getPriceTypesList(this.id)
      .subscribe(
          (data) => {this.receivedPriceTypesList=data as any [];
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});}
      );
  }

  getDepartmentsList(){
    this.loadSpravService.getDepartmentsList(this.id).subscribe(
        (data) => {this.receivedDepartmentsList=data as any []},
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});}
    );
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndColon(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46 && charCode!=58)) { return false; } return true;}
  lettersOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    console.log('charCode = ' + charCode);
    if ((charCode >= 65 && charCode <= 90)||(charCode >= 97 && charCode <= 122)) { return true; } return false;}
  
  generateCrmSecretKey(){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head:translate('docs.msg.attention'),
          query: translate('docs.msg.gen_new_skey'),
          warning: translate('docs.msg.gen_new_skey_'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1) this.formBaseInformation.get('crm_secret_key').setValue(uuidv4());
      });
  }
  // getDomain(): string{
  //   return(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: ''));
  // }
  copyKeyToClipboard(){
    // let domain=this.getDomain();
    // navigator.clipboard.writeText(this.getDomain()+'/api/public/getFile/'+this.formBaseInformation.get('name').value);
    navigator.clipboard.writeText(this.formBaseInformation.get('crm_secret_key').value);
  }
//*****************************************************************************************************************************************/
//*******************************           В Ы Б О Р  С Т Р А Н Ы,  Р А Й О Н А, Г О Р О Д А       ***************************************/
//*****************************************************************************************************************************************/
   //фильтрация при каждом изменении в поле Часовой пояс
   private filter_country(value: string): IdAndName_ru[] {
    const filterValue = value.toLowerCase();
    return this.spravSysCountries.filter(option => option.name_ru.toLowerCase().includes(filterValue));
  }  
  private filter_jr_country(value: string): IdAndName_ru[] {
    const filterValue = value.toLowerCase();
    return this.spravSysCountries.filter(option => option.name_ru.toLowerCase().includes(filterValue));
  }  
  getSpravSysCountries():void {    
    this.http.post('/api/auth/getSpravSysCountries', {})  // 
    .subscribe((data) => {
      this.spravSysCountries = data as IdAndName_ru[];
      // this.spravSysJrCountries = data as IdAndName[];
    this.updateValuesSpravSysCountries(); },
    error => console.log(error));
    }
  //если значение уже выбрано (id загрузилось), надо из массива объектов найти имя, соответствующее этому id 
  updateValuesSpravSysCountries(){
    // для страны 
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
      //для страны в юр. адресе
    if(+this.formBaseInformation.get('jr_country_id').value!=0)
      {
        this.spravSysCountries.forEach(x => {
          if(x.id==this.formBaseInformation.get('jr_country_id').value){
            this.formBaseInformation.get('jr_country').setValue(x.name_ru);
          }
        })
      } 
      else //иначе обнулить поля id и имени. Без этого при установке курсора в поле список выскакивать не будет (х.з. почему так)
      {
        this.formBaseInformation.get('jr_country').setValue('');
        this.formBaseInformation.get('jr_country_id').setValue('');
      }
  }
  //вызывается из html. необходима для сброса уже имеющегося значения. когда имя стирается, в id установится 0 
  checkEmptyListField(field:string){
    if( this.formBaseInformation.get(field).value.length==0){
      this.formBaseInformation.get(field+'_id').setValue(null);
    }
  }
  copyfromJurAddressToAddress(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.addr_copy'),
        query: translate('docs.msg.addr_copy_qj'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.formBaseInformation.get('zip_code').setValue(this.formBaseInformation.get('jr_zip_code').value);
        this.formBaseInformation.get('country_id').setValue(this.formBaseInformation.get('jr_country_id').value);
        this.formBaseInformation.get('country').setValue(this.formBaseInformation.get('jr_country').value);
        // this.formBaseInformation.get('region_id').setValue(this.formBaseInformation.get('jr_region_id').value);        
        this.formBaseInformation.get('region').setValue(this.formBaseInformation.get('jr_region').value);
        this.searchRegionCtrl.setValue(this.searchJrRegionCtrl.value);
        // this.formBaseInformation.get('city_id').setValue(this.formBaseInformation.get('jr_city_id').value);
        this.formBaseInformation.get('city').setValue(this.formBaseInformation.get('jr_city').value);
        this.searchCityCtrl.setValue(this.searchJrCityCtrl.value);
        this.formBaseInformation.get('street').setValue(this.formBaseInformation.get('jr_street').value);
        this.formBaseInformation.get('home').setValue(this.formBaseInformation.get('jr_home').value);
        this.formBaseInformation.get('flat').setValue(this.formBaseInformation.get('jr_flat').value);
        this.formBaseInformation.get('additional_address').setValue(this.formBaseInformation.get('jr_additional_address').value);
      }});
  }
  copyfromAddressToJurAddress(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.addr_copy'),
        query: translate('docs.msg.addr_copy_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.formBaseInformation.get('jr_zip_code').setValue(this.formBaseInformation.get('zip_code').value);
        this.formBaseInformation.get('jr_country_id').setValue(this.formBaseInformation.get('country_id').value);
        this.formBaseInformation.get('jr_country').setValue(this.formBaseInformation.get('country').value);
        // this.formBaseInformation.get('jr_region_id').setValue(this.formBaseInformation.get('region_id').value);
        this.formBaseInformation.get('jr_region').setValue(this.formBaseInformation.get('region').value);
        this.searchJrRegionCtrl.setValue(this.searchRegionCtrl.value);
        // this.formBaseInformation.get('jr_city_id').setValue(this.formBaseInformation.get('city_id').value);
        this.formBaseInformation.get('jr_city').setValue(this.formBaseInformation.get('city').value);
        this.searchJrCityCtrl.setValue(this.searchCityCtrl.value);
        this.formBaseInformation.get('jr_street').setValue(this.formBaseInformation.get('street').value);
        this.formBaseInformation.get('jr_home').setValue(this.formBaseInformation.get('home').value);
        this.formBaseInformation.get('jr_flat').setValue(this.formBaseInformation.get('flat').value);
        this.formBaseInformation.get('jr_additional_address').setValue(this.formBaseInformation.get('additional_address').value);
      }});
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
  //     this.formBaseInformation.get('region_id').setValue();
  //     // this.formBaseInformation.get('city_id').setValue(null);
  //     // this.searchCityCtrl.setValue('');
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
  //--------------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Региона в юр. адресе  ***    --------------------------
  // onJrRegionSearchValueChanges(){
  //   this.searchJrRegionCtrl.valueChanges
  //   .pipe( 
  //     debounceTime(500),
  //     tap(() => {
  //       this.filteredJrRegions = [];}),       
  //     switchMap(fieldObject =>  
  //       this.getSpravSysJrRegions()))
  //   .subscribe(data => {
  //     this.isJrRegionListLoading = false;
  //     if (data == undefined) {
  //       this.filteredJrRegions = [];
  //     } else {
  //       this.filteredJrRegions = data as Region[];
  // }});}
  // onSelectJrRegion(id:number,country_id:number,country:string){
  //   this.formBaseInformation.get('jr_region_id').setValue(+id);
  //   //если выбрали регион, а страна не выбрана
  //   if((this.formBaseInformation.get('jr_country_id').value==null || this.formBaseInformation.get('jr_country_id').value=='') && country_id>0){
  //     this.formBaseInformation.get('jr_country_id').setValue(country_id);
  //     this.formBaseInformation.get('jr_country').setValue(country);
  //   }
  // }
  // checkEmptyJrRegionField(){
  //   if(this.searchJrRegionCtrl.value.length==0){
  //     this.formBaseInformation.get('jr_region_id').setValue();
  //     // this.formBaseInformation.get('jr_city_id').setValue(null);
  //     // this.searchJrCityCtrl.setValue('');
  // }};     
  // getSpravSysJrRegions(){ //заполнение Autocomplete
  //   try {
  //     if(this.canJrRegionAutocompleteQuery && this.searchJrRegionCtrl.value.length>1){
  //   // console.log(111);

  //       const body = {
  //         "searchString":this.searchJrRegionCtrl.value,
  //         "id":this.formBaseInformation.get('jr_country_id').value};
  //         console.log(222);
  //       this.isJrRegionListLoading  = true;
        
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

  //--------------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Города в юр. адресе  ***    --------------------------
  // onJrCitySearchValueChanges(){
  //   this.searchJrCityCtrl.valueChanges
  //   .pipe( 
  //     debounceTime(500),
  //     tap(() => {
  //       this.filteredJrCities = [];}),       
  //     switchMap(fieldObject =>  
  //       this.getSpravSysJrCities()))
  //   .subscribe(data => {
  //     this.isJrCityListLoading = false;
  //     if (data == undefined) {
  //       this.filteredJrCities = [];
  //     } else {
  //       this.filteredJrCities = data as City[];
  // }});}
  // onSelectJrCity(id:any,jr_area:string,region_id:number,region:string,country_id:number,country:string){
  //   this.formBaseInformation.get('jr_city_id').setValue(+id);
  //   this.jr_area=jr_area;
  //   if(jr_area!=''){
  //     setTimeout(()=> {
  //       this.searchJrCityCtrl.setValue(this.searchJrCityCtrl.value+' ('+jr_area+')'); 
  //     },200); 
  //   }//если выбрали город, а регион не выбран
  //   if((this.formBaseInformation.get('jr_region_id').value==null || this.formBaseInformation.get('jr_region_id').value=='') && region_id>0){//если у города есть регион и он не выбран - устанавливаем регион
  //     this.formBaseInformation.get('jr_region_id').setValue(region_id);
  //     this.searchJrRegionCtrl.setValue(region);
  //   }//если выбрали регион, а страна не выбрана
  //   if((this.formBaseInformation.get('jr_country_id').value==null || this.formBaseInformation.get('jr_country_id').value=='') && country_id>0){//если у города есть страна и она не выбрана - устанавливаем страну
  //     this.formBaseInformation.get('jr_country_id').setValue(country_id);
  //     this.formBaseInformation.get('jr_country').setValue(country);
  //   }
  // }
  // checkEmptyJrCityField(){
  //   if(this.searchJrCityCtrl.value.length==0){
  //     this.formBaseInformation.get('jr_city_id').setValue(null);
  //     this.jr_area='';
  // }};     
  // getSpravSysJrCities(){ //заполнение Autocomplete
  //   try {
  //     if(this.canJrCityAutocompleteQuery && this.searchJrCityCtrl.value.length>1){
  //       const body = {
  //         "searchString":this.searchJrCityCtrl.value,
  //         "id":this.formBaseInformation.get('jr_country_id').value,
  //         "id2":this.formBaseInformation.get('jr_region_id').value}
  //       this.isJrCityListLoading  = true;
  //       return this.http.post('/api/auth/getSpravSysCities', body);
  //     }else return [];
  //   } catch (e) {
  //     return [];}}    
  //------------------------------С Т А Т У С Ы- в предприятиях не делаем, т.к. должен быть один набор статусов на документ (т.е. на ВСЕ предприятия), 
  // но статусы создаются в разрезе предприятий, и для каждого предприятия будут разные наборы статусов, что нелогично------------------------
  // getStatusesList(){
  //   this.receivedStatusesList=null;
  //   this.loadSpravService.getStatusList(this.formBaseInformation.get('id').value,3) //3 - id документа из таблицы documents
  //           .subscribe(
  //               (data) => {this.receivedStatusesList=data as statusInterface[];
  //                 if(this.id==0){this.refreshPermissions();;}
  //                 this.setStatusColor();},
  //               error => console.log(error)
  //           );
  // }
  // setDefaultStatus(){
  //   if(this.receivedStatusesList.length>0)
  //   {
  //     this.receivedStatusesList.forEach(a=>{
  //         if(a.is_default){
  //           this.formBaseInformation.get('status_id').setValue(a.id);
  //         }
  //     });
  //   }
  //   this.refreshPermissions();
  // }
  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  // setStatusColor():void{
  //   this.receivedStatusesList.forEach(m=>
  //     {
  //       if(m.id==+this.formBaseInformation.get('status_id').value){
  //         this.status_color=m.color;
  //       }
  //     });
  //     console.log(' this.status_color = '+ this.status_color);
  // }

//-------------------------- Б А Н К О В С К И Е   Р Е К В И З И Т Ы  -------------------------------
  getCompaniesPaymentAccounts(){
    let resultContainer: any[];
    return this.http.get('/api/auth/getCompaniesPaymentAccounts?id='+this.id).subscribe(
        (data) => { resultContainer=data as any [];
                    this.fillPaymentAccountsArray(resultContainer);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  fillPaymentAccountsArray(arr: any[]){
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
      id: m.id,
      bik: new UntypedFormControl (m.bik,[]),
      name:  new UntypedFormControl (m.name,[]),
      address:  new UntypedFormControl (m.address,[]),
      payment_account:  new UntypedFormControl (m.payment_account,[]),
      corr_account:  new UntypedFormControl (m.corr_account,[]),
      intermediatery:  new UntypedFormControl (m.intermediatery,[]),
      swift:  new UntypedFormControl (m.swift,[]),
      iban:  new UntypedFormControl (m.iban,[]),
      output_order: this.getPaymentAccountsOutputOrder()
      }))
    })
  }
  addNewPaymentAccount() {
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as UntypedFormArray;
    add.push(this._fb.group({
      id: [],
      bik: new UntypedFormControl ('',[]),
      name:  new UntypedFormControl ('',[]),
      address:  new UntypedFormControl ('',[]),
      payment_account:  new UntypedFormControl ('',[]),
      corr_account:  new UntypedFormControl ('',[]),
      intermediatery:  new UntypedFormControl ('',[]),
      swift:  new UntypedFormControl ('',[]),
      iban:  new UntypedFormControl ('',[]),
      output_order: this.getPaymentAccountsOutputOrder()
    }))
  }
  deletePaymentAccount(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_acc'),
        query: translate('docs.msg.del_acc_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as UntypedFormArray;
    add.removeAt(index);
    this.setPaymentAccountsOutputOrders();
      }
    });    
  }
  dropPaymentAccount(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании контакта
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: any[] = [];
    this.formBaseInformation.get('companiesPaymentAccountsTable').controls.forEach(m =>{
                      resultContainer.push({
                        id: m.get('id').value,
                        bik: m.get('bik').value,
                        name: m.get('name').value,
                        address: m.get('address').value,
                        payment_account: m.get('payment_account').value,
                        corr_account: m.get('corr_account').value,
                        output_order: m.get('output_order').value,
                        intermediatery:  m.get('intermediatery').value,
                        swift:  m.get('swift').value,
                        iban:  m.get('iban').value,
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillPaymentAccountsArray(resultContainer);
    this.setPaymentAccountsOutputOrders();//после того как переставили контакты местами - нужно обновить их очередность вывода (output_order)
  }
  getPaymentAccountsOutputOrder(){//генерирует очередность для нового контакта
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as UntypedFormArray; 
    return (add.length+1);
  }
  setPaymentAccountsOutputOrders(){//заново переустанавливает очередность у всех контактов (при перетаскивании)
    let i:number=1;
    this.formBaseInformation.get('companiesPaymentAccountsTable').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

//*****************************************************************************************************************************************/
//*******************************************************       Ф  А  Й  Л  Ы       *******************************************************/
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
        companyId: this.formBaseInformation.get('id').value
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result)this.addFilesToCompany(result);
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
  addFileInField(option:string) {
    const dialogRef = this.dialogAddFiles.open(FilesComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'select',
        companyId: this.formBaseInformation.get('id').value
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result){
        switch(option) {
          case 'director':
            this.formBaseInformation.get('director_signature_id').setValue(result[0]);
            this.formBaseInformation.get('director_signature_filename').setValue(translate('docs.msg.file_slctd'));
            break;
          case 'glavbuh':
            this.formBaseInformation.get('glavbuh_signature_id').setValue(result[0]);
            this.formBaseInformation.get('glavbuh_signature_filename').setValue(translate('docs.msg.file_slctd'));
            break;
          case 'stamp':
            this.formBaseInformation.get('stamp_id').setValue(result[0]);
            this.formBaseInformation.get('stamp_filename').setValue(translate('docs.msg.file_slctd'));
            break;
          case 'card_template':
            this.formBaseInformation.get('card_template_id').setValue(result[0]);
            this.formBaseInformation.get('card_template_original_filename').setValue(translate('docs.msg.file_slctd'));
        }
      };
    });
  }
  deleteFileInField(option:string) {
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
      if(result==1){
        switch(option) {
          case 'director':
            this.formBaseInformation.get('director_signature_id').setValue();
            this.formBaseInformation.get('director_signature_filename').setValue(translate('docs.msg.file_slctd_no'));
            break;
          case 'glavbuh':
            this.formBaseInformation.get('glavbuh_signature_id').setValue();
            this.formBaseInformation.get('glavbuh_signature_filename').setValue(translate('docs.msg.file_slctd_no'));
            break;
          case 'stamp':
            this.formBaseInformation.get('stamp_id').setValue();
            this.formBaseInformation.get('stamp_filename').setValue(translate('docs.msg.file_slctd_no'));
            break;
          case 'card_template':
            this.formBaseInformation.get('card_template_id').setValue();
            this.formBaseInformation.get('card_template_filename').setValue("");
            this.formBaseInformation.get('card_template_original_filename').setValue(translate('docs.msg.file_slctd_no'));
        }
      }
    });
  }
  addFilesToCompany(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id предприятия и id файлов 
            return this.http.post('/api/auth/addFilesToCompany', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar(translate('docs.msg.files_added'), translate('docs.msg.close'));
                    this.loadFilesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
  }
  loadFilesInfo(){// загружает информацию по прикрепленным файлам
    const body = {"id":this.id};
          return this.http.post('/api/auth/getListOfCompanyFiles', body) 
            .subscribe(
                (data) => {  
                            this.filesInfo = data as any[]; 
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
    return this.http.post('/api/auth/deleteCompanyFile',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.loadFilesInfo();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }

  // при нажатии на кнопку Скачать
  getCompanyCard(filename: string = null): void{
    const baseUrl = '/api/auth/getCompanyCard/'+this.formBaseInformation.get('card_template_filename').value;
    console.log("baseUrl - "+baseUrl);
    this.http.get(baseUrl,{ responseType: 'blob' as 'json'}).subscribe(
      (response: any) =>{
          let dataType = response.type;
          let binaryData = [];
          binaryData.push(response);
          let downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
          if (filename)
              downloadLink.setAttribute('download', translate('docs.msg.comp_card')+'.docx');
          document.body.appendChild(downloadLink);
          downloadLink.click();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }
  changeNetcostPolicyAttention(){
    if(this.formBaseInformation.get('st_netcost_policy').value=='each'){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head:translate('docs.msg.attention'),
          query: translate('docs.msg.pol_change'),/* Последующий возврат данной политики обратно на "По всему предприятию" не повлечёт за собой уравнивания средней себестоимости. */
          warning: translate('docs.msg.pol_change_'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(!(result==1)) this.formBaseInformation.get('st_netcost_policy').setValue('all');
      }); 
    }
    
  }
}
