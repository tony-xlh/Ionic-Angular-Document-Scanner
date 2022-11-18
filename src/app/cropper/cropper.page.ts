import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Photo } from '@capacitor/camera';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
})
export class CropperPage implements OnInit {
  dataURL:string = "";
  viewBox:string = "0 0 1280 720";
  constructor(private router: Router) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      if (routeState) {
        const image:Photo = routeState['image'];
        if (image.dataUrl) {
          const pThis = this;
          let img = new Image();
          img.onload = function(){
            if (image.dataUrl) {
              pThis.viewBox = "0 0 "+img.naturalWidth+" "+img.naturalHeight;
              pThis.dataURL = image.dataUrl;
            }
          }
          img.src = image.dataUrl;
        }
        console.log(image);
      }
    }
  }

  detect(){
    
  }

}
