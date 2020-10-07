// Сервис для работы со справочниками
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable()
export class LoadSpravService{
    constructor(private http: HttpClient){ }
    
    getCompaniesList(){return this.http.post('/api/auth/getCompaniesList', '');}

    getDepartmentsListByCompanyId(companyId: number, has_parent: boolean){
        const body = {   
            has_parent:has_parent,
            companyId: companyId  };
        return this.http.post('/api/auth/getMyDepartmentsListByCompanyId', body);}

    getMyCompanyId(){return this.http.get('/api/auth/getMyCompanyId');} 
    
    //загружает деревья категорий
    getFileCategoriesTrees(companyId: number){
        const body = {companyId: companyId};
        return this.http.post('/api/auth/getFileCategoriesTrees', body);}
    

    getImage(imageUrl: string): Observable<Blob> {
        return this.http.get(imageUrl, { responseType: 'blob' });
      }
}
