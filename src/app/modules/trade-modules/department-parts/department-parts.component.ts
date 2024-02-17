import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { UntypedFormControl, UntypedFormGroup, Validators, UntypedFormBuilder} from '@angular/forms';
import { SlugifyPipe } from 'src/app/services/slugify.pipe';

@Component({
  selector: 'app-department-parts',
  templateUrl: './department-parts.component.html',
  styleUrls: ['./department-parts.component.css'],
  providers: [SlugifyPipe]
})
export class DepartmentPartsComponent implements OnInit {

  actionType: string;
  formBaseInformation:any;

  constructor(
    public  departmentPartsDialog: MatDialogRef<DepartmentPartsComponent>,
    private _snackBar: MatSnackBar,
    public  MessageDialog: MatDialog,
    private slugifyPipe: SlugifyPipe,
    public  ConfirmDialog: MatDialog,
    public  ProductDuplicateDialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private http: HttpClient,
    public  deleteDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
  ngOnInit() {
    this.actionType = this.data.actionType;

    this.formBaseInformation = new UntypedFormGroup({
      id:           new UntypedFormControl(+this.data.partId,[]),
      name:         new UntypedFormControl(this.data.partName,[Validators.required,Validators.maxLength(120)]),
      description:  new UntypedFormControl(this.data.partDescription,[Validators.maxLength(1000)]),
      is_active:    new UntypedFormControl(this.data.is_active,[]),
      department_id:new UntypedFormControl(+this.data.department_id,[]),
      menu_order:   new UntypedFormControl(+this.data.menu_order,[]),
    }); 
  }

  insertDepartmentPart(){
    this.http.post('/api/auth/insertDepartmentPart', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_suc'), translate('modules.button.close'));
                      this.departmentPartsDialog.close(this.data.categoryId);
                    }
                  }
                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }

  updateDepartmentPart(){
    this.http.post('/api/auth/updateDepartmentPart', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'), translate('modules.button.close'));
                      this.departmentPartsDialog.close(this.data.categoryId);
                    }
                  }
                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }
  
  onNoClick(): void {
    this.departmentPartsDialog.close();
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
} 