import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SignUpInfo } from '../auth/signup-info';
import {  Validators, FormGroup, FormControl } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [Cookie]
})
export class RegisterComponent implements OnInit {
  regform: any  ;
  signupInfo: SignUpInfo;
  isSignedUp = false;
  isSignUpFailed = false;
  errorMessage = '';
  emptyName=false;
  emptyLogin=false;
  emptyEmail=false;
  emptyPassword=false;
  showPwd=false;

  constructor(private authService: AuthService,
    private service: TranslocoService,) { 
    this.regform = new FormGroup({
      name: new FormControl ('',[Validators.required,Validators.minLength(2)]),
      username: new FormControl ('',[Validators.required,Validators.minLength(4),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      email: new FormControl ('',[Validators.required,Validators.email]),
      password: new FormControl ('',[Validators.required,Validators.minLength(6),Validators.maxLength(20),Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]),
      language: new FormControl ('',[]),
    });
  }

  ngOnInit() {
    if(Cookie.get('language')=='undefined' || Cookie.get('language')==null) Cookie.set('language', 'en');
    this.setLanguage(Cookie.get('language'));
  
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
    if( (this.regform.get("name").value!="") && 
        (this.regform.get("username").value!="") && 
        (this.regform.get("email").value!="") && 
        (this.regform.get("password").value!="")&& (!this.regform.invalid))
    {
      console.log(this.regform);
      this.regform.get("language").setValue(Cookie.get('language'));// отправим выбранный при регистрации язык, чтобы сразу прописать его в настройках пользователя при его создании
      this.authService.signUp(this.regform.value).subscribe(
        data => {
          console.log(data);
          this.isSignedUp = true;
          this.isSignUpFailed = false;
        },
        error => {
          console.log(error);
          this.errorMessage = error.error.message;
          this.isSignUpFailed = true;
        }
      );
    }else{
      if(this.regform.get("name").value==""){
        this.emptyName=true;
      }
      if(this.regform.get("username").value==""){
        this.emptyLogin=true;
      }
      if(this.regform.get("email").value==""){
        this.emptyEmail=true;
      }
      if(this.regform.get("password").value==""){
        this.emptyPassword=true;
      }
    }  
  }
  password() {
    this.showPwd = !this.showPwd;
  } 
}
