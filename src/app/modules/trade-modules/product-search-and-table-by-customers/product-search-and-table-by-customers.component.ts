import { Component, OnInit, Input, Output, OnChanges,  SimpleChanges } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray,  UntypedFormBuilder,  Validators, UntypedFormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable , of} from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { ProductReservesDialogComponent } from 'src/app/ui/dialogs/product-reserves-dialog/product-reserves-dialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { HttpClient } from '@angular/common/http';
import { ProductsDocComponent } from 'src/app/ui/pages/documents/products-doc/products-doc.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { ViewChild } from '@angular/core';
import { PricingDialogComponent } from 'src/app/ui/dialogs/pricing-dialog/pricing-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++

interface Cagent{
  id: number,
  row_id: number,
  is_payer: boolean,
  name: string,
  email: string,
  telephone: string,
  child: boolean
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
  indivisible: boolean; // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
}
interface ProductSearchResponse{//интерфейс получения данных из бд 
  id:number;
  name: string;
  edizm_id:number;
  filename:string;
  nds_id:number;
  reserved:number;// сколько зарезервировано в других Заказах покупателя
  total:number; // всего единиц товара в отделении (складе):
  reserved_in_all_my_depths:number; //зарезервировано в моих отделениях
  total_in_all_my_depths:number; //всего в моих отделениях
  ppr_name_api_atol:string; //Признак предмета расчета в системе Атол. Невидимое поле. Нужно для передачи в таблицу товаров в качестве тега для чека на ккм Атол
  is_material:boolean; //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
  reserved_current:number;// зарезервировано единиц товара в отделении (складе) в ЭТОМ (текущем) Заказе покупателя:
  indivisible: boolean; // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
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
interface ShortInfoAboutProduct{//интерф. для получения инфо о состоянии товара в отделении (кол-во, последняя поставка), и средним ценам (закупочной и себестоимости) товара
  quantity:number;
  change:number;
  avg_purchase_price:number;
  avg_netcost_price:number;
  last_purchase_price:number;
  department_sell_price:number;
  department_type_price:string;
  date_time_created:string;
}
interface SecondaryDepartment{
  id: number;
  name: string;
  pricetype_id: number;
  reserved: number;
  total: number;
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
interface idAndCount{ //интерфейс для запроса количества товара
  id: number;
  reserved: number;
  total: number;
}

@Component({
  selector: 'app-product-search-and-table-by-customers',
  templateUrl: './product-search-and-table-by-customers.component.html',
  styleUrls: ['./product-search-and-table-by-customers.component.css'],
})




export class ProductSearchAndTableByCustomersComponent implements OnInit, OnChanges {
  // counter:number=0;
  formBaseInformation:any;//форма-обёртка для массива форм customersOrdersProductTable (нужна для вывода таблицы)
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в formBaseInformation в качестве элемента массива
  settingsForm: any; // форма с настройками (нужно для сохранения некоторых настроек при расценке)
  displayedColumns:string[] = [];//отображаемые колонки таблицы товаров
  gettingTableData: boolean = false;//идет загрузка товарных позиций
  // totalProductCount:number=0;//всего кол-во товаров
  totalProductSumm:number=0;//всего (итоговая цена)
  totalNds:number=0;//всего НДС
  indivisibleErrorOfSearchForm:boolean; // дробное кол-во товара при неделимом товаре в форме поиска
  indivisibleErrorOfProductTable:boolean;// дробное кол-во товара при неделимом товаре в таблице товаров

  //для Autocomplete по поиску товаров
  searchProductCtrl = new UntypedFormControl();//поле для поиска товаров
  isProductListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredProducts: ProductSearchResponse[] = [];
  productImageName:string = null;
  mainImageAddress:string = 'assets_/images/no_foto.jpg';
  thumbImageAddress:string = 'assets_/images/no_foto.jpg';
  imageToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)

  //форма поиска товара
  selected_type_price_id: number; //тип цены, выбранный в форме поиска. Нужен для восстановления выбранного типа цены при сбросе формы поиска товара
  selected_price: number = 0; //цена, выбранная через поле Тип цены. Нужна для сравнения с полем Цена для выявления факта изменения его значения, и оставления значения столбце Тип цены пустым
  selected_sklad_id: number; //id склада, выбранный в форме поиска. Нужен для восстановления при сбросе формы поиска товара
  selected_pricingType: string; // тип расценки, выбранный в форме поиска.  Нужен для восстановления при сбросе формы поиска товара
  selected_reserve: boolean; //резервирование, выбранное в форме поиска. Нужно для восстановления при сбросе формы поиска товара
  priorityTypePriceId:number=0;// id типа цены, выбранный через поле "Приоритет типа цены"
  secondaryDepartment:SecondaryDepartment; //склад, выбранный в форме поиска товара
  productCountByDepartments:idAndCount[]=[];
  gettingProductCount=false;//прогресс-спиннер у кол-ва товаров
  gotProductCount=false;// чтобы не запрашивать каждый раз при нажатии на поле Склад количество товара, после первого запроса ставим эту переменную в true, и сброс в false только при сбросе формы поиска
  edizmName:string='';//наименование единицы измерения
  formSearchReadOnly=false;
  spravSysEdizmOfProductAll: idAndNameAndShorname[] = [];// массив, куда будут грузиться все единицы измерения товара

  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  avgCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
  lastPurchasePrice:number = 0; // последняя закупочная цена найденного и выбранного в форме поиска товара.
  // avgPurchasePrice:number = 0; // средняя закупочная цена найденного и выбранного в форме поиска товара.
  priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation

  //чекбоксы
  selection = new SelectionModel<CustomersOrdersProductTable>(true, []);// специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  @ViewChild("product_count", {static: false}) product_count;
  @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("form", {static: false}) form; 
  @ViewChild("productSearchFieldValue", {static: false}) productSearchFieldValue;
  // @ViewChild(MatTable, {static: false}) table_:MatTable<CustomersOrdersProductTable>; 

  @Input() parentDocId:number;
  @Input() parentDocName:string; // Идентификатор документа, в который вызывается данный компонент. Например, CustomersOrders, RetailSales и т.д.
  @Input() nds:boolean;
  @Input() nds_included:boolean;
  @Input() priorityTypePriceSide:string;
  @Input() department_type_price_id:number;//id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  @Input() cagent_type_price_id:number;//id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  @Input() default_type_price_id:number;//id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  @Input() department:string;
  @Input() cagents:Cagent[];
  @Input() company:string;
  @Input() company_id:number;
  @Input() hideTenths:boolean;
  @Input() pricingType:string;
  @Input() plusMinus:string;
  @Input() changePrice:number;
  @Input() changePriceType:string;
  @Input() department_id:number;
  @Input() secondaryDepartments:SecondaryDepartment[]=[];// склады в выпадающем списке складов формы поиска товара
  @Input() saveSettings:boolean;
  @Input() receivedPriceTypesList: idNameDescription[];//массив для получения списка типов цен
  @Input() spravTaxesSet: SpravTaxesSet[]; //массив имен и id для ндс 
  @Input() readonly:boolean;
  @Input() priceTypeId:number;
  @Input() accountingCurrency:string;// short name of Accounting currency of user's company (e.g. $ or EUR)
  @Input() receivedDepartmentsWithPartsList; // all departments with department parts
  
  // @Input() parent_document_id:string;// из какого документа вызывают. Например, CustomersOrders, RetailSales
  @Input() autoAdd:boolean;//автодобавление товара из формы поиска товара в таблицу
  @Input() routedProductsTable:CustomersOrdersProductTable[]; //данные, которые передаем в Розн. продажу при ее создании из Заказа покупателя. Здесь они нужны, чтобы заполнить таблицу товаров

  @Output() totalSumPriceEvent = new EventEmitter<string>();


  constructor(
    private _fb: UntypedFormBuilder,
    public MessageDialog: MatDialog,
    public ProductReservesDialogComponent: MatDialog,
    public ConfirmDialog: MatDialog,
    private _snackBar: MatSnackBar,
    public ShowImageDialog: MatDialog,
    public PricingDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.formBaseInformation = new UntypedFormGroup({
      customersOrdersProductTable: new UntypedFormArray([]),
    });
    this.formSearch = new UntypedFormGroup({
      row_id: new UntypedFormControl                   ('',[]),
      product_id: new UntypedFormControl               ('',[Validators.required]),
      customers_orders_id: new UntypedFormControl      ('',[]),
      product_count: new UntypedFormControl            ('',[Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price: new UntypedFormControl            ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new UntypedFormControl         (0 ,[]),
      // тип расценки. priceType - по типу цены, costPrice - себестоимость, manual - вручную
      pricingType: new UntypedFormControl              (this.pricingType ,[]),
      //величина наценки или скидки. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new UntypedFormControl              (this.changePrice,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // Наценка (plus) или скидка (minus)
      plusMinus: new UntypedFormControl                (this.plusMinus,[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new UntypedFormControl          (this.changePriceType,[]),
      price_type_id: new UntypedFormControl            (this.priceTypeId ,[]),
      edizm_id: new UntypedFormControl                 (0 ,[]),
      additional: new UntypedFormControl               ('',[]),
      nds_id: new UntypedFormControl                   ('',[Validators.required]),
      secondaryDepartmentId: new UntypedFormControl    (0 ,[Validators.required]),// id склада, выбранного в форме поиска товара
      available: new UntypedFormControl                ('',[]),//доступно
      reserved: new UntypedFormControl                 ('',[]),//зарезервировано в этом отделении в других Заказах покупателя
      total: new UntypedFormControl                    ('',[]),//остатки
      reserve: new UntypedFormControl                  (false,[]),//резервировать (да-нет)
      ppr_name_api_atol: new UntypedFormControl        ('',[]), //Признак предмета расчета в системе Атол. Невидимое поле. Нужно для передачи в таблицу товаров в качестве тега для чека на ккм Атол
      is_material: new UntypedFormControl              ('',[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      reserved_current: new UntypedFormControl         ('',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      indivisible: new UntypedFormControl              ('',[]), // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
      departmentPart: new UntypedFormControl           (0,[]),
      jobTitle: new UntypedFormControl                 (null,[]),
      employee: new UntypedFormControl                 (null,[]),

    });

    // Форма для сохранения настроек при расценке
    this.settingsForm = new UntypedFormGroup({
      //убрать десятые (копейки)
      hideTenths: new UntypedFormControl               (true,[]),
      //сохранить настройки
      saveSettings: new UntypedFormControl             (true,[]),
      //предприятие, для которого создаются настройки
      companyId: new UntypedFormControl                (null,[]),
      // тип расценки. priceType - по типу цены, costPrice - себестоимость, manual - вручную
      pricingType: new UntypedFormControl              ('priceType',[]),
      //тип цены
      priceTypeId: new UntypedFormControl              (null,[]),
      //наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new UntypedFormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // Наценка (plus) или скидка (minus)
      plusMinus: new UntypedFormControl                ('plus',[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new UntypedFormControl          ('procents',[]),
    });

    this.doOnInit();

  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.nds) {
      this.hideOrShowNdsColumn();
      setTimeout(() => {this.tableNdsRecount();}, 1);// ставим таймаут, иначе таблица пересчитывается но не обновляется при добавлении столбца. Не понятно, баг это или фича
    }
  }
  ngAfterViewInit() {
    setTimeout(() => { this.productSearchFieldValue.nativeElement.focus(); }, 1000);
  }

  getTaxNameById(id:number){let name='';this.spravTaxesSet.map(i=>{if(+i.id==id)name=i.name}); return name}
  trackByIndex(i: any) { return i; }


  doOnInit(){
    this.formSearch.get('secondaryDepartmentId').setValue(this.department_id);
    this.hideOrShowNdsColumn();

    if(!this.routedProductsTable)
      this.getProductsTable();
    else
      this.getRoutedProductsTable();

    this.getSpravSysEdizm(); //загрузка единиц измерения.
    this.setCurrentTypePrice();
    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
    console.log('-----------------------------------------------------');
    console.log("parentDocId-"+this.parentDocId);
    console.log("nds-"+this.nds);
    console.log("nds_included-"+this.nds_included);
    console.log("priorityTypePriceSide-"+this.priorityTypePriceSide);
    console.log("department_type_price_id-"+this.department_type_price_id);//id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
    console.log("cagent_type_price_id-"+this.cagent_type_price_id);//id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
    console.log("default_type_price_id-"+this.default_type_price_id);//id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
    console.log("department-"+this.department);
    console.log("cagents-"+this.cagents);
    console.log("company-"+this.company);
    console.log("company_id-"+this.company_id);
    console.log("hideTenths-"+this.hideTenths);
    console.log("pricingType-"+this.pricingType);
    console.log("plusMinus-"+this.plusMinus);
    console.log("changePrice-"+this.changePrice);
    console.log("changePriceType-"+this.changePriceType);
    console.log("department_id-"+this.department_id);
    console.log("secondaryDepartments-"+this.secondaryDepartments);// склады в выпадающем списке складов формы поиска товара
    console.log("saveSettings-"+this.saveSettings);
    console.log("receivedPriceTypesList-"+this.receivedPriceTypesList);//массив для получения списка типов цен
    console.log("spravTaxesSet-"+this.spravTaxesSet); //массив имен и id для ндс 
    console.log('-----------------------------------------------------');
  }


// --------------------------------------- *** ЧЕКБОКСЫ *** -------------------------------------
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
    this.formBaseInformation.controls.customersOrdersProductTable.value.forEach(row => {
          if(this.showCheckbox(row)){this.selection.select(row);}
        });
        this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }
  resetSelecion(){
    this.selection.clear(); 
  }
  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }
  createCheckedList(){
    this.checkedList = [];
    for (var i = 0; i < this.formBaseInformation.controls.customersOrdersProductTable.value.length; i++) {
      if(this.selection.isSelected(this.formBaseInformation.controls.customersOrdersProductTable.value[i])){
        this.checkedList.push(this.formBaseInformation.controls.customersOrdersProductTable.value[i].row_id);
      }
    }
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.formBaseInformation.controls.customersOrdersProductTable.value.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:CustomersOrdersProductTable):boolean{
    return true;
  }
// --------------------------------------- *** КОНЕЦ ЧЕКБОКСОВ  *** -------------------------------------

  getProductsTable(){
    this.gettingTableData=true;
    let ProductsTable: CustomersOrdersProductTable[]=[];
    //сбрасываем, иначе при сохранении будут прибавляться дубли и прочие глюки
    const control = <UntypedFormArray>this.formBaseInformation.get('customersOrdersProductTable');    
    control.clear();
    this.http.get('/api/auth/get'+this.parentDocName+'ProductTable?id='+this.parentDocId)
        .subscribe(
            data => { 
                this.gettingTableData=false;
                ProductsTable=data as any;
                if(ProductsTable.length>0){
                  ProductsTable.forEach(row=>{
                    control.push(this.formingProductRowFromApiResponse(row));
                  });
                  this.finishRecount();// подсчёт итогов у таблицы
                  this.refreshTableColumns();
                }
            },
            error => {
              this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
  }
  formingProductRowFromApiResponse(row: CustomersOrdersProductTable) {
    let multiplifierNDS = this.getTaxMultiplifierBySelectedId(+row.nds_id);
    return this._fb.group({
      id: new UntypedFormControl (row.id,[]),
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new UntypedFormControl (row.product_id,[]),
      customers_orders_id: new UntypedFormControl (this.parentDocId,[]),
      name: new UntypedFormControl (row.name,[]),
      product_count: new UntypedFormControl (row.product_count,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      edizm: new UntypedFormControl (row.edizm,[]),
      edizm_id:  new UntypedFormControl (row.edizm_id,[]), 
      product_price:  new UntypedFormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')/*,ValidationService.priceMoreThanZero*/]),
      product_price_of_type_price: new UntypedFormControl (row.product_price,[]),
      product_sumprice: new UntypedFormControl (this.numToPrice(+(row.product_count*row.product_price*(this.nds&&!this.nds_included?multiplifierNDS:1)).toFixed(2),2),[]),
      available:  new UntypedFormControl ((row.total)-(row.reserved),[]),
      price_type:  new UntypedFormControl (row.price_type,[]),
      price_type_id: [row.price_type_id],
      nds:  new UntypedFormControl (row.nds,[]),
      nds_id: new UntypedFormControl (row.nds_id,[]),
      reserve:  new UntypedFormControl (row.reserve,[]),// переключатель Резерв
      reserved:  new UntypedFormControl (row.reserved,[]), // сколько зарезервировано этого товара в других документах за исключением этого
      total: new UntypedFormControl (row.total,[]),
      priority_type_price: new UntypedFormControl (row.priority_type_price,[]),// приоритет типа цены: Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      department_id: new UntypedFormControl (row.department_id,[]), //id отделения, выбранного в форме поиска 
      department: new UntypedFormControl (row.department,[]), //имя отделения, выбранного в форме поиска 
      shipped:  new UntypedFormControl (row.shipped,[]),
      ppr_name_api_atol:  new UntypedFormControl (row.ppr_name_api_atol,[]), //Признак предмета расчета в системе Атол
      is_material:  new UntypedFormControl (row.is_material,[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      reserved_current:  new UntypedFormControl (row.reserved_current,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),// зарезервировано единиц товара в отделении (складе) в ЭТОМ (текущем) Заказе покупателя
      indivisible:  new UntypedFormControl (row.indivisible,[]),
    });
  }

  getRoutedProductsTable(){
    const control = <UntypedFormArray>this.formBaseInformation.get('customersOrdersProductTable');
    control.clear();
    this.routedProductsTable.forEach(row=>{
      control.push(this.formingProductRowFromApiResponse(row));
    });
    this.finishRecount();// подсчёт итогов у таблицы
  }


  addProductRow() 
  { 
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.customersOrdersProductTable.map(i => 
    {// список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
      if(+i['product_id']==this.formSearch.get('product_id').value && +i['department_id']==this.formSearch.get('secondaryDepartmentId').value)
      {//такой товар с таким складом уже занесён в таблицу товаров ранее, и надо поругаться.
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.prod_in_list'),}});
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара  для выбранного складад в списке ещё нет. Добавляем в таблицу (в форму formBaseInformation)
      const control = <UntypedFormArray>this.formBaseInformation.get('customersOrdersProductTable');
      control.push(this.formingProductRowFromSearchForm());
     this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
     this.finishRecount(); // подсчёт тоталов в таблице
    } 
  }
   //формирование строки таблицы с товарами для заказа покупателя из формы поиска товара
   formingProductRowFromSearchForm() {
    return this._fb.group({
      id: new UntypedFormControl (null,[]),
      row_id: [this.getRowId()],
      // bik: new FormControl ('',[Validators.required,Validators.pattern('^[0-9]{9}$')]),
      product_id:  new UntypedFormControl (+this.formSearch.get('product_id').value,[]),
      customers_orders_id:  new UntypedFormControl (+this.parentDocId,[]),
      name:  new UntypedFormControl (this.searchProductCtrl.value,[]),
      product_count:  new UntypedFormControl (+this.formSearch.get('product_count').value,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      edizm:  new UntypedFormControl (this.edizmName,[]),
      edizm_id:  new UntypedFormControl (+this.formSearch.get('edizm_id').value,[]),
      product_price: new UntypedFormControl (this.formSearch.get('product_price').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')/*,ValidationService.priceMoreThanZero*/]),
      product_price_of_type_price:  new UntypedFormControl (+this.formSearch.get('product_price').value,[]),
      product_sumprice:  new UntypedFormControl (this.formSearch.get('product_sumprice').value,[]),
      available:  new UntypedFormControl (+this.formSearch.get('available').value,[]),
      nds:  new UntypedFormControl (this.getNdsNameBySelectedId(+this.formSearch.get('nds_id').value),[]),
      nds_id:  new UntypedFormControl (+this.formSearch.get('nds_id').value,[]),
      price_type:  new UntypedFormControl    ((this.selected_price==+this.formSearch.get('product_price').value && this.formSearch.get('pricingType').value=='priceType')?this.getPriceTypeNameBySelectedId(+this.formSearch.get('price_type_id').value):'',[]),
      price_type_id:  new UntypedFormControl ((this.selected_price==+this.formSearch.get('product_price').value && this.formSearch.get('pricingType').value=='priceType')?+this.formSearch.get('price_type_id').value:null,[]),
      reserve: new UntypedFormControl (this.formSearch.get('reserve').value,[]),// переключатель Резерв
      reserved: new UntypedFormControl (this.formSearch.get('reserved').value,[]), // сколько зарезервировано этого товара в других документах за исключением этого
      total: new UntypedFormControl (this.formSearch.get('total').value,[]),
      priority_type_price: new UntypedFormControl (this.priorityTypePriceSide,[]),// приоритет типа цены: Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      department_id: new UntypedFormControl (this.formSearch.get('secondaryDepartmentId').value,[]), //id отделения, выбранного в форме поиска 
      department: new UntypedFormControl (this.getSecondaryDepartmentById(+this.formSearch.get('secondaryDepartmentId').value).name,[]), //имя отделения, выбранного в форме поиска 
      shipped: new UntypedFormControl (0,[]),// ведь еще ничего не отгрузили
      ppr_name_api_atol:  new UntypedFormControl (this.formSearch.get('ppr_name_api_atol').value,[]), //Признак предмета расчета в системе Атол
      is_material:  new UntypedFormControl (this.formSearch.get('is_material').value,[]), //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)
      reserved_current:  new UntypedFormControl (this.formSearch.get('reserve').value?this.formSearch.get('product_count').value:0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),// зарезервировано единиц товара в отделении (складе) в ЭТОМ (текущем) Заказе покупателя
      indivisible:  new UntypedFormControl (this.formSearch.get('indivisible').value,[]),
    });
  }
  getSecondaryDepartmentById(id:number):SecondaryDepartment{
    let name:string = '';
      this.secondaryDepartments.forEach(a=>{
        if(a.id==id) this.secondaryDepartment=a;
      })
    return(this.secondaryDepartment);
  }
  getNdsNameBySelectedId(srchId:number):string {
    let name='';
    this.spravTaxesSet.forEach(a=>{
      if(+a.id == srchId) {name=a.name}
    }); return name;}
  getPriceTypeNameBySelectedId(srchId:number):string {
    let name='';
    this.receivedPriceTypesList.forEach(a=>{
      if(+a.id == srchId) {name=a.name}
    }); return name;}
  getPriceTypesNameById(id:number):string{
    let name:string = 'тип цены не установлен';
    if(this.receivedPriceTypesList){
      this.receivedPriceTypesList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  getRowId():number{
    let current_row_id:number=this.row_id;
    this.row_id++;
    return current_row_id;
  }

  getNds(): Observable<boolean> {
    return of(this.nds);
  }

  hideOrShowNdsColumn(){
    this.displayedColumns=[];
    if(!this.readonly)
      if(this.parentDocName=='CustomersOrders')
        this.displayedColumns.push('select');
    this.displayedColumns.push('name','product_count','product_price','product_sumprice');
    if(this.parentDocName=='CustomersOrders')
      this.displayedColumns.push('reserved_current');
    this.displayedColumns.push('available','total','reserved');
    if(this.parentDocName=='CustomersOrders')
      this.displayedColumns.push('shipped');
    this.displayedColumns.push('price_type');
    if(this.nds)
      this.displayedColumns.push('nds');
    this.displayedColumns.push('department');
    if(!this.readonly)
      this.displayedColumns.push('delete');
  }

  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('customersOrdersProductTable');
    return control;
  }
  openProductCard(docId:number) {
    this.dialogCreateProduct.open(ProductsDocComponent, {
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
  openDialogProductReserves(departmentId:number,productId: number) { //открывает диалог отчета резервов
    const dialogReserves = this.ProductReservesDialogComponent.open(ProductReservesDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%', 
      minHeight: '200px',
      data:
      { 
        companyId: this.company_id,
        documentId: +this.parentDocId,
        productId: productId,
        departmentId:departmentId,
      },
    });
    dialogReserves.afterClosed().subscribe(result => {
    });
  }
  deleteProductRow(row: CustomersOrdersProductTable,index:number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {  
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_prod_item'),
        warning: translate('docs.msg.del_prod_quer',{name:row.name})+'?',
        // query: 'Данная товарная позиция удалится безвозвратно',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const control = <UntypedFormArray>this.formBaseInformation.get('customersOrdersProductTable');
        // if(+row.id==0){// ещё не сохраненная позиция, можно не удалять с сервера (т.к. ее там нет), а только удалить локально
          control.removeAt(index);
          this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
          this.finishRecount(); // подсчёт тоталов в таблице

          
        // }else{ //нужно удалить с сервера и перезагрузить таблицу 
          // this.http.get('/api/auth/deleteCustomersOrdersProductTableRow?id='+row.id)
          // .subscribe(
              // data => { 
                // this.getProductsTable();
                // this.openSnackBar("Товар успешно удалён", "Закрыть");
                // this.finishRecount(); // подсчёт тоталов в таблице

              // },
              // error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
          // );
        // }
      }
    }); 
  }
  setCurrentTypePrice(){
    // console.log("child department_type_price_id - "+this.department_type_price_id);
    // alert(this.department_type_price_id+'-'+this.cagent_type_price_id+'-'+this.default_type_price_id)
    switch (this.priorityTypePriceSide) {//проверяем дефолтную приоритетную цену
      case 'sklad': {//если sklad - в поле Тип цены выставляем тип цены склада
        if(this.department_type_price_id>0){
          this.formSearch.get('price_type_id').setValue(this.department_type_price_id);}
        else {this.showWarningTypePriceDialog(translate('modules.msg.department'), translate('modules.msg._department_'),this.department)}
        break;}
      case 'cagent': {//если cagent - в поле Тип цены выставляем тип покупателя
        if(this.cagent_type_price_id>0)
          this.formSearch.get('price_type_id').setValue(this.cagent_type_price_id);
        else this.showWarningTypePriceDialog(translate('modules.msg.customer'), translate('modules.msg._customer_'),'Now there is no separated cagent')
        break;}
      default:{      //если defprice - в поле Тип цены выставляем тип цены по-умолчанию
        if(this.default_type_price_id>0)
          this.formSearch.get('price_type_id').setValue(this.default_type_price_id);
        else this.showWarningTypePriceDialog(translate('modules.msg.default_price'), translate('modules.msg._company_'),'('+this.company+')');
      }
    }
    this.selected_type_price_id=this.formSearch.get('price_type_id').value;
    this.priorityTypePriceId=this.formSearch.get('price_type_id').value;
  }

  showWarningTypePriceDialog(typePrice:string, subj:string, subjname:string){
    if(subjname.length>0)// при старте Розничных продаж предприятие, отделение или покупатель могут быть не выбраны (из настроек). Следовательно, предупреждение, что у subj нет типа цены смысла не несёт
      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:
      translate('modules.msg.in_settings_')+typePrice+translate('modules.msg._but_')+subj+' "'+subjname+'"'+translate('modules.msg._price_type_')+(this.priorityTypePriceSide=='defprice'?translate('modules.msg._in_registry_'):'')
    }});
  }
  //--------------------------------------- **** поиск по подстроке для товара  ***** ------------------------------------
  onProductSearchValueChanges(){
    this.searchProductCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredProducts = [];
        if(+this.formSearch.get('product_id').value==0) this.canAutocompleteQuery=true;
        console.log(this.searchProductCtrl.value)
      }),      
      
      switchMap(fieldObject => 
        this.getProductsList()),

    ).subscribe(data => {
      this.isProductListLoading = false;
      if (data == undefined) {
        this.filteredProducts = [];
      } else {
        this.filteredProducts = data as any;
        if(this.filteredProducts.length==1){
          this.onAutoselectProduct();
      }}}
      ,error => {this.isProductListLoading = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }

  getEdizmNameBySelectedId(srchId:number):string {
    let name='';
    this.spravSysEdizmOfProductAll.forEach(a=>{
      if(+a.id == srchId) {name=a.short_name}
    }); return name;}

  getSpravSysEdizm():void {    
    let companyId=this.company_id;
    this.http.post('/api/auth/getSpravSysEdizm', {id1: companyId, string1:"(1,2,3,4,5,6)"})  // все типы ед. измерения
    .subscribe((data) => {this.spravSysEdizmOfProductAll = data as any[];
            },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }
  getProductsList(){ //заполнение Autocomplete для поля Товар
    if(!this.isProductListLoading){// смысла долбить сервер, пока он формирует ответ, нет. Плюс иногда onProductSearchValueChanges отрабатывает дуплетом, что приводит к двойному добавлению товара
      try 
      {
        if(this.canAutocompleteQuery && this.searchProductCtrl.value.length>1)
        {
          this.isProductListLoading  = true;
          return this.http.get(
            '/api/auth/getProductsList?searchString='+this.searchProductCtrl.value+'&companyId='+this.company_id+'&departmentId='+this.formSearch.get('secondaryDepartmentId').value+'&document_id='+this.parentDocId+'&priceTypeId='+(+this.formSearch.get('price_type_id').value)+'&showRemovedFromSale=false&showNotPurchased=true&showServices=true'
            );
        }else return [];
      } catch (e) {
        return [];
      }
    } else return [];
  }
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
  }
  onSelectProduct(product:ProductSearchResponse){
    this.formSearch.get('product_count').setValue('1');
    this.formSearch.get('product_id').setValue(+product.id);
    this.formSearch.get('edizm_id').setValue(+product.edizm_id);
    this.formSearch.get('nds_id').setValue(+this.filteredProducts[0].nds_id);
    this.formSearch.get('available').setValue(product.total-product.reserved);
    this.formSearch.get('total').setValue(product.total);
    this.formSearch.get('reserved').setValue(product.reserved);
    this.formSearch.get('ppr_name_api_atol').setValue(product.ppr_name_api_atol);
    this.formSearch.get('is_material').setValue(product.is_material);
    this.formSearch.get('reserved_current').setValue(product.reserved_current);
    this.formSearch.get('indivisible').setValue(product.indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    this.productImageName = product.filename;
    this.afterSelectProduct();
  }
  onSecondaryDepartmentSelection(){
    //установим текущий тип цены отделения (склада) = типу цены выбранного отделения
    this.department_type_price_id=this.getSecondaryDepartmentById(this.formSearch.get('secondaryDepartmentId').value).pricetype_id;
    if(this.priorityTypePriceSide=='sklad'){// если приоритетным типом цены является Склад
      //типом цены поля "Приоритет типа цены" для значения Склад будет тип цены выбранного отделения (склада)
      this.priorityTypePriceId=this.department_type_price_id;
     //если для данного отделения тип цены не установлен - предупреждение
      if(+this.department_type_price_id==0)
        this.showWarningTypePriceDialog('Склад', 'cклада',this.getSecondaryDepartmentById(this.formSearch.get('secondaryDepartmentId').value).name)
      //установим значение поля Тип цены = типу цены склада
      this.formSearch.get('price_type_id').setValue(this.department_type_price_id); 
    } 
    if(+this.formSearch.get('product_id').value>0){//если товар выбран в поиске товара
      this.getProductsPriceAndRemains();// обновляем информацию о выбранном товаре по выбранному отделению и возможно сменившемуся типу цены (т.к. у разных отделений свои типы цен)
    } else{
      // после смены склада очистить поисковую строку:
      this.searchProductCtrl.setValue('');
    } 
  }
  onSelectPriorityPriceType(priceTypeId:number,priorityTypePriceSide:string){
    //устанавливаем значение поля Тип цены 
    this.formSearch.get('price_type_id').setValue(priceTypeId);
    this.priorityTypePriceId=priceTypeId;
    this.priorityTypePriceSide=priorityTypePriceSide;
    this.onPriceTypeSelection();
  }
  // Обработка нажатия на переключалку Резерв в форме поиска товара
  onClickReserveSwitcher(){
    if(this.formSearch.get('reserve').value){
      this.formSearch.get('reserved_current').setValue(0);
    }else{
      this.formSearch.get('reserved_current').setValue(this.formSearch.get('product_count').value);
    }
  }
  clickPlusMinus(plusMinus:string){
    switch (plusMinus) {
      case 'plus': {
        this.formSearch.get('plusMinus').setValue('plus');
        this.priceUpDownFieldName=translate('modules.field.markup');
        break;}
      case 'minus': {
        this.formSearch.get('plusMinus').setValue('minus');
        this.priceUpDownFieldName=translate('modules.field.discount');
        break;}
    }
    this.priceRecount();
  }
  afterSelectProduct(){

      this.edizmName=this.getEdizmNameBySelectedId(+this.formSearch.get('edizm_id').value);
      this.formSearchReadOnly=true;
      if(!this.autoAdd)this.loadMainImage();//если автодобавление, то картинку грузить ни к чему
      this.getProductsPriceAndRemains();
      setTimeout(() => { this.product_count.nativeElement.focus(); }, 500);
  }
  loadMainImage(){
    if(this.productImageName!=null){
      this.getImageService('/api/auth/getFileImageThumb/' + this.productImageName).subscribe(blob => {
        this.createImageFromBlob(blob);
      });
    } 
  }
  //открывает диалог расценки/ from - откуда открываем: searchForm - форма поиска товара, tableHeader - шапка таблицы, tableRow - строка таблицы
  openDialogPricing(product_id:number, secondaryDepartmentId:number, price_type_id:number,from:string) { 
    const dialogPricing = this.PricingDialogComponent.open(PricingDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      data:
      { //отправляем в диалог:
        companyId:        this.company_id, //id предприятия
        documentId:       this.parentDocId, //id документа
        productId:        product_id, // id товара 
        departmentId:     secondaryDepartmentId, //id отделения
        priceTypeId:      this.priceTypeId, //id типа цены
        plusMinus:        this.formSearch.get('plusMinus').value, //наценка или скидка ("+" или "-")
        pricingType:      this.formSearch.get('pricingType').value, // тип расценки (По типу цены, по Себестоимости или вручную)
        changePrice:      this.formSearch.get('changePrice').value, //наценка или скидка в цифре (например, 50)
        changePriceType:  this.formSearch.get('changePriceType').value,// выражение наценки/скидки (валюта или проценты)
        hideTenths:       this.hideTenths, //убирать десятые и сотые доли цены (копейки) 
        saveSettings:     this.settingsForm.get('saveSettings').value, //по-умолчанию сохранять настройки
        priceTypesList:   this.receivedPriceTypesList,
      },
    });
    dialogPricing.afterClosed().subscribe(result => {
      if(result){
        this.applySettings(result);
        if(result.get('saveSettings').value){
          //если в диалоге Расценки стояла галка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
          this.settingsForm.get('pricingType').setValue(result.get('pricingType').value);
          this.settingsForm.get('priceTypeId').setValue(result.get('priceTypeId').value);
          this.settingsForm.get('plusMinus').setValue(result.get('plusMinus').value);
          this.settingsForm.get('changePrice').setValue(result.get('changePrice').value);
          this.settingsForm.get('changePriceType').setValue(result.get('changePriceType').value);
          this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
          this.settingsForm.get('companyId').setValue(this.company_id);
          this.updateSettings();
        }
      }
    });
  }
  applySettings(set:any){
    this.formSearch.get('pricingType').setValue(set.get('pricingType').value);
    this.formSearch.get('price_type_id').setValue(set.get('priceTypeId').value);
    this.formSearch.get('plusMinus').setValue(set.get('plusMinus').value);
    this.formSearch.get('changePrice').setValue(set.get('changePrice').value);
    this.formSearch.get('changePriceType').setValue(set.get('changePriceType').value);
    
    if(set.get('resultPrice')){ // если настройки поступили из формы расценки выбранного товара
      this.formSearch.get('product_price').setValue(set.get('resultPrice').value);
    }else{// иначе настройки пришли из формы настроек родительского документа.
      this.priorityTypePriceSide=set.get('priorityTypePriceSide').value; //получили приоритет цены
      this.setCurrentTypePrice(); // установим тип цены по приоритету цены
      this.onPriceTypeSelection(); // пересчитаем цену в зависимости от новго типа цены
    }

    
    this.calcSumPriceOfProduct();
  }
  updateSettings(){
    return this.http.post('/api/auth/savePricingSettings'+this.parentDocName, this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar(translate('modules.msg.sett_saved_sc'), translate('docs.msg.close'));                          
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  showImage(name:string){
    if(this.productImageName!=null){
      // console.log("productImageName - "+this.productImageName);
      const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
        data:
        { 
          link: name,
        },
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

  getProductsPriceAndRemains(){
     let result:any;
     let price_type_id:number;
     price_type_id=(+this.formSearch.get('price_type_id').value==0?0:this.formSearch.get('price_type_id').value);
     this.http.get('/api/auth/getProductsPriceAndRemains?department_id='+this.formSearch.get('secondaryDepartmentId').value+'&product_id='+this.formSearch.get('product_id').value+'&price_type_id='+price_type_id+'&document_id='+this.parentDocId)
      .subscribe(
          data => { 
            result=data as any;
            this.formSearch.get('total').setValue(result.total);
            this.formSearch.get('reserved').setValue(result.reserved);
            this.formSearch.get('available').setValue(result.total-result.reserved);
            this.avgCostPrice=(+result.avgCostPrice>0?result.avgCostPrice:0);
            this.lastPurchasePrice=(+result.lastPurchasePrice>0?result.lastPurchasePrice:0);
            // this.avgPurchasePrice=(+result.avgPurchasePrice>0?result.avgPurchasePrice:0);
            this.productPrice=(+result.price>0?result.price:0);
            this.priceRecount();
            if(this.autoAdd){
              setTimeout(() => {this.addProductRow();},100);
            }
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  priceRecount(){
    //перерасчет цены в зависимости от выбранного в поле "Расценивать по" значения
    switch (this.formSearch.get('pricingType').value) {
      case 'priceType': {//если "Тип цены"
        this.setChangePrice(this.productPrice);
        break;}
      case 'manual': {      //если "Вручную"
          this.setPrice(0);
        break;
      }
      case 'avgCostPrice':{
        this.setChangePrice(this.avgCostPrice);
        break;
      }
      case 'lastPurchasePrice':{
        this.setChangePrice(this.lastPurchasePrice);
        break;
      }
      // case 'avgPurchasePrice':{
      //   this.setChangePrice(this.avgPurchasePrice);
      //   break;
      // }
    }
  }
  setChangePrice(price:number){
    // фактическая величина изменения цены -изменяем цену по условиям, содержащимся в параметрах plusMinus, changePrice и changePriceType
    let priceChangeDelta:number;
    if(this.formSearch.get('changePrice').value==0) this.formSearch.get('changePrice').setValue(0); //чтобы подставлялся 0 после удаления всего в поле Наценка/Скидка
    switch (this.formSearch.get('changePriceType').value) {
      case 'procents': {//если выбраны проценты 
        priceChangeDelta=price*this.formSearch.get('changePrice').value/100;
        if(this.formSearch.get('plusMinus').value=='minus') priceChangeDelta = -priceChangeDelta;
        break;}
      case 'currency': {//если выбрана валюта 
        if(this.formSearch.get('plusMinus').value=='minus') 
          priceChangeDelta = -this.formSearch.get('changePrice').value;
        else priceChangeDelta = +this.formSearch.get('changePrice').value;
        break;}
    }
    this.setPrice(+(price+priceChangeDelta).toFixed(2));
  }
  setPrice(price:number){
    if(this.hideTenths)//если опция "Убрать копейки"
      //отбросим копейки:
      price=+this.numToPrice(price,0);

    //форматируем в вид цены и вставляем в поле Цена
    this.formSearch.get('product_price').setValue(this.numToPrice(price,2));
   
    this.selected_price=price;
    this.calcSumPriceOfProduct();
  }
  calcSumPriceOfProduct(){
    let switcherNDS:boolean = this.nds;
    let switcherNDSincluded:boolean = this.nds_included;
    let selectedNDS:number = this.getTaxMultiplifierBySelectedId(+this.formSearch.get('nds_id').value)

    this.formSearch.get('product_count').setValue((this.formSearch.get('product_count').value!=null?this.formSearch.get('product_count').value:'').replace(",", "."));
    this.formSearch.get('product_price').setValue((this.formSearch.get('product_price').value!=null?this.formSearch.get('product_price').value:'').replace(",", "."));
    this.formSearch.get('product_sumprice').setValue(this.numToPrice(
      (+this.formSearch.get('product_count').value)*(+this.formSearch.get('product_price').value)
      ,2));
    //если включён переключатель "НДС", но переключатель "НДС включена" выключен, нужно добавить к цене НДС, выбранное в выпадающем списке
    if(switcherNDS && !switcherNDSincluded) 
    {this.formSearch.get('product_sumprice').setValue((+this.formSearch.get('product_sumprice').value*selectedNDS).toFixed(2));}
  }
  // отдает цену товара в текущем предприятии по его id и id его типа цены
  getProductPrice(product_id:number,price_type_id:number){
    let price:number;
    return this.http.get('/api/auth/getProductPrice?company_id='+this.company_id+'&product_id='+product_id+'&price_type_id='+price_type_id)
  }    
  
  checkEmptyProductField(){
    if(this.searchProductCtrl.value.length==0){
      this.resetFormSearch();
    }
  };    

  resetFormSearch(){
      this.formSearchReadOnly=false;
      this.searchProductCtrl.setValue('');
      this.edizmName='';
      this.thumbImageAddress="assets_/images/no_foto.jpg";      
      this.mainImageAddress="";
      this.productImageName=null;
      this.imageToShow=null;
      this.selected_sklad_id=this.formSearch.get('secondaryDepartmentId').value;
      this.selected_reserve=this.formSearch.get('reserve').value;
      this.priceTypeId_temp=this.formSearch.get('price_type_id').value;
      this.selected_pricingType=this.formSearch.get('pricingType').value;
      this.form.resetForm();//реализовано через ViewChild: @ViewChild("form", {static: false}) form; + В <form..> прописать #form="ngForm"
      // this.formSearch.get('price_type_id').setValue(+this.selected_type_price_id);
      this.formSearch.get('product_count').setValue('');
      this.formSearch.get('secondaryDepartmentId').setValue(this.selected_sklad_id);
      this.formSearch.get('pricingType').setValue(this.selected_pricingType);
      this.formSearch.get('price_type_id').setValue(this.priceTypeId_temp);
      this.formSearch.get('plusMinus').setValue(this.plusMinus);
      this.formSearch.get('changePrice').setValue(this.changePrice);
      this.formSearch.get('changePriceType').setValue(this.changePriceType);
      this.formSearch.get('reserve').setValue(this.selected_reserve);
      this.selected_price=0;
      this.avgCostPrice = 0; // себестоимость найденного и выбранного в форме поиска товара.
      this.lastPurchasePrice = 0; // последняя закупочная цена найденного и выбранного в форме поиска товара.
      // this.avgPurchasePrice = 0; // средняя закупочная цена найденного и выбранного в форме поиска товара.
      this.calcSumPriceOfProduct();//иначе неправильно будут обрабатываться проверки формы
      this.resetProductCountOfSecondaryDepartmentsList();// сброс кол-ва товара по отделениям (складам)
      this.gotProductCount=false;
      this.avgCostPrice=0;
      this.productPrice=0;
      setTimeout(() => { this.productSearchFieldValue.nativeElement.focus(); }, 1000);
  }
  //сброс кол-ва товаров в форме поиска (в списке Склад)
  resetProductCountOfSecondaryDepartmentsList(){
    this.secondaryDepartments.forEach(s=>{
      s.total=this.getProductCountOfDepartment(s.id,'total');
      s.reserved=this.getProductCountOfDepartment(s.id,'reserved');
    });
  }
  // из полученных в getProductCount данных отдает количество (необходимого типа) товара. Например, количество зарезервированных товаров в отделении N 
  getProductCountOfDepartment(department_id:number, type_of_count:string):number{
    let count:number=0;
    this.productCountByDepartments.forEach(p=>{
      if(p.id==department_id){
        switch (type_of_count){
          case 'total': {count = p.total; break} //всего 
          default : count=p.reserved;//зарезервирвано
        }
      }
    })
    return count;
  }
//отдает список отделений в виде их Id с зарезервированным количеством и общим количеством товара в отделении
getProductCount(){
  if(+this.formSearch.get('product_id').value>0 && !this.gotProductCount){//если товар выбран в поиске товара и инфу о количестве этого товара в отделениях еще не получали
    this.gettingProductCount=true;
    this.http.get('/api/auth/getProductCount?product_id='+this.formSearch.get('product_id').value+'&company_id='+this.company_id+'&document_id='+this.parentDocId)
    .subscribe(
      data => { 
      this.productCountByDepartments=data as idAndCount[];
      this.secondaryDepartments.forEach(s=>{
        s.total=this.getProductCountOfDepartment(s.id,'total');
        s.reserved=this.getProductCountOfDepartment(s.id,'reserved');
      });
       this.gettingProductCount=false;
       this.gotProductCount=true;
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
}

//возвращает таблицу товаров в родительский компонент для сохранения
  getProductTable(){
    return this.formBaseInformation.value.customersOrdersProductTable;
  }

  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControlTablefield().clear();
        this.getTotalSumPrice();//чтобы пересчиталась сумма в чеке
      }});  
  }
  refreshTableColumns(){
    this.displayedColumns=[];
    setTimeout(() => { 
      this.hideOrShowNdsColumn();
    }, 1);
  }
  getTaxMultiplifierBySelectedId(srchId:number):number {
    //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
        let value=0;
        this.spravTaxesSet.forEach(a=>{
          if(+a.id == srchId) {value=a.multiplier}
        }); return value;}   

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
      this.nds_included=nds_included;
    //перерасчет НДС в форме поиска
    if(+this.formSearch.get('product_id').value) this.calcSumPriceOfProduct();
    //перерасчет НДС в таблице товаров
    if(this.formBaseInformation.controls['customersOrdersProductTable'].value.length>0){
      this.totalNds=0;
      let switcherNDS:boolean = this.nds;
      let switcherNDSincluded:boolean = this.nds_included;
      let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
      this.formBaseInformation.value.customersOrdersProductTable.map(i =>{
          multiplifierNDS = this.getTaxMultiplifierBySelectedId(+i['nds_id']);
          //если включён переключатель "Налог", но переключатель "Налог включен" выключен,
          if(switcherNDS && !switcherNDSincluded){
          //..к сумме добавляем Налог
            i['product_sumprice']=this.numToPrice(+(+i['product_count']*(+i['product_price'])*multiplifierNDS).toFixed(2),2);
            this.totalNds += +this.numToPrice(+(+i['product_count']*(+i['product_price'])*(multiplifierNDS-1)).toFixed(2),2);//суммируем общий налог
          }else {
            i['product_sumprice']=this.numToPrice(+((+i['product_count'])*(+i['product_price'])).toFixed(2),2);//..иначе не добавляем, и сумма - это просто произведение количества на цену
            //если включены переключатели "Налог" и "Налог включен" - Налог уже в цене, и нужно вычислить его из неё
            if(switcherNDS && switcherNDSincluded){
              this.totalNds += this.getTaxFromPrice(i['product_sumprice'], i['nds_id']);
            }
          }
        })}}
}

//отправляем родителю результат (для его дальнейшей переправки в кассовый модуль)
  sendSumPriceToKKM(){
    this.totalSumPriceEvent.emit(this.totalProductSumm.toString());
  }
   // равна ли изменённая цена цене по выбранному Типу цены. Если нет - сбрасываем выбор Типа цены
  rowPriceEqualsToTypePrice(row_index:number){
    const control = this.getControlTablefield();
    let product_price = control.controls[row_index].get('product_price').value;
    let product_price_of_type_price = control.controls[row_index].get('product_price_of_type_price').value;
    if (+product_price != +product_price_of_type_price) control.controls[row_index].get('price_type_id').setValue(null);
  }
//------------------------------------------------------------------------- Обсчёт строки таблицы и её итогов ---------------------------------------------------------------------------------
//------------------------------------------------- ON CHANGE...
//при изменении поля Количество в таблице товаров
  onChangeProductCount(row_index:number){
    this.commaToDotInTableField(row_index, 'product_count');  // замена запятой на точку
    this.setRowSumPrice(row_index);                           // пересчёт суммы оплаты за данный товар
    this.tableNdsRecount();                                   // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                     // подсчёт TOTALS и отправка суммы в ККМ
    this.checkIndivisibleErrorOfProductTable();               // проверка на неделимость товара
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
    this.tableNdsRecount();                                    // пересчёт Суммы оплаты за товар с учётом НДС
    this.finishRecount();                                      // подсчёт TOTALS и отправка суммы в ККМ
  }

  //------------------------------------------------- RECOUNT ROWS

  // пересчёт суммы оплаты за данный товар
  setRowSumPrice(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('product_sumprice').setValue((control.controls[row_index].get('product_count').value*control.controls[row_index].get('product_price').value).toFixed(2));
  }

  //------------------------------------------------- TOTALS
  // getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
  //   return  (this.formBaseInformation.value.customersOrdersProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  // }
  getTotalSumPrice() {//бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return  (this.formBaseInformation.value.customersOrdersProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }
  getTotalNds() {//возвращает общую НДС
    this.tableNdsRecount();
    return (this.totalNds);
  }
  // подсчёт TOTALS и отправка суммы в ККМ
  finishRecount(){
    this.recountTotals();                                      // подсчёт TOTALS
    this.sendSumPriceToKKM();                                  // отправим сумму в ККМ
  }
  recountTotals(){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      // this.totalProductCount= this.getTotalProductCount();
      this.totalProductSumm=  this.getTotalSumPrice();
  }}
//------------------------------------------------------------------- Методы для работы с признаком "Неделимость" -----------------------------------------------------------------------------
  // true - ошибка (если введено нецелое кол-во товара, при том что оно должно быть целым)
  checkIndivisibleErrorOfSearchForm(){ 
    this.indivisibleErrorOfSearchForm=
      (+this.formSearch.get('product_id').value>0 && //товар выбран
      this.formSearch.get('indivisible').value) && // кол-во товара, в т.ч. и в резерве, должно быть целым, ...
      this.formSearch.get('product_count').value!='' &&       
      !Number.isInteger(parseFloat(this.formSearch.get('product_count').value))// но при этом кол-во товара не целое
  }

  checkIndivisibleErrorOfProductTable(){
    let result=false;// ошибки нет
    this.formBaseInformation.value.customersOrdersProductTable.map(t =>{
      if(t['indivisible'] && t['product_count']!='' && !Number.isInteger(parseFloat(t['product_count']))){
        result=true;
      }
      // console.log('indivisible - '+t['indivisible']+', reserved_current !="" - '+(t['reserved_current']!='')+ ', !is_integer - '+(!Number.isInteger(parseFloat(t['reserved_current']))))
      // console.log(parseFloat(t['reserved_current'])+' - Это число целое? - '+Number.isInteger(parseFloat(t['reserved_current'])))

      // На целочисленность резервов проверяем только в случае, если данный компонент вызван из Заказа покупателя, т.к. поле Резерв актуально только для данного документа
      if(this.parentDocName=='CustomersOrders' && t['indivisible'] && t['reserved_current']!='' && !Number.isInteger(parseFloat(t['reserved_current']))){
        result=true;
      }
    })
    this.indivisibleErrorOfProductTable=result;
  }

//--------------------------------------------------------------------------- Утилиты ---------------------------------------------------------------------------------------------------------
  //заменяет запятую на точку при вводе цены или количества в заданной ячейке
  commaToDotInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    control.controls[row_index].get(fieldName).setValue(control.controls[row_index].get(fieldName).value.replace(",", "."));
  }
  //для проверки в таблице с вызовом из html
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}

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
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  
}
