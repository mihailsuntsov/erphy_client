import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../modules/shared.module';
import { OnlineschedulingComponent } from './onlinescheduling.component';
import { OnlineschedulingRoutingModule } from './onlinescheduling-routing.module';
import { OsDialogComponent } from './osdialog.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faPhone, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';
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


@NgModule({
  declarations: [
    OnlineschedulingComponent,
    OsDialogComponent
  ],
  imports: [
    CommonModule,
    OnlineschedulingRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    FontAwesomeModule
  ],
  exports: [
    OsDialogComponent
  ]
})
export class OnlineschedulingModule {
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
  } }
