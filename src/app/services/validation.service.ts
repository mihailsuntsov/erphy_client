import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }


  //Check Site contains SSL Security protocol  or Not.
  static secureSiteValidator(control){
    if (!control.value.startsWith('https') || !control.value.includes('.in')) {
      return { IsSecureSite: true };
    }

    return null;
  }

  //Email Validator
  static emailValidator(control) {
    if(control.value != undefined && control.value.trim().length>0)
    {
        if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/))
        {
          return null;
        } else {
          return { 'InvalidEmail': true };
        }
    } else { 
      return null;
    }
  }

    //Date dd.mm.yyyy Validator
    static dateValidator(control) {
      if(control.value != undefined && control.value.trim().length>0)
      {
      //  console.log("Первый");
          if (
              control.value.match(/^(((0[1-9]|[12]\d|3[01])\.(0[13578]|1[02])\.((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\.(0[13456789]|1[012])\.((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\.02\.((19|[2-9]\d)\d{2}))|(29\.02\.((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/)
             )
          {
            return null;
          } else {
           // console.log("InvalidDate");
            return { 'invaliddate': true };
          }
      } else { 
       // console.log("undefined");
        return null;
      }
    }

  //Password Validator
  static passwordValidator(control) {
    if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
        return null;
    }
    else {
        return { 'InvalidPassword': true };
    }
  }

  static barcodeValidator(control) {
    if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
        return null;
    }
    else {
        return { 'InvalidPassword': true };
    }
  }

  static moreThanZero(control) {
    if (control.value>0) {
        return null;
    }
    else {
        return { 'InvalidPassword': true };
    }
  }
}
