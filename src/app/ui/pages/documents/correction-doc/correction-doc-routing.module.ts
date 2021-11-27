import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CorrectionDocComponent } from './correction-doc.component';

const routes: Routes = [
  { path: '', component: CorrectionDocComponent },
  { path: ':id', component: CorrectionDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CorrectionDocRoutingModule { }
