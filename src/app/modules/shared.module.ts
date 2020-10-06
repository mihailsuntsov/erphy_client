// Модуль для хранения переиспользуемых компонент, директив и пайпов
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WINDOW_PROVIDERS } from '../window.providers';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component'
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component'
import { MaterialModule } from '../modules/material.module';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    DeleteDialog,
    ConfirmDialog,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MaterialModule,
    MatButtonModule
  ],
  exports: [
    DeleteDialog,
    ConfirmDialog,

  ],
  providers: [WINDOW_PROVIDERS],
})
export class SharedModule { }
