export class ValidationService {
    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
      let config = {
        'numberNotNegative': 'docs.error.sum_less_zero',
      };
  
      return config[validatorName];
    }
  
    static numberNotNegative(control) {
      if (control.value!=null && control.value.toString().length>0) {// если поле заполнено
          if (control.value>=0) {
              return null;
          }else {
              return { 'numberNotNegative': true };
          }
      }
      else {
          return null;
      }
  }

  }
  