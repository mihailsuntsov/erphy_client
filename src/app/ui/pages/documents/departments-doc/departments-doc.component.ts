import { Component, EventEmitter, OnInit, Output } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { Router } from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; 
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DepartmentPartsComponent } from 'src/app/modules/trade-modules/department-parts/department-parts.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';

interface docResponse {//интерфейс для получения ответа в методе getDepartmentValuesById
    id: number;
    company_id: string;
    company: string;
    name: string;
    address: string;
    master_id: string;
    creator_id: string;
    changer_id: string;
    price_id: string;
    owner: string;
    creator: string;
    changer: string;
    parent_id: string;
    parent: string;
    date_time_created: string;
    date_time_changed: string;
    additional: string;
    payment_account_id:number;
    boxoffice_id:number;
}
interface idNameDescription{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
  description: string;
}

interface DepartmentPart{
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  menu_order: number;
} 
@Component({
  selector: 'app-departments-doc',
  templateUrl: './departments-doc.component.html',
  styleUrls: ['./departments-doc.component.css'],
  providers: [LoadSpravService]
})
export class DepartmentsDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  paymentAccounts:any[]=[];// список расчётных счетов предприятия
  boxoffices:any[]=[];// список касс предприятия (не путать с ККМ!)
  receivedPartsList:DepartmentPart[]=[];

  visBtnUpdate = false;

  id: number=0;// id документа
  myCompanyId:number=0;
  myId:number=0;

  //Формы
  formBaseInformation:any;//форма основной информации и банк. реквизитов
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/именён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyMastersCompanies:boolean = false;
  allowToUpdate:boolean = false;
  allowToView:boolean = false;
  rightsDefined:boolean = false;

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    private departmentPartsDialog: MatDialog,
    public  ConfirmDialog: MatDialog,
    public MessageDialog: MatDialog,
    private _snackBar: MatSnackBar
    ){
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl                       (this.id,[]),
      name: new UntypedFormControl                     ('',[Validators.required]),
      company_id: new UntypedFormControl               ('',[Validators.required]),
      parent_id: new UntypedFormControl                ('',[]),
      price_id: new UntypedFormControl                 ('',[]),
      address: new UntypedFormControl                  ('',[]),
      additional: new UntypedFormControl               ('',[]),
      boxoffice_id: new UntypedFormControl             ('',[]), // касса предприятия, к которой относится отделение
      payment_account_id: new UntypedFormControl       ('',[]), // расч. счёт по умолчанию
      parts:  new UntypedFormControl                   ([],[]),//массив с частями отделения
    });
    this.formAboutDocument = new UntypedFormGroup({
      id: new UntypedFormControl                       ('',[]),
      owner: new UntypedFormControl                    ('',[]),
      creator: new UntypedFormControl                  ('',[]),
      changer: new UntypedFormControl                  ('',[]),
      parent: new UntypedFormControl                   ('',[]),
      company: new UntypedFormControl                  ('',[]),
      date_time_created: new UntypedFormControl        ('',[]),
      date_time_changed: new UntypedFormControl        ('',[]),
    });
    this.getSetOfPermissions();
    //+++ getting base data from parent component
    this.getBaseData('myId');    
    this.getBaseData('myCompanyId');  
    this.getBaseData('companiesList'); 
  }

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=4')
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
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==11)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==11)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==14)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==13)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==16)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==15)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    this.getData();
  }

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList(); 
    }
  }

  refreshPermissions(){
    let documentOfMyCompany:boolean = (+this.formBaseInformation.get('company_id').value==this.myCompanyId);
    this.allowToView=(
      (this.allowToViewAllCompanies)||
      (this.allowToViewMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToUpdate=(
      (this.allowToUpdateAllCompanies)||
      (this.allowToUpdateMyCompany&&documentOfMyCompany)
    )?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies || this.allowToCreateMyCompany)?true:false;
    // console.log("myCompanyId - "+this.myCompanyId);
    // console.log("documentOfMyCompany - "+documentOfMyCompany);
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    this.rightsDefined=true;//!!!
  }



  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }

  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }

  updateDocument(){
    this.formBaseInformation.get('parts').setValue(this.receivedPartsList);
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateDepartment', this.formBaseInformation.value)
            .subscribe(
        (data) => {   
                    this.updateDocumentResponse=data as string;
                    this.getData();
                    this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
                  }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
    }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.http.post('/api/auth/getDepartmentValuesById', docId)
        .subscribe(
            data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
                if(data!=null&&documentResponse.company_id!=null){
                  this.formBaseInformation.get('name').setValue(documentResponse.name);
                  this.formBaseInformation.get('company_id').setValue(documentResponse.company_id);
                  this.formBaseInformation.get('parent_id').setValue(documentResponse.parent_id);
                  this.formBaseInformation.get('price_id').setValue(documentResponse.price_id);
                  this.formBaseInformation.get('address').setValue(documentResponse.address?documentResponse.address:'');
                  this.formBaseInformation.get('additional').setValue(documentResponse.additional?documentResponse.additional:'');
                  this.formBaseInformation.get('boxoffice_id').setValue(documentResponse.boxoffice_id);
                  this.formBaseInformation.get('payment_account_id').setValue(documentResponse.payment_account_id);
                  this.formAboutDocument.get('id').setValue(+documentResponse.id);
                  this.formAboutDocument.get('owner').setValue(documentResponse.owner);
                  this.formAboutDocument.get('creator').setValue(documentResponse.creator);
                  this.formAboutDocument.get('changer').setValue(documentResponse.changer);
                  this.formAboutDocument.get('parent').setValue(documentResponse.parent);
                  this.formAboutDocument.get('company').setValue(documentResponse.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
                  this.getBoxofficesList();
                  this.getCompaniesPaymentAccounts();
                  // this.getDepartmentsList();  // если отделения и типы цен грузить не здесь, а в месте где вызывалась getDocumentValuesById,
                  this.getPriceTypesList();   // то из-за асинхронной передачи данных company_id будет еще null, 
                                              // и запрашиваемые списки не загрузятся
                  this.getDepartmentPartsList();
                  
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})} //+++
        );
  } 

  createNewDocument(){
    this.http.post('/api/auth/insertDepartment', this.formBaseInformation.value)
      .subscribe(
          (data) =>   {
            let result=data as any;
            switch(result){
              case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
              case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
              case -120:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});break;}
              default:{  
                          this.id=result;
                          this._router.navigate(['/ui/departmentsdoc', this.id]);
                          this.formBaseInformation.get('id').setValue(this.id);
                          this.rightsDefined=false; //!!!
                          this.getData();
                          this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
              }
            }
          },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    this.setDefaultCompany();
  }

  setDefaultCompany(){

    if(+this.id==0)
      if(this.allowToCreateAllCompanies)
        this.formBaseInformation.get('company_id').setValue(Cookie.get('departments_companyId')=="0"?this.myCompanyId:+Cookie.get('departments_companyId'));
      else
        this.formBaseInformation.get('company_id').setValue(this.myCompanyId);


    this.getCompaniesPaymentAccounts();
    this.getBoxofficesList();
    this.getPriceTypesList(); 
    this.refreshPermissions();
  }
  
  getCompaniesPaymentAccounts(){
    return this.http.get('/api/auth/getCompaniesPaymentAccounts?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.paymentAccounts=data as any [];
          // this.setDefaultPaymentAccount();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  getBoxofficesList(){
    return this.http.get('/api/auth/getBoxofficesList?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.boxoffices=data as any [];
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  getBoxofficeNameById(id:string):string{
    let name:string = translate('docs.msg.not_set');
    if(this.boxoffices){
      this.boxoffices.forEach(a=>{
        if(a.id==id) name=a.name;
      })}
    return(name);
  }

  getPaymentAccountNameById(id:string):string{
    let name:string = translate('docs.msg.not_set');
    if(this.paymentAccounts){
      this.paymentAccounts.forEach(a=>{
        if(a.id==id) name=a.payment_account||' ('||a.name||')';
      })}
    return(name);
  }


  onCompanyChange(){
    this.formBaseInformation.get('payment_account_id').setValue(null);
    this.formBaseInformation.get('boxoffice_id').setValue(null);
    this.formBaseInformation.get('price_id').setValue(null);
    this.getBoxofficesList();
    this.getCompaniesPaymentAccounts();
    this.getPriceTypesList(); 
  }

  getPriceTypesList(){
    this.receivedPriceTypesList=null;
    this.loadSpravService.getPriceTypesList(+this.formBaseInformation.get('company_id').value)
            .subscribe(
                (data) => {this.receivedPriceTypesList=data as any [];
                this.setDefaultPriceType();
                },
                error => console.log(error)
            );
  }

  setDefaultPriceType(){
    if(this.receivedPriceTypesList.length>0)
    {
      this.formBaseInformation.get('price_id').setValue(+this.receivedPriceTypesList[0].id);
    }
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }


  // *************************  DEPARTMENT PARTS  ******************************
  getDepartmentPartsList(){
    this.http.get('/api/auth/getDepartmentPartsList?department_id='+this.id)
    .subscribe(
      (data) => {
        this.receivedPartsList=data as DepartmentPart[];
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  getMaxOrder(){
    let mo:number = 0;
    this.receivedPartsList.forEach(i => {
      mo = i.menu_order;
    });
    return mo;
  }

  dropPart(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.receivedPartsList, event.previousIndex, event.currentIndex);
  }

  clickBtnAddPart(): void {
    const dialogRef = this.departmentPartsDialog.open(DepartmentPartsComponent, {
      width: '800px', 
      data:
      { 
        actionType: "create",
        department_id: this.id,
        menu_order: this.getMaxOrder(),
        partName: '', 
        partId:'',
        is_active:true,
        partDescription:'',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
     // console.log("createdPartId: "+result);
      this.getDepartmentPartsList();
    });        
  }

  clickBtnEditPart(part: any): void {
    const dialogRef = this.departmentPartsDialog.open(DepartmentPartsComponent, {
      width: '800px', 
      data:
      { 
        actionType:"update",
        department_id: this.id,
        partName: part.name, 
        partId:part.id,
        is_active:part.is_active,
        partDescription:part.description,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getDepartmentPartsList();
    });        
  }

  clickBtnDeletePart(id: number): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head:   translate('docs.msg.del_dep_part'),
        query:  translate('docs.msg.del_dep_part_questn'),
        warning:translate(''),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deletePart(id);}
    });        
  }
  deletePart(partId:number){
    return this.http.get('/api/auth/deleteDepartmentPart?id='+partId)
    .subscribe(
        (data) => {  
          let result = data as any; 
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
            default:{ 
              this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
              this.getDepartmentPartsList();
            }
          }
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );  
  }

}
