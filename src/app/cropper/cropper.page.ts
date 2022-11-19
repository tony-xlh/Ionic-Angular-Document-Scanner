import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from '@angular/router';
import { Photo } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { Point } from 'dynamsoft-camera-enhancer';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
})
export class CropperPage implements OnInit {
  dataURL:string = "";
  viewBox:string = "0 0 1280 720";
  detectedQuadResult:DetectedQuadResult|undefined;
  points:[Point,Point,Point,Point]|undefined;
  selectedIndex: number = -1;
  private imgWidth:number = 0;
  private imgHeight:number = 0;
  constructor(private router: Router,private location: Location) {}

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
              pThis.imgWidth = img.naturalWidth;
              pThis.imgHeight = img.naturalHeight;
              pThis.dataURL = image.dataUrl;
              pThis.detect();
            }
          }
          img.src = image.dataUrl;
        }
      }
    }
  }

  getSVGWidth(svgElement:any){
    let imgRatio = this.imgWidth/this.imgHeight;
    let width = svgElement.clientHeight * imgRatio;
    return width;
  }

  async detect(){
    let results = (await DocumentNormalizer.detect({source:this.dataURL})).results;
    if (results.length>0) {
      console.log(results);
      this.detectedQuadResult = results[0];
      this.points = this.detectedQuadResult.location.points;
    }
  }

  getPointsData(){
    if (this.detectedQuadResult) {
      let location = this.detectedQuadResult.location;
      let pointsData = location.points[0].x + "," + location.points[0].y + " ";
      pointsData = pointsData + location.points[1].x + "," + location.points[1].y +" ";
      pointsData = pointsData + location.points[2].x + "," + location.points[2].y +" ";
      pointsData = pointsData + location.points[3].x + "," + location.points[3].y;
      return pointsData;
    }
    return "";
  }

  getRectX(index:number,x:number,width:number) {
    if (index == 0) {
      x = x - width;
    } else if (index == 1) {
      x = x;
    } else if (index == 2) {
      x = x;
    } else if (index == 3) {
      x = x - width;
    }
    return x;
  }

  getRectY(index:number,y:number,height:number) {
    if (index == 0) {
      y = y - height;
    } else if (index == 1) {
      y = y - height;
    } else if (index == 2) {
      y = y;
    } else if (index == 3) {
      y = y;
    }
    return y;
  }

  onSVGMouseMoved(event:any,svgElement:any) {
    console.log("moved");
    console.log(event);
    this.moveSelectedCircle(event,svgElement);
  }

  onSVGMouseUp(event:any) {
    console.log("up");
    console.log(event);
    this.selectedIndex = -1;
  }

  onSVGMouseDown(event:any){
    console.log("down");
    console.log(event);
  }

  onRectMouseDown(index:number) {
    console.log("selected index: "+index);
    this.selectedIndex = index;
  }

  onRectMouseUp(){
    this.selectedIndex = -1;
  }

  moveSelectedCircle(event:any, svgElement:any){
    if (this.selectedIndex != -1 && this.points) {
      let selectedPoint = this.points[this.selectedIndex];
      let x = event.offsetX;
      let y = event.offsetY;
      
      let percent = 1.0;
      percent = this.imgWidth/svgElement.clientWidth;
      console.log(this.imgWidth);
      console.log(svgElement.clientWidth);
      x = Math.floor(percent*x);
      y = Math.floor(percent*y);
      selectedPoint.x = x;
      selectedPoint.y = y;
    }
  }

  use(){
    this.router.navigate(['/resultviewer'],{
      state: {
        detectedQuadResult: this.detectedQuadResult,
        dataURL: this.dataURL
      }
    });
  }

  cancel(){
    this.location.back();
  }
}
