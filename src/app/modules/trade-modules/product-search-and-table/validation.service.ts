export class ValidationService {
    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
      let config = {
        'required': 'Поле не заполнено',
        'countMoreThanZero': 'Кол-во = 0',
        'priceMoreThanZero': 'Цена = 0',
        'minlength': `Минимальное кол-во символов - ${validatorValue.requiredLength}`
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
  