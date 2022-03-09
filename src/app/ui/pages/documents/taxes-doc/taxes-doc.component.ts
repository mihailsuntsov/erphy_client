import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface docResponse {//интерфейс для получения ответа в методе getStatusDocsTableById
  id: number;
  company: string;
  company_id: number;
  document: string;
  document_id: number;
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
  value: number;
  multiplier: number;
  is_active: boolean;
  is_deleted: boolean;
  name_api_atol: string;
}
interface TaxesList {//интерфейс массива для получения всех налогов текущего документа
  id: string;
  name: string;
  output_order: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}

@Component({
  selector: 'app-taxes-doc',
  templateUrl: './taxes-doc.component.html',
  styleUrls: ['./taxes-doc.component.css'],
  providers: [LoadSpravService,]
})
export class TaxesDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBtnUpdate = false;
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

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

  statusColor: string;
  taxesList : TaxesList [] = []; //массив для получения всех налогов текущего документа

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _router:Router,
    private _snackBar: MatSnackBar) { 
      if(activateRoute.snapshot.params['id'])
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      taxesIdsInOrderOfList:new FormControl      ([],[]),//массив для формирования необходимого порядка вывода налогов
      name: new FormControl      ('',[Validators.required,Validators.maxLength(30)]),
      description: new FormControl      ('',[]),
      value: new FormControl      (0,[Validators.required,Validators.pattern('^[0-9]{1,2}?\r?$')]),
      multiplier: new FormControl      (1,[]),
      is_active: new FormControl      (true,[]),
      is_deleted: new FormControl      (false,[]),
      name_api_atol: new FormControl      ('',[Validators.maxLength(10)]),
      // color: new FormControl      ('#d0d0d0',[Validators.required]),
      // doc_id: new FormControl      (0,[Validators.required]),
      // doc:new FormControl      ('',[]),
      // status_type: new FormControl      (1,[Validators.required]),//тип статуса 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
    });
    this.formAboutDocument = new FormGroup({
      id: new FormControl      ('',[]),
      master: new FormControl      ('',[]),
      creator: new FormControl      ('',[]),
      changer: new FormControl      ('',[]),
      company: new FormControl      ('',[]),
      date_time_created: new FormControl      ('',[]),
      date_time_changed: new FormControl      ('',[]),
    });

    this.getSetOfPermissions();//
    // ->getMyId()
    // ->getMyCompanyId()
    // ->getCRUD_rights()
    // ->getDocumentsList()
    // ->getData()------>(если созданный док)---> this.getDocumentValuesById(); --> refreshPermissions()     
    // ->(если новый док):
    // ->getCompaniesList() 
    // ->setDefaultCompany()
    // ->setDefaultDocument()
    // ->refreshPermissions() 
  }
//---------------------------------------------------------------------------------------------------------------------------------------                            
// ----------------------------------------------------- *** ПРАВА *** ------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=50')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
    );
}

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==636)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==637)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==640)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==641)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==642)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==643)});
    this.getData();
  }

  refreshPermissions():boolean{
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
    // return true;
    this.rightsDefined=true;//!!!
  return true;

}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
    }
  }

  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);},
       error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},);
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
                },                      
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
            );
  }
  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(Cookie.get('satusdoc_companyId')=="0"?this.myCompanyId:+Cookie.get('satusdoc_companyId'));
    this.refreshPermissions();
  }
  
  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }

  getDocumentValuesById(){
    this.http.get('/api/auth/getTaxesValuesById?id='+this.id)
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
                  this.formBaseInformation.get('value').setValue(documentValues.value);
                  this.formBaseInformation.get('multiplier').setValue(documentValues.multiplier);
                  this.formBaseInformation.get('is_active').setValue(documentValues.is_active);
                  this.formBaseInformation.get('is_deleted').setValue(documentValues.is_deleted);
                  this.formBaseInformation.get('name_api_atol').setValue(documentValues.name_api_atol);

                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  this.getTaxesList();
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();                  

            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
        );
  }

  createNewDocument(){
    this.createdDocId=null;
    this.http.post('/api/auth/insertTaxes', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDocId=data as string [];
                                this.id=+this.createdDocId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.afterCreateDoc();
                                this.openSnackBar("Статус документа успешно создан", "Закрыть");
                            },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
            );
  }

  updateDocument(){ 
    // const body= {
    //   "id":                       this.formBaseInformation.get('id').value,
    //   // "doc_id":                  this.formBaseInformation.get('doc_id').value,
    //   "company_id":               this.formBaseInformation.get('company_id').value,
    //   "name":                     this.formBaseInformation.get('name').value,
    //   "description":              this.formBaseInformation.get('description').value,
    //   // "color":                    this.formBaseInformation.get('color').value,
    //   // "status_type":              this.formBaseInformation.get('status_type').value,
    //   "taxesIdsInOrderOfList":    this.getTaxesIdsInOrderOfList()
    // }
    this.formBaseInformation.get('taxesIdsInOrderOfList').setValue(this.getTaxesIdsInOrderOfList());

      return this.http.post('/api/auth/updateTaxes', this.formBaseInformation.value)
        .subscribe(
            (data) => 
            {   
              this.getData();
                this.openSnackBar("Статус документа сохранён", "Закрыть");
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});},
        );
  } 

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  getTaxesList(){//возвращает список всех налогов документа, который нужен для изменения порядка вывода налогов
      return this.http.get('/api/auth/getTaxesList?company_id='+this.formBaseInformation.get('company_id').value,)
        .subscribe(
            (data) => {
              this.taxesList = data as TaxesList [];
              this.refreshPermissions(); 
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});}, 
        );
  }

  getTaxesIdsInOrderOfList(): number[] {
    var i: number []=[];
    this.taxesList.forEach(x => {
      i.push(+x.id);
    })
    return i;
  }

  dropCagent(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.taxesList, event.previousIndex, event.currentIndex);
  }

  // Действия после создания нового документа Счёт покупателю (это самый последний этап).
  afterCreateDoc(){// с true запрос придет при отбиваемом в данный момент чеке
    // Сначала обживаем текущий документ:
    this.id=+this.createdDocId;
    this.rightsDefined=false; //!!!
    this._router.navigate(['/ui/taxesdoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/taxesdoc',0]);
    this.id=0;
    this.formBaseInformation.get('id').setValue(0);
    this.formBaseInformation.get('name').setValue('');
    this.formBaseInformation.get('description').setValue('');
    this.formBaseInformation.get('value').setValue(0);
    this.formBaseInformation.get('multiplier').setValue(1);
    this.formBaseInformation.get('is_active').setValue(true);
    this.formBaseInformation.get('is_deleted').setValue(false);
    this.formBaseInformation.get('name_api_atol').setValue('');
    this.taxesList=[];
    this.getData();
  }

  onTaxValueChange(){
    this.formBaseInformation.get('value').value;
    this.formBaseInformation.get('multiplier').setValue(1
      +(
      this.formBaseInformation.get('value').value/100
    )
    );


  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}

}
