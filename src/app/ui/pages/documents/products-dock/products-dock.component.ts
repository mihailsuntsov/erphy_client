import { Component, OnInit, ViewChild, Inject, Optional } from '@angular/core';
import { ProductHistoryQuery } from './product-history-form';
import { ProductHistoryService } from './get-producthistory-table.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, FormGroup, FormControl, FormArray, FormBuilder} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { FilesDockComponent } from '../files-dock/files-dock.component';
import { CagentsDockComponent } from '../cagents-dock/cagents-dock.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { UploadFileService } from './upload-file.service';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { FilesComponent } from '../files/files.component';
import { CagentsComponent } from '../cagents/cagents.component';
import { ProductCagentsDialogComponent } from 'src/app/ui/dialogs/product-cagents-dialog/product-cagents-dialog.component';
import { ProductBarcodesDialogComponent } from 'src/app/ui/dialogs/product-barcodes-dialog/product-barcodes-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';

import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
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
  company: string;
  company_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  changer:string;
  changer_id: string;
  name: string;
  description: string;
  article: string;
  productgroup_id: string;
  productgroup: string;
  date_time_changed: string;
  date_time_created: string;
  product_categories: string[];
  product_categories_id: string[];
  product_code: string; // весовой генерируемый системой код
  product_code_free: string; // свободно редактируемый код товара или услуги
  ppr_id: string;
  by_weight: boolean;
  edizm_id: string;
  nds_id: string;
  weight: string;
  volume: string;
  weight_edizm_id: string;
  volume_edizm_id: string;
  markable: boolean;
  markable_group_id: string;
  excizable: boolean;
  not_buy: boolean;
  not_sell: boolean;
  indivisible: boolean;
  }
  interface SpravSysNdsSet{
    id: number;
    name: string;
    description: string;
    name_api_atol: string;
    is_active: string;
    calculated: string;
  }
  interface ImagesInfo {
    id: string;
    name: string;
    original_name: string;
    date_time_created: string;
    output_order: string;
    image:any;// поле для загрузки картинки по GET-запросу
  }
  interface ProductCategoriesTreeNode {
    id: string;
    name: string;
    children?: ProductCategoriesTreeNode[];
  }
  interface ProductCategoriesFlatNode {
    expandable: boolean;
    name: string;
    level: number;
  }
  interface cagentsInfo {
    cagent_id: string;
    name: string;
    output_order: string;
  }
  interface barcodesInfo{
    barcode_id: string;
    name: string;
    description: string;
    value: string;
  }
  interface idAndName{ //универсалный интерфейс для выбора из справочников
    id: string;
    name: string;
  }
  export interface DockTable {
    id: number;
  }
  export interface NumRow {//интерфейс для списка количества строк
    value: string;
    viewValue: string;
  }
  interface idNameDescription{
    id: number;
    name: string;
    description: string;
  }
  export interface ProductHistoryTable {//для получения данных по отчету о истории изменений товара
    id: number;
    department: string;
    docName: string;
    docId: number;
    docTypeId: number;
    quantity: number;
    change: number;
    date_time_created: string;
    last_purchase_price: number;
    avg_purchase_price: number;
    avg_netcost_price: number;
    last_operation_price: number;
  }
  interface ProductPricesTable { //интерфейс для формы, массив из которых будет содержать форма ProductPricesTable, входящая в formBaseInformation, которая будет включаться в formBaseInformation
    price_type_id: number;
    price_name: number;
    price_value: number;
    price_description: string;
  }
@Component({
  selector: 'app-products-dock',
  templateUrl: './products-dock.component.html',
  styleUrls: ['./products-dock.component.css'],
  providers: [LoadSpravService,UploadFileService,ProductHistoryService,
    {provide: MAT_DATE_LOCALE, useValue: 'ru'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},]
})

export class ProductsDockComponent implements OnInit {
  id: number;// id документа
  createdDockId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;
  imageToShow:any; // переменная в которую будет подгружаться главная картинка товара
  receivedPriceTypesList: ProductPricesTable [] = [];//массив для получения списка типов цен
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада)

//Формы
formBaseInformation:any;//форма для основной информации, содержащейся в документе
formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
selectedProductCategory:any;//форма, содержащая информацию о выбранной категории товара (id, name)
productPricesTable: ProductPricesTable; //массив форм с ценами

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

 // Отчет по товарам Изменения
formProductHistory: ProductHistoryQuery=new ProductHistoryQuery();//форма, содержащая информацию для запроса отчета об истории изменения количества товара на складе
donePagesList: boolean = false;
receivedCompaniesListForHistoryReport: any [];//массив для получения списка предприятий
receivedPagesList: string [];//массив для получения данных пагинации
receivedMatTable: DockTable []=[] ;//массив для получения данных для материал таблицы
dataSource = new MatTableDataSource<DockTable>(this.receivedMatTable); //источник данных для материал таблицы
displayedColumns: string[]=[];//массив отображаемых столбцов таблицы с действиями с товаром
pricesDisplayedColumns: string[]=[];//массив отображаемых столбцов таблицы с ценами на товар
selection = new SelectionModel<idAndName>(true, []);//Class to be used to power selecting one or more options from a list.
receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка СВОИХ отделений
productHistoryTable: ProductHistoryTable[]=[];//массив для получения данных по отчету об истории изменений товара
numRows: NumRow[] = [
  {value: '10', viewValue: '10'},
  {value: '25', viewValue: '25'},
  {value: '50', viewValue: '50'},
  {value: '100', viewValue: '100'},
  {value: '500', viewValue: '500'},
  {value: '1000', viewValue: '1000'}
];
documentsIds: idAndName [] = 
[
{id:"15", name: "Приёмки"},
{id:"21", name: "Отгрузки"},
{id:"16", name: "Оприходования"},
{id:"17", name: "Списания"},
{id:"25", name: "Розичные продажи"},
{id:"28", name: "Возвраты покупателей"},
{id:"29", name: "Возвраты поставщикам"},
{id:"30", name: "Перемещения"},
]//список документов, по которым можно получить отчёт
checkedChangesList:number[]=[]; //массив для накапливания id выбранных документов чекбоксов в отчете по истории товара, вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов




checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
searchProductGroupsCtrl = new FormControl();
fieldsForm: FormGroup;
dataFields: any;
receivedSetsOfFields: any [] = [] ;//массив для получения сетов полей
fieldIdEditNow:number=0;    //     id редактируемого кастомного поля в fieldsForm  
fieldIndexEditNow:number=0; //  index редактируемого кастомного поля в fieldsForm  
prefixes: any[];
st_prefix_barcode_pieced:number=0;
st_prefix_barcode_packed:number=0;
filteredProductGroups: any;
isLoading = false;
isProductGroupLoading = false;
canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
errorMsg: string;
isWeightCodeGenerating = false;
isProductCodeFreeUnicalChecking = false;
product_code_free_isReadOnly = true ;
mode: string = 'standart';  // режим работы документа: 
// standart - обычный режим, 
// createForAcceptance - оконный режим создания товара для приёмки, 
// viewInWindow - открытие на просмотр в окне в другом документе
@ViewChild("codeFreeValue", {static: false}) codeFreeValue;
// *****  переменные tree  ***** 
private _transformer = (node: ProductCategoriesTreeNode, level: number) => {
  return {
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    id: node.id,
    level: level,
  };
}
treeControl = new FlatTreeControl<ProductCategoriesFlatNode>(node => node.level, node => node.expandable);
treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
hasChild = (_: number, node: ProductCategoriesFlatNode) => node.expandable;
numRootCategories: number=0;
numChildsOfSelectedCategory: number=0;
categoriesExpanded=false;//открыты или закрыты категории, в которых содержится товар или услуга

// *****  переменные картинок  ***** 
imagesInfo : ImagesInfo [] = []; //массив для получения информации по картинкам товара
progress: { percentage: number } = { percentage: 0 };
noImageAddress: string="../../../../../../assets/images/no_foto.jpg"; // заглушка для главной картинки товара
// ******  переменные поставщиков ******
cagentsInfo : cagentsInfo [] = []; //массив для получения информации 
// ******  переменные штрихкодов  ******
barcodesInfo : barcodesInfo [] = []; //массив для получения информации 
// ******  справочники  ******************
spravSysPPRSet: any[];//сет признаков предмета расчета 
spravSysNdsSet: SpravSysNdsSet[];//сет НДС 
spravSysMarkableGroupSet: idAndName[] = [];//сет маркированных товаров
filteredSpravSysMarkableGroupSet: Observable<idAndName[]>;//сет маркированных товаров
spravSysEdizmOfProductAll: idAndName[] = [];// массив, куда будут грузиться все единицы измерения товара
filteredSpravSysEdizmOfProductAll: Observable<idAndName[]>; //массив для отфильтрованных единиц измерения
spravSysEdizmOfProductWeight: any[];// весовые единицы измерения товара
spravSysEdizmOfProductVolume: any[];// объёмные единицы измерения товара

constructor(private activateRoute: ActivatedRoute,
  private http: HttpClient,
  private loadSpravService:   LoadSpravService,
  private httpService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private fb: FormBuilder,
  public ConfirmDialog: MatDialog,
  private _fb: FormBuilder, //чтобы билдить группу форм productPricesTable
  public productHistoryService: ProductHistoryService,
  public MessageDialog: MatDialog,
  public dialogAddImages: MatDialog,
  public dialogAddCagents: MatDialog,
  public ShowImageDialog: MatDialog,
  public ProductCagentsDialogComponent: MatDialog,
  public ProductBarcodesDialogComponent: MatDialog,
  public dialogRefProduct: MatDialogRef<ProductsDockComponent>,
  @Optional() @Inject(MAT_DIALOG_DATA) public data: any) { 
     this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }
  onNoClick(): void {this.dialogRefProduct.close();}
  ngOnInit() {
    // дефолтные значения для отчета по истории изменения товара
      this.formProductHistory.companyId=0;
      this.formProductHistory.departmentId=0;
      this.formProductHistory.sortAsc='desc';
      this.formProductHistory.sortColumn='date_time_created_sort';
      this.formProductHistory.offset=0;
      this.formProductHistory.result=10;
      
    this.fieldsForm = this.fb.group({
        fields: this.fb.array([])
     });  
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      company: new FormControl      ('',[]),
      productgroup_id: new FormControl      ('',[]),
      productgroup: new FormControl      ('',[]),
      article: new FormControl      ('',[]),
      name: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
      selectedProductCategories:new FormControl      ([],[]),
      imagesIdsInOrderOfList:new FormControl      ([],[]),
      cagentsIdsInOrderOfList:new FormControl      ([],[]),
      product_code: new FormControl      ('',[]),
      product_code_free: new FormControl      ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      ppr_id: new FormControl      (1,[]),
      by_weight: new FormControl      ('',[]),
      edizm_name: new FormControl      ('',[Validators.required]),
      edizm_id: new FormControl      ('',[Validators.required]),
      nds_id: new FormControl      (1,[]),
      weight: new FormControl      ('',[Validators.pattern('^[0-9]{1,12}(?:[.,][0-9]{0,3})?\r?$')]),
      volume: new FormControl      ('',[Validators.pattern('^[0-9]{1,12}(?:[.,][0-9]{0,3})?\r?$')]),
      weight_edizm_id: new FormControl      ('',[]),
      volume_edizm_id: new FormControl      ('',[]),
      markable: new FormControl      ('',[]),
      markable_group_name: new FormControl      ('',[]),
      markable_group_id: new FormControl      ('',[]),
      excizable: new FormControl      ('',[]),
      not_buy: new FormControl      ('',[]),
      not_sell: new FormControl      ('',[]),
      indivisible: new FormControl      ('',[]),
      productPricesTable: new FormArray([]),//массив с формами цен
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

    this.selectedProductCategory = new FormGroup({
      selectedNodeId: new FormControl      ('',[]),
      SelectedNodeName: new FormControl      ('',[]),
    });
    this.checkedList = [];
    this.documentsIds.forEach(z=>{this.selection.select(z);this.checkedChangesList.push(+z.id);});
    this.getSetOfPermissions();//->getMyCompanyId()->getCRUD_rights()->getData()->__getCompaniesList()->setDefaultCompany()->(если новый док) refreshPermissions() 
    // //                                                                      |                                          |__(док существует)->getDepartmentsList()->getMyDepartmentsList()->setDefaultDepartment()            
    //                                                                         |__(док существует)->getDocumentValuesById()->refreshPermissions() 


    this.onProductGroupValueChanges();//отслеживание изменений поля "Группа товаров"
    this.loadMainImage();// при создании документа загрузится картинка "no image"
    this.getSpravSysNds();//загрузка справочника НДС
    this.getSpravSysPPR();//загрузка справочника признаков предмета расчёта
    this.getTableHeaderTitles();//столбцы таблицы с историей изменений товара
    this.getPricesTableHeaderTitles();//столбцы таблицы с ценами товара
    //слушалка на изменение поля маркированных товаров
    this.filteredSpravSysMarkableGroupSet = this.formBaseInformation.get('markable_group_name').valueChanges
    .pipe(
      startWith(''),
      map((value_markable:string) => this._filter_markable_group(value_markable))
    ); 

    //слушалка на изменение поля наименования единицы измерения
    this.filteredSpravSysEdizmOfProductAll = this.formBaseInformation.get('edizm_name').valueChanges
      .pipe(
        startWith(''),
        map((value_edizm:string) => this._filter(value_edizm))
      );

    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='viewInWindow'){this.id=this.data.dockId; this.formBaseInformation.get('id').setValue(this.id);}
      if(this.mode=='createForAcceptance' || this.mode=='createForPosting'){this.formBaseInformation.get('company_id').setValue(this.data.companyId); }
    } 
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=14')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyCompanyId();
                },
        error => console.log(error),
    );
}

getCRUD_rights(permissionsSet:any[]){
  this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==163)});
  this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==164)});
  this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==167)});
  this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==168)});
  this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==169)});
  this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==170)});
  this.getData();
}

refreshPermissions():boolean{
  console.log("refreshPermissions");
  let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
  this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
  this.allowToUpdate=((documentOfMyCompany && (this.allowToUpdateAllCompanies || this.allowToUpdateMyCompany))||(documentOfMyCompany==false && this.allowToUpdateAllCompanies))?true:false;
  this.allowToCreate=((documentOfMyCompany && (this.allowToCreateAllCompanies || this.allowToCreateMyCompany))||(documentOfMyCompany==false && this.allowToCreateAllCompanies))?true:false;
  
  if(this.id>0){//если в документе есть id
    this.visAfterCreatingBlocks = true;
    this.visBeforeCreatingBlocks = false;
    this.visBtnUpdate = this.allowToUpdate;
    console.log("visBtnUpdate - "+this.visBtnUpdate);
  }else{
    this.visAfterCreatingBlocks = false;
    this.visBeforeCreatingBlocks = true;
  }
  this.loadTrees();
  return true;
}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    this.getCompaniesList();
    if(+this.id>0){
      this.getDocumentValuesById();
      this.getSets();
      this.loadImagesInfo();
      this.loadCagentsInfo();
      this.loadBarcodesInfo();
    }
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => console.log(error));
  }

  getCompaniesList(){
    console.log("getCompaniesList");
    this.receivedCompaniesList=null;
    this.receivedCompaniesListForHistoryReport=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.receivedCompaniesListForHistoryReport=data as any [];
                  this.doFilterCompaniesList()
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }
  setDefaultCompany(){
    console.log("setDefaultCompany");
    //если документ создан - устанавливаем дефолтное предприятие для отчёта
    if(+this.id>0){
      this.formProductHistory.companyId=this.myCompanyId;
      this.getDepartmentsList();
    }else{//если еще не создан - устанавливаем дефолтное предприятие для документа
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
      this.getSpravSysEdizm();
      this.refreshPermissions();
    }
  }
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.formProductHistory.companyId,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                            this.getMyDepartmentsList();},
                error => console.log(error)
            );
  }
  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.setDefaultDepartment();},
                error => console.log(error)
            );
  }
  setDefaultDepartment(){
    if(this.receivedMyDepartmentsList.length==1)
    {
      // console.log('установка отделения по умолчанию - '+this.receivedMyDepartmentsList[0].id);
      this.formProductHistory.departmentId=+this.receivedMyDepartmentsList[0].id;
      // Cookie.set('acceptance_departmentId',this.formProductHistory.departmentId);
    }
    this.setDefaultDates();
  }
  getDocumentValuesById(){
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getProductValues', dockId)
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
                this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                this.formBaseInformation.get('company').setValue(documentValues.company);
                this.formBaseInformation.get('productgroup_id').setValue(+documentValues.productgroup_id);
                this.formBaseInformation.get('name').setValue(documentValues.name);
                this.formBaseInformation.get('description').setValue(documentValues.description);
                this.formBaseInformation.get('article').setValue(documentValues.article);
                this.formBaseInformation.get('product_code').setValue(documentValues.product_code?this.PrependZeros(documentValues.product_code,5,''):'');
                this.formBaseInformation.get('product_code_free').setValue(documentValues.product_code_free?this.PrependZeros(documentValues.product_code_free,10,''):'');
                this.formBaseInformation.get('ppr_id').setValue(+documentValues.ppr_id);
                this.formBaseInformation.get('by_weight').setValue(documentValues.by_weight);
                this.formBaseInformation.get('edizm_id').setValue(+documentValues.edizm_id);
                this.formBaseInformation.get('nds_id').setValue(+documentValues.nds_id);
                this.formBaseInformation.get('weight').setValue(documentValues.weight);
                this.formBaseInformation.get('volume').setValue(documentValues.volume);
                this.formBaseInformation.get('weight_edizm_id').setValue(+documentValues.weight_edizm_id);
                this.formBaseInformation.get('volume_edizm_id').setValue(+documentValues.volume_edizm_id);
                this.formBaseInformation.get('markable').setValue(documentValues.markable);
                this.formBaseInformation.get('markable_group_id').setValue(+documentValues.markable_group_id);
                this.formBaseInformation.get('excizable').setValue(documentValues.excizable);
                this.formBaseInformation.get('not_buy').setValue(documentValues.not_buy);
                this.formBaseInformation.get('not_sell').setValue(documentValues.not_sell);
                this.formBaseInformation.get('indivisible').setValue(documentValues.indivisible);
                

                this.searchProductGroupsCtrl.setValue(documentValues.productgroup);
                this.checkedList=documentValues.product_categories_id;
                
                this.getSpravSysMarkableGroup(); //загрузка справочника маркированных групп товаров
                this.getSpravSysEdizm(); //загрузка единиц измерения
                this.getProductBarcodesPrefixes(); //загрузка префиксов штрих-кодов
                this.getProductPrices(); // загрузка типов цен
                this.refreshPermissions();

            },
            error => console.log(error)
        );
  }
  //фильтрация при каждом изменении в поле маркированных товаров, создание нового массива и его возврат
  private _filter_markable_group(value: string): idAndName[] {
    const filterValue = value.toLowerCase();
    return this.spravSysMarkableGroupSet.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  //фильтрация при каждом изменении в поле наименования ед. измерения, создание нового массива и его возврат
  private _filter(value: string): idAndName[] {
    const filterValue = value.toLowerCase();
    return this.spravSysEdizmOfProductAll.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  //Загрузка групп (сетов) полей
  getSets(){
    const dockId = {"field_type":"1","documentId":this.id};
            this.http.post('/api/auth/getProductGroupFieldsListWithValues', dockId)
            .subscribe(
                (data) => {
                  this.receivedSetsOfFields=data as any []; 
                  this.getProductGroupFieldsListWithValues();
                },
                error => console.log(error) 
            );
  }

  getFieldsFormControls() {
    return (this.fieldsForm.get('fields') as FormArray).controls;
  }

  getProductGroupFieldsListWithValues(){//загружает кастомные поля со значениями (field_type=2) или их сеты (field_type=1) 
    const dockId = {"field_type":"2","documentId":this.id};
        this.http.post('/api/auth/getProductGroupFieldsListWithValues', dockId)
        .subscribe(
            data => {                
                this.dataFields=data as any;               
                this.patchFieldsFormArray();
                this.onFieldsValueChanges(); //отслеживание изменений настраиваемых полей во вкладке "Поля"
            },
            error => console.log(error)
        );
  }
  patchFieldsFormArray() {
    this.fieldsForm = this.fb.group({fields: this.fb.array([])});// если поля каждый раз не переопределять, они будут пушиться уже к существующим, и сохранение не будет корректно работать
    const control = <FormArray>this.fieldsForm.get('fields');
    this.dataFields.forEach((x: { id: any; parent_set_id: any; name: any; value: any; }) => {
      console.log("pushing");
      control.push(this.patchValues(x.id, x.parent_set_id, x.name, x.value, this.id))
    })
  }
  patchValues(id: any, parent_set_id: any, name: any, value: any, product_id: number) {
    return this.fb.group({
      id: [id],
      parent_set_id: [parent_set_id],
      name: [name],
      value: [value],
      product_id: [product_id]
    })
  }
  getProductGroupsList(){ //заполнение Autocomplete для поля Группа товаров
      try 
      {
        if(this.canAutocompleteQuery && this.searchProductGroupsCtrl.value.length>1)
        {
          const body = {"searchString":this.searchProductGroupsCtrl.value,"companyId":this.formBaseInformation.get('company_id').value};
          this.isProductGroupLoading = true;
          return this.http.post('/api/auth/getProductGroupsList', body);
        }else return [];
      } catch (e) {
        return [];
      }
  }
  getProductFieldsValuesList(fieldObject: { fields: { value: any; }[]; }){ //заполнение Autocomplete для настраиваеммых полей во вкладке Поля
      try 
      {
        if(this.canAutocompleteQuery && fieldObject.fields[this.fieldIndexEditNow].value.length>1)
        {
          const body = {
            "id": this.fieldIdEditNow,
            "searchString":fieldObject.fields[this.fieldIndexEditNow].value};
          this.isLoading = true;
          return this.http.post('/api/auth/getProductFieldsValuesList', body);
        }else return [];
      } catch (e) {
        return [];
      }
  }
// слушалка на изменение кастомных полей
  onFieldsValueChanges(){
    this.fieldsForm.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.errorMsg = "";
        this.filteredProductGroups = [];
      }),       
      switchMap(fieldObject =>  
        this.getProductFieldsValuesList(fieldObject)
      )
    )
    .subscribe(data => {
      this.isLoading = false;
      if (data == undefined) {
        this.errorMsg = data['Error'];
        this.filteredProductGroups = [];
      } else {
        this.errorMsg = "";
        this.filteredProductGroups = data as any;
      }
    });
  }
// слушалка на изменение поля Группа товаров
  onProductGroupValueChanges(){
    this.searchProductGroupsCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.errorMsg = "";
        this.filteredProductGroups = [];
      }),       
      switchMap(fieldObject =>  
        this.getProductGroupsList()
      )
    )
    .subscribe(data => {
      this.isProductGroupLoading = false;
      if (data == undefined) {
        this.errorMsg = data['Error'];
        this.filteredProductGroups = [];
      } else {
        this.errorMsg = "";
        this.filteredProductGroups = data as any;
      }
    });
  }
  onSelectProductGroup(id:any,name:string){
    console.log("selected id - "+id)
    this.formBaseInformation.get('productgroup_id').setValue(+id);
  }
  checkEmptyProductGroupField(){
    console.log("length - "+this.searchProductGroupsCtrl.value.length);
    if(this.searchProductGroupsCtrl.value.length==0){
      this.formBaseInformation.get('productgroup_id').setValue(0);
    }
  };        
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.product_code_free_isReadOnly=true;
    this.createNewDocument();
  }
  createNewDocument(){
    this.createdDockId=null;
    this.formBaseInformation.get('selectedProductCategories').setValue(this.checkedList);
    this.http.post('/api/auth/insertProduct', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Документ \"Товары и услуги\" успешно создан", "Закрыть");
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
    this.product_code_free_isReadOnly = true ;
  }
   updateDocument(){ // сохраняется в 2 захода - 1й сам док и категории, 2й - настраиваемые поля (если есть)
    this.formBaseInformation.get('selectedProductCategories').setValue(this.checkedList);
    this.formBaseInformation.get('imagesIdsInOrderOfList').setValue(this.getImagesIdsInOrderOfList());
    this.formBaseInformation.get('cagentsIdsInOrderOfList').setValue(this.getCagentsIdsInOrderOfList());
    return this.http.post('/api/auth/updateProducts', this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            return this.http.post('/api/auth/updateProductCustomFields', this.fieldsForm.get('fields').value)
            .subscribe(
                (data2) => 
                {
                  this.getData();
                  this.openSnackBar("Документ \"Товары и услуги\" сохранён", "Закрыть");
                },
                error => console.log(error),
            );
          },
          error => console.log(error),
      );
  }

  getSpravSysPPR(){
          return this.loadSpravService.getSpravSysPPR()
          .subscribe((data) => {this.spravSysPPRSet=data as any[];},
          error => console.log(error));}
  getSpravSysNds(){
        this.loadSpravService.getSpravSysNds()
        .subscribe((data) => {this.spravSysNdsSet=data as any[];},
        error => console.log(error));}
  getSpravSysMarkableGroup(){
          return this.http.post('/api/auth/getSpravSysMarkableGroup', {}) 
          .subscribe((data) => {
            this.spravSysMarkableGroupSet=data as any[];
            this.updateValuesSpravSysMarkableGroup()},
          error => console.log(error));}
  getSpravSysEdizm():void {    
          let companyId=this.formBaseInformation.get('company_id').value;
          this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5)"})  // все типы ед. измерения
          .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
          this.updateValuesSpravSysEdizmOfProductAll();          },
          error => console.log(error));
          this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(2)"}) // все ед. измерения по типу: масса
          .subscribe((data) => {this.spravSysEdizmOfProductWeight = data as any[];},
          error => console.log(error));
          this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(5)"})  // все ед. измерения по типу: объём
          .subscribe((data) => {this.spravSysEdizmOfProductVolume = data as any[];},
          error => console.log(error));}

  updateValuesSpravSysEdizmOfProductAll(){                 // при загрузке загружается справочник и значение id единицы измерения.
    if(+this.formBaseInformation.get('edizm_id').value!=0) //надо заполнить поле названия единицы измерения из справочника по загруженному id
      {
        this.spravSysEdizmOfProductAll.forEach(x => {
          if(x.id==this.formBaseInformation.get('edizm_id').value){
            this.formBaseInformation.get('edizm_name').setValue(x.name);
          }
        })
      } 
      else 
      {
        this.formBaseInformation.get('edizm_name').setValue('');
        this.formBaseInformation.get('edizm_id').setValue('');
      }
  }
  //чтобы обнулить поле с id единицы измерения (оно невидимое) после стирания наименования ед. измерения
  checkEmptyProductEdizmField(){
    if( this.formBaseInformation.get('edizm_name').value.length==0){ 
      this.formBaseInformation.get('edizm_id').setValue(0);
    }
  }
  getProductBarcodesPrefixes(){
    return this.http.post('/api/auth/getProductBarcodesPrefixes', {"id1": this.formBaseInformation.get('company_id').value}) 
      .subscribe((data) => {
        let prefix = data as any[];
        this.st_prefix_barcode_pieced=prefix[0];
        this.st_prefix_barcode_packed=prefix[1];
      },
        
      error => console.log(error));}

  updateValuesSpravSysMarkableGroup(){
    if(+this.formBaseInformation.get('markable_group_id').value!=0)
      {
        this.spravSysMarkableGroupSet.forEach(x => {
          if(x.id==this.formBaseInformation.get('markable_group_id').value){
            this.formBaseInformation.get('markable_group_name').setValue(x.name);
          }
        })
      } 
      else 
      {
        this.formBaseInformation.get('markable_group_name').setValue('');
        this.formBaseInformation.get('markable_group_id').setValue('');
      }
  }
  checkEmptyMarkableGroup(){
    if( this.formBaseInformation.get('markable_group_name').value.length==0){
      this.formBaseInformation.get('markable_group_id').setValue(0);
    }
  }
//*****************************************************************************************************************************************/
//*********************************************           T R E E           ***************************************************************/
//*****************************************************************************************************************************************/
  loadTrees(){
    this.loadSpravService.getProductCategoriesTrees(this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {
        this.treeDataSource.data=data as any [];
        this.recountNumRootCategories();//пересчитать кол-во корневых категорий (level=0)

      }, error => console.log(error)
      );
  }
  expandParents(node: any) {
    const parent = this.getParent(node);
    this.treeControl.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(parent);
    }
  }  
  selectCheckboxesOfAllParents(node: any) {
    const parent = this.getParent(node);
    if (parent) {
      this.addCheckbox(this.getNodeId(parent)); //включает чекбокс у этого parent
      this.selectCheckboxesOfAllParents(parent);
    }
  }
  selectNode(node: any){
    console.log("node Id:"+node.id);
    this.selectedProductCategory.selectedNodeId=node.id;
    this.selectedProductCategory.selectedNodeName=node.name;
  }
  getNodeId(node: any):number{
    return(node.id);
  }
  getParent(node: any) {
    const currentLevel = this.treeControl.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node);
    //цикл по уровню, пока не уменьшится. как только уменьшился, этот node и есть parent
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
//***************************************************          I M A G E S      ***********************************************************/
//*****************************************************************************************************************************************/
  showMainImage(){
    const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
      data:
      { 
        link: this.imagesInfo[0].name,
      },
    });
  }
  showImage(name:string){
    const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
      data:
      { 
        link: name,
      },
    });
  }
  openDialogAddImages() {
    const dialogRef = this.dialogAddImages.open(FilesComponent, {
      width:  '90%', 
      height: '90%',
      data:
      { 
        mode: 'select',
        companyId: this.formBaseInformation.get('company_id').value
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result)this.addImagesToProduct(result);
    });
  }
  addImagesToProduct(filesIds: number[]){
    const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
            return this.http.post('/api/auth/addImagesToProduct', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Изображения добавлены", "Закрыть");
                    this.loadImagesInfo();
                            },
                  error => console.log(error),
              );
  }
  getImagesIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.imagesInfo.forEach(x => {
      i.push(+x.id);
    })
    return i;
  }
  loadImagesInfo(){//                                     загружает информацию по картинкам товара
      const body = {"id":this.id};//any_boolean: true - полные картинки, false - их thumbnails
            return this.http.post('/api/auth/getListOfProductImages', body) 
              .subscribe(
                  (data) => {  
                              this.imagesInfo = data as ImagesInfo[]; 
                              for (let i = 0; i < this.imagesInfo.length; i++) {
                                this.getImage('/api/auth/getFileImageThumb/' + this.imagesInfo[i].name).subscribe(blob => {
                                  this.createImageArrayFromBlob(blob,i);
                                });
                              }
                              this.loadMainImage();
                            },
                  error => console.log(error),
              );
  }
  getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  createImageArrayFromBlob(image: Blob, index:number) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.imagesInfo[index].image = reader.result;
      
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }
  createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.imageToShow = reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }
  dropImage(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.imagesInfo, event.previousIndex, event.currentIndex);
    this.loadMainImage();
  }
  loadMainImage(){
    console.log("imagesInfo: "+this.imagesInfo.length);
    if(this.imagesInfo.length>0){
      // this.noImageAddress="/api/public/getProductImage/"+this.imagesInfo[0].name;
      this.getImage('/api/auth/getFile/' + this.imagesInfo[0].name).subscribe(blob => {
        this.createImageFromBlob(blob);
      });
    } 
    // else this.noImageAddress="../../../../../../assets/images/no_foto.jpg";
  }

  clickBtnDeleteImage(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление изображения',
        query: 'Удалить изображение из карточки товара?',
        warning: 'Изображение не будет удалено безвозвратно, оно останется в Медиа-библиотеке.',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteImage(id);}
    });        
  }
  deleteImage(id:number){
    const body = {id: id, any_id:this.id}; 
    return this.http.post('/api/auth/deleteProductImage',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.loadImagesInfo();
                },
        error => console.log(error),
    );  
  }
  openFileCard(dockId:number) {
    const dialogRef = this.dialogAddImages.open(FilesDockComponent, {
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
//*****************************************************************************************************************************************/
//***************************************************        С A G E N T S      ***********************************************************/
//*****************************************************************************************************************************************/
  openDialogAddCagents() {
    const dialogRef = this.dialogAddCagents.open(CagentsComponent, {
      width:  '90%', 
      height: '90%',
      data:
      { 
        mode: 'select',
        companyId: this.formBaseInformation.get('company_id').value
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result)this.addCagentsToProduct(result);
    });
  }

  addCagentsToProduct(cagentsIds: number[]){
    console.log("cagentsIds:"+cagentsIds);
    const body = {"id1":this.id, "setOfLongs1":cagentsIds};// передаем id товара и id поставщиков 
            return this.http.post('/api/auth/addCagentsToProduct', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar("Поставщики добавлены", "Закрыть");
                    this.loadCagentsInfo();
                            },
                  error => console.log(error),
              );
  }

  loadCagentsInfo(){//загружает информацию по поставщикам товара
      const body = {"id":this.id};
            return this.http.post('/api/auth/getListOfProductCagents', body) 
              .subscribe(
                  (data) => {  
                              this.cagentsInfo = data as any[]; 
                              console.log("cagentsInfo:"+this.cagentsInfo);
                            },
                  error => console.log(error),
              );
  }
  dropCagent(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.cagentsInfo, event.previousIndex, event.currentIndex);
  }
  clickBtnDeleteCagent(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление поставщика',
        query: 'Удалить поставщика из карточки товара?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteCagent(id);}
    });        
  }

  deleteCagent(id:number){
    const body = {id1: id, id2:this.id}; 
    return this.http.post('/api/auth/deleteProductCagent',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.loadCagentsInfo();
                },
        error => console.log(error),
    );  
  }

  clickBtnEditCagentProperties(cagentId: number, cagentArticle: string, additional: string): void {
    console.log("--cagentId:"+cagentId);
    console.log("--cagentArticle:"+cagentArticle);
    console.log("--cagentAdditional:"+additional);
    const dialogRef = this.ProductCagentsDialogComponent.open(ProductCagentsDialogComponent, {
      width: '800px', 
      data:
      { 
        productId: +this.id,
        cagentId: +cagentId,
        cagentArticle: cagentArticle , 
        cagentAdditional: additional,
        dockName:"Свойства поставщика",
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadCagentsInfo();
    },
    error => console.log(error),);        
  }
  getCagentsIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.cagentsInfo.forEach(x => {
      i.push(+x.cagent_id);
    })
    return i;
  }
  openCagentCard(dockId:number) {
    const dialogRef = this.dialogAddImages.open(CagentsDockComponent, {
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
//*****************************************************************************************************************************************/
//***************************************************        B A R C O D E S      *********************************************************/
//*****************************************************************************************************************************************/
  openDialogAddBarcodes() {
    const dialogAddBarcodes = this.ProductBarcodesDialogComponent.open(ProductBarcodesDialogComponent, {
      width:  '800px', 
      //height: '500px',
      data:
      { 
        mode: 'create',
        companyId: this.formBaseInformation.get('company_id').value,
        productId: +this.id,
        dockName:"Добавление штрих-кода",
        value: "",
        barcode_id: "",
        description: "",
        product_code_free: this.formBaseInformation.get('product_code_free').value,
        st_prefix_barcode_pieced: this.st_prefix_barcode_pieced,
        st_prefix_barcode_packed: this.st_prefix_barcode_packed
      },
    });
    dialogAddBarcodes.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result) this.loadBarcodesInfo();
    });
  }

  loadBarcodesInfo(){//загружает информацию по штрих-кодам товара
      const body = {"id":this.id};
            return this.http.post('/api/auth/getListOfProductBarcodes', body) 
              .subscribe(
                  (data) => {  
                              this.barcodesInfo = data as any[]; 
                              console.log("barcodesInfo:"+this.barcodesInfo);
                            },
                  error => console.log(error),
              );
  }

  clickBtnDeleteBarcode(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление штрих-кода',
        query: 'Удалить штрих-код из карточки товара?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteBarcode(id);}
    });        
  }

  deleteBarcode(id: number){
    const body = {id1: id, id2:this.id}; 
    return this.http.post('/api/auth/deleteProductBarcode',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.loadBarcodesInfo();
                },
        error => console.log(error),
    );  
  }
  clickBtnEditBarcodeProperties(id: number, barcodeId: number, value: string, description: string, name: string): void {
    const dialogEditBarcodeProperties = this.ProductBarcodesDialogComponent.open(ProductBarcodesDialogComponent, {
      width: '800px', 
      data:
      { 
        mode: 'update',
        id: id,
        productId: +this.id,
        barcodeId: +barcodeId,
        description: description , 
        value: value,
        name: name,
        dockName:"Редактирование штрих-кода",
      },
    });
    dialogEditBarcodeProperties.afterClosed().subscribe(result => {
      if(result) this.loadBarcodesInfo();
    },
    error => console.log(error),);        
  }
  generateProductWeightCode(){
    this.isWeightCodeGenerating=true;
    const body = {"id1": this.id, "id2": this.formBaseInformation.get('company_id').value}; 
    return this.http.post('/api/auth/generateWeightProductCode',body)
    .subscribe(
        (data) => {   
                    this.setProductWeightCode(data as any);
                    this.isWeightCodeGenerating=false;
                    this.openSnackBar("Весовой код товара создан", "Закрыть");
                },
        error => {console.log(error),this.isWeightCodeGenerating=false;}
    );
  }

  setProductWeightCode(code:string): void{
    this.formBaseInformation.get('product_code').setValue(this.PrependZeros(code,5,''));
  }
// PrependZeros("1:2:3",2,":"); // "01:02:03"
// PrependZeros(1,2); // "01"
// PrependZeros(123,2); // "123"
// PrependZeros("1 2 3",3); // "001 002 003" 
// PrependZeros("5-10-2012",2,"-"); //"05-10-2012"
  PrependZeros (str: string, len: number, seperator: string) {
  if(typeof str === 'number' || Number(str)){
      str = str.toString();
      return (len - str.length > 0) ? new Array(len + 1 - str.length).join('0') + str: str;
  }
  else{
      for(var i = 0,spl = str.split(seperator || ' '); i < spl.length; spl[i] = (Number(spl[i])&& spl[i].length < len)?this.PrependZeros(spl[i],len,''):spl[i],str = (i == spl.length -1)?spl.join(seperator || ' '):str,i++);
      return str;
  }
};
 EditProductCodeFree(): void {
  if(this.allowToUpdate){
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Редактирование кода',
        warning: 'Открыть поле "Код" на редактирование?',
        query: 'Код присваивается системой автоматически. Если Вы хотите редактировать поле "Код", и вместе с тем оставить возможность системе генерировать код в последующих создаваемых товарах, пожалуйста, не исползуйте более 9 цифр в коде.',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.product_code_free_isReadOnly = false ;
        setTimeout(() => { this.codeFreeValue.nativeElement.focus(); }, 500);}
    });  
  } 
}
checkProductCodeFreeUnical() {
  if(!this.formBaseInformation.get('product_code_free').errors)
  {
    let Unic: boolean;
    this.isProductCodeFreeUnicalChecking=true;
    const body = {
      "id3": this.id, 
      "id1": +this.formBaseInformation.get('company_id').value,
      "id2": this.formBaseInformation.get('product_code_free').value}; 
    return this.http.post('/api/auth/isProductCodeFreeUnical',body)
    .subscribe(
        (data) => {   
                    Unic = data as boolean;
                    if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Введённый код не является уникальным.',}});
                    this.isProductCodeFreeUnicalChecking=false;
                },
        error => {console.log(error),this.isProductCodeFreeUnicalChecking=false;}
    );
  }
}

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  
  doFilterCompaniesList(){
    console.log('doFilterCompaniesList - allowToViewAllCompanies: '+this.allowToViewAllCompanies);
      let myCompany:idAndName;
      if(!this.allowToCreateAllCompanies){
        this.receivedCompaniesList.forEach(company=>{
        if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
        this.receivedCompaniesList=[];
        this.receivedCompaniesList.push(myCompany);
      }
      if(!this.allowToViewAllCompanies){
        this.receivedCompaniesListForHistoryReport.forEach(company=>{
        if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
        this.receivedCompaniesListForHistoryReport=[];
        this.receivedCompaniesListForHistoryReport.push(myCompany);
      }
  }

//************************************************************* ОТЧЕТ ПО ТОВАРАМ *************************************************************/    
  setDefaultDates(){
    //this.formProductHistory.dateFrom=moment().startOf('month');
    this.formProductHistory.dateFrom=moment([2000, 0, 1]);
    this.formProductHistory.dateTo=moment().endOf('month');
  }

  addEvent(type: string, event: any) {
    console.log("type="+type);
    if(type=='dateFrom') this.formProductHistory.dateFrom = event.value;
    else this.formProductHistory.dateTo = event.value;
    this.getTable();
  }
  getTable(){
    // let depIdHasChanged:boolean=false;
    this.formProductHistory.productId=+this.id;
    this.formProductHistory.dockTypesIds=this.checkedChangesList;
    // if(this.formProductHistory.departmentId==0){
      // let ids:number[]=[];
      // depIdHasChanged=true;
      // this.receivedMyDepartmentsList.forEach(r=>{
        // ids.push(+r.id);
      // });
      // this.formProductHistory.departmentId=(ids.length>1?0:);
    // } // если нужно вывести по всем отделениям - отправляем 0, либо id отделения, если по выбранному
    this.productHistoryService.getTable(this.formProductHistory)
            .subscribe(
                (data) => {
                  this.dataSource.data=data as any []; 
                },
                error => console.log(error) 
            );
    // if(depIdHasChanged)this.formProductHistory.departmentId=0;
  }
  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('department');
    this.displayedColumns.push('docName');
    this.displayedColumns.push('change');
    this.displayedColumns.push('quantity');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('last_operation_price');
    this.displayedColumns.push('last_purchase_price');
    this.displayedColumns.push('avg_purchase_price');
    this.displayedColumns.push('avg_netcost_price');
  }
  getPricesTableHeaderTitles(){
    this.pricesDisplayedColumns=['price_name', 'price_value'];
  }

  setSort(valueSortColumn:any) // set sorting column
  {
      if(valueSortColumn==this.formProductHistory.sortColumn){// если колонка, на которую ткнули, та же, по которой уже сейчас идет сортировка
          if(this.formProductHistory.sortAsc=="asc"){
              this.formProductHistory.sortAsc="desc"
          } else {  
              this.formProductHistory.sortAsc="asc"
          }
      // Cookie.set('writeoff_sortAsc',this.formProductHistory.sortAsc);
      } else {
          this.formProductHistory.sortColumn=valueSortColumn;
          this.formProductHistory.sortAsc="asc";
          // Cookie.set('writeoff_sortAsc',"asc");
          // Cookie.set('writeoff_sortColumn',valueSortColumn);
      }
      this.getTable();
  }
  setNumOfPages(){
    // this.clearCheckboxSelection();
    // this.createCheckedList();
    this.formProductHistory.offset=0;
    // Cookie.set('acceptance_result',this.sendingQueryForm.result);
    this.getTable();
  }
  clickDocumentCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
  } 
  createCheckedList(){//checkedChangesList - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при загрузке страницы и при нажатии на чекбокс, а при 
    this.checkedChangesList = [];//                                                       отправке данных внедряется в поле формы selectedUserGroupPermissions
      console.log("createCheckedList!!!");
      this.documentsIds.forEach(z=>{
        console.log("object z - "+z+", z.id - "+z.id+", z.name - "+z.name)
        if(this.selection.isSelected(z))
          this.checkedChangesList.push(+z.id);
      })

    // console.log("****checkedChangesList - "+JSON.stringify(this.checkedChangesList));
  }
  getProductPrices(){
    this.receivedPriceTypesList=null;
    const control = <FormArray>this.formBaseInformation.get('productPricesTable');
    control.clear();
    this.loadSpravService.getProductPrices(+this.id)
    .subscribe(
      (data) => {this.receivedPriceTypesList=data as ProductPricesTable [];
        //получили список цен товара с их значениями (или с 0 если такая цена для товара не установлена)
        //теперь нужно создать FormArray для редактирования цен:
        if(this.receivedPriceTypesList.length>0){
          this.receivedPriceTypesList.forEach(row=>{
            control.push(this.formingProductPricesRow(row));
          });
        }



      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  //формирование строки для FormArray
  formingProductPricesRow(row: ProductPricesTable) {
    return this._fb.group({
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      price_type_id: new FormControl (row.price_type_id,[]),
      price_name: new FormControl (row.price_name,[]),
      price_value: new FormControl (row.price_value,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      price_description: new FormControl (row.price_description,[]),
    });
  }

  getControlPriceTable(){
    const control = <FormArray>this.formBaseInformation.get('productPricesTable');
    return control;
  }

  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}

  getRowId():number{
    let current_row_id:number=this.row_id;
    this.row_id++;
    return current_row_id;
  }

  trackByIndex(i) { return i; }

  copyPrice(price_value:number){
    const control = this.getControlPriceTable();
     let row_index:number=0;
      this.formBaseInformation.value.productPricesTable.map(() => 
        {
          control.controls[row_index].get('price_value').setValue(+price_value);
          row_index++;
        });
  }
}
