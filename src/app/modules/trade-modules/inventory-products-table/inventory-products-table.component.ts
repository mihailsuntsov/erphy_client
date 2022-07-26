import { Component, OnInit, Input, Output} from '@angular/core';
import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
// import { ValidationService } from './validation.service';
import { HttpClient } from '@angular/common/http';
import { ProductsDocComponent } from 'src/app/ui/pages/documents/products-doc/products-doc.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { ViewChild } from '@angular/core';
import { PricingDialogComponent } from 'src/app/ui/dialogs/pricing-dialog/pricing-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { translate } from '@ngneat/transloco'; //+++

interface InventoryProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма inventoryProductTable, входящая в formBaseInformation)
  id: number;                     // id строки с товаром товара в таблице inventory_product
  row_id: number;                 // id строки 
  product_id: number;             // id товара 
  inventory_id:number;            // id документа Инвентаризация
  name: string;                   // наименование товара
  estimated_balance: number;      // кол-во товаров на складе в БД системы Докио
  actual_balance: number;         // актуальное кол-во товаров на складе
  edizm: string;                  // наименование единицы измерения
  product_price: number;          // цена товара
  department_id: number;          // склад инвентаризации
  difference: number;             // разница
  discrepancy: number;            // расхождение (излишек/недостача)
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
}
interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  filename: string;               // картинка товара
  estimated_balance: number;      // кол-во товара по БД (на момент формирования документа Инвентаризаиця)
  edizm: string;                  // наименование единицы измерения товара
  priceOfTypePrice: number;       // цена по запрошенному id типа цены
  avgCostPrice: number;           // средняя себестоимость
  lastPurchasePrice: number;      // последняя закупочная цена
  avgPurchasePrice : number;      // средняя закупочная цена
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
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
interface IdNameDescription{
  id: number;
  name: string;
  description: string;
}
@Component({
  selector: 'app-inventory-products-table',
  templateUrl: './inventory-products-table.component.html',
  styleUrls: ['./inventory-products-table.component.css'],
  providers: [ProductCategoriesSelectComponent,CommonUtilitesService]
})
export class InventoryProductsTableComponent implements OnInit {
  formBaseInformation:any;//форма-обёртка для массива форм inventoryProductTable (нужна для вывода таблицы)
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в formBaseInformation в качестве элемента массива
  settingsForm: any; // форма с настройками (нужно для сохранения некоторых настроек при расценке)
  displayedColumns:string[] = [];//отображаемые колонки таблицы товаров
  gettingTableData: boolean;//идет загрузка товарных позиций
  totalProductCount:number=0;//всего кол-во товаров
  totalDifference:number=0;//всего разница
  totalDiscrepancy:number=0;//всего избыток/недостача
  indivisibleErrorOfSearchForm:boolean = false; // дробное кол-во товара при неделимом товаре в форме поиска
  indivisibleErrorOfProductTable:boolean = false;// дробное кол-во товара при неделимом товаре в таблице товаров

  //для Autocomplete по поиску товаров
  searchProductCtrl = new FormControl();//поле для поиска товаров
  isProductListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredProducts: ProductSearchResponse[] = [];
  productImageName:string = null;
  mainImageAddress:string = 'assets_/images/no_foto.jpg';
  thumbImageAddress:string = 'assets_/images/no_foto.jpg';
  imageToShow:any; // переменная в которую будет подгружаться картинка товара (если он jpg или png)

  //форма поиска товара
  shortInfoAboutProduct: ShortInfoAboutProduct = null; //получение краткого инфо по товару
  shortInfoAboutProductArray: any[] = []; //получение краткого инфо по товару
  selected_type_price_id: number; //тип цены, выбранный в форме поиска. Нужен для восстановления выбранного типа цены при сбросе формы поиска товара
  selected_price: number = 0; //цена, выбранная через поле Тип цены. Нужна для сравнения с полем Цена для выявления факта изменения его значения, и оставления значения столбце Тип цены пустым
  selected_pricingType: string; // тип расценки, выбранный в форме поиска.  Нужен для восстановления при сбросе формы поиска товара
  formSearchReadOnly=false;
  showTable=true;
  placeholderActualBalance:string='0';// фактическое кол-во товара по умолчанию, вычисляемое по настройкам после нахождения товара в форме поиска (нужно для плейсхолдера поля "Факт. остаток, чтобы было видно, что будет по умолчанию, если в него ничего не вводить")
  
  //групповое добавление товаров
  reportOn: string; // пакетно добавляем товары по категориям или по товарам/услугам (categories, products)
  reportOnIds:number[];     // id категорий или товаров/услуг
  estimatedBalance:number=0;// расчетное кол-во товара

  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  netCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
 priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation

  //чекбоксы
  selection = new SelectionModel<InventoryProductTable>(true, []);// SelectionModel - специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  trackByIndex = (i) => i;

  @ViewChild("estimated_balance", {static: false}) estimated_balance;
  // @ViewChild(MatTable) _table: MatTable<any>;
  // @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild("productSearchField", {static: false}) productSearchField;

  @Input() parentDocId:number;   //id родительского документа 
  @Input() parentDocName:string; // Идентификатор документа, в который вызывается данный компонент. Например, Inventory и т.д.
  @Input() company_id:number;
  @Input() department_id:number;
  @Input() pricingType:string;  // тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
  @Input() priceTypeId:number;  // тип цены (дейстует при pricingType = "priceType")
  @Input() plusMinus:string;
  @Input() hideTenths:boolean;  
  @Input() changePrice:number;
  @Input() changePriceType:string;
  @Input() receivedPriceTypesList: IdNameDescription[];//массив для получения списка типов цен
  @Input() readonly:boolean;
  @Input() defaultActualBalance:string;
  @Input() otherActualBalance:number;
  @Input() autoAdd:boolean;
  @Input() accountingCurrency:string;// short name of Accounting currency of user's company (e.g. $ or EUR)

  @Output() changeProductsTableLength = new EventEmitter<any>();   //событие изменения таблицы товаров (а именно - количества товаров в ней)

  constructor( private _fb: FormBuilder,
    public MessageDialog: MatDialog,
    public ProductReservesDialogComponent: MatDialog,
    public ConfirmDialog: MatDialog,
    private _snackBar: MatSnackBar,
    public ShowImageDialog: MatDialog,
    public PricingDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    private commonUtilites: CommonUtilitesService,
    private http: HttpClient,) { }

  ngOnInit(): void {

    this.formBaseInformation = new FormGroup({
      inventoryProductTable: new FormArray([]),
    });
    // форма поиска и добавления товара
    this.formSearch = new FormGroup({
      row_id: new FormControl                   ('',[]),
      product_id: new FormControl               ('',[Validators.required]),                                           // id товара
      // inventory_id: new FormControl             ('',[]),
      estimated_balance: new FormControl        ('',[]),                                                              // расчётный остаток -- кол-во товара по БД на момент формирования документа Инвентаризаиця
      actual_balance: new FormControl           ('',[Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),      // фактический остаток
      priceOfTypePrice: new FormControl         ('',[]),                                                              // цена по запрошенному id типа цены
      edizm: new FormControl                    ('',[]),                                                              // наименование единицы измерения товара
      avgCostPrice: new FormControl             ('',[]),                                                              // средняя себестоимость
      lastPurchasePrice: new FormControl        ('',[]),                                                              // последняя закупочная цена
      avgPurchasePrice : new FormControl        ('',[]),                                                              // средняя закупочная цена
      product_price : new FormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]), // цена товара (которая уйдет в таблицу выбранных товаров). Т.е. мы как можем вписать цену вручную, так и выбрать из предложенных (см. выше)
      indivisible: new FormControl              ('',[]),                                                              // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
    });

      // форма для сохранения настроек при расценке
      this.settingsForm = new FormGroup({
      // убрать десятые (копейки)
      hideTenths: new FormControl               (true,[]),
      // сохранить настройки
      saveSettings: new FormControl             (true,[]),
      // предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
      // тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
      pricingType: new FormControl              ('avgCostPrice',[]),  // по умолчанию ставим "Средняя закупочная цена"
      // тип цены
      priceTypeId: new FormControl              (null,[]),
      // наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new FormControl              (10,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      // наценка (plus) или скидка (minus)
      plusMinus: new FormControl                ('plus',[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new FormControl          ('procents',[]),
    });
    this.doOnInit();
  }

  ngAfterViewInit() {
    setTimeout(() => { this.productSearchField.nativeElement.focus();}, 2000);
  }

  // trackByIndex(i: any) { return i; }

  doOnInit(){
    this.getProductsTable();
    // this.getSpravSysEdizm(); //загрузка единиц измерения.
    this.showColumns();
    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
  }
  showColumns(){
    this.displayedColumns=[];
    // if(!this.readonly)
      // this.displayedColumns.push('select');
    // this.displayedColumns.push('index','row_id');
    this.displayedColumns.push('name','estimated_balance','actual_balance','product_price','difference','discrepancy');
    if(!this.readonly)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){
    const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
    return control;
  }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControlTablefield().clear();
        this.row_id=0;
        this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
        this.productTableRecount();
      }});  
  }
  
  // --------------------------------------- *** ЧЕКБОКСЫ *** -------------------------------------
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
    this.formBaseInformation.controls.inventoryProductTable.value.forEach(row => {
          if(this.showCheckbox(row)){this.selection.select(row);}//если чекбокс отображаем, значит можно удалять этот документ
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
    for (var i = 0; i < this.formBaseInformation.controls.inventoryProductTable.value.length; i++) {
      if(this.selection.isSelected(this.formBaseInformation.controls.inventoryProductTable.value[i])){
        this.checkedList.push(this.formBaseInformation.controls.inventoryProductTable.value[i].row_id);
      }
      
    }
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.formBaseInformation.controls.inventoryProductTable.value.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:InventoryProductTable):boolean{
    return true;
  }
  // --------------------------------------- *** КОНЕЦ ЧЕКБОКСОВ  *** -------------------------------------
  //-------------------------------- **** поиск по подстроке для товара  ***** ----------------------------
  onProductSearchValueChanges(){
    this.searchProductCtrl.valueChanges
    .pipe(
      debounceTime(100),
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
      }}});
  }
  //--------------------------------- **** конец поиск по подстроке для товара  ***** ---------------------
  getProductsList(){ //заполнение Autocomplete для поля Товар
    try 
    {
      if(this.canAutocompleteQuery && this.searchProductCtrl.value.length>1)
      {
        if(this.department_id){
        this.isProductListLoading  = true;
        return this.http.get(
          '/api/auth/getInventoryProductsList?searchString='+this.searchProductCtrl.value+'&companyId='+this.company_id+'&departmentId='+this.department_id+'&priceTypeId='+(+this.priceTypeId)
          );
        } else {
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:'Сначала необходимо выбрать отделение'}})
          this.isProductListLoading  = false;
          return [];
        }
      }else return [];
    } catch (e) {
      return [];
    }
  }

  onAutoselectProduct(){
    this.canAutocompleteQuery=false;
    this.formSearch.get('product_id').setValue(+this.filteredProducts[0].product_id);               // id товара
    this.searchProductCtrl.setValue(this.filteredProducts[0].name);                                 // наименование товара
    this.formSearch.get('edizm').setValue(this.filteredProducts[0].edizm);                          // наименование единицы измерения товара
    this.productImageName = this.filteredProducts[0].filename;                                      // картинка товара
    this.formSearch.get('estimated_balance').setValue(this.filteredProducts[0].estimated_balance);  // кол-во товара по БД (на момент формирования документа Инвентаризаиця)
    this.formSearch.get('priceOfTypePrice').setValue(this.filteredProducts[0].priceOfTypePrice);    // цена по запрошенному id типа цены
    this.formSearch.get('avgCostPrice').setValue(this.filteredProducts[0].avgCostPrice);            // средняя себестоимость
    this.formSearch.get('lastPurchasePrice').setValue(this.filteredProducts[0].lastPurchasePrice);  // последняя закупочная цена
    this.formSearch.get('avgPurchasePrice').setValue(this.filteredProducts[0].avgPurchasePrice);    // средняя закупочная цена
    this.formSearch.get('indivisible').setValue(this.filteredProducts[0].indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    this.afterSelectProduct();
    this.filteredProducts=[];
  }

  onSelectProduct(product:ProductSearchResponse){
    
    this.formSearch.get('product_id').setValue(+product.product_id);               // id товара
    this.searchProductCtrl.setValue(product.name);                                 // наименование товара
    this.formSearch.get('edizm').setValue(product.edizm);                          // наименование единицы измерения товара
    this.productImageName = product.filename;                                      // картинка товара
    this.formSearch.get('estimated_balance').setValue(product.estimated_balance);  // кол-во товара по БД (на момент формирования документа Инвентаризаиця)
    this.formSearch.get('priceOfTypePrice').setValue(product.priceOfTypePrice);    // цена по запрошенному id типа цены
    this.formSearch.get('avgCostPrice').setValue(product.avgCostPrice);            // средняя себестоимость
    this.formSearch.get('lastPurchasePrice').setValue(product.lastPurchasePrice);  // последняя закупочная цена
    this.formSearch.get('avgPurchasePrice').setValue(product.avgPurchasePrice);    // средняя закупочная цена
    this.formSearch.get('indivisible').setValue(product.indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    this.canAutocompleteQuery=false;
    this.afterSelectProduct();
  }

  afterSelectProduct(){
    this.setPrice();
    if(this.autoAdd){
      setTimeout(() => {this.addProductRow();}, 100);
    }else {
      this.formSearchReadOnly=true;
      this.placeholderActualBalance=String(this.getDefaultActualBalance('form'));
      this.loadMainImage();
    }
    
    setTimeout(() => { this.estimated_balance.nativeElement.focus(); }, 100);
  }

  setPrice(){
    switch (this.pricingType){
      case 'priceType':{//по типу цены
        this.formSearch.get('product_price').setValue(this.commonUtilites.priceFilter(+this.formSearch.get('priceOfTypePrice').value,this.changePrice,this.changePriceType,this.plusMinus,this.hideTenths));
        break;
      }
      case 'avgCostPrice':{//средн. себестоимость
        this.formSearch.get('product_price').setValue(this.commonUtilites.priceFilter(+this.formSearch.get('avgCostPrice').value,this.changePrice,this.changePriceType,this.plusMinus,this.hideTenths)); 
        break;
      }
      case 'lastPurchasePrice':{//Последняя закупочная цена
        this.formSearch.get('product_price').setValue(this.commonUtilites.priceFilter(+this.formSearch.get('lastPurchasePrice').value,this.changePrice,this.changePriceType,this.plusMinus,this.hideTenths)); 
        break;
      }
      case 'avgPurchasePrice':{//Средняя закупочная цена
        this.formSearch.get('product_price').setValue(this.commonUtilites.priceFilter(+this.formSearch.get('avgPurchasePrice').value,this.changePrice,this.changePriceType,this.plusMinus,this.hideTenths));
        break; 
      }
      // case 'manual':{
        
      // }
    }
  }

  // //пересчёт цены в зависимости от настроек (наценка, плюс-минус, проценты/рубли)
  // priceFilter(prePrice:number):string{// prePrice - цена до перерасчета
  //   //величина изменения цены (не важно проценты или валюта). Например 50. А чего 50 (проценты или рубли) - это уже другой вопрос
  //   let priceChangeValue:number = +this.changePrice;
  //   // фактическая величина изменения цены 
  //   let priceChangeDelta:number;

  //   switch (this.changePriceType) {
  //     case 'procents': {//если выбраны проценты 
  //       priceChangeDelta=prePrice*priceChangeValue/100;
  //       if(this.plusMinus=='minus') priceChangeDelta = -priceChangeDelta;
  //       break;}
  //     case 'currency': {//если выбрана валюта 
  //       if(this.plusMinus=='minus') 
  //         priceChangeDelta = -priceChangeValue;
  //       else priceChangeDelta = priceChangeValue;
  //       break;}
  //   }

  //   let resultPrice=+prePrice+priceChangeDelta;
  //   let resultPriceText='';
  //   if(this.hideTenths){//если опция "Убрать копейки"
  //     //отбросим копейки:
  //     resultPrice=+this.numToPrice(resultPrice,0);
  //     //форматируем в вид цены
  //     resultPriceText=this.numToPrice(resultPrice,2);
  //   } else {
  //     //если копейки не обрасываем - прото форматируем в вид цены 
  //     resultPriceText=this.numToPrice(resultPrice,2);
  //   }
  //   return resultPriceText;
  // }

  //открывает диалог расценки
  openDialogPricing() { 
    const dialogPricing = this.PricingDialogComponent.open(PricingDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '600px',
      width: '400px', 
      minHeight: '600px',
      data:
      { //отправляем в диалог:
        companyId:        this.company_id, //id предприятия
        documentId:       this.parentDocId, //id документа
        productId:        this.formSearch.get('product_id').value, // id товара 
        departmentId:     this.department_id, //id отделения
        priceTypeId:      this.priceTypeId, //id типа цены
        plusMinus:        this.plusMinus, //наценка или скидка ("+" или "-")
        pricingType:      this.pricingType, // тип расценки (По типу цены, по Себестоимости или вручную)
        changePrice:      this.changePrice, //наценка или скидка в цифре (например, 50)
        changePriceType:  this.changePriceType,// выражение наценки/скидки (валюта или проценты)
        hideTenths:       this.hideTenths, //убирать десятые и сотые доли цены (копейки) 
        saveSettings:     false, //по-умолчанию сохранять настройки
        priceTypesList:   this.receivedPriceTypesList,
      },
    });
    dialogPricing.afterClosed().subscribe(result => {
      if(result){
        this.applySettings(result);
        if(result.get('saveSettings').value){
          //Eсли в диалоге Расценки стояла галка Сохранить настройки: 
          // - вставляем настройки в форму настроек и сохраняем,
          this.settingsForm.get('pricingType').setValue(result.get('pricingType').value);
          this.settingsForm.get('priceTypeId').setValue(result.get('priceTypeId').value);
          this.settingsForm.get('plusMinus').setValue(result.get('plusMinus').value);
          this.settingsForm.get('changePrice').setValue(result.get('changePrice').value);
          this.settingsForm.get('changePriceType').setValue(result.get('changePriceType').value);
          this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
          this.settingsForm.get('companyId').setValue(this.company_id);

          // - сохраняем текущие настройки для следующих расценок товаров
          this.pricingType=result.get('pricingType').value;
          this.priceTypeId=result.get('priceTypeId').value;
          this.plusMinus=result.get('plusMinus').value;
          this.changePrice=result.get('changePrice').value;
          this.changePriceType=result.get('changePriceType').value;

          this.updateSettings();
        }
      }
    });
  }
  applySettings(set:any){
    if(set.get('resultPrice')){ // если настройки поступили из формы расценки выбранного товара
      this.formSearch.get('product_price').setValue(set.get('resultPrice').value);
    }
  }

  updateSettings(){
    return this.http.post('/api/auth/saveSettingsInventory', this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
                          
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
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
      },});} 

  showImage(name:string){
    if(this.productImageName!=null){
      const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
        data:
        { 
          link: name,
        },
      });}}

  loadMainImage(){
    if(this.productImageName!=null){
      this.getImageService('/api/auth/getFileImageThumb/' + this.productImageName).subscribe(blob => {
        this.createImageFromBlob(blob);
      });
    } 
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
  getImageService(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  getProductsTable(){
    let productsTable: InventoryProductTable[]=[];
    //сбрасываем, иначе при сохранении будут прибавляться дубли и прочие глюки
    const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
    this.gettingTableData=true;
    control.clear();
    this.row_id=0;
    this.http.get('/api/auth/get'+this.parentDocName+'ProductTable?id='+this.parentDocId)
        .subscribe(
            data => { 
                this.gettingTableData=false;
                productsTable=data as any;
                if(productsTable && productsTable.length>0){
                  productsTable.forEach(row=>{
                    control.push(this.formingProductRowFromApiResponse(row));
                  });
                  this.productTableRecount();//чтобы подсчитались итоги
                  this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
                }
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
  }

  formingProductRowFromApiResponse(row: InventoryProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new FormControl (row.product_id,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      estimated_balance:  new FormControl (row.estimated_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      actual_balance:  new FormControl (row.actual_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price:  new FormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),
      // ValidationService.priceMoreThanZero  -- пока исключил ошибку "Цена=0", чтобы позволить сохранять с нулевой ценой, а также делать с ней связанные документы.
    ]),
      difference: new FormControl ((row.actual_balance-row.estimated_balance).toFixed(3),[]),
      discrepancy: new FormControl (((row.actual_balance-row.estimated_balance)*row.product_price).toFixed(2),[]),
      indivisible:  new FormControl (row.indivisible,[]),
    });
  }
  addProductRow(){ 
  this.productSearchField.nativeElement.focus();//убираем курсор из текущего поля, чтобы оно не было touched и красным после сброса формы
  const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.inventoryProductTable.map(i => 
    {// список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
      if(+i['product_id']==this.formSearch.get('product_id').value)
      {//такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        
        //суммируем кол-во уже имеющегося в таблице товара и того, что в форме поиска
        control.controls[i['row_id']].get('actual_balance').setValue(
          (this.formSearch.get('actual_balance').value==''?this.getDefaultActualBalance('form'):+this.formSearch.get('actual_balance').value)+(+i['actual_balance'])
        );
// alert(i['row_id'])
        this.onChangeActualBalance(i['row_id']);

        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара  для выбранного складад в списке ещё нет. Добавляем в таблицу (в форму formBaseInformation)
      control.push(this.formingProductRowFromSearchForm());
    } 
    this.searchProductCtrl.setValue('');
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    this.recountTotals();
  }
  
  //формирование строки таблицы с товарами для заказа покупателя из формы поиска товара
  formingProductRowFromSearchForm() {
    let actualBalance=this.formSearch.get('actual_balance').value==''?this.getDefaultActualBalance('form'):+this.formSearch.get('actual_balance').value;
    return this._fb.group({
      id: new FormControl (null,[]),
      row_id: [this.getRowId()],
      product_id:  new FormControl (+this.formSearch.get('product_id').value,[]),
      inventory_id:  new FormControl (+this.parentDocId,[]),
      name:  new FormControl (this.searchProductCtrl.value,[]),
      estimated_balance:  new FormControl (+this.formSearch.get('estimated_balance').value,[]),
      actual_balance:  new FormControl (actualBalance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      edizm:  new FormControl (this.formSearch.get('edizm').value,[]),
      product_price: new FormControl (this.formSearch.get('product_price').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),/*ValidationService.priceMoreThanZero*/]),
      difference:  new FormControl ((actualBalance-(+this.formSearch.get('estimated_balance').value)).toFixed(3).replace('.000', '').replace('.00', ''),[]),
      discrepancy:  new FormControl (((actualBalance-(+this.formSearch.get('estimated_balance').value))*+this.formSearch.get('product_price').value).toFixed(3).replace('.000', '').replace('.00', ''),[]),
      indivisible:  new FormControl (this.formSearch.get('indivisible').value,[]),
    });
  }
  
  //вычисляем фактический баланс по умолчанию (назначается в настройках). "estimated" - как расчётный, "other" - другой (выбирается в otherActualBalance)
  getDefaultActualBalance(querySource:string):number{
    let actual_balance:number;
    switch(this.defaultActualBalance){
      case 'estimated':{
        if(querySource=='form')
          actual_balance=+this.formSearch.get('estimated_balance').value;
        if(querySource=='list')
          actual_balance=this.estimatedBalance;
        break;
      }
      case 'other':{
        actual_balance=+this.otherActualBalance;
        break;
      }
      default:{//если в настройках ничего нет
        actual_balance=0;
      }
    }
    return actual_balance;
  }

  deleteProductRow(row: InventoryProductTable,index:number) {
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
        const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
        // if(+row.id==0){// ещё не сохраненная позиция, можно не удалять с сервера (т.к. ее там нет), а только удалить локально
          control.removeAt(index);
          this.refreshTableColumns();
          this.afterDeleteRow();
      }
    }); 
  }
  afterDeleteRow(){
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetRowIds(); //переназначаем идентификаторы строк row_id, чтобы они шли по порядку от 0
    this.productTableRecount();//пересчитаем итоги.
  }

  refreshTableColumns(){
    this.displayedColumns.splice(2,1,'empty_f');
    this.displayedColumns.splice(4,1,'empty_p');
    setTimeout(() => { 
      this.displayedColumns.splice(2, 1, 'actual_balance');
      this.displayedColumns.splice(4, 1, 'product_price');
    }, 1);
  }

  resetRowIds(){
    this.row_id=0;
    const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
    this.formBaseInformation.value.inventoryProductTable.map(i => 
      {
        control.controls[this.row_id].get('row_id').setValue(this.row_id);
        this.row_id++;
      });
  }

  getRowId():number{
    let current_row_id:number=this.row_id;
    this.row_id++;
    return current_row_id;
  }

  onChangeProductPrice(row_index:number){
    this.commaToDotInTableField(row_index, 'product_price');
    this.setRowDifference(row_index);
    this.setRowDiscrepancy(row_index);
    this.productTableRecount();
  }
  onChangeActualBalance(row_index:number){
    this.commaToDotInTableField(row_index, 'actual_balance');
    this.setRowDifference(row_index);
    this.setRowDiscrepancy(row_index);
    this.productTableRecount();
    this.checkIndivisibleErrorOfProductTable();
  }
  productTableRecount(){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      this.recountTotals();
    }
  }
  recountTotals(){
    this.totalProductCount=this.getTotalProductCount();
    this.totalDifference=this.getTotalDifference();
    this.totalDiscrepancy=this.getTotalDiscrepancy();
  }
  //возвращает таблицу товаров в родительский компонент для сохранения
  getProductTable(){
    return this.formBaseInformation.value.inventoryProductTable;
  }
  setRowDifference(row_index:number){
    const control = this.getControlTablefield();
    console.log("1 - "+(control.controls[row_index].get('actual_balance').value-control.controls[row_index].get('estimated_balance').value));
    console.log("2 - "+(control.controls[row_index].get('actual_balance').value-control.controls[row_index].get('estimated_balance').value).toFixed(2));
    control.controls[row_index].get('difference').setValue((control.controls[row_index].get('actual_balance').value-control.controls[row_index].get('estimated_balance').value).toFixed(2));
  }
  setRowDiscrepancy(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('discrepancy').setValue(((control.controls[row_index].get('actual_balance').value-control.controls[row_index].get('estimated_balance').value)*control.controls[row_index].get('product_price').value).toFixed(3).replace(".000", "").replace(".00", ""));
  }
  getTotalProductCount() {//бежим по столбцу actual_balance и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return  (this.formBaseInformation.value.inventoryProductTable.map(t => +t.actual_balance).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalDifference() { //бежим по столбцу difference и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return (this.formBaseInformation.value.inventoryProductTable.map(t => +t.difference).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalDiscrepancy() {//бежим по столбцу discrepancy и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return (this.formBaseInformation.value.inventoryProductTable.map(t => +t.discrepancy).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }
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
    //если не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  }
  
  checkEmptyProductField(){
    if(this.searchProductCtrl.value.length==0){
      this.resetFormSearch();
    }
  };    

  resetFormSearch(){
      this.formSearchReadOnly=false;
      this.searchProductCtrl.setValue('');
      this.thumbImageAddress="assets_/images/no_foto.jpg";      
      this.mainImageAddress="";
      this.productImageName=null;
      this.imageToShow=null;
      this.form.resetForm();//реализовано через ViewChild: @ViewChild("form", {static: false}) form; + В <form..> прописать #form="ngForm"
      this.formSearch.get('estimated_balance'). setValue('');
      this.formSearch.get('actual_balance').    setValue('');
      this.formSearch.get('product_id').        setValue(null);
      this.formSearch.get('product_price').     setValue('');
      this.selected_price=0;
      this.netCostPrice=0;
      this.productPrice=0;
      this.placeholderActualBalance='0';

      setTimeout(() => { this.productSearchField.nativeElement.focus(); }, 100);
  }

  
  //заменяет запятую на точку при вводе цены или количества в заданной ячейке
  commaToDotInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    control.controls[row_index].get(fieldName).setValue(control.controls[row_index].get(fieldName).value.replace(",", "."));
  }

  checkActualBalanceInForm(){
    if(this.formSearch.get('actual_balance').value!=null && this.formSearch.get('actual_balance').value!='')
      this.formSearch.get('actual_balance').setValue((this.formSearch.get('actual_balance').value).replace(",", "."));
    this.checkIndivisibleErrorOfSearchForm();
  }
  checkProductPriceInForm(){
    if(this.formSearch.get('product_price').value!=null && this.formSearch.get('product_price').value!='')
      this.formSearch.get('product_price').setValue((this.formSearch.get('product_price').value).replace(",", "."));
    this.checkIndivisibleErrorOfSearchForm();
  }
  // true - ошибка (если введено нецелое кол-во товара, при том что оно должно быть целым)
  checkIndivisibleErrorOfSearchForm(){ 
    this.indivisibleErrorOfSearchForm=(
      this.formSearch.get('actual_balance').value!='' && 
      +this.formSearch.get('product_id').value>0 && 
      this.formSearch.get('indivisible').value && // кол-во товара должно быть целым, ...
      !Number.isInteger(parseFloat(this.formSearch.get('actual_balance').value)) // но при этом кол-во товара не целое
    )
  }
  checkIndivisibleErrorOfProductTable(){
    let result=false;// ошибки нет
    this.formBaseInformation.value.inventoryProductTable.map(t =>{
      if(t['indivisible'] && t['actual_balance']!='' && !Number.isInteger(parseFloat(t['actual_balance']))){
        result=true;
      }
    })
    this.indivisibleErrorOfProductTable=result;
  }

  //****************************************************************************** МАССОВОЕ ДОБАВЛЕНИЕ ТОВАРОВ ЧЕРЕЗ СПРАВОЧНИК *******************************************************************
  openDialogProductCategoriesSelect(selection:string){
    this.reportOnIds=[];
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    selection, // Что выбираем (Категории - categories, товары и услуги - products)
        companyId:  this.company_id, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          this.reportOnIds.push(i.id);
        });
        if(this.reportOnIds.length>0)
          this.getProductsInfoListByIds(selection);
      }
    });
  }
  getProductsInfoListByIds(selection:string){
    const body =  {
      companyId:this.company_id,         // предприятие, по которому идет запрос данных
      departmentId:this.department_id,   // id отделения
      priceTypeId:+this.priceTypeId,     // тип цены, по которому будут выданы цены
      reportOn:selection,                // по категориям или по товарам/услугам (categories, products)
      reportOnIds:this.reportOnIds       // id категорий или товаров/услуг (того, что выбрано в reportOn)
    };
    this.http.post('/api/auth/getProductsInfoListByIds', body).subscribe(
      (data) => {   
        let filteredProducts=data as ProductSearchResponse[];
        if(filteredProducts.length>0)//несмотря на то, что сами id, по ним может ничего не вернуться, т.к. товары по запрошенным id могут быть не материальны (услуги), либо категории пустые/с нематериальными товарами
          this.addProductsListByIds(filteredProducts)
      },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  addProductsListByIds(filteredProducts:ProductSearchResponse[]){
    filteredProducts.map(i=>{
      this.addProductRowFromProductsList(i);
    });
    filteredProducts=[];
  }
  
  addProductRowFromProductsList(row: ProductSearchResponse){ 
  const control = <FormArray>this.formBaseInformation.get('inventoryProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.inventoryProductTable.map(i => 
    { // список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
        // console.log('product_id - '+i['product_id']);
      if(+i['product_id']==row.product_id){
        //такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        console.log(' estimated_balance -'+ i['estimated_balance']);
        
        //суммируем кол-во уже имеющегося в таблице товара и того, что в форме поиска
        this.estimatedBalance=i['estimated_balance'];// это нужно, чтобы getDefaultActualBalance воспользовалась данным количеством в своем решении
        console.log('getDefaultActualBalance - '+this.getDefaultActualBalance('list'));
        control.controls[i['row_id']].get('actual_balance').setValue(this.getDefaultActualBalance('list')+(+i['actual_balance']));
        this.onChangeActualBalance(i['row_id']); 
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара  для выбранного склада в списке ещё нет. Добавляем в таблицу (в форму formBaseInformation)
      this.estimatedBalance=row['estimated_balance'];// это нужно, чтобы getDefaultActualBalance воспользовалась данным количеством в своем решении
      control.push(this.formingProductRowFromProductsList(row,this.getDefaultActualBalance('list')));
    } 
    this.searchProductCtrl.setValue('');
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    this.recountTotals();
  }

  formingProductRowFromProductsList(row: ProductSearchResponse, actual_balance) {
    return this._fb.group({
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new FormControl (row.product_id,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      estimated_balance:  new FormControl (row.estimated_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      actual_balance:  new FormControl (actual_balance,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price:  new FormControl (this.commonUtilites.priceFilter(this.getPrice(row),this.changePrice,this.changePriceType,this.plusMinus,this.hideTenths),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),/*ValidationService.priceMoreThanZero*/]),
      difference: new FormControl ((actual_balance-row.estimated_balance).toFixed(3).replace('.000', '').replace('.00', ''),[]),
      discrepancy: new FormControl (((actual_balance-row.estimated_balance)*this.getPrice(row)).toFixed(3).replace('.000', '').replace('.00', ''),[]),
      indivisible:  new FormControl (row.indivisible,[]),
    });   
  }

  //в зависимости от политики назначения цены возвращаем одну из цен, содержащихся в передаваемом объекте
  getPrice(row: ProductSearchResponse):number{
    let price:number=0;
    switch (this.pricingType){
      case 'priceType':return row.priceOfTypePrice;           //по типу цены
      case 'avgCostPrice':return row.avgCostPrice;            //Средняя себестоимость
      case 'lastPurchasePrice':return row.lastPurchasePrice;  //Последняя закупочная цена
      case 'avgPurchasePrice':return row.avgPurchasePrice;    //Средняя закупочная цена
      default: return 0;
    }
  }
//************************************************************************************* COMMON UTILITES *****************************************************************************************/
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  //для проверки в таблице с вызовом из html
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
}
