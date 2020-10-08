import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CagentsDockComponent } from './cagents-dock.component';

const routes: Routes = [{ path: '', component: CagentsDockComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CagentsDockRoutingModule { }
