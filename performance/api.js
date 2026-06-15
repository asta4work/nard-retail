import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000/api';
const email = __ENV.TEST_EMAIL || 'admin@retail.local';
const password = __ENV.TEST_PASSWORD || 'ChangeMe123!';

export const options = {
  scenarios: {
    catalog_reads: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 10),
      duration: __ENV.DURATION || '30s',
      exec: 'catalogReads',
    },
    report_reads: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.REPORT_RATE || 2),
      timeUnit: '1s',
      duration: __ENV.DURATION || '30s',
      preAllocatedVUs: 5,
      exec: 'reportReads',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:login}': ['p(95)<1000'],
    'http_req_duration{name:products}': ['p(95)<300'],
    'http_req_duration{name:reports}': ['p(95)<750'],
  },
};

export function setup() {
  const response = http.post(`${baseUrl}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });
  check(response, { 'login succeeds': (result) => result.status === 201 });
  return { token: response.json('accessToken') };
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function catalogReads({ token }) {
  const response = http.get(`${baseUrl}/products?page=1&limit=10&sort=newest&order=DESC`, {
    ...authHeaders(token),
    tags: { name: 'products' },
  });
  check(response, { 'products returns 200': (result) => result.status === 200 });
  sleep(0.25);
}

export function reportReads({ token }) {
  const responses = http.batch([
    ['GET', `${baseUrl}/reports/sales`, null, { ...authHeaders(token), tags: { name: 'reports' } }],
    ['GET', `${baseUrl}/reports/inventory`, null, { ...authHeaders(token), tags: { name: 'reports' } }],
  ]);
  check(responses, { 'reports return 200': (results) => results.every((result) => result.status === 200) });
}
