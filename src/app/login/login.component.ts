// В добавление к использованию AuthService для работы с Observable -объектами, также вызываются методы 
// TokenStorageService для сохранения токена, имени пользователя и прав
/*
В ngOnInit() при загрузке проверяется, есть ли токен в tokenStorage, если есть,
то редиректимся в dashboard, если нет - остаемся на странице логина.
По onSubmit() данные формы с логином и паролем отправляются в AuthService, и сабскрайбимся на результат, в котором
при успешной авторизации прийдет:
accessToken - JWT-ключ. 
username - логин пользователя в системе 
authorities - набор прав 
Затем вызывается метод  reloadPage(), который перезагружает страницу
*/
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DelCookiesService } from '../services/del-cookies.service';
import { TokenStorageService } from '../auth/token-storage.service';// TokenStorageService используется для управления токеном в sessionStorage браузера
import { Router } from '@angular/router';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { TranslocoService } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';
import { translate } from '@ngneat/transloco';
import  packageJson from 'package.json';

// Global settings
interface SettingsGeneral{
showRegistrationLink:boolean;
allowRegistration:boolean;
showForgotLink:boolean;
allowRecoverPassword:boolean;
backendVersion:string;
backendVersionDate:string;
databaseVersion:string;
databaseVersionDate:string;
showInSignin:string;
planDefaultId:number
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [DelCookiesService,Cookie]
})
export class LoginComponent implements OnInit {
  loginform: any ;
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  emptyLogin=false;
  emptyPassword=false;
  frontendVersion=packageJson.version;
  displayVerson=false;
  versionsCompatible=true;     // versions of frontend, backend and database are compatible with each other
  settingsGeneral:SettingsGeneral= {
    allowRecoverPassword: false,
    allowRegistration: false,
    showForgotLink: false,
    showRegistrationLink: false,
    backendVersion:'',
    backendVersionDate:'',
    databaseVersion:'',
    databaseVersionDate:'',
    showInSignin:'',
    planDefaultId:0,
  };


  constructor(
    private authService: AuthService, 
    private tokenStorage: TokenStorageService,
    private _router:Router,
    private service: TranslocoService,
    public MessageDialog: MatDialog,
    private http: HttpClient,
    private delCookiesService: DelCookiesService,) { }

  ngOnInit() {
    if(Cookie.get('language')=='undefined' || Cookie.get('language')==null || Cookie.get('language')=='null')
      this.setLanguage('en');
    this.service.setActiveLang(Cookie.get('language'));
    // if(Cookie.get('language')=='undefined' || Cookie.get('language')==null || Cookie.get('language')=='null') this.setLanguage('en'); else {this.temp_language=Cookie.get('language')}
    if (this.tokenStorage.getToken()&&Cookie.get('dokio_token')) {
      this.isLoggedIn = true;
      this.roles = this.tokenStorage.getAuthorities();
      this.roles.forEach(m=>{
      });
      // console.log("Token="+this.tokenStorage.getToken);
      // console.log("Username="+this.tokenStorage.getUsername);
      this.goToHomePage();
    } else {
      
      this.loginform = new UntypedFormGroup({
        username: new UntypedFormControl ('',[Validators.required,Validators.minLength(4)]),
        password: new UntypedFormControl ('',[Validators.required]),
      });
    }

    this.getSettingsGeneral();
  }
  setLanguage(lang: string) {
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

  onSubmit() {
    if((this.loginform.get("username").value!="") && (this.loginform.get("password").value!="")){
      this.authService.attemptAuth(this.loginform.value).subscribe(//отправляем в authService форму целиком
        data => {
          console.log("data.accessToken ="+data.accessToken);
          this.tokenStorage.saveToken(data.accessToken);
          this.tokenStorage.saveUsername(data.username);
          this.tokenStorage.saveAuthorities(data.authorities);
           Cookie.set('dokio_token',data.accessToken, 1000 * 60 * 60 * 24,'/');
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          this.roles = this.tokenStorage.getAuthorities();
           this.reloadPage();
        },
        error => {
          console.log(error);
          if (error.error.message=="Error -> Unauthorized"){
            this.errorMessage = translate('user.error.unauthorized')
          } else if (error.error.message=="Error -> Not activated"){
            this.errorMessage = translate('user.error.unactivated')
          }else{this.errorMessage = error.error.message;}
          this.isLoginFailed = true;
        }
      );
    }else{
      if(this.loginform.get("username").value==""){
        this.emptyLogin=true;
        console.log("empty login");
      }
      if(this.loginform.get("password").value==""){
        this.emptyPassword=true;
      }
    }
  }

  getSettingsGeneral(){
    return this.http.get('/api/public/getSettingsGeneral')
      .subscribe(
          (data) => {   
              this.settingsGeneral=data as SettingsGeneral;
          },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}, //+++
          );
  }
  getVersionToDisplay():string{
    return packageJson.version.slice(0, 5);
  }
  getVersionWoPatches(v:string):string{
    return v.slice(0, 5);
  }
  isVersionsCompatible():boolean{

    return  this.getVersionWoPatches(packageJson.version)==this.getVersionWoPatches(this.settingsGeneral.backendVersion) && 
            this.getVersionWoPatches(packageJson.version)==this.getVersionWoPatches(this.settingsGeneral.databaseVersion);
  }
  reloadPage() {
    window.location.reload();
    
  }
  goToHomePage() {
    this._router.navigate(['ui/dashboard'])
  }
}
