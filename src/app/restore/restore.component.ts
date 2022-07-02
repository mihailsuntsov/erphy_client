import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { TranslocoService } from '@ngneat/transloco';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-restore',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.css'],
  providers: [Cookie]
})
export class RestoreComponent implements OnInit {
  restoreform: any ;
  isLoggedIn = false;
  isRestoreFailed = false;
  errorMessage = '';
  roles: string[] = [];
  emptyRestore=false;
  emptyPassword=false;
  uuid:string='';

  constructor(
    private authService: AuthService, 
    public MessageDialog: MatDialog,
    private service: TranslocoService,
    private _router:Router,) {
    }

  ngOnInit() {
    // alert( Cookie.get('language'))
    if(Cookie.get('language')=='undefined' || Cookie.get('language')==null || Cookie.get('language')=='null')
      this.setLanguage('en');
    this.service.setActiveLang(Cookie.get('language'));
      this.restoreform = new FormGroup({
        email: new FormControl ('',[Validators.required,Validators.email]),
      });
  }

  setLanguage(lang: string) {
    // alert('Now lang in cookie is '+Cookie.get('language')+', changing to '+lang)
    this.service.setActiveLang(lang);
    Cookie.set('language', lang, 8760, '/')
  }

  get language() {
    switch (Cookie.get('language')){
      case 'en': return 'English';
      case 'ru': return 'Русский';
      default: return 'English';
    }
  }
  onReset() {
    this.authService.forgotPass(this.restoreform.get('email').value).subscribe(
      data => {
        let result = data as any;
        switch(result){
          case null:{
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:translate('user.msg.pwd_rep_error')}});
            break;
          }
          case -100:{
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'), message:translate('user.msg.usr_no_fnd_by')}});
            break;
          }
          default:{// returned 1  
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head: translate('user.msg.attention'), message: translate('user.msg.chk_email_pwd'),}});
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
}
