// Import der notwendigen Module für den Lasttest
import { check } from 'k6'
import http from 'k6/http'

// Definition der Testkonfiguration
export const options = {
  // Definition der Schwellenwerte für den Test
  thresholds: {
    // Der Anteil fehlgeschlagener HTTP-Anfragen sollte unter 1 % liegen
    http_req_failed: ['rate<0.01'],
    // 99 % der Anfragen sollten innerhalb von 1 Sekunde abgeschlossen sein
    http_req_duration: ['p(99)<1000'],
  },
}

export default function () {
  // Definiert die URL für das Abrufen der Posts
  const url = 'http://localhost:80/api/posts'

  // Sendet eine GET-Anfrage an die definierte URL und speichert die Antwort
  const res = http.get(url)

  // Überprüfung, ob die Antwort einen HTTP-Statuscode 200 (OK) zurückgibt
  check(res, {
    'response code was 200': (res) => res.status == 200,
  })
}
