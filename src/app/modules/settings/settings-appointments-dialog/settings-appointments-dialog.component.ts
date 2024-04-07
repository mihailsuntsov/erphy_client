import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++

interface idNameDescription{
  id: number;
  name: string;
  description: string;
}
interface SecondaryDepartment{
  id: number;
  name: string;
  pricetype_id: number;
  reserved: number;
  total: number;
}
interface statusInterface{
  id:number;
  name:string;
  status_type:number;//тип статуса: 1 - обычный; 2 - конечный положительный 3 - конечный отрицательный
  output_order:number;
  color:string;
  description:string;
  is_default:boolean;
}
@Component({
  selector: 'app-settings-appointments-dialog',
  templateUrl: './settings-appointments-dialog.component.html',
  styleUrls: ['./settings-appointments-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsAppointmentsDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка своих отделений
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  allowToCreateMyDepartments:boolean;

  //для поиска контрагента (получателя) по подстроке
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  department_type_price_id: number; //id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  default_type_price_id: number; //id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  status_color: string = '';
  id:number; 

  constructor(private http: HttpClient,
    public PricingDialog: MatDialogRef<SettingsAppointmentsDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.PricingDialog.close();
    }
  
  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    // this.receivedDepartmentsList=this.data.receivedDepartmentsList;
    // this.department_type_price_id=this.data.department_type_price_id;
    // this.cagent_type_price_id=this.data.cagent_type_price_id;
    // this.default_type_price_id=this.data.default_type_price_id;
    this.id=+this.data.id;
    this.allowToCreateAllCompanies=this.data.allowToCreateAllCompanies;
    this.allowToCreateMyCompany=this.data.allowToCreateMyCompany;
    this.allowToCreateMyDepartments=this.data.allowToCreateMyDepartments;

    this.settingsForm = new UntypedFormGroup({
      
      //убрать десятые (копейки)
      hideTenths: new UntypedFormControl               (true,[]),
      //предприятие, для которого создаются настройки
      companyId: new UntypedFormControl                (null,[Validators.required]),
      //отделение по умолчанию
      departmentId: new UntypedFormControl             (null,[]),
      //приоритет типа цены : Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      priorityTypePriceSide: new UntypedFormControl    ('defprice',[]),
      //автосоздание на старте документа, если автозаполнились все поля
      autocreateOnStart: new UntypedFormControl        (false,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnAutocreateOnCheque: new UntypedFormControl(null,[]),
    });
    this.getSettings();
    
  }
  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsAppointments').subscribe
    (
      data => 
      { 
        result=data as any;
        this.gettingData=false;
        //вставляем настройки в форму настроек
        if(this.isCompanyInList(+result.companyId)){
          //данная группа настроек зависит от предприятия
          this.settingsForm.get('companyId').setValue(result.companyId);
          this.settingsForm.get('departmentId').setValue(result.departmentId);
          this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(result.statusIdOnAutocreateOnCheque);
        }
        //данная группа настроек не зависит от предприятия
        this.settingsForm.get('hideTenths').setValue(result.hideTenths);
        this.settingsForm.get('priorityTypePriceSide').setValue(result.priorityTypePriceSide?result.priorityTypePriceSide:'defprice');
        this.settingsForm.get('autocreateOnStart').setValue(result.autocreateOnStart);
        if(+this.settingsForm.get('companyId').value>0){
          this.getDepartmentsList();
          this.getStatusesList();
        }
      },
      error => console.log(error)
    );
  }
  //определяет, есть ли предприятие в загруженном списке предприятий
  isCompanyInList(companyId:number):boolean{
    let inList:boolean=false;
    if(this.receivedCompaniesList) this.receivedCompaniesList.map(i=>{if(i.id==companyId) inList=true;});
    return inList;
  }
  onCompanyChange(){
    this.settingsForm.get('departmentId').setValue(null);
    this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(null);
    this.getDepartmentsList();
    this.getStatusesList();
  }
  getDepartmentsList(newdoc?:boolean){
    this.receivedDepartmentsList=null;
    // this.formBaseInformation.get('department_id').setValue('');
    this.loadSpravService.getDepartmentsListByCompanyId(this.settingsForm.get('companyId').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                  this.getMyDepartmentsList();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }
  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.settingsForm.get('companyId').value,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.doFilterDepartmentsList();
                  this.setDefaultDepartment();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }

  doFilterDepartmentsList(){
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }
  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      let depId:number;
      this.receivedDepartmentsList.forEach(data =>{depId=+data.id;});
      this.settingsForm.get('departmentId').setValue(depId);
    }
    // this.getStatusesList();
  }

  applyPrice(){
    this.PricingDialog.close(this.settingsForm);
  }
  
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,23) //23 - id документа из таблицы documents
      .subscribe(
          (data) => 
          { this.receivedStatusesList=data as statusInterface[];
            if(+this.settingsForm.get('statusIdOnAutocreateOnCheque').value==0) this.setDefaultStatus();
            this.setStatusColor();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }
  setDefaultStatus(){
    if(this.receivedStatusesList.length>0)
    {
      this.receivedStatusesList.forEach(a=>{
          if(a.is_default){
            this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(a.id);
          }
      });
    }
  }
  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.settingsForm.get('statusIdOnAutocreateOnCheque').value){
          this.status_color=m.color;
        }
      });
      console.log(' this.status_color = '+ this.status_color);
  }
}
