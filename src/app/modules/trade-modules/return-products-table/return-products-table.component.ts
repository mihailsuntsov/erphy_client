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
import { ProductsDockComponent } from 'src/app/ui/pages/documents/products-dock/products-dock.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { ViewChild } from '@angular/core';
import { PricingDialogComponent } from 'src/app/ui/dialogs/pricing-dialog/pricing-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatTable } from '@angular/material/table';

interface ReturnProductTable { //интерфейс для товаров, (т.е. для формы, массив из которых будет содержать форма returnProductTable, входящая в formBaseInformation)
  id: number;                     // id строки с товаром товара в таблице return_product
  row_id: number;                 // id строки 
  product_id: number;             // id товара 
  // return_id:number;               // id документа Возврат ...
  name: string;                   // наименование товара
  edizm: string;                  // наименование единицы измерения
  product_price: number;          // цена товара
  product_netcost: number;        // себестоимость
  product_count: number;          // кол-во товара
  department_id: number;          // склад
  remains: number;                // остаток на складе
  nds_id: number;                 // id ставки НДС
  // nds: number;                    // НДС в валютном выражении
  product_sumprice: number;       // сумма как product_count * product_price (высчитываем сумму и пихем ее в БД, чтобы потом на бэкэнде в SQL запросах ее не высчитывать)
  product_sumnetcost:number;      // сумма по себестоимости = product_netcost * product_count; тоже записываем в БД по тем же причинам что и сумму
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)

}
interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  // estimated_balance: number;      // остатки
  filename: string;               // картинка товара
  edizm: string;                  // наименование единицы измерения товара
  remains: number;                // остатки 
  nds_id: number;                 // ндс 
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
interface SpravSysNdsSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}
@Component({
  selector: 'app-return-products-table',
  templateUrl: './return-products-table.component.html',
  styleUrls: ['./return-products-table.component.css'],
  providers: [ProductCategoriesSelectComponent]
})
export class ReturnProductsTableComponent implements OnInit {
  formBaseInformation:any;//форма-обёртка для массива форм returnProductTable (нужна для вывода таблицы)
  formSearch:any;// форма для поиска товара, ввода необходимых данных и отправки всего этого в formBaseInformation в качестве элемента массива
  settingsForm: any; // форма с настройками (нужно для сохранения некоторых настроек при расценке)
  displayedColumns:string[] = [];//отображаемые колонки таблицы товаров
  gettingTableData: boolean;//идет загрузка товарных позиций
  totalProductCount:number=0;//всего кол-во товаров
  totalProductSumm:number=0;//всего разница
  totalNetcost:number=0;//всего избыток/недостача
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
  selected_price: number = 0; //цена, выбранная через поле Тип цены. Нужна для сравнения с полем Цена для выявления факта изменения его значения, и оставления значения столбце Тип цены пустым
  selected_pricingType: string; // тип расценки, выбранный в форме поиска.  Нужен для восстановления при сбросе формы поиска товара
  formSearchReadOnly=false;
  placeholderActualBalance:string='0';// фактическое кол-во товара по умолчанию, вычисляемое по настройкам после нахождения товара в форме поиска (нужно для плейсхолдера поля "Факт. остаток, чтобы было видно, что будет по умолчанию, если в него ничего не вводить")
  
  //групповое добавление товаров
  reportOn: string; // пакетно добавляем товары по категориям или по товарам/услугам (categories, products)
  reportOnIds:number[];     // id категорий или товаров/услуг
  estimatedBalance:number=0;// расчетное кол-во товара

  // Расценка (все настройки здесь - по умолчанию. После первого же сохранения настроек данные настройки будут заменяться в методе getSettings() )
  productPrice:number=0; //Цена найденного и выбранного в форме поиска товара.
  netCostPrice:number = 0; // себестоимость найденного и выбранного в форме поиска товара.
  priceUpDownFieldName:string = 'Наценка'; // Наименование поля с наценкой-скидкой
  priceTypeId_temp:number; // id типа цены. Нужна для временного хранения типа цены на время сброса формы поиска товара
  companyId_temp:number; // id предприятия. Нужна для временного хранения предприятия на время сброса формы formBaseInformation

  //чекбоксы
  selection = new SelectionModel<ReturnProductTable>(true, []);// SelectionModel - специальный класс для удобной работы с чекбоксами
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id

  trackByIndex = (i) => i;

  @ViewChild("product_count", {static: false}) product_count;
  // @ViewChild(MatTable) _table: MatTable<any>;
  // @ViewChild("nameInput", {static: false}) nameInput; 
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild("productSearchField", {static: false}) productSearchField;

  @Input() parentDockId:number;   //id родительского документа 
  @Input() parentDockName:string; // Идентификатор документа, в который вызывается данный компонент. Например, Return и т.д.
  @Input() company_id:number;
  @Input() department_id:number;
  @Input() readonly:boolean;
  @Input() autoAdd:boolean;
  @Input() nds:boolean;
  @Input() spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 
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
    private http: HttpClient,) { }

  ngOnInit(): void {

    this.formBaseInformation = new FormGroup({
      returnProductTable: new FormArray([]),
    });
    // форма поиска и добавления товара
    this.formSearch = new FormGroup({
      row_id: new FormControl                   ('',[]),
      product_id: new FormControl               ('',[Validators.required]),   // id товара
      edizm: new FormControl                    ('',[]),                      // наименование единицы измерения товара
      product_price : new FormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),                      // цена товара (которая уйдет в таблицу выбранных товаров). Т.е. мы как можем вписать цену вручную, так и выбрать из предложенных (см. выше)
      product_count : new FormControl           ('',[Validators.required,Validators.pattern('^[0-9]{1,6}(?:[.,][0-9]{0,3})?\r?$')]),                      // количество товара к возврату
      product_netcost : new FormControl         ('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),                      // себестоимость единицы товара
      remains : new FormControl                 ('',[]),                      // остатки на складе
      nds_id: new FormControl                   ('',[]),                      // НДС
      // nds: new FormControl                      (0,[]),                    // НДС в валютном ввыражении
      product_sumprice : new FormControl        (0,[]),                       // суммарная стоимость товара = цена * кол-во
      product_sumnetcost : new FormControl      (0,[]),                       // суммарная себестоимость товара = себестоимость * кол-во
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
    // this.getSpravSysEdizm(); //загрузка единиц измерения.
    this.showColumns();
    this.onProductSearchValueChanges();//отслеживание изменений поля "Поиск товара"
  }
  showColumns(){
    this.displayedColumns=[];
    // if(!this.readonly)
      // this.displayedColumns.push('select');
    // this.displayedColumns.push('index','row_id');
    this.displayedColumns.push('name','product_count','edizm','product_price','product_sumprice','product_netcost','product_sumnetcost');
    if(this.nds)
      this.displayedColumns.push('nds');
    if(!this.readonly)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){
    const control = <FormArray>this.formBaseInformation.get('returnProductTable');
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
        this.productTableRecount();
      }});  
  }
  
  // --------------------------------------- *** ЧЕКБОКСЫ *** -------------------------------------
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
    this.formBaseInformation.controls.returnProductTable.value.forEach(row => {
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
    for (var i = 0; i < this.formBaseInformation.controls.returnProductTable.value.length; i++) {
      if(this.selection.isSelected(this.formBaseInformation.controls.returnProductTable.value[i])){
        this.checkedList.push(this.formBaseInformation.controls.returnProductTable.value[i].row_id);
      }
      
    }
  }
  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.formBaseInformation.controls.returnProductTable.value.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  
  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  } 
  showCheckbox(row:ReturnProductTable):boolean{
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
          '/api/auth/getReturnProductsList?searchString='+this.searchProductCtrl.value+'&companyId='+this.company_id+'&departmentId='+this.department_id
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
    this.formSearch.get('remains').setValue(this.filteredProducts[0].remains);                      // остатки - кол-во товара по БД
    this.formSearch.get('nds_id').setValue(this.filteredProducts[0].nds_id);                        // id НДС 
    this.formSearch.get('product_netcost').setValue(0);                                             // себестоимость 
    this.formSearch.get('indivisible').setValue(this.filteredProducts[0].indivisible);              // неделимость (необходимо для проверки правильности ввода кол-ва товара)
    this.afterSelectProduct();
    this.filteredProducts=[];
  }

  onSelectProduct(product:ProductSearchResponse){
    this.formSearch.get('product_id').setValue(+product.product_id);               // id товара
    this.searchProductCtrl.setValue(product.name);                                 // наименование товара
    this.formSearch.get('product_count').setValue(0);                                               // кол-во
    this.formSearch.get('edizm').setValue(product.edizm);                          // наименование единицы измерения товара
    this.productImageName = product.filename;                                      // картинка товара
    this.formSearch.get('remains').setValue(product.remains);                      // остатки - кол-во товара по БД
    this.formSearch.get('nds_id').setValue(product.nds_id);                        // id НДС 
    this.formSearch.get('product_netcost').setValue(0);                            // себестоимость 
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
      this.loadMainImage();
      this.formSearch.get('product_count').setValue(1);  
      setTimeout(() => { this.product_count.nativeElement.focus(); }, 200);   
    }
    
  }

  setPrice(){
        this.formSearch.get('product_price').setValue(0);
  }

  updateSettings(){
    return this.http.post('/api/auth/saveSettingsReturn', this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar("Настройки успешно сохранены", "Закрыть");
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  openProductCard(dockId:number) {
    this.dialogCreateProduct.open(ProductsDockComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        dockId: dockId
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
    let productsTable: ReturnProductTable[]=[];
    //сбрасываем, иначе при сохранении будут прибавляться дубли и прочие глюки
    const control = <FormArray>this.formBaseInformation.get('returnProductTable');
    this.gettingTableData=true;
    control.clear();
    this.row_id=0;
    this.http.get('/api/auth/get'+this.parentDockName+'ProductTable?id='+this.parentDockId)
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
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
        );
  }

  formingProductRowFromApiResponse(row: ReturnProductTable) {
    return this._fb.group({
      id: new FormControl (row.id,[]),
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new FormControl (row.product_id,[]),
      // return_id:  new FormControl (+this.parentDockId,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      remains: new FormControl (+row.remains,[]),
      nds_id: new FormControl (+row.nds_id,[]),
      product_sumprice: new FormControl ((+row.product_count*(+row.product_price)).toFixed(2),[]),
      product_sumnetcost: new FormControl ((+row.product_count*(+row.product_netcost)).toFixed(2),[]),
      product_count:  new FormControl (row.product_count,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_netcost:  new FormControl (this.numToPrice(row.product_netcost,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_price:  new FormControl (this.numToPrice(row.product_price,2),[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),
      // ValidationService.priceMoreThanZero  -- пока исключил ошибку "Цена=0", чтобы позволить сохранять с нулевой ценой, а также делать с ней связанные документы.
      ]),
      indivisible:  new FormControl (row.indivisible,[]),
    });
  }

  addProductRow(){ 
  this.productSearchField.nativeElement.focus();//убираем курсор из текущего поля, чтобы оно не было touched и красным после сброса формы
  const control = <FormArray>this.formBaseInformation.get('returnProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.returnProductTable.map(i => 
    {// список товаров не должен содержать одинаковые товары из одного и того же склада. Тут проверяем на это
      if(+i['product_id']==this.formSearch.get('product_id').value)
      {//такой товар с таким складом уже занесён в таблицу товаров ранее, и надо смёрджить их, т.е. слить в один, просуммировав их фактические остатки.
        alert('Такой товар уже есть')
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
    return this._fb.group({
      id: new FormControl (null,[]),
      row_id: [this.getRowId()],
      product_id:  new FormControl (+this.formSearch.get('product_id').value,[]),
      name:  new FormControl (this.searchProductCtrl.value,[]),
      edizm:  new FormControl (this.formSearch.get('edizm').value,[]),
      product_price: new FormControl (this.formSearch.get('product_price').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$'),/*ValidationService.priceMoreThanZero*/]),
      product_count:  new FormControl (this.formSearch.get('product_count').value,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_netcost:  new FormControl (this.formSearch.get('product_netcost').value,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      remains: new FormControl (+this.formSearch.get('remains').value,[]),
      nds_id: new FormControl (+this.formSearch.get('nds_id').value,[]),
      product_sumprice: new FormControl ((+this.formSearch.get('product_count').value*(+this.formSearch.get('product_price').value)).toFixed(2),[]),
      product_sumnetcost: new FormControl ((+this.formSearch.get('product_count').value*(+this.formSearch.get('product_netcost').value)).toFixed(2),[]),
      indivisible:  new FormControl (this.formSearch.get('indivisible').value,[]),
      // nds: new FormControl (+this.formSearch.get('remains').value,[]),
    });
  }
  
  deleteProductRow(row: ReturnProductTable,index:number) {
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
        const control = <FormArray>this.formBaseInformation.get('returnProductTable');
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
    this.displayedColumns=[]
    setTimeout(() => { 
      this.showColumns();
    }, 1);
  }

  resetRowIds(){
    this.row_id=0;
    const control = <FormArray>this.formBaseInformation.get('returnProductTable');
    this.formBaseInformation.value.returnProductTable.map(i => 
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
    this.setRowSumPrice(row_index);
    this.productTableRecount();
  }
  onChangeProductCount(row_index:number){
    this.commaToDotInTableField(row_index, 'product_count');
    this.setRowSumPrice(row_index);
    this.setRowNetcost(row_index);
    this.productTableRecount();
    this.checkIndivisibleErrorOfProductTable();
  }
  onChangeProductNetcost(row_index:number){
    this.commaToDotInTableField(row_index, 'product_netcost');
    this.setRowNetcost(row_index);
    this.productTableRecount();
  }
  setRowSumPrice(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('product_sumprice').setValue((control.controls[row_index].get('product_count').value*control.controls[row_index].get('product_price').value).toFixed(2));
  }
  setRowNetcost(row_index:number){
    const control = this.getControlTablefield();
    control.controls[row_index].get('product_sumnetcost').setValue(((control.controls[row_index].get('product_count').value)*control.controls[row_index].get('product_netcost').value).toFixed(3).replace(".000", "").replace(".00", ""));
  }
  productTableRecount(){
    if(this.formBaseInformation!=undefined){//метод может вызываться из ngOnChanges, а т.к. он стартует до ngOnInit, то formBaseInformation может еще не быть
      this.recountTotals();
    }
  }
  recountTotals(){
    this.totalProductCount= this.getTotalProductCount();
    this.totalProductSumm=  this.getTotalSumPrice();
    this.totalNetcost=      this.getTotalNetcost();
  }
  //возвращает таблицу товаров в родительский компонент для сохранения
  getProductTable(){
    return this.formBaseInformation.value.returnProductTable;
  }

  getTotalProductCount() {//бежим по столбцу product_count и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return  (this.formBaseInformation.value.returnProductTable.map(t => +t.product_count).reduce((acc, value) => acc + value, 0)).toFixed(3).replace(".000", "").replace(".00", "");
  }
  getTotalSumPrice() { //бежим по столбцу product_sumprice и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return (this.formBaseInformation.value.returnProductTable.map(t => +t.product_sumprice).reduce((acc, value) => acc + value, 0)).toFixed(2).replace(".000", "").replace(".00", "");
  }
  getTotalNetcost() {//бежим по столбцу product_sumnetcost и складываем (аккумулируем) в acc начиная с 0 значения этого столбца
    return (this.formBaseInformation.value.returnProductTable.map(t => +t.product_sumnetcost).reduce((acc, value) => acc + value, 0)).toFixed(2);
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
      this.thumbImageAddress="assets/images/no_foto.jpg";      
      this.mainImageAddress="";
      this.productImageName=null;
      this.imageToShow=null;
      this.form.resetForm();//реализовано через ViewChild: @ViewChild("form", {static: false}) form; + В <form..> прописать #form="ngForm"
      this.formSearch.get('remains').           setValue('');
      this.formSearch.get('product_id').        setValue(null);
      this.formSearch.get('product_price').     setValue('');
      this.selected_price=0;
      this.netCostPrice=0;
      this.productPrice=0;
      this.placeholderActualBalance='0';

      setTimeout(() => { this.productSearchField.nativeElement.focus(); }, 100);
  }

  commaToDotInTableField(row_index:number, fieldName:string){
    const control = this.getControlTablefield();
    control.controls[row_index].get(fieldName).setValue(control.controls[row_index].get(fieldName).value.replace(",", "."));
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
  checkProductNetcostInForm(){
    if(this.formSearch.get('product_netcost').value!=null && this.formSearch.get('product_netcost').value!='')
      this.formSearch.get('product_netcost').setValue((this.formSearch.get('product_netcost').value).replace(",", "."));
    this.checkIndivisibleErrorOfSearchForm();
  }
  // true - ошибка (если введено нецелое кол-во товара, при том что оно должно быть целым)
  checkIndivisibleErrorOfSearchForm(){ 
    this.indivisibleErrorOfSearchForm=(
      this.formSearch.get('product_count').value!='' && 
      +this.formSearch.get('product_id').value>0 && 
      this.formSearch.get('indivisible').value && // кол-во товара должно быть целым, ...
      !Number.isInteger(parseFloat(this.formSearch.get('product_count').value)) // но при этом кол-во товара не целое
    )
  }
  checkIndivisibleErrorOfProductTable(){
    let result=false;// ошибки нет
    this.formBaseInformation.value.returnProductTable.map(t =>{
      if(t['indivisible'] && t['product_count']!='' && !Number.isInteger(parseFloat(t['product_count']))){
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
  }
  
  addProductRowFromProductsList(row: ProductSearchResponse){ 
  const control = <FormArray>this.formBaseInformation.get('returnProductTable');
  let thereProductInTableWithSameId:boolean=false;
    this.formBaseInformation.value.returnProductTable.map(i => 
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
    this.searchProductCtrl.setValue('');
    this.changeProductsTableLength.emit();//событие изменения кол-ва товаров в таблице
    this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
    this.recountTotals();
  }

  formingProductRowFromProductsList(row: ProductSearchResponse) {
    return this._fb.group({
      row_id: [this.getRowId()],// row_id нужен для идентифицирования строк у которых нет id (например из только что создали и не сохранили)
      product_id: new FormControl (row.product_id,[]),
      name: new FormControl (row.name,[]),
      edizm: new FormControl (row.edizm,[]),
      remains: new FormControl (+row.remains,[]),
      product_count:  new FormControl (1,[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      product_netcost:  new FormControl (0,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_price:  new FormControl (0,[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      product_sumprice: new FormControl (0,[]),
      product_sumnetcost: new FormControl (0,[]),
      nds_id: new FormControl (row.nds_id,[]),
      indivisible: new FormControl (row.indivisible,[]),
    });
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
