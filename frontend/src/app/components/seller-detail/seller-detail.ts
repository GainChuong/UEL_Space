import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SellersService, SellerProfile } from '../../services/sellers.service';
import { SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-seller-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './seller-detail.html',
  styleUrls: ['./seller-detail.scss']
})
export class SellerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sellersService = inject(SellersService);
  private cdr = inject(ChangeDetectorRef);

  sellerId: string = '';
  seller: SellerProfile | null = null;
  allSpaces: any[] = [];
  filteredSpaces: any[] = [];
  isLoading: boolean = true;

  // Tabs
  activeTab: 'spaces' | 'reviews' | 'about' = 'spaces';

  // Filters within Seller's spaces
  searchQuery: string = '';
  selectedType: string = 'all';
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'rating' = 'popular';
  spaceTypes: string[] = ['all'];

  // Share Link State
  copiedLink: boolean = false;
  toastMessage: string = '';
  showToast: boolean = false;

  serverImagesLink = SERVER_IMAGES_LINK;
  defaultFallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sellerId = params.get('id') || 'seller-techpark';
      this.loadSellerData(this.sellerId);
    });

    // Support query param for tab (?tab=reviews)
    this.route.queryParamMap.subscribe(queryParams => {
      const tabParam = queryParams.get('tab');
      if (tabParam === 'reviews' || tabParam === 'about' || tabParam === 'spaces') {
        this.activeTab = tabParam;
      }
    });
  }

  loadSellerData(id: string): void {
    this.isLoading = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const profile = this.sellersService.getSellerById(id);
    if (profile) {
      this.seller = profile;
      this.allSpaces = this.sellersService.getSpacesBySeller(profile.id);
      
      // Extract unique space types for filtering
      const typesSet = new Set<string>();
      this.allSpaces.forEach(s => {
        if (s.type) typesSet.add(s.type);
      });
      this.spaceTypes = ['all', ...Array.from(typesSet)];
      
      this.applyFilters();
    } else {
      this.seller = null;
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  switchTab(tab: 'spaces' | 'reviews' | 'about'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  selectType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allSpaces];

    // Search query filter
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.building && s.building.toLowerCase().includes(q)) ||
        (s.floor && s.floor.toLowerCase().includes(q)) ||
        (s.type && s.type.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (this.selectedType !== 'all') {
      result = result.filter(s => s.type === this.selectedType);
    }

    // Sort
    if (this.sortBy === 'price-asc') {
      result.sort((a, b) => (a.hourlyPrice || 0) - (b.hourlyPrice || 0));
    } else if (this.sortBy === 'price-desc') {
      result.sort((a, b) => (b.hourlyPrice || 0) - (a.hourlyPrice || 0));
    } else if (this.sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.filteredSpaces = result;
    this.cdr.detectChanges();
  }

  navigateToSpace(spaceOrId: any): void {
    if (!spaceOrId) return;
    if (typeof spaceOrId === 'object') {
      const targetSlug = spaceOrId.slug || spaceOrId.id || spaceOrId._id;
      this.router.navigate(['/spaces', targetSlug]);
    } else {
      this.router.navigate(['/spaces', spaceOrId]);
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/map']);
    }
  }

  copyShareLink(): void {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.copiedLink = true;
      this.triggerToast('Đã sao chép liên kết trang đối tác vào bộ nhớ tạm!');
      setTimeout(() => {
        this.copiedLink = false;
        this.cdr.detectChanges();
      }, 2500);
    }
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
