# HTTP Status Code Matrix

Covers `POST /v1/submissions` and `GET /v1/submissions/{id}`.

| Status | Meaning               | Endpoint(s)            | When it's returned                                                                 | Body shape              |
|--------|-----------------------|-------------------------|-------------------------------------------------------------------------------------|--------------------------|
| 200    | OK                    | GET /submissions/{id}   | The submission ID exists and its record is returned.                               | `SubmissionRecord`       |
| 201    | Created               | POST /submissions       | The submission passed validation and a new record was created.                     | `SubmissionRecord`       |
| 400    | Bad Request           | POST /submissions       | The request body is missing a required field or a field fails validation (e.g. an unrecognized `documentType`). | `ValidationErrorResponse` (includes `fields`) |
| 401    | Unauthorized          | POST /submissions, GET /submissions/{id} | The caller's session/token is missing, invalid, or expired.               | `ErrorResponse`          |
| 404    | Not Found             | POST /submissions, GET /submissions/{id} | POST: the endpoint/route itself doesn't exist (e.g. wrong base path). GET: no submission exists with the given `id`. | `ErrorResponse`          |
| 409    | Conflict              | POST /submissions       | A submission with the same `requestId` has already been created.                   | `ErrorResponse`          |
| 500    | Internal Server Error | POST /submissions, GET /submissions/{id} | An unexpected failure occurred while processing the request.                        | `ErrorResponse`          |

## Client handling notes

- **2xx (200/201)** — render the success state using the returned `SubmissionRecord`.
- **400** — treat as a validation failure: read `fields` and attach each message to the matching form field, same as a client-side validation error.
- **401** — treat as an auth failure: prompt re-authentication rather than showing it as a form error.
- **404** — treat as a configuration/routing problem (POST) or an unknown ID (GET); not something the user can fix by editing the form.
- **409** — treat as a validation failure scoped to `requestId`: ask the user to choose a different, unique Request ID.
- **500 / network failure / timeout** — treat as a transient server or connectivity problem; show a generic retry message. A network-level failure (no response at all) is distinct from a 500 and should be handled separately in code (e.g. a caught `TypeError` from `fetch`, or an aborted request on timeout), since no status code is available in that case.
