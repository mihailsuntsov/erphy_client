import { Component, OnInit , Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Validators, FormGroup, FormControl, ValidationErrors, ValidatorFn, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ValidationService } from '../../../services/validation.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';

@Component({
  selector: 'app-product-barcodes-dialog',
  templateUrl: './product-barcodes-dialog.component.html',
  styleUrls: ['./product-barcodes-dialog.component.css']
})
export class ProductBarcodesDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе

  barcodesSpravList: any [] = [];
  @ViewChild("barcodeValue", {static: false}) barcodeValue;
  
  constructor(
    public dialogAddBarcodes: MatDialogRef<ProductBarcodesDialogComponent>,
    public dialogEditBarcodeProperties: MatDialogRef<ProductBarcodesDialogComponent>,
    private _snackBar: MatSnackBar,
    public MessageDialog: MatDialog,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder) {
      
    }
  onNoClick(): void {
    this.dialogAddBarcodes.close();
    this.dialogEditBarcodeProperties.close();
  }


  ngOnInit() {
    
  //   this.formBaseInformation = this.formBuilder.group({
  //     barcodeName:  this.data.name,
  //     productId:    this.data.productId,
  //     value:        this.data.value,
  //     barcode_id:   this.data.barcodeId,
  //     description:  this.data.description,
  // });
  

    this.formBaseInformation = new FormGroup({
      barcodeName:  new FormControl(this.data.name,[]),
      productId:    new FormControl(this.data.productId,[]),
      value:        new FormControl((this.data.value),[]),
      barcode_id:   new FormControl(this.data.barcodeId,[Validators.required]),
      description:  new FormControl(this.data.description,[]),
    });
    this.formBaseInformation.setValidators(this.isBarcodeValid())
    //this.formBaseInformation.get('value').setValue(' ');

    this.getSpravSysBarcodes();
  
    //console.log("ean13:"+this.ean13_LastNum('4602542000034'));
    console.log("ean13:"+this.ean13_LastNum('460622411175'));
    console.log("product_code_free:" + this.data.product_code_free);
    console.log("st_prefix_barcode_pieced:" + this.data.st_prefix_barcode_pieced);
    console.log("ean13:"+this.ean13_LastNum("2"+this.data.st_prefix_barcode_pieced+this.data.product_code_free));
  }
  

  ngAfterViewInit() {
    setTimeout(() => { this.barcodeValue.nativeElement.focus(); }, 600);
    }

  createProductBarcode(){
    const body = {"id1":+this.data.companyId,
                  "id2":+this.data.productId,
                  "id3":+this.formBaseInformation.get('barcode_id').value,
                  "string1":this.formBaseInformation.get('value').value,
                  "string2":this.formBaseInformation.get('description').value};
    return this.http.post('/api/auth/insertProductBarcode', body)
            .subscribe(
                (data) => {   
                          this.openSnackBar("Штрих-код создан", "Закрыть");
                          this.dialogAddBarcodes.close('Ok');
                        },
                error => console.log(error),
            );
  }

  updateProductBarcode(){
    const body = {"id1":+this.data.id,
                  "string1":this.formBaseInformation.get('value').value,
                  "string2":this.formBaseInformation.get('description').value};
    return this.http.post('/api/auth/updateProductBarcode', body)
            .subscribe(
                (data) => {   
                          this.openSnackBar("Штрих-код сохранён", "Закрыть");
                          this.dialogEditBarcodeProperties.close('Ok');
                        },
                error => console.log(error),
            );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }  

  getSpravSysBarcodes(){
      const body = {};
              this.http.post('/api/auth/getSpravSysBarcode', body)
              .subscribe(
                  (data) => {
                    this.barcodesSpravList=data as any []; 
                  },
                  error => console.log(error) 
              );
    
  }


  checkSuitableBarcode(){
    let fieldLength: number = +this.formBaseInformation.get('value').value.length;
console.log("2 formBaseInformation.get('barcode_id').value - "+this.formBaseInformation.get('barcode_id').value);
    // if(+this.formBaseInformation.get('barcode_id').value==0)//если вид штрих-кода еще не выбран
    // {
      console.log("вид штрих-кода еще не выбран");
      if (fieldLength > 0)
      {
        if (fieldLength>48)
        {
          console.log("Больше 48");
          this.formBaseInformation.get('barcode_id').setValue(5)            //  QR-code
        } else {
          console.log("Меньше 48");
          if((fieldLength!=8 && fieldLength!=13) || !this.isANumber(this.formBaseInformation.get('value').value))
          {
            console.log("Не 8 и не 13 или они, но в строке есть буквы");
            this.formBaseInformation.get('barcode_id').setValue(3)          //  Code128
          } else {
            console.log("8 или 13");
            if(fieldLength==8){
              this.formBaseInformation.get('barcode_id').setValue(2)        //  EAN-8
            } else  this.formBaseInformation.get('barcode_id').setValue(1)  //  EAN-13
          }
        }
      } else this.formBaseInformation.get('barcode_id').value=0;
    // }
  }

  isANumber(str){
    return !/\D/.test(str);
  }

  isBarcodeValid() : ValidatorFn
  {
    return (group: FormGroup): ValidationErrors => 
    {

      const value = group.controls['value'].value;
      const barcode_id = +group.controls['barcode_id'].value;
      console.log("barcode_id - "+barcode_id);
      switch(barcode_id) 
      {
        case 1:
            if (value.match(/^[0-9]{13,13}$/)){
              group.controls['value'].setErrors(null);
              console.log("ошибок нет!");
              break;
            } else {
              group.controls['value'].setErrors({notEquivalent: true});
              console.log("ошибка!");
              break;}
          case 2:
            if (value.match(/^[0-9]{8,8}$/)){
              group.controls['value'].setErrors(null);
              console.log("ошибок нет!");
              break;
            } else {
              group.controls['value'].setErrors({notEquivalent: true});
              console.log("ошибка!");
              break;}
          case 3:
          case 4:
          case 5:
            if (value.match(/^[a-zA-Z0-9_\.\+\-\*\\\-\(\)\&\?\:\%\;\"\@\!\#\$\/\^\,\<\>\'\"\`\~\=]{1,100}$/)){
              group.controls['value'].setErrors(null);
              console.log("ошибок нет!");
              break;
            } else {
              group.controls['value'].setErrors({notEquivalent: true});
              console.log("ошибка!");
              break;}
      }
      return;
    };
  }

  generateEAN13barcode(){
    if(+this.data.product_code_free>0)
    {
      let fullBarcode:string=this.ean13_LastNum("2"+this.data.st_prefix_barcode_pieced+this.data.product_code_free);
      this.formBaseInformation.get('value').setValue(fullBarcode);
      this.formBaseInformation.get('description').setValue('Внутренний штрих-код');
      console.log("value1:"+this.formBaseInformation.get('value').value);
      this.checkSuitableBarcode();
    }
      else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Создание штрих-кода EAN-13 невозможно, т.к. поле "Код" в карточке товара не заполнено.',}});
  }
    generateEAN8barcode(){
    if(+this.data.product_code_free>0)
    {
      let fullBarcode:string=this.ean13_LastNum(this.data.st_prefix_barcode_pieced+this.data.product_code_free);
      this.formBaseInformation.get('value').setValue(fullBarcode);
      this.formBaseInformation.get('description').setValue('Внутренний штрих-код');
      console.log("value1:"+this.formBaseInformation.get('value').value);
      this.checkSuitableBarcode();
    }
      else this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Создание штрих-кода EAN-8 невозможно, т.к. поле "Код" в карточке товара не заполнено.',}});
  }
  ean8_LastNum(c) {
    let chet = Number(c.charAt(1))+Number(c.charAt(3))+Number(c.charAt(5));
    let nechet = Number(c.charAt(0))+Number(c.charAt(2))+Number(c.charAt(4))+Number(c.charAt(6));
    let total = 3 * nechet + chet;
    total = total % 10;
    total = 10 - total;
    total = total % 10;
    return c+total;
   }

   ean13_LastNum(c) {
    let chet = Number(c.charAt(1))+Number(c.charAt(3))+Number(c.charAt(5))+Number(c.charAt(7))+Number(c.charAt(9))+Number(c.charAt(11));
    let nechet=Number(c.charAt(0))+Number(c.charAt(2))+Number(c.charAt(4))+Number(c.charAt(6))+Number(c.charAt(8))+Number(c.charAt(10));
    let total = 3 * chet + nechet;
    total = total % 10;
    total = 10 - total;
    total = total % 10;
    return c+total;
   }
}
