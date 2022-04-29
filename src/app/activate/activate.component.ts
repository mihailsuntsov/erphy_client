import { Component, OnInit } from '@angular/core';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute} from '@angular/router';
import { AuthService } from '../auth/auth.service';
// import { TokenStorageService } from '../auth/token-storage.service';// TokenStorageService используется для управления токеном в sessionStorage браузера
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { translate } from '@ngneat/transloco'; //+++
// import { Cookie } from 'ng2-cookies/ng2-cookies';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css'],
  providers: [Cookie]
})
export class ActivateComponent implements OnInit {
  errorMessage = '';
  emptyUUID=false;
  act_code_novalid=false;
  isActivated=false;
  uuid:string='';

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService, 
    public MessageDialog: MatDialog,
    private service: TranslocoService,
    private _router:Router,
    ) {
      if(activateRoute.snapshot.params['uuid'])
        this.uuid = activateRoute.snapshot.params['uuid'];
    }

  ngOnInit() {
    if(Cookie.get('language')=='undefined' || Cookie.get('language')==null) Cookie.set('language', 'en');
    this.setLanguage(Cookie.get('language'));

    if (!this.uuid || this.uuid == '') {
      this.errorMessage = 'user.error.no_activ_uuid';
      this.emptyUUID=true;
    } else this.onSubmit();

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
    this.authService.activate(this.uuid).subscribe(
      data => {
        let result = data as any;
        switch(result){
          case null:{
            // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:translate('user.msg.error_msg')}});
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:translate('user.error.activ_error')}});
            break;
          }
          case -102:{
            // this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.attention'),message:translate('user.msg.ne_perm')}});
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'), message:translate('user.error.act_code_nova')}});
            this.errorMessage='user.error.act_code_nova'; this.act_code_novalid=true;
            break;
          }
          default:{// returned 1  
          this.isActivated = true;          
          }
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('user.msg.error'),message:error.error}})},);
    }

  }
