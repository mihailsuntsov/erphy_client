import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingRoutingModule } from './posting-routing.module';
import { PostingComponent } from './posting.component';

import { SettingsPostingDialogModule } from '../../../../modules/settings/settings-posting-dialog/settings-posting-dialog.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [PostingComponent],
  imports: [
    CommonModule,
    PostingRoutingModule,
    
    SettingsPostingDialogModule,
    FormsModule,
    MaterialModule
  ]
})
export class PostingModule { }
