import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from './loadsprav';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { QueryFormService } from './get-productgroups-fields-list.service';
import { QueryForm } from './query-form';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ProductGroupFieldsDialogComponent } from 'src/app/ui/dialogs/product-group-fields-dialog/product-group-fields-dialog.component';
import {  ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';

interface dockResponse {//интерфейс для получения ответа в методе getUserValuesById
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

  interface isIt_Dock_Response {//интерфейс для получения ответа по набору проверок на документ (документ моего предприятия?/документ предприятий мастер-аккаунта?)
    itIsDocumentOfMyCompany:boolean;
    itIsDocumentOfMyMastersCompanies:boolean;
  }



@Component({
  selector: 'app-productgroups-dock',
  templateUrl: './productgroups-dock.component.html',
  styleUrls: ['./productgroups-dock.component.css'],
  providers: [LoadSpravService,QueryFormService]
})
export class ProductgroupsDockComponent implements OnInit {
  id: number;// id документа
  createdDockId: string[];//массив для получение id созданного документа
  updateDocumentResponse: string;//массив для получения данных
  receivedCompaniesList: any [];//массив для получения списка предприятий
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


  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
  visBtnUpdate = false;
  
  visBtnChangeFieldsOrder = true;
  visChangingFieldsOrder = false;


  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreate:boolean = false;
  allowToUpdateAllCompanies:boolean = false;//разрешение на...
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMy:boolean = false;
  itIsDocumentOfMyCompany:boolean = false;//набор проверок на документ (документ моего предприятия?/документ моих отделений?/документ мой?/)
  itIsDocumentOfMyMastersCompanies:boolean = false;
  canUpdateThisDock:boolean = false;


  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    private loadSpravService:   LoadSpravService,
    private queryFormService:   QueryFormService,
    private _snackBar: MatSnackBar,
    public productGroupFieldsDialog: MatDialog,
    public ConfirmDialog: MatDialog) { 
      //console.log(this.activateRoute);
      this.id = +activateRoute.snapshot.params['id'];// +null returns 0
    }

  ngOnInit() {
    // this.sendingQueryForm.field_type="1";
    //   this.sendingQueryForm.sortColumn="p.name";
    //   this.sendingQueryForm.offset=0;

    this.formBaseInformation = new FormGroup({
      id: new FormControl      (this.id,[]),
      company_id: new FormControl      ('',[Validators.required]),
      company: new FormControl      ('',[]),
      name: new FormControl      ('',[Validators.required]),
      description: new FormControl      ('',[]),
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
   // this.checkedList = [];

    this.getSetOfPermissions();
  }
  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=10')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            // console.log("permissions:"+this.permissionsSet);
                            if(+this.id>0) this.IsItMy_DockCheckings(+this.id); else this.getCRUD_rights(this.permissionsSet);
                            //this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
  }
  IsItMy_DockCheckings(id:number){// проверки на документ (документ моего предприятия?)
    const body = {"documentId": id};//
          return this.http.post('/api/auth/getIsItMy_ProductGroups_JSON', body) 
            .subscribe(
                (data) => {   let isItMy_Dock: isIt_Dock_Response=data as any;  
                  this.itIsDocumentOfMyCompany = isItMy_Dock.itIsDocumentOfMyCompany;
                  this.itIsDocumentOfMyMastersCompanies= isItMy_Dock.itIsDocumentOfMyMastersCompanies;
                            this.getCRUD_rights(this.permissionsSet);
                        },
                error => console.log(error),
            );
  }
  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
    this.allowToUpdateAllCompanies = permissionsSet.some(this.isAllowToUpdateAllCompanies);
    this.allowToUpdateMyCompany = permissionsSet.some(this.isAllowToUpdateMyCompany);
    
  if  (this.allowToUpdateAllCompanies ||                                     //если есть права изменять доки всех предприятий
      (this.itIsDocumentOfMyCompany && this.allowToUpdateMyCompany)||             //или это мое предприятие и есть права изменять доки своего предприятия
      ((this.allowToUpdateAllCompanies||this.allowToUpdateAllCompanies) && this.allowToCreate && +this.id==0))//или документ только создаётся и я могу всё что выше
      {this.canUpdateThisDock=true;}

    this.visAfterCreatingBlocks=!this.allowToCreate;

    this.getData();
  }
  isAllowToCreate   (e){return(e==111);}   //  Cоздание
  isAllowToUpdateAllCompanies(e){return(e==115);}    //редактирование доков всех доступных предприятий
  isAllowToUpdateMyCompany(e){return(e==116);}       //редактирование доков моего предприятия

  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
      console.log("getDocumentValuesById");
      this.maxCountOfFields=0;//обнулили максималное кол-во полей в одном из сетов, т.к. после удаления сета или поля maxCountOfFields нужно пересчитывать
      this.getSets(this.id,"1","0")//загрузить сеты и поля этого документа
    }else {
      this.getCompaniesList();
      console.log("getCompaniesList");
    }
    this.refreshShowAllTabs();
  }

  clickBtnAddField(): void {
    const dialogRef = this.productGroupFieldsDialog.open(ProductGroupFieldsDialogComponent, {
      width: '800px', 
      data:
      { 
        company_id: this.formBaseInformation.get('company_id').value , 
        group_id: +this.id,
        sets:this.receivedSetsOfFields,
        field_type: 2,
        dockName:"Создание поля",
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
        dockName:"Создание группы полей"
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
        dockName:"Редактирование группы полей",
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
        dockName:"Редактирование поля",
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
        head: 'Удаление поля',
        query: 'Удалить поле "'+name+'"?',
        warning: 'Данное поле во всех товарах этой группы будет удалено.',
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
        head: 'Удаление группы полей',
        query: 'Удалить группу полей "'+name+'"?',
        warning: 'Все поля, которые содержит данная группа, а также соответствующие поля во всех товарах, содержащих данную группу полей, будут удалены.',
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
                    this.openSnackBar("Успешно удалено", "Закрыть");
                    this.getSets(this.id,"1","0");
                },
        error => console.log(error),
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
// я    зеленый      гррячий                   2
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
      this.visBtnUpdate = this.canUpdateThisDock;
    }else{
      this.visAfterCreatingBlocks = false;
      this.visBeforeCreatingBlocks = true;
    }
  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => 
                {
                  this.receivedCompaniesList=data as any [];
                  this.setDefaultCompany();
                },                      
                error => console.log(error)
            );
  }
  setDefaultCompany(){
    if(this.receivedCompaniesList.length==1)
    {
      this.receivedCompaniesList.forEach(data =>{this.defaultId=+data.id;});
      this.formBaseInformation.get('company_id').setValue(this.defaultId);
      //this.getDepartmentsList();
    }//else this.getDepartmentsList();
  }
  getDocumentValuesById(){
    const dockId = {"id": this.id};
          this.http.post('/api/auth/getProductGroupValuesById', dockId)
        .subscribe(
            data => {  let documentResponse: dockResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentResponse:
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
            },
            error => console.log(error)
        );
  }
  clickBtnCreateNewDocument(){// Нажатие кнопки Записать
    this.createNewDocument();
  }

  createNewDocument(){
    this.createdDockId=null;
    this.http.post('/api/auth/insertProductGroups', this.formBaseInformation.value)
            .subscribe(
                (data) =>   {
                                this.createdDockId=data as string [];
                                this.id=+this.createdDockId[0];
                                this.formBaseInformation.get('id').setValue(this.id);
                                this.getData();
                                this.openSnackBar("Документ \"Группы товаров\" успешно создан", "Закрыть");
                            },
                error => console.log(error),
            );
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
                            this.openSnackBar("Порядок полей успешно сохранён", "Закрыть");
                        },
                error => console.log(error),
            );
  }
  

  updateDocument(){
    this.updateDocumentResponse=null;
    return this.http.post('/api/auth/updateProductGroups', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                            this.updateDocumentResponse=data as string;
                            this.getData();
                            this.openSnackBar("Документ \"Группы товаров\" сохранён", "Закрыть");
                        },
                error => console.log(error),
            );
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
}
