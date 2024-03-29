import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Photo } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer';
import { Point,Quadrilateral } from 'dynamsoft-core';
import { Capacitor } from '@capacitor/core';
import { cleanedDetectionResult, getCanvasFromDataURL } from '../utils';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
})
export class CropperPage implements OnInit {
  dataURL:string = "";
  viewBox:string = "0 0 1280 720";
  detectedQuadResult:DetectedQuadResultItem|undefined;
  points:[Point,Point,Point,Point]|undefined;
  selectedIndex: number = -1;
  offset:{x:number,y:number}|undefined;
  private imgWidth:number = 0;
  private imgHeight:number = 0;
  isTouchDevice:boolean = false;
  private usingTouchEvent:boolean = false;
  constructor(private router: Router,private location: Location,private toastController: ToastController,private ref:ChangeDetectorRef) {}

  ngOnInit() {
    this.isTouchDevice = 'ontouchstart' in document.documentElement;
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      if (routeState) {
        const dataUrl:string = routeState['image'];
        if (dataUrl) {
          const pThis = this;
          let img = new Image();
          img.onload = function(){
              pThis.viewBox = "0 0 "+img.naturalWidth+" "+img.naturalHeight;
              pThis.imgWidth = img.naturalWidth;
              pThis.imgHeight = img.naturalHeight;
              pThis.dataURL = dataUrl;
              const detectionResult:DetectedQuadResultItem|undefined = routeState['detectionResult'];
              if (detectionResult) {
                console.log("use detection results from live scan");
                pThis.detectedQuadResult = detectionResult;
                pThis.points = pThis.detectedQuadResult.location.points;
              }else{
                pThis.detect();
              }
          }
          img.src = dataUrl;
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
    let source;
    if (Capacitor.isNativePlatform()) {
      source = this.dataURL;
    }else{
      source = await getCanvasFromDataURL(this.dataURL)
    }
    let results = (await DocumentNormalizer.detect({source:source})).results;
    if (results.length>0) {
      console.log(results);
      this.detectedQuadResult = results[0];
      this.points = this.detectedQuadResult.location.points;
    }else {
      await this.presentToast();
      let location:Quadrilateral = {points:[
        this.getPoint(50,50),
        this.getPoint(100,50),
        this.getPoint(100,100),
        this.getPoint(50,100)]};
      let defaultQuad:DetectedQuadResultItem = {
        location: location,
        confidenceAsDocumentBoundary: 90,
        type: this.detectedQuadResult!.type,
        referenceItem: this.detectedQuadResult!.referenceItem
      }
      this.detectedQuadResult = defaultQuad;
      this.points = this.detectedQuadResult.location.points;
    }
  }

  getPoint(x:number,y:number) {
    let xPercent = 640/this.imgWidth;
    let yPercent = 480/this.imgHeight;
    x = x/xPercent;
    y = y/yPercent;
    let p:Point = {
      x:x,
      y:y
    }
    return p;
  }

  async presentToast(){
    const toast = await this.toastController.create({
      message: 'No documents detected. Create a default box.',
      duration: 1500,
      position: 'top'
    });
    await toast.present();
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
  
  getRectSize(){
    let percent = 640/this.imgWidth;
    return 30/percent; //30 works fine when the width is 640. Scale it if the image has a different width
  }

  getRectStrokeWidth(i:number){
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
    let width = this.getRectSize()/2;
    return - width;
  }

  getRectY(index:number,y:number) {
    return this.getOffsetY(index) + y;
  }

  getOffsetY(index:number) {
    let height = this.getRectSize()/2;
    return - height;
  }

  onRectMouseDown(index:number,event:any) {
    if (!this.usingTouchEvent) {
      console.log(event);
      this.selectedIndex = index;
    }
  }

  onRectMouseUp(event:any) {
    if (!this.usingTouchEvent) {
      console.log(event);
      this.selectedIndex = -1;
    }
  }

  onRectTouchStart(index:number,event:any) {
    this.usingTouchEvent = true; //Touch events are triggered before mouse events. We can use this to prevent executing mouse events.
    console.log(event);
    this.selectedIndex = index;
  }

  onRectTouchEnd(event:any){
    console.log(event);
    this.selectedIndex = -1;
  }

  startDrag(event:any,svgElement:any){
    if (this.usingTouchEvent && !event.targetTouches) { //if touch events are supported, do not execuate mouse events.
      return;
    }
    console.log(event);
    if (this.points && this.selectedIndex != -1) {
      this.offset = this.getMousePosition(event,svgElement); //We need this info so that whether we start dragging the rectangular in the center or in the corner will not affect the result.
      let x = this.points[this.selectedIndex].x;
      let y = this.points[this.selectedIndex].y;
      this.offset.x -= x;
      this.offset.y -= y;
    }
  }

  endDrag(event:any){
    if (this.usingTouchEvent && !event.targetTouches) {  //if touch events are supported, do not execuate mouse events.
      return;
    }
    this.selectedIndex = -1;
  }

  drag(event:any,svgElement:any){
    if (this.usingTouchEvent && !event.targetTouches) {  //if touch events are supported, do not execuate mouse events.
      return;
    }
    console.log(event);
    if (this.points && this.selectedIndex != -1 && this.offset) {
      event.preventDefault();
      let coord = this.getMousePosition(event,svgElement);
      let point = this.points[this.selectedIndex];
      point.x = coord.x - this.offset.x;
      point.y = coord.y - this.offset.y;
      if (this.detectedQuadResult) {
        this.detectedQuadResult.location.points[this.selectedIndex].x = point.x;
        this.detectedQuadResult.location.points[this.selectedIndex].y = point.y;
      }
    }
    this.ref.markForCheck();
    this.ref.detectChanges();
  }

  //Convert the screen coordinates to the SVG's coordinates from https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
  getMousePosition(event:any,svg:any) {
    let CTM = svg.getScreenCTM();
    if (event.targetTouches) { //if it is a touch event
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
        detectedQuadResult: cleanedDetectionResult(this.detectedQuadResult!),
        dataURL: this.dataURL,
      }
    });
  }

  cancel(){
    this.router.navigate(['/home']);
  }
}
