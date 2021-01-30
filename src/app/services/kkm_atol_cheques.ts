// Сервис реализует интеграцию ККМ АТОЛ (платформа 5, драйвер 10.x) с Докио через Атол web-сервер
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
// import { from } from 'rxjs';

@Injectable()
export class KkmAtolChequesService{
    constructor(private http: HttpClient){ }

    // позиция в чеке (например, товар или услуга)
    getChequeItem(){
        const body = {
            "type": "",
            "name": "",
            "price": 0,
            "quantity": 0,
            "amount": 0,
            "department": 0,
            "paymentMethod": "",
            "paymentObject": "",
            
            "tax": {
              "type": ""
            }
        }
        return body;
    }
    //разделитель позиций (необязательно)
    getDividerItem(){
        const body = {
            "type": "text",
            "text": "--------------------------------",
            "alignment": "left",
            "font": 0,
            "doubleWidth": false,
            "doubleHeight": false
        }
        return body;
    }
    //текстовая надпись
    getTextItem(){
        const body = {
            "type": "text",
            "text": "",
            "alignment": "left",
            "doubleWidth": false
        }
        return body;
    }
    //Оплата. В чеке может быть несколько оплат, напримен нал 400 р. и безнал 500р.
    getPayment(){
        const body = {
            "type": "",
            "sum": 0
        }
        return body;
    }
    //основное тело чека прихода
    getCheque(){
        const body = {
            "uuid": "",
            "request": [
                {
                    "type": "",
                    "taxationType": "",
                    "paymentsPlace": "",
                    "ignoreNonFiscalPrintErrors": false,
                    "operator": {
                        "name": "",
                        "vatin": ""
                    },
                    "preItems":[
                    ],
                    "items": [
                    ],
                    "postItems":[
                    ],
                    "payments": [
                    ],
                }
            ]
        }
        return body;
    }
    //основное тело чека коррекции
    getCorrectionCheque11(){
        const body = {
            "uuid": "",
            "request": [
                {
                    "type": "",
                    "taxationType": "",
                    "electronically": false,
                    "ignoreNonFiscalPrintErrors": false,

                    "correctionType": "",
                    "correctionBaseDate": "",
                    "correctionBaseNumber": "",


                    "operator": {
                        "name": "",
                        "vatin": ""
                    },
                    "preItems":[
                    ],
                    "items": [
                    ],
                    "postItems":[
                    ],
                    "payments": [
                    ],
                }
            ]
        }
        return body;
    }
}
