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
      { path: 'filesdock', loadChildren: () => import('./pages/documents/files-dock/files-dock.module').then(m => m.FilesDockModule) },
      { path: 'departments', loadChildren: () => import('./pages/documents/departments/departments.module').then(m => m.DepartmentsModule) },
      { path: 'departmentsdock', loadChildren: () => import('./pages/documents/departments-dock/departments-dock.module').then(m => m.DepartmentsDockModule) },
      { path: 'usersdock', loadChildren: () => import('./pages/documents/users-dock/users-dock.module').then(m => m.UsersDockModule) },
      { path: 'users', loadChildren: () => import('./pages/documents/users/users.module').then(m => m.UsersModule) },
      { path: 'usergroupdock', loadChildren: () => import('./pages/documents/usergroup-dock/usergroup-dock.module').then(m => m.UsergroupDockModule) },
      { path: 'usergroup', loadChildren: () => import('./pages/documents/usergroup/usergroup.module').then(m => m.UsergroupModule) },
      { path: 'traderesults-report', loadChildren: () => import('./pages/documents/traderesults-report/traderesults-report.module').then(m => m.TraderesultsReportModule) },
      { path: 'productgroupsdock', loadChildren: () => import('./pages/documents/productgroups-dock/productgroups-dock.module').then(m => m.ProductgroupsDockModule) },
      { path: 'productgroups', loadChildren: () => import('./pages/documents/productgroups/productgroups.module').then(m => m.ProductgroupsModule) },
      { path: 'edizmdock', loadChildren: () => import('./pages/documents/edizm-dock/edizm-dock.module').then(m => m.EdizmDockModule) },
      { path: 'edizm', loadChildren: () => import('./pages/documents/edizm/edizm.module').then(m => m.EdizmModule) },
      { path: 'cagentsdock', loadChildren: () => import('./pages/documents/cagents-dock/cagents-dock.module').then(m => m.CagentsDockModule) },
      { path: 'cagents', loadChildren: () => import('./pages/documents/cagents/cagents.module').then(m => m.CagentsModule) },
      { path: 'pricetypesdock', loadChildren: () => import('./pages/documents/pricetypes-dock/pricetypes-dock.module').then(m => m.PricetypesDockModule) },
      { path: 'pricetypes', loadChildren: () => import('./pages/documents/pricetypes/pricetypes.module').then(m => m.PricetypesModule) },
      { path: 'statusesdock', loadChildren: () => import('./pages/documents/statuses-dock/statuses-dock.module').then(m => m.StatusesDockModule) },
      { path: 'statuses', loadChildren: () => import('./pages/documents/statuses/statuses.module').then(m => m.StatusesModule) },
      { path: 'productsdock', loadChildren: () => import('./pages/documents/products-dock/products-dock.module').then(m => m.ProductsDockModule) },
      { path: 'products', loadChildren: () => import('./pages/documents/products/products.module').then(m => m.ProductsModule) },
      { path: 'traderesultsdock', loadChildren: () => import('./pages/documents/traderesults-dock/traderesults-dock.module').then(m => m.TraderesultsDockModule) },
      { path: 'traderesults', loadChildren: () => import('./pages/documents/traderesults/traderesults.module').then(m => m.TraderesultsModule) },
      { path: 'remains', loadChildren: () => import('./pages/documents/remains/remains.module').then(m => m.RemainsModule) },
      { path: 'prices', loadChildren: () => import('./pages/documents/prices/prices.module').then(m => m.PricesModule) },
      { path: 'customersordersdock', loadChildren: () => import('./pages/documents/customersorders-dock/customersorders-dock.module').then(m => m.CustomersordersDockModule) },
      { path: 'customersorders', loadChildren: () => import('./pages/documents/customersorders/customersorders.module').then(m => m.CustomersordersModule) },
      { path: 'shipmentdock', loadChildren: () => import('./pages/documents/shipment-dock/shipment-dock.module').then(m => m.ShipmentDockModule) },
      { path: 'acceptancedock', loadChildren: () => import('./pages/documents/acceptance-dock/acceptance-dock.module').then(m => m.AcceptanceDockModule) },
      { path: 'postingdock', loadChildren: () => import('./pages/documents/posting-dock/posting-dock.module').then(m => m.PostingDockModule) },
      { path: 'writeoffdock', loadChildren: () => import('./pages/documents/writeoff-dock/writeoff-dock.module').then(m => m.WriteoffDockModule) },
      { path: 'shipment', loadChildren: () => import('./pages/documents/shipment/shipment.module').then(m => m.ShipmentModule) },
      { path: 'acceptance', loadChildren: () => import('./pages/documents/acceptance/acceptance.module').then(m => m.AcceptanceModule) },
      { path: 'posting', loadChildren: () => import('./pages/documents/posting/posting.module').then(m => m.PostingModule) },
      { path: 'writeoff', loadChildren: () => import('./pages/documents/writeoff/writeoff.module').then(m => m.WriteoffModule) },
      { path: '', redirectTo: 'dashboard',pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard',pathMatch: 'full' },
    ]  
  },






  

  
]

@NgModule({
  imports: [RouterModule.forChild(routes)], 
  exports: [RouterModule]
})
export class UiRoutingModule { }
