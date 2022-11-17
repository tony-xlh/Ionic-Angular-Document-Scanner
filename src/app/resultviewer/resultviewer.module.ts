import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResultviewerPageRoutingModule } from './resultviewer-routing.module';

import { ResultviewerPage } from './resultviewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResultviewerPageRoutingModule
  ],
  declarations: [ResultviewerPage]
})
export class ResultviewerPageModule {}
