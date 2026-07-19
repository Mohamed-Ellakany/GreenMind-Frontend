import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import MOCK from '../../mock-data/data';

export const mockInterceptor: HttpInterceptorFn = (request, next) => {
  const url = request.url;
  const method = request.method?.toUpperCase() ?? 'GET';

  // quick helper to respond
  const respond = (body: unknown) => of(new HttpResponse({ status: 200, body })).pipe(delay(250));

  try {
    // Admin farms list
    if (method === 'GET' && /\badmin\/farms\b/.test(url)) {
      if (/\/admin\/farms\/[^\/]+$/.test(url)) {
        const id = url.split('/').pop() || '';
        const item = MOCK.farms.find((f: any) => f.id === id) || MOCK.farmsById?.[id] || null;
        return respond(item);
      }
      return respond(MOCK.farms);
    }

    // Admin statistics
    if (method === 'GET' && /\badmin\/statistics\b/.test(url)) {
      return respond(MOCK.statistics);
    }

    // Crops
    if (method === 'GET' && /\bcrops?\b/.test(url)) {
      return respond(MOCK.crops);
    }

    // Destinations
    if (method === 'GET' && /destinations?\b/.test(url)) {
      return respond(MOCK.destinations);
    }

    // Export plans
    if (method === 'GET' && /export-plans?\b/.test(url)) {
      if (/\/export-plans\/[^\/]+$/.test(url)) {
        const id = url.split('/').pop() || '';
        const item = MOCK.exportPlans.find((p: any) => p.id === id) || null;
        return respond(item);
      }
      return respond(MOCK.exportPlans);
    }

    // Export plan dashboard / tasks / soil-measurements subroutes
    if (method === 'GET' && /export-plans\/[^\/]+\/(dashboard|tasks|soil-measurements)/.test(url)) {
      const parts = url.split('/');
      const planIdIndex = parts.findIndex((p) => p === 'export-plans') + 1;
      const id = parts[planIdIndex] || '';
      if (/\/export-plans\/.+\/dashboard/.test(url)) {
        const plan = MOCK.exportPlans.find((p: any) => p.id === id) || null;
        const tasks = MOCK.tasks?.filter((t: any) => t.planId === id) || [];
        const soil = MOCK.soilMeasurements?.filter((s: any) => s.planId === id) || [];
        return respond({ plan, tasksCount: tasks.length, soilCount: soil.length });
      }
      if (/\/export-plans\/.+\/tasks/.test(url)) {
        return respond(MOCK.tasks?.filter((t: any) => t.planId === id) || []);
      }
      if (/\/export-plans\/.+\/soil-measurements/.test(url)) {
        return respond(MOCK.soilMeasurements?.filter((s: any) => s.planId === id) || []);
      }
    }

    // Farm owner view: /farm (return main farm for current user)
    if (method === 'GET' && /(^|\/)farm($|\/)/.test(url)) {
      // prefer numeric id 1 if available
      return respond(MOCK.farmsById?.['1'] || MOCK.farms[0] || null);
    }

    // Auth / user info (fallback)
    if (method === 'GET' && /currentUser|me|users?\//.test(url)) {
      return respond(MOCK.users[0]);
    }
  } catch (e) {
    // if any error, fallthrough to real network
  }

  return next(request);
};
