import { Component, OnInit, Input, Output} from '@angular/core';
import { EventEmitter } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray,  UntypedFormBuilder,  Validators, UntypedFormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { HttpClient } from '@angular/common/http';
import { ProductsDocComponent } from 'src/app/ui/pages/documents/products-doc/products-doc.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++

interface AcceptanceProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма acceptanceProductTable, входящая в formBaseInformation)
  id: number;                     // id строки с товаром товара в таблице return_product
  row_id: number;                 // id строки 
  product_id: number;             // id товара 
  product_netcost: number;             // себестоимость  товара
  name: string;                   // наименование товара
  edizm: string;                  // наименование единицы измерения
  product_price: number;          // цена товара
  product_count: number;          // кол-во товара
  department_id: number;          // склад
  total: number;                // остаток на складе
  nds_id: number;                 // id ставки НДС
  product_sumprice: number;       // сумма как product_count * product_price (высчитываем сумму и пихем ее в БД, чтобы потом на бэкэнде в SQL запросах ее не высчитывать)
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
}
interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  // estimated_balance: number;      // остатки
  filename: string;               // картинка товара
  edizm: string;                  // наименование единицы измерения товара
  total: number;                  // остатки 
  nds_id: number;                 // ндс 
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
  priceOfTypePrice: number;       // цена по запрошенному id типа цены
  avgCostPrice: number;           // средняя себестоимость
  lastPurchasePrice: number;      // последняя закупочная цена
  avgPurchasePrice : number;      // средняя закупочная цена
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

@Component({
  selector: 'app-acceptance-products-table',
  templateUrl: './acceptance-products-table.component.html',
  styleUrls: ['./acceptance-products-table.component.css'],
  providers: [ProductCategoriesSelectComponent]
})
export class AcceptanceProductsTableComponent implements OnInit {
  formBaseInformation:any;//форма-обёртка для массива форм acceptanceProductTable (нужна для вывода таблицы)
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в formBaseInformation в качестве элемента массива
  settingsForm: any; // форма с настройками (нужно для сохранения некоторых настроек при расценке)
  displayedColumns:string[] = [];//отображаемые колонки таблицы товаров
  gettingTableData: boolean;//идет загрузка товарных позиций
  totalProductCount:number=0;//всего кол-во товаров
  totalProductSumm:number=0;//всего разница
  indivisibleErrorOfSearchForm:boolean; // дробное кол-во товара при неделимом товаре в форме поиска
  indivisibleErrorOfProductTable:boolean;// дробное кол-во товара при неделимом товаре в таблице товаров
  totalNds:number=0;//всего НДС

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
  shortInfoAboutProduct: ShortInfoAboutProduct = null; //получение краткого инфо по товару
  shortInfoAboutProductArray: any[] = []; //получение краткого инфо по товару
  selected_type_price_id: number; //тип цены, выбранный в форме поиска. Нужен для восстановления выбранного типа цены при сбросе формы поиска товара
  selected_pricingType: string; // тип расценки, выбранный в форме поиска.  Нужен для восстановления при сбросе формы поиска товара
  formSearchReadOnly=false;
  placeholderActualBalance:string='0';// фактическое кол-во товара по умолчанию, вычисляемое по настройкам после нахождения товара в форме поиска (нужно для плейсхолдера поля "Факт. остаток, чтобы было видно, что будет по умолчанию, если в него ничего не вводить")
  
  //групповое добавление товаров
  reportOn: string; // пакетно добавляем товары по категориям или по товарам/услугам (categories, products)
  reportOnIds:number[];     // id категорий или товаров/услуг
  estimatedBalance:number=0;// расчетное кол-во товара

  //чекбоксы
  selection = new SelectionModel<AcceptanceProductTable>(true, []);// SelectionModel - специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  trackByIndex = (i) => i;

  @ViewChild("product_count", {static: false}) product_count;
  // @ViewChild(MatTable) _table: MatTable<any>;
  // @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild("productSearchField", {static: false}) productSearchField;

  @Input() parentDocId:number;   //id родительского документа 
  @Input() parentDocName:string; // Идентификатор документа, в который вызывается данный компонент. Например, Acceptance и т.д.
  @Input() company_id:number;
  @Input() department_id:number;
  @Input() readonly:boolean;
  @Input() autoAdd:boolean;
  @Input() autoPrice:boolean;
  @Input() nds:boolean;
  @Input() nds_included:boolean;
  @Input() overhead:number;      // расходы 
  @Input() overhead_netcost_method:number; // метод распределения расходов по себестоимости: распределять (1) или нет (0)
  @Input() spravTaxesSet: SpravTaxesSet[] = []; //массив имен и id для ндс 
  @Input() accountingCurrency:string;// short name of Accounting currency of user's company (e.g. $ or EUR)
  @Output() changeProductsTableLength = new EventEmitter<any>();   //событие изменения таблицы товаров (а именно - количества товаров в ней)
  @Output() totalSumPriceEvent = new EventEmitter<string>();

  constructor( private _fb: UntypedFormBuilder,
    public MessageDialog: MatDialog,
    public ProductReservesDialogComponent: MatDialog,
    public ConfirmDialog: MatDialog,
    private _snackBar: MatSnackBar,
    public ShowImageDialog: MatDialog,
    public PricingDialogComponent: MatDialog,
    public dialogCreateProduct: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    private http: HttpClient,) { }

  ngOnInit(): void {

    this.formBaseInformation = new UntypedFormGroup({
      acceptanceProductTable: new UntypedFormArray([]),
    });
    // форма поиска и добавления товара
    this.formSearch = new UntypedFormGroup({
      row_id: new UntypedFormControl                   ('',[]),
      product_id: new UntypedFormControl               ('',[Validators.required]),   // id товара
      edizm: new UntypedFormControl                    ('',[]),                      // наименование единицы измерения товара
      product_price : new UntypedFormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),                      // цена товара (которая уйдет в таблицу выбранных товаров). Т.е. мы как можем вписать цену вручную, так и выбрать из предложенных (см. выше)
      product_count : new UntypedFormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),                      // количество товара к возврату
      total : new UntypedFormControl                   ('',[]),                      // остатки на складе
      nds_id: new UntypedFormControl                   ('',[]),                      // НДС
      // nds: new FormControl                      (0,[]),                    // НДС в валютном ввыражении
      product_sumprice : new UntypedFormControl        ('',[]),                       // суммарная стоимость товара = цена * кол-во
      indivisible: new UntypedFormControl              ('',[]),                      // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
    });

    this.doOnInit();
  }

  ngAfterViewInit() {
    this.formSearchReadOnly=false;
    this.searchProductCtrl.setValue('');
    setTimeout(() => { this.productSearchField.nativeElement.focus();}, 1000);
  }

  doOnInit(){
    this.getProductsTable();
    this.showColumns();
    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
  }
  getTaxNameById(id:number){let name='';this.spravTaxesSet.map(i=>{if(+i.id==id)name=i.name}); return name}
  showColumns(){
    
    this.displayedColumns=[];
    // if(!this.readonly)
      // this.displayedColumns.push('select');
    // this.displayedColumns.push('index','row_id','product_id');
    this.displayedColumns.push('name','product_count','total','product_price','product_sumprice','product_netcost');
    if(this.nds)
      this.displayedColumns.push('nds');
    if(!this.readonly)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){
    const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
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
        this.finishRecount();
      }});  
  }
  
  // --------------------------------------- *** ЧЕКБОКСЫ *** -------------------------------------
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
    this.formBaseInformation.controls.acceptanceProductTable.value.forEach(row => {
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
    for (var i = 0; i < this.formBaseInformation.controls.acceptanceProductTable.value.length; i++) {
      if(this.selection.isSelected(this.formBaseInformation.controls.acceptanceProductTable.value[i])){
        this.checkedList.push(this.formBaseInformation.controls.acceptanceProductTable.value[i].row_id);
      }
      
    }
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.formBaseInformation.controls.acceptanceProductTable.value.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:AcceptanceProductTable):boolean{
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
        this.isProductListLoading  = true;
        return this.http.get(
          '/api/auth/getProductsList?searchString='+this.searchProductCtrl.value+'&companyId='+this.company_id+'&departmentId='+this.department_id+'&document_id=0&priceTypeId=0'
          );
      }else return [];
    } catch (e) {
      return [];
    }
  }

  onAutoselectProduct(){
    this.canAutocompleteQuery=false;
    this.formSearch.get('product_id').setValue(+this.filteredProducts[0].product_id);               // id товара
    this.searchProductCtrl.setValue(this.filteredProducts[0].name);                                 // наименование товара
    this.formSearch.get('product_count').setValue(0);                                               // кол-во
    this.formSearch.get('edizm').setValue(this.filteredProducts[0].edizm);                          // наименование единицы измерения товара
    this.productImageName = this.filteredProducts[0].filename;                                      // картинка товара
    this.formSearch.get('total').setValue(this.filteredProducts[0].total);                          // остатки - кол-во товара по БД
    this.formSearch.get('nds_id').setValue(this.filteredProducts[0].nds_id);                        // id НДС 
    this.formSearch.get('indivisible').setValue(this.filteredProducts[0].indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    if(this.autoPrice)                                                                              // если выбрана опция "Автоцена"
      this.setPrice(this.filteredProducts[0].lastPurchasePrice);                                    // установка цены из последней закупочной цены
    this.afterSelectProduct();
    this.filteredProducts=[];
  }

  onSelectProduct(product:ProductSearchResponse){
    this.formSearch.get('product_id').setValue(+product.product_id);               // id товара
    this.searchProductCtrl.setValue(product.name);                                 // наименование товара
    this.formSearch.get('product_count').setValue(0);                              // кол-во
    this.formSearch.get('edizm').setValue(product.edizm);                          // наименование единицы измерения товара
    this.productImageName = product.filename;                                      // картинка товара
    this.formSearch.get('total').setValue(product.total);                          // остатки - кол-во товара по БД
    this.formSearch.get('nds_id').setValue(product.nds_id);                        // id НДС 
    this.formSearch.get('indivisible').setValue(product.indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    if(this.autoPrice)                                                             // если выбрана опция "Автоцена"
      this.setPrice(product.lastPurchasePrice);                                    // установка цены из последней закупочной цены
    this.canAutocompleteQuery=false;
    this.afterSelectProduct();
  }

  afterSelectProduct(){
    if(this.autoAdd){
      setTimeout(() => {this.addProductRow();}, 100);
    }else {
      this.formSearchReadOnly=true;
      this.loadMainImage();
      this.getShortInfoAboutProduct();
      this.formSearch.get('product_count').setValue(1);  
      this.calcSumPriceOfProduct();
      this.changeProductsTableLength.emit();//для того, чтобы заблокировать поля Предприятие, Отделение
      setTimeout(() => { this.product_count.nativeElement.focus(); }, 200);   
    }
    
  }

  setPrice(price:number){
        this.formSearch.get('product_price').setValue(price);
        this.calcSumPriceOfProduct();
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
    let productsTable: AcceptanceProductTable[]=[];
    //сбрасываем, иначе при сохранении будут прибавляться дубли и прочие глюки
    const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
    this.gettingTableData=true;
    control.clear();
    this.row_id=0;
    this.http.get('/api/auth/getAcceptanceProductTable?id='+this.parentDocId)
        .subscribe(
            data => { 
                this.gettingTableData=false;
                productsTable=data as any;
                if(productsTable && productsTable.length>0){
                  productsTable.forEach(row=>{
                    control.push(this.formingProductRowFromApiResponse(row));
                  });

                  this.onChangeTable();
                  
                  this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
                }
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
  }

  formingProductRowFromApiResponse(row: AcceptanceProductTable) {
    return this._fb.group({
      id: new UntypedFormControl (row.id,[]),
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new UntypedFormControl (row.product_id,[]),
      name: new UntypedFormControl (row.name,[]),
      edizm: new UntypedFormControl (row.edizm,[]),
      total: new UntypedFormControl (+row.total,[]),
      nds_id: new UntypedFormControl (+row.nds_id,[]),
      product_sumprice: new UntypedFormControl ((+row.product_count*(+row.product_price)).toFixed(2),[]),
      product_count:  new UntypedFormControl (row.product_count,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      product_price:  new UntypedFormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),
      // ValidationService.priceMoreThanZero  -- пока исключил ошибку "Цена=0", чтобы позволить сохранять с нулевой ценой, а также делать с ней связанные документы.
      ]),
      product_netcost: new UntypedFormControl (+row.product_netcost,[]),
      indivisible:  new UntypedFormControl (row.indivisible,[]),
    });
  }

  addProductRow(){ 
  this.productSearchField.nativeElement.focus();//убираем курсор из текущего поля, чтобы оно не было touched и красным после сброса формы
  const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.acceptanceProductTable.map(i => 
    {// список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
      if(+i['product_id']==this.formSearch.get('product_id').value)
      {//такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.prd_alr_slctd')}});
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара  для выбранного складад в списке ещё нет. Добавляем в таблицу (в форму formBaseInformation)
      control.push(this.formingProductRowFromSearchForm());
    } 
    this.searchProductCtrl.setValue('');
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    this.onChangeTable();
  }
  
  //формирование строки таблицы с товарами для заказа покупателя из формы поиска товара
  formingProductRowFromSearchForm() {
    return this._fb.group({
      id: new UntypedFormControl (null,[]),
      row_id: [this.getRowId()],
      product_id:  new UntypedFormControl (+this.formSearch.get('product_id').value,[]),
      name:  new UntypedFormControl (this.searchProductCtrl.value,[]),
      edizm:  new UntypedFormControl (this.formSearch.get('edizm').value,[]),
      product_price: new UntypedFormControl (this.formSearch.get('product_price').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),/*ValidationService.priceMoreThanZero*/]),
      product_count:  new UntypedFormControl ((+this.formSearch.get('product_count').value>0?+this.formSearch.get('product_count').value:1),[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      total: new UntypedFormControl (+this.formSearch.get('total').value,[]),
      nds_id: new UntypedFormControl (+this.formSearch.get('nds_id').value,[]),
      product_sumprice: new UntypedFormControl ((+this.formSearch.get('product_count').value*(+this.formSearch.get('product_price').value)).toFixed(2),[]),
      indivisible:  new UntypedFormControl (this.formSearch.get('indivisible').value,[]),
      // nds: new FormControl (+this.formSearch.get('total').value,[]),
    });
  }
  
  deleteProductRow(row: AcceptanceProductTable,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
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
    this.onChangeTable();//пересчитаем таблицу и итоги.
  }

  refreshTableColumns(){
    this.displayedColumns=[]
    setTimeout(() => { 
      this.showColumns();
    }, 1);
  }

  resetRowIds(){
    this.row_id=0;
    const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
    this.formBaseInformation.value.acceptanceProductTable.map(i => 
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

  getTaxMultiplifierBySelectedId(srchId:number):number {
    //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
        let value=0;
        this.spravTaxesSet.forEach(a=>{
          if(+a.id == srchId) {value=a.multiplier}
        }); return value;}   

  getShortInfoAboutProduct(){
    this.http.get('/api/auth/getShortInfoAboutProduct?department_id='+this.department_id+'&product_id='+this.formSearch.get('product_id').value)
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
  getTaxFromPrice(price:number, taxId:number):number {
    // вычисляет налог из цены. Например, для цены 100, уже содержащей в себе налог, и налога 20% вернёт: 100 * 20 / 120 = 16.67
    let value=0;
    this.spravTaxesSet.forEach(a=>{if(+a.id == taxId) {value=a.value}});
    return parseFloat((price*value/(100+value)).toFixed(2));
  }

    //пересчитывает НДС в таблице товаров
  tableRecount(nds_included?:boolean){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      if(nds_included!=undefined)
        this.nds_included=nds_included;
      //перерасчет НДС в форме поиска
      if(+this.formSearch.get('product_id').value) this.calcSumPriceOfProduct();
      //перерасчет НДС в таблице товаров
      if(this.formBaseInformation.controls['acceptanceProductTable'].value.length>0)
      {
        this.totalNds=0;
        let switcherNDS:boolean = this.nds;
        let switcherNDSincluded:boolean = this.nds_included;
        let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
        let KZ:number = 0; //коэффициент затрат, равен делению расходов на итоговую сумму
        this.formBaseInformation.value.acceptanceProductTable.map(i =>
        {
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
        });


        //перерасчет себестоимости в таблице товаров (себестоимость не считается в один с НДС проход, т.к. в себестоимости используется итоговая сумма)
        this.totalProductSumm=  this.getTotalSumPrice();
        if(this.totalProductSumm>0)
          KZ=this.overhead/this.totalProductSumm;
        console.log('KZ='+KZ);
        this.formBaseInformation.value.acceptanceProductTable.map(i => {
            multiplifierNDS = this.getTaxMultiplifierBySelectedId(+i['nds_id']);
            if(+this.overhead_netcost_method>0){//если расходы распределяются по себестоимости
              if(switcherNDS && !switcherNDSincluded){//... и при этом в цену не включена НДС
                i['product_netcost']=+((+i['product_price']*multiplifierNDS*KZ)+(+i['product_price']*multiplifierNDS)).toFixed(2);//..то в себестоимость нужно включить НДС и часть расходов
              } else {
                i['product_netcost']=+((+i['product_price']*KZ)+(+i['product_price'])).toFixed(2);}//если в цену включена НДС - в себестоимость включаем только часть расходов
              }else{ //если расходы НЕ распределяются по себестоимости
              if(switcherNDS && !switcherNDSincluded){//... и при этом в цену не включена НДС
                i['product_netcost']=+(+i['product_price']*multiplifierNDS).toFixed(2);//то в себестоимость нужно включить НДС
              }else  i['product_netcost']=+(+i['product_price']).toFixed(2);//если в цену уже включена НДС или НДС вообще нет - себестоимость будет равна цене
            } 
        });
        this.finishRecount();                                    // подсчёт TOTALS
      }
    }
  }

  calcSumPriceOfProduct(){
    let switcherNDS:boolean = this.nds;
    let switcherNDSincluded:boolean = this.nds_included;
    let selectedNDS:number = this.getTaxMultiplifierBySelectedId(+this.formSearch.get('nds_id').value)
    //Сначала считаем конечную цену как произведение количества на цену за ед. товара
    this.formSearch.get('product_sumprice').setValue(this.numToPrice(
      (+this.formSearch.get('product_count').value)*(+this.formSearch.get('product_price').value)
      ,2));
    //если включён переключатель "НДС", но переключатель "НДС включена" выключен, нужно добавить к цене НДС, выбранное в выпадающем списке
    if(switcherNDS && !switcherNDSincluded) 
      this.formSearch.get('product_sumprice').setValue(      this.numToPrice((+(+this.formSearch.get('product_sumprice').value*selectedNDS).toFixed(2)),2)     )
  }

//*****************************************************************************************************************************************/
//*********************************************** Обсчёт строки таблицы и её итогов *******************************************************/
//*****************************************************************************************************************************************/

//------------------------------------------------- ON CHANGE...
//при изменении поля Количество в таблице товаров
onChangeProductCount(row_index:number){
  this.commaToDotInTableField(row_index, 'product_count');  // замена запятой на точку
  this.setRowSumPrice(row_index);                           // пересчёт суммы оплаты за данный товар
  this.tableRecount();                                      // пересчёт Суммы оплаты за товар с учётом НДС
  this.checkIndivisibleErrorOfProductTable();               // проверка на неделимость товара
}
//при изменении поля Цена в таблице товаров
onChangeProductPrice(row_index:number){
  this.commaToDotInTableField(row_index, 'product_price');  // замена запятой на точку
  this.setRowSumPrice(row_index);                           // пересчёт суммы оплаты за данный товар
  this.tableRecount();                                      // пересчёт Суммы оплаты за товар с учётом НДС
} 
  // при изменении "НДС" в родительском модуле
  onChangeNds(nds_included:boolean){
    setTimeout(() => {
    this.showColumns();
    this.onChangeNdsIncluded(nds_included);}, 1);
  }
  // при изменении "Расходы", "Распределять/Не распределять по себестоимости" в родительском модуле
  onChangeOverhead(){
    setTimeout(() => { this.tableRecount(this.nds_included)}, 1);// пересчёт Суммы оплаты за товар с учётом НДС
  }
  // при действиях над таблицей (добавление/удаление строк (товаров))
  onChangeTable(){
    setTimeout(() => { this.tableRecount(this.nds_included)}, 1);// пересчёт Суммы оплаты за товар с учётом НДС
  }
  // при изменении "НДС включено" в родительском модуле
  onChangeNdsIncluded(nds_included?:boolean){
    setTimeout(() => { this.tableRecount(nds_included)}, 1);// пересчёт Суммы оплаты за товар с учётом НДС
  }  
  // при изменении НДС в таблице товаров
  onChangeProductNds(){
    this.tableRecount(this.nds_included);                    // пересчёт Суммы оплаты за товар с учётом НДС
  }
  //------------------------------------------------- RECOUNT ROWS
  // пересчёт суммы оплаты за данный товар
  setRowSumPrice(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('product_sumprice').setValue((control.controls[row_index].get('product_count').value*control.controls[row_index].get('product_price').value).toFixed(2));
  }
  //------------------------------------------------- TOTALS
  // подсчёт TOTALS
  finishRecount(){
    this.recountTotals();                                      // подсчёт TOTALS
  }
  recountTotals(){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      this.totalProductSumm=  this.getTotalSumPrice();
  }}
  getTotalSumPrice() { //бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return  (this.formBaseInformation.value.acceptanceProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }
  getTotalNds() {//возвращает общую НДС
    this.tableRecount();
    return (this.totalNds);
  }

  //возвращает таблицу товаров в родительский компонент для сохранения
  getProductTable(){
    return this.formBaseInformation.value.acceptanceProductTable;
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
      this.formSearch.get('total').             setValue('');
      this.formSearch.get('product_id').        setValue(null);
      this.formSearch.get('product_price').     setValue('');
      this.formSearch.get('edizm').             setValue('');
      this.placeholderActualBalance='0';
      this.changeProductsTableLength.emit();//для того, чтобы разблокировать поля Предприятие, Отделение
      setTimeout(() => { this.productSearchField.nativeElement.focus(); }, 100);
  }
  checkProductCountInForm(){
    if(this.formSearch.get('product_count').value!=null && this.formSearch.get('product_count').value!='')
      this.formSearch.get('product_count').setValue((this.formSearch.get('product_count').value).replace(",", "."));
    this.checkIndivisibleErrorOfSearchForm();
  }
  checkProductPriceInForm(){
    if(this.formSearch.get('product_price').value!=null && this.formSearch.get('product_price').value!='')
      this.formSearch.get('product_price').setValue((this.formSearch.get('product_price').value).replace(",", "."));
    this.checkIndivisibleErrorOfSearchForm();
  }

//*****************************************************************************************************************************************/
//*******************************************  Методы для работы с признаком "Неделимость"  ***********************************************/
//*****************************************************************************************************************************************/
  // true - ошибка (если введено нецелое кол-во товара, при том что оно должно быть целым)
  checkIndivisibleErrorOfSearchForm(){ 
    this.indivisibleErrorOfSearchForm=(
      this.formSearch.get('product_count').value!='' && 
      +this.formSearch.get('product_id').value>0 && 
      this.formSearch.get('indivisible').value && // кол-во товара должно быть целым, ...
      !Number.isInteger(parseFloat(this.formSearch.get('product_count').value))) // но при этом кол-во товара не целое
  }
  checkIndivisibleErrorOfProductTable(){
    let result=false;// ошибки нет
    this.formBaseInformation.value.acceptanceProductTable.map(t =>{
      if(t['indivisible'] && t['product_count']!='' && !Number.isInteger(parseFloat(t['product_count']))){
        result=true;
      }})
    this.indivisibleErrorOfProductTable=result;
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
      companyId: this.company_id,
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    // console.log(`Dialog result: ${result}`);
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
//*****************************************   МАССОВОЕ ДОБАВЛЕНИЕ ТОВАРОВ ЧЕРЕЗ СПРАВОЧНИК    *********************************************/
//*****************************************************************************************************************************************/
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
      priceTypeId:0,                     // тип цены, по которому будут выданы цены
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
    this.searchProductCtrl.setValue('');
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    setTimeout(() => { this.tableRecount(this.nds_included)}, 1);
  }
  
  addProductRowFromProductsList(row: ProductSearchResponse){ 
  const control = <UntypedFormArray>this.formBaseInformation.get('acceptanceProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.acceptanceProductTable.map(i => 
    { // список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
        // console.log('product_id - '+i['product_id']);
      if(+i['product_id']==row.product_id){
        //такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        // alert('такой товар с таким складом уже занесён в таблицу товаров ранее')
        thereProductInTableWithSameId=true; 
      }
    });
    if(!thereProductInTableWithSameId){//такого товара  для выбранного склада в списке ещё нет. Добавляем в таблицу (в форму formBaseInformation)
      this.estimatedBalance=row['estimated_balance'];// это нужно, чтобы getDefaultActualBalance воспользовалась данным количеством в своем решении
      control.push(this.formingProductRowFromProductsList(row));
    } 
  }

  formingProductRowFromProductsList(row: ProductSearchResponse) {
    return this._fb.group({
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new UntypedFormControl (row.product_id,[]),
      name: new UntypedFormControl (row.name,[]),
      edizm: new UntypedFormControl (row.edizm,[]),
      total: new UntypedFormControl (+row.total,[]),
      product_count:  new UntypedFormControl (1,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$'), ValidationService.countMoreThanZero]),
      product_price:  new UntypedFormControl ((this.autoPrice?+row.lastPurchasePrice:0),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new UntypedFormControl (0,[]),
      nds_id: new UntypedFormControl (row.nds_id,[]),
      indivisible: new UntypedFormControl (row.indivisible,[]),

    });
  }

//*****************************************************************************************************************************************/
//***********************************************            COMMON UTILITES        *******************************************************/
//*****************************************************************************************************************************************/

  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  //заменяет запятую на точку при вводе цены или количества в заданной ячейке
  commaToDotInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    control.controls[row_index].get(fieldName).setValue(control.controls[row_index].get(fieldName).value.replace(",", "."));
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
  //для проверки в таблице с вызовом из html
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
}
