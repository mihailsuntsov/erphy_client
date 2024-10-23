import { Component, OnInit , Inject, Optional, Output, EventEmitter, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { ContactsComponent } from 'src/app/modules/other/contacts/contacts.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
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
import { Contact } from 'src/app/modules/other/contacts/contacts.component'
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();
// import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageUploaderComponent } from 'src/app/modules/other/image-uploader/image-uploader.component';

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
  logo_id: number;
  logo_file_name: string;
  is_business_card: boolean;
  is_online_booking: boolean;

  //Settings
  st_prefix_barcode_pieced: number;// prefix of barcode for pieced product
  st_prefix_barcode_packed: number;// prefix of barcode for packed product
  st_netcost_policy: string;       // policy of netcost calculation by all company or by each department separately
  booking_doc_name_variation_id:number; // variation's id of name of booking document: 1-appointment, 2-reservation
  nds_included: boolean;                // used with nds_payer as default values for Customers orders fields "Tax" and "Tax included"
  time_zone_id: number;                 // id of company's time zone

  store_default_lang_code: string;      // internet-store basic language, e.g. EN, RU, UA, ...

 

  // settings for online cheduling page/frame
  fld_step: number;
  fld_max_amount_services: number;
  fld_locale_id: number;
  fld_time_format: string;
  fld_duration: string;
  fld_predefined_duration: number;
  fld_predefined_duration_unit_id: number;
  fld_tel_prefix: string;
  fld_ask_telephone: boolean;
  fld_ask_email: boolean;
  fld_url_slug: string;
  txt_btn_select_time: string;
  txt_btn_select_specialist: string;
  txt_btn_select_services: string;
  txt_summary_header: string;
  txt_summary_date: string;
  txt_summary_time_start: string;
  txt_summary_time_end: string;
  txt_summary_duration: string;
  txt_summary_specialist: string;
  txt_summary_services: string;
  txt_btn_create_order: string;
  txt_btn_send_order: string;
  txt_msg_send_successful: string;
  txt_msg_send_error: string;
  txt_msg_time_not_enable: string;
  txt_fld_your_name: string;
  txt_fld_your_tel: string;
  txt_fld_your_email: string;
  stl_color_buttons: string;
  stl_color_buttons_text: string;
  stl_color_text: string;
  stl_corner_radius: string;
  stl_font_family: string;
  // fld_privce_type_id: number;
  fld_creator_id: number;
  txt_any_specialist: string;
  txt_hour: string;
  txt_minute: string;
  txt_nearest_app_time: string;
  txt_today: string;
  txt_tomorrow: string;
  txt_morning: string;
  txt_day: string;
  txt_evening: string;
  txt_night: string;
  stl_background_color: string;
  stl_panel_color: string;
  stl_panel_max_width: number;
  stl_panel_max_width_unit: string;
  stl_not_selected_elements_color: string;
  stl_selected_elements_color: string;
  stl_job_title_color: string;
  fld_creator: string;
  onlineSchedulingLanguagesList: OnlineSchedulingLanguage[];
  onlineSchedulingFieldsTranslations: OnlineSchedulingFieldsTranslation[];
  onlineSchedulingContactsList: Contact[];
}
interface OnlineSchedulingFieldsTranslation{
  langCode: string;
  txt_btn_select_time: string;
  txt_btn_select_specialist: string;
  txt_btn_select_services: string;
  txt_summary_header: string;
  txt_summary_date: string;
  txt_summary_time_start: string;
  txt_summary_time_end: string;
  txt_summary_duration: string;
  txt_summary_specialist: string;
  txt_summary_services: string; 
  txt_btn_create_order: string;
  txt_btn_send_order: string;
  txt_msg_send_successful: string;
  txt_msg_send_error: string;
  txt_msg_time_not_enable: string;
  txt_fld_your_name: string;
  txt_fld_your_tel: string;
  txt_fld_your_email: string;
  txt_any_specialist: string;
  txt_hour: string;
  txt_minute: string;
  txt_nearest_app_time: string;
  txt_today: string;
  txt_tomorrow: string;
  txt_morning: string;
  txt_day: string;
  txt_evening: string;
  txt_night: string;
}

interface OnlineSchedulingLanguage{
  id: number;
  suffix: string;
  name: string;
  fileName: string;
}
// interface Contact{
//   id: number;
//   company_id: number;
//   additional: string;     // eg. "Sales manager telephone"
//   contact_type: string;   //instagram/youtube/email/telephone
//   contact_value: string;  //  eg. https://www.instagram.com/msuntsov
//   display_in_os: boolean;  // 
//   location_os: string;    // where display this contact in Online scheduling - vertical list or horizontal icons
//   output_order: number;
// }
interface IdAndName{
  id: number;
  name: string;
}
interface IdAndName_ru{
  id: number;
  name_ru: string;
}
interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
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
  providers: [LoadSpravService, ContactsComponent,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class CompaniesDocComponent implements OnInit {
  // name = 'Angular';
  imageChangedEvent: any = '';
  logoImage: any = '';





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
  // searchRegionCtrl = new UntypedFormControl();//поле для поиска
  // isRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  // canRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  // filteredRegions: Region[];//массив для загрузки найденных по подстроке регионов
  // searchJrRegionCtrl = new UntypedFormControl();//поле для поиска
  // isJrRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  // canJrRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  // filteredJrRegions: Region[];//массив для загрузки найденных по подстроке регионов
  // Города
  //для поиска района по подстроке
  // searchCityCtrl = new UntypedFormControl();//поле для поиска
  // isCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  // canCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  // filteredCities: City[];//массив для загрузки найденных по подстроке городов
  // searchJrCityCtrl = new UntypedFormControl();//поле для поиска
  // isJrCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  // canJrCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  // filteredJrCities: City[];//массив для загрузки найденных по подстроке городов
  spravSysTimeZones: IdAndName[] = [];// массив, куда будут грузиться все зоны
  filteredSpravSysTimeZones: Observable<IdAndName[]>; // here will be filtered time zones for showing in select list
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
  suffix:string = "en"; // суффикс 
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
  imageBlob: any = ''; // Logo of company

  // Fields Translations variables
  onlineSchedulingDefaultLanguage: string = ''; // default language from Company settings ( like EN )
  onlineSchedulingFieldsTranslations: OnlineSchedulingFieldsTranslation[]=[]; // the list of translated product's data
  onlineSchedulingTranslationModeOn = false; // translation mode ON
  // list of languages with which thу online sceduling form will be accessible
  // onlineSchedulingFieldsLanguagesList: OnlineSchedulingLanguage[]=[]; // the array of languages from all onlineSchedulings like ["EN","RU", ...]
  // onlineSchedulingContactsList: Contact[]=[]; // the array of contacts
  spravSysEdizmOfProductTime: any[]=[];//  units of measurement of time
  spravSysLocales  : IdAndName[] = [];                // here will be loaded all locales
  showLanguagesFormFields:boolean = false;
  displayedLanguagesColumns: string[]=[];//array of displayed columns of the table with languages
  formLanguageAdding:any;//
  @ViewChild('langSuffixInput') langSuffixInput;

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
  @ViewChild(ContactsComponent, {static: false}) public contactsComponent:ContactsComponent;

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
  private imageUploaderComponent: MatDialog,
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
      booking_doc_name_variation_id:  new UntypedFormControl      (1,[]),
      time_zone_id:  new UntypedFormControl       (21,[]), // 21 is UTC (GMT+0) time zone
      timeZoneName: new UntypedFormControl      ('',[]),
      store_default_lang_code:     new UntypedFormControl   ('EN',[Validators.required, Validators.minLength(2),Validators.maxLength(2)]),
      logo_id:  new UntypedFormControl      (null,[]),
      logo_file_name:  new UntypedFormControl      ('',[]),
      is_business_card:  new UntypedFormControl      (false,[]),
      is_online_booking:  new UntypedFormControl      (false,[]),



      fld_step:                         new UntypedFormControl('',[]),
      fld_max_amount_services:          new UntypedFormControl('',[]),
      fld_locale_id:                    new UntypedFormControl('',[]),
      fld_time_format:                  new UntypedFormControl('',[Validators.maxLength(2)]),
      fld_duration:                     new UntypedFormControl('',[Validators.maxLength(7)]),
      fld_predefined_duration:          new UntypedFormControl('',[]),
      fld_predefined_duration_unit_id:  new UntypedFormControl(0,[]),
      fld_tel_prefix:                   new UntypedFormControl('',[Validators.maxLength(7)]),
      fld_ask_telephone:                new UntypedFormControl('',[]),
      fld_ask_email:                    new UntypedFormControl('',[]),
      fld_url_slug:                     new UntypedFormControl('',[Validators.maxLength(50)]),
      txt_btn_select_time:              new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_btn_select_specialist:        new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_btn_select_services:          new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_header:               new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_date:                 new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_time_start:           new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_time_end:             new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_duration:             new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_specialist:           new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_summary_services:             new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_btn_create_order:             new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_btn_send_order:               new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_msg_send_successful:          new UntypedFormControl('',[Validators.maxLength(200)]),
      txt_msg_send_error:               new UntypedFormControl('',[Validators.maxLength(200)]),
      txt_msg_time_not_enable:          new UntypedFormControl('',[Validators.maxLength(200)]),
      txt_fld_your_name:                new UntypedFormControl('',[Validators.maxLength(200)]),
      txt_fld_your_tel:                 new UntypedFormControl('',[Validators.maxLength(200)]),
      txt_fld_your_email:               new UntypedFormControl('',[Validators.maxLength(200)]),
      stl_color_buttons:                new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_color_buttons_text:           new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_color_text:                   new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_corner_radius:                new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_font_family:                  new UntypedFormControl('',[Validators.maxLength(200)]),
      
      // fld_privce_type_id:               new UntypedFormControl('',[Validators.required]),
      fld_creator_id:                   new UntypedFormControl('',[Validators.required]),
      txt_any_specialist:               new UntypedFormControl('',[Validators.maxLength(100)]),
      txt_hour:                         new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_minute:                       new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_nearest_app_time:             new UntypedFormControl('',[Validators.maxLength(100)]),
      txt_today:                        new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_tomorrow:                     new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_morning:                      new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_day:                          new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_evening:                      new UntypedFormControl('',[Validators.maxLength(20)]),
      txt_night:                        new UntypedFormControl('',[Validators.maxLength(20)]),
      stl_background_color:             new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_panel_color:                  new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_panel_max_width:              new UntypedFormControl('',[]),
      stl_panel_max_width_unit:         new UntypedFormControl('',[Validators.maxLength(2)]),
      stl_not_selected_elements_color:  new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_selected_elements_color:      new UntypedFormControl('',[Validators.maxLength(7)]),
      stl_job_title_color:              new UntypedFormControl('',[Validators.maxLength(7)]),

      onlineSchedulingFieldsTranslations:new UntypedFormArray ([]) ,
      onlineSchedulingLanguagesList:    new UntypedFormArray  ([]) ,
      onlineSchedulingContactsList:     new UntypedFormArray  ([]) ,
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl           ('',[]),
      master: new UntypedFormControl       ('',[]),
      creator: new UntypedFormControl      ('',[]),
      changer: new UntypedFormControl      ('',[]),
      company: new UntypedFormControl      ('',[]),
      date_time_created: new UntypedFormControl      ('',[]),
      date_time_changed: new UntypedFormControl      ('',[]),
    });
    this.formLanguageAdding = new UntypedFormGroup({
      id: new UntypedFormControl ('' ,[]),      
      suffix: new UntypedFormControl ('' ,[Validators.required,Validators.maxLength(2),Validators.minLength(2)]),
      name: new UntypedFormControl ('' ,[Validators.required,Validators.maxLength(20),Validators.minLength(1)]),
      fileName: new UntypedFormControl ('' ,[]),
    });
    this.getSpravSysOPF();
    // this.getCurrencyList();
    this.getSpravSysCountries();
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель по умолчанию"
    this.onDefaultCreatorSearchValueChanges();//отслеживание изменений поля "Создатель интернет-заказов"
    this.getSetOfPermissions();
    this.getSpravSysLocales();  
    this.getSpravSysEdizm();
    this.formLanguageTableColumns();
    //+++ getting base data from parent component
    // this.getBaseData('myId');    
    this.getBaseData('myCompanyId');      
    this.getBaseData('accountingCurrency');   
    this.getBaseData('countryId');   
    this.getBaseData('organization');  
    this.getBaseData('suffix'); 
    // listener of time zones field change
    this.filteredSpravSysTimeZones = this.formBaseInformation.get('timeZoneName').valueChanges
    .pipe(
      startWith(''),
      map((value:string) => this._filter(value,this.spravSysTimeZones))
    );

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
    this.getSpravSysTimeZones();

  }
//   fileChangeEvent(event: any): void {
//     this.imageChangedEvent = event;
// }
// imageCropped(event: ImageCroppedEvent) {
//   console.log('event',event)
//   this.createImageFromBlob(event.blob)
//     // this.logoImage = event.objectUrl; // if output="blob"
//     // this.logoImage = event.base64;    // if output="base64"
// }
// imageLoaded() {
//     // show cropper
// }
// cropperReady() {
//     // cropper ready
// }
// loadImageFailed() {
//     // show message
// }
// createImageFromBlob(image: Blob) {
//   let reader = new FileReader();
//   reader.addEventListener("load", () => {
//       this.logoImage = reader.result;
//   }, false);
//   if (image) {
//       reader.readAsDataURL(image);
//   }
// }







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
    this.formBaseInformation.get('fld_creator_id').setValue(+id);}
  checkEmptyDefaultCreatorField(){
    if(this.searchDefaultCreatorCtrl.value.length==0){
      this.formBaseInformation.get('fld_creator_id').setValue(null);
  }}
  getDefaultCreatorsList(){ //заполнение Autocomplete для поля Товар
    try {
      if(this.canDefaultCreatorAutocompleteQuery && this.searchDefaultCreatorCtrl.value.length>1){
        this.isDefaultCreatorListLoading  = true;
        return this.http.get('/api/auth/getUsersList?company_id='+this.formBaseInformation.get('id').value+'&search_string='+this.searchDefaultCreatorCtrl.value);
      }else return [];
    } catch (e) {
    return [];}}
  clearDefaultCreatorField(){
    this.searchDefaultCreatorCtrl.setValue('');
    this.checkEmptyDefaultCreatorField();
    this.formBaseInformation.get('fld_creator_id').setValue(null);
  }
//  -------------     ***** конец поиска по подстроке для создателя заказов ***    --------------------------
  getData(){
      if(+this.id>0){
        this.getDocumentValuesById();
      }else {
        this.refreshPermissions();
      }
  }

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
                  this.formBaseInformation.get('booking_doc_name_variation_id').setValue(documentValues.booking_doc_name_variation_id);
                  this.formBaseInformation.get('store_default_lang_code').setValue(documentValues.store_default_lang_code); 
                  this.formBaseInformation.get('time_zone_id').setValue(documentValues.time_zone_id);
                  this.formBaseInformation.get('logo_id').setValue(documentValues.logo_id);
                  this.formBaseInformation.get('logo_file_name').setValue(documentValues.logo_file_name);
                  this.formBaseInformation.get('is_business_card').setValue(documentValues.is_business_card);
                  this.formBaseInformation.get('is_online_booking').setValue(documentValues.is_online_booking);

                  this.formBaseInformation.get('fld_step').setValue(documentValues.fld_step);
                  this.formBaseInformation.get('fld_max_amount_services').setValue(documentValues.fld_max_amount_services);
                  this.formBaseInformation.get('fld_locale_id').setValue(documentValues.fld_locale_id);
                  this.formBaseInformation.get('fld_time_format').setValue(documentValues.fld_time_format);
                  this.formBaseInformation.get('fld_duration').setValue(documentValues.fld_duration);
                  this.formBaseInformation.get('fld_predefined_duration').setValue(documentValues.fld_predefined_duration);
                  this.formBaseInformation.get('fld_predefined_duration_unit_id').setValue(documentValues.fld_predefined_duration_unit_id);
                  this.formBaseInformation.get('fld_tel_prefix').setValue(documentValues.fld_tel_prefix);
                  this.formBaseInformation.get('fld_ask_telephone').setValue(documentValues.fld_ask_telephone);
                  this.formBaseInformation.get('fld_ask_email').setValue(documentValues.fld_ask_email);
                  this.formBaseInformation.get('fld_url_slug').setValue(documentValues.fld_url_slug);
                  this.formBaseInformation.get('txt_btn_select_time').setValue(documentValues.txt_btn_select_time);
                  this.formBaseInformation.get('txt_btn_select_specialist').setValue(documentValues.txt_btn_select_specialist);
                  this.formBaseInformation.get('txt_btn_select_services').setValue(documentValues.txt_btn_select_services);
                  this.formBaseInformation.get('txt_summary_header').setValue(documentValues.txt_summary_header);
                  this.formBaseInformation.get('txt_summary_date').setValue(documentValues.txt_summary_date);
                  this.formBaseInformation.get('txt_summary_time_start').setValue(documentValues.txt_summary_time_start);
                  this.formBaseInformation.get('txt_summary_time_end').setValue(documentValues.txt_summary_time_end);
                  this.formBaseInformation.get('txt_summary_duration').setValue(documentValues.txt_summary_duration);
                  this.formBaseInformation.get('txt_summary_specialist').setValue(documentValues.txt_summary_specialist);
                  this.formBaseInformation.get('txt_summary_services').setValue(documentValues.txt_summary_services);
                  this.formBaseInformation.get('txt_btn_create_order').setValue(documentValues.txt_btn_create_order);
                  this.formBaseInformation.get('txt_btn_send_order').setValue(documentValues.txt_btn_send_order);
                  this.formBaseInformation.get('txt_msg_send_successful').setValue(documentValues.txt_msg_send_successful);
                  this.formBaseInformation.get('txt_msg_send_error').setValue(documentValues.txt_msg_send_error);
                  this.formBaseInformation.get('txt_msg_time_not_enable').setValue(documentValues.txt_msg_time_not_enable);
                  this.formBaseInformation.get('txt_fld_your_name').setValue(documentValues.txt_fld_your_name);
                  this.formBaseInformation.get('txt_fld_your_tel').setValue(documentValues.txt_fld_your_tel);
                  this.formBaseInformation.get('txt_fld_your_email').setValue(documentValues.txt_fld_your_email);
                  this.formBaseInformation.get('stl_color_buttons').setValue(documentValues.stl_color_buttons);
                  this.formBaseInformation.get('stl_color_buttons_text').setValue(documentValues.stl_color_buttons_text);
                  this.formBaseInformation.get('stl_color_text').setValue(documentValues.stl_color_text);
                  this.formBaseInformation.get('stl_corner_radius').setValue(documentValues.stl_corner_radius);
                  this.formBaseInformation.get('stl_font_family').setValue(documentValues.stl_font_family);
                  // this.formBaseInformation.get('fld_privce_type_id').setValue(documentValues.fld_privce_type_id);
                  this.formBaseInformation.get('fld_creator_id').setValue(documentValues.fld_creator_id);
                  this.formBaseInformation.get('txt_any_specialist').setValue(documentValues.txt_any_specialist);
                  this.formBaseInformation.get('txt_hour').setValue(documentValues.txt_hour);
                  this.formBaseInformation.get('txt_minute').setValue(documentValues.txt_minute);
                  this.formBaseInformation.get('txt_nearest_app_time').setValue(documentValues.txt_nearest_app_time);
                  this.formBaseInformation.get('txt_today').setValue(documentValues.txt_today);
                  this.formBaseInformation.get('txt_tomorrow').setValue(documentValues.txt_tomorrow);
                  this.formBaseInformation.get('txt_morning').setValue(documentValues.txt_morning);
                  this.formBaseInformation.get('txt_day').setValue(documentValues.txt_day);
                  this.formBaseInformation.get('txt_evening').setValue(documentValues.txt_evening);
                  this.formBaseInformation.get('txt_night').setValue(documentValues.txt_night);
                  this.formBaseInformation.get('stl_background_color').setValue(documentValues.stl_background_color);
                  this.formBaseInformation.get('stl_panel_color').setValue(documentValues.stl_panel_color);
                  this.formBaseInformation.get('stl_panel_max_width').setValue(documentValues.stl_panel_max_width);
                  this.formBaseInformation.get('stl_panel_max_width_unit').setValue(documentValues.stl_panel_max_width_unit);
                  this.formBaseInformation.get('stl_not_selected_elements_color').setValue(documentValues.stl_not_selected_elements_color);
                  this.formBaseInformation.get('stl_selected_elements_color').setValue(documentValues.stl_selected_elements_color);
                  this.formBaseInformation.get('stl_job_title_color').setValue(documentValues.stl_job_title_color);
                  this.searchDefaultCreatorCtrl.setValue(documentValues.fld_creator);
                  this.onlineSchedulingFieldsTranslations = documentValues.onlineSchedulingFieldsTranslations;
                  // this.onlineSchedulingContactsList = documentValues.onlineSchedulingContactsList;
                  this.contactsComponent.fillContactsListFromApiResponse(documentValues.onlineSchedulingContactsList);
                  // this.searchRegionCtrl.setValue(documentValues.region);
                  // this.searchJrRegionCtrl.setValue(documentValues.jr_region);
                  this.area=documentValues.area;
                  this.jr_area=documentValues.jr_area;
                  // this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
                  // this.searchJrCityCtrl.setValue(this.jr_area!=''?(documentValues.jr_city+' ('+this.jr_area+')'):documentValues.jr_city);
                  this.updateValues('time_zone_id','timeZoneName',this.spravSysTimeZones);
                  this.getCompaniesPaymentAccounts();
                  this.fillLanguagesListFromApiResponse(documentValues.onlineSchedulingLanguagesList);
                  this.fillTranslationsListFromApiResponse();
                  this.refreshFieldsTranslationsArray();
                  this.loadFilesInfo();
                  this.getPriceTypesList();         
                  this.getDepartmentsList();                  
                  this.refreshTableColumns();
                  if(this.formBaseInformation.get('logo_id').value)
                    this.getLogo();
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
                this.refreshEnableDisableFields();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  getSpravSysEdizm():void {    
    this.spravSysEdizmOfProductTime=[];
    this.http.post('/api/auth/getSpravSysEdizm', {id1: this.id, string1:"(6)"})  // 6 - time type
    .subscribe((data) => {
      let spravSysEdizmOfProductAll = data as any[];
      spravSysEdizmOfProductAll.forEach(a=>{
        if(a.type_id==6){ // time
          this.spravSysEdizmOfProductTime.push(a)}
      });
    },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
    );
  }

  getSpravSysLocales():void {    
    this.http.get('/api/auth/getSpravSysLocales').subscribe((data) => {this.spravSysLocales = data as any[]},
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
    );
  }

  fillLanguagesListFromApiResponse(languagesArray:OnlineSchedulingLanguage[]){
    const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingLanguagesList');
    control.clear(); 
    languagesArray.forEach(row=>{
      control.push(this.formingLanguageRowFromApiResponse(row));
    });
  }
  
  formingLanguageRowFromApiResponse(row: OnlineSchedulingLanguage) {
    return this._fb.group({
      id: new UntypedFormControl (row.id,[]),
      suffix: new UntypedFormControl (row.suffix,[Validators.required,Validators.maxLength(2),Validators.minLength(2)]),
      name: new UntypedFormControl (row.name,[Validators.required,Validators.maxLength(20),Validators.minLength(1)]),
      fileName: new UntypedFormControl (row.fileName,[]),   
    });
  }
  fillTranslationsListFromApiResponse(){
    const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingFieldsTranslations');
    control.clear(); 
    this.onlineSchedulingFieldsTranslations.forEach(row=>{
      control.push(this.formingTranslationRowFromApiResponse(row));
    });
  }
  formingTranslationRowFromApiResponse(row: OnlineSchedulingFieldsTranslation) {
    return this._fb.group({
      langCode: new UntypedFormControl (row.langCode,[]),
      txt_btn_select_time: new UntypedFormControl (row.txt_btn_select_time,[]),
      txt_btn_select_specialist: new UntypedFormControl (row.txt_btn_select_specialist,[]),
      txt_btn_select_services: new UntypedFormControl (row.txt_btn_select_services,[]),
      txt_summary_header: new UntypedFormControl (row.txt_summary_header,[]),
      txt_summary_date: new UntypedFormControl (row.txt_summary_date,[]),
      txt_summary_time_start: new UntypedFormControl (row.txt_summary_time_start,[]),
      txt_summary_time_end: new UntypedFormControl (row.txt_summary_time_end,[]),
      txt_summary_duration: new UntypedFormControl (row.txt_summary_duration,[]),
      txt_summary_specialist: new UntypedFormControl (row.txt_summary_specialist,[]),
      txt_summary_services: new UntypedFormControl (row.txt_summary_services,[]),
      txt_btn_create_order: new UntypedFormControl (row.txt_btn_create_order,[]),
      txt_btn_send_order: new UntypedFormControl (row.txt_btn_send_order,[]),
      txt_msg_send_successful: new UntypedFormControl (row.txt_msg_send_successful,[]),
      txt_msg_send_error: new UntypedFormControl (row.txt_msg_send_error,[]),
      txt_msg_time_not_enable: new UntypedFormControl (row.txt_msg_time_not_enable,[]),
      txt_fld_your_name: new UntypedFormControl (row.txt_fld_your_name,[]),
      txt_fld_your_tel: new UntypedFormControl (row.txt_fld_your_tel,[]),
      txt_fld_your_email: new UntypedFormControl (row.txt_fld_your_email,[]),
      txt_any_specialist: new UntypedFormControl (row.txt_any_specialist,[]),
      txt_hour: new UntypedFormControl (row.txt_hour,[]),
      txt_minute: new UntypedFormControl (row.txt_minute,[]),
      txt_nearest_app_time: new UntypedFormControl (row.txt_nearest_app_time,[]),
      txt_today: new UntypedFormControl (row.txt_today,[]),
      txt_tomorrow: new UntypedFormControl (row.txt_tomorrow,[]),
      txt_morning: new UntypedFormControl (row.txt_morning,[]),
      txt_day: new UntypedFormControl (row.txt_day,[]),
      txt_evening: new UntypedFormControl (row.txt_evening,[]),
      txt_night: new UntypedFormControl (row.txt_night,[]),
    });
  }
  translationsArrayHasThisLang(suffix:string):boolean{
    let result=false;
    this.formBaseInformation.value.onlineSchedulingFieldsTranslations.map(translation =>{
      if(suffix==translation.langCode) result=true;
    });
    return result;
  }
  languagesListHasThisLang(suffix:string):boolean{
    let result=false;
    this.formBaseInformation.value.onlineSchedulingLanguagesList.map(lang =>{
      if(suffix==lang.suffix) result=true;
    });
    return result;
  }
  getTranslationIndexBySuffix(suffix:string):number{
    let result=null;
    let i=0;
    this.formBaseInformation.value.onlineSchedulingFieldsTranslations.map(translation =>{
      if(suffix==translation.langCode) result=i;
      i++
    });
    return result;
  }
  // run by onlineSchedulingLanguagesList
  // if its "suffix" is not equals to main language's suffix and onlineSchedulingFieldsTranslations has not the translation with this suffix
  // then add translation to the array of translations "onlineSchedulingFieldsTranslations"
  refreshFieldsTranslationsArray(){
    const control = this.formBaseInformation.get('onlineSchedulingFieldsTranslations') as UntypedFormArray;

    this.formBaseInformation.value.onlineSchedulingLanguagesList.map(i => 
      {
        if(
          i['suffix']!=this.formBaseInformation.get('store_default_lang_code').value &&
          i['suffix'].length == 2 &&
          !this.translationsArrayHasThisLang(i['suffix'])
        ){
          control.push(this._fb.group(this.getProductTranslation(i['suffix'])));
        }
      }
    );
    // now need to delete translations whose language suffixes (language codes) are not in onlineSchedulingLanguagesList OR 
    // suffix equals to the main language 
    console.log("length=",this.formBaseInformation.value.onlineSchedulingFieldsTranslations.length);

    for(let i = 0; i < this.formBaseInformation.value.onlineSchedulingFieldsTranslations.length; i++){
      console.log("Checking for lang code = ",control.controls[i].get('langCode').value);
      if(!this.languagesListHasThisLang(control.controls[i].get('langCode').value) || control.controls[i].get('langCode').value==this.formBaseInformation.get('store_default_lang_code').value) { 
        console.log("At index "+i+" there is no language");
        control.removeAt(i);
        i--;
      }
    }
  }
  
  getProductTranslation(currLangCode:string):OnlineSchedulingFieldsTranslation {
    let result:OnlineSchedulingFieldsTranslation = {
      langCode:     currLangCode,      
      txt_btn_select_time: '',
      txt_btn_select_specialist: '',
      txt_btn_select_services: '',
      txt_summary_header: '',
      txt_summary_date: '',
      txt_summary_time_start: '',
      txt_summary_time_end: '',
      txt_summary_duration: '',
      txt_summary_specialist: '',
      txt_summary_services: '', 
      txt_btn_create_order: '',
      txt_btn_send_order: '',
      txt_msg_send_successful: '',
      txt_msg_send_error: '',
      txt_msg_time_not_enable: '',
      txt_fld_your_name: '',
      txt_fld_your_tel: '',
      txt_fld_your_email: '',
      txt_any_specialist: '',
      txt_hour: '',
      txt_minute: '',
      txt_nearest_app_time: '',
      txt_today: '',
      txt_tomorrow: '',
      txt_morning: '',
      txt_day: '',
      txt_evening: '',
      txt_night: '',
    }
    this.onlineSchedulingFieldsTranslations.forEach(translation =>{
      if(currLangCode==translation.langCode)
        result = {
        txt_btn_select_time:        translation.txt_btn_select_time,
        txt_btn_select_specialist:  translation.txt_btn_select_specialist,
        txt_btn_select_services:    translation.txt_btn_select_services,
        txt_summary_header:         translation.txt_summary_header,
        txt_summary_date:           translation.txt_summary_date,
        txt_summary_time_start:     translation.txt_summary_time_start,
        txt_summary_time_end:       translation.txt_summary_time_end,
        txt_summary_duration:       translation.txt_summary_duration,
        txt_summary_specialist:     translation.txt_summary_specialist,
        txt_summary_services:       translation.txt_summary_services, 
        txt_btn_create_order:       translation.txt_btn_create_order,
        txt_btn_send_order:         translation.txt_btn_send_order,
        txt_msg_send_successful:    translation.txt_msg_send_successful,
        txt_msg_send_error:         translation.txt_msg_send_error,
        txt_msg_time_not_enable:    translation.txt_msg_time_not_enable,
        txt_fld_your_name:          translation.txt_fld_your_name,
        txt_fld_your_tel:           translation.txt_fld_your_tel,
        txt_fld_your_email:         translation.txt_fld_your_email,
        txt_any_specialist:         translation.txt_any_specialist,
        txt_hour:                   translation.txt_hour,
        txt_minute:                 translation.txt_minute,
        txt_nearest_app_time:       translation.txt_nearest_app_time,
        txt_today:                  translation.txt_today,
        txt_tomorrow:               translation.txt_tomorrow,
        txt_morning:                translation.txt_morning,
        txt_day:                    translation.txt_day,
        txt_evening:                translation.txt_evening,
        txt_night:                  translation.txt_night,
        langCode: currLangCode,
        }
    });
    return result;
  }





  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  getSpravSysTimeZones():void {    
    this.http.get('/api/auth/getSpravSysTimeZones?suffix='+this.suffix)  // 
    .subscribe((data) => {this.spravSysTimeZones = data as any[];
    this.updateValues('time_zone_id','timeZoneName',this.spravSysTimeZones); },
    error => console.log(error));
  }
  //set name into text field, that matched id in list IdAndName[] (if id is not null)
  updateValues(id:string,name:string,list:IdAndName[]){
    if(+this.formBaseInformation.get(id).value!=0){
      list.forEach(x => {
        if(x.id==this.formBaseInformation.get(id).value){
          this.formBaseInformation.get(name).setValue(x.name);
    }})} 
    else{ // if id is null - setting '' into the field (if we don't do it - there will be no list of values, when place cursor into the field)
      this.formBaseInformation.get(name).setValue('');
      this.formBaseInformation.get(id).setValue('');
    }
  }
  
  // set id of field value into null when field search value is '' 
  checkEmptyFields(id:string,name:string){
    if( this.formBaseInformation.get(name).value.length==0){
      this.formBaseInformation.get(id).setValue(null);
    }
  }
  clearField(field:string){
    this.formBaseInformation.get(field).setValue('');
  }
  private _filter(value: string, list:IdAndName[]): IdAndName[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.name.toLowerCase().includes(filterValue));
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
    this.fillContactsList();
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
          this.showLanguagesFormFields = false;               
          },
          error => {this.oneClickSaveControl=false; console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }
  
  fillContactsList(){
    const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingContactsList');
    control.clear();
    this.contactsComponent.getContactsList().forEach(row=>{
      control.push(this.contactsComponent.formingContactRowFromApiResponse(row));
    });
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
    if ((charCode >= 65 && charCode <= 90)||(charCode >= 97 && charCode <= 122)) { return true; } return false;}
  lettersAndNumbersOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (this.lettersOnly(event)||this.numberOnly(event)) { return true; } return false;}


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
        // this.searchRegionCtrl.setValue(this.searchJrRegionCtrl.value);
        // this.formBaseInformation.get('city_id').setValue(this.formBaseInformation.get('jr_city_id').value);
        this.formBaseInformation.get('city').setValue(this.formBaseInformation.get('jr_city').value);
        // this.searchCityCtrl.setValue(this.searchJrCityCtrl.value);
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
        // this.searchJrRegionCtrl.setValue(this.searchRegionCtrl.value);
        // this.formBaseInformation.get('jr_city_id').setValue(this.formBaseInformation.get('city_id').value);
        this.formBaseInformation.get('jr_city').setValue(this.formBaseInformation.get('city').value);
        // this.searchJrCityCtrl.setValue(this.searchCityCtrl.value);
        this.formBaseInformation.get('jr_street').setValue(this.formBaseInformation.get('street').value);
        this.formBaseInformation.get('jr_home').setValue(this.formBaseInformation.get('home').value);
        this.formBaseInformation.get('jr_flat').setValue(this.formBaseInformation.get('flat').value);
        this.formBaseInformation.get('jr_additional_address').setValue(this.formBaseInformation.get('additional_address').value);
      }});
  }

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

  formLanguageTableColumns(){
    this.displayedLanguagesColumns=[];
    this.displayedLanguagesColumns.push('name','suffix'/*,'fileName'*/);
    this.displayedLanguagesColumns.push('main');
    if(this.editability && this.showLanguagesFormFields)
      this.displayedLanguagesColumns.push('delete');
  }

  refresLanguageTableColumns(){
    this.displayedLanguagesColumns=[];
    setTimeout(() => { 
      this.formLanguageTableColumns();
    }, 1);
  }

  addLanguageRow(){ 
    if(!(this.formLanguageAdding.get('suffix').value.length<2 || this.formLanguageAdding.get('suffix').value=='' || this.formLanguageAdding.get('name').value=='')){
      this.langSuffixInput.nativeElement.blur();
      let thereSamePart:boolean=false;
      this.formBaseInformation.value.onlineSchedulingLanguagesList.map(i => 
      {// Table shouldn't contain the same language. Here is checking about it
        if(i['suffix']==this.formLanguageAdding.get('suffix').value)
        {
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
          thereSamePart=true; 
        }
      });
      if(!thereSamePart){
        const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingLanguagesList');
        control.push(this.formingLanguageRowFromSearchForm());
      }
       this.resetformLanguageAdding();
       this.refreshFieldsTranslationsArray();
    }    
  }
  //формирование строки таблицы с ресурсами, необходимыми для оказания услуги
  formingLanguageRowFromSearchForm() {
    return this._fb.group({
      id: new UntypedFormControl (null,[]),
      suffix: new UntypedFormControl (this.formLanguageAdding.get('suffix').value,[Validators.required,Validators.maxLength(2),Validators.minLength(2)]),
      name:  new UntypedFormControl (this.formLanguageAdding.get('name').value,[Validators.required,Validators.maxLength(20),Validators.minLength(1)]),
      fileName: new UntypedFormControl (+this.formLanguageAdding.get('fileName').value,[]),
    });
  }
  resetformLanguageAdding(){
    this.formLanguageAdding.reset();
    this.formLanguageAdding.get('name').setValue('');
    this.formLanguageAdding.get('fileName').setValue('');
    this.formLanguageAdding.get('suffix').setValue('');
  }
  getControl(formControlName){
    const control = <UntypedFormArray>this.formBaseInformation.get(formControlName);
    return control;
  }

  clearLanguagesTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.cln_table'),warning: translate('docs.msg.cln_table_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControl('onlineSchedulingLanguagesList').clear();
        this.refreshFieldsTranslationsArray();
      }});
  }
  deleteLanguageRow(row: any,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingLanguagesList');
        control.removeAt(index);
        this.refresLanguageTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
        this.refreshFieldsTranslationsArray();
      }
    }); 
  }
  
  changeTranslationMode(){if(this.onlineSchedulingTranslationModeOn) this.onlineSchedulingTranslationModeOn=false; else this.onlineSchedulingTranslationModeOn=true;}
  cap(word){return word.charAt(0).toUpperCase() + word.slice(1);}
  addingLangTransform(){
    this.formLanguageAdding.get('name').setValue(this.cap(this.formLanguageAdding.get('name').value));
    this.formLanguageAdding.get('suffix').setValue(this.formLanguageAdding.get('suffix').value.toUpperCase());
  }
  tableLangTransform(){
    const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingLanguagesList');
    for(let i = 0; i < this.formBaseInformation.value.onlineSchedulingLanguagesList.length; i++){
      control.controls[i].get('name').setValue(this.cap(control.controls[i].get('name').value));
      control.controls[i].get('suffix').setValue(control.controls[i].get('suffix').value.toUpperCase());
    }
    this.refreshFieldsTranslationsArray();
  }
  trackByIndex(i) { return i; }
  setMainLanguage(suffix:string){
    if(this.showLanguagesFormFields){// only if edit mode
      const control = <UntypedFormArray>this.formBaseInformation.get('onlineSchedulingFieldsTranslations');
      // add current main translation to the translation list
      control.push(this._fb.group({
        langCode: this.formBaseInformation.get('store_default_lang_code').value,
        txt_btn_select_time: this.formBaseInformation.get('txt_btn_select_time').value,
        txt_btn_select_specialist: this.formBaseInformation.get('txt_btn_select_specialist').value,
        txt_btn_select_services: this.formBaseInformation.get('txt_btn_select_services').value,
        txt_summary_header: this.formBaseInformation.get('txt_summary_header').value,
        txt_summary_date: this.formBaseInformation.get('txt_summary_date').value,
        txt_summary_time_start: this.formBaseInformation.get('txt_summary_time_start').value,
        txt_summary_time_end: this.formBaseInformation.get('txt_summary_time_end').value,
        txt_summary_duration: this.formBaseInformation.get('txt_summary_duration').value,
        txt_summary_specialist: this.formBaseInformation.get('txt_summary_specialist').value,
        txt_summary_services: this.formBaseInformation.get('txt_summary_services').value,
        txt_btn_create_order: this.formBaseInformation.get('txt_btn_create_order').value,
        txt_btn_send_order: this.formBaseInformation.get('txt_btn_send_order').value,
        txt_msg_send_successful: this.formBaseInformation.get('txt_msg_send_successful').value,
        txt_msg_send_error: this.formBaseInformation.get('txt_msg_send_error').value,
        txt_msg_time_not_enable: this.formBaseInformation.get('txt_msg_time_not_enable').value,
        txt_fld_your_name: this.formBaseInformation.get('txt_fld_your_name').value,
        txt_fld_your_tel: this.formBaseInformation.get('txt_fld_your_tel').value,
        txt_fld_your_email: this.formBaseInformation.get('txt_fld_your_email').value,
        txt_any_specialist: this.formBaseInformation.get('txt_any_specialist').value,
        txt_hour: this.formBaseInformation.get('txt_hour').value,
        txt_minute: this.formBaseInformation.get('txt_minute').value,
        txt_nearest_app_time: this.formBaseInformation.get('txt_nearest_app_time').value,
        txt_today: this.formBaseInformation.get('txt_today').value,
        txt_tomorrow: this.formBaseInformation.get('txt_tomorrow').value,
        txt_morning: this.formBaseInformation.get('txt_morning').value,
        txt_day: this.formBaseInformation.get('txt_day').value,
        txt_evening: this.formBaseInformation.get('txt_evening').value,
        txt_night: this.formBaseInformation.get('txt_night').value,
      }));
  
      let newMainTranslationIndex = this.getTranslationIndexBySuffix(suffix);
      if(newMainTranslationIndex!=null){      
        // copy translation of new main language from the list of translations to the main form 
        this.formBaseInformation.get('store_default_lang_code').setValue(suffix);
        this.formBaseInformation.get('txt_btn_select_time').setValue(control.controls[newMainTranslationIndex].get('txt_btn_select_time').value),
        this.formBaseInformation.get('txt_btn_select_specialist').setValue(control.controls[newMainTranslationIndex].get('txt_btn_select_specialist').value),
        this.formBaseInformation.get('txt_btn_select_services').setValue(control.controls[newMainTranslationIndex].get('txt_btn_select_services').value),
        this.formBaseInformation.get('txt_summary_header').setValue(control.controls[newMainTranslationIndex].get('txt_summary_header').value),
        this.formBaseInformation.get('txt_summary_date').setValue(control.controls[newMainTranslationIndex].get('txt_summary_date').value),
        this.formBaseInformation.get('txt_summary_time_start').setValue(control.controls[newMainTranslationIndex].get('txt_summary_time_start').value),
        this.formBaseInformation.get('txt_summary_time_end').setValue(control.controls[newMainTranslationIndex].get('txt_summary_time_end').value),
        this.formBaseInformation.get('txt_summary_duration').setValue(control.controls[newMainTranslationIndex].get('txt_summary_duration').value),
        this.formBaseInformation.get('txt_summary_specialist').setValue(control.controls[newMainTranslationIndex].get('txt_summary_specialist').value),
        this.formBaseInformation.get('txt_summary_services').setValue(control.controls[newMainTranslationIndex].get('txt_summary_services').value),
        this.formBaseInformation.get('txt_btn_create_order').setValue(control.controls[newMainTranslationIndex].get('txt_btn_create_order').value),
        this.formBaseInformation.get('txt_btn_send_order').setValue(control.controls[newMainTranslationIndex].get('txt_btn_send_order').value),
        this.formBaseInformation.get('txt_msg_send_successful').setValue(control.controls[newMainTranslationIndex].get('txt_msg_send_successful').value),
        this.formBaseInformation.get('txt_msg_send_error').setValue(control.controls[newMainTranslationIndex].get('txt_msg_send_error').value),
        this.formBaseInformation.get('txt_msg_time_not_enable').setValue(control.controls[newMainTranslationIndex].get('txt_msg_time_not_enable').value),
        this.formBaseInformation.get('txt_fld_your_name').setValue(control.controls[newMainTranslationIndex].get('txt_fld_your_name').value),
        this.formBaseInformation.get('txt_fld_your_tel').setValue(control.controls[newMainTranslationIndex].get('txt_fld_your_tel').value),
        this.formBaseInformation.get('txt_fld_your_email').setValue(control.controls[newMainTranslationIndex].get('txt_fld_your_email').value),
        this.formBaseInformation.get('txt_any_specialist').setValue(control.controls[newMainTranslationIndex].get('txt_any_specialist').value),
        this.formBaseInformation.get('txt_hour').setValue(control.controls[newMainTranslationIndex].get('txt_hour').value),
        this.formBaseInformation.get('txt_minute').setValue(control.controls[newMainTranslationIndex].get('txt_minute').value),
        this.formBaseInformation.get('txt_nearest_app_time').setValue(control.controls[newMainTranslationIndex].get('txt_nearest_app_time').value),
        this.formBaseInformation.get('txt_today').setValue(control.controls[newMainTranslationIndex].get('txt_today').value),
        this.formBaseInformation.get('txt_tomorrow').setValue(control.controls[newMainTranslationIndex].get('txt_tomorrow').value),
        this.formBaseInformation.get('txt_morning').setValue(control.controls[newMainTranslationIndex].get('txt_morning').value),
        this.formBaseInformation.get('txt_day').setValue(control.controls[newMainTranslationIndex].get('txt_day').value),
        this.formBaseInformation.get('txt_evening').setValue(control.controls[newMainTranslationIndex].get('txt_evening').value),
        this.formBaseInformation.get('txt_night').setValue(control.controls[newMainTranslationIndex].get('txt_night').value)
        
        
        
        // delete new main translation from translations list (because now it is on the main form)
        control.removeAt(newMainTranslationIndex);
      }
    }
  }
  refreshTableColumns(){
    this.displayedLanguagesColumns=[];
    setTimeout(() => { 
      this.formLanguageTableColumns();
    }, 1);
  }

  
  uploadAvatar() {
    const dialogFastDcedule = this.imageUploaderComponent.open(ImageUploaderComponent, {
      width: '400px', 
      data: {
        companyId: this.id
      },
    });
    dialogFastDcedule.afterClosed().subscribe(result => {
      if(result){
        this.formBaseInformation.get('logo_id').setValue(result);
        this.getLogo()
      }
    });
  }
 
  getLogo(){
    this.http.get('/api/auth/getFileImageById?file_id='+this.formBaseInformation.get('logo_id').value+'&is_full_size=false', {responseType: 'blob'}).subscribe(blob => {
      let imageBlob=blob;
      let reader = new FileReader();
      reader.addEventListener("load", () => {
          this.logoImage = reader.result;
      }, false);
      if (imageBlob) {
          reader.readAsDataURL(imageBlob);
      }
    });
  }
  is_business_card_toggle(event: MatSlideToggleChange) {
    if(!event.checked){
      this.formBaseInformation.get('is_online_booking').setValue(false);
    }
    this.refreshEnableDisableFields();
  }
  
  refreshEnableDisableFields(){
    console.log(!this.editability || 
      !this.formBaseInformation.get('is_business_card').value)
    console.log(!this.editability)
    console.log(!this.formBaseInformation.get('is_business_card').value)
      
    if(
      !this.editability || 
      !this.formBaseInformation.get('is_business_card').value
    ){
      this.formBaseInformation.controls['is_online_booking'].disable();
    } else this.formBaseInformation.controls['is_online_booking'].enable();
  }
}
