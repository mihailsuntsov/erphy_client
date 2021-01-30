// Сервис реализует интеграцию ККМ АТОЛ (платформа 5, драйвер 10.x) с Докио через Атол web-сервер
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { from } from 'rxjs';

@Injectable()
export class KkmAtolService{
        constructor(private http: HttpClient){ }

// ------ *** Управление режимом работы ККТ *** ------

//Изменение устройства по умолчанию
    setDefaultDevice(id: string){
        const body = {id: id,};
        return this.http.post('http://127.0.0.1:16732/api/v2/setDefaultDevice', body);}

//Запрос информации о ККТ   
    queryDeviceInfo(address:string, requestType:string,deviceID:string=''){
        const params=(deviceID!=''?('?deviceID='+deviceID):'')//
        return from(
            fetch(address+'/api/v2/operations/queryDeviceInfo'+params,
                {
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            ).then(function(response) {
                switch(requestType){
                    case 'info': {
                        return response.json();
                    }
                    case 'errorCode': {
                        return response.status;
                    }
                }
                
            }
        ));
    }
    //открывает смену    
    openShift(address:string,uuid:string,deviceID:string,cashierFio:string,cashierVatin:string){
        const params=('?deviceID='+deviceID)
        const body = {
            uuid: uuid,
            request: [
              {
                type: "openShift",
                operator: {
                    name: cashierFio,
                    vatin: cashierVatin
                }
              }
            ]
        };
        return from(
            fetch(address+'/api/v2/requests'+params,
                {
                    body: JSON.stringify(body),
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            )
        )
    }

    //закрывает смену
    closeShift(address:string,uuid:string,deviceID:string,cashierFio:string,cashierVatin:string){
        const params=('?deviceID='+deviceID)
        const body = {
            uuid: uuid,
            request: [
                {
                type: "closeShift",
                operator: {
                    name: cashierFio,
                    vatin: cashierVatin
                }
                }
            ]
        };
        return from(
            fetch(address+'/api/v2/requests'+params,
                {
                    body: JSON.stringify(body),
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            )
        )
    }
    // печать Х-отчета
    printXreport(address:string,uuid:string,deviceID:string,cashierFio:string,cashierVatin:string){
        const params=('?deviceID='+deviceID)
        const body = {
            uuid: uuid,
            request: [
                {
                type: "reportX",
                operator: {
                    name: cashierFio,
                    vatin: cashierVatin
                }
            }]
        };
        return from(
            fetch(address+'/api/v2/requests'+params,
                {
                    body: JSON.stringify(body),
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            )
        )
    }
    //Запрос информации о смене в ККТ   
    queryShiftStatus(address:string,requestType:string,deviceID:string){
        const params=('?deviceID='+deviceID)//
        return from(
            fetch(address+'/api/v2/operations/queryShiftStatus'+params,
                {
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            ).then(function(response) {
                switch(requestType){
                    case 'status': {
                        return response.json();
                    }
                    case 'errorCode': {
                        return response.status;
                    }
                }
            }
        ));
    }
     //Чек прихода (с печатью на чековой ленте)
    receipt(body:Object){
        return from(
            fetch('http://127.0.0.1:16732/api/v2/requests',
                {
                    body: JSON.stringify(body),
                    headers:{'Content-Type': 'application/json'},
                    method: 'POST',
                }
            )
        )
    }
    //Результат задания с uuid 
    getTaskCode(uuid:string){
        return from(
            fetch('http://127.0.0.1:16732/api/v2/requests/'+uuid,
                {
                    // headers:{'Content-Type': 'application/json'},
                    headers:{'Content-Type': 'text/plain'},
                    method: 'GET',
                }).then(function(response) {
                    return response.status;
                }
    ))}
            
    //Результат задания с uuid 
    getTaskStatus(uuid:string){
        return from(
            fetch('http://127.0.0.1:16732/api/v2/requests/'+uuid,
                {
                    // headers:{'Content-Type': 'application/json'},
                    headers:{'Content-Type': 'text/plain'},
                    method: 'GET',
                }
            )
            .then(function(response) {
                return response.json();
            }
        )
    )}
    
}
