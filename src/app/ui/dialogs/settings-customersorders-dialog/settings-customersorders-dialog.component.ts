import { Component, OnInit , Inject, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { HttpClient} from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { LoadSpravService } from '../../../services/loadsprav';
import {MessageDialog} from 'src/app/ui/dialogs/messagedialog.component';

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
  selector: 'app-settings-customersorders-dialog',
  templateUrl: './settings-customersorders-dialog.component.html',
  styleUrls: ['./settings-customersorders-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsCustomersordersDialogComponent implements OnInit {

  gettingData:boolean=false;
  settingsForm: any; // форма со всей информацией по настройкам
  priceTypesList: idNameDescription [] = [];//список типов цен
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
  priceUpDownFieldName:string = 'Наценка'; // Наименование поля с наценкой-скидкой
  //для поиска контрагента (получателя) по подстроке
  searchCustomerCtrl = new FormControl();//поле для поиска
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
    public PricingDialog: MatDialogRef<SettingsCustomersordersDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.PricingDialog.close();
    }
  
  ngOnInit(): void {
    this.priceTypesList=this.data.priceTypesList;
    this.receivedDepartmentsList=this.data.receivedDepartmentsList;
    this.department_type_price_id=this.data.department_type_price_id;
    this.cagent_type_price_id=this.data.cagent_type_price_id;
    this.default_type_price_id=this.data.default_type_price_id;
    this.id=+this.data.id;

    this.settingsForm = new FormGroup({
      
      //наименование заказа по умолчанию
      orderName:  new FormControl               ('',[]),
      //тип расценки (радиокнопки: 1. Тип цены (priceType), 2. Себестоимость (costPrice) 3. Вручную (manual))
      pricingType: new FormControl              ('priceType',[]),
      //тип цены
      priceTypeId: new FormControl              (null,[]),
      //наценка/скидка в цифре (например, 50)
      changePrice: new FormControl              (50,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      //наценка или скидка (+ или -)
      plusMinus: new FormControl                ('plus',[]),
      // тип наценки/скидки (валюта или проценты)
      changePriceType: new FormControl          ('procents',[]),
      //убрать десятые (копейки)
      hideTenths: new FormControl               (true,[]),
      //сохранить настройки
      saveSettings: new FormControl             (true,[]),
      //отделение по умолчанию
      departmentId: new FormControl             (null,[]),
      //id покупатель по умолчанию
      customerId: new FormControl               (null,[]),
      //название покупателя по умолчанию
      customer: new FormControl                 ('',[]),
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (this.data.company_id,[]),
      //наименование заказа
      name:  new FormControl                    ('',[]),
      //приоритет типа цены : Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)
      priorityTypePriceSide: new FormControl    ('defprice',[]),
      //автосоздание на старте документа, если автозаполнились все поля
      autocreateOnStart: new FormControl        (false,[]),
      //автосоздание нового документа, если в текущем успешно напечатан чек
      autocreateOnCheque: new FormControl       (false,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnAutocreateOnCheque: new FormControl('',[]),
    });
    this.onCagentSearchValueChanges();//отслеживание изменений поля "Покупатель"
    this.getSettings();
    
  }

  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsCustomersOrders')
      .subscribe(
          data => { 
            result=data as any;
            this.gettingData=false;
            //вставляем настройки в форму настроек

            //если текущее предприятие отлично от того, при котором сохранялись настройки, то данная группа настроек должна быть сброшена, т.к. эти параметры зависят от предприятия:
            if(this.settingsForm.get('companyId').value != +result.companyId){
              this.settingsForm.get('departmentId').setValue(null);
              this.settingsForm.get('customerId').setValue(null);
              this.settingsForm.get('customer').setValue('');
              
              this.searchCustomerCtrl.setValue('');
            } else {
              this.settingsForm.get('departmentId').setValue(result.departmentId);
              this.settingsForm.get('customerId').setValue(result.customerId);
              this.settingsForm.get('customer').setValue(result.customer);
              this.searchCustomerCtrl.setValue(result.customer);
              this.settingsForm.get('statusIdOnAutocreateOnCheque').setValue(result.statusIdOnAutocreateOnCheque);
            }
            //данная группа настроек не зависит от предприятия
            this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'priceType');
            this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
            this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:50);
            this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
            this.settingsForm.get('hideTenths').setValue(result.hideTenths);
            this.settingsForm.get('saveSettings').setValue(result.saveSettings);
            this.settingsForm.get('name').setValue(result.name/*?result.name:''*/);
            this.settingsForm.get('priorityTypePriceSide').setValue(result.priorityTypePriceSide?result.priorityTypePriceSide:'defprice');
            this.settingsForm.get('autocreateOnStart').setValue(result.autocreateOnStart);
            this.settingsForm.get('autocreateOnCheque').setValue(result.autocreateOnCheque);
            this.getStatusesList();

          },
          error => console.log(error)
      );
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

  applyPrice(){
    this.PricingDialog.close(this.settingsForm);
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
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,23) //23 - id документа из таблицы documents
            .subscribe(
                (data) => 
                { this.receivedStatusesList=data as statusInterface[];
                  if(+this.settingsForm.get('statusIdOnAutocreateOnCheque').value==0) this.setDefaultStatus();
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
//--------------------------------------------------------------------------------------------------

  getPriceTypesNameById(id:number):string{
    if(id) //если настройки вызываются из меню (где список документов), а не из документа, то id-шники типов цен для отделения, пользователя и поумолчанию не передаются
    //соответственно названия названия типов цен для приоритетов цены устанавливать не надо
    // {
    //   let name:string = this.id>0?'(тип цены не установлен)':'';
    //   if(this.id>0){
    //     this.priceTypesList.forEach(a=>{
    //       if(a.id==id) name='('+a.name+')';
    //     })
    //   }
    //   return(name);
    // } else return('');
    return('');
  }
     
}
