import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

@Component({
  selector: 'app-resultviewer',
  templateUrl: './resultviewer.page.html',
  styleUrls: ['./resultviewer.page.scss'],
})
export class ResultviewerPage implements OnInit {
  dataURL:string = "";
  normalizedImageDataURL:string = "";
  private detectedQuadResult:DetectedQuadResult|undefined;
  constructor(private router: Router) { }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      console.log(routeState);
      if (routeState) {
        this.dataURL = routeState["dataURL"];  
        this.detectedQuadResult = routeState["detectedQuadResult"];
        this.normalize();
      }
    }
  }

  async normalize() {
    if (this.detectedQuadResult) {
      let normalizedImageResult = await DocumentNormalizer.normalize({source:this.dataURL,quad:this.detectedQuadResult.location});
      this.normalizedImageDataURL = normalizedImageResult.result.data;
    }
  }

}
