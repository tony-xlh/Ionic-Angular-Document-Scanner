import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from '@capacitor/camera';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
})
export class CropperPage implements OnInit {

  constructor(private router: Router) { 
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      if (routeState) {
        const image:Photo = routeState['image'];
        console.log(image);
      }
    }
  }

  ngOnInit() {

  }

}
