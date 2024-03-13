import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ValidationProduct } from './validation.product';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++
import { ProductCategoriesSelectComponent } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.component';

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

interface docResponse {
  id: number;
  company: string;
  company_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  changer:string;
  changer_id: number;
  date_time_changed: string;
  date_time_created: string;
  name: string;
  description: string;
  jobtitle_products: any[]; // services that can do the human who has this job title
}
interface jobtitlesList {//интерфейс массива для получения всех статусов текущего документа
  id: string;
  name: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: any;
  name: string;
}
export interface GroupBy {
  initial: string;
  isGroupBy: boolean;
}


@Component({
  selector: 'app-jobtitles-doc',
  templateUrl: './jobtitles-doc.component.html',
  styleUrls: ['./jobtitles-doc.component.css'],
  providers: [LoadSpravService,ProductCategoriesSelectComponent]
})
export class JobtitlesDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedProductsList: any [] = [];//массив для получения списка отделений с их частями
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  displayedColumns:string[] = [];//отображаемые колонки таблицы частей отделений и количества ресурса в них

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

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
  editability:boolean = false;//редактируемость. true если есть право на создание и документ содается, или есть право на редактирование и документ создан

  // statusColor: string;
  jobtitlesList : jobtitlesList [] = []; //массив для получения всех статусов текущего документа
  gettingTableData: boolean = false;//идет загрузка товарных позиций
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id
  formSearch:any;// форма для формирования строки таблицы
  selectedDepartmentName='';
  selectedJobtitleName='';
  // showSearchFormFields:boolean = false;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    private LoadSpravService:   LoadSpravService,
    public ConfirmDialog: MatDialog,
    private productCategoriesSelectComponent: MatDialog,
    private _router:Router,
    private _fb: UntypedFormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
    private _snackBar: MatSnackBar) { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {
    this.formSearch = new UntypedFormGroup({
      id: new UntypedFormControl ('0' ,[Validators.required]),      // id of selected department part
      name: new UntypedFormControl ('' ,[Validators.required]),   // name of selected department part
      jobtitle_qtt: new UntypedFormControl (0 ,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      department_id: new UntypedFormControl ('',[]),
      department_name: new UntypedFormControl ('',[]),
    });
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      name: new UntypedFormControl      ('',[Validators.required]),
      description: new UntypedFormControl      ('',[]),
      jobtitleProductsFormTable: new UntypedFormArray([]),
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

    this.getSetOfPermissions();
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=56')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }

  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
      this.LoadSpravService.getCompaniesList()
        .subscribe(
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              this.doFilterCompaniesList();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
    else this.doFilterCompaniesList();
  }
  getMyId(){ //+++
    if(+this.myId==0)
      this.LoadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();
  }
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.LoadSpravService.getMyCompanyId().subscribe(
        (data) => {
          this.myCompanyId=data as number;
          this.getCRUD_rights();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getCRUD_rights();
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==684)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==685)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==688)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==689)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==690)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==691)});
    
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    
    this.getData();
  }

  refreshPermissions(){
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    this.allowToView=((this.allowToViewAllCompanies)||(this.allowToViewMyCompany&&documentOfMyCompany))?true:false;
    this.allowToUpdate=((this.allowToUpdateAllCompanies)||(this.allowToUpdateMyCompany&&documentOfMyCompany))?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    this.rightsDefined=true;//!!!
    this.refreshTableColumns();
  // console.log("myCompanyId - "+this.myCompanyId);
  // console.log("documentOfMyCompany - "+documentOfMyCompany);
  // console.log("allowToView - "+this.allowToView);
  // console.log("allowToUpdate - "+this.allowToUpdate);
  // console.log("allowToCreate - "+this.allowToCreate);
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
    }
  }
  
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)//!!!!! отсюда загружаем настройки только если документ новый. Если уже создан - настройки грузятся из get<Document>ValuesById
      this.setDefaultCompany();
  }

  setDefaultCompany(){
    if(this.id==0){
      if(this.allowToCreateAllCompanies)
        this.formBaseInformation.get('company_id').setValue(Cookie.get('jobtitles_companyId')=="0"?this.myCompanyId:+Cookie.get('jobtitles_companyId'));
      else
        this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    }
    //this.getDepartmentsWithPartsList();
    this.refreshPermissions();
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getJobtitleValuesById?id='+this.id)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                //!!!
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  //this.getDepartmentsWithPartsList();
                  this.fillJobtitlesArray(documentValues.jobtitle_products);
                  // this.showSearchFormFields=false;
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }
  formingDepPartQttRowFromApiResponse(row: any) {


  }
  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertJobtitle', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                  switch(data){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.jobtitles')})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.jobtitles')})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.createdDocId=data as string [];
                      this.id=+this.createdDocId[0];
                      this.formBaseInformation.get('id').setValue(this.id);
                      this.afterCreateDoc();
                      this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
                  }
                }
              },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  updateDocument(){ 
      return this.http.post('/api/auth/updateJobtitle', this.formBaseInformation.value)
        .subscribe(
            (data) => 
            {   
              switch(data){
                case null:{// null возвращает если не удалось сохранить документ из-за ошибки
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.save_error')}});
                  break;
                }
                case -1:{//недостаточно прав
                  this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
                  break;
                }
                default:{// Документ успешно создался в БД 
                this.getData();
                this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
              }
            }
            // this.showSearchFormFields=false;
          },
          error => {/*this.showSearchFormFields=false;*/console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
        );
  } 

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  
  // Действия после создания нового документа
  afterCreateDoc(){
    this.id=+this.createdDocId;
    this._router.navigate(['/ui/jobtitlesdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.rightsDefined=false; //!!!
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/jobtitlesdoc',0]);
    this.id=0;
    this.formBaseInformation.reset();
    this.getControlTablefield().clear();
    this.formBaseInformation.get('id').setValue(null);
    this.getSetOfPermissions();//
  }


  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  onCompanyChange(){
    this.getControlTablefield().clear();
  }
  // *******************    Quantity by department parts    *******************

  fillJobtitlesArray(arr: any[]){
    this.getControlTablefield().clear();
    const add = this.formBaseInformation.get('jobtitleProductsFormTable') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
        product_id:       new UntypedFormControl (m.product_id,[]),               // id of the service
        name:             new UntypedFormControl (m.product_name, []),            // name of the service
        jobtitle_id:      new UntypedFormControl (this.id,       []),             
      }))
    })
  }

  formColumns(){
    this.displayedColumns=[];
    // if(this.editability)
        // this.displayedColumns.push('select');
    this.displayedColumns.push('name');
    if(this.editability/* && this.showSearchFormFields*/)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){ 
    const control = <UntypedFormArray>this.formBaseInformation.get('jobtitleProductsFormTable');
    return control;
  }
  trackByIndex(i: any) { return i; }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControlTablefield().clear();
      }});  
  }
  refreshTableColumns(){
    this.displayedColumns=[];
    setTimeout(() => { 
      this.formColumns();
    }, 1);
  }

  deleteJobtitleRow(row: any,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('jobtitleProductsFormTable');
          control.removeAt(index);
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
  get formBaseInformationValid() {return (this.getControlTablefield().valid);}
  isGroup(index, item): boolean{
      return item.isGroupBy;
  }
  openDialogProductCategoriesSelect(selection:string){
    let reportOnIds:number[]=[];
    const dialogSettings = this.productCategoriesSelectComponent.open(ProductCategoriesSelectComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '800px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        idTypes:    selection, // Что выбираем (Категории - categories, товары и услуги - products)
        companyId:  this.formBaseInformation.get('company_id').value, //предприятие, по которому будут отображаться товары и категории
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        result.map(i => {
          reportOnIds.push(i.id);
        });
        if(reportOnIds.length>0)
          this.getProductsInfoListByIds(selection,reportOnIds);
      }
    });
  }
  getProductsInfoListByIds(selection:string, ids: number[]){
    const body =  {
      companyId:this.formBaseInformation.get('company_id').value,         // предприятие, по которому идет запрос данных
      departmentId:0,                    // id отделения
      priceTypeId:0,                     // тип цены, по которому будут выданы цены
      reportOn:selection,                // по категориям или по товарам/услугам (categories, products)
      reportOnIds:ids                    // id категорий или товаров/услуг (того, что выбрано в reportOn)
    };
    this.http.post('/api/auth/getProductsInfoListByIds', body).subscribe(
      (data) => {   
        let filteredProducts=data as ProductSearchResponse[];
        if(filteredProducts.length>0){//несмотря на то, что сами id, по ним может ничего не вернуться, т.к. товары по запрошенным id могут быть не материальны (услуги), либо категории пустые/с нематериальными товарами
          filteredProducts.map(i=>{
            this.addProductRow(i);
          });
          setTimeout(() => {this.sortBy('name')},1);
        }
      },
    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }
  
  addProductRow(product:ProductSearchResponse){ 
    let thereSame:boolean=false;
    const control = <UntypedFormArray>this.formBaseInformation.get('jobtitleProductsFormTable');
    this.formBaseInformation.value.jobtitleProductsFormTable.map(i => 
    { // Существующий список не должен содержать одинаковые должности. Тут проверяем на это
      // Existed list shouldn't contain the same job titles. Here is checking about it
      if(+i['product_id'] == product.product_id)
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
      product_id:   new UntypedFormControl (id,[]),
      jobtitle_id:  new UntypedFormControl (this.id,[]),
      name:         new UntypedFormControl (name,[]),
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
    return this.formBaseInformation.get('jobtitleProductsFormTable') as UntypedFormArray;
  }
}
