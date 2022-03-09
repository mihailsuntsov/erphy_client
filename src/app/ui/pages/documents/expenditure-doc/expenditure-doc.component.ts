import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { LoadSpravService } from '../../../../services/loadsprav';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

interface docResponse {//интерфейс для получения ответа в методе getExpenditureTableById
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
  type: string;
}
interface expenditureList {//интерфейс массива для получения всех статусов текущего документа
  id: string;
  name: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: any;
  name: string;
}

@Component({
  selector: 'app-expenditure-doc',
  templateUrl: './expenditure-doc.component.html',
  styleUrls: ['./expenditure-doc.component.css'],
  providers: [LoadSpravService,]
})
export class ExpenditureDocComponent implements OnInit {

  id: number = 0;// id документа
  createdDocId: string[];//массив для получение id созданного документа
  receivedCompaniesList: any [];//массив для получения списка предприятий
  receivedExpenditureList: idAndName [] = [];//массив для получения списка отделений
  myCompanyId:number=0;
  myId:number=0;
  creatorId:number=0;
  
  //Формы
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  formAboutDocument:any;//форма, содержащая информацию о документе (создатель/владелец/изменён кем/когда)

  //переменные для управления динамическим отображением элементов
  visBeforeCreatingBlocks = true; //блоки, отображаемые ДО создания документа (до получения id)
  visAfterCreatingBlocks = true; //блоки, отображаемые ПОСЛЕ создания документа (id >0)
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
  rightsDefined:boolean = false;//!!!

  statusColor: string;
  expenditureList : expenditureList [] = []; //массив для получения всех статусов текущего документа

  constructor(
    private activateRoute: ActivatedRoute,
    private http: HttpClient,
    public MessageDialog: MatDialog,
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
      name: new FormControl      ('',[Validators.required]),
      type: new FormControl      ('',[Validators.required]),
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
    this.getExpenditureList();

    // ->getMyId()
    // ->getMyCompanyId()
    // ->getCRUD_rights()
    // ->refreshPermissions()
    // ->getData()------>(если созданный док)---> this.getDocumentValuesById(); -->      
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
  return this.http.get('/api/auth/getMyPermissions?id=40')
    .subscribe(
        (data) => {   
                    this.permissionsSet=data as any [];
                    this.getMyId();
                },
        error => console.log(error),
    );
}
  getMyId(){
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => console.log(error)
            );
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);},
      error => console.log(error));
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==498)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==499)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==502)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==503)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==504)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==505)});
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
    console.log("formBaseInformation.get('company_id').value - "+ (+this.formBaseInformation.get('company_id').value));
    console.log("myCompanyId - "+this.myCompanyId);
    console.log("documentOfMyCompany - "+documentOfMyCompany);
    console.log("allowToView - "+this.allowToView);
    console.log("allowToUpdate - "+this.allowToUpdate);
    console.log("allowToCreate - "+this.allowToCreate);
    // return true;
    this.rightsDefined=true;//!!!
  }
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getData(){
    if(+this.id>0){
      this.getDocumentValuesById();
    }else {
      this.getCompaniesList();
    }
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
                error => console.log(error)
            );
  }

  setDefaultCompany(){
    if(this.id==0){
      this.formBaseInformation.get('company_id').setValue(this.myCompanyId);
    }
    this.setDefaultExpenditureType();
    this.refreshPermissions();
  }

  setDefaultExpenditureType(){
    if(this.receivedExpenditureList.length>1)
    {
      this.formBaseInformation.get('type').setValue('other_opex');
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
  }

  getDocumentValuesById(){
          this.http.get('/api/auth/getExpenditureValuesById?id='+this.id)
        .subscribe(
            data => { 
              
                let documentValues: docResponse=data as any;// <- засовываем данные в интерфейс для принятия данных
                //Заполнение формы из интерфейса documentValues:
                if(data!=null&&documentValues.company_id!=null){
                  this.formBaseInformation.get('id').setValue(+documentValues.id);
                  this.formBaseInformation.get('company_id').setValue(+documentValues.company_id);
                  this.formBaseInformation.get('name').setValue(documentValues.name);
                  this.formBaseInformation.get('type').setValue(documentValues.type);
                  this.formAboutDocument.get('master').setValue(documentValues.master);
                  this.formAboutDocument.get('creator').setValue(documentValues.creator);
                  this.formAboutDocument.get('changer').setValue(documentValues.changer);
                  this.formAboutDocument.get('company').setValue(documentValues.company);
                  this.formAboutDocument.get('date_time_created').setValue(documentValues.date_time_created);
                  this.formAboutDocument.get('date_time_changed').setValue(documentValues.date_time_changed);
                  // this.getExpenditureList();
                  //!!!
                } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Недостаточно прав на просмотр'}})}
                this.refreshPermissions();
            },
            error => console.log(error)
        );
  }
  getExpenditureList(){
    this.receivedExpenditureList=this.loadSpravService.getExpenditureList();
  }
  getExpenditureNameById(id:string):string{
    let name:string = 'Не установлен';
    if(this.receivedExpenditureList){
      this.receivedExpenditureList.forEach(a=>{
        if(a.id==id) name=a.name;
      })}
    return(name);
  }
  createNewDocument(){
    this.http.post('/api/auth/insertExpenditure', this.formBaseInformation.value)
    .subscribe(
        (data) =>   {
          let result=data as any;
          switch(result){
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
            default:{
                        this.id=result;
                        this.afterCreateDoc();
                        this.openSnackBar("Статья расходов успешно создана", "Закрыть");
                      } 
                    }
          },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
    }

  updateDocument(){ 
    const body= {
      "id":                       this.formBaseInformation.get('id').value,
      "company_id":               this.formBaseInformation.get('company_id').value,
      "name":                     this.formBaseInformation.get('name').value,
      "type":                     this.formBaseInformation.get('type').value,
    }
      return this.http.post('/api/auth/updateExpenditure', body)
      .subscribe((data) => {   
        let result=data as any;
        switch(result){
          case 1:{this.getData();this.openSnackBar("Успешно сохранено", "Закрыть");break;} 
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  
  // Действия после создания нового документа Счёт покупателю (это самый последний этап).
  afterCreateDoc(){// с true запрос придет при отбиваемом в данный момент чеке
    // Сначала обживаем текущий документ:
    this.rightsDefined=false; //!!!
    this._router.navigate(['/ui/expendituredoc', this.id]);
    this.formBaseInformation.get('id').setValue(this.id);
    this.getData();
  }

  //создание нового документа
  goToNewDocument(){
    this._router.navigate(['ui/expendituredoc',0]);
    this.id=0;
    this.formBaseInformation.get('id').setValue(null);
    this.formBaseInformation.get('name').setValue('');
    this.getSetOfPermissions();//
    this.getExpenditureList();
}


}
