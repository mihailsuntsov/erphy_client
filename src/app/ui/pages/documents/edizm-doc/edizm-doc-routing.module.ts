import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EdizmDocComponent } from './edizm-doc.component';

const routes: Routes = [
  { path: '', component: EdizmDocComponent },
  { path: ':id', component: EdizmDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EdizmDocRoutingModule { }
