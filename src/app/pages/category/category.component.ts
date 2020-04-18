import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';


@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit 
{
  id: number;// id документа

  constructor(
    private activateRoute: ActivatedRoute,
  )
  { 
    console.log(this.activateRoute);
    this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
      this.showId();
    };

  showId():void{
    console.log("id or alias - "+this.id);
  }

}
