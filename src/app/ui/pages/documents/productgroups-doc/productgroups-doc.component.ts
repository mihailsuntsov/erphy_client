import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar} from '@angular/material/snack-bar';
import { QueryFormService } from './get-productgroups-fields-list.service';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { QueryForm } from './query-form';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ProductGroupFieldsDialogComponent } from 'src/app/ui/dialogs/product-group-fields-dialog/product-group-fields-dialog.component';
import {  ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++

interface docResponse {//интерфейс для получения ответа в методе getUserValuesById
  id: number;
  company: string;
  company_id: string;
  creator: string;
  creator_id: string;
  master: string;
  master_id: string;
  changer:string;
  changer_id: string;
  date_time_changed: string;
  date_time_created: string;
  name: string;
  description: string;
  }

  interface fieldsResponse {//интерфейс для получения ответа в методе getFields (информации по полям)
    id: number;
    group_id: string;
    field_type: string;
    parent_set_id: string;
    name: string;
    description: string;
    output_order: string;
    }

  interface isIt_Doc_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ предприятий мастер-аккаунта?)
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyMastersCompanies:boolean;
  }



@Component({
  selector: 'app-productgroups-doc',
  templateUrl: './productgroups-doc.component.html',
  styleUrls: ['./productgroups-doc.component.css'],
  providers: [LoadSpravService,QueryFormService]
})
export class ProductgroupsDocComponent implements OnInit {
  id: number=0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  defaultId=0;//для подстановки дефолтных значений выпадающих списков
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы 
  receivedSetsOfFields: any [] = [] ;//массив для получения сетов полей
  receivedFieldsOfSet: fieldsResponse[] = [];//массив для получения полей сета 
  allFields: any[][] = [];//[id сета][объект]
  orderFieldsRequest: fieldsResponse[] = [];// массив для отправки очередности полей и сетов [{id поля,order},{id поля,order},...]
  i: number; //счетчик
  j: number; //счетчик
  maxCountOfFields:number =0;//максимальное кол-во полей в одном из сетов. Нужно, чтобы знать показывать ли кнопку "Изменить порядок".
  panelSetId: number;// id сета у которого открыта панель

  myCompanyId:number=0;
  myId:number=0;

  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  
  visBtnChangeFieldsOrder = true;
  visChangingFieldsOrder = false;

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
  rightsDefined:boolean = false;//!!!

  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
  
  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    public MessageDialog: MatDialog,
    private _router:Router,
    private queryFormService:   QueryFormService,
    private _snackBar: MatSnackBar,
    public productGroupFieldsDialog: MatDialog,
    public ConfirmDialog: MatDialog) { 

      if(activateRoute.snapshot.params['id']){
        this.id = +activateRoute.snapshot.params['id'];// +null returns 0
      }
    }

  ngOnInit() {

    this.formBaseInformation = new UntypedFormGroup({
      id: new UntypedFormControl      (this.id,[]),
      company_id: new UntypedFormControl      ('',[Validators.required]),
      company: new UntypedFormControl      ('',[]),
      name: new UntypedFormControl      ('',[Validators.required]),
      description: new UntypedFormControl      ('',[]),
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
   // this.checkedList = [];
    
   this.getSetOfPermissions();
   //+++ getting base data from parent component
   this.getBaseData('myId');    
   this.getBaseData('myCompanyId');  
   this.getBaseData('companiesList');  
  }
  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=10')
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
  doFilterCompaniesList(){
    let myCompany:any;
    if(!this.allowToCreateAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
    if(+this.id==0)
      this.setDefaultCompany();
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

  IsItMy_DocCheckings(id:number){// проверки на документ (документ моего предприятия?)
    const body = {"documentId": id};//
    return this.http.post('/api/auth/getIsItMy_ProductGroups_JSON', body) 
            .subscribe(
                (data) => {   let isItMy_Doc: isIt_Doc_Response=data as any;  
                  this.itIsDocumentOfMyCompany = isItMy_Doc.itIsDocumentOfMyCompany;
                  this.itIsDocumentOfMyMastersCompanies= isItMy_Doc.itIsDocumentOfMyMastersCompanies;
                            this.getCRUD_rights();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }
  
  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==111)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==111)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==113)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==114)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==115)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==116)});
   
    if(this.allowToCreateAllCompanies){this.allowToCreateMyCompany=true;}
    if(this.allowToViewAllCompanies){this.allowToViewMyCompany=true;}
    if(this.allowToUpdateAllCompanies){this.allowToUpdateMyCompany=true;}
    this.getData();
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
    // return true;
    this.rightsDefined=true;//!!!
  }
  
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();this.maxCountOfFields=0;//обнулили максималное кол-во полей в одном из сетов, т.к. после удаления сета или поля maxCountOfFields нужно пересчитывать
      this.getSets(this.id,"1","0")//загрузить сеты и поля этого документа
    }else {
      this.getCompaniesList(); 
    }
  }

  
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  // getData(){
  //   if(+this.id>0){
  //     this.getDocumentValuesById();
  //     // console.log("getDocumentValuesById");
  //     this.maxCountOfFields=0;//обнулили максималное кол-во полей в одном из сетов, т.к. после удаления сета или поля maxCountOfFields нужно пересчитывать
  //     this.getSets(this.id,"1","0")//загрузить сеты и поля этого документа
  //   }else {
  //     this.getCompaniesList();
  //     // console.log("getCompaniesList");
  //   }
  //   this.refreshShowAllTabs();
  // }

  clickBtnAddField(): void {
    const dialogRef = this.productGroupFieldsDialog.open(ProductGroupFieldsDialogComponent, {
      width: '800px', 
      data:
      { 
        company_id: this.formBaseInformation.get('company_id').value , 
        group_id: +this.id,
        sets:this.receivedSetsOfFields,
        field_type: 2,
        docName:translate('docs.msg.add_fld'),
        parent_set_id: this.panelSetId
      },
      
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getSets(this.id,"1","0")
    });        
  }
  clickBtnAddSetOfField(): void {
    const dialogRef = this.productGroupFieldsDialog.open(ProductGroupFieldsDialogComponent, {
      width: '800px', 
      data:
      { 
        company_id: this.formBaseInformation.get('company_id').value , 
        group_id: +this.id,
        field_type: 1,
        docName:translate('docs.msg.add_fgroup')  
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getSets(this.id,"1","0")
    });        
  }

  clickBtnEditSet(field_id:number,name:string, description:string): void {
    const dialogRef = this.productGroupFieldsDialog.open(ProductGroupFieldsDialogComponent, {
      width: '800px', 
      data:
      { 
        id: field_id,
        company_id: this.formBaseInformation.get('company_id').value , 
        group_id: +this.id,
        field_type: 1,
        docName:translate('docs.msg.edit_fgroup'),
        name:name,
        description: description
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getSets(this.id,"1","0")
    });        
  }
  clickBtnEditField(field_id:number,parent_set_id:number, name:string, description:string): void {
    const dialogRef = this.productGroupFieldsDialog.open(ProductGroupFieldsDialogComponent, {
      width: '800px', 
      data:
      { 
        id: field_id,
        company_id: this.formBaseInformation.get('company_id').value , 
        group_id: +this.id,
        field_type: 2,
        docName:translate('docs.msg.edit_fld'),
        parent_set_id:parent_set_id,
        name:name,
        description: description,
        sets:this.receivedSetsOfFields
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getSets(this.id,"1","0")
    });        
  }

  clickBtnDeleteField(id:number, name:string): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_fld'),
        query: translate('docs.msg.del_fld_q',{name:name}),
        warning: translate('docs.msg.fld_wrning'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteField(id);}

    });        
  }
  clickBtnDeleteSet(id:number, name:string): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '500px',
      data:
      { 
        head: translate('docs.msg.del_fgroup'),
        query: translate('docs.msg.del_fgroup_q',{name:name}),
        warning: translate('docs.msg.fgroup_wrning'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteField(id);}

    });        
  }
  deleteField(id:number){
    const body = {id: id}; 
    return this.http.post('/api/auth/deleteProductGroupField',body)
    .subscribe(
        (data) => {   
                    this.openSnackBar(translate('docs.msg.deletet_succs'), translate('docs.msg.close'));
                    this.getSets(this.id,"1","0");
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }
  //Загрузка групп (сетов) полей
  getSets(groupId:any,field_type:any,parentSetId:any){
    this.queryFormService.getList(groupId,field_type,parentSetId)// id группы товаров, тип подгружаемых данных (1 сеты, 2 поля), для полей - id родительского сета или 0 для сета
            .subscribe(
                (data) => {
                  this.receivedSetsOfFields=data as any []; 
                  this.getFields();
                },
                error => console.log(error) 
            );
  }


  //загрузка полей по группам и упихивание всего этого в 2мерный массив allFields, первая размерность которого - группы (сеты), вторая - поля этих сетов
//т.е. массив типа:
//                  группы(сеты)
//
// п       0             1          2
// о    красный      холодный    мягкий        0
// л    синий        теплый      твердый       1
// я    зеленый      горячий                   2
//
  getFields(){
    this.i=0;
    this.maxCountOfFields=0;//обнулили максималное кол-во полей в одном из сетов, т.к. после удаления сета или поля maxCountOfFields нужно пересчитывать
    this.receivedFieldsOfSet=[];//массив для получения полей
    this.receivedSetsOfFields.forEach(set => //для каждого сета полей
      {
        this.queryFormService.getList(this.id, 2, set.id).subscribe(//запросить поля
          (data) => 
          {
            this.receivedFieldsOfSet=data as any [];
            this.allFields[this.i] = []; //и добавили поля второй мерностью в массив allFields
            this.allFields[this.i] = this.receivedFieldsOfSet;
            this.i++;
            if(this.maxCountOfFields<this.receivedFieldsOfSet.length){this.maxCountOfFields=this.receivedFieldsOfSet.length}
          },
          error => console.log(error) 
      );
      });
  }

  refreshShowAllTabs(){
    if(this.id>0){//если в документе есть id
      this.visAfterCreatingBlocks = true;
      this.visBeforeCreatingBlocks = false;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }

  setDefaultCompany(){
    this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    this.refreshPermissions();
  }

  getDocumentValuesById(){
    const docId = {"id": this.id};
    this.http.post('/api/auth/getProductGroupValuesById', docId)
    .subscribe(
        data => {  let documentResponse: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
            //Заполнение формы из интерфейса documentResponse:
            if(data!=null&&documentResponse.company_id!=null){
              this.formAboutDocument.get('id').setValue(+documentResponse.id);
              this.formAboutDocument.get('master').setValue(documentResponse.master);
              this.formAboutDocument.get('creator').setValue(documentResponse.creator);
              this.formAboutDocument.get('changer').setValue(documentResponse.changer);
              this.formAboutDocument.get('company').setValue(documentResponse.company);
              this.formAboutDocument.get('date_time_created').setValue(documentResponse.date_time_created);
              this.formAboutDocument.get('date_time_changed').setValue(documentResponse.date_time_changed);
              this.formBaseInformation.get('company_id').setValue(+documentResponse.company_id);
              this.formBaseInformation.get('company').setValue(documentResponse.company);
              this.formBaseInformation.get('name').setValue(documentResponse.name);
              this.formBaseInformation.get('description').setValue(documentResponse.description);
            } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})} //+++
            this.refreshPermissions();
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }

  createNewDocument(){
    this.http.post('/api/auth/insertProductGroups', this.formBaseInformation.value)
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});break;}
        default:{
          this.id=result;
          this._router.navigate(['/ui/productgroupsdoc', this.id]);
          this.formBaseInformation.get('id').setValue(this.id);
          this.rightsDefined=false; //!!!
          this.getData();
          this.openSnackBar(translate('docs.msg.doc_crtd_suc'),translate('docs.msg.close'));
        } 
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  clickBtnUpdate(){// Нажатие кнопки Сохранить
    this.updateDocument();
  }


  clickBtnChangeFieldsOrder(){
    this.visChangingFieldsOrder=true;
  }
  clickBtnCancelChangeFieldsOrder(){
    this.visChangingFieldsOrder=false;
  }
  clickBtnSaveChangeFieldsOrder(){
    this.visChangingFieldsOrder=false;
    this.saveChangeFieldsOrder();
  }

  saveChangeFieldsOrder(){
    let order:number=1;
    this.orderFieldsRequest=[];
    for (var i=0, len=this.allFields.length; i<len; i++) 
    {
      this.allFields[i].forEach(field => //для каждого поля
        {
          field.output_order=order;
          this.orderFieldsRequest.push(field);
          order++;
        });
    }
    this.receivedSetsOfFields.forEach(set => //для каждого сета полей
    {
      set.output_order=order;
      this.orderFieldsRequest.push(set);
      order++;
    });

    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/saveChangeFieldsOrder', this.orderFieldsRequest)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar(translate('docs.msg.forder_sved_suc'),translate('docs.msg.close'));
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }
  

  updateDocument(){
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateProductGroups', this.formBaseInformation.value)
            
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case 1:{this.getData();this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));break;} 
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_msg')}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},);
  }

  dropSet(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.receivedSetsOfFields, event.previousIndex, event.currentIndex);
  }

  dropField(event: CdkDragDrop<string[]>,setId:number) {
    // console.log("setId - "+setId);
    // console.log("this.allFields.length"+this.allFields.length);
    moveItemInArray(this.allFields[this.getIndexOfColumnContainId(setId)], event.previousIndex, event.currentIndex);
  }

  //т.к. не известно, какому столбцу с полями в массиве allFields (т.е. какому индексу 1й размерности) соответствует определенный набор полей 2й размерности,
  //то производим перебор столбцов полей с parent_set_id. Как только поле parent_set_id совпадет с id сета, значит это искомый индекс
  //и по этому индексу столбца в dropField будет произведена смена порядка полей
  getIndexOfColumnContainId(setIid:number){
    let retColumnIndexi:number;
    for (var i=0, len=this.allFields.length; i<len; i++) 
    {
      this.allFields[i].forEach(field => //для каждого поля
        {
          //console.log("setId - "+field.parent_set_id+", field.name - "+field.name+", ColumnIndex - "+i);
          if (setIid==+field.parent_set_id)
          {
            retColumnIndexi=i;
          };
        });
    }
    return retColumnIndexi;
  }
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}
