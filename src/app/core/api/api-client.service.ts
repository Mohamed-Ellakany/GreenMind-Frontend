import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from './api.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  public get<T>(path: string): Observable<T> {
    return this.unwrap(this.http.get<ApiResponse<T>>(this.buildUrl(path)));
  }
  public getBlob(path: string): Observable<Blob> { return this.http.get(this.buildUrl(path), { responseType: 'blob' }); }

  public post<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.post<ApiResponse<T>>(this.buildUrl(path), body));
  }

  public put<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.put<ApiResponse<T>>(this.buildUrl(path), body));
  }

  public patch<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.patch<ApiResponse<T>>(this.buildUrl(path), body));
  }

  public delete<T>(path: string): Observable<T> {
    return this.unwrap(this.http.delete<ApiResponse<T>>(this.buildUrl(path)));
  }

  private unwrap<T>(source: Observable<ApiResponse<T> | null>): Observable<T> {
    // Successful commands can legitimately return 204 No Content. Angular
    // represents that response body as null, so do not try to read `.data`.
    return source.pipe(map((response) => response?.data as T));
  }
}
