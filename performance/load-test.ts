// import necessary modules
import { check } from 'k6'
import http from 'k6/http'

// define configuration
export const options = {
  // define thresholds
  thresholds: {
    // http errors should be less than 1%
    http_req_failed: ['rate<0.01'],
    // 99% of requests should be below 1s
    http_req_duration: ['p(99)<1000'],
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
