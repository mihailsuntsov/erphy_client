import { Component, OnInit , Inject, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { HttpClient} from '@angular/common/http';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { translate } from '@ngneat/transloco'; //+++

interface idNameDescription{
  id: number;
  name: string;
  description: string;
}
@Component({
  selector: 'app-pricing-dialog',
  templateUrl: './pricing-dialog.component.html',
  styleUrls: ['./pricing-dialog.component.css']
})
export class PricingDialogComponent implements OnInit {

  gettingData:boolean=false;
  pricingForm: any; // форма со всей информацией по расценке
  priceTypesList: idNameDescription [] = [];//список типов цен
  priceFieldName: string = ''; // наименование поля с предварительной ценой (ценой до наценки/скидки)
  avgCostPrice:number; // себестоимость
  priceOfTypePrice:number = 0; // цена для выбранного типа цены
  lastPurchasePrice:number = 0; // последняя закупочная цена
  avgPurchasePrice:number = 0; // средняя закупочная цена
  changePrice:number = 0;//наценка/скидка в цифре (например, 50). Переменная нужна для хранения переданного значения, т.к. в зависимости от типа расценки changePrice в форме может быть 0 (например для расценки по Типу цены) или переданным значением (например для расценки по Себестоимости). 
  resultPrice:number=0; // конечная цена
 priceUpDownFieldName:string = translate('modules.field.markup'); // Наименование поля с наценкой-скидкой
  finalPriceToShow:string='0.00';// конечная цена в формате с 2 знаками после запятой, типа 44.99 или 15.00
  // parentDocName:string=''; //наименование родительского документа (Розничная продажа = retailSale, инвентаризация = inventory). От него зависит вид выбора типа расценки pricingType: для розничной продажи это радиокнопки, для 

  constructor(
    private http: HttpClient,
    public PricingDialog: MatDialogRef<PricingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  onNoClick(): void {
    this.PricingDialog.close();
  }

  ngOnInit(): void {
    this.priceTypesList=this.data.priceTypesList;
    this.changePrice=this.data.changePrice;
    // this.parentDocName=this.data.parentDocName;
    this.pricingForm = new FormGroup({
      //тип расценки (радиокнопки: 1. Тип цены (priceType), 2. Себестоимость (costPrice) 3. Вручную (manual))
      pricingType: new FormControl              (this.data.pricingType,[]),
      //тип цены
      priceTypeId: new FormControl              (this.data.priceTypeId,[]),
      // цена до наценки/скидки. В зависимости от выбранного типа расценки может быть ценой типа цены, себестоимостью или ценой, выставленной вручную.
      prePrice: new FormControl                 (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      //наценка/скидка в цифре (например, 50)
      changePrice: new FormControl              (this.data.changePrice,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      //наценка или скидка (+ или -)
      plusMinus: new FormControl                (this.data.plusMinus,[]),
      // тип наценки/скидки (валюта или проценты)
      changePriceType: new FormControl          (this.data.changePriceType,[]),
      //убрать десятые (копейки)
      hideTenths: new FormControl               (this.data.hideTenths,[]),
      //конечная цена (возвращаемая документу при закрытии диалога)
      resultPrice: new FormControl              ('0.00',[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]),
      //сохранить настройки
      saveSettings: new FormControl             (this.data.saveSettings,[]),
    });

    this.getProductPrice();
  }

  onPriceTypeSelection(){
      this.getProductPrice();
  }

  onPricingTypeSelection(){
    switch (this.pricingForm.get('pricingType').value) {
      case 'priceType': {//если Тип цены 
        this.priceFieldName = translate('modules.field.pr_for_sel_pt');
        this.pricingForm.get('prePrice').setValue(this.priceOfTypePrice);
        this.pricingForm.get('changePrice').setValue(this.changePrice);
        break;}
      case 'avgCostPrice': {//если Себестоимость 
        this.priceFieldName = translate('modules.field.cost_');
        this.pricingForm.get('prePrice').setValue(this.avgCostPrice);
        this.pricingForm.get('changePrice').setValue(this.changePrice);
        break;}
      case 'lastPurchasePrice': {//если последняя закупочная цена
        this.priceFieldName = translate('modules.field.last_prch_prc');
        this.pricingForm.get('prePrice').setValue(this.lastPurchasePrice);
        this.pricingForm.get('changePrice').setValue(this.changePrice);
      break;}
      case 'avgPurchasePrice': {//если средняя закупочная цена
        this.priceFieldName = translate('modules.field.avg_prch_prc');
        this.pricingForm.get('prePrice').setValue(this.avgPurchasePrice);
        this.pricingForm.get('changePrice').setValue(this.changePrice);
      break;}
      case 'manual': {      //если Вручную
        this.priceFieldName = translate('modules.field.price');
        this.pricingForm.get('prePrice').setValue(0);
        this.pricingForm.get('changePrice').setValue(0);
        break;
      }
    }
    this.calcFinalPrice();
  }

  getProductPrice(){
    let result:any;
    let price_type_id:number;
    price_type_id=(+this.pricingForm.get('priceTypeId').value==0?0:this.pricingForm.get('priceTypeId').value);
    //  this.http.get('/api/auth/getProductsPriceAndRemains?department_id='+this.data.departmentId+'&product_id='+this.data.productId+'&price_type_id='+price_type_id+'&document_id='+this.data.documentId)
    this.http.get('/api/auth/getProductPricesAll?departmentId='+this.data.departmentId+'&productId='+this.data.productId+'&priceTypeId='+price_type_id)
      .subscribe(
          data => { 
            result=data as any;
            switch (this.pricingForm.get('pricingType').value) {
              case 'priceType': {//если Тип цены 
                this.pricingForm.get('prePrice').setValue(+result.priceOfTypePrice>0?result.priceOfTypePrice:0);
              break;}
              case 'avgCostPrice': {//если Себестоимость 
                this.priceFieldName = translate('modules.field.cost_');
                this.pricingForm.get('prePrice').setValue(+result.avgCostPrice>0?result.avgCostPrice:0);
              break;}
              case 'lastPurchasePrice': {//если последняя закупочная цена
                this.priceFieldName = translate('modules.field.last_prch_prc');
                this.pricingForm.get('prePrice').setValue(+result.lastPurchasePrice>0?result.lastPurchasePrice:0);
              break;}
              case 'avgPurchasePrice': {//если средняя закупочная цена
                this.priceFieldName = translate('modules.field.avg_prch_prc');
                this.pricingForm.get('prePrice').setValue(+result.avgPurchasePrice>0?result.avgPurchasePrice:0);
              break;}
              case 'manual': {      //если Вручную
                this.priceFieldName = translate('modules.field.price');
              break;
              }
            }
            this.avgCostPrice=(+result.avgCostPrice>0?result.avgCostPrice:0);
            this.priceOfTypePrice=(+result.priceOfTypePrice>0?result.priceOfTypePrice:0);
            this.lastPurchasePrice=(+result.lastPurchasePrice>0?result.lastPurchasePrice:0);
            this.avgPurchasePrice=(+result.avgPurchasePrice>0?result.avgPurchasePrice:0);
            this.onPricingTypeSelection();
          },
          error => console.log(error)
      );
  }



  calcFinalPrice(){
    // цена до перерасчета
    let prePrice:number = +this.pricingForm.get('prePrice').value;
    //величина изменения цены (не важно проценты или валюта). Например 50. А чего 50 (проценты или рубли) - это уже другой вопрос
    let priceChangeValue:number = +this.pricingForm.get('changePrice').value;
    // фактическая величина изменения цены 
    let priceChangeDelta:number;


    switch (this.pricingForm.get('changePriceType').value) {
      case 'procents': {//если выбраны проценты 

        priceChangeDelta=prePrice*priceChangeValue/100;
        if(this.pricingForm.get('plusMinus').value=='minus') priceChangeDelta = -priceChangeDelta;

        break;}
      case 'currency': {//если выбрана валюта 

        if(this.pricingForm.get('plusMinus').value=='minus') 
          priceChangeDelta = -priceChangeValue;
        else priceChangeDelta = priceChangeValue;

        break;}
    }
    this.resultPrice=+prePrice+priceChangeDelta;
    if(this.pricingForm.get('hideTenths').value){//если опция "Убрать копейки"
      //отбросим копейки:
      this.resultPrice=+this.numToPrice(this.resultPrice,0);
      //форматируем в вид цены
      this.pricingForm.get('resultPrice').setValue(this.numToPrice(this.resultPrice,2));
    } else {
      //если копейки не обрасываем - прото форматируем в вид цены 
      this.pricingForm.get('resultPrice').setValue(this.numToPrice(this.resultPrice,2));
    }
    // this.resultPrice=this.pricingForm.get('hideTenths').value?+this.resultPrice.toFixed(0):+this.resultPrice.toFixed(2);
  }

  clickPlusMinus(plusMinus:string){
    switch (plusMinus) {
      case 'plus': {
        this.pricingForm.get('plusMinus').setValue('plus');
        this.priceUpDownFieldName=translate('modules.field.markup');
        break;}
      case 'minus': {
        this. pricingForm.get('plusMinus').setValue('minus');
        this.priceUpDownFieldName=translate('modules.field.discount');
        break;}
    }
    this.calcFinalPrice();
  }

  applyPrice(){
    this.PricingDialog.close(this.pricingForm);
  }

  numToPrice(price:number,charsAfterDot:number) {
    //конертим число в строку и отбрасываем лишние нули без округления
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + charsAfterDot + "})?", "g")
    const a = price.toString().match(reg)[0];
    //находим положение точки в строке
    const dot = a.indexOf(".");
    // если число целое - добавляется точка и нужное кол-во нулей
    if (dot === -1) { 
        return a + "." + "0".repeat(charsAfterDot);
    }
    //елси не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  }
  
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  
}
