import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsergroupRoutingModule } from './usergroup-routing.module';
import { UsergroupComponent } from './usergroup.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
// import { TranslocoRootModule } from 'src/app/transloco-root.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [UsergroupComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'usergroup' }
  ],
  imports: [
    CommonModule,
    UsergroupRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    // TranslocoRootModule,
    TranslocoModule
  ]
})
export class UsergroupModule { }
