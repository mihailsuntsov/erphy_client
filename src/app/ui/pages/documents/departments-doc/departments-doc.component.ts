import { Component, OnInit } from '@angular/core';
// Для получения параметров маршрута необходим специальный сервис ActivatedRoute. 
// Он содержит информацию о маршруте, в частности, параметры маршрута, 
// параметры строки запроса и прочее. Он внедряется в приложение через механизм dependency injection, 
// поэтому в конструкторе мы можем получить его.
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { Router } from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';

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

@Component({
  selector: 'app-departments-doc',
  templateUrl: './departments-doc.component.html',
  styleUrls: ['./departments-doc.component.css'],
  providers: [LoadSpravService]
})
export class DepartmentsDocComponent implements OnInit {

  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedDepartmentsList: any [];//массив для получения списка отеделний
  receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  paymentAccounts:any[]=[];// список расчётных счетов предприятия
  boxoffices:any[]=[];// список касс предприятия (не путать с ККМ!)

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

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    public MessageDialog: MatDialog,
    private _snackBar: MatSnackBar
    ){
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl                       (this.id,[]),
      name: new FormControl                     ('',[Validators.required]),
      company_id: new FormControl               ('',[Validators.required]),
      parent_id: new FormControl                ('',[]),
      price_id: new FormControl                 ('',[]),
      address: new FormControl                  ('',[]),
      additional: new FormControl               ('',[]),
      boxoffice_id: new FormControl             ('',[]), // касса предприятия, к которой относится отделение
      payment_account_id: new FormControl       ('',[]), // расч. счёт по умолчанию
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl                       ('',[]),
      owner: new FormControl                    ('',[]),
      creator: new FormControl                  ('',[]),
      changer: new FormControl                  ('',[]),
      parent: new FormControl                   ('',[]),
      company: new FormControl                  ('',[]),
      date_time_created: new FormControl        ('',[]),
      date_time_changed: new FormControl        ('',[]),
    });
    this.getSetOfPermissions();
  }

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=4')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getMyId();
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
  }

  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
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
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateDepartment', this.formBaseInformation.value)
            .subscribe(
        (data) => {   
                    this.updateDocumentResponse=data as string;
                    this.getData();
                    this.openSnackBar("Успешно сохранено", "Закрыть");
                  }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
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
                  this.formBaseInformation.get('address').setValue(documentResponse.address);
                  this.formBaseInformation.get('additional').setValue(documentResponse.additional);
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
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
        );
  }

  createNewDocument(){
    this.http.post('/api/auth/insertDepartment', this.formBaseInformation.value)
      .subscribe(
          (data) =>   {
            let result=data as any;
            switch(result){
              case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
              case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
              default:{  
                          this.id=result;
                          this._router.navigate(['/ui/departmentsdoc', this.id]);
                          this.formBaseInformation.get('id').setValue(this.id);
                          this.rightsDefined=false; //!!!
                          this.getData();
                          this.openSnackBar("Отделение создано", "Закрыть");
              }
            }
          },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }

  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.doFilterCompaniesList();
                  this.setDefaultCompany();
                }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }

  setDefaultCompany(){
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
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
    );
  }

  getBoxofficesList(){
    return this.http.get('/api/auth/getBoxofficesList?id='+this.formBaseInformation.get('company_id').value).subscribe(
        (data) => { 
          this.boxoffices=data as any [];
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error}})}
    );
  }

  getBoxofficeNameById(id:string):string{
    let name:string = 'Не установлен';
    if(this.boxoffices){
      this.boxoffices.forEach(a=>{
        if(a.id==id) name=a.name;
      })}
    return(name);
  }

  getPaymentAccountNameById(id:string):string{
    let name:string = 'Не установлен';
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
    // console.log("this.receivedPriceTypesList.length="+this.receivedPriceTypesList.length);
    if(this.receivedPriceTypesList.length==1)
    {
      this.formBaseInformation.get('priceTypeId').setValue(+this.receivedPriceTypesList[0].id);
      // Cookie.set('prices_priceTypeId',this.sendingQueryForm.priceTypeId);
    }
  }

}
