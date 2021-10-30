import { Component, OnInit, Input, Output} from '@angular/core';
import { EventEmitter } from '@angular/core';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ProductsDocComponent } from 'src/app/ui/pages/documents/products-doc/products-doc.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';

interface OrdersupProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма ordersupProductTable, входящая в formBaseInformation)
  id: number;                     // id строки с товаром товара в таблице return_product
  row_id: number;                 // id строки 
  product_id: number;             // id товара 
  name: string;                   // наименование товара
  edizm: string;                  // наименование единицы измерения
  product_price: number;          // цена товара
  product_count: number;          // кол-во товара
  department_id: number;          // склад
  total: number;                  // остаток на складе
  reserved: number;               // в резервах
  available: number;              // доступно
  nds_id: number;                 // id ставки НДС
  product_sumprice: number;       // сумма как product_count * product_price (высчитываем сумму и пихем ее в БД, чтобы потом на бэкэнде в SQL запросах ее не высчитывать)
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
}
interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  filename: string;               // картинка товара
  edizm: string;                  // наименование единицы измерения товара
  total: number;                  // остатки 
  reserved: number;               // в резервах
  available: number;              // доступно
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
interface SpravSysNdsSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}

@Component({
  selector: 'app-ordersup-products-table',
  templateUrl: './ordersup-products-table.component.html',
  styleUrls: ['./ordersup-products-table.component.css'],
  providers: [ProductCategoriesSelectComponent]
})
export class OrdersupProductsTableComponent implements OnInit {
  formBaseInformation:any;//форма-обёртка для массива форм ordersupProductTable (нужна для вывода таблицы)
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в formBaseInformation в качестве элемента массива
  settingsForm: any; // форма с настройками (нужно для сохранения некоторых настроек при расценке)
  displayedColumns:string[] = [];//отображаемые колонки таблицы товаров
  gettingTableData: boolean;//идет загрузка товарных позиций
  totalProductCount:number=0;//всего кол-во товаров
  totalProductSumm:number=0;//всего разница
  indivisibleErrorOfSearchForm:boolean; // дробное кол-во товара при неделимом товаре в форме поиска
  indivisibleErrorOfProductTable:boolean;// дробное кол-во товара при неделимом товаре в таблице товаров

  //для Autocomplete по поиску товаров
  searchProductCtrl = new FormControl();//поле для поиска товаров
  isProductListLoading  = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredProducts: ProductSearchResponse[] = [];
  productImageName:string = null;
  mainImageAddress:string = 'assets/images/no_foto.jpg';
  thumbImageAddress:string = 'assets/images/no_foto.jpg';
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
  selection = new SelectionModel<OrdersupProductTable>(true, []);// SelectionModel - специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  trackByIndex = (i) => i;

  @ViewChild("product_count", {static: false}) product_count;
  // @ViewChild(MatTable) _table: MatTable<any>;
  // @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild("productSearchField", {static: false}) productSearchField;

  @Input() parentDocId:number;   //id родительского документа 
  @Input() parentDocName:string; // Идентификатор документа, в который вызывается данный компонент. Например, Ordersup и т.д.
  @Input() company_id:number;
  @Input() department_id:number;
  @Input() readonly:boolean;
  @Input() autoAdd:boolean;
  @Input() autoPrice:boolean;
  @Input() nds:boolean;
  @Input() nds_included:boolean;
  @Input() spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 
  @Output() changeProductsTableLength = new EventEmitter<any>();   //событие изменения таблицы товаров (а именно - количества товаров в ней)
  @Output() totalSumPriceEvent = new EventEmitter<string>();

  constructor( private _fb: FormBuilder,
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

    this.formBaseInformation = new FormGroup({
      ordersupProductTable: new FormArray([]),
    });
    // форма поиска и добавления товара
    this.formSearch = new FormGroup({
      row_id: new FormControl                   ('',[]),
      product_id: new FormControl               ('',[Validators.required]),   // id товара
      edizm: new FormControl                    ('',[]),                      // наименование единицы измерения товара
      product_price : new FormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),                      // цена товара (которая уйдет в таблицу выбранных товаров). Т.е. мы как можем вписать цену вручную, так и выбрать из предложенных (см. выше)
      product_count : new FormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),                      // количество товара к возврату
      nds_id: new FormControl                   ('',[]),                      // НДС
      available: new FormControl                ('',[]),                      // доступно
      reserved: new FormControl                 ('',[]),                      // зарезервировано в этом отделении
      total: new FormControl                    ('',[]),                      // остатки на складе
      product_sumprice : new FormControl        ('',[]),                      // суммарная стоимость товара = цена * кол-во
      indivisible: new FormControl              ('',[]),                      // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
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
  showColumns(){
    
    this.displayedColumns=[];
    // if(!this.readonly)
      // this.displayedColumns.push('select');
    // this.displayedColumns.push('index','row_id','product_id');
    this.displayedColumns.push('name','product_count','edizm','available','reserved','total','product_price','product_sumprice');
    if(this.nds)
      this.displayedColumns.push('nds');
    if(!this.readonly)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){
    const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
    return control;
  }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: 'Очистка списка товаров',warning: 'Вы хотите удалить все товары из списка?',query: ''},});
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
    this.formBaseInformation.controls.ordersupProductTable.value.forEach(row => {
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
    for (var i = 0; i < this.formBaseInformation.controls.ordersupProductTable.value.length; i++) {
      if(this.selection.isSelected(this.formBaseInformation.controls.ordersupProductTable.value[i])){
        this.checkedList.push(this.formBaseInformation.controls.ordersupProductTable.value[i].row_id);
      }
      
    }
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.formBaseInformation.controls.ordersupProductTable.value.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:OrdersupProductTable):boolean{
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
    this.formSearch.get('available').setValue(this.filteredProducts[0].total-this.filteredProducts[0].reserved); //Поле "Доступно" = "Всего" - "В резервах"
    this.formSearch.get('total').setValue(this.filteredProducts[0].total);                          // Поле "Всего" - всего единиц товара в отделении (складе)
    this.formSearch.get('reserved').setValue(this.filteredProducts[0].reserved);                    // Поле "В резервах" - зарезервировано в этом отделении
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
    this.formSearch.get('available').setValue(product.total-product.reserved);     // Поле "Доступно" = "Всего" - "В резервах"
    this.formSearch.get('reserved').setValue(product.reserved);                    // Поле "В резервах" - зарезервировано в этом отделении 
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
    let productsTable: OrdersupProductTable[]=[];
    //сбрасываем, иначе при сохранении будут прибавляться дубли и прочие глюки
    const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
    this.gettingTableData=true;
    control.clear();
    this.row_id=0;
    this.http.get('/api/auth/getOrdersupProductTable?id='+this.parentDocId)
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
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
        );
  }

  formingProductRowFromApiResponse(row: OrdersupProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new FormControl (row.product_id,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      total: new FormControl (+row.total,[]),
      reserved:  new FormControl (row.reserved,[]), // сколько зарезервировано этого товара в других документах за исключением этого
      available:  new FormControl ((row.total)-(row.reserved),[]),
      nds_id: new FormControl (+row.nds_id,[]),
      product_sumprice: new FormControl ((+row.product_count*(+row.product_price)).toFixed(2),[]),
      product_count:  new FormControl (row.product_count,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price:  new FormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),
      // ValidationService.priceMoreThanZero  -- пока исключил ошибку "Цена=0", чтобы позволить сохранять с нулевой ценой, а также делать с ней связанные документы.
      ]),
      indivisible:  new FormControl (row.indivisible,[]),
    });
  }

  addProductRow(){ 
  this.productSearchField.nativeElement.focus();//убираем курсор из текущего поля, чтобы оно не было touched и красным после сброса формы
  const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.ordersupProductTable.map(i => 
    {// список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
      if(+i['product_id']==this.formSearch.get('product_id').value)
      {//такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Данный товар уже выбран'}});
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
      id: new FormControl (null,[]),
      row_id: [this.getRowId()],
      product_id:  new FormControl (+this.formSearch.get('product_id').value,[]),
      name:  new FormControl (this.searchProductCtrl.value,[]),
      edizm:  new FormControl (this.formSearch.get('edizm').value,[]),
      product_price: new FormControl (this.formSearch.get('product_price').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),/*ValidationService.priceMoreThanZero*/]),
      product_count:  new FormControl ((+this.formSearch.get('product_count').value>0?+this.formSearch.get('product_count').value:1),[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      total: new FormControl (+this.formSearch.get('total').value,[]),
      available:  new FormControl (+this.formSearch.get('available').value,[]),
      reserved: new FormControl (this.formSearch.get('reserved').value,[]), // сколько зарезервировано
      nds_id: new FormControl (+this.formSearch.get('nds_id').value,[]),
      product_sumprice: new FormControl ((+this.formSearch.get('product_count').value*(+this.formSearch.get('product_price').value)).toFixed(2),[]),
      indivisible:  new FormControl (this.formSearch.get('indivisible').value,[]),
      // nds: new FormControl (+this.formSearch.get('total').value,[]),
    });
  }
  
  deleteProductRow(row: OrdersupProductTable,index:number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Удаление товарной позиции',
        warning: 'Удалить товар '+row.name+' ?',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
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
    const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
    this.formBaseInformation.value.ordersupProductTable.map(i => 
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

  getNdsMultiplifierBySelectedId(srchId:number):number {
    //возвращает множитель по выбранному НДС. например, для 20% будет 1.2, 0% - 1 и т.д 
        let value=0;
        this.spravSysNdsSet.forEach(a=>{
          if(+a.id == srchId) {value=(a.name.includes('%')?(+a.name.replace('%','')):0)/100+1}
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

    //пересчитывает НДС в таблице товаров
  tableRecount(nds_included?:boolean){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      if(nds_included!=undefined)
        this.nds_included=nds_included;
      //перерасчет НДС в форме поиска
      if(+this.formSearch.get('product_id').value) this.calcSumPriceOfProduct();
      //перерасчет НДС в таблице товаров
      if(this.formBaseInformation.controls['ordersupProductTable'].value.length>0)
      {
        let switcherNDS:boolean = this.nds;
        let switcherNDSincluded:boolean = this.nds_included;
        let multiplifierNDS:number = 1;//множитель НДС. Рассчитывается для каждой строки таблицы. Например, для НДС 20% будет 1.2, для 0 или без НДС будет 1
        let KZ:number = 0; //коэффициент затрат, равен делению расходов на итоговую сумму
        this.formBaseInformation.value.ordersupProductTable.map(i =>
        {
          multiplifierNDS = this.getNdsMultiplifierBySelectedId(+i['nds_id']);
          //если включён переключатель "НДС", но переключатель "НДС включена" выключен,
          if(switcherNDS && !switcherNDSincluded){
          //..к сумме добавляем НДС
            i['product_sumprice']=this.numToPrice(+(+i['product_count']*(+i['product_price'])*multiplifierNDS).toFixed(2),2);
          }else i['product_sumprice']=this.numToPrice(+((+i['product_count'])*(+i['product_price'])).toFixed(2),2);//..иначе не добавляем, и сумма - это просто произведение количества на цену
        });

        this.finishRecount();                                    // подсчёт TOTALS
      }
    }
  }
  calcSumPriceOfProduct(){
    let switcherNDS:boolean = this.nds;
    let switcherNDSincluded:boolean = this.nds_included;
    let selectedNDS:number = this.getNdsMultiplifierBySelectedId(+this.formSearch.get('nds_id').value)
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
    return  (this.formBaseInformation.value.ordersupProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2);
  }

  //возвращает таблицу товаров в родительский компонент для сохранения
  getProductTable(){
    return this.formBaseInformation.value.ordersupProductTable;
  }

  checkEmptyProductField(){
    if(this.searchProductCtrl.value.length==0){
      this.resetFormSearch();
    }
  };    

  resetFormSearch(){
      this.formSearchReadOnly=false;
      this.searchProductCtrl.setValue('');
      this.thumbImageAddress="assets/images/no_foto.jpg";      
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
    this.formBaseInformation.value.ordersupProductTable.map(t =>{
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
      mode: 'createForOrdersup',
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
    error => console.log(error),
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
  const control = <FormArray>this.formBaseInformation.get('ordersupProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.ordersupProductTable.map(i => 
    { // список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
        // console.log('product_id - '+i['product_id']);
      if(+i['product_id']==row.product_id){
        //такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        alert('такой товар с таким складом уже занесён в таблицу товаров ранее')
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
      product_id: new FormControl (row.product_id,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      total: new FormControl (+row.total,[]),
      product_count:  new FormControl (1,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_price:  new FormControl ((this.autoPrice?+row.lastPurchasePrice:0),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new FormControl (0,[]),
      nds_id: new FormControl (row.nds_id,[]),
      indivisible: new FormControl (row.indivisible,[]),

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
