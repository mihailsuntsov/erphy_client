import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorrectionComponent } from './correction.component';

const routes: Routes = [{ path: '', component: CorrectionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CorrectionRoutingModule { }
