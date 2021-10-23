import { Component, OnInit , Inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormGroup,  FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
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
interface idNameDescription{
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-settings-moving-dialog',
  templateUrl: './settings-moving-dialog.component.html',
  styleUrls: ['./settings-moving-dialog.component.css'],
  providers: [LoadSpravService,]
})
export class SettingsMovingDialogComponent implements OnInit {

  gettingData:boolean=false;
  priceTypesList: idNameDescription [] = [];//список типов цен
  settingsForm: any; // форма со всей информацией по настройкам
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: SecondaryDepartment [] = [];//массив для получения списка своих отделений
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
  priceUpDownFieldName:string = 'Наценка'; // Наименование поля с наценкой-скидкой
  //права
  allowToCreateAllCompanies:boolean;
  allowToCreateMyCompany:boolean;
  allowToCreateMyDepartments:boolean;

  receivedStatusesList: statusInterface [] = []; // массив для получения статусов
  status_color: string = '';
  id:number; // id головного документа (вызвавшего настройки).

  constructor(private http: HttpClient,
    public SettingsDialog: MatDialogRef<SettingsMovingDialogComponent>,
    public MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.SettingsDialog.close();
    }
  
  ngOnInit(): void {
    this.receivedCompaniesList=this.data.receivedCompaniesList;
    this.id=+this.data.id;
    this.allowToCreateAllCompanies=this.data.allowToCreateAllCompanies;
    this.allowToCreateMyCompany=this.data.allowToCreateMyCompany;
    this.allowToCreateMyDepartments=this.data.allowToCreateMyDepartments;

    this.settingsForm = new FormGroup({
      // предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[Validators.required]),
      // id отделения из
      departmentFromId: new FormControl             (null,[]),
      // id отделения в
      departmentToId: new FormControl             (null,[]),
      // тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
      pricingType: new FormControl              ('avgCostPrice',[]), // по умолчанию ставим "Средняя закупочная цена"
      // тип цены
      priceTypeId: new FormControl              (null,[]),
      // наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
      changePrice: new FormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]), // по умолчанию "плюс 10%"
      // Наценка (plus) или скидка (minus)
      plusMinus: new FormControl                ('plus',[]),
      // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
      changePriceType: new FormControl          ('procents',[]),
      // убрать десятые (копейки)
      hideTenths: new FormControl               (true,[]),
      // статус после завершения инвентаризации
      statusOnFinishId: new FormControl         ('',[]),
      // автодобавление товара из формы поиска в таблицу
      autoAdd:  new FormControl                 (false,[]),
    });
    this.getSettings();
    
  }
  //загрузка настроек
  getSettings(){
    let result:any;
    this.gettingData=true;
    this.http.get('/api/auth/getSettingsMoving').subscribe
    (
      data => 
      { 
        result=data as any;
        this.gettingData=false;
        //вставляем настройки в форму настроек
        this.settingsForm.get('companyId').setValue(result.companyId);
        //данная группа настроек зависит от предприятия
        this.settingsForm.get('departmentFromId').setValue(result.departmentFromId);
        this.settingsForm.get('departmentToId').setValue(result.departmentToId);
        this.settingsForm.get('statusOnFinishId').setValue(result.statusOnFinishId);
        this.settingsForm.get('priceTypeId').setValue(result.priceTypeId);
        //данная группа настроек не зависит от предприятия
        this.settingsForm.get('pricingType').setValue(result.pricingType?result.pricingType:'avgCostPrice');
        this.settingsForm.get('plusMinus').setValue(result.plusMinus?result.plusMinus:'plus');
        this.settingsForm.get('changePrice').setValue(result.changePrice?result.changePrice:0);
        this.settingsForm.get('changePriceType').setValue(result.changePriceType?result.changePriceType:'procents');
        this.settingsForm.get('hideTenths').setValue(result.hideTenths);
        this.settingsForm.get('autoAdd').setValue(result.autoAdd);
        if(+this.settingsForm.get('companyId').value>0){
          this.getDepartmentsList();
          this.getStatusesList();
          this.getPriceTypesList();
        }
      },
      error => console.log(error)
    );
  }

  getPriceTypesList(){
    this.priceTypesList=null;
    this.loadSpravService.getPriceTypesList(this.settingsForm.get('companyId').value)
    .subscribe(
      (data) => {
        this.priceTypesList=data as any [];
      },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }

  clickPlusMinus(plusMinus:string){
    this.settingsForm.get('plusMinus').setValue(plusMinus);
    this.checkPlusMinus();
  }

  checkPlusMinus(){
    switch (this.settingsForm.get('plusMinus').value) {
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
  //при изменении предприятия необходимо загрузить все зависимые от него справочники, удалив выбранные по старому предприятию параметры (отделения, тип цены, статусы)
  onCompanyChange(){
    this.settingsForm.get('departmentFromId').setValue(null);
    this.settingsForm.get('departmentToId').setValue(null);
    this.settingsForm.get('statusOnFinishId').setValue(null);
    this.settingsForm.get('priceTypeId').setValue(null);
    this.getDepartmentsList();
    this.getStatusesList();
    this.getPriceTypesList();
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
      this.settingsForm.get('departmentFromId').setValue(this.receivedDepartmentsList[0].id);
      this.settingsForm.get('departmentToId').setValue(this.receivedDepartmentsList[0].id);
    }
  }

  applySettings(){
    this.SettingsDialog.close(this.settingsForm);
  }

  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}

  //------------------------------С Т А Т У С Ы-------------------------------------------------
  getStatusesList(){
    this.receivedStatusesList=null;
    this.loadSpravService.getStatusList(this.settingsForm.get('companyId').value,30) //30 - id документа из таблицы documents
      .subscribe(
          (data) => 
          { this.receivedStatusesList=data as statusInterface[];
            if(+this.settingsForm.get('statusOnFinishId').value==0) this.setDefaultStatus();
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
            this.settingsForm.get('statusOnFinishId').setValue(a.id);
          }
      });
    }
  }

  //устанавливает цвет статуса (используется для цветовой индикации статусов)
  setStatusColor():void{
    this.receivedStatusesList.forEach(m=>
      {
        if(m.id==+this.settingsForm.get('statusOnFinishId').value){
          this.status_color=m.color;
        }
      });
      console.log(' this.status_color = '+ this.status_color);
  }
  onPriceTypeSelection(){

  }

}
