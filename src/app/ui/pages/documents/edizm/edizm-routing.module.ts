import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EdizmComponent } from './edizm.component';

const routes: Routes = [{ path: '', component: EdizmComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EdizmRoutingModule { }
