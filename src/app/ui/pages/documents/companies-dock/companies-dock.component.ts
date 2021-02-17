import { Component, OnInit , Inject, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, FormGroup, FormArray, FormControl, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FilesComponent } from '../files/files.component';
import { FilesDockComponent } from '../files-dock/files-dock.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE}  from '@angular/material/core';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import * as _moment from 'moment';
import { default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
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

interface dockResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  company: string;// предприятие, которому будет принадлежать документ
  creator: string; // создатель
  creator_id: number; //id создателя
  master: string; // мастер-аккаунт
  master_id: number; //id мастер-аккаунта
  changer:string;// кто изменил
  changer_id: number;// id кто изменил
  opf:string;//организационно-правовая форма предприятия
  opf_id: number;//id организационно-правовая форма предприятия
  name: string; //наименование
  date_time_changed: string;//дату изменения
  date_time_created: string;//дату создания

  currency_id: number;
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
  region: number;//область
  area: string; //район
  city: number;//id город/нас.пункт
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
  jr_region: number;//область
  jr_area: string; //район
  jr_city: number;//город/нас.пункт
  jr_street: string;//улица
  jr_home: string;//дом
  jr_flat: string;//квартира
  jr_additional_address: string;//дополнение к адресу
  jr_inn: string;//ИНН
  jr_okpo: string;//ОКПО
  jr_fio_family: string;//Фамилия (для ИП или физлица)
  jr_fio_name: string;//Имя (для ИП или физлица)
  jr_fio_otchestvo: string;//Отчество (для ИП или физлица)
  jr_ip_ogrnip: string;//ОГРНИП (для ИП)
  jr_ip_svid_num: string; // номер свидетельства (для ИП). string т.к. оно может быть типа "серия 77 №42343232"
  jr_ip_reg_date: string; // дата регистрации ИП (для ИП)
}

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
  selector: 'app-companies-dock',
  templateUrl: './companies-dock.component.html',
  styleUrls: ['./companies-dock.component.css'],
  providers: [LoadSpravService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})

export class CompaniesDockComponent implements OnInit {
  id: number;// id документа
  createdDockId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;
  receivedSpravSysOPF: any [];//массив для получения данных справочника форм предприятий
  receivedCurrencyList: any [];// список валют
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  fileInfo : filesInfo = null; //массив для получения информации по прикрепленным к документу файлам 
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра карточки документа

  //поиск адреса и юр. адреса (Страна, Район, Город):
  // Страны 
  spravSysCountries: IdAndName_ru[] = [];// массив, куда будут грузиться все страны 
  // spravSysJrCountries: IdAndName[] = [];// массив, куда будут грузиться все юр. страны 
  filteredSpravSysCountries: Observable<IdAndName_ru[]>; //массив для отфильтрованных Страна 
  filteredSpravSysJrCountries: Observable<IdAndName_ru[]>; //массив для отфильтрованных Юр Страна
  // Регионы
  //для поиска района по подстроке
  searchRegionCtrl = new FormControl();//поле для поиска
  isRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredRegions: Region[];//массив для загрузки найденных по подстроке регионов
  searchJrRegionCtrl = new FormControl();//поле для поиска
  isJrRegionListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canJrRegionAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredJrRegions: Region[];//массив для загрузки найденных по подстроке регионов
  // Города
  //для поиска района по подстроке
  searchCityCtrl = new FormControl();//поле для поиска
  isCityListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCityAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCities: City[];//массив для загрузки найденных по подстроке городов
  searchJrCityCtrl = new FormControl();//поле для поиска
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
  // idAndName:IdAndName=<IdAndName>{};
  receivedStatusesList: statusInterface [] = []; // массив для получения списка статусов
  status_color: string = '';
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;

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

constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  public dialogAddFiles: MatDialog,
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private _fb: FormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  public ConfirmDialog: MatDialog) { 
    console.log(this.activateRoute);
    this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company: new FormControl      ('',[]),
      opf: new FormControl      ('',[]),
      opf_id: new FormControl      ('',[Validators.required]),
      name: new FormControl      ('',[Validators.required,Validators.maxLength(500)]),
      code: new FormControl      ('',[Validators.maxLength(30)]),
      telephone: new FormControl      ('',[Validators.maxLength(60)]),
      site:  new FormControl      ('',[Validators.maxLength(120)]),
      email:  new FormControl      ('',[Validators.maxLength(254)]),

      nds_payer: new FormControl      (false,[]),
      currency_id:  new FormControl      ('',[Validators.required]),
      fio_director: new FormControl      ('',[Validators.maxLength(120)]),
      director_position: new FormControl      ('',[Validators.maxLength(120)]),
      fio_glavbuh: new FormControl      ('',[Validators.maxLength(120)]),
      director_signature_id: new FormControl      ('',[]),
      glavbuh_signature_id: new FormControl      ('',[]),
      stamp_id: new FormControl      ('',[]),
      director_signature_filename: new FormControl      ('',[]),
      glavbuh_signature_filename: new FormControl      ('',[]),
      stamp_filename: new FormControl      ('',[]),
      card_template_filename: new FormControl      ('',[]),
      card_template_original_filename: new FormControl      ('',[]),
      card_template_id: new FormControl      ('',[]),

      //фактический адрес:
      zip_code:  new FormControl      ('',[Validators.maxLength(40)]),
      country_id:  new FormControl      ('',[]),
      region_id:  new FormControl      ('',[]),
      city_id:  new FormControl      ('',[]),
      street:  new FormControl      ('',[Validators.maxLength(120)]),
      home:  new FormControl      ('',[Validators.maxLength(16)]),
      flat:  new FormControl      ('',[Validators.maxLength(8)]),
      additional_address:  new FormControl      ('',[Validators.maxLength(240)]),
      status_id:  new FormControl      ('',[]),
      price_type_id:  new FormControl      ('',[]),
      discount_card:   new FormControl      ('',[Validators.maxLength(30)]),
      //Юридические реквизиты new FormControl      ('',[]),
      jr_jur_full_name:  new FormControl      ('',[Validators.maxLength(500)]),
      jr_jur_kpp:  new FormControl      ('',[Validators.pattern('^[0-9]{9}$')]),
      jr_jur_ogrn:  new FormControl      ('',[Validators.pattern('^[0-9]{13}$')]),
      //юридический адрес (для юрлиц) /адрес регистрации (для ип и физлиц)
      jr_zip_code:  new FormControl      ('',[Validators.maxLength(40)]),
      jr_country_id:  new FormControl      ('',[]),
      jr_region_id:  new FormControl      ('',[]),
      jr_city_id:  new FormControl      ('',[]),
      jr_street:  new FormControl      ('',[Validators.maxLength(120)]),
      jr_home:  new FormControl      ('',[Validators.maxLength(16)]),
      jr_flat:  new FormControl      ('',[Validators.maxLength(8)]),
      jr_additional_address:  new FormControl      ('',[Validators.maxLength(240)]),
      jr_inn:  new FormControl      ('',[Validators.pattern('^([0-9]{10}|[0-9]{12})$')]),
      jr_okpo:  new FormControl      ('',[Validators.pattern('^([0-9]{8}|[0-9]{10})$')]),
      jr_fio_family:  new FormControl      ('',[Validators.maxLength(120)]),
      jr_fio_name:  new FormControl      ('',[Validators.maxLength(120)]),
      jr_fio_otchestvo:  new FormControl      ('',[Validators.maxLength(120)]),
      jr_ip_ogrnip:  new FormControl      ('',[Validators.pattern('^[0-9]{15}$')]),
      jr_ip_svid_num:  new FormControl      ('',[Validators.maxLength(30)]),
      jr_ip_reg_date:  new FormControl      ('',[]),//на дату валидаторы не вешаются, у нее свой валидатор
      companiesPaymentAccountsTable: new FormArray ([]) ,
      country:  new FormControl      ('',[]),
      jr_country:  new FormControl      ('',[]),
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

    this.getSpravSysOPF();
    this.getCurrencyList();
    this.getSpravSysCountries();
    this.getSetOfPermissions();
    //->getMyCompanyId()
    //->getCRUD_rights()
    //->getData()  (док существует):-> getDocumentValuesById()->getStatusesList()->refreshPermissions()
    // (новый док):
    //->getStatusesList()
    //->setDefaultStatus()
    //->refreshPermissions()


    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.dockId; this.formBaseInformation.get('id').setValue(this.id);}
    }

    //слушалки наизменение полей адресов
    this.filteredSpravSysCountries=this.formBaseInformation.get('country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_country(value)));
    this.filteredSpravSysJrCountries=this.formBaseInformation.get('jr_country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_jr_country(value)));
    this.onRegionSearchValueChanges();
    this.onJrRegionSearchValueChanges();
    this.onCitySearchValueChanges();
    this.onJrCitySearchValueChanges();
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
        error => console.log(error),
    );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreate = permissionsSet.some(                     function(e){return(e==3)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==6)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==5)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==8)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==7)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('id').value==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
    
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.allowToUpdate;
      console.log("visBtnUpdate - "+this.visBtnUpdate);
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }

    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));

    console.log("allowToView - "+this.allowToView);
    console.log("allowToUpdate - "+this.allowToUpdate);
    console.log("allowToCreate - "+this.allowToCreate);

    return true;
  }
  
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
      if(+this.id>0){
        this.getDocumentValuesById();
      }else {
        this.refreshPermissions();
      }
  }
  getCurrencyList(){
    console.log("getCurrencyList");
    this.receivedCurrencyList=null;
            this.http.get('/api/auth/getSpravSysCurrency')
            .subscribe(
                (data) => {this.receivedCurrencyList=data as any [];
                  console.log("receivedCurrencyList-"+this.receivedCurrencyList);
                  this.setDefaultCurrency()},
                error => console.log(error)
            );
  }
  setDefaultCurrency(){
    if(this.receivedCurrencyList.length>0 && +this.id==0)
    {
      this.formBaseInformation.get('currency_id').setValue(this.receivedCurrencyList[0].id);
    }
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => console.log(error));
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
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getCompanyValues', dockId)
        .subscribe(
            data => { 
                let documentValues: dockResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                this.formAboutDocument.get('id').setValue(+documentValues.id);
                this.formAboutDocument.get('master').setValue(documentValues.master);
                this.formAboutDocument.get('creator').setValue(documentValues.creator);
                this.formAboutDocument.get('changer').setValue(documentValues.changer);
                this.formAboutDocument.get('company').setValue(documentValues.company);
                this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                this.formBaseInformation.get('company').setValue(documentValues.company);
                this.formBaseInformation.get('opf_id').setValue(+documentValues.opf_id);
                this.formBaseInformation.get('opf').setValue(documentValues.opf);
                this.formBaseInformation.get('name').setValue(documentValues.name);
                this.formBaseInformation.get('code').setValue(documentValues.code);
                this.formBaseInformation.get('telephone').setValue(documentValues.telephone);
                this.formBaseInformation.get('site').setValue(documentValues.site);
                this.formBaseInformation.get('email').setValue(documentValues.email);
                this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code);
                this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
                this.formBaseInformation.get('country').setValue(documentValues.country);
                this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
                this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
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
                this.formBaseInformation.get('jr_region_id').setValue(documentValues.jr_region_id);
                this.formBaseInformation.get('jr_city_id').setValue(documentValues.jr_city_id);
                this.formBaseInformation.get('jr_street').setValue(documentValues.jr_street);
                this.formBaseInformation.get('jr_home').setValue(documentValues.jr_home);
                this.formBaseInformation.get('jr_flat').setValue(documentValues.jr_flat);
                this.formBaseInformation.get('jr_additional_address').setValue(documentValues.jr_additional_address);
                this.formBaseInformation.get('jr_inn').setValue(documentValues.jr_inn);
                this.formBaseInformation.get('jr_okpo').setValue(documentValues.jr_okpo);
                this.formBaseInformation.get('jr_fio_family').setValue(documentValues.jr_fio_family);
                this.formBaseInformation.get('jr_fio_name').setValue(documentValues.jr_fio_name);
                this.formBaseInformation.get('jr_fio_otchestvo').setValue(documentValues.jr_fio_otchestvo);
                this.formBaseInformation.get('jr_ip_ogrnip').setValue(documentValues.jr_ip_ogrnip);
                this.formBaseInformation.get('jr_ip_svid_num').setValue(documentValues.jr_ip_svid_num);
                this.formBaseInformation.get('jr_ip_reg_date').setValue(documentValues.jr_ip_reg_date?moment(documentValues.jr_ip_reg_date,'DD.MM.YYYY'):"");
                this.formBaseInformation.get('currency_id').setValue(documentValues.currency_id);
                this.formBaseInformation.get('nds_payer').setValue(documentValues.nds_payer);
                this.formBaseInformation.get('fio_director').setValue(documentValues.fio_director);
                this.formBaseInformation.get('director_position').setValue(documentValues.director_position);
                this.formBaseInformation.get('fio_glavbuh').setValue(documentValues.fio_glavbuh);
                this.formBaseInformation.get('director_signature_id').setValue(documentValues.director_signature_id);
                this.formBaseInformation.get('glavbuh_signature_id').setValue(documentValues.glavbuh_signature_id);
                this.formBaseInformation.get('stamp_id').setValue(documentValues.stamp_id);
                this.formBaseInformation.get('card_template_id').setValue(documentValues.card_template_id);
                this.formBaseInformation.get('card_template_original_filename').setValue(this.formBaseInformation.get('card_template_id').value?documentValues.card_template_original_filename:"Файл не добавлен");
                this.formBaseInformation.get('card_template_filename').setValue(documentValues.card_template_filename);
                this.formBaseInformation.get('director_signature_filename').setValue(this.formBaseInformation.get('director_signature_id').value?documentValues.director_signature_filename:"Файл не добавлен");
                this.formBaseInformation.get('stamp_filename').setValue(this.formBaseInformation.get('stamp_id').value?documentValues.stamp_filename:"Файл не добавлен");
                this.formBaseInformation.get('glavbuh_signature_filename').setValue(this.formBaseInformation.get('glavbuh_signature_id').value?documentValues.glavbuh_signature_filename:"Файл не добавлен");
                this.searchRegionCtrl.setValue(documentValues.region);
                this.searchJrRegionCtrl.setValue(documentValues.jr_region);
                this.area=documentValues.area;
                this.jr_area=documentValues.jr_area;
                this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
                this.searchJrCityCtrl.setValue(this.jr_area!=''?(documentValues.jr_city+' ('+this.jr_area+')'):documentValues.jr_city);
                
                // this.getStatusesList();
                this.getCompaniesPaymentAccounts();
                this.setJurElementsVisible();
                this.refreshPermissions();
                this.loadFilesInfo();
            },
            error => console.log(error)
        );
  }

  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }
  
  createNewDocument(){
    this.createdDockId=null;
    this.http.post('/api/auth/insertCompany', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Документ \"Предприятие\" успешно создан", "Закрыть");
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
    return this.http.post('/api/auth/updateCompany', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
                  this.getData();
                  this.openSnackBar("Документ \"Предприятие\" сохранён", "Закрыть");
          },
          error => console.log(error),
      );
  }
  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {this.receivedPriceTypesList=data as any [];
            this.refreshPermissions();
          },
          error => console.log(error)
      );
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}

  setJurElementsVisible(){
    let opf=+this.formBaseInformation.get('opf_id').value;
      if(opf==1){// выбран ИП
        this.viz_jr_jur=false;
        this.viz_jr_ip=true;
      } else if(opf==2){ //Выбран самозанятый или физлицо
        this.viz_jr_jur=false;
        this.viz_jr_ip=false;
      } else {//выбран юрлицо (ООО, ЗАО и др.)
        this.viz_jr_jur=true;
        this.viz_jr_ip=false;
      }
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
  checkEmptyCountryField(){
    if( this.formBaseInformation.get('country').value.length==0){
      this.formBaseInformation.get('country_id').setValue('');
      // this.formBaseInformation.get('region_id').setValue(null);
      // this.searchRegionCtrl.setValue('');
      // this.formBaseInformation.get('city_id').setValue(null);
      // this.searchCityCtrl.setValue('');
    }
  }
  checkEmptyJrCountryField(){
    if( this.formBaseInformation.get('jr_country').value.length==0){
      this.formBaseInformation.get('jr_country_id').setValue('');
      
      // this.formBaseInformation.get('jr_region_id').setValue(null);
      // this.searchJrRegionCtrl.setValue('');
      // this.formBaseInformation.get('jr_city_id').setValue(null);
      // this.searchJrCityCtrl.setValue('');
    }
  }
  copyfromJurAddressToAddress(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Копирование адреса',
        query: 'Скопировать адресные данные из юридического адреса (вкладка "Юридические данные")?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.formBaseInformation.get('zip_code').setValue(this.formBaseInformation.get('jr_zip_code').value);
        this.formBaseInformation.get('country_id').setValue(+this.formBaseInformation.get('jr_country_id').value);
        this.formBaseInformation.get('country').setValue(this.formBaseInformation.get('jr_country').value);
        this.formBaseInformation.get('region_id').setValue(this.formBaseInformation.get('jr_region_id').value);
        this.searchRegionCtrl.setValue(this.searchJrRegionCtrl.value);
        this.formBaseInformation.get('city_id').setValue(this.formBaseInformation.get('jr_city_id').value);
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
        head: 'Копирование адреса',
        query: 'Скопировать адресные данные из адреса (вкладка "Информация")?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.formBaseInformation.get('jr_zip_code').setValue(this.formBaseInformation.get('zip_code').value);
        this.formBaseInformation.get('jr_country_id').setValue(+this.formBaseInformation.get('country_id').value);
        this.formBaseInformation.get('jr_country').setValue(this.formBaseInformation.get('country').value);
        this.formBaseInformation.get('jr_region_id').setValue(this.formBaseInformation.get('region_id').value);
        this.searchJrRegionCtrl.setValue(this.searchRegionCtrl.value);
        this.formBaseInformation.get('jr_city_id').setValue(this.formBaseInformation.get('city_id').value);
        this.searchJrCityCtrl.setValue(this.searchCityCtrl.value);
        this.formBaseInformation.get('jr_street').setValue(this.formBaseInformation.get('street').value);
        this.formBaseInformation.get('jr_home').setValue(this.formBaseInformation.get('home').value);
        this.formBaseInformation.get('jr_flat').setValue(this.formBaseInformation.get('flat').value);
        this.formBaseInformation.get('jr_additional_address').setValue(this.formBaseInformation.get('additional_address').value);
      }});
  }
  //  -----------------------     ***** поиск по подстроке для Региона  ***    --------------------------
  onRegionSearchValueChanges(){
    this.searchRegionCtrl.valueChanges
    .pipe( 
      debounceTime(500),
      tap(() => {
        this.filteredRegions = [];}),       
      switchMap(fieldObject =>  
        this.getSpravSysRegions()))
    .subscribe(data => {
      this.isRegionListLoading = false;
      if (data == undefined) {
        this.filteredRegions = [];
      } else {
        this.filteredRegions = data as Region[];
  }});}
  onSelectRegion(id:number,country_id:number,country:string){
    this.formBaseInformation.get('region_id').setValue(+id);
    //если выбрали регион, а страна не выбрана
    if((this.formBaseInformation.get('country_id').value==null || this.formBaseInformation.get('country_id').value=='') && country_id>0){
      this.formBaseInformation.get('country_id').setValue(country_id);
      this.formBaseInformation.get('country').setValue(country);
    }
  }
  checkEmptyRegionField(){
    if(this.searchRegionCtrl.value.length==0){
      this.formBaseInformation.get('region_id').setValue();
      // this.formBaseInformation.get('city_id').setValue(null);
      // this.searchCityCtrl.setValue('');
  }};     
  getSpravSysRegions(){ //заполнение Autocomplete
    try {
      if(this.canRegionAutocompleteQuery && this.searchRegionCtrl.value.length>1){
        const body = {
          "searchString":this.searchRegionCtrl.value,
          "id":this.formBaseInformation.get('country_id').value};
        this.isRegionListLoading  = true;
        return this.http.post('/api/auth/getSpravSysRegions', body);
      }else return [];
    } catch (e) {
      return [];}}
  //--------------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Региона в юр. адресе  ***    --------------------------
  onJrRegionSearchValueChanges(){
    this.searchJrRegionCtrl.valueChanges
    .pipe( 
      debounceTime(500),
      tap(() => {
        this.filteredJrRegions = [];}),       
      switchMap(fieldObject =>  
        this.getSpravSysJrRegions()))
    .subscribe(data => {
      this.isJrRegionListLoading = false;
      if (data == undefined) {
        this.filteredJrRegions = [];
      } else {
        this.filteredJrRegions = data as Region[];
  }});}
  onSelectJrRegion(id:number,country_id:number,country:string){
    this.formBaseInformation.get('jr_region_id').setValue(+id);
    //если выбрали регион, а страна не выбрана
    if((this.formBaseInformation.get('jr_country_id').value==null || this.formBaseInformation.get('jr_country_id').value=='') && country_id>0){
      this.formBaseInformation.get('jr_country_id').setValue(country_id);
      this.formBaseInformation.get('jr_country').setValue(country);
    }
  }
  checkEmptyJrRegionField(){
    if(this.searchJrRegionCtrl.value.length==0){
      this.formBaseInformation.get('jr_region_id').setValue();
      // this.formBaseInformation.get('jr_city_id').setValue(null);
      // this.searchJrCityCtrl.setValue('');
  }};     
  getSpravSysJrRegions(){ //заполнение Autocomplete
    try {
      if(this.canJrRegionAutocompleteQuery && this.searchJrRegionCtrl.value.length>1){
    // console.log(111);

        const body = {
          "searchString":this.searchJrRegionCtrl.value,
          "id":this.formBaseInformation.get('jr_country_id').value};
          console.log(222);
        this.isJrRegionListLoading  = true;
        
        return this.http.post('/api/auth/getSpravSysRegions', body);
      }else return [];
    } catch (e) {
      return [];}}
  //---------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Города  ***    -----------------------------------
  onCitySearchValueChanges(){
    this.searchCityCtrl.valueChanges
    .pipe( 
      debounceTime(500),
      tap(() => {
        this.filteredCities = [];}),       
      switchMap(fieldObject =>  
        this.getSpravSysCities()))
    .subscribe(data => {
      this.isCityListLoading = false;
      if (data == undefined) {
        this.filteredCities = [];
      } else {
        this.filteredCities = data as City[];
  }});}

  onSelectCity(id:any,area:string,region_id:number,region:string,country_id:number,country:string){
    this.formBaseInformation.get('city_id').setValue(+id);
    this.area=area;
    if(area!=''){
      setTimeout(()=> {
        this.searchCityCtrl.setValue(this.searchCityCtrl.value+' ('+area+')'); 
      },200); 
    }//если выбрали город, а регион не выбран
    if((this.formBaseInformation.get('region_id').value==null || this.formBaseInformation.get('region_id').value=='') && region_id>0){//если у города есть регион и он не выбран - устанавливаем регион
      this.formBaseInformation.get('region_id').setValue(region_id);
      this.searchRegionCtrl.setValue(region);
    }//если выбрали регион, а страна не выбрана
    if((this.formBaseInformation.get('country_id').value==null || this.formBaseInformation.get('country_id').value=='') && country_id>0){//если у города есть страна и она не выбрана - устанавливаем страну
      this.formBaseInformation.get('country_id').setValue(country_id);
      this.formBaseInformation.get('country').setValue(country);
    }
  }
  checkEmptyCityField(){
    if(this.searchCityCtrl.value.length==0){
      this.formBaseInformation.get('city_id').setValue(null);
      this.area='';
  }};     
  getSpravSysCities(){ //заполнение Autocomplete
    try {
      if(this.canCityAutocompleteQuery && this.searchCityCtrl.value.length>1){
        const body = {
          "searchString":this.searchCityCtrl.value,
          "id":this.formBaseInformation.get('country_id').value,
          "id2":this.formBaseInformation.get('region_id').value}
        this.isCityListLoading  = true;
        return this.http.post('/api/auth/getSpravSysCities', body);
      }else return [];
    } catch (e) {
      return [];}}    

  //--------------------------------------------------------------------------------------------------------
  //---------------     ***** поиск по подстроке для Города в юр. адресе  ***    --------------------------
  onJrCitySearchValueChanges(){
    this.searchJrCityCtrl.valueChanges
    .pipe( 
      debounceTime(500),
      tap(() => {
        this.filteredJrCities = [];}),       
      switchMap(fieldObject =>  
        this.getSpravSysJrCities()))
    .subscribe(data => {
      this.isJrCityListLoading = false;
      if (data == undefined) {
        this.filteredJrCities = [];
      } else {
        this.filteredJrCities = data as City[];
  }});}
  onSelectJrCity(id:any,jr_area:string,region_id:number,region:string,country_id:number,country:string){
    this.formBaseInformation.get('jr_city_id').setValue(+id);
    this.jr_area=jr_area;
    if(jr_area!=''){
      setTimeout(()=> {
        this.searchJrCityCtrl.setValue(this.searchJrCityCtrl.value+' ('+jr_area+')'); 
      },200); 
    }//если выбрали город, а регион не выбран
    if((this.formBaseInformation.get('jr_region_id').value==null || this.formBaseInformation.get('jr_region_id').value=='') && region_id>0){//если у города есть регион и он не выбран - устанавливаем регион
      this.formBaseInformation.get('jr_region_id').setValue(region_id);
      this.searchJrRegionCtrl.setValue(region);
    }//если выбрали регион, а страна не выбрана
    if((this.formBaseInformation.get('jr_country_id').value==null || this.formBaseInformation.get('jr_country_id').value=='') && country_id>0){//если у города есть страна и она не выбрана - устанавливаем страну
      this.formBaseInformation.get('jr_country_id').setValue(country_id);
      this.formBaseInformation.get('jr_country').setValue(country);
    }
  }
  checkEmptyJrCityField(){
    if(this.searchJrCityCtrl.value.length==0){
      this.formBaseInformation.get('jr_city_id').setValue(null);
      this.jr_area='';
  }};     
  getSpravSysJrCities(){ //заполнение Autocomplete
    try {
      if(this.canJrCityAutocompleteQuery && this.searchJrCityCtrl.value.length>1){
        const body = {
          "searchString":this.searchJrCityCtrl.value,
          "id":this.formBaseInformation.get('jr_country_id').value,
          "id2":this.formBaseInformation.get('jr_region_id').value}
        this.isJrCityListLoading  = true;
        return this.http.post('/api/auth/getSpravSysCities', body);
      }else return [];
    } catch (e) {
      return [];}}    
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
    const body = {"id": this.id};
    return this.http.post('/api/auth/getCompaniesPaymentAccounts', body).subscribe(
        (data) => { resultContainer=data as any [];
                    this.fillPaymentAccountsArray(resultContainer);
                },
        error => console.log(error),
    );
  }
  fillPaymentAccountsArray(arr: any[]){
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as FormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
      id: m.id,
      bik: new FormControl (m.bik,[Validators.required,Validators.pattern('^[0-9]{9}$')]),
      name:  new FormControl (m.name,[Validators.required]),
      address:  new FormControl (m.address,[Validators.required]),
      payment_account:  new FormControl (m.payment_account,[Validators.required]),
      corr_account:  new FormControl (m.corr_account,[Validators.required]),
      output_order: this.getPaymentAccountsOutputOrder()
      }))
    })
  }
  addNewPaymentAccount() {
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as FormArray;
    add.push(this._fb.group({
      id: [],
      bik: new FormControl ('',[Validators.required,Validators.pattern('^[0-9]{9}$')]),
      name:  new FormControl ('',[Validators.required]),
      address:  new FormControl ('',[Validators.required]),
      payment_account:  new FormControl ('',[Validators.required]),
      corr_account:  new FormControl ('',[Validators.required]),
      output_order: this.getPaymentAccountsOutputOrder()
    }))
  }
  deletePaymentAccount(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление банковских реквизитов',
        query: 'Удалить карточку банковских реквизитов?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as FormArray;
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
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillPaymentAccountsArray(resultContainer);
    this.setPaymentAccountsOutputOrders();//после того как переставили контакты местами - нужно обновить их очередность вывода (output_order)
  }
  getPaymentAccountsOutputOrder(){//генерирует очередность для нового контакта
    const add = this.formBaseInformation.get('companiesPaymentAccountsTable') as FormArray; 
    return (add.length+1);
  }
  setPaymentAccountsOutputOrders(){//заново переустанавливает очередность у всех контактов (при перетаскивании)
    let i:number=1;
    this.formBaseInformation.get('companiesPaymentAccountsTable').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
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
            this.formBaseInformation.get('director_signature_filename').setValue("Файл выбран!");
            break;
          case 'glavbuh':
            this.formBaseInformation.get('glavbuh_signature_id').setValue(result[0]);
            this.formBaseInformation.get('glavbuh_signature_filename').setValue("Файл выбран!");
            break;
          case 'stamp':
            this.formBaseInformation.get('stamp_id').setValue(result[0]);
            this.formBaseInformation.get('stamp_filename').setValue("Файл выбран!");
            break;
          case 'card_template':
            this.formBaseInformation.get('card_template_id').setValue(result[0]);
            this.formBaseInformation.get('card_template_original_filename').setValue("Файл выбран!");
        }
      };
    });
  }
  deleteFileInField(option:string) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление файла',
        query: 'Вы подтверждаете удаление файла?',
        warning: 'Файл не будет удалён безвозвратно, он останется в библиотеке "Файлы".',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        switch(option) {
          case 'director':
            this.formBaseInformation.get('director_signature_id').setValue();
            this.formBaseInformation.get('director_signature_filename').setValue("Файл не добавлен");
            break;
          case 'glavbuh':
            this.formBaseInformation.get('glavbuh_signature_id').setValue();
            this.formBaseInformation.get('glavbuh_signature_filename').setValue("Файл не добавлен");
            break;
          case 'stamp':
            this.formBaseInformation.get('stamp_id').setValue();
            this.formBaseInformation.get('stamp_filename').setValue("Файл не добавлен");
            break;
          case 'card_template':
            this.formBaseInformation.get('card_template_id').setValue();
            this.formBaseInformation.get('card_template_filename').setValue("");
            this.formBaseInformation.get('card_template_original_filename').setValue("Файл не добавлен");
        }
      }
    });
  }
  addFilesToCompany(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id предприятия и id файлов 
            return this.http.post('/api/auth/addFilesToCompany', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Файлы добавлены", "Закрыть");
                    this.loadFilesInfo();
                            },
                  error => console.log(error),
              );
  }
  loadFilesInfo(){// загружает информацию по прикрепленным файлам
    const body = {"id":this.id};
          return this.http.post('/api/auth/getListOfCompanyFiles', body) 
            .subscribe(
                (data) => {  
                            this.filesInfo = data as any[]; 
                          },
                error => console.log(error),
            );
  }
  clickBtnDeleteFile(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление файла',
        query: 'Удалить файл из приёмки?',
        warning: 'Файл не будет удалён безвозвратно, он останется в библиотеке "Файлы".',
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
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.loadFilesInfo();
                },
        error => console.log(error),
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
              downloadLink.setAttribute('download', 'Карточка предприятия.docx');
          document.body.appendChild(downloadLink);
          downloadLink.click();
      },
      error => console.log(error),
    );  
  }
}
