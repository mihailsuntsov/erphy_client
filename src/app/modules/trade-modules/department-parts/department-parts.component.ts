import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';
import { translate } from '@ngneat/transloco'; //+++
import { UntypedFormControl, UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray} from '@angular/forms';
import { SlugifyPipe } from 'src/app/services/slugify.pipe';

interface ProductSearchResponse{  // интерфейс получения списка товаров во время поиска товара 
  name: string;                   // наименование товара
  product_id: number;             // id товара
  filename: string;               // картинка товара
  edizm: string;                  // наименование единицы измерения товара
  total: number;                  // остатки 
  nds_id: number;                 // ндс 
  indivisible: boolean;           // неделимый товар (нельзя что-то сделать с, например, 0.5 единицами этого товара, только с кратно 1)
  priceOfTypePrice: number;       // цена по запрошенному id типа цены
  avgCostPrice: number;           // средняя себестоимость
  lastPurchasePrice: number;      // последняя закупочная цена
  avgPurchasePrice : number;      // средняя закупочная цена
  is_material: boolean;           // материален ли продукт (товар это или услуга)
}

interface DeppartProducts{
  id: number;
  name: string;
}

@Component({
  selector: 'app-department-parts',
  templateUrl: './department-parts.component.html',
  styleUrls: ['./department-parts.component.css'],
  providers: [SlugifyPipe,ProductCategoriesSelectComponent,]
})
export class DepartmentPartsComponent implements OnInit {

  actionType: string;
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  // formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  gettingTableData: boolean = false;//идет загрузка данных
  displayedColumns:string[] = [];//отображаемые колонки таблицы
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан
  companyId: number=null;

  // Resources variables +++
  resourcesList : any [] = []; //массив для получения всех статусов текущего документа
  gettingResourcesTableData: boolean = false;//идет загрузка списка ресурсов
  resource_row_id:number=0;
  formResourceSearch:any;// форма для выбора ресурса и последующего формирования строки таблицы
  showResourceSearchFormFields:boolean = false;
  showSearchFormFields:boolean = false;
  displayedResourcesColumns: string[]=[];//массив отображаемых столбцов таблицы с ресурсами


  constructor(
    public  departmentPartsDialog: MatDialogRef<DepartmentPartsComponent>,
    private _snackBar: MatSnackBar,
    public  MessageDialog: MatDialog,
    private slugifyPipe: SlugifyPipe,
    public ConfirmDialog: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    public  ProductDuplicateDialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private http: HttpClient,
    public  deleteDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
  ngOnInit() {

    this.actionType = this.data.actionType;
    this.editability = this.data.editability;
    this.companyId = this.data.companyId;

    this.formBaseInformation = new UntypedFormGroup({
      id:               new UntypedFormControl(+this.data.partId,[]),
      name:             new UntypedFormControl(this.data.partName,[Validators.required,Validators.maxLength(120)]),
      description:      new UntypedFormControl(this.data.partDescription,[Validators.maxLength(1000)]),
      is_active:        new UntypedFormControl(this.data.is_active,[]),
      department_id:    new UntypedFormControl(+this.data.department_id,[]),
      menu_order:       new UntypedFormControl(+this.data.menu_order,[]),
      deppartProducts:  new UntypedFormArray([]),      
      deppartResourcesTable: new UntypedFormArray([]),//массив с формами ресурсов
    }); 
    // this.formAboutDocument = new UntypedFormGroup({
    //   id: new UntypedFormControl      ('',[]),
    //   master: new UntypedFormControl      ('',[]),
    //   creator: new UntypedFormControl      ('',[]),
    //   changer: new UntypedFormControl      ('',[]),
    //   company: new UntypedFormControl      ('',[]),
    //   date_time_created: new UntypedFormControl      ('',[]),
    //   date_time_changed: new UntypedFormControl      ('',[]),
    // });
    
    this.formResourceSearch = new UntypedFormGroup({
      resource_id: new UntypedFormControl ('' ,[Validators.required]),      
      name: new UntypedFormControl ('' ,[Validators.required]),
      resource_qtt: new UntypedFormControl (0 ,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      // description: new UntypedFormControl ('' ,[]),      
    });

    this.getResourcesList();
    this.refreshTableColumns();
    this.getData();
  }

  getData(){
    if(+this.formBaseInformation.get('id').value > 0){
      this.getDocumentValuesById();
    }
  }
  
  getDocumentValuesById(){
    this.http.get('/api/auth/getDeppartValues?id='+this.formBaseInformation.get('id').value)
        .subscribe(
            data => { 
              
                let documentValues: any = data as any;

                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('is_active').setValue(documentValues.is_active);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  // this.formAboutDocument.get('master').setValue(documentValues.master);
                  // this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  // this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  // this.formAboutDocument.get('company').setValue(documentValues.company);
                  // this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  // this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.fillProductsListFromApiResponse(documentValues.deppartProducts);
                  this.fillResourcesObjectListFromApiResponse(documentValues.deppartResourcesTable);
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  insertDepartmentPart(){
    this.http.post('/api/auth/insertDepartmentPart', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  let result = data as number;

                  switch(result){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.field.dep_part')})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.field.dep_part')})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_suc'), translate('modules.button.close'));
                      // this.departmentPartsDialog.close(this.data.categoryId);
                      this.formBaseInformation.get('id').setValue(result);
                      this.getData();
                    }
                  }
                 this.showSearchFormFields=false;
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }

  updateDepartmentPart(){
    this.http.post('/api/auth/updateDepartmentPart', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.field.dep_part')})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.field.dep_part')})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'), translate('modules.button.close'));
                      this.getData();
                      // this.departmentPartsDialog.close(this.data.categoryId);
                    }
                  }
                  this.showSearchFormFields=false;                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }
  
  onNoClick(): void {
    this.departmentPartsDialog.close();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getControl(formControlName){
    const control = <UntypedFormArray>this.formBaseInformation.get(formControlName);
    return control
  }

  fillProductsListFromApiResponse(productsArray:DeppartProducts[]){
    this.getControl('deppartProducts').clear();
    if(productsArray.length>0){
      const control = <UntypedFormArray>this.formBaseInformation.get('deppartProducts');
      productsArray.forEach(row=>{
        control.push(this.formingResourceRow(row));            
      });
    }
  }
  
  formingResourceRow(row: DeppartProducts) {
    return this._fb.group({
      id:  new UntypedFormControl (row.id,[]),
      name: new UntypedFormControl (row.name,[]),
    });
  }
  
  openDialogProductCategoriesSelect(selection:string, destination:string){
    let reportOnIds:number[]=[];
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    selection, // Что выбираем (Категории - categories, товары и услуги - products)
        companyId:  this.companyId, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          reportOnIds.push(i.id);
        });
        if(reportOnIds.length>0)
          this.getProductsInfoListByIds(selection,reportOnIds,destination);
      }
    });
  }
  
  getProductsInfoListByIds(selection:string, ids: number[], destination:string){
    const body =  {
      companyId: this.companyId,         // предприятие, по которому идет запрос данных
      departmentId:0,                    // id отделения
      priceTypeId:0,                     // тип цены, по которому будут выданы цены
      reportOn:selection,                // по категориям или по товарам/услугам (categories, products)
      reportOnIds:ids                    // id категорий или товаров/услуг (того, что выбрано в reportOn)
    };
    this.http.post('/api/auth/getProductsInfoListByIds', body).subscribe(
      (data) => {   
        let filteredProducts=data as ProductSearchResponse[];
        if(filteredProducts.length>0){//несмотря на то, что сами id, по ним может ничего не вернуться, т.к. товары по запрошенным id могут быть не материальны (услуги), либо категории пустые/с нематериальными товарами
          if(destination=='employee_services')
            filteredProducts.map(i=>{
              this.addProductRow(i);
          });
          if(destination=='incoming_service'){
            if(!filteredProducts[0].is_material){
              this.formBaseInformation.get('incoming_service_id').setValue(filteredProducts[0].product_id);
              this.formBaseInformation.get('incoming_service_name').setValue(filteredProducts[0].name);
            } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.no_service')}});
          }
          setTimeout(() => {this.sortBy('name')},1);
        }
      },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  
  addProductRow(product:ProductSearchResponse){ 
    let thereSame:boolean=false;
    const control = <UntypedFormArray>this.formBaseInformation.get('deppartProducts');
    this.formBaseInformation.value.deppartProducts.map(i => 
    { // Существующий список не должен содержать одинаковые товары (услуги). Тут проверяем на это
      // Existed list shouldn't contain the same products (services). Here is checking about it
      if(+i['id'] == product.product_id)
      {
        thereSame=true;
      }
    });
    if(!thereSame){//такого товара в списке ещё нет. Добавляем в таблицу 
      control.push(this.formingJobtitleRowFromSearchForm(product.product_id,product.name));
    } 
  }  

  formingJobtitleRowFromSearchForm(id:number,name:string){
    return this._fb.group({
      id:  new UntypedFormControl (id,[]),
      name: new UntypedFormControl (name,[]),
    });
  }
  trackByIndex(i: any) { return i; }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.cln_table'),warning: translate('docs.msg.cln_table_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControl('deppartProducts').clear();
      }});  
  }
  formColumns(){
    this.displayedColumns=[];
    this.displayedColumns.push('name');
    if(this.editability)
      this.displayedColumns.push('delete');
  }
  refreshTableColumns(){
    this.displayedColumns=[];
    setTimeout(() => { 
      this.formColumns();
    }, 1);
  }

  deleteTableRow(row: any,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('deppartProducts');
          control.removeAt(index);
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  sortBy(FieldName: string) {
    console.log(this.myItems.value, FieldName);
    this.myItems.setValue(this.myItems.value.sort((a, b) => {
      const nameA = a[FieldName].toUpperCase(); // ignore upper and lowercase
      const nameB = b[FieldName].toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    }));
  }
  get myItems(): UntypedFormArray {
    return this.formBaseInformation.get('deppartProducts') as UntypedFormArray;
  }

  // *******************    Quantity by resources    *******************
  // list for select part
  getResourcesList(){ 
    return this.http.get('/api/auth/getResourcesList?company_id='+this.data.companyId)
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
      width: '400px',data:{head: translate('docs.msg.cln_table'),warning: translate('docs.msg.cln_table_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControl('deppartResourcesTable').clear();
        // this.formBaseInformation.get('deppartResourcesTable').clear();
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
        const control = <UntypedFormArray>this.formBaseInformation.get('deppartResourcesTable');
          control.removeAt(index);
          this.refreshRresourceTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  addResourceRow() 
  { 
    let thereSamePart:boolean=false;
    this.formBaseInformation.value.deppartResourcesTable.map(i => 
    { // Cписок не должен содержать одинаковые ресурсы. Тут проверяем на это
      // Table shouldn't contain the same resources. Here is checking about it
      if(+i['resource_id']==this.formResourceSearch.get('resource_id').value)
      {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
        thereSamePart=true; 
      }
    });
    if(!thereSamePart){
      const control = <UntypedFormArray>this.formBaseInformation.get('deppartResourcesTable');
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
    this.getControl('deppartResourcesTable').clear();
    if(resourcesArray.length>0){
      const control = <UntypedFormArray>this.formBaseInformation.get('deppartResourcesTable');
      resourcesArray.forEach(row=>{
        control.push(this.formingDeppartResourceRow(row));            
      });
    }
    this.refreshRresourceTableColumns();
  }
  
  formingDeppartResourceRow(row: any) {
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