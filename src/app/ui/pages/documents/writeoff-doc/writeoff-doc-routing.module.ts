import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WriteoffDocComponent } from './writeoff-doc.component';

const routes: Routes = [
  { path: '', component: WriteoffDocComponent },
  { path: ':id', component: WriteoffDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WriteoffDocRoutingModule { }
