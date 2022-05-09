import { ChangeDetectorRef, Component, EventEmitter, Inject, OnInit, Optional, Output, ViewChild} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TemplatesDialogComponent } from 'src/app/modules/settings/templates-dialog/templates-dialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
// import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsVatinvoiceinDialogComponent } from 'src/app/modules/settings/settings-vatinvoicein-dialog/settings-vatinvoicein-dialog.component';
import { BalanceCagentComponent } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { graphviz }  from 'd3-graphviz';
import { FilesComponent } from '../files/files.component';
import { FilesDocComponent } from '../files-doc/files-doc.component';
import { translate } from '@ngneat/transloco'; //+++

import { MomentDefault } from 'src/app/services/moment-default';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
const MY_FORMATS = MomentDefault.getMomentFormat();
const moment = MomentDefault.getMomentDefault();

interface DocResponse {//интерфейс для получения ответа в методе getVatinvoiceinValuesById
  id: number;
  company: string;
  company_id: string;
  creator: string;
  creator_id: string;
  cagent: string;
  cagent_id: string;
  master: string;
  master_id: string;
  is_completed: boolean;
  changer:string;
  changer_id: string;
  doc_number: string;
  summ:          number;
  paydoc_number: string;
  paydoc_date:   string;
  date_time_changed: string;
  date_time_created: string;
  description : string;
  is_archive: boolean;
  status_id: number;
  status_name: string;
  status_color: string;
  status_description: string;
  uid:string;
}
interface FilesInfo {
  id: string;
  name: string;
  original_name: string;
  date_time_created: string;
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
interface StatusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
interface LinkedDocs {//интерфейс для загрузки связанных документов
  id:number;
  doc_number:number;
  date_time_created:string;
  description:string;
  is_completed:boolean;
}
interface CanCreateLinkedDoc{//интерфейс ответа на запрос о возможности создания связанного документа
  can:boolean;
  reason:string;
}

interface TemplatesList{
    id: number;                   // id из таблицы template_docs
    company_id: number;           // id предприятия, для которого эти настройки
    template_type_name: string;   // наименование шаблона. Например, Товарный чек
    template_type: string;        // обозначение типа шаблона. Например, для товарного чека это product_receipt
    template_type_id: number;     // id типа шаблона
    file_id: number;              // id из таблицы files
    file_name: string;            // наименование файла как он хранится на диске
    file_original_name: string;   // оригинальное наименование файла
    document_id: number;          // id документа, в котором будет возможность печати данного шаблона (соответствует id в таблице documents)
    is_show: boolean;             // показывать шаблон в выпадающем списке на печать
    output_order: number;         // порядок вывода наименований шаблонов в списке на печать
}

@Component({
  selector: 'app-vatinvoicein-doc',
  templateUrl: './vatinvoicein-doc.component.html',
  styleUrls: ['./vatinvoicein-doc.component.css'],
  providers: [LoadSpravService, CommonUtilitesService,BalanceCagentComponent,
    { provide: DateAdapter, useClass: MomentDateAdapter,deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, //+++
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class VatinvoiceinDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: number;//получение id созданного документа
  receivedCompaniesList: IdAndName [] = [];//массив для получения списка предприятий
  receivedStatusesList: StatusInterface [] = []; // массив для получения статусов
  myCompanyId:number=0;
  myId:number=0;
  filesInfo : FilesInfo [] = []; //массив для получения информации по прикрепленным к документу файлам 
  creatorId:number=0;
  startProcess: boolean=true; // идеут стартовые запросы. после того как все запросы пройдут - будет false.
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)
  spravSysEdizmOfProductAll: IdAndNameAndShortname[] = [];// массив, куда будут грузиться все единицы измерения товара
  receivedPriceTypesList: IdNameDescription [] = [];//массив для получения списка типов цен
  canEditCompAndDepth=true;
  mode: string = 'standart';  // режим работы документа: standart - обычный режим, window - оконный режим просмотра

  //для загрузки связанных документов
  linkedDocsReturn:LinkedDocs[]=[];
  panelReturnOpenState=false;

  //печать документов
  gettingTemplatesData: boolean = false; // идёт загрузка шаблонов
  templatesList:TemplatesList[]=[]; // список загруженных шаблонов

  // Формы
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)
  formBaseInformation: FormGroup; //массив форм для накопления информации о Возврате поставщику
  settingsForm: any; // форма с настройками
  formLinkedDocs: any;  // Форма для отправки при создании связанных документов

  //для построения диаграмм связанности
  tabIndex=0;// индекс текущего отображаемого таба (вкладки)
  linkedDocsCount:number = 0; // кол-во документов в группе, ЗА ИСКЛЮЧЕНИЕМ текущего
  linkedDocsText:string = ''; // схема связанных документов (пример - в самом низу)
  loadingDocsScheme:boolean = false;
  linkedDocsSchemeDisplayed:boolean = false;
  showGraphDiv:boolean=true;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCompleteAllCompanies:boolean = false;
  allowToCompleteMyCompany:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToComplete:boolean = false;
  showOpenDocIcon:boolean=false;
  editability:boolean = false;//редактируемость. true если есть право на создание и документ создаётся, или есть право на редактирование и документ создан

  rightsDefined:boolean; // определены ли права !!!
  lastCheckedDocNumber:string=''; //!!!

  isDocNumberUnicalChecking = false;//идёт ли проверка на уникальность номера
  doc_number_isReadOnly=true;
  @ViewChild("doc_number", {static: false}) doc_number; //для редактирования номера документа
  @ViewChild("form", {static: false}) form; // связь с формой <form #form="ngForm" ...
  @ViewChild(BalanceCagentComponent, {static: false}) public balanceCagentComponent:BalanceCagentComponent;
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(private activateRoute: ActivatedRoute,
    private cdRef:ChangeDetectorRef,
    private _fb: FormBuilder, //чтобы билдить группу форм vatinvoiceinProductTable    
    public SettingsVatinvoiceinDialogComponent: MatDialog,
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    private templatesDialogComponent: MatDialog,
    public dialogAddFiles: MatDialog,
    private commonUtilites: CommonUtilitesService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private _router:Router,
    private _adapter: DateAdapter<any>) 
    { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];
    }

  ngOnInit(): void {
    this.formBaseInformation = new FormGroup({
      id: new FormControl                       (this.id,[]),
      company_id: new FormControl               ('',[Validators.required]),
      cagent_id: new FormControl                ('',[Validators.required]),
      doc_number: new FormControl               ('',[Validators.maxLength(10),Validators.pattern('^[0-9]{1,10}$')]),
      description: new FormControl              ('',[]),
      cagent: new FormControl                   ('',[]),
      summ: new FormControl                     ('',[Validators.required, Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      paydoc_number: new FormControl            ('',[]),
      paydoc_date: new FormControl              ('',[]),
      status_id: new FormControl                ('',[]),
      status_name: new FormControl              ('',[]),
      status_color: new FormControl             ('',[]),
      status_description: new FormControl       ('',[]),
      is_completed: new FormControl             (false,[]),
      uid: new FormControl                      ('',[]),    // uuid идентификатор
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl                       ('',[]),
      master: new FormControl                   ('',[]),
      creator: new FormControl                  ('',[]),
      changer: new FormControl                  ('',[]),
      company: new FormControl                  ('',[]),
      date_time_created: new FormControl        ('',[]),
      date_time_changed: new FormControl        ('',[]),
    });

    this.formLinkedDocs = new FormGroup({
      nds: new FormControl                ('',[]),
      description: new FormControl        ('',[]),
      parent_tablename: new FormControl   ('',[]), //для счёта фактуры выданного
      vatinvoicein_id: new FormControl   ('',[]), //для счёта фактуры выданного
      is_completed: new FormControl       (null,[]),
      cagent_id: new FormControl          (null,[Validators.required]),
      company_id: new FormControl         (null,[Validators.required]),
      linked_doc_id: new FormControl      (null,[]),//id связанного документа (в данном случае Отгрузка)
      parent_uid: new FormControl         (null,[]),// uid родительского документа
      child_uid: new FormControl          (null,[]),// uid дочернего документа
      linked_doc_name: new FormControl    (null,[]),//имя (таблицы) связанного документа
      uid: new FormControl                ('',[]),  //uid создаваемого связанного документа
    });

    // Форма настроек
    this.settingsForm = new FormGroup({
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnComplete: new FormControl       ('',[]),
    });

    if(this.data)//если документ вызывается в окне из другого документа
    {
      this.mode=this.data.mode;
      if(this.mode=='window'){this.id=this.data.id; this.formBaseInformation.get('id').setValue(this.id);}
    } 
   
    //     getSetOfPermissions
    //     |
    //     getMyId
    //     |
    //     getMyCompanyId
    //     |
    //     getCRUD_rights
    //     |
    //     getData(------>(если созданный док)--> [getDocumentValuesById] --> refreshPermissions 
    
    // *необходимое действие для загрузки дочерних компонентов 

    this.getSetOfPermissions();
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList');  
  }
  //чтобы не было ExpressionChangedAfterItHasBeenCheckedError
  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  //---------------------------------------------------------------------------------------------------------------------------------------                            
  // ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------------------

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=38')
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
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToComplete=(
      (this.allowToCompleteAllCompanies)||
      (this.allowToCompleteMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
    this.editability=((this.allowToCreate && +this.id==0)||(this.allowToUpdate && this.id>0));
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!
    // return true;
  }
 


  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==529)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==530)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==533)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==534)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==535)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==536)});
    this.allowToCompleteAllCompanies = this.permissionsSet.some(       function(e){return(e==537)});
    this.allowToCompleteMyCompany = this.permissionsSet.some(          function(e){return(e==538)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    if(this.allowToCompleteAllCompanies){this.allowToCompleteMyCompany=true;}
    
    this.refreshPermissions();
    this.getData();
  }

  getData(){
    this.getDocumentValuesById();
  }

  getCompaniesList(){ //+++
    if(this.receivedCompaniesList.length==0)
      this.loadSpravService.getCompaniesList()
        .subscribe(
            (data) => 
            {
              this.receivedCompaniesList=data as any [];
              this.formAboutDocument.get('company').setValue(this.getCompanyNameById(this.formBaseInformation.get('company_id').value));
              if(+this.id==0) this.getSettings();
            },                      
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
        );
        else {this.formAboutDocument.get('company').setValue(this.getCompanyNameById(this.formBaseInformation.get('company_id').value));
        if(+this.id==0) this.getSettings();}    
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

  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.formBaseInformation.get('company_id').value,38) //38 - id документа из таблицы documents
      .subscribe(
          (data) => {this.receivedStatusesList=data as StatusInterface[];},
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getVatinvoiceinValuesById?id='+ this.id)
        .subscribe(
            data => { 
                let documentValues: DocResponse=data as any;// <- засовываем данные в интерфейс для принятия данных//!!!
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(documentValues.company_id);
                  this.formBaseInformation.get('cagent_id').setValue(documentValues.cagent_id);
                  this.formBaseInformation.get('cagent').setValue(documentValues.cagent);
                  this.formBaseInformation.get('doc_number').setValue(documentValues.doc_number);
                  this.formBaseInformation.get('paydoc_number').setValue(documentValues.paydoc_number);
                  this.formBaseInformation.get('paydoc_date').setValue(documentValues.paydoc_date?moment(documentValues.paydoc_date,'DD.MM.YYYY'):"");
                  this.formBaseInformation.get('summ').setValue(documentValues.summ);
                  this.formBaseInformation.get('description').setValue(documentValues.description);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.formBaseInformation.get('status_id').setValue(documentValues.status_id);
                  this.formBaseInformation.get('status_name').setValue(documentValues.status_name);
                  this.formBaseInformation.get('status_color').setValue(documentValues.status_color);
                  this.formBaseInformation.get('status_description').setValue(documentValues.status_description);
                  this.formBaseInformation.get('is_completed').setValue(documentValues.is_completed);
                  this.formBaseInformation.get('uid').setValue(documentValues.uid);
                  this.creatorId=+documentValues.creator_id;
                  this.getCompaniesList(); // загрузка списка предприятий (здесь это нужно для передачи его в настройки)
                  this.loadFilesInfo();
                  this.getStatusesList();//статусы документа Счёт-фактура полученный
                  this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                  this.getSettings(); // настройки документа !!!
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  }

  completeDocument(notShowDialog?:boolean){ //+++
    if(!notShowDialog){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',data:{
          head:    translate('docs.msg.complet_head'),
          warning: translate('docs.msg.complet_warn'),
          query:   translate('docs.msg.complet_query')},});
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.updateDocument(true);
        }
      });
    } else this.updateDocument(true);
  }

  decompleteDocument(notShowDialog?:boolean){ //+++
    if(this.allowToComplete){
      if(!notShowDialog){
        const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
          width: '400px',data:{
          head:    translate('docs.msg.cnc_com_head'),
          warning: translate('docs.msg.cnc_com_warn'),
          query: ''},});
        dialogRef.afterClosed().subscribe(result => {
          if(result==1){
            this.setDocumentAsDecompleted();
          }
        });
      } else this.setDocumentAsDecompleted();
    }
  }

  setDocumentAsDecompleted(){
    this.http.post('/api/auth/setVatinvoiceinAsDecompleted',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось завершить операцию из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.cnc_com_error')}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              case -60:{//Документ уже снят с проведения
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.alr_cnc_com')}});
                break;
              }
              case 1:{// Успешно
                this.openSnackBar(translate('docs.msg.cnc_com_succs',{name:translate('docs.docs.v_invoicein')}), translate('docs.msg.close'));
                // this.getLinkedDocsScheme(true);//загрузка диаграммы связанных документов
                this.formBaseInformation.get('is_completed').setValue(false);
              }
            }
          },
          error => {
            this.showQueryErrorMessage(error);
          },
      );
  }
  
  updateDocument(complete?:boolean){ 
    let currentStatus:number=this.formBaseInformation.get('status_id').value;
    if(complete){
      this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с проведением - временно устанавливаем true, временно - чтобы это ушло в запросе на сервер, но не повлияло на внешний вид документа, если вернется не true
      if(this.settingsForm.get('statusIdOnComplete').value&&this.statusIdInList(this.settingsForm.get('statusIdOnComplete').value)){// если в настройках есть "Статус при проведении" - временно выставляем его
        this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnComplete').value);}
    }
    this.http.post('/api/auth/updateVatinvoicein',  this.formBaseInformation.value)
      .subscribe(
          (data) => 
          {   
            if(complete){
              this.formBaseInformation.get('is_completed').setValue(false);//если сохранение с проведением - удаляем временную установку признака проведенности, 
              this.formBaseInformation.get('status_id').setValue(currentStatus);//и возвращаем предыдущий статус
            }
            let result:number=data as number;
            switch(result){
              case null:{// null возвращает если не удалось создать документ из-за ошибки
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (complete?translate('docs.msg._of_comp'):translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.v_invoicein')})}});
                break;
              }
              case -1:{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm_oper') + (complete?translate('docs.msg._of_comp'):translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.v_invoicein')})}});
                break;
              }
              case -50:{//Документ уже проведён
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.already_cmplt')}});
                break;
              }
              default:{// Успешно
                this.openSnackBar(translate('docs.msg.doc_name',{name:translate('docs.docs.v_invoicein')}) + (complete?translate('docs.msg.completed'):translate('docs.msg.saved')), translate('docs.msg.close'));
                if(complete) {
                  this.formBaseInformation.get('is_completed').setValue(true);//если сохранение с проведением - окончательно устанавливаем признак проведённости = true
                  if(this.settingsForm.get('statusIdOnComplete').value&&this.statusIdInList(this.settingsForm.get('statusIdOnComplete').value)){// если в настройках есть "Статус при проведении" - выставим его
                    this.formBaseInformation.get('status_id').setValue(this.settingsForm.get('statusIdOnComplete').value);}
                  // this.setStatusColor();//чтобы обновился цвет статуса
                }
                this.getData();
              }
            }
          },
          error => {
            this.showQueryErrorMessage(error);
          },
      );
  } 
  //загрузка настроек
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsVatinvoicein')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек

            if(this.isCompanyInList(+result.companyId)){
              this.settingsForm.get('statusIdOnComplete').setValue(result.statusIdOnComplete);
            } 
            this.setDefaultInfo();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  setDefaultInfo(){
  }
  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList) // иначе если док создан (id>0), т.е. списка предприятий нет, и => ERROR TypeError: Cannot read property 'map' of null
      this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }

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
  EditDocNumber(): void {
    if(this.allowToUpdate && +this.id==0){
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

  //открывает диалог настроек
  openDialogSettings() { 
    const dialogSettings = this.SettingsVatinvoiceinDialogComponent.open(SettingsVatinvoiceinDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        priceTypesList:   this.receivedPriceTypesList, //список типов цен
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        company_id: this.formBaseInformation.get('company_id').value, // текущее предприятие (нужно для поиска поставщика)
        allowToCreateAllCompanies: this.allowToCreateAllCompanies,
        allowToCreateMyCompany: this.allowToCreateMyCompany,
        id: this.id, //чтобы понять, новый док или уже созданный
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        //если нажата кнопка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
        if(result.get('companyId')) this.settingsForm.get('companyId').setValue(result.get('companyId').value);
        this.settingsForm.get('statusIdOnComplete').setValue(result.get('statusIdOnComplete').value);
        this.saveSettingsVatinvoicein();
      }
    });
  }

  // !!!
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
  saveSettingsVatinvoicein(){
    return this.http.post('/api/auth/saveSettingsVatinvoicein', this.settingsForm.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
                          
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
  }

  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.formBaseInformation.get('status_id').value){
          this.formBaseInformation.get('status_color').setValue(m.color);
        }
      });
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

//*****************************************************************************************************************************************/
/***********************************************************         ФАЙЛЫ          *******************************************************/
//*****************************************************************************************************************************************/
openDialogAddFiles() {
  const dialogRef = this.dialogAddFiles.open(FilesComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'select',
      companyId: this.formBaseInformation.get('company_id').value
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    console.log(`Dialog result: ${result}`);
    if(result)this.addFilesToVatinvoicein(result);
  });
}
openFileCard(docId:number) {
  const dialogRef = this.dialogAddFiles.open(FilesDocComponent, {
    maxWidth: '95vw',
    maxHeight: '95vh',
    height: '95%',
    width: '95%',
    data:
    { 
      mode: 'window',
      docId: docId
    },
  });
}
loadFilesInfo(){//                                     загружает информацию по прикрепленным файлам
    return this.http.get('/api/auth/getListOfVatinvoiceinFiles?id='+this.id) 
          .subscribe(
              (data) => {  
                          this.filesInfo = data as any[]; 
                        },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
          );
}
addFilesToVatinvoicein(filesIds: number[]){
  const body = {"id1":this.id, "setOfLongs1":filesIds};// передаем id товара и id файлов 
          return this.http.post('/api/auth/addFilesToVatinvoicein', body) 
            .subscribe(
                (data) => {  
                  this.loadFilesInfo();
                  this.openSnackBar(translate('docs.msg.files_added'), translate('docs.msg.close'));
                          },
                 error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
            );
}

clickBtnDeleteFile(id: number): void {
  const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
    width: '400px',
    data:
    { 
      head: translate('docs.msg.file_del_head'),
      query: translate('docs.msg.file_del_qury'),
      warning: translate('docs.msg.file_del_warn'),
    },
  });
  dialogRef.afterClosed().subscribe(result => {
    if(result==1){this.deleteFile(id);}
  });        
}

deleteFile(id:number){
  const body = {id: id, any_id:this.id}; 
  return this.http.post('/api/auth/deleteVatinvoiceinFile',body)
  .subscribe(
      (data) => {   
                  this.loadFilesInfo();
                  this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
  );  
}
//**********************************************************************************************************************************************/  
//*************************************************          СВЯЗАННЫЕ ДОКУМЕНТЫ          ******************************************************/
//**********************************************************************************************************************************************/  

  //создание связанных документов
  createLinkedDoc(docname:string){// принимает аргументы: Return
    let uid = uuidv4();
    let canCreateLinkedDoc:CanCreateLinkedDoc=this.canCreateLinkedDoc(docname); //проверим на возможность создания связанного документа
    if(canCreateLinkedDoc.can){
      
      this.formLinkedDocs.get('company_id').setValue(this.formBaseInformation.get('company_id').value);
      this.formLinkedDocs.get('cagent_id').setValue(this.formBaseInformation.get('cagent_id').value);
      this.formLinkedDocs.get('nds').setValue(this.formBaseInformation.get('nds').value);
      // this.formLinkedDocs.get('summ').setValue(this.formBaseInformation.get('summ').value);
      this.formLinkedDocs.get('description').setValue(translate('docs.msg.created_from')+translate('docs.docs.v_invoicein')+' '+translate('docs.top.number')+this.formBaseInformation.get('doc_number').value);
      this.formLinkedDocs.get('is_completed').setValue(false);
      this.formLinkedDocs.get('uid').setValue(uid);
      
      this.formLinkedDocs.get('linked_doc_id').setValue(this.id);//id связанного документа (того, из которого инициируется создание данного документа)
      this.formLinkedDocs.get('linked_doc_name').setValue('vatinvoicein');//имя (таблицы) связанного документа

      //поля для счёта-фактуры выданного
      this.formLinkedDocs.get('parent_tablename').setValue('vatinvoicein');
      this.formLinkedDocs.get('vatinvoicein_id').setValue(this.id);

      if(docname=='Ordersup'){// Заказ поставщику для Приходного ордера является родительским, но может быть создан из Приходного ордера (Заказ поставщику будет выше по иерархии в диаграмме связей)
        this.formLinkedDocs.get('parent_uid').setValue(uid);// uid исходящего (родительского) документа
        this.formLinkedDocs.get('child_uid').setValue(this.formBaseInformation.get('uid').value);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      } else {
        this.formLinkedDocs.get('parent_uid').setValue(this.formBaseInformation.get('uid').value);// uid исходящего (родительского) документа
        this.formLinkedDocs.get('child_uid').setValue(uid);// uid дочернего документа. Дочерний - не всегда тот, которого создают из текущего документа. Например, при создании из Отгрузки Счёта покупателю - Отгрузка будет дочерней для него.
      }
      
      this.http.post('/api/auth/insert'+docname, this.formLinkedDocs.value)
      .subscribe(
      (data) => {
                  let createdDocId=data as number;
                  switch(createdDocId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_succ',{name:translate('docs.docs.'+this.commonUtilites.getDocNameByDocAlias(docname))}), translate('docs.msg.close'));
                      this.getLinkedDocsScheme(true);//обновляем схему этого документа
                    }
                  }
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
    } else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:canCreateLinkedDoc.reason}});
  }

  // можно ли создать связанный документ 
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
  //**************************** ПЕЧАТЬ ДОКУМЕНТОВ  ******************************/
  // открывает диалог печати
  openDialogTemplates() { 
    const dialogTemplates = this.templatesDialogComponent.open(TemplatesDialogComponent, {
      maxWidth: '1000px',
      maxHeight: '95vh',
      // height: '680px',
      width: '95vw', 
      minHeight: '95vh',
      data:
      { //отправляем в диалог:
        company_id: +this.formBaseInformation.get('company_id').value, //предприятие
        document_id: 38, // id документа из таблицы documents
      },
    });
    dialogTemplates.afterClosed().subscribe(result => {
      if(result){
        
      }
    });
  }
  // при нажатии на кнопку печати - нужно подгрузить список шаблонов для этого типа документа
  printDocs(){
    this.gettingTemplatesData=true;
    this.templatesList=[];
    this.http.get('/api/auth/getTemplatesList?company_id='+this.formBaseInformation.get('company_id').value+"&document_id="+38+"&is_show="+true).subscribe
    (data =>{ 
        this.gettingTemplatesData=false;
        this.templatesList=data as TemplatesList[];
      },error => {console.log(error);this.gettingTemplatesData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }
  clickOnTemplate(template:TemplatesList){
    const baseUrl = '/api/auth/vatinvoiceinPrint/';
    this.http.get(baseUrl+ 
                  "?file_name="+template.file_name+
                  "&doc_id="+this.id+
                  "&tt_id="+template.template_type_id,
                  { responseType: 'blob' as 'json', withCredentials: false}).subscribe(
      (response: any) =>{
          let dataType = response.type;
          let binaryData = [];
          binaryData.push(response);
          let downloadLink = document.createElement('a');
          downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
          downloadLink.setAttribute('download', template.file_original_name);
          document.body.appendChild(downloadLink);
          downloadLink.click();
      }, 
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }
//*****************************************************************************************************************************************/
  //------------------------------------------ COMMON UTILITES -----------------------------------------
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
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  getFormIngexByProductId(productId:number):number{
    let retIndex:number;
    let formIndex:number=0;
    this.formBaseInformation.value.vatinvoiceinProductTable.map(i => 
      {
      if(+i['product_id']==productId){retIndex=formIndex}
      formIndex++;
    });return retIndex;}
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
  // The situation can be, that in settings there is "Status after ompletion" for company A, but document created for company B. If it happens, when completion is over, Dokio can set this status of company A to the document, but that's wrong! 
  statusIdInList(id:number):boolean{let r=false;this.receivedStatusesList.forEach(c=>{if(id==+c.id) r=true});return r}
}

