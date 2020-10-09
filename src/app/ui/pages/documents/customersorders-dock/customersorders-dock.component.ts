import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { ProductsDockComponent } from '../products-dock/products-dock.component';
import { MatDialog } from '@angular/material/dialog';
// import { FilesComponent } from '../files/files.component';
// import { FilesDockComponent } from '../files-dock/files-dock.component';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MessageDialog} from 'src/app/ui/dialogs/messagedialog.component';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
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
interface dockResponse {//интерфейс для получения ответа в методе getCustomersOrdersValuesById
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
  nds: boolean;
  cagent: string;
  cagent_id: string;
  nds_included: boolean;
  changer_id: string;
  doc_number: string;
  shipment_date: string;//планируемая дата отгрузки
  date_time_changed: string;
  date_time_created: string;
  description : string;
  // overhead: string;
  is_archive: boolean;
  department_type_price_id: number;
  cagent_type_price_id: number;
  name: string;
  status_id: string;
  status_name: string;
  status_color: string;
  status_description: string;
  fio: string;
  email: string;
  telephone: string;
  zip_code: string;
  country_id: string;
  region_id: string;
  city_id: string;
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

interface TableFields { //интерфейс для формы, массив из которых будет содержать форма myForm, которая будет отправляться на сохранение списка товаров
  product_id: number;
  customersorders_id:number;
  name: string;
  product_count: number;
  edizm: string;
  edizm_id: number;
  product_price: number;
  product_sumprice: number;
  additional: string;
  price_type: string;
  price_type_id: number;
  nds: string;
  nds_id: number;
}

interface filesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
}

interface productSearchResponse{//интерфейс получения данных из бд 
  id:number;
  name: string;
  edizm_id:number;
  filename:string;
  nds_id:number;
}

interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface idNameDescription{
  id: string;
  name: string;
  description: string;
}
interface idAndNameAndShorname{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  short_name: string;
}
interface shortInfoAboutProduct{//интреф. для получения инфо о состоянии товара в отделении (кол-во, последняя поставка), и средним ценам (закупочной и себестоимости) товара
  quantity:number;
  change:number;
  avg_purchase_price:number;
  avg_netcost_price:number;
  last_purchase_price:number;
  department_sell_price:number;
  department_type_price:string;
  date_time_created:string;
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

@Component({
  selector: 'app-customersorders-dock',
  templateUrl: './customersorders-dock.component.html',
  styleUrls: ['./customersorders-dock.component.css'],
  providers: [LoadSpravService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})

export class CustomersordersDockComponent implements OnInit {

  id: number = 0;// id документа
  createdDockId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedUsersList  : any [];//массив для получения списка пользователей
  myCompanyId:number=0;
  spravSysEdizmOfProductAll: idAndNameAndShorname[] = [];// массив, куда будут грузиться все единицы измерения товара
  allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  productSearchResponse: productSearchResponse[] = [];// массив для найденных через форму поиска formSearch товаров
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  myId:number=0;
  creatorId:number=0;
  shortInfoAboutProduct: shortInfoAboutProduct = null; //получение краткого инфо по товару
  shortInfoAboutProductArray: any[] = []; //получение краткого инфо по товару
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  department_type_price_id: number; //тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  cagent_type_price_id: number; //тип цены в покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  selected_type_price_id: number; //тип цены, выбранный в форме поиска. Нужен для восстановления выбранного типа цены при сбросе формы поиска товара
  spravSysNdsSet: idAndName[] = []; //массив имен и id для ндс 
  is_addingNewCagent: boolean = false; // при создании документа создаём нового получателя (нет) или ищем уже имеющегося (да)
  priorityTypePriceSide: string = 'sklad';// приоритет типа цены: Склад (sklad) или Покупатель (cagent)
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

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  public myForm: FormGroup; //форма с массивом форм для накопления информации о товаре
  tableFields: TableFields; //форма, из которой будет состоять массив myForm

  //для Autocomplete по поиску товаров
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в myForm в качестве элемента массива
  searchProductCtrl = new FormControl();//поле для поиска товаров
  isProductListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredProducts: productSearchResponse[] = [];
  productImageName:string = null;
  mainImageAddress:string = '../../../../../../assets/images/no_foto.jpg';
  thumbImageAddress:string = '../../../../../../assets/images/no_foto.jpg';

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

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

  displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','price_type','nds','additional','delete'];
  @ViewChild("countInput", {static: false}) countInput;
  @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("doc_number", {static: false}) doc_number; 
  @ViewChild("form", {static: false}) form; 
  edizmName:string='';//наименование единицы измерения
  formSearchReadOnly=false;
  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  is_completed=false;

  //для поиска контрагента (получателя) по подстроке
  searchCagentCtrl = new FormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;

  constructor(private activateRoute: ActivatedRoute,
    private _fb: FormBuilder, //чтобы билдить группу форм myForm
    private http: HttpClient,
    public ShowImageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    public dialogAddFiles: MatDialog,
    public dialogCreateProduct: MatDialog,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar) 
    {this.id = +activateRoute.snapshot.params['id'];}

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl                 (this.id,[]),
      company_id: new FormControl         ('',[Validators.required]),
      department_id: new FormControl      ('',[Validators.required]),
      doc_number: new FormControl         ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      cagent_id: new FormControl          ({disabled: false, value: '' },[Validators.required]),
      cagent: new FormControl             ('',[]),
      shipment_date: new FormControl      ('',[Validators.required]),
      description: new FormControl        ('',[]),
      department: new FormControl         ('',[]),
      is_completed: new FormControl       (false,[]),
      CustomersOrdersProductTable: new FormArray([]),
      nds: new FormControl                (false,[]),
      nds_included: new FormControl       (true,[]),
      name: new FormControl               ('',[]),
      status_id: new FormControl          ('',[Validators.required]),
      status_name: new FormControl        ('',[]),
      status_color: new FormControl       ('',[]),
      status_description: new FormControl ('',[]),
      fio: new FormControl                ('',[]),
      email: new FormControl              ('',[]),
      telephone: new FormControl          ('',[]),
      zip_code: new FormControl           ('',[]),
      country_id: new FormControl         ('',[]),
      region_id: new FormControl          ('',[]),
      city_id: new FormControl            ('',[]),
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
    
    this.formSearch = new FormGroup({
      product_id: new FormControl               ('',[Validators.required]),
      customersorders_id: new FormControl              ('',[]),
      product_count: new FormControl            ('',[Validators.required,Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price: new FormControl            ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new FormControl         (0,[]),
      price_type_id: new FormControl              (0,[]),
      edizm_id: new FormControl                 (0,[]),
      additional: new FormControl               ('',[]),
      nds_id: new FormControl                   ('',[Validators.required]),
    });

    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Получатель"
    this.getSetOfPermissions();//
    this.getSpravSysNds();
    // ->getMyId()
    // ->getMyCompanyId()
    // ->getMyDepartmentsList()
    // ->getCRUD_rights()
    // ->getData()------>(если созданный док)---> this.getDocumentValuesById(); --> refreshPermissions()     
    // ->(если новый док):
    // ->getCompaniesList() 
    // ->setDefaultCompany()
    // ->getDepartmentsList()
    // ->setDefaultDepartment()
    // ->getStatusesList()
    // ->setDefaultStatus()
    // ->refreshPermissions() 
    //
    this.myForm = this._fb.group({
      tableFields: this._fb.array([])
    });

    //слушалки на изменение полей адреса
    this.filteredSpravSysCountries=this.formBaseInformation.get('country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_country(value)));
    this.onRegionSearchValueChanges();
    this.onCitySearchValueChanges();

  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

getSetOfPermissions(){
  const body = {"documentId": 23};//23= Заказы клиентов 
           return this.http.post('/api/auth/giveMeMyPermissions', body) 
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => console.log(error),
    );
}

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==280)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==281)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==282)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==287)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==288)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==289)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==290)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==291)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==292)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==293)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==294)});

    this.getData();
  }

  refreshPermissions():boolean{
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
    
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
      this.visBtnUpdate = this.allowToUpdate;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
    
  this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
  console.log("myCompanyId - "+this.myCompanyId);
  console.log("documentOfMyCompany - "+documentOfMyCompany);
  console.log("allowToView - "+this.allowToView);
  console.log("allowToUpdate - "+this.allowToUpdate);
  console.log("allowToCreate - "+this.allowToCreate);
  return true;

}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
      this.getProductTable();
    }else {
      this.getCompaniesList();
      this.setDefaultDate();
      this.getSpravSysCountries();
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

  getMyId(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => console.log(error)
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getMyDepartmentsList();
      }, error => console.log(error));
  }
  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.getCRUD_rights(this.permissionsSet);;},
                error => console.log(error)
            );
  }
  getCompaniesList(){
    console.log("getCompaniesList");
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.doFilterCompaniesList();
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }
  setDefaultCompany(){
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
      this.getDepartmentsList();
  }
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.formBaseInformation.get('department_id').setValue('');
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                    this.doFilterDepartmentsList();
                    this.setDefaultDepartment();},
                error => console.log(error)
            );
  }
  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      let depId:number;
      this.receivedDepartmentsList.forEach(data =>{depId=+data.id;});
      this.formBaseInformation.get('department_id').setValue(depId);
    }
    this.getStatusesList();
  }

  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,23) //23 - id предприятия из таблицы documents
            .subscribe(
                (data) => {this.receivedStatusesList=data as statusInterface[];
                  if(this.id==0){this.setDefaultStatus();}},
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
    this.setStatusColor();
    this.getSpravSysEdizm(); //загрузка единиц измерения. Загружаем тут, т.к. нужно чтобы сначала определилось предприятие, его id нужен для загрузки
    this.refreshPermissions();
  }

  getSpravSysEdizm():void {    
    let companyId=+this.formBaseInformation.get('company_id').value;
    this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5)"})  // все типы ед. измерения
    .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
            },
    error => console.log(error));
  }

  setDefaultDate(){
    this.formBaseInformation.get('shipment_date').setValue(moment());
  }
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }
  doFilterDepartmentsList(){
    console.log('doFilterDepartmentsList');
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }
  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    console.log('inMyDepthsId');
    let inMyDepthsId:boolean = false;
    this.receivedMyDepartmentsList.forEach(myDepth =>{
      myDepth.id==id?inMyDepthsId=true:null;
    });
  return inMyDepthsId;
  }
  searchOrCreateNewCagent(is_adding:boolean){
    this.is_addingNewCagent=is_adding;
    if(is_adding){
      this.formBaseInformation.get('cagent_id').disable();
      this.formBaseInformation.get('new_cagent').enable();
      this.formBaseInformation.get('new_cagent').setValue(this.searchCagentCtrl.value);
    } else{
      this.formBaseInformation.get('cagent_id').enable();
      this.formBaseInformation.get('new_cagent').disable();
    }
  }
  //  -------------     ***** поиск по подстроке для поставщика ***    --------------------------
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
    this.getCagentValuesById(id);
  }
  getCagentValuesById(id:number){
    const body = {"id": id};
      this.http.post('/api/auth/getCagentValues', body).subscribe(
        data => { 
            let documentValues: dockResponse=data as any;

            this.formBaseInformation.get('telephone').setValue(documentValues.telephone);
            this.formBaseInformation.get('email').setValue(documentValues.email);
            this.formBaseInformation.get('zip_code').setValue(documentValues.zip_code);
            this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
            this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
            this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
            this.formBaseInformation.get('street').setValue(documentValues.street);
            this.formBaseInformation.get('home').setValue(documentValues.home);
            this.formBaseInformation.get('flat').setValue(documentValues.flat);
            this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address);
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
        },
        error => console.log(error)
    );
  }

  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('cagent_id').setValue();
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
    } catch (e) {
      return [];}}
  //-------------------------------------------------------------------------------
  //--------------------------------------- **** поиск по подстроке для товара  ***** ------------------------------------
  onProductSearchValueChanges(){
    this.searchProductCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredProducts = [];
      }),       
      switchMap(fieldObject =>  
        this.getProductsList())
    ).subscribe(data => {
      this.isProductListLoading = false;
      if (data == undefined) {
        this.filteredProducts = [];
      } else {
        this.filteredProducts = data as any;
        if(this.filteredProducts.length==1){
          this.onAutoselectProduct();
      }}});
  }

  onAutoselectProduct(){
    this.canAutocompleteQuery=false;
    this.formSearch.get('product_count').setValue('1');
    this.formSearch.get('product_id').setValue(+this.filteredProducts[0].id);
    this.searchProductCtrl.setValue(this.filteredProducts[0].name);
    this.formSearch.get('nds_id').setValue(+this.filteredProducts[0].nds_id);
    this.formSearch.get('edizm_id').setValue(+this.filteredProducts[0].edizm_id);
    this.productImageName = this.filteredProducts[0].filename;
    this.afterSelectProduct();
  }

  onSelectProguct(product:productSearchResponse){
    this.formSearch.get('product_count').setValue('1');
    this.formSearch.get('product_id').setValue(+product.id);
    this.formSearch.get('edizm_id').setValue(+product.edizm_id);
    this.formSearch.get('nds_id').setValue(+this.filteredProducts[0].nds_id);
    this.productImageName = product.filename;
    this.afterSelectProduct();
  }
  afterSelectProduct(){
    this.edizmName=this.getEdizmNameBySelectedId(+this.formSearch.get('edizm_id').value);
    this.formSearchReadOnly=true;
    this.loadMainImage();
    this.getShortInfoAboutProduct();
    setTimeout(() => { this.countInput.nativeElement.focus(); }, 500);
  }
  productTableRecount(){
    //перерасчет НДС в форме поиска
    if(+this.formSearch.get('product_id').value) this.calcSumPriceOfProduct();
    //перерасчет НДС в таблице товаров
    if(this.myForm.controls['tableFields'].value.length>0){
      let switcherNDS:boolean = this.formBaseInformation.get('nds').value;
      let switcherNDSincluded:boolean = this.formBaseInformation.get('nds_included').value;
      let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
      // let KZ:number = 0; //коэффициент затрат, равер делению расходов на итоговую сумму
      this.myForm.value.tableFields.map(i => 
        {
          multiplifierNDS = this.getNdsMultiplifierBySelectedId(+i['nds_id']);
          if(switcherNDS && !switcherNDSincluded){//если включён переключатель "НДС", но переключатель "НДС включена" выключен,
          //..к сумме добавляем НДС
            i['product_sumprice']=((+i['product_count'])*(+i['product_price'])*multiplifierNDS).toFixed(2).toString().replace(".00", "");
          }else  i['product_sumprice']=((+i['product_count'])*(+i['product_price'])).toFixed(2).toString().replace(".00", "");//..иначе не добавляем, и сумма - это просто произведение количества на цену
        });
    }
  }
  getShortInfoAboutProduct(){
    const dockId = {
      "id1": this.formBaseInformation.get('department_id').value,
      "id2": this.formSearch.get('product_id').value,
      "id3": this.formSearch.get('price_type_id').value,
    };
    this.http.post('/api/auth/getShortInfoAboutProduct', dockId)
      .subscribe(
          data => { 
            this.shortInfoAboutProduct=data as any;
            this.shortInfoAboutProductArray[0]=this.shortInfoAboutProduct.quantity;
            this.shortInfoAboutProductArray[1]=this.shortInfoAboutProduct.change;
            this.shortInfoAboutProductArray[2]=this.shortInfoAboutProduct.date_time_created;
            this.shortInfoAboutProductArray[3]=this.shortInfoAboutProduct.avg_purchase_price;
            this.shortInfoAboutProductArray[4]=this.shortInfoAboutProduct.avg_netcost_price;
            this.shortInfoAboutProductArray[5]=this.shortInfoAboutProduct.last_purchase_price;
            this.shortInfoAboutProductArray[6]=this.shortInfoAboutProduct.department_type_price;
            this.shortInfoAboutProductArray[7]=this.shortInfoAboutProduct.department_sell_price;
            this.setPrice(+this.shortInfoAboutProductArray[7]>0?this.shortInfoAboutProductArray[7]:0);
            this.calcSumPriceOfProduct();
          },
          error => console.log(error)
      );
  }
  checkEmptyProductField(){
    if(this.searchProductCtrl.value.length==0){
      this.resetFormSearch();
    }
  };    
  onPriceTypeSelection(){
    this.selected_type_price_id = +this.formSearch.get('price_type_id').value;
    // this.priorityTypePriceSide = тут закончил пока
    if(+this.formSearch.get('product_id').value>0){//если товар в форме поиска выбран
      this.getShortInfoAboutProduct();
    }
    
  }
  resetFormSearch(){
      this.formSearchReadOnly=false;
      this.nameInput.nativeElement.focus();
      this.searchProductCtrl.setValue('');
      this.edizmName='';
      //this.formSearch.get('product_price').setValue('');
      // console.log('Количество товара - ' + this.formSearch.get('product_count').value);
      this.thumbImageAddress="../../../../../../assets/images/no_foto.jpg";      
      this.mainImageAddress="";
      this.productImageName=null;
      this.form.resetForm();//реализовано через ViewChild: @ViewChild("form", {static: false}) form; + В <form..> прописать #form="ngForm"
      this.formSearch.get('price_type_id').setValue(+this.selected_type_price_id);
      this.formSearch.get('product_count').setValue('');

      this.calcSumPriceOfProduct();//иначе неправильно будут обрабатываться проверки формы
  }

  getEdizmNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysEdizmOfProductAll.forEach(a=>{
      if(+a.id == srchId) {name=a.short_name}
    }); return name;}
  
  getProductsList(){ //заполнение Autocomplete для поля Товар
    try 
    {
      if(this.canAutocompleteQuery && this.searchProductCtrl.value.length>1)
      {
        const body = {
          "searchString":this.searchProductCtrl.value,
          "companyId":this.formBaseInformation.get('company_id').value,
          "departmentId":this.formBaseInformation.get('department_id').value};
        this.isProductListLoading  = true;
        return this.http.post('/api/auth/getProductsList', body);
      }else return [];
    } catch (e) {
      return [];
    }
  }
  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.formBaseInformation.get('company_id').value)
            .subscribe(
                (data) => {this.receivedPriceTypesList=data as any [];
                  if((this.department_type_price_id>0 && this.cagent_type_price_id>0)){//оба типа цен, и склада, и покупателя, не равны 0, т.е. выбраны
                    switch (this.priorityTypePriceSide) {//проверяем дефолтную приоритетную цену
                      case 'sklad'://если SKLAD - в поле Тип цены выставляем тип цены склада
                        this.formSearch.get('price_type_id').setValue(this.department_type_price_id);
                        break;
                      default:// //если CAGENT - в поле Тип цены выставляем тип цены контрагента (покупателя)
                        this.formSearch.get('price_type_id').setValue(this.cagent_type_price_id);
                    }
                    console.log("this.formSearch.get('price_type_id').value - "+this.formSearch.get('price_type_id').value);
                    } else if(this.department_type_price_id>0 && this.cagent_type_price_id==0) {//цена отделения (склада) выбрана, а у покупателя нет
                      this.formSearch.get('price_type_id').setValue(this.department_type_price_id);// в поле Тип цены выставляем тип цены склада
                    } else if(this.department_type_price_id==0 && this.cagent_type_price_id>0) {//цена покупателя выбрана, а у отделения (склада)  нет
                      this.formSearch.get('price_type_id').setValue(this.cagent_type_price_id);//в поле Тип цены выставляем тип цены контрагента (покупателя)
                    } else {// и если ни у кого не выбран тип цены - ставим первую в списке
                      this.formSearch.get('price_type_id').setValue(this.receivedPriceTypesList[0].id);
                    }
                    this.selected_type_price_id=this.formSearch.get('price_type_id').value;
                },
                error => console.log(error)
            );
  }
  loadMainImage(){
    if(this.productImageName!=null){
      this.mainImageAddress="/api/public/getProductImage/"+this.productImageName;
      this.thumbImageAddress="/api/public/getProductThumb/"+this.productImageName;
    } else {this.mainImageAddress="";
            this.thumbImageAddress="../../../../../../assets/images/no_foto.jpg";}
  }

  showImage(name:string){
    if(this.productImageName!=null){
      console.log("productImageName - "+this.productImageName);
      const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
        data:
        { 
          link: name,
        },
      });
    }
  }

  getDocumentValuesById(){
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getCustomersOrdersValuesById', dockId)
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
                this.formBaseInformation.get('region_id').setValue(documentValues.region_id);
                this.formBaseInformation.get('city_id').setValue(documentValues.city_id);
                this.formBaseInformation.get('country_id').setValue(documentValues.country_id);
                this.formBaseInformation.get('street').setValue(documentValues.street);
                this.formBaseInformation.get('home').setValue(documentValues.home);
                this.formBaseInformation.get('flat').setValue(documentValues.flat);
                this.formBaseInformation.get('additional_address').setValue(documentValues.additional_address);
                this.formBaseInformation.get('track_number').setValue(documentValues.track_number);
                this.formBaseInformation.get('country').setValue(documentValues.country);
                this.formBaseInformation.get('region').setValue(documentValues.region);
                this.formBaseInformation.get('city').setValue(documentValues.city);
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
                // this.selected_type_price_id=this.department_type_price_id;
                this.creatorId=+documentValues.creator_id;
                this.searchCagentCtrl.setValue(documentValues.cagent);
                this.is_completed=documentValues.is_completed;
                console.log('status_color - ' + this.formBaseInformation.get('status_color').value);
                this.getSpravSysEdizm();
                this.getPriceTypesList();
                this.getStatusesList();
                this.getSpravSysCountries();
                this.hideOrShowNdsColumn();
                this.refreshPermissions();
            },
            error => console.log(error)
        );
  }

  getProductTable(){
    let ProductsTable: TableFields[]=[];
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getCustomersOrdersProductTable', dockId)
        .subscribe(
            data => { 
                ProductsTable=data as any;
                if(ProductsTable.length>0){
                  console.log("length>0");
                  this.myForm = this._fb.group({tableFields: this._fb.array([])});//сбрасываем иначе при сохранении будут прибавляться дубли
                  const control = <FormArray>this.myForm.controls['tableFields'];
                  ProductsTable.forEach(row=>{
                  console.log("row - "+row);
                  control.push(this.formingProductRowFromApiResponse(row));
                  });
                }
            },
            error => console.log(error)
        );
  }

  getSpravSysNds(){
            return this.http.post('/api/auth/getSpravSysNds', {}) 
        .subscribe((data) => {this.spravSysNdsSet=data as any[];},
        error => console.log(error));}

  getNdsNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysNdsSet.forEach(a=>{
      if(+a.id == srchId) {name=a.name}
    }); return name;}
  getPriceTypeNameBySelectedId(srchId:number):string {
    let name='';
    this.receivedPriceTypesList.forEach(a=>{
      if(+a.id == srchId) {name=a.name}
    }); return name;}
  getNdsMultiplifierBySelectedId(srchId:number):number {
  //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
      let value=0;
      this.spravSysNdsSet.forEach(a=>{
        if(+a.id == srchId) {value=(a.name.includes('%')?(+a.name.replace('%','')):0)/100+1}
      }); return value;}        

  calcSumPriceOfProduct(){
    let switcherNDS:boolean = this.formBaseInformation.get('nds').value;
    let switcherNDSincluded:boolean = this.formBaseInformation.get('nds_included').value;
    let selectedNDS:number = this.getNdsMultiplifierBySelectedId(+this.formSearch.get('nds_id').value)

    this.formSearch.get('product_count').setValue((this.formSearch.get('product_count').value!=null?this.formSearch.get('product_count').value:'').replace(",", "."));
    this.formSearch.get('product_price').setValue((this.formSearch.get('product_price').value!=null?this.formSearch.get('product_price').value:'').replace(",", "."));
    this.formSearch.get('product_sumprice').setValue(
      ((+this.formSearch.get('product_count').value)*(+this.formSearch.get('product_price').value))
      );
    // this.formSearch.get('product_sumprice').setValue(+this.formSearch.get('product_sumprice').value.toFixed(2));
    //если включён переключатель "НДС", но переключатель "НДС включена" выключен, нужно добавить к цене НДС значение, выбранное в выпадающем списке формы поиска товара
    if(switcherNDS && !switcherNDSincluded) 
    {this.formSearch.get('product_sumprice').setValue(+this.formSearch.get('product_sumprice').value*selectedNDS);}
    this.formSearch.get('product_sumprice').setValue(this.formSearch.get('product_sumprice').value.toFixed(2))
  }

  getTotalProductCount() {
    return  (this.myForm.value.tableFields.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() {
    return  (this.myForm.value.tableFields.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}

  formingProductRowFromApiResponse(row: TableFields) {
    return this._fb.group({
      product_id: [row.product_id],
      customersorders_id: [row.customersorders_id],
      name: [row.name],
      product_count: [row.product_count],
      edizm: [row.edizm],
      edizm_id: [row.edizm_id],
      product_price: [row.product_price],
      product_sumprice: [row.product_sumprice],
      price_type: [row.price_type],
      price_type_id: [row.price_type_id],
      nds: [row.nds],
      nds_id: [row.nds_id],
      additional: [row.additional],
    });
  }

  //формирование строки таблицы с товарами для заказа клиента из формы поиска товара
  formingProductRowFromSearchForm() {
    return this._fb.group({
      product_id: [+this.formSearch.get('product_id').value],
      customersorders_id: [+this.id],
      name: [this.searchProductCtrl.value],
      product_count: [+this.formSearch.get('product_count').value],
      edizm: [this.edizmName],
      edizm_id: [+this.formSearch.get('edizm_id').value],
      product_price: [+this.formSearch.get('product_price').value],
      product_sumprice: [+this.formSearch.get('product_sumprice').value.replace(".00", "")],
      nds: [this.getNdsNameBySelectedId(+this.formSearch.get('nds_id').value)],
      nds_id: [+this.formSearch.get('nds_id').value],
      price_type: [this.getPriceTypeNameBySelectedId(+this.formSearch.get('price_type_id').value)],
      price_type_id: [+this.formSearch.get('price_type_id').value],
      additional: [this.formSearch.get('additional').value],
    });
  }

  getFormIngexByProductId(productId:number):number{
    let retIndex:number;
    let formIndex:number=0;
    this.myForm.value.tableFields.map(i => 
        {
        if(+i['product_id']==productId){retIndex=formIndex}
        formIndex++;
        });return retIndex;}

  addProductRow() 
  { 
  let thereProductInTableWithSameId:boolean=false;
    this.myForm.value.tableFields.map(i => 
    {
      if(+i['product_id']==this.formSearch.get('product_id').value)
      {//такой товар уже занесён в таблицу товаров ранее, и надо поругаться.
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Данный товар уже есть в списке товаров!',}});
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара еще нет. Добавляем в таблицу (в форму myForm)
    const control = <FormArray>this.myForm.controls['tableFields'];
    control.push(this.formingProductRowFromSearchForm());
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    } 
  }
  setPrice(price:number){
    this.formSearch.get('product_price').setValue(price.toString());
    this.calcSumPriceOfProduct();
  }
  deleteProductRow(product_id: number) {
    this.removeProductRow(this.getFormIngexByProductId(product_id));
  }

  removeProductRow(i: number) {
      const control = <FormArray>this.myForm.controls['tableFields'];
      control.removeAt(i);
  }
  hideOrShowNdsColumn(){
    if(this.formBaseInformation.get('nds').value){
      this.displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','price_type','nds','additional','delete'];
    } else {
      this.displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','price_type','additional','delete'];
    }
  }
  EditDocNumber(): void {
    if(this.allowToUpdate && !this.is_completed){
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

  clearTable(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{head: 'Очистка списка товаров',warning: 'Вы хотите удалить все товары из списка?',query: ''},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){this.myForm = this._fb.group({tableFields: this._fb.array([])});}});  
  }
  
  checkDocNumberUnical() {
    if(!this.formBaseInformation.get('doc_number').errors)
    {
      let Unic: boolean;
      this.isDocNumberUnicalChecking=true;
      const body = {
        "id3": +this.id, 
        "id1": +this.formBaseInformation.get('company_id').value,
        "id2": this.formBaseInformation.get('doc_number').value}; 
      return this.http.post('/api/auth/isCustomersOrdersNumberUnical',body)
      .subscribe(
          (data) => {   
                      Unic = data as boolean;
                      if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Введённый номер документа не является уникальным.',}});
                      this.isDocNumberUnicalChecking=false;
                  },
          error => {console.log(error),this.isDocNumberUnicalChecking=false;}
      );
    }
  }

  createNewDocument(){
    this.createdDockId=null;
    //если отправляем нового контрагента, в cagent_id отправляем null, и backend понимает что нужно создать нового контрагента:
    this.formBaseInformation.get('cagent_id').setValue(this.is_addingNewCagent?null:this.formBaseInformation.get('cagent_id').value);
    this.http.post('/api/auth/insertCustomersOrders', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.formBaseInformation.get('cagent_id').enable();//иначе при сохранении он не будет отпраляться
                                this.openSnackBar("Документ \"Заказ клиента\" успешно создан", "Закрыть");
                            },
                error => console.log(error),
            );
  }

  completeDocument(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{
        head: 'Завершение заказа клиента',
        warning: 'Вы хотите завершить заказ клиента?',
        query: 'После завершения заказа клиента документ станет недоступным для редактирования.'},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.is_completed =true;
        this.updateDocument(true);
      }
    });
  }

  updateDocument(complete:boolean){ 
    const control = <FormArray>this.myForm.controls['tableFields'];
    this.formBaseInformation.get('CustomersOrdersProductTable').setValue(control.value);
    return this.http.post('/api/auth/updateCustomersOrders',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            this.getData();
            if (!complete){
              this.openSnackBar("Документ \"Заказ клиента\" сохранён", "Закрыть");
            } else { this.openSnackBar("Документ \"Заказ клиента\" завершён", "Закрыть");}
          },
          error => console.log(error),
      );
  } 

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  openProductCard(dockId:number) {
    const dialogRef = this.dialogCreateProduct.open(ProductsDockComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        dockId: dockId
      },
    });
  } 
//*****************************************************************************************************************************************/
//*******************************           В Ы Б О Р  С Т Р А Н Ы,  Р А Й О Н А, Г О Р О Д А       ***************************************/
//*****************************************************************************************************************************************/
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
    error => console.log(error));
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
  }
  //вызывается из html. необходима для сброса уже имеющегося значения. когда имя стирается, в id установится 0 
  checkEmptyCountryField(){
    if( this.formBaseInformation.get('country').value.length==0){
      this.formBaseInformation.get('country_id').setValue('');
    }
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

//*****************************************************************************************************************************************/
//***************************************************    СОЗДАНИЕ НОВОГО ТОВАРА     *******************************************************/
//*****************************************************************************************************************************************/

  // openDialogCreateProduct() {
  //   const dialogRef = this.dialogCreateProduct.open(ProductsDockComponent, {
  //     maxWidth: '95vw',
  //     maxHeight: '95vh',
  //     height: '95%',
  //     width: '95%',
  //     data:
  //     { 
  //       mode: 'createForCustomersOrders',
  //       companyId: this.formBaseInformation.get('company_id').value,
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     console.log(`Dialog result: ${result}`);
  //     if(result)this.addProductToDock(result);
  //   });
  // }

  // addProductToDock(product_code: string){
  //   // setTimeout(() => { this.nameInput.nativeElement.focus(); }, 300);
  //   this.canAutocompleteQuery=true;
  //   this.getProductsList();
  //   this.searchProductCtrl.setValue(product_code);
  // }
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
  
  addFilesToCustomersOrders(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addFilesToCustomersOrders', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Изображения добавлены", "Закрыть");
                    this.loadFilesInfo();
                            },
                  error => console.log(error),
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
                error => console.log(error),
            );
  }
  clickBtnDeleteFile(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление файла',
        query: 'Удалить файл из заказа клиента?',
        warning: 'Файл не будет удалён безвозвратно, он останется в библиотеке "Файлы".',
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
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.loadFilesInfo();
                },
        error => console.log(error),
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
}
