import { Component, OnInit, ViewChild, Inject, Optional, Output, EventEmitter } from '@angular/core';
import { ProductHistoryQuery } from './product-history-form';
import { ProductHistoryService } from './get-producthistory-table.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl, UntypedFormArray, UntypedFormBuilder, FormArray,FormGroup, FormControl} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog,  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { CagentsDocComponent } from '../cagents-doc/cagents-doc.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { UploadFileService } from './upload-file.service';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { FilesComponent } from '../files/files.component';
import { CagentsComponent } from '../cagents/cagents.component';
import { ProductCagentsDialogComponent } from 'src/app/ui/dialogs/product-cagents-dialog/product-cagents-dialog.component';
import { ProductBarcodesDialogComponent } from 'src/app/ui/dialogs/product-barcodes-dialog/product-barcodes-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// import { AngularEditorConfig } from '@kolkov/angular-editor';
import { TemplatesDialogComponent } from 'src/app/modules/settings/templates-dialog/templates-dialog.component';
import { LabelsPrintDialogComponent } from 'src/app/modules/settings/labelprint-dialog/labelprint-dialog.component';


const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface docResponse {//интерфейс для получения ответа в запросе значений полей документа
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
  edizm_id: number;
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
  type:String;
  slug:String;
  featured:Boolean;
  short_description:String;
  virtual:Boolean;
  downloadable:Boolean;
  download_limit:number;
  download_expiry:number;
  external_url:String;
  button_text:String;
  tax_status:String;
  manage_stock:Boolean;
  low_stock_threshold:String;
  stock_status:String;
  backorders:String;
  sold_individually:Boolean;
  height:String;
  width:String;
  length:String;
  shipping_class:String;
  reviews_allowed:Boolean;
  parent_id:number;
  purchase_note:String;
  menu_order:number;
  date_on_sale_to_gmt: string;
  date_on_sale_from_gmt: string;
  upsell_ids:IdAndName[];
  crosssell_ids:IdAndName[];
  grouped_ids:IdAndName[];
  outofstock_aftersale: boolean;        // auto set product as out-of-stock after it has been sold
  label_description: string;
  description_html: string;       // custom HTML full description
  short_description_html: string; // custom HTML short description
  description_type: string;       // "editor" or "custom"
  short_description_type: string; // "editor" or "custom"
  storeProductTranslations: StoreProductTranslation[];
  defaultAttributes:DefaultAttribute[];
  productVariations:ProductVariation[];
  variation: boolean;
  productResourcesTable:any[];
  }
  interface SpravTaxesSet{
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
  interface DownloadableFilesInfo {
    id: string;
    name: string;
    original_name: string;
    output_order: string;
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
  interface IdAndName{ //универсалный интерфейс для выбора из справочников
    id: string;
    name: string;
  }
  interface ProductAttribute{ // interface to getting product attributes
    attribute_id: number;
    name: string;
    visible: boolean;
    variation: boolean;
    terms: ProductAttributeTerms[];  // contains: id, name, is_selected
  }
  interface ProductAttributeTerms{
    id: number;
    name: string;
    is_selected: boolean;
  }  
  interface ProductAttributeForAttributesList{
    id: number;
    name: string;
    terms: ProductAttributeTermsForAttributesList[]; 
    terms_ids: number[]; //    List of selected term ids
  }
  interface ProductAttributeTermsForAttributesList{
    id: number;
    name: string;
    description: string;
    slug: string;
  }
  interface ProductAttributeForm{ // interface to sending product attributes
    attribute_id;
    terms_ids: number[]; //    List of selected term ids
    position;            //	   Attribute position
    visible;             //    Define if the attribute is visible on the "Additional information" tab in the product's page. Default is false.
    variation;           //    Define if the attribute can be used as variation. Default is false.
  }
  interface DefaultAttribute { // default value of attribute that will be selected if user opens the card of variable product
    attribute_id: number;   // Attribute ID 
    term_id: number;        // Selected attribute term id
    name: string;           // Attribute name
    term: string;           // Selected attribute term name
  }
  interface ProductVariation{
    id: number;   // variation ID
    product_id: number;   // Variable (parent) product ID 
    variation_product_id:number  // variation (child) product ID.
    variation_product_name:string  // variation (child) product name.
    menu_order: number;
    productVariationsRowItems:ProductVariationsRowItems[]
  }
  interface ProductVariationsRowItems{
    variation_id:number  //,
    attribute_id:number  //,
    term_id:number  //,
    terms:any[] //used only in frontend to generate droplist of terms
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
    type: string;                 // the type of template/ It can be: "document", "label"
    num_labels_in_row:number;     // quantity of labels in the each row
  }

  export interface DocTable {
    id: number;
  }
  export interface NumRow {//интерфейс для списка количества строк
    value: number;
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
    price: number;
  }
  interface ProductPricesTable { //интерфейс для формы, массив из которых будет содержать форма ProductPricesTable, входящая в formBaseInformation, которая будет включаться в formBaseInformation
    price_type_id: number;
    price_name: number;
    price_value: number;
    price_description: string;    
    is_store_price_type_regular: boolean;
    is_store_price_type_sale: boolean;
  }
  interface StoreProductTranslation{
    name: string;
    slug: string;
    description: string;
    descriptionHtml: string;
    shortDescription: string;
    shortDescriptionHtml: string;
    langCode: string ;
  }
@Component({
  selector: 'app-products-doc',
  templateUrl: './products-doc.component.html',
  styleUrls: ['./products-doc.component.css'],
  providers: [LoadSpravService,UploadFileService,ProductHistoryService,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})

export class ProductsDocComponent implements OnInit {
  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
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

  // WYSIWYG editor
  name = 'Angular 6';
  htmlContent = '';

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
  rightsDefined:boolean; // определены ли права !!!
  editability:boolean = false;//редактируемость.

  //печать документов
  gettingTemplatesData: boolean = false; // идёт загрузка шаблонов
  templatesList:TemplatesList[]=[]; // список загруженных шаблонов

  // Отчет по товарам Изменения
  formProductHistory: ProductHistoryQuery=new ProductHistoryQuery();//форма, содержащая информацию для запроса отчета об истории изменения количества товара на складе
  donePagesList: boolean = false;
  // receivedCompaniesListForHistoryReport: any [];//массив для получения списка предприятий
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DocTable []=[] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы с действиями с товаром
  pricesDisplayedColumns: string[]=[];//массив отображаемых столбцов таблицы с ценами на товар
  selection = new SelectionModel<IdAndName>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: IdAndName [] = [];//массив для получения списка СВОИХ отделений
  productHistoryTable: ProductHistoryTable[]=[];//массив для получения данных по отчету об истории изменений товара
  numRows: NumRow[] = [
    {value: 10, viewValue: '10'},
    {value: 25, viewValue: '25'},
    {value: 50, viewValue: '50'},
    {value: 100, viewValue: '100'},
  ];
  documentsIds: IdAndName [] = [];
  checkedChangesList:number[]=[]; //массив для накапливания id выбранных документов чекбоксов в отчете по истории товара, вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  gettingTableData:boolean=false;
  checkedList:any[]; //массив для накапливания id выбранных чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  searchProductGroupsCtrl = new UntypedFormControl();
  fieldsForm: UntypedFormGroup;
  dataFields: any;
  receivedSetsOfFields: any [] = [] ;//массив для получения сетов полей
  fieldIdEditNow:number=0;    //     id редактируемого кастомного поля в fieldsForm  
  fieldIndexEditNow:number=0; //  index редактируемого кастомного поля в fieldsForm  
  prefixes: any[];
  st_prefix_barcode_pieced:number=0;
  st_prefix_barcode_packed:number=0;
  // filteredProductGroups: any;
  isLoading = false;
  isProductGroupLoading = false;
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  errorMsg: string;
  isWeightCodeGenerating = false;
  isProductCodeFreeUnicalChecking = false;
  product_code_free_isReadOnly = true ;
  mode: string = 'standart';  // режим работы документа:
  // standart - обычный режим, 
  // createFromAnotherDoc - оконный режим создания товара из другого документа, 
  // viewInWindow - открытие на просмотр в окне в другом документе
  selectedTab = new FormControl(0); // the index of selected tab
  @ViewChild("codeFreeValue", {static: false}) codeFreeValue;
  @Output() baseData: EventEmitter<any> = new EventEmitter(); // for get base datа from parent component (like myId, myCompanyId etc)
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
  noImageAddress: string="../../../../../../assets_/images/no_foto.jpg"; // заглушка для главной картинки товара
  //******* файлы для интернет-магазина */
  downloadableFilesInfo: DownloadableFilesInfo[] = [];
  // ******  переменные поставщиков ******
  cagentsInfo : cagentsInfo [] = []; //массив для получения информации 
  // ******  переменные штрихкодов  ******
  barcodesInfo : barcodesInfo [] = []; //массив для получения информации 
  // ******  справочники  ******************
  spravSysPPRSet: any[]=[];//сет признаков предмета расчета 
  spravTaxesSet: SpravTaxesSet[]=[];//сет НДС 
  spravSysMarkableGroupSet: IdAndName[] = [];//сет маркированных товаров
  filteredSpravSysMarkableGroupSet: Observable<IdAndName[]>;//сет маркированных товаров
  spravSysEdizmOfProductAll: any[] = [];// массив, куда будут грузиться все единицы измерения товара
  filteredSpravSysEdizmOfProductAll: Observable<IdAndName[]>; //массив для отфильтрованных единиц измерения
  spravSysEdizmOfProductWeight: any[]=[];// весовые единицы измерения товара
  spravSysEdizmOfProductVolume: any[]=[];// объёмные единицы измерения товара
  // переменные атрибутов
  productAttributes:ProductAttribute[];  
  productAttributesList:ProductAttributeForAttributesList[];
  ProductAttributesToSave:ProductAttributeForm[];
  selectedAttribute: ProductAttributeForAttributesList={
    id: null,
    name: '',
    terms: [], // list of all attribete's terms
    terms_ids: [] // list of selected terms
  };

  loadedProductVariations:ProductVariation[];
  thereIsAttributesUsedForVariationsWithSelectedTerms=false; // read its name
  prop_menu: string = 'inventory';


  html = '';
  tools = {
    toolbar: [      
      // [{ header: [1, 2, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      ['bold', 'italic', 'underline'],
      // [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      // [{ 'script': 'super' }, { 'script': 'sub' }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      ['link', 'video'],
      [ 'clean', 'divider' ]
    ]
  };

  // reg_price: any; // Regular price in Store
  // sales_price: any; // Sales price in Store
  is_store: boolean = false;
  is_vat: boolean = false;
  is_vat_included:boolean = false;
  reg_price_selected: boolean = false;  // Regular price in Store settings is selected
  sales_price_selected: boolean = false; // Sales price in Store settings is selected
  store_sku:string='';  
  selectedUpsellProducts:     IdAndName[]=[]; // выбранные upsell товары
  selectedCrosssellProducts:  IdAndName[]=[]; // выбранные cross-sell товары
  selectedGroupedProducts:  IdAndName[]=[]; // выбранные cross-sell товары
  isVariation: boolean = false;

  // Store Translations variables
  storeDefaultLanguage: string = ''; // default language from Company settings ( like EN )
  storeLanguagesList: string[] = [];  // the array of languages from all stores like ["EN","RU", ...]
  storeProductTranslations: StoreProductTranslation[]=[]; // the list of translated product's data
  storeTranslationModeOn = false; // translation mode ON

  // Resources variables +++
  resourcesList : any [] = []; //массив для получения всех статусов текущего документа
  gettingResourcesTableData: boolean = false;//идет загрузка списка ресурсов
  resource_row_id:number=0;
  formResourceSearch:any;// форма для выбора ресурса и последующего формирования строки таблицы
  showResourceSearchFormFields:boolean = false;
  showSearchFormFields:boolean = false;
  displayedResourcesColumns: string[]=[];//массив отображаемых столбцов таблицы с ресурсами


  constructor(private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private httpService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    public ConfirmDialog: MatDialog,
    private _fb: UntypedFormBuilder, //чтобы билдить группы форм productPricesTable и другие
    public productHistoryService: ProductHistoryService,
    public MessageDialog: MatDialog,
    public dialogAddImages: MatDialog,
    public dialogAddCagents: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    public ShowImageDialog: MatDialog,
    public ProductCagentsDialogComponent: MatDialog,
    private _router:Router,
    public ProductBarcodesDialogComponent: MatDialog,
    private templatesDialogComponent: MatDialog,
    private labelsPrintDialogComponent: MatDialog,
    public dialogRefProduct: MatDialogRef<ProductsDocComponent>,
    private _adapter: DateAdapter<any>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) { 
      if(activateRoute.snapshot.params['id'])
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
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      company: new UntypedFormControl      ('',[]),
      productgroup_id: new UntypedFormControl      ('',[]),
      productgroup: new UntypedFormControl      ('',[]),
      article: new UntypedFormControl      ('',[]),
      name: new UntypedFormControl      ('',[Validators.required]),
      description: new UntypedFormControl      ('',[Validators.maxLength(100000)]),
      selectedProductCategories:new UntypedFormControl      ([],[]),
      imagesIdsInOrderOfList:new UntypedFormControl      ([],[]),
      dfilesIdsInOrderOfList:new UntypedFormControl      ([],[]),
      cagentsIdsInOrderOfList:new UntypedFormControl      ([],[]),
      product_code: new UntypedFormControl      ('',[]),
      product_code_free: new UntypedFormControl      ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      ppr_id: new UntypedFormControl      (1,[]),
      by_weight: new UntypedFormControl      ('',[]),
      edizm_name: new UntypedFormControl      ('',[Validators.required]),
      edizm_id: new UntypedFormControl      (null,[Validators.required]),
      nds_id: new UntypedFormControl      (null,[]),
      weight: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,12}(?:[.,][0-9]{0,3})?\r?$')]),
      volume: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,12}(?:[.,][0-9]{0,3})?\r?$')]),
      weight_edizm_id: new UntypedFormControl      ('',[]),
      volume_edizm_id: new UntypedFormControl      ('',[]),
      markable: new UntypedFormControl      ('',[]),
      markable_group_name: new UntypedFormControl      ('',[]),
      markable_group_id: new UntypedFormControl      ('',[]),
      excizable: new UntypedFormControl      ('',[]),
      not_buy: new UntypedFormControl      ('',[]),
      not_sell: new UntypedFormControl      ('',[]),
      indivisible: new UntypedFormControl      (true,[]),
      productPricesTable: new UntypedFormArray([]),//массив с формами цен
      defaultAttributes: new UntypedFormArray([]),//массив с формами дефолтных атрибутов
      productVariations: new UntypedFormArray([]),//массив с формами вариаций
      short_description: new UntypedFormControl      ('',[Validators.maxLength(100000)]),
      type: new UntypedFormControl      ('simple',[]),
      slug: new UntypedFormControl      ('',[]),
      featured: new UntypedFormControl      ('',[]),
      virtual: new UntypedFormControl      (false,[]),
      downloadable: new UntypedFormControl      (false,[]),
      download_limit: new UntypedFormControl      ('',[Validators.maxLength(8),Validators.pattern('^[0-9]{1,10}$')]),
      download_expiry: new UntypedFormControl      ('',[Validators.maxLength(8),Validators.pattern('^[0-9]{1,10}$')]),
      external_url: new UntypedFormControl      ('',[Validators.maxLength(250)]),
      button_text: new UntypedFormControl      ('',[Validators.maxLength(60)]),
      tax_status: new UntypedFormControl      ('taxable',[]),
      manage_stock: new UntypedFormControl      (false,[]),
      low_stock_threshold: new UntypedFormControl      ('0',[Validators.pattern('^[0-9]{1,9}(?:[.,][0-9]{0,3})?\r?$')]),
      stock_status: new UntypedFormControl      ('instock',[]),
      backorders: new UntypedFormControl      ('no',[]),
      sold_individually: new UntypedFormControl (false,[]),
      // reg_price: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // sale_price: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      height: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      width: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      length: new UntypedFormControl      ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      shipping_class: new UntypedFormControl      ('',[]),
      reviews_allowed: new UntypedFormControl      (true,[]),
      parent_id: new UntypedFormControl      ('',[]),
      purchase_note: new UntypedFormControl      ('',[]),
      menu_order: new UntypedFormControl      (1,[Validators.maxLength(8),Validators.pattern('^[0-9]{1,10}$')]),
      date_on_sale_to_gmt: new UntypedFormControl      ('',[]),
      date_on_sale_from_gmt: new UntypedFormControl      ('',[]),
      upsell_ids: new UntypedFormControl([],[]),
      crosssell_ids: new UntypedFormControl([],[]),
      grouped_ids: new UntypedFormControl([],[]),
      productAttributes: new UntypedFormArray ([],[]) ,
      // productAttributes: new UntypedFormControl([],[]),
      outofstock_aftersale:        new UntypedFormControl   (false,[]), // auto set product as out-of-stock after it has been sold
      label_description:  new UntypedFormControl      ('',[Validators.maxLength(2000)]),
      description_html: new UntypedFormControl      ('',[Validators.maxLength(100000)]),       // custom HTML full description
      short_description_html: new UntypedFormControl      ('',[Validators.maxLength(100000)]), // custom HTML short description
      description_type: new UntypedFormControl      ('editor',[]),       // "editor" or "custom"
      short_description_type: new UntypedFormControl      ('editor',[]), // "editor" or "custom"
      storeProductTranslations: new UntypedFormArray ([]) ,
      productResourcesTable: new UntypedFormArray([]),//массив с формами ресурсов
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
    this.formResourceSearch = new UntypedFormGroup({
      resource_id: new UntypedFormControl ('' ,[Validators.required]),      
      name: new UntypedFormControl ('' ,[Validators.required]),
      resource_qtt: new UntypedFormControl (0 ,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      // description: new UntypedFormControl ('' ,[]),      
    });

    this.selectedProductCategory = new UntypedFormGroup({
      selectedNodeId: new UntypedFormControl      ('',[]),
      SelectedNodeName: new UntypedFormControl      ('',[]),
    });
    this.checkedList = [];
    this.fillDocumentsList();
    this.documentsIds.forEach(z=>{this.selection.select(z);this.checkedChangesList.push(+z.id);});
    this.getSetOfPermissions();
    // getting base data from parent component
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
    this.getBaseData('myDepartmentsList');    


    // this.onProductGroupValueChanges();//отслеживание изменений поля "Группа товаров"
    this.loadMainImage();// при создании документа загрузится картинка "no image"
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
      if(this.mode=='viewInWindow'){
        this.id=this.data.docId; 
        this.formBaseInformation.get('id').setValue(this.id);
        this.getSettings(); //to set locale
      }
      if(this.mode=='createFromAnotherDoc'){
        this.formBaseInformation.get('company_id').setValue(this.data.companyId); 
        this.getSettings(); //to set locale}
      } 
    }
    // let Inline = Quill.import('blots/inline');
    // class XVideoBlot extends Inline { }
    // XVideoBlot.blotName = 'xvideo';
    // XVideoBlot.tagName = 'x-video';    
    // Quill.register(XVideoBlot);

    // let BlockEmbed = Quill.import('blots/block/embed');
    // class DividerBlot extends BlockEmbed { }
    // DividerBlot.blotName = 'divider';
    // DividerBlot.tagName = 'hr';

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
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //
        );
}

getCRUD_rights(){
  console.log("in getCRUD_rights");
  this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==163)});
  this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==164)});
  this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==167)});
  this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==168)});
  this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==169)});
  this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==170)});
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
  this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
  this.loadTrees();
  this.rightsDefined=true;//!!!
  return true;
}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    
    if(+this.id>0){
      this.getDocumentValuesById();
      // this.getSets();
      this.loadImagesInfo();
      this.loadDownloadableFilesInfo();
      this.loadCagentsInfo();
      this.loadBarcodesInfo();
    } else {
      this.getCompaniesList();
    }
  }
  getCompaniesList(){ //
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList()
        .subscribe(
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              // this.receivedCompaniesListForHistoryReport=data as any [];
              this.doFilterCompaniesList();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
    else this.doFilterCompaniesList();
  }
  getMyCompanyId(){ //
    console.log("in getMyCompanyId");
    console.log("+this.myCompanyId=",+this.myCompanyId);
    if(+this.myCompanyId==0){
      console.log(" Getting myCompanyId...",);
      this.loadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;          
          console.log("+this.myCompanyId=",+this.myCompanyId);
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
      } else this.getCRUD_rights();
  }
  getMyDepartmentsList(){
    if(this.receivedMyDepartmentsList.length==0)
      this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.setDefaultDepartment();
                
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.setDefaultDepartment();
  }

  setDefaultCompany(){
    console.log("setDefaultCompany");
    //если документ создан - устанавливаем дефолтное предприятие для отчёта
    if(+this.id>0){
      // this.formProductHistory.companyId=this.myCompanyId;
      this.getDepartmentsList();
    }else{//если еще не создан - устанавливаем дефолтное предприятие для документа
      
      if(this.allowToCreateAllCompanies)
        this.formBaseInformation.get('company_id').setValue(Cookie.get('products_companyId')=="0"?this.myCompanyId:+Cookie.get('products_companyId'));
      else
        this.formBaseInformation.get('company_id').setValue(this.myCompanyId);

      this.getSpravTaxes();//загрузка налогов
      this.getStoresLanguagesList();
      this.getSpravSysEdizm();
      this.refreshPermissions();
    }
  }
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.formBaseInformation.get('company_id').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                            this.getMyDepartmentsList();},
                error => console.log(error)
            );
  }

  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      // console.log('установка отделения по умолчанию - '+this.receivedDepartmentsList[0].id);
      this.formProductHistory.departmentId=+this.receivedDepartmentsList[0].id;
      // Cookie.set('acceptance_departmentId',this.formProductHistory.departmentId);
    } else this.formProductHistory.departmentId="0";
    this.setDefaultDates();
  }
  // ----------------------+----------------------  Store Translations start ----------------------+----------------------  
getStoresLanguagesList(){
  this.http.get('/api/auth/getStoresLanguagesList?company_id='+this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {   
                  this.storeLanguagesList = data as any[];
                  this.getStoreDefaultLanguageOfCompany();
                },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //
  );
}

getStoreDefaultLanguageOfCompany(){
  this.http.get('/api/auth/getStoreDefaultLanguageOfCompany?company_id='+this.formBaseInformation.get('company_id').value).subscribe(
      (data) => {   
                  this.storeDefaultLanguage = data as string;
                  this.fillStoreProductTranslationsArray();
                },  
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //
  );
}

fillStoreProductTranslationsArray(){
  const add = this.formBaseInformation.get('storeProductTranslations') as UntypedFormArray;
  add.clear();
  this.storeLanguagesList.forEach(langCode =>{
    if(langCode!=this.storeDefaultLanguage)
      add.push(this._fb.group(this.getProductTranslation(langCode)));
  });
  //  alert(this.formBaseInformation.get('storeProductTranslations').value.length);
}

getProductTranslation(currLangCode:string):StoreProductTranslation {
  let result:StoreProductTranslation = {
    name:         '', 
    slug:         '',
    langCode:     currLangCode,
    description: '',
    descriptionHtml: '',
    shortDescription: '',
    shortDescriptionHtml: ''
  }
  this.storeProductTranslations.forEach(translation =>{
    if(currLangCode==translation.langCode)
      result = {
        name: translation.name, 
        slug: translation.slug, 
        langCode: currLangCode,
        description: translation.description,
        descriptionHtml: translation.descriptionHtml,
        shortDescription: translation.shortDescription,
        shortDescriptionHtml: translation.shortDescriptionHtml
      }
  });
  return result;
}

changeTranslationMode(){if(this.storeTranslationModeOn) this.storeTranslationModeOn=false; else this.storeTranslationModeOn=true;}
// ----------------------+----------------------  Store Translations end ----------------------+---------------------- 
  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.http.post('/api/auth/getProductValues', docId)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
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
                  this.formBaseInformation.get('productgroup_id').setValue(documentValues.productgroup_id==null?null:+documentValues.productgroup_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formBaseInformation.get('article').setValue(documentValues.article);
                  this.store_sku=this.formBaseInformation.get('article').value
                  this.formBaseInformation.get('product_code').setValue(documentValues.product_code?this.PrependZeros(documentValues.product_code,5,''):'');
                  this.formBaseInformation.get('product_code_free').setValue(documentValues.product_code_free?this.PrependZeros(documentValues.product_code_free,10,''):'');
                  this.formBaseInformation.get('ppr_id').setValue(documentValues.ppr_id==null?null:+documentValues.ppr_id);
                  this.formBaseInformation.get('by_weight').setValue(documentValues.by_weight);
                  this.formBaseInformation.get('edizm_id').setValue(documentValues.edizm_id==null?null:+documentValues.edizm_id);
                  this.formBaseInformation.get('nds_id').setValue(documentValues.nds_id==null?null:+documentValues.nds_id);
                  this.formBaseInformation.get('weight').setValue(documentValues.weight);
                  this.formBaseInformation.get('volume').setValue(documentValues.volume);
                  this.formBaseInformation.get('weight_edizm_id').setValue(documentValues.weight_edizm_id==null?null:+documentValues.weight_edizm_id);
                  this.formBaseInformation.get('volume_edizm_id').setValue(documentValues.volume_edizm_id==null?null:+documentValues.volume_edizm_id);
                  this.formBaseInformation.get('markable').setValue(documentValues.markable);
                  this.formBaseInformation.get('markable_group_id').setValue(documentValues.markable_group_id==null?null:+documentValues.markable_group_id);
                  this.formBaseInformation.get('excizable').setValue(documentValues.excizable);
                  this.formBaseInformation.get('not_buy').setValue(documentValues.not_buy);
                  this.formBaseInformation.get('not_sell').setValue(documentValues.not_sell);
                  this.formBaseInformation.get('indivisible').setValue(documentValues.indivisible);
                  this.formBaseInformation.get('short_description').setValue(documentValues.short_description);                  
                  this.formBaseInformation.get('type').setValue(documentValues.type);
                  this.formBaseInformation.get('slug').setValue(documentValues.slug);
                  this.formBaseInformation.get('featured').setValue(documentValues.featured);
                  this.formBaseInformation.get('virtual').setValue(documentValues.virtual);
                  this.formBaseInformation.get('downloadable').setValue(documentValues.downloadable);
                  this.formBaseInformation.get('download_limit').setValue(documentValues.download_limit==-1?null:documentValues.download_limit);
                  this.formBaseInformation.get('download_expiry').setValue(documentValues.download_expiry==-1?null:documentValues.download_expiry);
                  this.formBaseInformation.get('external_url').setValue(documentValues.external_url);
                  this.formBaseInformation.get('button_text').setValue(documentValues.button_text);
                  this.formBaseInformation.get('tax_status').setValue(documentValues.tax_status);
                  this.formBaseInformation.get('manage_stock').setValue(documentValues.manage_stock);
                  this.formBaseInformation.get('low_stock_threshold').setValue(documentValues.low_stock_threshold);
                  this.formBaseInformation.get('stock_status').setValue(documentValues.stock_status);
                  this.formBaseInformation.get('backorders').setValue(documentValues.backorders);
                  this.formBaseInformation.get('sold_individually').setValue(documentValues.sold_individually);
                  this.formBaseInformation.get('height').setValue(documentValues.height);
                  this.formBaseInformation.get('width').setValue(documentValues.width);
                  this.formBaseInformation.get('length').setValue(documentValues.length);
                  this.formBaseInformation.get('shipping_class').setValue(documentValues.shipping_class);
                  this.formBaseInformation.get('reviews_allowed').setValue(documentValues.reviews_allowed);
                  this.formBaseInformation.get('parent_id').setValue(documentValues.parent_id);
                  this.formBaseInformation.get('purchase_note').setValue(documentValues.purchase_note);
                  this.formBaseInformation.get('menu_order').setValue(documentValues.menu_order);
                  this.formBaseInformation.get('date_on_sale_from_gmt').setValue(documentValues.date_on_sale_from_gmt?moment(documentValues.date_on_sale_from_gmt,'DD.MM.YYYY'):"");
                  this.formBaseInformation.get('date_on_sale_to_gmt').setValue(documentValues.date_on_sale_to_gmt?moment(documentValues.date_on_sale_to_gmt,'DD.MM.YYYY'):"");     
                  this.formBaseInformation.get('outofstock_aftersale').setValue(documentValues.outofstock_aftersale); 
                  this.formBaseInformation.get('label_description').setValue(documentValues.label_description); 
                  this.formBaseInformation.get('description_html').setValue(documentValues.description_html);        // custom HTML full description
                  this.formBaseInformation.get('short_description_html').setValue(documentValues.short_description_html);  // custom HTML short description
                  this.formBaseInformation.get('description_type').setValue(documentValues.description_type);        // "editor" or "custom"
                  this.formBaseInformation.get('short_description_type').setValue(documentValues.short_description_type);  // "editor" or "custom"
                  // this.formBaseInformation.get('defaultAttributes').setValue(documentValues.defaultAttributes);
                  this.loadedProductVariations=documentValues.productVariations;  

                  const defaultAttributes = this.formBaseInformation.get('defaultAttributes') as UntypedFormArray;
                  defaultAttributes.clear();
                  documentValues.defaultAttributes.forEach(m =>{
                      defaultAttributes.push(this._fb.group({
                        name:m.name,
                        attribute_id: m.attribute_id,
                        term_id: m.term_id,
                      }));
                  });

                  this.storeProductTranslations=documentValues.storeProductTranslations;
                  this.searchProductGroupsCtrl.setValue(documentValues.productgroup);
                  this.checkedList=documentValues.product_categories_id;
                  this.formProductHistory.companyId=this.formBaseInformation.get('company_id').value;
                  this.selectedUpsellProducts=documentValues.upsell_ids?documentValues.upsell_ids:[];
                  this.selectedCrosssellProducts=documentValues.crosssell_ids?documentValues.crosssell_ids:[];
                  this.selectedGroupedProducts=documentValues.grouped_ids?documentValues.grouped_ids:[];
                  this.isVariation=documentValues.variation;
                  if(this.formBaseInformation.get('type').value!='grouped' && this.formBaseInformation.get('type').value!='variable') this.prop_menu='general'
                  // this.defaultAttributeSaved = documentValues.defaultAttributes;
                  this.getCompaniesList();
                  // this.getSpravSysMarkableGroup(); //загрузка справочника маркированных групп товаров
                  this.getSpravSysEdizm(); //загрузка единиц измерения
                  this.getProductBarcodesPrefixes(); //загрузка префиксов штрих-кодов
                  this.getProductPrices(); // загрузка типов цен
                  this.getSpravTaxes();//загрузка налогов
                  this.getProductAttributes(); // product attributes that contain current product
                  this.getProductAttributesList(); // product attributes list from company registry
                  this.getCompanySettings();
                  this.getStoresLanguagesList();
                  this.getResourcesList();
                  this.fillResourcesObjectListFromApiResponse(documentValues.productResourcesTable);
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //
        );
  }

  fillVariationsOnLoadProductData(){
    const productVariations = this.formBaseInformation.get('productVariations') as UntypedFormArray;    
    while (productVariations.length !== 0) {productVariations.removeAt(0)};// clear FormArray
      this.loadedProductVariations.forEach(m =>{
        productVariations.push(this._fb.group({
          id: m.id,
          product_id: m.product_id,   // Variable (parent) product ID 
          menu_order: m.menu_order,
          variation_product_id:m.variation_product_id,     // still not selected
          variation_product_name:m.variation_product_name,     // still not selected
          productVariationsRowItems: new FormArray(this.getLoadedVariationsRowItems_FormGroup(m.productVariationsRowItems))
        }));
      });
      this.synchronizeVariations(); // setting variation items in an order like attributes and default attributes
  }

  getLoadedVariationsRowItems_FormGroup(rowItems:ProductVariationsRowItems[]):FormGroup[]{
    let returnList:FormGroup[]=[];
    let i:number = 0; // index
    // const allAttributes = this.formBaseInformation.get('productAttributes').value;
    // alert(allAttributes.length)
    rowItems.forEach(m =>{
        // console.log('termIds: ',JSON.stringify(termIds));
        returnList.push(this._fb.group({
          variation_id:m.variation_id,            
          attribute_id:m.attribute_id,            
          term_id:m.term_id,
          terms: [this.formListOfSelectedAttributeTerms(m.attribute_id)],
        }));
        i++;
    });
    return returnList;
  }
  //this is Quill's error: on tab change it lost the string breaks.
  quillRefresh(){
    this.formBaseInformation.get('description').setValue((this.formBaseInformation.get('description').value));
    this.formBaseInformation.get('short_description').setValue((this.formBaseInformation.get('short_description').value));
  }
  //this is Quill's error: on tab change it lost the string breaks.
  quillTranslateRefresh(){
    this.formBaseInformation.get('storeProductTranslations').controls.forEach(translation=>{
      translation.get('description').setValue(translation.get('description').value);
      translation.get('shortDescription').setValue(translation.get('shortDescription').value);
    })
  }
    //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/productsdoc',0]);
    this.id=0;
    this.formBaseInformation.reset();
    this.formBaseInformation.get('id').setValue(null);
    this.formBaseInformation.get('name').setValue('');
    this.is_store=false;
    this.is_vat=false;
    this.is_vat_included=false;
    this.checkedList=[];
    this.formBaseInformation.get('edizm_id').setValue('');
    this.formBaseInformation.get('edizm_name').setValue('');
    this.formBaseInformation.get('indivisible').setValue(true);
    this.formBaseInformation.get('ppr_id').setValue(1);
    
    this.formBaseInformation.get('tax_status').setValue('taxable');
    this.formBaseInformation.get('type').setValue('simple');
    this.formBaseInformation.get('stock_status').setValue('instock');
    this.formBaseInformation.get('backorders').setValue('no');
    this.formBaseInformation.get('sold_individually').setValue(false);
    this.formBaseInformation.get('reviews_allowed').setValue('true');
    this.formBaseInformation.get('menu_order').setValue(1);
    this.formBaseInformation.get('outofstock_aftersale').setValue(false);
    this.formBaseInformation.get('description_type').setValue('editor');
    this.formBaseInformation.get('short_description_type').setValue('editor');


    this.getData();
  }
  //фильтрация при каждом изменении в поле маркированных товаров, создание нового массива и его возврат
  private _filter_markable_group(value: string): IdAndName[] {
    const filterValue = value.toLowerCase();
    return this.spravSysMarkableGroupSet.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  //фильтрация при каждом изменении в поле наименования ед. измерения, создание нового массива и его возврат
  private _filter(value: string): IdAndName[] {
    const filterValue = !value||value==null?'':value.toLowerCase();
    return this.spravSysEdizmOfProductAll.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  //Загрузка групп (сетов) полей
  // getSets(){
  //   const docId = {"field_type":"1","documentId":this.id};
  //   this.http.post('/api/auth/getProductGroupFieldsListWithValues', docId)
  //           .subscribe(
  //               (data) => {
  //                 this.receivedSetsOfFields=data as any []; 
  //                 this.getProductGroupFieldsListWithValues();
  //               },
  //               error => console.log(error) 
  //           );
  // }

  getFieldsFormControls() {
    return (this.fieldsForm.get('fields') as UntypedFormArray).controls;
  }

  // getProductGroupFieldsListWithValues(){//загружает кастомные поля со значениями (field_type=2) или их сеты (field_type=1) 
  //   const docId = {"field_type":"2","documentId":this.id};
  //       this.http.post('/api/auth/getProductGroupFieldsListWithValues', docId)
  //       .subscribe(
  //           data => {                
  //               this.dataFields=data as any;               
  //               this.patchFieldsFormArray();
  //               this.onFieldsValueChanges(); //отслеживание изменений настраиваемых полей во вкладке "Поля"
  //           },
  //           error => console.log(error)
  //       );
  // }
  patchFieldsFormArray() {
    this.fieldsForm = this.fb.group({fields: this.fb.array([])});// если поля каждый раз не переопределять, они будут пушиться уже к существующим, и сохранение не будет корректно работать
    const control = <UntypedFormArray>this.fieldsForm.get('fields');
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
  // onFieldsValueChanges(){
  //   this.fieldsForm.valueChanges
  //   .pipe(
  //     debounceTime(500),
  //     tap(() => {
  //       this.errorMsg = "";
  //       this.filteredProductGroups = [];
  //     }),       
  //     switchMap(fieldObject =>  
  //       this.getProductFieldsValuesList(fieldObject)
  //     )
  //   )
  //   .subscribe(data => {
  //     this.isLoading = false;
  //     if (data == undefined) {
  //       this.errorMsg = data['Error'];
  //       this.filteredProductGroups = [];
  //     } else {
  //       this.errorMsg = "";
  //       this.filteredProductGroups = data as any;
  //     }
  //   });
  // }
// слушалка на изменение поля Группа товаров
  // onProductGroupValueChanges(){
  //   this.searchProductGroupsCtrl.valueChanges
  //   .pipe(
  //     debounceTime(500),
  //     tap(() => {
  //       this.errorMsg = "";
  //       this.filteredProductGroups = [];
  //     }),       
  //     switchMap(fieldObject =>  
  //       this.getProductGroupsList()
  //     )
  //   )
  //   .subscribe(data => {
  //     this.isProductGroupLoading = false;
  //     if (data == undefined) {
  //       this.errorMsg = data['Error'];
  //       this.filteredProductGroups = [];
  //     } else {
  //       this.errorMsg = "";
  //       this.filteredProductGroups = data as any;
  //     }
  //   });
  // }
  onSelectProductGroup(id:any,name:string){
    console.log("selected id - "+id)
    this.formBaseInformation.get('productgroup_id').setValue(+id);
  }
  checkEmptyProductGroupField(){
    console.log("length - "+this.searchProductGroupsCtrl.value.length);
    if(this.searchProductGroupsCtrl.value.length==0){
      this.formBaseInformation.get('productgroup_id').setValue(null);
    }
  };        
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.product_code_free_isReadOnly=true;
    this.createNewDocument();
  } 
  createNewDocument(){
    this.createdDocId=null;
    this.formBaseInformation.get('selectedProductCategories').setValue(this.checkedList);
    this.http.post('/api/auth/insertProduct', this.formBaseInformation.value)
      .subscribe(
        (data) =>   {
          let result=data as any;
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
            case -250:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.sku_exists')}});break;}
            default:{  
                        this.id=result;
                        if(this.mode=='standart') 
                          this._router.navigate(['/ui/productsdoc', this.id]);
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
    const allVariations = this.formBaseInformation.get('productVariations').controls;
    let allVariationsSelected=true;
    // let parentIsSelectedAsVariation=false;
    allVariations.forEach(m =>{
      if(m.get('variation_product_id').value == null){allVariationsSelected=false}
      // if(+m.get('variation_product_id').value == +this.id){parentIsSelectedAsVariation=true}
    });
    // console.log('parentIsSelectedAsVariation - ',parentIsSelectedAsVariation);
    if(allVariationsSelected || this.formBaseInformation.get('type').value!='variable')/* && !parentIsSelectedAsVariation*/{
      this.updateDocument();
      this.product_code_free_isReadOnly = true ;
    }      
    else {
      if(!allVariationsSelected)
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.no_vars_have_prod')}});
      // if(parentIsSelectedAsVariation)
        // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.vrbl_cant_var')}});
    }
  }
  updateDocument(){ // сохраняется в 2 захода - 1й сам док и категории, 2й - настраиваемые поля (если есть)
    this.formBaseInformation.get('selectedProductCategories').setValue(this.checkedList);
    this.formBaseInformation.get('imagesIdsInOrderOfList').setValue(this.getImagesIdsInOrderOfList());
    this.formBaseInformation.get('cagentsIdsInOrderOfList').setValue(this.getCagentsIdsInOrderOfList());
    this.formBaseInformation.get('dfilesIdsInOrderOfList').setValue(this.getDfilesIdsInOrderOfList());
    if(this.selectedUpsellProducts.length>0){
      var ids:any[] = [];
      this.selectedUpsellProducts.map(i =>{ids.push(i.id);});
      this.formBaseInformation.get('upsell_ids').setValue(ids);
    } else this.formBaseInformation.get('upsell_ids').setValue([]);
    if(this.selectedCrosssellProducts.length>0){
      var ids:any[] = [];
      this.selectedCrosssellProducts.map(i =>{ids.push(i.id);});
      this.formBaseInformation.get('crosssell_ids').setValue(ids);
    } else this.formBaseInformation.get('crosssell_ids').setValue([]);
    if(this.selectedGroupedProducts.length>0){
      var ids:any[] = [];
      this.selectedGroupedProducts.map(i =>{ids.push(i.id);});
      this.formBaseInformation.get('grouped_ids').setValue(ids);
    } else this.formBaseInformation.get('grouped_ids').setValue([]);
    // if product switched Type from "variable" to different, then I should clean variations and default attribute values
    if(this.formBaseInformation.get('type').value!='variable' && this.formBaseInformation.get('productVariations').controls.length>0){
      const productVariations = this.formBaseInformation.get('productVariations') as UntypedFormArray;
      const defaultAttributes = this.formBaseInformation.get('defaultAttributes') as UntypedFormArray;
      while (productVariations.length !== 0) {productVariations.removeAt(0)};
      while (defaultAttributes.length !== 0) {defaultAttributes.removeAt(0)};
    }
    this.showSearchFormFields=false;
    this.http.post('/api/auth/updateProducts', this.formBaseInformation.value).subscribe(
      (data) => 
      {
        let result:number=data as number;
        switch(result){
          case null:{// null возвращает если не удалось сохранить документ из-за ошибки
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.products')})}});
            break;
          }
          case -1:{//недостаточно прав
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
            break;
          }
          case -230:{
            // Subject of trade was changeg (from Servie to Commodity or from Commodity to Service)
            // If this product (or service) is already has the history of operations - Reject this update
            // because it will produce discrepancy of product quantity in warehouse / negative quantity / fraud opportunities
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.tr_subj_cngd')}});
            break;
          }
          case -250:{ // non-unique sku check
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.sku_exists')}});
            break;
          }
          case -260:{ // Нельзя использовать один товар в нескольких вариациях (ProductAlreadyUsedAsVariation)
                      //You can not use one product in several variations
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.vartn_alrd_used_as_vartn')}});
            break;
          }
          case -270:{ // Вариативный товар нельзя использовать в качестве вариации (Возникает если вариативный товар выбрали в качестве вариации у другого товара)
                      // Variable product can't be use as a variation (throws if a variable product is selected as a variation of another product)
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.vartve_prod_try_use_as_vartn')}});
            break;
          }
          case -280:{ // Вариация не может быть вариативным товаром!
                      // Product selected as a variable, but already used as a variation in another variable product (VariationCantBeVariableProduct)
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.prod_alrd_used_as_vartn')}});
            break;
          }
          case -290:{ // Нельзя изменить тип товара, у которого уже есть история складских операций, на «Вариативный».
                      // You cannot change a product type that already has a warehouse history to "variable".
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.prod_w_hist_cant_be_vartv')}});
            break;
          }
          default:{// Успешно
            this.getData();
            this.openSnackBar(translate('docs.msg.doc_sved_succ',{name:translate('docs.docs.products')}), translate('docs.msg.close'));
            // this.http.post('/api/auth/updateProductCustomFields', this.fieldsForm.get('fields').value).subscribe(
            //     (data2) => 
            //     {
            //       this.getData();
            //       this.openSnackBar(translate('docs.msg.doc_sved_succ',{name:translate('docs.docs.products')}), translate('docs.msg.close'));
            //     },
            //     error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            // );
          }
        }
        
        
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  getSpravSysPPR(){
    return this.loadSpravService.getSpravSysPPR().subscribe({
      next: (data) => {
        this.spravSysPPRSet = data as any[];
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
  getSpravTaxes(){
      this.loadSpravService.getSpravTaxes(this.formBaseInformation.get('company_id').value)
        .subscribe((data) => {
          this.spravTaxesSet=data as any[];
            // if the tax does not set, let's set the first status as default
          if(+this.formBaseInformation.get('nds_id').value==0 && this.spravTaxesSet.length>0)
            this.formBaseInformation.get('nds_id').setValue(this.spravTaxesSet[0].id)
        },
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
          this.updateValuesSpravSysEdizmOfProductAll();this.setDefaultEdizm()},
          error => console.log(error));
          this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(2)"}) // все ед. измерения по типу: масса
          .subscribe((data) => {this.spravSysEdizmOfProductWeight = data as any[];},
          error => console.log(error));
          this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(5)"})  // все ед. измерения по типу: объём
          .subscribe((data) => {this.spravSysEdizmOfProductVolume = data as any[];},
          error => console.log(error));}

  setDefaultEdizm(){
    
    if(+this.id==0 && this.spravSysEdizmOfProductAll.length>0)
    {
      this.spravSysEdizmOfProductAll.forEach(a=>{
          if(a.is_default){
            this.formBaseInformation.get('edizm_id').setValue(a.id);
            this.updateValuesSpravSysEdizmOfProductAll();
          }
      });
    }
  }

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
      this.formBaseInformation.get('edizm_id').setValue(null);
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
      this.formBaseInformation.get('markable_group_id').setValue(null);
    }
  }
  onCompanyChange(){
    this.loadTrees();
    this.getSpravTaxes(); 
    this.getSpravSysEdizm();
    this.getStoresLanguagesList();
    this.formBaseInformation.get('product_code_free').setValue('');
    this.product_code_free_isReadOnly=true
  }
  getCompanySettings(){
    let result:any;
    this.http.get('/api/auth/getCompanySettings?id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
        data => { 
          result=data as any;
          this.is_store = result.is_store;
          this.is_vat = result.vat;
          this.is_vat_included = result.vat_included;
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
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
  openDialogAddFiles(type:string) {
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
      if(result && type=='image')this.addImagesToProduct(result); else this.addDownloadableFilesToProduct(result);//product downloadable files
    });
  }
  addImagesToProduct(filesIds: number[]){
    if(filesIds && filesIds.length>0){
      const body = {"id1":this.id, "setOfLongs1":filesIds, string1: 'product_files'};
      return this.http.post('/api/auth/addFilesToProduct', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar(translate('docs.msg.imgs_added'), translate('docs.msg.close'));
                    this.loadImagesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
    }
  }
  addDownloadableFilesToProduct(filesIds: number[]){
    if(filesIds && filesIds.length>0){
      const body = {"id1":this.id, "setOfLongs1":filesIds, string1: 'product_downloadable_files'};
      return this.http.post('/api/auth/addFilesToProduct', body) 
              .subscribe(
                  (data) => {  
                    this.openSnackBar(translate('docs.msg.dfiles_added'), translate('docs.msg.close'));
                    this.loadDownloadableFilesInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
    }
  }
  getImagesIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.imagesInfo.forEach(x => {
      i.push(+x.id);
    })
    return i;
  }
  getDfilesIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.downloadableFilesInfo.forEach(x => {
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
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
  }
  loadDownloadableFilesInfo(){//                                     
    return this.http.get('/api/auth/getProductDownloadableFiles?product_id='+this.id) 
            .subscribe(
                (data) => {  
                            this.downloadableFilesInfo = data as DownloadableFilesInfo[]; 
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
  dropDfile(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.downloadableFilesInfo, event.previousIndex, event.currentIndex);
  }
  loadMainImage(){
    console.log("imagesInfo: "+this.imagesInfo.length);
    if(this.imagesInfo.length>0){
      // this.noImageAddress="/api/public/getProductImage/"+this.imagesInfo[0].name;
      this.getImage('/api/auth/getFile/' + this.imagesInfo[0].name).subscribe(blob => {
        this.createImageFromBlob(blob);
      });
    } 
    // else this.noImageAddress="../../../../../../assets_/images/no_foto.jpg";
  }
  clickBtnDeleteDownloadableFile(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head:   translate('docs.msg.del_dfile'),
        query:  translate('docs.msg.del_dfile_f_crd'),
        warning:translate('docs.msg.file_will_stay'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteFile(id, 'product_downloadable_files');}
    });        
  }
  clickBtnDeleteImage(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head:   translate('docs.msg.del_img'),
        query:  translate('docs.msg.del_img_f_crd'),
        warning:translate('docs.msg.img_will_stay'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteFile(id, 'product_files');}
    });        
  }
  deleteFile(imgId:number, tableName:string){
    const body = {id: imgId, id1:this.id, string1:tableName}; 
    return this.http.post('/api/auth/deleteProductFile',body)
    .subscribe(
        (data) => {  
          let result = data as any; 
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            default:{ 
              this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
              if(tableName=='product_files') this.loadImagesInfo(); else this.loadDownloadableFilesInfo();
            }
          }
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }
  openFileCard(docId:number) {
    const dialogRef = this.dialogAddImages.open(FilesDocComponent, {
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
                    this.openSnackBar(translate('docs.msg.splrs_added'), translate('docs.msg.close'));
                    this.loadCagentsInfo();
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
  }

  loadCagentsInfo(){//загружает информацию по поставщикам товара
      const body = {"id":this.id};
      return this.http.post('/api/auth/getListOfProductCagents', body) 
              .subscribe(
                  (data) => {  
                              this.cagentsInfo = data as any[]; 
                              // console.log("cagentsInfo:"+this.cagentsInfo);
                            },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
        head:   translate('docs.msg.del_spl'),
        query:  translate('docs.msg.del_spl_f_crd'),
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
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.loadCagentsInfo();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }

  clickBtnEditCagentProperties(cagentId: number, cagentArticle: string, additional: string): void {
    // console.log("--cagentId:"+cagentId);
    // console.log("--cagentArticle:"+cagentArticle);
    // console.log("--cagentAdditional:"+additional);
    const dialogRef = this.ProductCagentsDialogComponent.open(ProductCagentsDialogComponent, {
      width: '800px', 
      data:
      { 
        productId: +this.id,
        cagentId: +cagentId,
        cagentArticle: cagentArticle , 
        cagentAdditional: additional,
        docName:translate('docs.msg.spl_prprties'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.loadCagentsInfo();
    },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},);        
  }
  getCagentsIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.cagentsInfo.forEach(x => {
      i.push(+x.cagent_id);
    })
    return i;
  }
  // openCagentCard(docId:number) {
  //   const dialogRef = this.dialogAddImages.open(CagentsDocComponent, {
  //     maxWidth: '95vw',
  //     maxHeight: '95vh',
  //     height: '95%',
  //     width: '95%',
  //     data:
  //     { 
  //       mode: 'window',
  //       docId: docId
  //     },
  //   });
  // }
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
        docName:translate('docs.msg.bcd_adding'),
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
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
              );
  }

  clickBtnDeleteBarcode(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head:   translate('docs.msg.del_bcd'),
        query:  translate('docs.msg.del_bcd_f_crd'),
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
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.loadBarcodesInfo();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
        docName:translate('docs.msg.edit_bcd'),
      },
    });
    dialogEditBarcodeProperties.afterClosed().subscribe(result => {
      if(result) this.loadBarcodesInfo();
    },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},);        
  }
  generateProductWeightCode(){
    this.isWeightCodeGenerating=true;
    const body = {"id1": this.id, "id2": this.formBaseInformation.get('company_id').value}; 
    return this.http.post('/api/auth/generateWeightProductCode',body)
    .subscribe(
        (data) => {   
                    this.setProductWeightCode(data as any);
                    this.isWeightCodeGenerating=false;
                    this.openSnackBar(translate('docs.msg.w_code_crtd'), translate('docs.msg.close'));
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
        head:     translate('docs.msg.cde_num_head'),
        warning:  translate('docs.msg.cde_num_query'),
        query:    translate('docs.msg.cde_num_warn'),
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
                    if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:'Введённый код не является уникальным.',}});
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
  commaToDot(fieldName:string){
    this.formBaseInformation.get(fieldName).setValue(this.formBaseInformation.get(fieldName).value.replace(",", "."))
  }
  doFilterCompaniesList(){
    console.log('doFilterCompaniesList - allowToViewAllCompanies: '+this.allowToViewAllCompanies);
      let myCompany:IdAndName;
      if(!this.allowToCreateAllCompanies){
        this.receivedCompaniesList.forEach(company=>{
        if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
        this.receivedCompaniesList=[];
        this.receivedCompaniesList.push(myCompany);
      }
      if(!this.allowToViewAllCompanies){
        this.receivedCompaniesList.forEach(company=>{
          if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}
        });
        this.receivedCompaniesList=[];
        this.receivedCompaniesList.push(myCompany);
      }
    this.setDefaultCompany();
  }

  fillDocumentsList(){
    this.documentsIds=[
      {id:"15", name: "docs.docs.acceptance"},
      {id:"21", name: "docs.docs.shipment"},
      {id:"16", name: "docs.docs.posting"},
      {id:"17", name: "docs.docs.writeoff"},
      {id:"25", name: "docs.docs.retailsale"},
      {id:"28", name: "docs.docs.return"},
      {id:"29", name: "docs.docs.returnsup"},
      {id:"30", name: "docs.docs.moving"},
      ]//список документов, по которым можно получить отчёт
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
    this.formProductHistory.docTypesIds=this.checkedChangesList;
    this.gettingTableData=true;
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
            this.gettingTableData=false;
            if(!data){
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('docs.msg.c_err_exe_qury')}})
            }
            this.dataSource.data=data as any []; 
          },
          error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //
      );
  }
  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('department');
    this.displayedColumns.push('docName');
    this.displayedColumns.push('before');
    this.displayedColumns.push('change');
    this.displayedColumns.push('quantity');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('price');
    // this.displayedColumns.push('netcost');
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
  // *************************************************  PRICES  ************************************************************
  getProductPrices(){
    this.receivedPriceTypesList=null;
    const control = <UntypedFormArray>this.formBaseInformation.get('productPricesTable');
    control.clear();
    this.loadSpravService.getProductPrices(+this.id)
    .subscribe(
      (data) => {this.receivedPriceTypesList=data as ProductPricesTable [];
        //получили список цен товара с их значениями (или с 0 если такая цена для товара не установлена)
        //теперь нужно создать FormArray для редактирования цен:
        let row_index=0;
        if(this.receivedPriceTypesList.length>0){
          this.receivedPriceTypesList.forEach(row=>{
            control.push(this.formingProductPricesRow(row));            
            this.onChangeCRMPrice(row_index); // Setting store prices (regular and sale price)
            row_index++;
          });
        }
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  //формирование строки для FormArray
  formingProductPricesRow(row: ProductPricesTable) {
    return this._fb.group({
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      price_type_id: new UntypedFormControl (row.price_type_id,[]),
      price_name: new UntypedFormControl (row.price_name,[]),
      price_value: new UntypedFormControl (row.price_value,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      price_description: new UntypedFormControl (row.price_description,[]),      
    });
  }

  getControl(formControlName){
    const control = <UntypedFormArray>this.formBaseInformation.get(formControlName);
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
    const control = this.getControl('productPricesTable');
     let row_index:number=0;
      this.formBaseInformation.value.productPricesTable.map(() => 
        {
          control.controls[row_index].get('price_value').setValue(+price_value);          
          this.onChangeCRMPrice(row_index); // Setting store prices (regular and sale price)
          row_index++;
        });
  }
  round(n:number):string{
    return parseFloat(n.toFixed(3)).toString(); //toFixed-округляет, parseFloat-преобр. в число, toString-отбрасывает 000 в конце числа
  }
  getBaseData(data) {    // emit data to parent component
    this.baseData.emit(data);
  }
  onSelectTab(a){
    this.selectedTab.setValue(a.index);// if not store selected tab index, after returning from a trnslate mode user will be always in the first tab
    if(a.index==1 && this.dataSource.data.length==0) this.getTable();
    if(a.index==2) this.quillRefresh();
  }
  propertiesMenuClick(menu: string) :void {
    this.prop_menu = menu;
  }

  // onChangeStorePrice(fieldName:string){
  //   let storePriceType = (fieldName=='reg_price'?'regular':'sale');
  //   this.commaToDot(fieldName);
  //   const control = this.getControl();
  //     let row_index:number=0;
  //     this.formBaseInformation.value.productPricesTable.map(() => 
  //       {
  //         if(control.controls[row_index].get('is_store_price_type_'+storePriceType).value)
  //           control.controls[row_index].get('price_value').setValue(this.formBaseInformation.get(fieldName).value);
  //         row_index++;
  //       });
  // }

  onChangeCRMPrice(row_index:number){
    // let storePriceType = (fieldName=='reg_price'?'regular':'sale');
   /* const control = this.getControl();
    if(control.controls[row_index].get('is_store_price_type_regular').value){
      this.formBaseInformation.get('reg_price').setValue(control.controls[row_index].get('price_value').value);
      this.reg_price_selected=true;
    }
    if(control.controls[row_index].get('is_store_price_type_sale').value){
      this.sales_price_selected=true;
      this.formBaseInformation.get('sale_price').setValue(control.controls[row_index].get('price_value').value);
    }*/
  }

  onChangeStoreSKU(){this.formBaseInformation.get('article').setValue(this.store_sku);}
  onChangeCrmSKU(){this.store_sku=this.formBaseInformation.get('article').value}
  
  onChangeStoreStockStatus(){this.formBaseInformation.get('not_sell').setValue(
    (this.formBaseInformation.get('stock_status').value=='instock'||this.formBaseInformation.get('stock_status').value=='onbackorder')?
    false:true)}
  onChangeCrmStockStatus(){
    this.formBaseInformation.get('stock_status').setValue(
    this.formBaseInformation.get('not_sell').value?'outofstock':'instock')}

  openDialogProductCategoriesSelect(queryType:string, variationIndex?:number){
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    'products',
        companyId:  this.formBaseInformation.get('company_id').value, //предприятие, по которому будут отображаться товары и категории
        variations: variationIndex!=null
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          if(queryType=='cross') // crossells
            this.selectedCrosssellProducts.push(i);
          else if(queryType=='up') // upsells
            this.selectedUpsellProducts.push(i);
          else if(queryType=='variation') // select 1 product for variation
            this.actionProductOfVariation(i,variationIndex,'add');  
          else //grouped
            this.selectedGroupedProducts.push(i);
        });
      }
    });
  }
  
  remove(obj: IdAndName, sellsType:string): void {
    if(sellsType=='cross'){
      const index = this.selectedCrosssellProducts.indexOf(obj);
      if (index >= 0) this.selectedCrosssellProducts.splice(index, 1);
    } else if (sellsType=='up'){
      const index = this.selectedUpsellProducts.indexOf(obj);
      if (index >= 0) this.selectedUpsellProducts.splice(index, 1);
    } else { //grouped
      const index = this.selectedGroupedProducts.indexOf(obj);
      if (index >= 0) this.selectedGroupedProducts.splice(index, 1);
    }
  }

  // the list of product attributes that contain current product
  getProductAttributes(){//                                     
    return this.http.get('/api/auth/getProductAttributes?product_id='+this.id) 
            .subscribe(
                (data) => {  
                            this.productAttributes = data as ProductAttribute[]; 
                            this.fillProductAttributesArray();
                            this.fillDefaultProductAttributesArray();
                            this.fillVariationsOnLoadProductData();
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  // fillProductAttributesArray(arr: ProductAttribute[]){
  fillProductAttributesArray(){
    const add = this.formBaseInformation.get('productAttributes') as UntypedFormArray;
    add.clear();
    this.productAttributes.forEach(m =>{
      add.push(this._fb.group({
        attribute_id: m.attribute_id,
        name: m.name,
        visible: m.visible,
        variation: m.variation,
        terms: [this.formListOfAllAttributeTerms(m.terms)], // list of all attribute's terms
        terms_ids: [this.formListOfSelectedTermsIds(m.terms)] // list of selected terms
      }))
    })
  }
  formListOfAllAttributeTerms(terms: ProductAttributeTerms[]): ProductAttributeTermsForAttributesList[]{
    let returnList: ProductAttributeTermsForAttributesList[] = [];
      terms.forEach (i =>{
        returnList.push({
          id: i.id,
          name: i.name,
          description: '',
          slug: ''
        })
      });
    return returnList;
  }
  formListOfSelectedTermsIds(terms: ProductAttributeTerms[]): number[]{
    let returnList: number[] = [];
      terms.forEach (i =>{if(i.is_selected) returnList.push(i.id)});
    return returnList;
  }

  //the list of terms and list of selected terms
  // formListOfSelectedAttributeTerms(terms: ProductAttributeTerms[], selected_terms_ids:number[]): ProductAttributeTermsForAttributesList[]{
  formListOfSelectedAttributeTerms(attributeId:number): ProductAttributeTermsForAttributesList[]{
    const allAttributes = this.formBaseInformation.get('productAttributes') as UntypedFormArray;;
    let terms: ProductAttributeTerms[]=[];
    let selected_terms_ids:number[]=[];
    let returnList: ProductAttributeTermsForAttributesList[] = [];
    allAttributes.value.forEach(m=>{
      if(m.attribute_id==attributeId){
        terms=m.terms;
        selected_terms_ids = m.terms_ids;
      }
    });
    if(selected_terms_ids && selected_terms_ids.length>0)
      terms.forEach (i =>{
        if(selected_terms_ids.includes(i.id))
          returnList.push({
            id: i.id,
            name: i.name,
            description: '',
            slug: ''
          })
      });
    // console.log('For attribute_id = '+attributeId+' returnList is: ');
    // returnList.forEach(i=>{
      // console.log('id = '+i.id+', name is: '+i.name);
    // })
    return returnList;
  }

  fillDefaultProductAttributesArray(){
    // In this method I fill the default attributes list that used in a Variations part
    // I have list of all attributes:
    const allAttributes = this.formBaseInformation.get('productAttributes') as UntypedFormArray;
    const previouslySavedAttributes = this.formBaseInformation.get('defaultAttributes').value;
    // Now I need to fill new array, based on allAttributes, where will be only attributes with "variation": true
    const defaultAttributes = this.formBaseInformation.get('defaultAttributes') as UntypedFormArray;
    defaultAttributes.clear();
    let attributesIds:number[] = [];
    // alert(allAttributes.length)
    allAttributes.value.forEach(m =>{
      if(m.variation){
        defaultAttributes.push(this._fb.group({
          name:m.name,
          attribute_id: m.attribute_id,
          term_id: this.getDefaultTermId(m.attribute_id,previouslySavedAttributes, m.terms_ids),
          terms: [this.formListOfSelectedAttributeTerms(m.attribute_id)], // list of selected attribute's terms (sending the list of terms and list of selected terms)
        }));
        attributesIds.push(m.attribute_id);
      }
    });
    // if(this.formBaseInformation.get('productVariations').value.length>0)
      this.synchronizeVariations(attributesIds);
  }

//                                    Variations Вариации
  addVariation(termIds?:number[]){    
    if(this.thereIsAttributesUsedForVariationsWithSelectedTerms){
      const productVariations = this.formBaseInformation.get('productVariations') as UntypedFormArray;
      productVariations.push(this._fb.group({
        id: null,
        product_id: this.id,   // Variable (parent) product ID 
        menu_order: this.formBaseInformation.get('productVariations').value.length+1,
        variation_product_id:null,     // still not selected
        variation_product_name:'',     // still not selected
        productVariationsRowItems: new FormArray(this.getNewProductVariationsRowItems_FormGroup(termIds))
      }));
    }
    
  }

  getNewProductVariationsRowItems_FormGroup(termIds?:number[]):FormGroup[]{
    let returnList:FormGroup[]=[];
    let i:number = 0; // index

    // const allAttributes = this.formBaseInformation.get('productAttributes').value;
    // allAttributes.forEach(m =>{
    //   if(m.variation){
    //     console.log('termIds: ',JSON.stringify(termIds));
    //     returnList.push(this._fb.group({
    //       variation_id:null,            // variation still not created
    //       attribute_id:m.attribute_id,  // current attribute
    //       term_id:((termIds != undefined && termIds.length>0)?termIds[i]:0),                 // still not selected
    //       terms: [this.formListOfSelectedAttributeTerms(m.attribute_id)], // list of selected attribute's terms (sending the list of terms and list of selected terms)
    //     }));
    //     i++;
    //   }
    // });

    const allAttributes = this.formBaseInformation.get('defaultAttributes').value;
    allAttributes.forEach(m =>{
        // console.log('termIds: ',JSON.stringify(termIds));
        returnList.push(this._fb.group({
          variation_id:null,            // variation still not created
          attribute_id:m.attribute_id,  // current attribute
          term_id:((termIds != undefined && termIds.length>0)?termIds[i]:0),                 // still not selected
          terms: [this.formListOfSelectedAttributeTerms(m.attribute_id)], // list of selected attribute's terms (sending the list of terms and list of selected terms)
        }));
        i++;
    });
    return returnList;
  }

  getVariationsControlTablefield(indx:number){
    return this.formBaseInformation.get('productVariations').at(indx).get('productVariationsRowItems') as FormArray
  }

  actionProductOfVariation(product: IdAndName, variationIndex: number, action: string){
    const allVariations = this.formBaseInformation.get('productVariations').controls;
    let rowIndx: number = 0;
    let productIdExists=false;
    let parentIsSelectedAsVariation=false;
    if(action=='add'){
      allVariations.forEach(m =>{
        if(+m.get('variation_product_id').value == +product.id){productIdExists=true};
        if(+product.id == this.id){parentIsSelectedAsVariation=true}
      });
      
    }
      
    if((action=='add' && !productIdExists && !parentIsSelectedAsVariation) || action=='delete')//Product isn't using in variations at this moment
      allVariations.forEach(m =>{
        if(rowIndx == variationIndex){
          m.get('variation_product_id').setValue(action=='add'?product.id:null);
          m.get('variation_product_name').setValue(action=='add'?product.name:null);
        }
        rowIndx++;
      });
      //Cannot use one product in several variations
    else {
      if(productIdExists)
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.one_prod_in_var')}});
      if(parentIsSelectedAsVariation)
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.vrbl_cant_var')}});
    }
  }

  onClickGenerateAllVariationsBtn(){
    if(this.formBaseInformation.get('productVariations').value.length>0){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',
          data:
          { 
            head: translate('docs.msg.gen_var'),
            query: translate('docs.msg.gen_var_q'),
            warning: '',
          },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.generateAllVariations();
        }
      });       
    } else this.generateAllVariations();
  }

  generateAllVariations(){
    const allAttributes = this.formBaseInformation.get('defaultAttributes').value;
    const productVariations = this.formBaseInformation.get('productVariations') as UntypedFormArray;
    productVariations.clear();
    let allAttributesTerms:any[]=[];
    let currentAttributesTerms:number[];
    allAttributes.forEach(m =>{
      if(m.terms.length>0){
        currentAttributesTerms=[];
        m.terms.forEach(t =>{
          currentAttributesTerms.push(t.id)
        });
        allAttributesTerms.push(currentAttributesTerms);
      }
    });
    var allVariations:any[] = this.cartesianProduct(allAttributesTerms);
    // console.log(JSON.stringify(allVariations));
    allVariations.forEach(v => {
      this.addVariation(v);
    });
  }


  synchronizeVariations(existingAttributesIds?:number[]){
    const allVariations = this.formBaseInformation.get('productVariations').controls ;
    let selectedTermsIds: number[] = [];
    let defaultAttributesIds: number[] = [];
    let term_id: number=0;
    let attributeIndex: number = 0;
    let actualTermsListsIds = [];
    let actualTermsListIds: any[] = [];
    this.thereIsAttributesUsedForVariationsWithSelectedTerms=false;
    // collect all actual attributes ids
    const allAttributes = this.formBaseInformation.get('defaultAttributes').value;
    allAttributes.forEach(m =>{
      defaultAttributesIds.push(m.attribute_id);
      m.terms.forEach(term =>{
        actualTermsListIds.push(term.id);
        this.thereIsAttributesUsedForVariationsWithSelectedTerms=true;
      });
      actualTermsListsIds.push(actualTermsListIds);   // array of arrays like [[1,2],[3,4]] 
    });
    // run on all existing variations
    allVariations.forEach((currentVariation) =>{
      const productVariationsRowItems = currentVariation.get('productVariationsRowItems') as FormArray;
      defaultAttributesIds.forEach(attribute_id=>{
        term_id=0;
        productVariationsRowItems.controls.forEach(rowItem=>{
          console.log("attribute_id - "+ attribute_id+", rowItem.get('attribute_id').value = "+rowItem.get('attribute_id').value)
          if(attribute_id==rowItem.get('attribute_id').value){
            term_id=(actualTermsListsIds[attributeIndex].includes(rowItem.get('term_id').value))?rowItem.get('term_id').value:0; // 0 = "- Any -" in select list
          } 
        });
        selectedTermsIds.push(term_id);
        attributeIndex++;
      });
      attributeIndex = 0;
      console.log('selectedTermsIds = ',JSON.stringify(selectedTermsIds))
       while (productVariationsRowItems.length !== 0) {productVariationsRowItems.removeAt(0)};// clear FormArray
      // productVariationsRowItems.clear;
      // alert(JSON.stringify(selectedTermsIds))
      let a = new FormArray(this.getNewProductVariationsRowItems_FormGroup(selectedTermsIds)); // set new items
      a.controls.forEach(element => {productVariationsRowItems.push(element);});
      selectedTermsIds=[];
    });
    // alert(this.actualTermsListsIds.length);
    this.removeEmptyVariations();
  }

  removeEmptyVariations(){
    console.log('Remove Empty Variations!');
    const allVariations = this.formBaseInformation.get('productVariations');
    let indexToRemove: number[] = [];
    allVariations.controls.forEach((currentVariation, index) => {
      const productVariationsRowItems = currentVariation.get('productVariationsRowItems') as FormArray;
      if(productVariationsRowItems && productVariationsRowItems.value.length==0){
        indexToRemove.push(index);
      }
    });
    indexToRemove.reverse().forEach((index) => {
      allVariations.removeAt(index);
    });
  }

  //декартово произведение
  cartesianProduct(arr) {
    return arr.reduce(function(a,b){
        return a.map(function(x){
            return b.map(function(y){
                return x.concat([y]);
            })
        }).reduce(function(a,b){ return a.concat(b) },[])
    }, [[]])
  } 

  get productVariations(): FormArray {
    return this.formBaseInformation.get('productVariations') as FormArray;
  }
  dropVariation(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании вариации 
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому меняем через кастомный метод moveItemInFormArray
    this.moveItemInFormArray(
      this.productVariations,
      event.previousIndex,
      event.currentIndex
    );
  }

  deleteVariation(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_var'),
        query: translate('docs.msg.del_var_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('productVariations') as UntypedFormArray;
        add.removeAt(index);
      }
    });       
  }

  deleteAllVariations(){
    if(this.formBaseInformation.get('productVariations').value.length>0){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',
          data:
          { 
            head: translate('docs.msg.del_all_var'),
            query: translate('docs.msg.del_all_var_q'),
            warning: '',
          },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          const productVariations = this.formBaseInformation.get('productVariations') as UntypedFormArray;
          productVariations.clear();
        }
      });       
    }
  }

  moveItemInFormArray(
    formArray: FormArray,
    fromIndex: number,
    toIndex: number
  ): void {
    const dir = toIndex > fromIndex ? 1 : -1;
  
    const item = formArray.at(fromIndex);
    for (let i = fromIndex; i * dir < toIndex * dir; i = i + dir) {
      const current = formArray.at(i + dir);
      formArray.setControl(i, current);
    }
    formArray.setControl(toIndex, item);
  }

  getDefaultTermId(attribute_id:number,previouslySavedAttributes:any[], attributeSelectedTermsIds:number[]):number{
    let returnTermId:number = 0;
    previouslySavedAttributes.forEach(i=>{
      if(i.attribute_id == attribute_id && attributeSelectedTermsIds.includes(i.term_id))
        returnTermId = i.term_id;
    });
    return returnTermId;
  }


  // formListOfSelectedTermsIdsWhenDrop(terms: ProductAttributeTerms[]): number[]{
  //   let returnList: number[] = [];
  //     terms.forEach (i =>{if (i.is_selected) returnList.push(i.id)});
  //   return returnList;
  // }
  dropProductAttribute(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании атрибута 
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: any[] = [];
    this.formBaseInformation.get('productAttributes').controls.forEach(m =>{
                      resultContainer.push({
                        attribute_id: m.get('attribute_id').value,
                        name: m.get('name').value,
                        visible: m.get('visible').value,
                        variation: m.get('variation').value,
                        terms: m.get('terms').value,
                        terms_ids: m.get('terms_ids').value,
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillProductAttributesArrayAfterDrop(resultContainer);
    
    this.fillDefaultProductAttributesArray();
  }
  fillProductAttributesArrayAfterDrop(arr: any[]){
    const add = this.formBaseInformation.get('productAttributes') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
        attribute_id: m.attribute_id,
        name: m.name,
        visible: m.visible,
        variation: m.variation,
        terms: [this.formListOfAllAttributeTerms(m.terms)], // list of all attribute's terms
        terms_ids: [m.terms_ids] // list of selected terms
      }))
    })
  }
  addNewProductAttribute() {
    // console.log("this.selectedAttribute.terms - "+this.selectedAttribute.terms);
    const add = this.formBaseInformation.get('productAttributes') as UntypedFormArray;
    add.push(this._fb.group({
      attribute_id: this.selectedAttribute.id,
      name: this.selectedAttribute.name,
      visible: true,
      variation: false,
      terms: [this.selectedAttribute.terms], // list of all attribute's terms
      terms_ids: [] // list of selected terms
    }))
  }

  selectDefaultAttributeTerm(attributeId:number, termId:number){
    console.log('attributeId',attributeId);
    console.log('termId',termId);
    const add = this.formBaseInformation.get('defaultAttributes') as UntypedFormArray;
    add.push(this._fb.group({
      attribute_id: attributeId,
      term_id: termId
    }));
    // let ids:number[] = this.formBaseInformation.get('defaultAttributes').value;
    // ids.push(termId);
    // this.formBaseInformation.get('defaultAttributes').setValue(ids);
  }
  // getDefaultTermId(attributeId:number):number {
    // return 39
    // let termId = null;
    // const add = this.formBaseInformation.get('defaultAttributes').value;
    // add.map(i=>{
    //   if (i.attribute_id==attributeId)
    //     termId = i.term_id;
    // })
    // console.log('getDefaultTermId attributeId = '+attributeId+', termId = '+termId);
    // return termId;
  // }

  deleteProductAttribute(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_attr'),
        query: translate('docs.msg.del_attr_q'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formBaseInformation.get('productAttributes') as UntypedFormArray;
        add.removeAt(index);
        this.fillDefaultProductAttributesArray();
      }
    });       
  }
  
  // the list of product attributes (with all their terms) from company registry 
  getProductAttributesList(){//                                     
    return this.http.get('/api/auth/getProductAttributesList?company_id='+this.formBaseInformation.get('company_id').value) 
            .subscribe(
                (data) => {  
                            this.productAttributesList = data as ProductAttributeForAttributesList[]; 
                          },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  addAttributeToProduct(){

  }

  getAttributeFieldValue(row_index:number, field_name:string):any[]{
    const control = this.getControlTablefield();
    return control.controls[row_index].get(field_name).value;
  }
  getAttributeVariationFieldValue(attributeId:number):string{

    let returnValue = ''; 
    this.formBaseInformation.get('productAttributes').value.forEach(m =>{
      if(attributeId==m.attribute_id)
      returnValue=m.name;
     });
    return returnValue;
  }
  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('productAttributes');
    return control;
  }

  getTermNameById(row_index:number, term_id:number){
    let resultName: string = "";
    this.getAttributeFieldValue(row_index, 'terms').forEach(i =>{
      // console.log("term_id = " + term_id+ ", i.id = " + i.id +", i.name = " + i.name);
      if(i.id==term_id) resultName = i.name;
    });
    return resultName;
  }
  // settings loading
getSettings(){
  let result:any;
  this.http.get('/api/auth/getMySettings')
    .subscribe(
        data => { 
          result=data as any;
          this._adapter.setLocale(result.locale?result.locale:'en-gb')        // setting locale in moment.js
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
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
      document_id: 14, // id документа из таблицы documents
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
  this.http.get('/api/auth/getTemplatesList?company_id='+this.formBaseInformation.get('company_id').value+"&document_id="+14+"&is_show="+true).subscribe
  (data =>{ 
      this.gettingTemplatesData=false;
      this.templatesList=data as TemplatesList[];
    },error => {console.log(error);this.gettingTemplatesData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
}

onClickPrintTemplate(template:TemplatesList){
  switch(template.type){
    case 'document':{;break;}
    case 'label':{this.openPrintLabelsDialog(template);break;}
  }
}

openPrintLabelsDialog(template:TemplatesList){
  const dialogTemplates = this.labelsPrintDialogComponent.open(LabelsPrintDialogComponent, {
    maxWidth: '1000px',
    maxHeight: '95vh',
    // height: '680px',
    width: '95vw', 
    minHeight: '95vh',
    data:
    { //отправляем в диалог:
      company_id: +this.formBaseInformation.get('company_id').value, //предприятие
      num_labels_in_row:template.num_labels_in_row , // id документа из таблицы documents
      file_name: template.file_name, 
      products:[
        {id: this.id, name: this.formBaseInformation.get('name').value},
      ]
    },
  });
  dialogTemplates.afterClosed().subscribe(result => {
    if(result){}
  });
}
// *******************    Quantity by resources    *******************
// +++
  // list for select part
  getResourcesList(){ 
    return this.http.get('/api/auth/getResourcesList?company_id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {   
                      this.resourcesList=data as any [];
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //
      );
  }

  formResourceTableColumns(){
    this.displayedResourcesColumns=[];
    // if(this.editability)
        // this.displayedResourcesColumns.push('select');
    this.displayedResourcesColumns.push('name','resource_qtt');
    if(this.editability && this.showSearchFormFields)
      this.displayedResourcesColumns.push('delete');
  }

  clearResourcesTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControl('productResourcesTable').clear();
        // this.formBaseInformation.get('productResourcesTable').clear();
      }});  
  }
  refreshRresourceTableColumns(){
    this.displayedResourcesColumns=[];
    setTimeout(() => { 
      this.formResourceTableColumns();
    }, 1);
  }

  deleteResourceRow(row: any,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('productResourcesTable');
          control.removeAt(index);
          this.refreshRresourceTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  addResourceRow() 
  { 
    let thereSamePart:boolean=false;
    this.formBaseInformation.value.productResourcesTable.map(i => 
    { // Cписок не должен содержать одинаковые ресурсы. Тут проверяем на это
      // Table shouldn't contain the same resources. Here is checking about it
      if(+i['resource_id']==this.formResourceSearch.get('resource_id').value)
      {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
        thereSamePart=true; 
      }
    });
    if(!thereSamePart){
      const control = <UntypedFormArray>this.formBaseInformation.get('productResourcesTable');
      control.push(this.formingResourceRowFromSearchForm());
    }
     this.resetFormResourceSearch();//подготовка формы поиска к дальнейшему вводу товара
  }
  //формирование строки таблицы с ресурсами, необходимыми для оказания услуги
  formingResourceRowFromSearchForm() {
    return this._fb.group({
      resource_id: new UntypedFormControl (this.formResourceSearch.get('resource_id').value,[]),
      row_id: [this.getResourceRowId()],
      name:  new UntypedFormControl (this.formResourceSearch.get('name').value,[]),
      resource_qtt: new UntypedFormControl (+this.formResourceSearch.get('resource_qtt').value,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
    });
  }

  fillResourcesObjectListFromApiResponse(resourcesArray:any[]){
    this.getControl('productResourcesTable').clear();
    if(resourcesArray.length>0){
      const control = <UntypedFormArray>this.formBaseInformation.get('productResourcesTable');
      resourcesArray.forEach(row=>{
        control.push(this.formingProductResourceRow(row));            
      });
    }
    this.refreshRresourceTableColumns();
  }
  
  formingProductResourceRow(row: any) {
    return this._fb.group({
      row_id: [this.getResourceRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      resource_id: new UntypedFormControl (row.resource_id,[]),
      name: new UntypedFormControl (row.name,[]),
      resource_qtt: new UntypedFormControl (+row.resource_qtt,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      description: new UntypedFormControl (row.description,[]),      
    });
  }
  resetFormResourceSearch(){
    this.formResourceSearch.get('resource_id').setValue('0');
    this.formResourceSearch.get('resource_qtt').setValue('0');
    this.formResourceSearch.get('name').setValue('');
  }
  getResourcesRowId():number{
    let current_resource_row_id:number=this.resource_row_id;
    this.resource_row_id++;
    return current_resource_row_id;
  }
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
  getResourceRowId():number{
    let current_row_id:number=this.resource_row_id;
    this.resource_row_id++;
    return current_row_id;
  }
}