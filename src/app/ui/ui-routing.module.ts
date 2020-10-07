import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UiComponent } from './ui.component';

const routes: Routes = [
  { path: '', component: UiComponent,
    children:[
      { path: 'dashboard', loadChildren: () => import('src/app/ui/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'companies', loadChildren: () => import('./pages/documents/companies/companies.module').then(m => m.CompaniesModule) },
      { path: 'companiesdock', loadChildren: () => import('./pages/documents/companies-dock/companies-dock.module').then(m => m.CompaniesDockModule) },
      { path: 'files', loadChildren: () => import('./pages/documents/files/files.module').then(m => m.FilesModule) },
      { path: 'filesdock', loadChildren: () => import('./pages/documents/filesdock/filesdock.module').then(m => m.FilesdockModule) },
      { path: '', redirectTo: 'dashboard',pathMatch: 'full' },
    ]  
  },
  
  
  
  
]

@NgModule({
  imports: [RouterModule.forChild(routes)], 
  exports: [RouterModule]
})
export class UiRoutingModule { }
