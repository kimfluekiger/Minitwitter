// Import der notwendigen Module für den Stresstest
import { check } from 'k6'
import http from 'k6/http'

// Definition der Testkonfiguration
export const options = {
  // Definition der Schwellenwerte für den Test
  thresholds: {
    // Der Anteil fehlgeschlagener HTTP-Anfragen sollte unter 1 % liegen, sonst wird der Test abgebrochen
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
    // 99 % der Anfragen sollten innerhalb von 1 Sekunde abgeschlossen sein, sonst wird der Test abgebrochen
    http_req_duration: [{ threshold: 'p(99)<1000', abortOnFail: true }],
  },
  // Definition der Test-Szenarien
  scenarios: {
    breaking: {
      // Verwendet den "ramping-vus" Executor für eine gestaffelte Laststeigerung
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 10 },   // Starte mit 10 gleichzeitigen Nutzern für 10 Sekunden
        { duration: '20s', target: 20 },   // Erhöhe auf 20 Nutzer für 20 Sekunden
        { duration: '20s', target: 50 },   // Erhöhe auf 50 Nutzer für 20 Sekunden
        { duration: '20s', target: 100 },  // Erhöhe auf 100 Nutzer für 20 Sekunden
        { duration: '20s', target: 200 },  // Erhöhe auf 200 Nutzer für 20 Sekunden
        { duration: '50s', target: 500 },  // Erhöhe auf 500 Nutzer für 50 Sekunden
        { duration: '50s', target: 1000 }, // Erhöhe auf 1000 Nutzer für 50 Sekunden
        { duration: '50s', target: 2000 }, // Erhöhe auf 2000 Nutzer für 50 Sekunden
      ],
    },
  },
}

// Standardfunktion, die während des Tests für jede virtuelle Nutzerinstanz ausgeführt wird
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
