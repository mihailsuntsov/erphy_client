import { ChangeDetectorRef, Component, EventEmitter, Inject, OnInit, Optional, Output, ViewChild} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { UntypedFormGroup, FormArray,  UntypedFormBuilder,  Validators, UntypedFormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ValidationService } from './validation.service';
import { ProductSearchAndTableComponent } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { BalanceKassaComponent } from 'src/app/modules/info-modules/balance/balance-kassa/balance-kassa.component';
import { v4 as uuidv4 } from 'uuid';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { graphviz }  from 'd3-graphviz';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { translate } from '@ngneat/transloco'; //+++
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++

interface DocResponse {//интерфейс для получения ответа в методе getDepositingValuesById
  id: number;
  company: string;
  company_id: number;
  department: string;
  department_id: number;
  creator: string;
  creator_id: number;
  master: string;
  master_id: number;
  kassa: string;
  kassa_id: number;
  orderout: string;
  orderout_id: number;
  boxoffice: string;
  boxoffice_id: number;
  summ: number; 
  doc_number: string;
  date_time_created: string;
  description : string;
  is_delivered: boolean;
  uid:string;
}

interface SecondaryDepartment{
  id: number;
  name: string;
  pricetype_id: number;
  reserved: number;
  total: number;
}

interface IdAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
interface IdNameDescription{
  id: number;
  name: string;
  description: string;
}
interface IdAndNameAndShortname{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  short_name: string;
}
interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}
interface LinkedDocs {//интерфейс для загрузки связанных документов
  id:number;
  doc_number:number;
  date_time_created:string;
  description:string;
  is_completed:boolean;
}
@Component({
  selector: 'app-depositing-doc',
  templateUrl: './depositing-doc.component.html',
  styleUrls: ['./depositing-doc.component.css'],
  providers: [LoadSpravService,Cookie,ProductSearchAndTableComponent,BalanceKassaComponent,CommonUtilitesService]
})
export class DepositingDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: number;//получение id созданного документа
  receivedCompaniesList: IdAndName [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  startProcess: boolean=true; // идеут стартовые запросы. после того как все запросы пройдут - будет false.
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)
  displayedColumns:string[];//отображаемые колонки таблицы с товарами
  fieldDataLoading=false; //загрузка списка касс или расч счетов
  kassaList:any[]=[];  // список касс ККМ по отделению
  boxoffices:any[]=[];// список касс предприятия (не путать с ККМ)
  rightsDefined:boolean; // определены ли права
  lastCheckedDocNumber:string=''; // последний проверенный номер (чтобы не отправлять запросы с одинаковыми номерами)
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, select - оконный режим выбора файлов
  accountingCurrency='';// short name of Accounting currency of user's company (e.g. $ or EUR)


  orderoutList: any[];               // список расходных ордеров, из которых поступили средства
  orderoutListLoading:  boolean = false; //загрузка списка расходных ордеров 


  //для загрузки связанных документов
  linkedDocsReturn:LinkedDocs[]=[];
  panelReturnOpenState=false;

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: UntypedFormGroup; //массив форм для накопления информации о Заказе покупателя
  formLinkedDocs: any;  // Форма для отправки при создании связанных документов

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToViewMyDocs:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToView:boolean = false;
  allowToCreate:boolean = false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ создаётся, или есть право на редактирование и документ создан

  //для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу)
  loadingDocsScheme:boolean = false;
  linkedDocsSchemeDisplayed:boolean = false;
  showGraphDiv:boolean=true;
  
  @ViewChild("doc_number", {static: false}) doc_number; //для редактирования номера документа
  @ViewChild(BalanceKassaComponent, {static: false}) public balanceKassaComponent:BalanceKassaComponent;  
  @ViewChild("form") private form; // связь с формой <form #form="ngForm" ...
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;

  routerAdditionalData: any; // объект с данными (отделение, касса, кассир) для создания документа из кассового модуля 

  constructor(private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: UntypedFormBuilder, //чтобы билдить группу форм depositingProductTable
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private _router:Router,
    public cu: CommonUtilitesService) 
    { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];
      // Документ создается путем открытия его модального окна из модуля кассы ККТ. В данном случае необходимо передать в документ все нужные данные, и "поселить" их тут
      // routerAdditionalData - объект с этими данными. 
      try{this.routerAdditionalData = this._router.getCurrentNavigation().extras.state.productdetails.queryParams;} catch (e) {this.routerAdditionalData=null;}
    }

  ngOnInit() {
    
    // console.log('--------**************************----------')
    // console.log(this.routerAdditionalData);
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl                 (this.id,[]),
      company_id: new UntypedFormControl         (null,[Validators.required]),
      department_id: new UntypedFormControl      (null,[Validators.required]),
      doc_number: new UntypedFormControl         ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      creator_id: new UntypedFormControl         ('',[]),
      kassa_id: new UntypedFormControl           ('',[Validators.required]),
      kassa: new UntypedFormControl              ('',[]),      
      boxoffice_id: new UntypedFormControl       ('',[Validators.required]),
      boxoffice: new UntypedFormControl          ('',[]),
      creator: new UntypedFormControl            ('',[]),
      balance_after: new UntypedFormControl      ('0.00',[Validators.pattern('^-?[0-9]{1,9}(?:[.,][0-9]{0,2})?\r?$'), ValidationService.numberNotNegative]),  // сколько останется в кассе после выемки
      description: new UntypedFormControl        ('',[]),
      department: new UntypedFormControl         ('',[]),
      orderout_id: new UntypedFormControl        ('',[Validators.required]),
      orderout: new UntypedFormControl           ('',[]),
      summ: new UntypedFormControl               ('0.00',[Validators.required, Validators.pattern('^-?[0-9]{1,9}(?:[.,][0-9]{0,2})?\r?$'), ValidationService.numberNotNegative]),
      is_delivered: new UntypedFormControl       (false,[]),
      is_completed: new UntypedFormControl       (true,[]), // Внесение всегда создается уже проведенной, ибо тут нет смысла делать лишние действия
      uid: new UntypedFormControl                ('',[]), // uid идентификатор для создаваемой Розн. продажи. Нужен для построения связанности между документами, или например, чтобы избежать дублей при создании
      linked_doc_id: new UntypedFormControl      ('',[]), // id связанного документа (того, из которого инициируется создание данного документа)
      parent_uid: new UntypedFormControl         ('',[]), // uid исходящего (родительского) документа
      child_uid: new UntypedFormControl          ('',[]), // uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      linked_doc_name: new UntypedFormControl    ('',[]), // имя (таблицы) связанного документа
      
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl                       ('',[]),
      master: new UntypedFormControl                   ('',[]),
      creator: new UntypedFormControl                  ('',[]),
      changer: new UntypedFormControl                  ('',[]),
      company: new UntypedFormControl                  ('',[]),
      date_time_created: new UntypedFormControl        ('',[]),
      date_time_changed: new UntypedFormControl        ('',[]),
    });
    // Форма для отправки при создании ПКО из кассы ККТ
    this.formLinkedDocs = new UntypedFormGroup({
      kassa_from_id: new UntypedFormControl      (null,[Validators.required]),
      company_id: new UntypedFormControl         (null,[Validators.required]),
      department_id: new UntypedFormControl      (null,[Validators.required]),
      summ: new UntypedFormControl               ('',[]),
      nds: new UntypedFormControl                (0,[]),
      description: new UntypedFormControl        ('',[]),
      boxoffice_id: new UntypedFormControl       (null,[]),
      depositing_id: new UntypedFormControl       (null,[]),
      internal: new UntypedFormControl           (false,[]),
      moving_type: new UntypedFormControl        ('',[]),
      is_completed: new UntypedFormControl       (false,[]),
      linked_doc_id: new UntypedFormControl      (null,[]),  // id связанного документа (в данном случае Внесение)
      parent_uid: new UntypedFormControl         (null,[]),  // uid родительского документа
      child_uid: new UntypedFormControl          (null,[]),  // uid дочернего документа
      linked_doc_name: new UntypedFormControl    (null,[]),  // имя (таблицы) связанного документа
      uid: new UntypedFormControl                ('',[]),    // uid создаваемого связанного документа
    });

    if(this.data) // когда открываем в модальном окне - получаем из блока кассы ККМ данные для заполения полей
      {
        this.mode=this.data.mode;
        this.formBaseInformation.get('company_id').setValue(this.data.company_id);
        this.formBaseInformation.get('department_id').setValue(this.data.department_id);
        this.formBaseInformation.get('creator_id').setValue(this.data.creator_id);
        this.formBaseInformation.get('kassa_id').setValue(this.data.kassa_id);
      }

    this.getSetOfPermissions();//
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
    this.getBaseData('myDepartmentsList');    
    this.getBaseData('accountingCurrency');  
  }
  //чтобы не было ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }
  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=46')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                  },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
                  );
  }

  refreshPermissions(){
    let documentOfMyCompany:boolean = (this.formBaseInformation.get('company_id').value==this.myCompanyId);
    let documentOfMyDepartments:boolean = (this.inMyDepthsId(+this.formBaseInformation.get('department_id').value));
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)||
      (this.allowToViewMyDepartments&&documentOfMyCompany&&documentOfMyDepartments)||
      (this.allowToViewMyDocs&&documentOfMyCompany&&documentOfMyDepartments&&(this.myId==this.creatorId))
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    
    this.editability=((this.allowToCreate && +this.id==0));
    
  	this.rightsDefined=true;//
    this.necessaryActionsBeforeGetChilds();
  }

  //нужно загруить всю необходимую информацию, прежде чем вызывать детей (Поиск и добавление товара, Кассовый модуль), иначе их ngOnInit выполнится быстрее, чем загрузится вся информация в родителе
  //вызовы из:
  //refreshPermissions()
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    //Если набрано необходимое кол-во действий для отображения модуля Формы поиска и добавления товара, и кассововго модуля
    if(this.actionsBeforeGetChilds==1){
      this.canGetChilds=true;
      this.startProcess=false;// все стартовые запросы прошли
    }
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
          this.getMyDepartmentsList();
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    else this.getMyDepartmentsList();
  }
  getMyDepartmentsList(){ //+++
    if(this.receivedMyDepartmentsList.length==0)
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.getCRUD_rights();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
    else this.getCRUD_rights();
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==576)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==577)});
    this.allowToCreateMyDepartments = this.permissionsSet.some(        function(e){return(e==578)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==579)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==580)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==581)});
    this.allowToViewMyDocs = this.permissionsSet.some(                 function(e){return(e==582)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;this.allowToCreateMyDepartments=true}
    if(this.allowToCreateMyCompany)this.allowToCreateMyDepartments=true;
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyCompany){this.allowToViewMyDepartments=true;this.allowToViewMyDocs=true}
    if(this.allowToViewMyDepartments)this.allowToViewMyDocs=true;
    this.getData();
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
    }
  }

  onCompanyChange(){
    this.formBaseInformation.get('department_id').setValue(null);
    this.formBaseInformation.get('kassa_id').setValue(null);
    this.formBaseInformation.get('kassa').setValue('');
    this.kassaList=[];
    
    this.actionsBeforeGetChilds=0;
    this.formAboutDocument.get('company').setValue(this.getCompanyNameById(this.formBaseInformation.get('company_id').value));
    this.getDepartmentsList();
    this.getBoxofficesList(); // список касс (состоящий из 1 кассы), к которой относится отделение
  }

  onDepartmentChange(){
    this.formBaseInformation.get('orderout_id').setValue(null);
    this.formBaseInformation.get('kassa_id').setValue(null);
    this.formBaseInformation.get('kassa').setValue('');
    this.formBaseInformation.get('department').setValue(this.getDepartmentNameById(this.formBaseInformation.get('department_id').value));
    this.getKassaListByDepartmentId();// список касс в отделении
  }
  getBoxofficesList(){
    return this.http.get('/api/auth/getBoxofficesList?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.boxoffices=data as any [];
          this.setDefaultBoxoffice();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  setDefaultBoxoffice(){
    if(+this.formBaseInformation.get('boxoffice_id').value==0 && this.boxoffices.length==1)
      this.formBaseInformation.get('boxoffice_id').setValue(this.boxoffices[0].id);

  }  
  getBoxofficeNameById(id:any):string{
    let name:string = translate('docs.msg.not_set');
    if(this.boxoffices){
      this.boxoffices.forEach(a=>{
        if(a.id==id) name=a.name;
      })}
    return(name);
  }
  onBoxofficeChange(){
    this.formBaseInformation.get('orderout_id').setValue(null);
    this.formBaseInformation.get('boxoffice').setValue(this.getBoxofficeNameById(this.formBaseInformation.get('boxoffice_id').value));
  }
  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(this.formBaseInformation.get('company_id').value,false)
      .subscribe(
          (data) => {this.receivedDepartmentsList=data as any [];
            this.doFilterDepartmentsList();
            if(+this.id==0) this.setDefaultDepartment();
            if(+this.formBaseInformation.get('department_id').value>0)
              this.getKassaListByDepartmentId();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  setDefaultDepartment(){
    //если в списке предприятий только одно предприятие - ставим его по дефолту
    if(+this.formBaseInformation.get('department_id').value==0 && this.receivedDepartmentsList.length==1){
      this.formBaseInformation.get('department_id').setValue(this.receivedDepartmentsList[0].id);
      this.getKassaListByDepartmentId();// список касс в отделении
    }
    this.refreshPermissions();
  }

  getKassaListByDepartmentId(){
    this.fieldDataLoading=true;
    return this.http.get('/api/auth/getKassaListByDepId?id='+this.formBaseInformation.get('department_id').value).subscribe(
      (data) => { 
        this.fieldDataLoading=false;
        this.kassaList=data as any [];
        this.setDefaultKassa();
      },
      error => {this.fieldDataLoading=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  setDefaultKassa(){
    //если в списке касс ККМ только одна касса - ставим её по дефолту
    if(+this.formBaseInformation.get('kassa_id').value==0 && this.kassaList.length==1){
      this.formBaseInformation.get('kassa_id').setValue(this.kassaList[0].id);
      this.getOrderoutListByBoxofficeId();
    }
  }
  // getKassaNameById(id:string):string{
  //   let name:string = 'Не установлено';
  //   if(this.kassaList){
  //     this.kassaList.forEach(a=>{
  //       if(a.id==id) name=a.name;
  //     })}
  //   return(name);
  // }

  onSelectKassa(id:number,name:string){
    this.formBaseInformation.get('orderout_id').setValue(null);
    this.formBaseInformation.get('kassa').setValue(name);
    this.formBaseInformation.get('kassa_id').setValue(id);
    this.getOrderoutListByBoxofficeId();
  }

  // проверки на различные случаи
  checkAnyCases(){
    //проверка на то, что отделение все еще числится в отделениях предприятия (не было удалено и т.д.)
    if(!this.inDepthsId(+this.formBaseInformation.get('department_id').value)){
      this.formBaseInformation.get('department_id').setValue(null);
    }
    //проверка на то, что отделение подходит под ограничения прав (если можно создавать только по своим отделениям, но выбрано отделение, не являющееся своим - устанавливаем null в выбранное id отделения)
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      if(!this.inMyDepthsId(+this.formBaseInformation.get('department_id').value)){
        this.formBaseInformation.get('department_id').setValue(null);
      }
    }
    if(this.startProcess) this.refreshPermissions();
  }
 
  doFilterCompaniesList(){
    let myCompany:IdAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    this.setDefaultCompany();
  }
  doFilterDepartmentsList(){
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
    // this.secondaryDepartments=this.receivedDepartmentsList;
  }
  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    let inMyDepthsId:boolean = false;
    this.receivedMyDepartmentsList.forEach(myDepth =>{
      myDepth.id==id?inMyDepthsId=true:null;
    });
  return inMyDepthsId;
  }
  inDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений предприятия
    let inDepthsId:boolean = false;
    
    this.receivedDepartmentsList.forEach(depth =>{
      console.log("depth.id - "+depth.id+", id - "+id)
      depth.id==id?inDepthsId=true:null;
      console.log("inDepthsId - "+inDepthsId);
    });
    console.log("returning inDepthsId - "+inDepthsId);
  return inDepthsId;
  }

  setDefaultCompany(){
    if(+this.formBaseInformation.get('company_id').value==0)
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.getDepartmentsList();    
    this.getBoxofficesList(); // список касс предприятия
  }

  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList)
      this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }

  //если новый документ - вставляем Отделение и Покупателя (но только если они принадлежат выбранному предприятию, т.е. предприятие в Основной информации и предприятие, для которого были сохранены настройки совпадают)
  setDefaultInfoOnStart(){
    if(+this.id==0){//документ новый 
      if(!this.routerAdditionalData){ // и создается из меню "Выемки" кнопкой "Создать"
        // this.formBaseInformation.get('company_id').setValue(this.settingsForm.get('companyId').value)
        // this.formBaseInformation.get('department_id').setValue(this.settingsForm.get('departmentId').value);
      } else { // создается из другого документа (например, из "Заказа покупателя"), и routerAdditionalData содержит информацию для нового документа Внесение
        this.formBaseInformation.get('company_id').setValue(this.routerAdditionalData.company_id);
        this.formBaseInformation.get('department_id').setValue(this.routerAdditionalData.department_id);
        this.formBaseInformation.get('kassa_id').setValue(this.routerAdditionalData.kassa_id);
        this.formBaseInformation.get('creator_id').setValue(this.routerAdditionalData.creator_id);
        this.formBaseInformation.get('creator').setValue(this.routerAdditionalData.creator);
      }
    }
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getDepositingValuesById?id='+ this.id)
        .subscribe(
            data => { 
              
                let documentValues: DocResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                if(data!=null&&documentValues.company_id!=null){//!!!

                  //Заполнение формы из интерфейса documentValues:
                  this.formAboutDocument.get('id').setValue(+documentValues.id);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue('');
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                  this.formBaseInformation.get('kassa_id').setValue(documentValues.kassa_id);
                  this.formBaseInformation.get('kassa').setValue(documentValues.kassa);
                  this.formBaseInformation.get('orderout_id').setValue(documentValues.orderout_id);
                  this.formBaseInformation.get('orderout').setValue(documentValues.orderout);
                  this.formBaseInformation.get('boxoffice_id').setValue(documentValues.boxoffice_id);
                  this.formBaseInformation.get('boxoffice').setValue(documentValues.boxoffice);
                  this.formBaseInformation.get('department_id').setValue(documentValues.department_id);
                  this.formBaseInformation.get('department').setValue(documentValues.department);
                  this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formBaseInformation.get('summ').setValue(this.numToPrice(documentValues.summ,2));
                  this.formBaseInformation.get('is_delivered').setValue(documentValues.is_delivered);
                  this.formBaseInformation.get('uid').setValue(documentValues.uid);
                  this.creatorId=+documentValues.creator_id;
                  this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                  this.getDepartmentsList();//отделения
                  this.getKassaListByDepartmentId();// список касс в отделении
                  this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                  this.refreshPermissions();//пересчитаем права
                  this.getBoxofficesList(); // список касс предприятия
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }


  EditDocNumber(): void {
    if(+this.id==0){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: translate('docs.msg.doc_num_head'),
          query: translate('docs.msg.doc_num_query'),
          warning: translate('docs.msg.doc_num_warn')
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.doc_number_isReadOnly = false ;
          setTimeout(() => { this.doc_number.nativeElement.focus(); }, 500);}
      });  
    } 
  }

  checkDocNumberUnical(tableName:string) { //+++
    let docNumTmp=this.formBaseInformation.get('doc_number').value;
    setTimeout(() => {
      if(!this.formBaseInformation.get('doc_number').errors && this.lastCheckedDocNumber!=docNumTmp && docNumTmp!='' && docNumTmp==this.formBaseInformation.get('doc_number').value)
        {
          let Unic: boolean;
          this.isDocNumberUnicalChecking=true;
          this.lastCheckedDocNumber=docNumTmp;
          return this.http.get('/api/auth/isDocumentNumberUnical?company_id='+this.formBaseInformation.get('company_id').value+'&doc_number='+this.formBaseInformation.get('doc_number').value+'&doc_id='+this.id+'&table='+tableName)
          .subscribe(
              (data) => {   
                          Unic = data as boolean;
                          if(!Unic)this.MessageDialog.open(MessageDialog,{width:'400px',data:{head: translate('docs.msg.attention'),message: translate('docs.msg.num_not_unic'),}});
                          this.isDocNumberUnicalChecking=false;
                      },
              error => {console.log(error);this.isDocNumberUnicalChecking=false;}
          );
        }
    }, 1000);
  }

  //создание нового документа Внесение
 createNewDocument(){
  this.createdDocId=null;
  this.formBaseInformation.get('uid').setValue(uuidv4());
  this.http.post('/api/auth/insertDepositing', this.formBaseInformation.value)
    .subscribe(
    (data) => {
                this.actionsBeforeGetChilds=0;
                this.createdDocId=data as number;
                switch(this.createdDocId){
                  case null:{// null возвращает если не удалось создать документ из-за ошибки
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.depositing')})}});
                    break;
                  }
                  case -1:{//недостаточно прав
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.depositing')})}});
                    break;
                  }
                  case -30:{//недостаточно средств в кассе
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_money',{name:translate('docs.docs.depositing')})}});
                    break;
                  }
                  case -31:{//Документ-отправитель внутреннего платежа не проведён (например, проводим приходный ордер, но незадолго до этого у исходящего платежа сняли проведение)
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.sender_n_comp')}});
                    break;
                  }
                  case -40:{//дублирование исходящего платежа (Входящий платеж с данным расходным ордером уже проведён)
                    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.pi_w_oo_compl')}});
                    break;
                  }
                  default:{// Внесение успешно создалась в БД 
                    this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.depositing')}), translate('docs.msg.close'));
                    this.afterCreateDepositing();
                  }
                }
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  afterCreateDepositing(){//
    // Сначала обживаем текущий документ:
    this.id=+this.createdDocId;
    this._router.navigate(['/ui/depositingdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);    
    this.getData();
    this.balanceKassaComponent.getBalance();//пересчитаем баланс кассы ККМ (ведь из нее изъяли деньги, и баланс уменьшился)
  }

  // updateDocument(onChequePrinting?:boolean){ 
  //   return this.http.post('/api/auth/updateDepositing',  this.formBaseInformation.value)
  //     .subscribe(
  //         (data) => 
  //         {   
  //           let response=data as any;
  //           this.getData();
  //           this.openSnackBar("Документ \"Внесение\" сохранён", "Закрыть");
  //           if(response.fail_to_reserve>0){//если у 1 или нескольких позиций резервы при сохранении были отменены
  //             this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:
  //             'У некоторых позиций не был сохранён резерв, т.к. он превышал заказываемое либо доступное количество товара'
  //             }});
  //           }
  //         },
  //         error => {
  //           this.showQueryErrorMessage(error);
  //           },
  //     );
  // } 

  showQueryErrorMessage(error:any){
    console.log(error);
      let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      this.MessageDialog.open(MessageDialog,
      {
        width:'400px',
        data:{
          head:translate('docs.msg.error'),
          message:errMsg}
      })
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  //создание нового документа после завершения текущего
  goToNewDocument(){
      this._router.navigate(['ui/depositingdoc',0]);
      this.id=0;      
      this.form.resetForm();
      this.formBaseInformation.get('id').setValue(0);
      this.formBaseInformation.get('uid').setValue('');
      this.receivedCompaniesList=[];
      this.receivedDepartmentsList=[];
      this.kassaList=[];
      this.boxoffices=[];
      this.formBaseInformation.get('is_delivered').setValue(false);
      this.formBaseInformation.get('kassa_id').setValue(null);     
      this.formBaseInformation.get('kassa').setValue('');
      this.formBaseInformation.get('company_id').setValue(null);      
      this.formAboutDocument.get('company').setValue('');
      this.formBaseInformation.get('department_id').setValue(null);
      this.formBaseInformation.get('department').setValue('');
      this.formBaseInformation.get('boxoffice_id').setValue(null);
      this.formBaseInformation.get('boxoffice').setValue('');
      this.formBaseInformation.get('doc_number').setValue('');
      this.formBaseInformation.get('description').setValue('');  
      this.formBaseInformation.get('summ').setValue(0);
      this.formBaseInformation.get('balance_after').setValue(0);
      this.getLinkedDocsScheme(true);
      this.actionsBeforeGetChilds=0;
      this.startProcess=true;
      this.getData();
  }

getOrderoutListByBoxofficeId(){
    if(+this.formBaseInformation.get('boxoffice_id').value>0 && +this.id==0){
      this.orderoutListLoading=true;
      this.http.get('/api/auth/getOrderoutList?boxoffice_id='+this.formBaseInformation.get('boxoffice_id').value+
      "&recipient_id="+this.formBaseInformation.get('kassa_id').value).subscribe(
        (data) => { 
          this.orderoutListLoading=false;
          this.orderoutList=data as any [];
          this.setDefaultOrderout();
        },
        error => {this.orderoutListLoading=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
    }
  } 

  setDefaultOrderout(){
    if(+this.formBaseInformation.get('orderout_id').value==0 && this.orderoutList.length==1){
      this.formBaseInformation.get('orderout_id').setValue(this.orderoutList[0].id);
      this.onSelectOrderout(this.orderoutList[0].doc_number,this.orderoutList[0].summ);
      setTimeout(() => {this.onChangeDepositingSumm();}, 1000);   // иногда пересчёт не отрабатывает, хз почему, приходится еще раз вызывать
    }
  }

  onSelectOrderout(orderoutName:any,summ:number){
    this.formBaseInformation.get('orderout').setValue(orderoutName);
    this.formBaseInformation.get('summ').setValue(this.numToPrice(summ,2));
    this.onChangeDepositingSumm();
  }
//**********************************************************************************************************************************************/  
//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/
//**********************************************************************************************************************************************/  

  createLinkedDoc(docname:string){// принимает аргументы: Return
    let uid = uuidv4();
    let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDoc.can){
     
      this.formLinkedDocs.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formLinkedDocs.get('summ').setValue(this.formBaseInformation.get('summ').value);
      this.formLinkedDocs.get('description').setValue(translate('docs.msg.created_from')+translate('docs.docs.depositing')+' '+translate('docs.top.number')+this.formBaseInformation.get('doc_number').value);
      this.formLinkedDocs.get('is_completed').setValue(false);
      this.formLinkedDocs.get('uid').setValue(uid);
      this.formLinkedDocs.get('linked_doc_id').setValue(this.id);//id связанного документа (того, из которого инициируется создание данного документа)
      this.formLinkedDocs.get('linked_doc_name').setValue('depositing');//имя (таблицы) связанного документа
      this.formLinkedDocs.get('parent_uid').setValue(this.formBaseInformation.get('uid').value);// uid исходящего (родительского) документа
      this.formLinkedDocs.get('child_uid').setValue(uid);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      // параметры для входящих ордеров и платежей (Paymentin, Orderin)
      if(docname=='Paymentin'||docname=='Orderin'){        
        this.formLinkedDocs.get('kassa_from_id').setValue(this.formBaseInformation.get('kassa_id').value);
        this.formLinkedDocs.get('internal').setValue(true);
        this.formLinkedDocs.get('moving_type').setValue('kassa');// тип перевода  -  из : кассы - boxoffice, счёта - account, kassa - касса ККМ 
        this.formLinkedDocs.get('boxoffice_id').setValue(this.formBaseInformation.get('boxoffice_id').value); // в какую кассу предприятия переводим
        this.formLinkedDocs.get('depositing_id').setValue(this.id); // id-номер выемки 
        this.formLinkedDocs.get('nds').setValue(0);      
      }
      this.http.post('/api/auth/insert'+docname, this.formLinkedDocs.value)
      .subscribe(
      (data) => {
                  let createdDocId=data as number;
                
                  switch(createdDocId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.'+this.cu.getDocNameByDocAlias(docname))})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.'+this.cu.getDocNameByDocAlias(docname))})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.'+this.cu.getDocNameByDocAlias(docname))}), translate('docs.msg.close'));
                      this.getLinkedDocsScheme(true);//обновляем схему этого документа
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:canCreateLinkedDoc.reason}});
  }

  // можно ли создать связанный документ (да - если есть товары, подходящие для этого, и нет уже завершённого документа)
  canCreateLinkedDoc(docname:string):CanCreateLinkedDoc{
      return {can:true, reason:''};
  }

//******************************************************** ДИАГРАММА СВЯЗЕЙ ************************************************************/
  myTabFocusChange(changeEvent: MatTabChangeEvent) {
    console.log('Tab position: ' + changeEvent.tab.position);
  }  
  myTabSelectedIndexChange(index: number) {
    console.log('Selected index: ' + index);
    this.tabIndex=index;
  }
  myTabSelectedTabChange(changeEvent: MatTabChangeEvent) {
    console.log('Index: ' + changeEvent.index);
  }  
  myTabAnimationDone() {
    console.log('Animation is done.');
    if(this.tabIndex==1)  {
      if(!this.linkedDocsSchemeDisplayed) {
        this.loadingDocsScheme=true;
        setTimeout(() => {
            this.drawLinkedDocsScheme(); 
          }, 1);   
      }      
    }    
  }
  getLinkedDocsScheme(draw?:boolean){
    let result:any;
    this.loadingDocsScheme=true;
    this.linkedDocsSchemeDisplayed = false;
    this.linkedDocsText ='';
    this.loadingDocsScheme=true;
    this.http.get('/api/auth/getLinkedDocsScheme?uid='+this.formBaseInformation.get('uid').value)
      .subscribe(
          data => { 
            result=data as any;
            
            if(result==null){
              this.loadingDocsScheme=false;
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.err_load_lnkd')}});
            } else if(result.errorCode==0){//нет результата
              this.linkedDocsSchemeDisplayed = true;
              this.loadingDocsScheme=false;
            } else {
              this.linkedDocsCount=result.count==0?result.count:result.count-1;// т.к. если документ в группе будет только один (данный) - result.count придёт = 1, т.е. связанных нет. Если документов в группе вообще нет - придет 0.
              this.linkedDocsText = result.text;
              if(draw)
                this.drawLinkedDocsScheme()
              else
                this.loadingDocsScheme=false;
            } 
        },
        error => {this.loadingDocsScheme=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  drawLinkedDocsScheme(){
    if(this.tabIndex==1){
      try{
        console.log(this.linkedDocsText);
        this.loadingDocsScheme=false;
        this.linkedDocsSchemeDisplayed = true;
        this.showGraphDiv=false;
        setTimeout(() => {
          this.showGraphDiv=true;
          setTimeout(() => {
            graphviz("#graph").renderDot(this.linkedDocsText);
            }, 1);
          }, 1);
      } catch (e){
        this.loadingDocsScheme=false;
        console.log(e.message);
      }
    } else this.loadingDocsScheme=false;
  }

  getCompanyNameById(id:number):string{
    let name:string;
    if(this.receivedCompaniesList){
      this.receivedCompaniesList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  getDepartmentNameById(id:number):string{
    let name:string;
    if(this.receivedDepartmentsList){
      this.receivedDepartmentsList.forEach(a=>{
        if(a.id==id) name=a.name;
      })
    }
    return(name);
  }
  onChangeDepositingSumm(){
    +this.formBaseInformation.get('balance_after').setValue((+this.balanceKassaComponent.balance+(+this.formBaseInformation.get('summ').value)).toFixed(2));
    if(isNaN(this.formBaseInformation.get('balance_after').value)) this.formBaseInformation.get('balance_after').setValue(0);
  }

  decompleteDocument(){
    this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.cant_decmp_dp')}});
  }
  //------------------------------------------ COMMON UTILITIE   -----------------------------------------
  commaToDot(fieldName:string){
    this.formBaseInformation.get(fieldName).setValue(this.formBaseInformation.get(fieldName).value.toString().replace(",", "."));}
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
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
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}

