import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  public get<T>(path: string): Observable<T> {
    return this.unwrap(this.http.get<ApiResponse<T>>(path));
  }

  public post<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.post<ApiResponse<T>>(path, body));
  }

  public put<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.put<ApiResponse<T>>(path, body));
  }

  public patch<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.patch<ApiResponse<T>>(path, body));
  }

  public delete<T>(path: string): Observable<T> {
    return this.unwrap(this.http.delete<ApiResponse<T>>(path));
  }

  private unwrap<T>(source: Observable<ApiResponse<T> | null>): Observable<T> {
    // Successful commands can legitimately return 204 No Content. Angular
    // represents that response body as null, so do not try to read `.data`.
    return source.pipe(map((response) => response?.data as T));
  }
}
