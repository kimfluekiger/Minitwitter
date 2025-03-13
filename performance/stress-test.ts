// import necessary modules
import { check } from 'k6'
import http from 'k6/http'

// define configuration
export const options = {
  // define thresholds
  thresholds: {
    // http errors should be less than 1%
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
    // 99% of requests should be below 1s
    http_req_duration: [{ threshold: 'p(99)<1000', abortOnFail: true }],
  },
  // define scenarios
  scenarios: {
    breaking: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 20 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '20s', target: 200 },
        { duration: '50s', target: 500 },
        { duration: '50s', target: 1000 },
        { duration: '50s', target: 2000 },
      ],
    },
  },
}

export default function () {
  // define URL for posts
  const url = 'http://localhost:80/api/posts'

  // send a get request and save response
  const res = http.get(url)

  // check that response is 200
  check(res, {
    'response code was 200': (res) => res.status == 200,
  })
}
