import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PagesService } from '../../services/pages.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [PagesService]
})
export class HomeComponent implements OnInit 
{
 
  
  constructor(
    private activateRoute: ActivatedRoute,
  )
  { 
    console.log(this.activateRoute);

  }

  ngOnInit() {

  };

  

}
