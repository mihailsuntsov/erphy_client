import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../auth/token-storage.service';
import { HttpClient } from '@angular/common/http';
import { LoadSpravService } from '../services/loadsprav';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {MessageDialog} from 'src/app/ui/dialogs/messagedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';

/** @title Fixed sidenav */
@Component({
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css'],
  providers: [LoadSpravService]
})
export class UiComponent implements OnInit {

  info: any;
  //переменные прав
  permissionsSet: any[] = [];//сет прав на документ
  userInfo: any;//информация о пользователе
  authorized:boolean=false;

  constructor(
    private token: TokenStorageService,
    private loadSpravService: LoadSpravService, 
    public MessageDialog: MatDialog,
    private _router:Router,
    private http: HttpClient,) {
     
  }
  
  ngOnInit() 
  {
    this.info = {
      token: this.token.getToken(),
      username: this.token.getUsername(),
      authorities: this.token.getAuthorities()
    };
    if(Cookie.get('dokio_token'))
    this.getAllMyPermissions();// -> getPermissions()
    else this._router.navigate(['/login']);
  }
  getAllMyPermissions()
  {
    // alert("getAllMyPermissions");
     this.http.post('/api/auth/getAllMyPermissions', {}) 
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.authorized=true;// если запрос произошел без ошибки 401 (Unauthorized) - значит JWT-ключ еще не протух
                      this.getUserInfo(); 
                  },
                  error => {
                    console.log(error);
                    let errStatus= error.status ? `${error.status} - ${error.statusText}`:'';
                    let errMsg = (error.status=='401'||error.status=='401 - Unauthorized')?'Вы не авторизованы в системе':(error.message) ? error.message :'';
                    this.MessageDialog.open(MessageDialog,
                    {
                      width:'400px',
                      data:{
                        head:'Ошибка!',
                        message:'<p><b>Статус ошибки:</b> '+errStatus+'</p><p><b>Tекст ошибки:</b> '+errMsg+'</p>'
                      }
                    }).afterClosed().subscribe(
                        result => {
                          Cookie.set('dokio_token', '', -1, '/');
                          this.logout();
                        }
                    );
                  },
      );
  }
  hasPermission(permId:number):boolean
  {
    return this.permissionsSet.some(function(e){return(e==permId)})?true:false;
  }
  getUserInfo(){
    this.userInfo=this.loadSpravService.getMyShortInfo()
    .subscribe(
        (data) => {
          this.userInfo=data as any;
        },
        error => console.log(error)
    );
  }
  logout() 
  {
    this.token.signOut();
    window.location.reload();
  }

}


