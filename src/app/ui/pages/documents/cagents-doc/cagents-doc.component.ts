import { Component, OnInit , Inject, Optional, Output, LOCALE_ID, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormArray, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
// import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MutualpaymentDetComponent } from 'src/app/modules/info-modules/mutualpayment_det/mutualpayment_det.component';
import { translate } from '@ngneat/transloco'; //+++

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
  id: number;
  company: string;// предприятие, которому будет принадлежать документ
  company_id: number;// id предприятие, которому будет принадлежать документ
  creator: string; // создатель
  creator_id: number; //id создателя
  master: string; // мастер-аккаунт
  master_id: number; //id мастер-аккаунта
  changer:string;// кто изменил
  changer_id: number;// id кто изменил
  opf:string;//организационно-правовая форма предприятия
  // opf_id: number;//id организационно-правовая форма предприятия
  name: string; //наименование
  description: string;//описание
  date_time_changed: string;//дату изменения
  date_time_created: string;//дату создания
  cagent_categories: string[];//категории, которым принадлежит документ
  cagent_categories_id: number[];//id категории, которым принадлежит документ
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
  price_type_id: number;//тип цен, назначенный для контрагента
  discount_card: string;//номер дисконтной карты
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
}

interface CagentCategoriesTreeNode {
  id: string;
  name: string;
  children?: CagentCategoriesTreeNode[];
}
interface CagentCategoriesFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}
interface IdAndName{
  id: number;
  name: string;
}
interface IdAndName_ru{
  id: number;
  name_ru: string;
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
interface ContactsForm { //интерфейс для формы contactsForm, которых будет сосотоять массив contactsFormArray
  id:number;
  master_id: number;
  company_id: number;
  cagent_id: number;
  fio:string;
  position:string;
  telephone:string;
  email:string;
  additional:string;
  output_order: number;
}
// interface PaymentAccountsForm { //интерфейс для формы paymentAccountsForm, которых будет сосотоять массив paymentAccountsFormArray
//   id:number;
//   master_id: number;
//   company_id: number;
//   cagent_id: number;
//   bik:number;
//   name:string;
//   address:string;
//   corr_account:string;
//   payment_account:string;
// }

@Component({
  selector: 'app-cagents-doc',
  templateUrl: './cagents-doc.component.html',
  styleUrls: ['./cagents-doc.component.css'],
  providers: [LoadSpravService,CommonUtilitesService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})

export class CagentsDocComponent implements OnInit {
  id: number=0;// id документа
  createdDocId: number;// для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  myCompanyId:number=0;
  receivedSpravSysOPF: any [];//массив для получения данных справочника форм предприятий
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра карточки документа

  //поиск адреса и юр. адреса (Страна, Район, Город):
  // Страны 
  spravSysCountries: IdAndName_ru[] = [];// массив, куда будут грузиться все страны 
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
  // idAndName:IdAndName=<IdAndName>{};
  receivedStatusesList: statusInterface [] = []; // массив для получения списка статусов
  status_color: string = '';
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  selectedCagentCategory:any;//форма, содержащая информацию о выбранной категории товара (id, name)

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  rightsDefined:boolean; // определены ли права !!!
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан

  checkedList:any[]=[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов

  searchCagentGroupsCtrl = new UntypedFormControl();

  // *****  переменные tree  ***** 
  private _transformer = (node: CagentCategoriesTreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      id: node.id,
      level: level,
    };
  }
  treeControl = new FlatTreeControl<CagentCategoriesFlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: CagentCategoriesFlatNode) => node.expandable;
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;
  categoriesExpanded=false;//открыты или закрыты категории

  dateFrom = moment().startOf('year');   // дата С
  dateTo = moment();     // дата По

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  public MessageDialog: MatDialog,
  private _router:Router,
  private mutualpaymentDetDialog: MatDialog,
  public cu: CommonUtilitesService,
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private _fb: UntypedFormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  @Inject(LOCALE_ID) public locale: string,
  public ConfirmDialog: MatDialog,
  private _adapter: DateAdapter<any>) { 
    // console.log(this.activateRoute);
    if(activateRoute.snapshot.params['id'])
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      company: new UntypedFormControl      ('',[]),
      opf: new UntypedFormControl      ('',[]),
      name: new UntypedFormControl      ('',[Validators.required,Validators.maxLength(500)]),
      description: new UntypedFormControl      ('',[Validators.maxLength(1000)]),
      selectedCagentCategories:new UntypedFormControl      ([],[]),
      code: new UntypedFormControl      ('',[Validators.maxLength(30)]),
      telephone: new UntypedFormControl      ('',[Validators.maxLength(60)]),
      site:  new UntypedFormControl      ('',[Validators.maxLength(120)]),
      email:  new UntypedFormControl      ('',[Validators.maxLength(254)]),
      //фактический адрес:
      zip_code:  new UntypedFormControl      ('',[Validators.maxLength(40)]),
      country_id:  new UntypedFormControl      ('',[]),
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
      jr_country_id:  new UntypedFormControl      ('',[]),
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
      cagentsContactsTable: new UntypedFormArray ([]) ,
      cagentsPaymentAccountsTable: new UntypedFormArray ([]) ,
      
      country:  new UntypedFormControl      ('',[]),
      jr_country:  new UntypedFormControl      ('',[]),
      type:  new UntypedFormControl      ('entity',[]),// entity or individual
      legal_form:  new UntypedFormControl      ('',[Validators.maxLength(240)]),
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
    this.selectedCagentCategory = new UntypedFormGroup({
      selectedNodeId: new UntypedFormControl      ('',[]),
      SelectedNodeName: new UntypedFormControl      ('',[]),
    });
    this.checkedList = [];
    this.getSpravSysOPF();
    this.getSetOfPermissions();
    //+++ getting base data from parent component
    // this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  

    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.docId; this.formBaseInformation.get('id').setValue(this.id);}
    }

    //слушалки на изменение полей адреса
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
  get tinName(){ // TIN, ИНН, PIB e.t.c
    // if([47,212].includes(+this.formBaseInformation.get('jr_country_id').value)) // if USA or US virgin lands
    //   return 'tin'; 
    if([17,185].includes(+this.formBaseInformation.get('jr_country_id').value)) // if Montenegro, Serbia
      return 'pib';
    else return 'tin';
  }

  get vatName(){  // VAT, Tax ID, PDV e.t.c
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
    return this.http.get('/api/auth/getMyPermissions?id=12')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyCompanyId();
        },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
    );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==129)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==130)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==133)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==134)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==135)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==136)});
    
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    this.rightsDefined=true;//!!!
    // console.log("formBaseInformation.get('company_id').value - "+this.formBaseInformation.get('company_id').value);
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log(" - ");
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    return true;
  }
  
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
      if(+this.id>0){
        this.getDocumentValuesById();
      }else {
        this.getCompaniesList();
        this.getSpravSysCountries();
      }
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)//!!!!! отсюда загружаем настройки только если документ новый. Если уже создан - настройки грузятся из get<Document>ValuesById
      this.setDefaultCompany();
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
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getCRUD_rights();
  }

  setDefaultCompany(){
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
      this.getStatusesList();
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
    this.http.post('/api/auth/getCagentValues', docId)
        .subscribe(
              data => 
              { 
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                //!!!
                if(data!=null&&documentValues.company_id!=null){
                  this.formAboutDocument.get('id').setValue(+documentValues.id);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                  this.formBaseInformation.get('company').setValue(documentValues.company);
                  // this.formBaseInformation.get('opf_id').setValue(+documentValues.opf_id);
                  this.formBaseInformation.get('opf').setValue(documentValues.opf);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formBaseInformation.get('code').setValue(documentValues.code);
                  this.formBaseInformation.get('telephone').setValue(documentValues.telephone);
                  this.formBaseInformation.get('site').setValue(documentValues.site);
                  this.formBaseInformation.get('email').setValue(documentValues.email);
                  this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code);
                  this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
                  // this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
                  // this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
                  this.formBaseInformation.get('region').setValue(documentValues.region);
                  this.formBaseInformation.get('city').setValue(documentValues.city);
                  this.formBaseInformation.get('street').setValue(documentValues.street);
                  this.formBaseInformation.get('home').setValue(documentValues.home);
                  this.formBaseInformation.get('flat').setValue(documentValues.flat);
                  this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('price_type_id').setValue(documentValues.price_type_id);
                  this.formBaseInformation.get('discount_card').setValue(documentValues.discount_card);
                  this.formBaseInformation.get('jr_jur_full_name').setValue(documentValues.jr_jur_full_name);
                  this.formBaseInformation.get('jr_jur_kpp').setValue(documentValues.jr_jur_kpp);
                  this.formBaseInformation.get('jr_jur_ogrn').setValue(documentValues.jr_jur_ogrn);
                  this.formBaseInformation.get('jr_zip_code').setValue(documentValues.jr_zip_code);
                  this.formBaseInformation.get('jr_country_id').setValue(documentValues.jr_country_id);
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
                  this.formBaseInformation.get('type').setValue(documentValues.type);
                  this.formBaseInformation.get('legal_form').setValue(documentValues.legal_form);
                  // alert("1-"+this.checkedList)
                  this.checkedList=documentValues.cagent_categories_id?documentValues.cagent_categories_id:[];
                  // alert("2-"+this.checkedList)
                  this.searchRegionCtrl.setValue(documentValues.region);
                  this.searchJrRegionCtrl.setValue(documentValues.jr_region);
                  this.area=documentValues.area;
                  this.jr_area=documentValues.jr_area;
                  this.searchCityCtrl.setValue(this.area!=''?(documentValues.city+' ('+this.area+')'):documentValues.city);
                  this.searchJrCityCtrl.setValue(this.jr_area!=''?(documentValues.jr_city+' ('+this.jr_area+')'):documentValues.jr_city);
                  this.getStatusesList();
                  this.getPriceTypesList();
                  this.loadTrees();
                  this.getSpravSysCountries();
                  // this.setJurElementsVisible();
                  this.getCagentsContacts();
                  this.getCagentsPaymentAccounts();
                  
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
    this.formBaseInformation.get('selectedCagentCategories').setValue(this.checkedList);
    this.http.post('/api/auth/insertCagent', this.formBaseInformation.value)
    .subscribe(
    (data) =>   {
          let result=data as any;
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case -1:  {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
            default:{  
                        this.id=result;
                        this._router.navigate(['/ui/cagentsdoc', this.id]);
                        this.formBaseInformation.get('id').setValue(this.id);
                        this.rightsDefined=false; //!!!
                        this.getData();
                        this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
            }
          }
        },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
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

  updateDocument(){ // сохраняется в 2 захода - 1й сам док и категории, 2й - настраиваемые поля (если есть)
    this.formBaseInformation.get('selectedCagentCategories').setValue(this.checkedList);
    return this.http.post('/api/auth/updateCagents', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
                  this.getData();
                  this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }
  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {this.receivedPriceTypesList=data as any [];
          this.loadTrees();
          this.refreshPermissions();
          },
          error => console.log(error)
      );
  }
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}

    
  openDetailsWindow() {
    this.mutualpaymentDetDialog.open(MutualpaymentDetComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        cagentId: this.id,
        companyId: this.formBaseInformation.get('company_id').value,
        dateFrom:this.dateFrom,
        dateTo:this.dateTo,
        cagent:this.formBaseInformation.get('name').value,
        locale:this.locale,
      },
    });
  } 

  // setJurElementsVisible(){
  //   let opf=+this.formBaseInformation.get('opf_id').value;
  //     if(opf==1){// выбран ИП
  //       this.viz_jr_jur=false;
  //       this.viz_jr_ip=true;
  //     } else if(opf==2){ //Выбран самозанятый или физлицо
  //       this.viz_jr_jur=false;
  //       this.viz_jr_ip=false;
  //     } else {//выбран юрлицо (ООО, ЗАО и др.)
  //       this.viz_jr_jur=true;
  //       this.viz_jr_ip=false;
  //     }
  // }
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/

  loadTrees(){
    console.log("в Методе loadTrees");
    console.log("this.formBaseInformation.get('company_id').value - "+this.formBaseInformation.get('company_id').value);
    this.loadSpravService.getCagentCategoriesTrees(this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)

      }, error => console.log(error)
      );
  }

  loadTreesAndOpenNode(nodeId:number){
    //console.log("loadTrees and open node");
    this.loadSpravService.getCagentCategoriesTrees(this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.expandWayToNodeAndItsChildrensByIndex(this.getNodeIndexById(nodeId));
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)
      }, error => console.log(error)
    );
  }

  expandParents(node: any) {
    //console.log("expanding Carrots:"+node.name);
    const parent = this.getParent(node);
    if(parent){console.log("parent:"+parent.name);}
     this.treeControl.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(parent);
    }
  }  

  selectNode(node: any){
    console.log("node Id:"+node.id);
    this.selectedCagentCategory.selectedNodeId=node.id;
    this.selectedCagentCategory.selectedNodeName=node.name;
    //this.recountNumChildsOfSelectedCategory();
  }
  
  selectCheckboxesOfAllParents(node: any) {
    const parent = this.getParent(node);
    if (parent) {
      this.addCheckbox(this.getNodeId(parent)); //включает чекбокс у этого parent
      this.selectCheckboxesOfAllParents(parent);
    }
  }

  getNodeId(node: any):number{
    return(node.id);
  }

  getParent(node: any) {
    const currentLevel = this.treeControl.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    //console.log("currentLevel:"+currentLevel);
    const startIndex = this.treeControl.dataNodes.indexOf(node);
    //console.log("Index:"+startIndex);
    //цикл по уровню, пока не уменьшится
    //как только уменьшился, этот node и есть parent
    for (let i = startIndex; i >= 0; i--) {
      let currentNode:any = this.treeControl.dataNodes[i];
      if (this.treeControl.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }

  getNodeIndexById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return i;
      }
    }
  }

  getNodeById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return this.treeControl.dataNodes[i];
      }
    }
  }

  expandWayToNodeAndItsChildrensByIndex(index: any) {
  // взять node по индексу
    let currentNode:any = this.treeControl.dataNodes[index];
    //console.log("currentNode:"+currentNode.name);
    this.expandParents(currentNode);
    this.treeControl.expand(currentNode);
  } 

  recountNumRootCategories(){//считает количество корневых категорий
  this.numRootCategories=0;
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.treeControl.dataNodes[i].level==0){
        this.numRootCategories++;
      }
    }
    // console.log("this.numRootCategories: "+this.numRootCategories);
  }

  expandAllCheckedNodes(){
    for (let i = 0; i < this.checkedList.length; i++) {
      this.expandParents(this.getNodeById(this.checkedList[i]));
    }
  }

  collapseAllNodes(){
    this.treeControl.collapseAll();
  }

//*****************************************************************************************************************************************/
//******************************************          C H E C K B O X E S       ***********************************************************/
//*****************************************************************************************************************************************/

  isSelectedCheckbox(id: number){
    // alert(this.checkedList)
    if(this.checkedList.includes(id))
      return true;
    else return false; 
  }

  addCheckbox(id:number){ // добавляет включенный чекбокс в дерево. Если он уже включен - не выключает его
    if(!this.checkedList.includes(id)) this.checkedList.push(id);
  } 

  clickTableCheckbox(id:number){
    if(this.checkedList.includes(id)){
      this.checkedList.splice(this.checkedList.indexOf(id),1);
    }else this.checkedList.push(id);
    console.log("checkedList - "+this.checkedList);
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
        // this.searchRegionCtrl.setValue(this.searchJrRegionCtrl.value);
        this.formBaseInformation.get('region').setValue(this.formBaseInformation.get('jr_region').value);
        // this.formBaseInformation.get('city_id').setValue(this.formBaseInformation.get('jr_city_id').value);
        // this.searchCityCtrl.setValue(this.searchJrCityCtrl.value);
        this.formBaseInformation.get('city').setValue(this.formBaseInformation.get('jr_city').value);
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
        // this.searchJrRegionCtrl.setValue(this.searchRegionCtrl.value);
        this.formBaseInformation.get('jr_region').setValue(this.formBaseInformation.get('region').value);
        // this.formBaseInformation.get('jr_city_id').setValue(this.formBaseInformation.get('city_id').value);
        // this.searchJrCityCtrl.setValue(this.searchCityCtrl.value);
        this.formBaseInformation.get('jr_city').setValue(this.formBaseInformation.get('city').value);
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
  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,12) //12 - id документа из таблицы documents
            .subscribe(
                (data) => {this.receivedStatusesList=data as statusInterface[];
                  if(this.id==0){
                    this.setDefaultStatus();
                  }
                  this.setStatusColor();},
                error => console.log(error)
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
    this.getPriceTypesList();
  }
  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.formBaseInformation.get('status_id').value){
          this.status_color=m.color;
        }
      });
      console.log(' this.status_color = '+ this.status_color);
  }

//-------------------------- К О Н Т А К Т Н Ы Е   Л И Ц А   -------------------------------
  getCagentsContacts(){
    let resultContainer: any[];
    const body = {"id": this.id};
    return this.http.get('/api/auth/getCagentsContacts?id='+this.id).subscribe(
        (data) => { resultContainer=data as any [];
                    this.fillContactsArray(resultContainer);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  fillContactsArray(arr: any[]){
    const add = this.formBaseInformation.get('cagentsContactsTable') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
        id: m.id,
        fio: m.fio,
        position: m.position,
        telephone: m.telephone,
        email: m.email,
        additional: m.additional,
        output_order: m.output_order
      }))
    })
  }
  addNewContact() {
    const add = this.formBaseInformation.get('cagentsContactsTable') as UntypedFormArray;
    add.push(this._fb.group({
      id: [],
      fio: [],
      position: [],
      telephone: [],
      email: [],
      additional: [],
      output_order: this.getContactsOutputOrder()
    }))
  }
  deleteContact(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_cntct'),
        query: translate('docs.msg.del_cntct_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('cagentsContactsTable') as UntypedFormArray;
        add.removeAt(index);
        this.setContactsOutputOrders();
      }
    });    

   
  }
  dropContact(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании контакта
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: any[] = [];
    this.formBaseInformation.get('cagentsContactsTable').controls.forEach(m =>{
                      resultContainer.push({
                        id: m.get('id').value,
                        fio: m.get('fio').value,
                        position: m.get('position').value,
                        telephone: m.get('telephone').value,
                        email: m.get('email').value,
                        additional: m.get('additional').value,
                        output_order: m.get('output_order').value,
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillContactsArray(resultContainer);
    this.setContactsOutputOrders();//после того как переставили контакты местами - нужно обновить их очередность вывода (output_order)
  }
  getContactsOutputOrder(){//генерирует очередность для нового контакта
    const add = this.formBaseInformation.get('cagentsContactsTable') as UntypedFormArray; 
    return (add.length+1);
  }
  setContactsOutputOrders(){//заново переустанавливает очередность у всех контактов (при перетаскивании)
    let i:number=1;
    this.formBaseInformation.get('cagentsContactsTable').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
  }
//-------------------------- Б А Н К О В С К И Е   Р Е К В И З И Т Ы  -------------------------------
  getCagentsPaymentAccounts(){
    let resultContainer: any[];
    return this.http.get('/api/auth/getCagentsPaymentAccounts?id='+this.id).subscribe(
        (data) => { resultContainer=data as any [];
                    this.fillPaymentAccountsArray(resultContainer);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  fillPaymentAccountsArray(arr: any[]){
    const add = this.formBaseInformation.get('cagentsPaymentAccountsTable') as UntypedFormArray;
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
    const add = this.formBaseInformation.get('cagentsPaymentAccountsTable') as UntypedFormArray;
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
        const add = this.formBaseInformation.get('cagentsPaymentAccountsTable') as UntypedFormArray;
    add.removeAt(index);
    this.setPaymentAccountsOutputOrders();
      }
    });    
  }
  dropPaymentAccount(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании контакта
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: any[] = [];
    this.formBaseInformation.get('cagentsPaymentAccountsTable').controls.forEach(m =>{
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
    const add = this.formBaseInformation.get('cagentsPaymentAccountsTable') as UntypedFormArray; 
    return (add.length+1);
  }
  setPaymentAccountsOutputOrders(){//заново переустанавливает очередность у всех контактов (при перетаскивании)
    let i:number=1;
    this.formBaseInformation.get('cagentsPaymentAccountsTable').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
  }

  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }


}
