import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MovingDocComponent } from './moving-doc.component';

const routes: Routes = [
  { path: '', component: MovingDocComponent },
  { path: ':id', component: MovingDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MovingDocRoutingModule { }
