import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AcceptanceDocComponent } from './acceptance-doc.component';

const routes: Routes = [
  { path: '', component: AcceptanceDocComponent },
  { path: ':id', component: AcceptanceDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcceptanceDocRoutingModule { }
