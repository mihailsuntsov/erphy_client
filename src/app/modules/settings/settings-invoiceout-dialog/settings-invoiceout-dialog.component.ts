import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++

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
  selector: 'app-settings-invoiceout-dialog',
  templateUrl: './settings-invoiceout-dialog.component.html',
  styleUrls: ['./settings-invoiceout-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsInvoiceoutDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  // priceTypesList: idNameDescription [] = [];//список типов цен
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка своих отделений
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
 priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  allowToCreateMyDepartments:boolean;

  //для поиска контрагента (получателя) по подстроке
  searchCustomerCtrl = new UntypedFormControl();//поле для поиска
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
    public SettingsDialog: MatDialogRef<SettingsInvoiceoutDialogComponent>,
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

    this.settingsForm = new UntypedFormGroup({
      
      //наименование заказа по умолчанию
      orderName:  new UntypedFormControl               ('',[]),
      //тип расценки (радиокнопки: 1. Тип цены (priceType), 2. Себестоимость (avgCostPrice) 3. Вручную (manual))
      pricingType: new UntypedFormControl              ('priceType',[]),
      //тип цены
      priceTypeId: new UntypedFormControl              (null,[]),
      //наценка/скидка в цифре (например, 50)
      changePrice: new UntypedFormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      //наценка или скидка (+ или -)
      plusMinus: new UntypedFormControl                ('plus',[]),
      // тип наценки/скидки (валюта или проценты)
      changePriceType: new UntypedFormControl          ('procents',[]),
      //убрать десятые (копейки)
      hideTenths: new UntypedFormControl               (true,[]),
      //сохранить настройки
      saveSettings: new UntypedFormControl             (true,[]),
      //предприятие, для которого создаются настройки
      companyId: new UntypedFormControl                (null,[Validators.required]),
      //отделение по умолчанию
      departmentId: new UntypedFormControl             (null,[]),
      //id покупатель по умолчанию
      customerId: new UntypedFormControl               (null,[]),
      //название покупателя по умолчанию
      customer: new UntypedFormControl                 ('',[]),
      //приоритет типа цены : Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      priorityTypePriceSide: new UntypedFormControl    ('defprice',[]),
      //автосоздание на старте документа, если автозаполнились все поля необходимые поля
      autocreate: new UntypedFormControl       (false,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnComplete: new UntypedFormControl(null,[]),
      // автодобавление товара в таблицу товаров
      autoAdd:  new UntypedFormControl                 (false,[]),
    });
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.getSettings();
    
  }
  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsInvoiceout').subscribe
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
          this.settingsForm.get('customerId').setValue(result.customerId);
          this.settingsForm.get('customer').setValue(result.customer);
          this.searchCustomerCtrl.setValue(result.customer);
          this.settingsForm.get('statusIdOnComplete').setValue(result.statusIdOnComplete);
        }
        //данная группа настроек не зависит от предприятия
        this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'priceType');
        this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
        this.settingsForm.get('changePrice').setValue((result.changePrice||result.changePrice==0)?result.changePrice:50);
        this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
        this.settingsForm.get('hideTenths').setValue(result.hideTenths);
        this.settingsForm.get('saveSettings').setValue(result.saveSettings);
        this.settingsForm.get('priorityTypePriceSide').setValue(result.priorityTypePriceSide?result.priorityTypePriceSide:'defprice');
        this.settingsForm.get('autocreate').setValue(result.autocreate);
        this.settingsForm.get('autoAdd').setValue(result.autoAdd);
        
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
    this.searchCustomerCtrl.setValue('');
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
      this.settingsForm.get('departmentId').setValue(this.receivedDepartmentsList[0].id);
    }
  }
  
  clickPlusMinus(plusMinus:string){
    switch (plusMinus) {
      case 'plus': {
        this.settingsForm.get('plusMinus').setValue('plus');
        this.priceUpDownFieldName=translate('modules.field.markup');
        break;}
      case 'minus': {
        this. settingsForm.get('plusMinus').setValue('minus');
        this.priceUpDownFieldName=translate('modules.field.discount');
        break;}
    }
  }

  applyPrice(){
    this.SettingsDialog.close(this.settingsForm);
  }
  //при стирании наименования полностью нужно удалить id покупателя в скрытьм поле customerId 
  
  checkEmptyCagentField(){
    if(this.searchCustomerCtrl.value.length==0){
      this.settingsForm.get('customerId').setValue(null);
      this.settingsForm.get('customer').setValue('');
  }};     
  
  getCagentsList(){ //заполнение Autocomplete
    try {
      if(this.canCagentAutocompleteQuery && this.searchCustomerCtrl.value.length>1){
        const body = {
          "searchString":this.searchCustomerCtrl.value,
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
    this.searchCustomerCtrl.valueChanges
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
    this.settingsForm.get('customerId').setValue(+id);
    this.settingsForm.get('customer').setValue(name);
  }
  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,31) //31 - id документа из таблицы documents
      .subscribe(
          (data) => 
          { this.receivedStatusesList=data as statusInterface[];
            if(+this.settingsForm.get('statusIdOnComplete').value==0) this.setDefaultStatus();
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
