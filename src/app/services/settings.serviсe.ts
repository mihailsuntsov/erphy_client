// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
export interface idAndName {
    id: number;
    name:string;
  }
  
@Injectable()
export class settingsService{
    constructor(private http: HttpClient){ }
    




}