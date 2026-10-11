import { Component } from '@angular/core';
import { SERVER_IMAGES_LINK } from '../../../services/api-config';
import { TranslatePipe } from '../../../services/translate.pipe';

@Component({
  imports: [TranslatePipe],
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  server_images_link = SERVER_IMAGES_LINK;
}
