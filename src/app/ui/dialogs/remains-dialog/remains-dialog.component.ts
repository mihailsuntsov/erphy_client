import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-remains-dialog',
  templateUrl: './remains-dialog.component.html',
  styleUrls: ['./remains-dialog.component.css']
})
export class RemainsDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  url: string; 

  constructor( public dialogRef: MatDialogRef<RemainsDialogComponent>,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
    onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.formBaseInformation = new FormGroup({
      min_quantity: new FormControl('',[Validators.required,Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,3})?\r?$')]),
      // warning_quantity: new FormControl('',[]),
    });
  }
  saveRemains(){
    this.formBaseInformation.get('min_quantity').setValue((this.formBaseInformation.get('min_quantity').value).toString().replace(",", "."));
    const body =  {
                    min_quantity: this.formBaseInformation.get('min_quantity').value,
                    productsIds: this.data.productsIds,
                    productsIdsList: JSON.stringify(this.data.productsIds).replace("[", "").replace("]", ""),
                    companyId: this.data.companyId,
                    departmentId: this.data.departmentId,
                    departmentsIds: this.getIds(this.data.departmentsList),
                    departmentsIdsList: JSON.stringify(this.getIds(this.data.departmentsList)).replace("[", "").replace("]", ""),
                  };
    return this.http.post('/api/auth/saveRemains', body)
    .subscribe(
        (data) => {   
                  this.openSnackBar("Минимальный остаток сохранён", "Закрыть");
                  this.dialogRef.close(1);
                },
        error => console.log(error),
    );
  }

  getIds(mass: any[]):number[]{
    let result:number[]=[];
    mass.forEach(element => {result.push(+element.id);});
    return result;
  };

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  numberOnlyPlusDotAndComma(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=44 && charCode!=46)) { return false; } return true;}
}
