import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../auth/token-storage.service';
import { HttpClient } from '@angular/common/http';

/** @title Fixed sidenav */
@Component({
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css']
})
export class UiComponent implements OnInit {

  info: any;
  //переменные прав
  permissionsSet: any[] = [];//сет прав на документ
  
  constructor(private token: TokenStorageService,private http: HttpClient,) {
     
  }
  
  ngOnInit() 
  {
    this.info = {
      token: this.token.getToken(),
      username: this.token.getUsername(),
      authorities: this.token.getAuthorities()
    };
    // this.info.authorities.forEach(function(item, i, arr) {
    //   console.log( i + ": " + item + " (массив:" + arr + ")" );
    // });
    this.getAllMyPermissions();// -> getPermissions()
  }
  getAllMyPermissions()
  {
        return this.http.post('/api/auth/getAllMyPermissions', {}) 
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                  },
          error => console.log(error),
      );
  }
  hasPermission(permId:number):boolean
  {
    return this.permissionsSet.some(function(e){return(e==permId)})?true:false;
  }
  logout() 
  {
    this.token.signOut();
    window.location.reload();
  }

}


