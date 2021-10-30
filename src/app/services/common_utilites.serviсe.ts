import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
  
@Injectable()
export class CommonUtilitesService{
    constructor(private http: HttpClient){ }
    


  //пересчёт цены в зависимости от настроек (наценка, плюс-минус, проценты/рубли)
  priceFilter(prePrice:number,changePrice:number,changePriceType:string,plusMinus:string,hideTenths:boolean):string{// prePrice - цена до перерасчета
    //величина изменения цены (не важно проценты или валюта). Например 50. А чего 50 (проценты или рубли) - это уже другой вопрос
    let priceChangeValue:number = +changePrice;
    // фактическая величина изменения цены 
    let priceChangeDelta:number;
    switch (changePriceType) {
      case 'procents': {//если выбраны проценты 
        priceChangeDelta=prePrice*priceChangeValue/100;
        if(plusMinus=='minus') priceChangeDelta = -priceChangeDelta;
        break;}
      case 'currency': {//если выбрана валюта 
        if(plusMinus=='minus') 
          priceChangeDelta = -priceChangeValue;
        else priceChangeDelta = priceChangeValue;
        break;}
    }
    let resultPrice=+prePrice+priceChangeDelta;
    let resultPriceText='';
    if(hideTenths){//если опция "Убрать копейки"
      //отбросим копейки:
      resultPrice=+this.numToPrice(resultPrice,0);
      //форматируем в вид цены
      resultPriceText=this.numToPrice(resultPrice,2);
    } else {
      //если копейки не обрасываем - прото форматируем в вид цены 
      resultPriceText=this.numToPrice(resultPrice,2);
    }
    return resultPriceText;
  }


  //Конвертирует число в строку типа 0.00 например 6.40, 99.25
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
    //если не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
  }

  getDocNameByDocAlias(alias: string): string{
    alias=alias.toLowerCase();
    switch(alias){
      case 'return':        {return 'Возврат покупателя';}
      case 'returnsup':     {return 'Возврат поставщику';}
      case 'retailsales':   {return 'Розничная продажа';}
      case 'posting':       {return 'Оприходование';}
      case 'shipment':      {return 'Отгрузка';}
      case 'acceptance':    {return 'Приёмка';}
      default:               return ('документ');
    }
  }

  //Отдает названия методов для маппинга в соответствующие названия сетов в бэкэнде (например для аргумента 'Posting' отдаст 'postingProductTable', который замаппится в этоn сет: private Set<PostingProductForm> postingProductTable;)
  getMethodNameByDocAlias(alias: string): string{
    alias=alias.toLowerCase();
    switch(alias){
      case 'posting':         {return 'postingProductTable';}
      case 'shipment':        {return 'shipmentProductTable';}
      case 'returnsup':       {return 'returnsupProductTable';}
      case 'return':          {return 'returnProductTable';}
      case 'retailsales':     {return 'retailSalesProductTable';}
      case 'acceptance':      {return 'acceptanceProductTable';}
      default:               return (null);
    }
  }



}