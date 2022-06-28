import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
 
@Injectable()
export class UploadFileService {
 
  constructor(private http: HttpClient) { }
 
  pushFileToStorage(file: File, companyId: any,anonyme_access:any,  description:string, categoryId:any): Observable<HttpEvent<{}>> {
    const formdata: FormData = new FormData();
//  console.log('description: '+description);
    formdata.append('file', file);
    formdata.append('companyId', companyId);
    formdata.append('anonyme_access', anonyme_access);
    formdata.append('categoryId', categoryId);
    formdata.append('description', description);

    const req = new HttpRequest('POST', '/api/auth/postFile', formdata, {
      reportProgress: true,
      responseType: 'text'
    });
//  console.log("this.http.request(req) - "+this.http.request(req));
    return this.http.request(req);
  }
 
  getFiles(): Observable<any> {
    return this.http.get('/api/auth/getallfiles');
  }
}