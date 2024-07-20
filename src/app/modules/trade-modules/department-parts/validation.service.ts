export class ValidationService {
    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
      let config = {
        'required': 'modules.error.field_miss',
        'countMoreThanZero': 'modules.error.cnt_more_zero',
        'priceMoreThanZero': 'modules.error.prc_more_zero',
        'minlength': 'modules.error.min_cnt_chars' + validatorValue.requiredLength
      };
  
      return config[validatorName];
    }
  
    static countMoreThanZero(control) {         
        if (control.value.toString().length>0) {// если поле заполнено
            if (control.value>0) {
                return null;
            }else {
                return { 'countMoreThanZero': true };
            }
        }
        else {
            return null;
        }
    }

    static priceMoreThanZero(control) {
        if (control.value.toString().length>0) {// если поле заполнено
            if (control.value>0) {
                return null;
            }else {
                return { 'priceMoreThanZero': true };
            }
        }
        else {
            return null;
        }
    }

  }
  