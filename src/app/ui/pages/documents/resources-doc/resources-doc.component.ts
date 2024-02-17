import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ValidationService } from './validation.service';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++

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
  dep_parts: any[]; // quantity of this resource in each department part
}
interface resourcesList {//интерфейс массива для получения всех статусов текущего документа
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
  selector: 'app-resources-doc',
  templateUrl: './resources-doc.component.html',
  styleUrls: ['./resources-doc.component.css'],
  providers: [LoadSpravService,]
})
export class ResourcesDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsWithPartsList: any [] = [];//массив для получения списка отделений с их частями
  receivedDepartmentPartsWithResourceQtt: any [] = [];//массив для получения списка отделений с их частями и кол-вом ресурса в каждой из них
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
  resourcesList : resourcesList [] = []; //массив для получения всех статусов текущего документа
  gettingTableData: boolean = false;//идет загрузка товарных позиций
  tableDisplayInformation:any;//форма-обёртка для массива форм departmentPartsTable (нужна для вывода таблицы)
  row_id:number=0;// уникальность строки в табл. товаров только id товара обеспечить не может, т.к. в таблице может быть > 1 одинакового товара (уникальность обеспечивается id товара и id склада). Для уникальности используем виртуальный row_id
  formSearch:any;// форма для формирования строки таблицы
  selectedDepartmentName='';
  selectedDepartmentPartName='';
  showSearchFormFields:boolean = false;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    public ConfirmDialog: MatDialog,
    private _router:Router,
    private _fb: UntypedFormBuilder, //чтобы билдить группу форм myForm: FormBuilder, //для билдинга групп форм по контактным лицам и банковским реквизитам
    private _snackBar: MatSnackBar) { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {

    this.tableDisplayInformation = new UntypedFormGroup({
      departmentPartsTable: new UntypedFormArray([]),
    });
    this.formSearch = new UntypedFormGroup({
      id: new UntypedFormControl ('0' ,[Validators.required]),      // id of selected department part
      name: new UntypedFormControl ('' ,[Validators.required]),   // name of selected department part
      resource_qtt: new UntypedFormControl (0 ,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      department_id: new UntypedFormControl ('',[]),
      department_name: new UntypedFormControl ('',[]),
    });
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      name: new UntypedFormControl      ('',[Validators.required]),
      description: new UntypedFormControl      ('',[]),
      departmentPartsTable: new UntypedFormArray([]),
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
      this.loadSpravService.getCompaniesList()
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
      this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getMyCompanyId();
  }
  getMyCompanyId(){ //+++
    if(+this.myCompanyId==0)
      this.loadSpravService.getMyCompanyId().subscribe(
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
        this.formBaseInformation.get('company_id').setValue(Cookie.get('resources_companyId')=="0"?this.myCompanyId:+Cookie.get('resources_companyId'));
      else
        this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    }
    this.getDepartmentsWithPartsList();
    this.refreshPermissions();
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getResourceValuesById?id='+this.id)
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
                  // this.formBaseInformation.get('departmentPartsTable').setValue(documentValues.dep_parts);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.getDepartmentsWithPartsList();
                  this.fillDepartmentPartsArray(documentValues.dep_parts);
                  this.showSearchFormFields=false;
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
                this.refreshTableData();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }
  formingDepPartQttRowFromApiResponse(row: any) {


  }
  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertResource', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                  switch(data){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.edizm')})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.edizm')})}});
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
      return this.http.post('/api/auth/updateResource', this.formBaseInformation.value)
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
            this.showSearchFormFields=false;
          },
          error => {this.showSearchFormFields=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
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
    this._router.navigate(['/ui/resourcesdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.rightsDefined=false; //!!!
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/resourcesdoc',0]);
    this.id=0;
    this.formBaseInformation.reset();
    this.formBaseInformation.get('departmentPartsTable').clear();
    this.tableDisplayInformation.get('departmentPartsTable').clear();
    this.formBaseInformation.get('id').setValue(null);
    this.getSetOfPermissions();//
  }


  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }

  onCompanyChange(){
    this.formBaseInformation.get('departmentPartsTable').clear();
    this.tableDisplayInformation.get('departmentPartsTable').clear();
    this.getDepartmentsWithPartsList();
  }
  // *******************    Quantity by department parts    *******************

  // list for select part
  getDepartmentsWithPartsList(){ 
    return this.http.get('/api/auth/getDepartmentsWithPartsList?company_id='+this.formBaseInformation.get('company_id').value)
      .subscribe(
          (data) => {   
                      this.receivedDepartmentsWithPartsList=data as any [];
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }
  // Loading all parts containing information about the quantity of resource in them
  /*getDepartmentPartsWithResourceQttList(){
    let resultContainer: any[];
    this.gettingTableData=true;
    return this.http.get('/api/auth/getDepartmentPartsWithResourceQttList2?company_id='+this.formBaseInformation.get('company_id').value+'&resource_id='+this.id)
      .subscribe(
          (data) => {   
            this.gettingTableData=false;
            resultContainer=data as any [];
            this.fillDepartmentPartsArray(resultContainer);
      },
      error => {this.gettingTableData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
      );
  }*/
  fillDepartmentPartsArray(arr: any[]){
    this.tableDisplayInformation.get('departmentPartsTable').clear();
    const add = this.formBaseInformation.get('departmentPartsTable') as UntypedFormArray;
    add.clear();
    arr.forEach(m =>{
      add.push(this._fb.group({
        id:               m.id,               // id of the part
        name:             m.name,             // name of the part
        description:      m.description,      // description of the part        
        department_id:    m.department_id,    // parent department Id of the part 
        department_name:  m.department_name,  // parent department name of the part 
        is_active:        m.is_active,        // is the part active?
        resource_qtt:     m.resource_qtt      // quantity of resource in this part
      }))
    })
  }

  formColumns(){
    this.displayedColumns=[];
    // if(this.editability)
        // this.displayedColumns.push('select');
    this.displayedColumns.push('name','resource_qtt');
    if(this.editability && this.showSearchFormFields)
      this.displayedColumns.push('delete');
  }
  getControlTablefield(){ 
    const control = <UntypedFormArray>this.tableDisplayInformation.get('departmentPartsTable');
    return control;
  }
  trackByIndex(i: any) { return i; }
  clearTable(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',data:{head: translate('docs.msg.prod_list_cln'),warning: translate('docs.msg.prod_list_qry'),query: ''},});
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.getControlTablefield().clear();
        this.formBaseInformation.get('departmentPartsTable').clear();
      }});  
  }
  refreshTableColumns(){
    this.displayedColumns=[];
    setTimeout(() => { 
      this.formColumns();
    }, 1);
  }

  deleteProductRow(row: any,index:number) {
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
        const control = <UntypedFormArray>this.formBaseInformation.get('departmentPartsTable');
          control.removeAt(this.getIndexExcludeGroupRows(<UntypedFormArray>this.tableDisplayInformation.get('departmentPartsTable'),'id',row.id));
          this.refreshTableData();
          this.refreshTableColumns();//чтобы глючные input-поля в таблице встали на свои места. Это у Ангуляра такой прикол
      }
    }); 
  }

  syncTableAndDataFields(row: any,index:number):void{
    const control = <UntypedFormArray>this.formBaseInformation.get('departmentPartsTable');
    let realIndex = this.getIndexExcludeGroupRows(<UntypedFormArray>this.tableDisplayInformation.get('departmentPartsTable'),'id',row.id);
    console.log('row.resource_qtt='+row.resource_qtt)
    console.log(realIndex)
    console.log(control.value[realIndex]['resource_qtt'])
    control.at(realIndex).get('resource_qtt').setValue(row.resource_qtt);
  }

  addProductRow() 
  { 
    let thereSamePart:boolean=false;
    this.tableDisplayInformation.value.departmentPartsTable.map(i => 
    { // Cписок не должен содержать одинаковые части отделений. Тут проверяем на это
      // Table shouldn't contain the same departments parts. Here is checking about it
      if(+i['id']==this.formSearch.get('id').value)
      {
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('modules.msg.record_in_list'),}});
        thereSamePart=true; 
      }
    });
    if(!thereSamePart){
      const control = <UntypedFormArray>this.formBaseInformation.get('departmentPartsTable');
      control.push(this.formingProductRowFromSearchForm());
    }
    // Sorting this array of objects by Department names for group displaying table by department names
    this.formBaseInformation.value.departmentPartsTable.sort((a: any, b: any) => {
      // alert(a['department_name']+', '+b['department_name'])
      const nameA = a['department_name']; // ignore upper and lowercase
      const nameB = b['department_name']; // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      // names must be equal
      return 0;
    });
     this.refreshTableData();
     this.resetFormSearch();//подготовка формы поиска к дальнейшему вводу товара
  }

  refreshTableData(){
    let lastDepId:number    = 0;
    let currentDepId:number = 0;
    let currentDepName      = '';
    const control=<UntypedFormArray>this.tableDisplayInformation.get('departmentPartsTable');
    //while (control.length !== 0) {control.removeAt(0)}
    control.clear();
    setTimeout(() => { // else control will be only on the last row. There is a bug in Angular: after control.clear() you fill the FormArray and it set the control only on the last row
      this.formBaseInformation.value.departmentPartsTable.map(i => 
      {
        currentDepId =  +i['department_id'];
        currentDepName = i['department_name'];
        if(currentDepId != lastDepId) { // department has been changed
            control.push(this._fb.group({initial: currentDepName, isGroupBy: true}));
        }
        control.push(this._fb.group({
          id: new UntypedFormControl (i.id,[]),
          row_id: [i.row_id],
          name:  new UntypedFormControl (i.name,[]),
          resource_qtt:  new UntypedFormControl (i.resource_qtt,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
          department_id: new UntypedFormControl (i.department_id,[]),
          department_name: new UntypedFormControl (i.department_name,[]),
        }));
        lastDepId = currentDepId;
      });
    }, 1);

  }

  //формирование строки таблицы с товарами для заказа покупателя из формы поиска товара
  formingProductRowFromSearchForm() {
    return this._fb.group({
      id: new UntypedFormControl (this.formSearch.get('id').value,[]),
      row_id: [this.getRowId()],
      name:  new UntypedFormControl (this.formSearch.get('name').value,[]),
      resource_qtt:  new UntypedFormControl (+this.formSearch.get('resource_qtt').value,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
      department_id: new UntypedFormControl (this.formSearch.get('department_id').value,[]),
      department_name: new UntypedFormControl (this.formSearch.get('department_name').value,[]),
    });
  }
  resetFormSearch(){
    this.formSearch.get('id').setValue('0');
    this.formSearch.get('resource_qtt').setValue('0');
    this.formSearch.get('name').setValue('');
    this.formSearch.get('department_id').setValue('');
    this.formSearch.get('department_name').setValue('');
  }
  getRowId():number{
    let current_row_id:number=this.row_id;
    this.row_id++;
    return current_row_id;
  }
  isInteger (i:number):boolean{return Number.isInteger(i)}
  parseFloat(i:string){return parseFloat(i)}
  get formBaseInformationValid() {return (this.getControlTablefield().valid);}

  

  // formingDataRowFromDisplayTable(row: any) {
  //   return this._fb.group({
  //     id: new UntypedFormControl (row.id,[]),
  //     row_id: [row.row_id],
  //     name:  new UntypedFormControl (row.name,[]),
  //     resource_qtt:  new UntypedFormControl (row.resource_qtt,[Validators.required,Validators.pattern('^[0-9]{1,5}$'),Validators.maxLength(5),Validators.minLength(1)]),
  //     department_id: new UntypedFormControl (row.department_id,[]),
  //     department_name: new UntypedFormControl (row.department_name,[]),
  //   });
  // }



  isGroup(index, item): boolean{
      return item.isGroupBy;
  }

  // Table builds by formGroup "tableDisplayInformation.departmentPartsTable". It has group rows with Department parts names. These rows also have an index (i); 
  // If delete row by index in formGroup "formBaseInformation.departmentPartsTable", wrong rows will be deleted because this formGroup hasn't group rows.
  // This method returns right index, without group rows.

                            //formGroup for display table
  getIndexExcludeGroupRows(table:UntypedFormArray, field_name:string, value:any): number{
    let index=0;
    let result = 0;
    // console.log('Searching the '+ field_name+' with value = ' + value);
    table.value.map(i =>{
      if(!this.isGroup(0,i)){
        // console.log("*** no group! ***");
        // console.log('Now '+ field_name + ' = ' + i[field_name])
        if(i[field_name]==value){
          // console.log("*** FOUND! *** and index = " + index);
          result = index;
        }
        index++;
      }
    }); 
    return result;
  }

}
