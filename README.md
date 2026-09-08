# New Hire Document Submission

A small HR onboarding form: employees (or HR staff on their behalf) submit
identity/document files for a new hire, with client-side validation and an
async submission flow against a mock REST API.

Built as a training project covering HTML/CSS/JS fundamentals, advanced
async JavaScript, and API contract design.

## Project structure

```
.
├── index.html                    Page markup (semantic HTML, fieldset-grouped form)
├── styles.css                    Styling (responsive, formal/document-style theme)
├── app.js                        Form validation + async submission logic
├── config.js                     Single source of truth for the API base URL
├── mock-server.js                Intercepts fetch() to simulate a REST backend
├── openapi.yaml                  OpenAPI 3.0 contract for the submissions API
├── sample-request-response.json  Example request/response payloads per status code
└── status-code-matrix.md         What each HTTP status means and how the client handles it
```

## Running locally

No build step or server required.

1. Clone the repo.
2. Open `index.html` directly in a browser (or serve the folder with any
   static file server, e.g. `npx serve .`).

## How submission works

`app.js` builds a payload from the form and sends it with `fetch()` to the
URL defined in `config.js`. There is no real backend: `mock-server.js`
intercepts `window.fetch` for that URL and returns simulated responses,
so the async/await, loading, success, and error-handling code paths in
`app.js` behave exactly as they would against a live API.

### Testing the different response states

Enter one of these values as the **Request ID** to force that response;
any other value succeeds:

| Request ID | Response                          |
|------------|-------------------------------------|
| `TEST-400` | 400 — validation error (field-level) |
| `TEST-401` | 401 — unauthorized                  |
| `TEST-404` | 404 — not found                     |
| `TEST-409` | 409 — conflict (duplicate request)  |
| `TEST-500` | 500 — server error                  |
| anything else | 201 — success                    |

Requests and responses are also logged to the browser console (they won't
appear in the DevTools Network tab, since `mock-server.js` intercepts
`fetch` before it reaches the real network layer).

## API contract

See `openapi.yaml` for the full spec, `sample-request-response.json` for
example payloads, and `status-code-matrix.md` for how each status code is
interpreted client-side.

## Status

Training exercise, in progress. Current stage: Git workflow (branching,
PRs, review).
