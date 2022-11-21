import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from '@angular/router';
import { Photo } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResult } from 'dynamsoft-document-normalizer';
import { Point } from "dynamsoft-document-normalizer/dist/types/interface/point";

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
  offset:{x:number,y:number}|undefined;
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
  
  getCornerWidth(){
    let percent = 640/this.imgWidth;
    return 20/percent;
  }

  getCornerStrokeWidth(i:number){
    let percent = 640/this.imgWidth;
    if (i === this.selectedIndex) {
      return 5/percent;
    }else{
      return 2/percent;
    }
  }

  getRectX(index:number,x:number) {
    return this.getOffsetX(index) + x;
  }

  getOffsetX(index:number) {
    let width = this.getCornerWidth();
    if (index === 0 || index === 3) {
      return - width;
    }
    return 0;
  }

  getRectY(index:number,y:number) {
    return this.getOffsetY(index) + y;
  }

  getOffsetY(index:number) {
    let height = this.getCornerWidth();
    if (index === 0 || index === 1) {
      return - height;
    }
    return 0;
  }

  getClassNameForRect(i:number){
    if (i === this.selectedIndex) {
      return "cornerActive";
    }else{
      return "";
    }
  }

  onRectMouseDown(index:number,event:any) {
    this.selectedIndex = index;
  }

  onRectMouseUp(event:any) {
    this.selectedIndex = -1;
  }

  onRectTouchStart(index:number,event:any) {
    this.selectedIndex = index;
  }

  onRectTouchEnd(event:any){
    this.selectedIndex = -1;
  }

  startDrag(event:any,svgElement:any){
    if (this.points && this.selectedIndex != -1) {
      this.offset = this.getMousePosition(event,svgElement);
      let x = this.points[this.selectedIndex].x;
      let y = this.points[this.selectedIndex].y;
      this.offset.x -= x;
      this.offset.y -= y;
    }
  }

  endDrag(){
    this.selectedIndex = -1;
  }

  drag(event:any,svgElement:any){
    if (this.points && this.selectedIndex != -1 && this.offset) {
      event.preventDefault();
      let coord = this.getMousePosition(event,svgElement);
      let point = this.points[this.selectedIndex];
      point.x = (coord.x - this.offset.x) - this.getOffsetX(this.selectedIndex);
      point.y = (coord.y - this.offset.y) - this.getOffsetY(this.selectedIndex);
      if (this.detectedQuadResult) {
        let p:Point = {
          coordinate:[point.x,point.y],
          x:point.x,
          y:point.y
        }
        this.detectedQuadResult.location.points[this.selectedIndex] = point;
      }
    }
  }

  getMousePosition(event:any,svg:any) {
    let CTM = svg.getScreenCTM();
    if (event.targetTouches) {
      let x = event.targetTouches[0].clientX;
      let y = event.targetTouches[0].clientY;
      return {
        x: (x - CTM.e) / CTM.a,
        y: (y - CTM.f) / CTM.d
      };
    }else{
      return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
      };
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
