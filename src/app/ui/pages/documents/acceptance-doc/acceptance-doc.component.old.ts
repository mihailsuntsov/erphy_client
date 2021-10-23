import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { MomentDateAdapter} from '@angular/material-moment-adapter';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { ProductsDocComponent } from '../products-doc/products-doc.component';
import { MatDialog } from '@angular/material/dialog';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { Router } from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MessageDialog} from 'src/app/ui/dialogs/messagedialog.component';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
import { Observable } from 'rxjs';
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

interface docResponse {//интерфейс для получения ответа в методе getAcceptanceValuesById
  id: number;
  company: string;
  company_id: string;
  department: string;
  department_id: string;
  creator: string;
  creator_id: string;
  cagent: string;
  cagent_id: string;
  master: string;
  master_id: string;
  is_completed: boolean;
  changer:string;
  changer_id: string;
  doc_number: string;
  nds: boolean;
  nds_included: boolean;
  acceptance_date: string;
  date_time_changed: string;
  date_time_created: string;
  description : string;
  overhead: string;
  is_archive: boolean;
  overhead_netcost_method: number;
}
interface SpravSysNdsSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}
// interface BaseInformation {//интерфейс для основной информации в документе
//   id: number;
//   company_id: string;
//   department_id: string;
//   cagent_id: string;
//   doc_number: string;
//   nds: boolean;
//   nds_included: boolean;
//   acceptance_date: string;
//   description : string;
//   overhead: string;
//   overhead_netcost_method: number;
//   AcceptanceProductTable: FormGroup;
// }

interface TableFields { //интерфейс для формы, массив из которых будет содержать форма myForm, которая будет отправляться на сохранение списка товаров
  product_id: number;
  acceptance_id:number;
  name: string;
  product_count: number;
  edizm: string;
  edizm_id: number;
  product_price: number;
  product_sumprice: number;
  product_netcost: number;
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
  nds_id:number;
  edizm_id:number;
  filename:string;
}

interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
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
     date_time_created:string;
}

@Component({
  selector: 'app-acceptance-doc',
  templateUrl: './acceptance-doc.component.html',
  styleUrls: ['./acceptance-doc.component.css'],
  providers: [LoadSpravService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})
export class AcceptanceDocComponent implements OnInit {

  id: number = 0;// id документа
  myId:number=0;
  creatorId:number=0;
  createdDocId: number;//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  // receivedUsersList  : any [];//массив для получения списка пользователей
  myCompanyId:number=0;
  spravSysEdizmOfProductAll: idAndNameAndShorname[] = [];// массив, куда будут грузиться все единицы измерения товара
  // allFields: any[][] = [];//[номер строки начиная с 0][объект - вся инфо о товаре (id,кол-во, цена... )] - массив товаров
  productSearchResponse: productSearchResponse[] = [];// массив для найденных через форму поиска formSearch товаров
  filesInfo : filesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  shortInfoAboutProduct: shortInfoAboutProduct = null; //получение краткого инфо по товару
  shortInfoAboutProductArray: any[] = []; //получение краткого инфо по товару
  imageToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)

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
  // showOpenDocIcon:boolean=false;

  // ******  справочники  ******************
  // spravSysPPRSet: any[];//сет признаков предмета расчета 
  spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 

  displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','product_netcost','nds','delete'];
  @ViewChild("countInput", {static: false}) countInput;
  @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("doc_number", {static: false}) doc_number; 
  @ViewChild("form", {static: false}) form; 
  edizmName:string='';
  formSearchReadOnly=false;
  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  is_completed=false;

  //для поиска контрагента (поставщика) по подстроке
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
    private _snackBar: MatSnackBar,
    private _router:Router) 
    {this.id = +activateRoute.snapshot.params['id'];}

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      department_id: new FormControl      ('',[Validators.required]),
      cagent_id: new FormControl      ('',[Validators.required]),
      doc_number: new FormControl      ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      acceptance_date: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
      department: new FormControl      ('',[]),
      cagent: new FormControl      ('',[]),
      nds: new FormControl      (false,[]),
      nds_included: new FormControl      (true,[]),
      is_completed: new FormControl      (false,[]),
      overhead: new FormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      overhead_netcost_method: new FormControl      (0,[]),
      AcceptanceProductTable: new FormArray([])
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
      product_id: new FormControl      ('',[Validators.required]),
      acceptance_id: new FormControl      ('',[]),
      product_count: new FormControl      ('',[Validators.required,Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price: new FormControl      ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new FormControl      (0,[]),
      nds_id: new FormControl      ('',[Validators.required]),
      edizm_id: new FormControl      (0,[]),
    });

    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Поставщик"
    this.getSpravSysNds();
    this.getSetOfPermissions();//
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
    // ->refreshPermissions() 
    //
    this.myForm = this._fb.group({
      tableFields: this._fb.array([])
    });
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=15')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
    );
}

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==184)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==185)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==192)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==188)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==189)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==195)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==196)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==190)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==191)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==197)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==198)});

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

  // console.log("myCompanyId - "+this.myCompanyId);
  // console.log("documentOfMyCompany - "+documentOfMyCompany);
  // console.log("allowToView - "+this.allowToView);
  // console.log("allowToUpdate - "+this.allowToUpdate);
  // console.log("allowToCreate - "+this.allowToCreate);
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
    }
  }
  // refreshShowAllTabs(){
  //   if(this.id>0){//если в документе есть id
  //     this.visAfterCreatingBlocks = true;
  //     this.visBeforeCreatingBlocks = false;
  //     this.visBtnUpdate = this.allowToUpdate;
  //   }else{
  //     this.visAfterCreatingBlocks = false;
  //     this.visBeforeCreatingBlocks = true;
  //   }
  // }
  getSpravSysNds(){
        this.loadSpravService.getSpravSysNds()
        .subscribe((data) => {this.spravSysNdsSet=data as any[];},
        error => console.log(error));}
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
    this.formBaseInformation.get('acceptance_date').setValue(moment());
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

  //--------------------------------------- **** поиск по подстроке для товара  ***** ------------------------------------
  onProductSearchValueChanges(){
    this.searchProductCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredProducts = [];
      }),       
      switchMap(fieldObject =>  
        this.getProductsList()
      )
    )
    .subscribe(data => {
      this.isProductListLoading = false;
      if (data == undefined) {
        this.filteredProducts = [];
      } else {
        this.filteredProducts = data as any;
        if(this.filteredProducts.length==1){
          this.onAutoselectProduct();
        }
      }
    });
  }

  onAutoselectProduct(){
    this.canAutocompleteQuery=false;
    this.formSearch.get('product_id').setValue(+this.filteredProducts[0].id);
    this.searchProductCtrl.setValue(this.filteredProducts[0].name);
    this.formSearch.get('nds_id').setValue(+this.filteredProducts[0].nds_id);
    this.formSearch.get('edizm_id').setValue(+this.filteredProducts[0].edizm_id);
    this.productImageName = this.filteredProducts[0].filename;
    this.afterSelectProduct();
  }

  onSelectProduct(product:productSearchResponse){
    this.formSearch.get('product_id').setValue(+product.id);
    this.formSearch.get('nds_id').setValue(+product.nds_id);
    this.formSearch.get('edizm_id').setValue(+product.edizm_id);
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

  checkEmptyProductField(){
    if(this.searchProductCtrl.value.length==0){
      this.resetFormSearch();
    }
  };    

  resetFormSearch(){
      this.formSearchReadOnly=false;
      this.nameInput.nativeElement.focus();
      this.searchProductCtrl.setValue('');
      this.edizmName='';
      this.formSearch.get('product_count').setValue('');//если оставить null в этих 2 полях, будет ошибка
      this.formSearch.get('product_price').setValue('');
      this.thumbImageAddress="../../../../../../assets/images/no_foto.jpg";      
      this.mainImageAddress="";
      this.productImageName=null;
      this.imageToShow=null;
      this.form.resetForm();//реализовано через ViewChild: @ViewChild("form", {static: false}) form; + В <form..> прописать #form="ngForm"
      this.calcSumPriceOfProduct();
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
  onSelectCagent(id:any,name:string){
    this.formBaseInformation.get('cagent_id').setValue(+id);}
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.formBaseInformation.get('cagent_id').setValue();
  }};     
  getCagentsList(){ //заполнение Autocomplete для поля Товар
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

  getEdizmNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysEdizmOfProductAll.forEach(a=>{
      if(+a.id == srchId) {name=a.short_name}
    }); return name;}

  getNdsNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysNdsSet.forEach(a=>{
      if(+a.id == srchId) {name=a.name}
    }); return name;}

  getNdsMultiplifierBySelectedId(srchId:number):number {
  //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
      let value=0;
      this.spravSysNdsSet.forEach(a=>{
        if(+a.id == srchId) {value=(a.name.includes('%')?(+a.name.replace('%','')):0)/100+1}
      }); return value;}  

  loadMainImage(){
    if(this.productImageName!=null){
      this.getImageService('/api/auth/getFileImageThumb/' + this.productImageName).subscribe(blob => {
        this.createImageFromBlob(blob);
      });
    } 
  }

  getImageService(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  
  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
        this.imageToShow = reader.result;
    }, false);
    if (image) {
        reader.readAsDataURL(image);
    }
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
    const docId = {"id": this.id};
          this.http.post('/api/auth/getAcceptanceValuesById', docId)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                this.formBaseInformation.get('id').setValue(+documentValues.id);
                // this.formBaseInformation.get('cagent_id').setValue(documentValues.cagent_id);
                this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                this.formBaseInformation.get('department_id').setValue(documentValues.department_id);
                this.formBaseInformation.get('department').setValue(documentValues.department);
                this.formBaseInformation.get('cagent_id').setValue(documentValues.cagent_id);
                this.formBaseInformation.get('cagent').setValue(documentValues.cagent);
                this.formBaseInformation.get('acceptance_date').setValue(documentValues.acceptance_date?moment(documentValues.acceptance_date,'DD.MM.YYYY'):"");
                this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                this.formBaseInformation.get('nds').setValue(documentValues.nds);
                this.formBaseInformation.get('nds_included').setValue(documentValues.nds_included);
                this.formBaseInformation.get('description').setValue(documentValues.description);
                this.formBaseInformation.get('overhead').setValue(documentValues.overhead);//расходы на доставку, накладные расходы
                this.formBaseInformation.get('overhead_netcost_method').setValue(documentValues.overhead_netcost_method);//распределение расходов на доставку по товарам 0 - нет, 1 - по весу цены в поставке
                this.formAboutDocument.get('master').setValue(documentValues.master);
                this.formAboutDocument.get('creator').setValue(documentValues.creator);
                this.formAboutDocument.get('changer').setValue(documentValues.changer);
                this.formAboutDocument.get('company').setValue(documentValues.company);
                this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                this.creatorId=+documentValues.creator_id;
                this.searchCagentCtrl.setValue(documentValues.cagent);
                this.is_completed=documentValues.is_completed;
                this.getSpravSysEdizm();
                this.loadFilesInfo();
                this.hideOrShowNdsColumn();
                this.refreshPermissions();
            },
            error => console.log(error)
        );
  }

  getProductTable(){
    let ProductsTable: TableFields[]=[];
    const docId = {"id": this.id};
          this.http.post('/api/auth/getAcceptanceProductTable', docId)
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

  calcSumPriceOfProduct(){
    let switcherNDS:boolean = this.formBaseInformation.get('nds').value;
    let switcherNDSincluded:boolean = this.formBaseInformation.get('nds_included').value;
    let selectedNDS:number = this.getNdsMultiplifierBySelectedId(+this.formSearch.get('nds_id').value)
    
    this.formSearch.get('product_count').setValue((this.formSearch.get('product_count').value!=null?this.formSearch.get('product_count').value:'').replace(",", "."));
    this.formSearch.get('product_price').setValue((this.formSearch.get('product_price').value!=null?this.formSearch.get('product_price').value:'').replace(",", "."));
    
    this.formSearch.get('product_sumprice').setValue(
      ((+this.formSearch.get('product_count').value)*(+this.formSearch.get('product_price').value))
      );
      //если включён переключатель "НДС", но переключатель "НДС включена" выключен, нужно добавить к цене НДС значение, выбранное в выпадающем списке формы поиска товара
    if(switcherNDS && !switcherNDSincluded) 
    {this.formSearch.get('product_sumprice').setValue(+this.formSearch.get('product_sumprice').value*selectedNDS);}
    this.formSearch.get('product_sumprice').setValue(this.formSearch.get('product_sumprice').value.toFixed(2))
  }

  getTotalProductCount() {
    return  (this.myForm.value.tableFields.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice():number {
    return  (this.myForm.value.tableFields.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    // console.log("event - "+event+", charCode - "+charCode);
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}

  formingProductRowFromApiResponse(row: TableFields) {
    return this._fb.group({
      product_id: [row.product_id],
      acceptance_id: [row.acceptance_id],
      name: [row.name],
      product_count: [row.product_count],
      edizm: [row.edizm],
      edizm_id: [row.edizm_id],
      product_price: [row.product_price],
      product_sumprice: [row.product_sumprice],
      product_netcost: [row.product_netcost],
      nds: [row.nds],
      nds_id: [row.nds_id],
    });
  }

  formingProductRowFromSearchForm() {
    return this._fb.group({
      product_id: [+this.formSearch.get('product_id').value],
      acceptance_id: [+this.id],
      name: [this.searchProductCtrl.value],
      product_count: [+this.formSearch.get('product_count').value],
      edizm: [this.edizmName],
      edizm_id: [+this.formSearch.get('edizm_id').value],
      product_price: [+this.formSearch.get('product_price').value],
      product_sumprice: [+this.formSearch.get('product_sumprice').value.replace(".00", "")],
      nds: [this.getNdsNameBySelectedId(+this.formSearch.get('nds_id').value)],
      nds_id: [+this.formSearch.get('nds_id').value],
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
      {//такой товар уже занесён в таблицу товаров ранее, и надо просуммировать показатели уже существующего в таблице и добавляемого в таблицу товара.
        if(!((+i['product_price'])!=(+this.formSearch.get('product_price').value)))//если у повторно вводимого товара та же цена
        {//добавляем к тому что есть (кол-во и сумму)
          i['product_count']=(+i['product_count'])+(+this.formSearch.get('product_count').value);
          i['product_sumprice']=((+i['product_count'])*(+i['product_price'])).toFixed(2).replace(".00", "");//сумму пересчитываем. 
          this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
          //если у повторно вводимого товара другая цена - ругаемся
        }else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Данный товар уже есть в списке приёмки с другой ценой. Если в поставке есть одинаковые товары с разными ценами, их необходимо вводить в разные документы "Приёмка".',}});
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара еще нет. Добавляем в таблицу (в форму myForm)
    const control = <FormArray>this.myForm.controls['tableFields'];
    control.push(this.formingProductRowFromSearchForm());
    this.productTableRecount();//для подсчета себестоимости, т.к. в форме поиска товара она не рассчитывается
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    } 
  }
  setPrice(price:number){
    this.formSearch.get('product_price').setValue(price.toString());
    this.calcSumPriceOfProduct();
    
  }
  deleteProductRow(product_id: number) {
    this.removeProductRow(this.getFormIngexByProductId(product_id));
    this.productTableRecount();//для пересчета себестоимости, т.к. товаров стало меньше - затраты перераспределятся
  }

  removeProductRow(i: number) {
      const control = <FormArray>this.myForm.controls['tableFields'];
      control.removeAt(i);
  }
  hideOrShowNdsColumn(){
    if(this.formBaseInformation.get('nds').value){
      this.displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','product_netcost','nds','delete'];
    } else {
      this.displayedColumns = ['name','product_count','edizm','product_price','product_sumprice','product_netcost','delete'];
    }
  }
  productTableRecount(){
    //перерасчет НДС в форме поиска
    if(+this.formSearch.get('product_id').value) this.calcSumPriceOfProduct();
    this.formBaseInformation.get('overhead').setValue((this.formBaseInformation.get('overhead').value).toString().replace(",", "."));
    
    //перерасчет НДС в таблице товаров
    if(this.myForm.controls['tableFields'].value.length>0){
      let switcherNDS:boolean = this.formBaseInformation.get('nds').value;
      let switcherNDSincluded:boolean = this.formBaseInformation.get('nds_included').value;
      let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
      let KZ:number = 0; //коэффициент затрат, равен делению расходов на итоговую сумму

      this.myForm.value.tableFields.map(i => 
      {
        multiplifierNDS = this.getNdsMultiplifierBySelectedId(+i['nds_id']);
        if(switcherNDS && !switcherNDSincluded){//если включён переключатель "НДС", но переключатель "НДС включена" выключен,
        //..к сумме добавляем НДС
          i['product_sumprice']=((+i['product_count'])*(+i['product_price'])*multiplifierNDS).toFixed(2).toString().replace(".00", "");
        }else  i['product_sumprice']=((+i['product_count'])*(+i['product_price'])).toFixed(2).toString().replace(".00", "");//..иначе не добавляем, и сумма - это просто произведение количества на цену
      });
      //перерасчет себестоимости в таблице товаров (себестоимость не считается в один с НДС проход, т.к. в себестоимости используется итоговая сумма)
      KZ=+((+this.formBaseInformation.get('overhead').value)/this.getTotalSumPrice());
      // console.log('KZ='+KZ);
      this.myForm.value.tableFields.map(i => 
        {
          multiplifierNDS = this.getNdsMultiplifierBySelectedId(+i['nds_id']);
          if(+this.formBaseInformation.get('overhead_netcost_method').value>0){//если расходы распределяются по себестоимости
            if(switcherNDS && !switcherNDSincluded){//... и при этом в цену не включена НДС
              i['product_netcost']=+((+i['product_price']*multiplifierNDS*KZ)+(+i['product_price']*multiplifierNDS)).toFixed(2);//..то в себестоимость нужно включить НДС и часть расходов
            } else {
              i['product_netcost']=+((+i['product_price']*KZ)+(+i['product_price'])).toFixed(2);}//если в цену включена НДС - в себестоимость включаем только часть расходов
            }else{ //если расходы НЕ распределяются по себестоимости
            if(switcherNDS && !switcherNDSincluded){//... и при этом в цену не включена НДС
              i['product_netcost']=+(+i['product_price']*multiplifierNDS).toFixed(2);//то в себестоимость нужно включить НДС
            }else  i['product_netcost']=i['product_price'];//если в цену уже включена НДС - себестоимость будет равна цене
          } 
      });
    }
  }
  
  getProductsList(){ //заполнение Autocomplete для поля Товар
    try 
    {
      if(this.canAutocompleteQuery && this.searchProductCtrl.value.length>1)
      {
        this.isProductListLoading  = true;
        return this.http.get(
          '/api/auth/getProductsList?searchString='+this.searchProductCtrl.value+'&companyId='+this.formBaseInformation.get('company_id').value+'&departmentId='+this.formBaseInformation.get('department_id').value+'&document_id='+this.id
          );
      }else return [];
    } catch (e) {
      return [];
    }
  }
  getShortInfoAboutProduct(){
    this.http.get('/api/auth/getShortInfoAboutProduct?department_id='+this.formBaseInformation.get('department_id').value+'&product_id='+this.formSearch.get('product_id').value)
      .subscribe(
          data => { 
            this.shortInfoAboutProduct=data as any;
            this.shortInfoAboutProductArray[0]=this.shortInfoAboutProduct.quantity;
            this.shortInfoAboutProductArray[1]=this.shortInfoAboutProduct.change;
            this.shortInfoAboutProductArray[2]=this.shortInfoAboutProduct.date_time_created;
            this.shortInfoAboutProductArray[3]=this.shortInfoAboutProduct.avg_purchase_price;
            this.shortInfoAboutProductArray[4]=this.shortInfoAboutProduct.avg_netcost_price;
            this.shortInfoAboutProductArray[5]=this.shortInfoAboutProduct.last_purchase_price;
          },
          error => console.log(error)
      );
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
      return this.http.post('/api/auth/isAcceptanceNumberUnical',body)
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
    this.createdDocId=null;
    this.http.post('/api/auth/insertAcceptance', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                  this.createdDocId=data as number;
                  switch(this.createdDocId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка создания документа Приёмка"}});
                      break;
                    }
                    case 0:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Недостаточно прав для создания документа Приёмка"}});
                      break;
                    }
                    default:{// Приёмка успешно создалась в БД 
                      this.openSnackBar("Документ \"Приёмка\" успешно создан", "Закрыть");
                      this.afterCreateDocument();
                    }
                  }
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
  }

  //действия после создания нового документа 
  afterCreateDocument(){
    this.id=+this.createdDocId;
    this._router.navigate(['/ui/acceptancedoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.getData();
  }

  completeDocument(){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{
        head: 'Завершение приёмки',
        warning: 'Вы хотите завершить приёмку?',
        query: 'После завершения приёмки документ станет недоступным для редактирования.'},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.updateDocument(true);
      }
    });
  }

  updateDocument(complete:boolean){ 
    const control = <FormArray>this.myForm.controls['tableFields'];
    const body= {
      "id":                     this.formBaseInformation.get('id').value,
      "company_id":             this.formBaseInformation.get('company_id').value,
      "description":            this.formBaseInformation.get('description').value,
      "department_id":          this.formBaseInformation.get('department_id').value,
      "cagent_id":              this.formBaseInformation.get('cagent_id').value,
      "doc_number":             this.formBaseInformation.get('doc_number').value,
      "acceptance_date":        this.formBaseInformation.get('acceptance_date').value,
      "nds":                    this.formBaseInformation.get('nds').value,
      "nds_included":           this.formBaseInformation.get('nds_included').value,
      "overhead":               this.formBaseInformation.get('overhead').value,
      "overhead_netcost_method":this.formBaseInformation.get('overhead_netcost_method').value,
      "is_completed":           complete,
      "acceptanceProductTable": control.value,
    }
      return this.http.post('/api/auth/updateAcceptance', body)
        .subscribe(
            (data) => 
            {   
              if (!complete){
                this.openSnackBar("Документ \"Приёмка\" сохранён", "Закрыть");
              } else { 
                this.is_completed =true;//если успешно сохранился и это сохранение при завершении - отмечаемся как завершенный
                this.openSnackBar("Документ \"Приёмка\" завершён", "Закрыть");
              }
                // this.getData();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
        );
  } 

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }



  openProductCard(docId:number) {
    const dialogRef = this.dialogCreateProduct.open(ProductsDocComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        docId: docId
      },
    });
  }  
//*****************************************************************************************************************************************/
//***************************************************    СОЗДАНИЕ НОВОГО ТОВАРА     *******************************************************/
//*****************************************************************************************************************************************/

openDialogCreateProduct() {
  const dialogRef = this.dialogCreateProduct.open(ProductsDocComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'createForAcceptance',
      companyId: this.formBaseInformation.get('company_id').value,
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    console.log(`Dialog result: ${result}`);
    if(result)this.addProductToDoc(result);
  });
}

  addProductToDoc(product_code: string){
    // setTimeout(() => { this.nameInput.nativeElement.focus(); }, 300);
    this.canAutocompleteQuery=true;
    this.getProductsList();
    this.searchProductCtrl.setValue(product_code);
  }
//*****************************************************************************************************************************************/
//***************************************************    добавление файлов          *******************************************************/
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
      if(result)this.addFilesToAcceptance(result);
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
  
  addFilesToAcceptance(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addFilesToAcceptance', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Файлы добавлены", "Закрыть");
                    this.loadFilesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
              );
  }
  loadFilesInfo(){//                                     загружает информацию по прикрепленным файлам
    const body = {"id":this.id};
          return this.http.post('/api/auth/getListOfAcceptanceFiles', body) 
            .subscribe(
                (data) => {  
                            this.filesInfo = data as any[]; 
                            // this.loadMainImage();
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
  return this.http.post('/api/auth/deleteAcceptanceFile',body)
  .subscribe(
      (data) => {   
                  this.openSnackBar("Успешно удалено", "Закрыть");
                  this.loadFilesInfo();
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
  );  
}

}
