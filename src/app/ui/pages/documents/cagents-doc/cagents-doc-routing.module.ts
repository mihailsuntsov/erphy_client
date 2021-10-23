import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CagentsDocComponent } from './cagents-doc.component';

const routes: Routes = [
  { path: '', component: CagentsDocComponent },
  { path: ':id', component: CagentsDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CagentsDocRoutingModule { }
