import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/core/services/auth.service';

export interface TokenUsage {
  id: number;
  user_id: number;
  name: string;
  last_name: string | null;
  email: string;
  plan_id: number | null;
  plan_name: string | null;
  subscription_status: 'pending' | 'active' | 'expired' | 'cancelled';
  tokens_used: number;
}

export interface TokenUsageFilters {
  search?: string;
  plan_id?: number | null;
  status?: 'active' | 'expired' | null;
  sort?: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export interface TokenUsageResponse {
  status: string;
  data: TokenUsage[];
  meta: {
    total: number;
    current_page: number;
    per_page: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TokenUsageService {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.token,
      'Accept': 'application/json'
    });
  }

  getTokenUsage(filters: TokenUsageFilters): Observable<TokenUsageResponse> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('per_page', filters.per_page)
      .set('sort', filters.sort ?? 'desc');

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.plan_id) {
      params = params.set('plan_id', filters.plan_id);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<TokenUsageResponse>(URL_SERVICIOS + '/admin/token-usage', {
      headers: this.getHeaders(),
      params
    });
  }

  // Planes para el filtro
  getPlans(): Observable<any> {
    return this.http.get(URL_SERVICIOS + '/plans', { headers: this.getHeaders() });
  }
}
