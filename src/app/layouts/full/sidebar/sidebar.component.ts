import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ViewChild,
} from '@angular/core';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { navItems } from './sidebar-data';
import { NavItem } from './nav-item/nav-item';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
    selector: 'app-sidebar',
    imports: [BrandingComponent, TablerIconsModule, MaterialModule],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);

  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  menuItems: NavItem[] = [];

  private adminOnlyRoutes = [
    '/users',
    '/suscriptions',
    '/payments',
    'content',
    '/packages',
    '/plans',
    '/coupons',
    'useia',
    '/useia/tokens',
    '/use/consume'
  ];

  ngOnInit(): void { 
    const roleId = this.authService.getRoleId();

    if (roleId === 1) {
      // Si es admin, acceso total
      this.menuItems = navItems;
    } else {
      // Si es usuario, excluimos las rutas de admin
      this.menuItems = navItems.filter(item => {
        if (item.route && this.adminOnlyRoutes.includes(item.route)) {
          return false;
        }
        return true;
      });
    }
  }
}
