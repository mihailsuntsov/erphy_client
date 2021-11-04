import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';

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
  selector: 'app-settings-invoicein-dialog',
  templateUrl: './settings-invoicein-dialog.component.html',
  styleUrls: ['./settings-invoicein-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsInvoiceinDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  // priceTypesList: idNameDescription [] = [];//список типов цен
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка своих отделений
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
  priceUpDownFieldName:string = 'Наценка'; // Наименование поля с наценкой-скидкой
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  allowToCreateMyDepartments:boolean;

  //для поиска контрагента (получателя) по подстроке
  searchCagentCtrl = new FormControl();//поле для поиска
  isCagentListLoading = false;//true когда идет запрос и загрузка списка. Нужен для отображения индикации загрузки
  canCagentAutocompleteQuery = false; //можно ли делать запрос на формирование списка для Autocomplete, т.к. valueChanges отрабатывает когда нужно и когда нет.
  filteredCagents: any;
  department_type_price_id: number; //id тип цены в отделении (Складе), для которого создавался данный документ. Нужен для изменения поля Тип цены
  cagent_type_price_id: number; //id типа цены покупателя, для которого создавался данный документ.  Нужен для изменения поля Тип цены
  default_type_price_id: number; //id типа цены, установленный по умолчанию.  Нужен для изменения поля Тип цены
  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  status_color: string = '';
  id:number; 

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsInvoiceinDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  
  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    // this.receivedDepartmentsList=this.data.receivedDepartmentsList;
    // this.priceTypesList=this.data.priceTypesList;
    // this.department_type_price_id=this.data.department_type_price_id;
    // this.cagent_type_price_id=this.data.cagent_type_price_id;
    // this.default_type_price_id=this.data.default_type_price_id;
    this.id=+this.data.id;
    this.allowToCreateAllCompanies=this.data.allowToCreateAllCompanies;
    this.allowToCreateMyCompany=this.data.allowToCreateMyCompany;
    this.allowToCreateMyDepartments=this.data.allowToCreateMyDepartments;

    this.settingsForm = new FormGroup({
      
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[Validators.required]),
      //отделение по умолчанию
      departmentId: new FormControl             (null,[]),
      //id Поставщик по умолчанию
      cagentId: new FormControl               (null,[]),
      //название поставщика по умолчанию
      cagent: new FormControl                 ('',[]),
      //автосоздание на старте документа, если автозаполнились все поля необходимые поля
      autocreate: new FormControl       (false,[]),
      //статус при успешном проведении
      statusIdOnComplete: new FormControl(null,[]),
      // автодобавление товара в таблицу товаров
      autoAdd:  new FormControl                 (false,[]),
      // автовыставление цены (последняя закупочная цена)
      autoPrice:  new FormControl                 (false,[]),

    });
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Поставщик"
    this.getSettings();
    
  }
  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsInvoicein').subscribe
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
          this.settingsForm.get('cagentId').setValue(result.cagentId);
          this.settingsForm.get('cagent').setValue(result.cagent);
          this.searchCagentCtrl.setValue(result.cagent);
          this.settingsForm.get('statusIdOnComplete').setValue(result.statusIdOnComplete);
        }
        //данная группа настроек не зависит от предприятия
        this.settingsForm.get('autocreate').setValue(result.autocreate);
        this.settingsForm.get('autoAdd').setValue(result.autoAdd);
        this.settingsForm.get('autoPrice').setValue(result.auto_price);
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
    this.searchCagentCtrl.setValue('');
    this.settingsForm.get('statusIdOnComplete').setValue(null);
    this.checkEmptyCagentField();
    this.getDepartmentsList();
    this.getStatusesList();
  }
  getDepartmentsList(newdoc?:boolean){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(this.settingsForm.get('companyId').value,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                  this.getMyDepartmentsList();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.settingsForm.get('companyId').value,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.doFilterDepartmentsList();
                  this.setDefaultDepartment();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  doFilterDepartmentsList(){
    if(!this.allowToCreateAllCompanies && !this.allowToCreateMyCompany && this.allowToCreateMyDepartments){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }
  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      this.settingsForm.get('departmentId').setValue(this.receivedDepartmentsList[0].id);
    }
  }
  
  clickPlusMinus(plusMinus:string){
    switch (plusMinus) {
      case 'plus': {
        this.settingsForm.get('plusMinus').setValue('plus');
        this.priceUpDownFieldName='Наценка';
        break;}
      case 'minus': {
        this. settingsForm.get('plusMinus').setValue('minus');
        this.priceUpDownFieldName='Скидка';
        break;}
    }
  }

  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }
  //при стирании наименования полностью нужно удалить id покупателя в скрытьм поле cagentId 
  
  checkEmptyCagentField(){
    if(this.searchCagentCtrl.value.length==0){
      this.settingsForm.get('cagentId').setValue(null);
      this.settingsForm.get('cagent').setValue('');
  }};     
  
  getCagentsList(){ //заполнение Autocomplete
    try {
      if(this.canCagentAutocompleteQuery && this.searchCagentCtrl.value.length>1){
        const body = {
          "searchString":this.searchCagentCtrl.value,
          "companyId":this.settingsForm.get('companyId').value};
        this.isCagentListLoading  = true;
        return this.http.post('/api/auth/getCagentsList', body);
      }else return [];
    } catch (e) {
      return [];}}
  
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  
  onCagentSearchValueChanges(){
    this.searchCagentCtrl.valueChanges
    .pipe(
      debounceTime(500),
      tap(() => {
        this.filteredCagents = [];}),       
      switchMap(fieldObject =>  
        this.getCagentsList()))
    .subscribe(data => {
      this.isCagentListLoading = false;
      if (data == undefined) {
        this.filteredCagents = [];
      } else {
        this.filteredCagents = data as any;
  }});}

  onSelectCagent(id:number,name:string){
    this.settingsForm.get('cagentId').setValue(+id);
    this.settingsForm.get('cagent').setValue(name);
  }
  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,32) //32 - id документа из таблицы documents
      .subscribe(
          (data) => 
          { this.receivedStatusesList=data as statusInterface[];
            if(+this.settingsForm.get('statusIdOnComplete').value==0) this.setDefaultStatus();
            this.setStatusColor();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
           
  }
  setDefaultStatus(){
    if(this.receivedStatusesList.length>0)
    {
      this.receivedStatusesList.forEach(a=>{
          if(a.is_default){
            this.settingsForm.get('statusIdOnComplete').setValue(a.id);
          }
      });
    }
  }
  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.settingsForm.get('statusIdOnComplete').value){
          this.status_color=m.color;
        }
      });
      console.log(' this.status_color = '+ this.status_color);
  }
//--------------------------------------------------------------------------------------------------

  getPriceTypesNameById(id:number):string{
     return('');
  }

}