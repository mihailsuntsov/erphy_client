import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../pages/about/about.component';
import { ContactsComponent } from '../pages/contacts/contacts.component';
import { HomeComponent } from '../pages/home/home.component';
import { ContentViewer, EmbeddedComponents, embeddedComponents } from '../dynamic-content-viewer/dynamic-content-viewer';
import { WINDOW_PROVIDERS } from '../window.providers';
import { CategoryComponent } from '../pages/category/category.component';
import { ExampleComponent } from '../embeddable-components/example.component'
import { RouterOutletComponent } from '../embeddable-components/router-outlet.component'
import { RouterModule } from '@angular/router';
import { RootPageComponent } from '../embeddable-components/root-page.component'
import { MenuComponent } from '../embeddable-components/menu.component'

@NgModule({
  declarations: [
    AboutComponent,
    ContactsComponent,
    HomeComponent,
    ContentViewer,  
    CategoryComponent,
    ExampleComponent,
    RouterOutletComponent,
    RootPageComponent,
    MenuComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    ContentViewer,
  ],
  providers: [EmbeddedComponents, WINDOW_PROVIDERS],
  entryComponents: [embeddedComponents],
})
export class SharedModule { }
