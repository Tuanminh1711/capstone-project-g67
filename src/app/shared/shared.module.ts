import { NgModule } from '@angular/core';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Shared Services
import { ConfigService } from './services/config.service';
import { UrlService } from './services/url.service';
import { PlantDataService } from './services/plant-data.service';
import { PlantDetailLoaderService } from './services/plant-detail-loader.service';
import { PlantUiHelperService } from './services/helpers/plant-ui-helper.service';
import { DialogManager } from './services/dialog-manager.service';
import { AdminPageTitleService } from '../feature/admin/shared/admin-page-title.service';
import { ResponseHandlerService } from './services/response-handler.service';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

const SHARED_SERVICES = [
  ConfigService,
  UrlService,
  PlantDataService,
  PlantDetailLoaderService,
  PlantUiHelperService,
  DialogManager,
  AdminPageTitleService,
  ResponseHandlerService
];

const MATERIAL_MODULES = [
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatSnackBarModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatIconModule
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    CapitalizePipe
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    CapitalizePipe,
    FormsModule,
    RouterModule,
    ...MATERIAL_MODULES
  ],
  providers: [
    ...SHARED_SERVICES
  ]
})
export class SharedModule { }
