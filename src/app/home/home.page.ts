import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private router: Router) {}
  
  scan(){
    console.log("scan pressed");
    this.takePicture();
  }


  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });
  
    if (image) {
      this.router.navigate(['/cropper'],{
        state: {
          image: image
        }
      });
    }
  };




}
