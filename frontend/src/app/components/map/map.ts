import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  imports: [CommonModule],
  selector: 'app-map',
  styleUrl: './map.scss',
  templateUrl: './map.html',
})
export class Map implements OnInit, AfterViewInit {
  private map: L.Map | undefined;
  
  showEmptyState = false;
  selectedSpace: any = null;

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap(): void {
    // Initialize map centered on UEL coordinates (approximate)
    this.map = L.map('leafletMap').setView([10.8700, 106.7780], 17);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.map);

    // Add a demo marker
    const customIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([10.8700, 106.7780], { icon: customIcon }).addTo(this.map);
    
    marker.on('click', () => {
      this.selectDemoSpace();
    });
  }

  selectDemoSpace() {
    this.selectedSpace = {
      name: 'Phòng B1.104',
      building: 'Tòa nhà B1',
      floor: '1',
      type: 'Phòng học',
      capacity: 50,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Máy chiếu', 'Điều hòa', 'Bảng từ'],
      image: 'https://images.unsplash.com/photo-1577414458315-9988229b122f?auto=format&fit=crop&q=80&w=400'
    };
  }

  triggerEmptyStateDemo() {
    this.showEmptyState = true;
  }

  closeEmptyState() {
    this.showEmptyState = false;
  }
}
