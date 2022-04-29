import { Component, OnInit } from '@angular/core';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute} from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import {  Validators, FormGroup, FormControl } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-newpass',
  templateUrl: './newpass.component.html',
  styleUrls: ['./newpass.component.css'],
  providers: [Cookie]
})
export class NewpassComponent implements OnInit {
  newpassform: any ;
  errorMessage = '';
  emptyUUID=false;
  emptyPassword=false;
  emptyPassword2=false;
  isPasswordChanged=false;
  uuid:string='';
  showPwd=false;

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService, 
    public MessageDialog: MatDialog,
    private service: TranslocoService,
    // private tokenStorage: TokenStorageService,
    private _router:Router,
    // private Cookie: Cookie,
    // private delCookiesService: DelCookiesService,
    ) {
      if(activateRoute.snapshot.params['uuid'])
        this.uuid = activateRoute.snapshot.params['uuid'];
    }

  ngOnInit() {
    if(Cookie.get('language')=='undefined' || Cookie.get('language')==null) Cookie.set('language', 'en');
    this.setLanguage(Cookie.get('language'));
    if (!this.uuid || this.uuid == '') {
      this.errorMessage = 'user.error.no_pwd_id';
      this.emptyUUID=true;
    }

    this.newpassform = new FormGroup({
      password:  new FormControl ('',[Validators.required,Validators.minLength(6),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
    });



  }
  setLanguage(lang: string) {
    this.service.setActiveLang(lang);
    Cookie.set('language', lang);
  }

  get language() {
    switch (Cookie.get('language')){
      case 'en': return 'English';
      case 'ru': return 'Русский';
      default: return 'English';
    }
  }
  onSubmit() {
    this.authService.setNewPass(this.uuid,this.newpassform.get("password").value).subscribe(
      data => {
        let result = data as any;
        switch(result){
          case null:{
            // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:translate('user.msg.error_msg')}});
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:translate('user.error.pwd_new_error')}});
            break;
          }
          case -101:{
            // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.attention'),message:translate('user.msg.ne_perm')}});
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'), message:translate('user.error.uuid_no_valid')}});
            break;
          }
          default:{// returned 1  
          this.isPasswordChanged = true;          
          }
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:error.error}})},);
    }

  reloadPage() {
    window.location.reload();
    
  }
  goToHomePage() {
    this._router.navigate(['ui/dashboard'])
  }
  password() {
    this.showPwd = !this.showPwd;
  } 
}
