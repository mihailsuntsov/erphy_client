import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CagentsComponent } from './cagents.component';

const routes: Routes = [{ path: '', component: CagentsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CagentsRoutingModule { }
