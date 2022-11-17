import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CropperPageRoutingModule } from './cropper-routing.module';

import { CropperPage } from './cropper.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CropperPageRoutingModule
  ],
  declarations: [CropperPage]
})
export class CropperPageModule {}
