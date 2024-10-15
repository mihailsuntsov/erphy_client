import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsComponent } from './contacts.component';
import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faSquare, faCheckSquare, faPhone, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';
import {
  // faSquare as farSquare,
  // faCheckSquare as farCheckSquare,
//  faEnvelope,
 
} from '@fortawesome/free-regular-svg-icons';
import {
  faStackOverflow,
  faGithub,
  faInstagram,
  faWhatsapp,
  faFacebook,
  faTiktok,
  faLinkedin,
  faPaypal,
  faYoutube,
  faDiscord,
  faTelegram,
  faXTwitter,
  faViber,
  faVk

} from '@fortawesome/free-brands-svg-icons';
// import { ControlMessagesComponent } from './control-messages.component';
// import { ValidationService } from './validation.service';

@NgModule({
  declarations: [
    ContactsComponent,/* ControlMessagesComponent*/
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule,
    FontAwesomeModule
  ], exports: [
    ContactsComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},/*ValidationService*/]
})
export class ContactsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faGlobe,
      faEnvelope,
      faPhone,
      faInstagram,
      faWhatsapp,
      faStackOverflow,
      faGithub,
      faFacebook,
      faTiktok,
      faLinkedin,
      faPaypal,
      faYoutube,
      faDiscord,
      faTelegram,
      faXTwitter,
      faViber,
      faVk

    );
  }
}
