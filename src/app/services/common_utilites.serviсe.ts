import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
  
@Injectable()
export class CommonUtilitesService{
    constructor(private http: HttpClient){ }
    


  //пересчёт цены в зависимости от настроек (наценка, плюс-минус, проценты/рубли)
  priceFilter(prePrice:number,changePrice:number,changePriceType:string,plusMinus:string,hideTenths:boolean):string{// prePrice - цена до перерасчета
    //величина изменения цены (не важно проценты или валюта). Например 50. А чего 50 (проценты или рубли) - это уже другой вопрос
    console.log("prePrice="+prePrice+", changePrice="+changePrice+", changePriceType="+changePriceType+", plusMinus="+plusMinus+", hideTenths="+hideTenths)
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
    console.log("resultPrice="+resultPrice);
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

  cap(word) // Make first letter big 
  {return word.charAt(0).toUpperCase() + word.slice(1);}

  //Конвертирует число в строку типа 0.00 например 6.40, 99.25
  numToPrice(price:number,charsAfterDot:number,withSpaces?:boolean) {
    //конертим число в строку и отбрасываем лишние нули без округления
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + charsAfterDot + "})?", "g")
    const a = price.toString().match(reg)[0];
    //находим положение точки в строке
    const dot = a.indexOf(".");
    // если число целое - добавляется точка и нужное кол-во нулей
    if (dot === -1) { 
      if(withSpaces)
        return  this.addSpaces(a + "." + "0".repeat(charsAfterDot));
      else
        return a + "." + "0".repeat(charsAfterDot);
    }
    //если не целое число
    const b = charsAfterDot - (a.length - dot) + 1;
    return b > 0 ? (withSpaces?this.addSpaces(a + "0".repeat(b)):(a + "0".repeat(b))) : (withSpaces?this.addSpaces(a):a);
  }

  addSpaces(price:string){
    return parseFloat(price).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1 ");
  }

  getDocNameByDocAlias(alias: string): string{
    alias=alias.toLowerCase();
    switch(alias){
      case 'depositing':    {return 'depositing';}
      case 'return':        {return 'return';}
      case 'returnsup':     {return 'returnsup';}
      case 'retailsales':   {return 'retailsale';}
      case 'posting':       {return 'posting';}
      case 'shipment':      {return 'shipment';}
      case 'acceptance':    {return 'acceptance';}
      case 'ordersup':      {return 'ordersup';}
      case 'invoiceout':    {return 'invoiceout';}
      case 'invoicein':     {return 'invoicein';}
      case 'paymentin':     {return 'paymentin';}
      case 'paymentout':    {return 'paymentout';}
      case 'orderin':       {return 'orderin';}
      case 'orderout':      {return 'orderout';}
      case 'vatinvoiceout': {return 'v_invoiceout';}
      case 'vatinvoicein':  {return 'v_invoicein';}
      case 'writeoff':      {return 'writeoff';}
      default:               return ('');
    }
  }

  //Отдает названия методов для маппинга в соответствующие названия сетов в бэкэнде (например для аргумента 'Posting' отдаст 'postingProductTable', который замаппится в этоn сет: private Set<PostingProductForm> postingProductTable;)
  getMethodNameByDocAlias(alias: string): string{
    alias=alias.toLowerCase();
    switch(alias){
      case 'posting':         {return 'postingProductTable';}
      case 'shipment':        {return 'shipmentProductTable';}
      case 'returnsup':       {return 'returnsupProductTable';}
      case 'ordersup':        {return 'ordersupProductTable';}
      case 'return':          {return 'returnProductTable';}
      case 'retailsales':     {return 'retailSalesProductTable';}
      case 'acceptance':      {return 'acceptanceProductTable';}
      case 'invoiceout':      {return 'invoiceoutProductTable';}
      case 'invoicein':       {return 'invoiceinProductTable';}
      case 'paymentin':       {return '';}//данные документы не содержат в себе списка номенклатуры
      case 'paymentout':      {return '';}
      case 'orderin':         {return '';}
      case 'orderout':        {return '';}
      case 'vatinvoiceout':   {return '';}
      case 'vatinvoicein':    {return '';}
      default:               return (null);
    }
  }

  getAbs(num:number){
    return Math.abs(num);
  }

  getMaxFileSize():number{
    return 10 * 1024 * 1024;// = 10 Mb; Также нужно менять в Java (config/AppInit переменная maxUploadSizeInMb)
  }
}