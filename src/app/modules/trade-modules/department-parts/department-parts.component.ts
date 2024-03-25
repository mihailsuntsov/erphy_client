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
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  gettingTableData: boolean = false;//идет загрузка данных
  displayedColumns:string[] = [];//отображаемые колонки таблицы
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан
  companyId: number=null;

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
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.fillProductsListFromApiResponse(documentValues.deppartProducts);
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  insertDepartmentPart(){
    this.http.post('/api/auth/insertDepartmentPart', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_suc'), translate('modules.button.close'));
                      // this.departmentPartsDialog.close(this.data.categoryId);
                      this.getData();
                    }
                  }
                 
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
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'), translate('modules.button.close'));
                      this.getData();
                      // this.departmentPartsDialog.close(this.data.categoryId);
                    }
                  }
                 
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
        control.push(this.formingProductResourceRow(row));            
      });
    }
  }
  
  formingProductResourceRow(row: DeppartProducts) {
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
      width: '400px',data:{head: translate('docs.msg.deleting'),warning: translate('docs.msg.delete_all_rows'),query: ''},});
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
      // alert(a[FieldName]+', '+b[FieldName])
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
} 