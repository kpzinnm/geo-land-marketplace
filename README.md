# Geo Land Marketplace

A geospatial land-listing MVP with React, OpenLayers, Spring Boot and PostGIS.
Draw a land polygon, provide its price, description and contact, and register it.
PostGIS rejects overlapping interiors and finds parcels intersecting a circular
search area. The frontend displays the radius while drawing, renders search results
on the map and in a sidebar, and focuses/highlights a selected parcel with its details.
Authentication, offers, editing and deletion are outside this MVP.

## Architecture

```text
Browser (React + OpenLayers)
  | same-origin /api/* requests
  v
localhost:3000 -> frontend:80 (Nginx: static files and reverse proxy)
                   |
                   v
                 backend:8080 (Spring Boot, Hibernate Spatial / JTS)
                   |
                   v
                 database:5432 (PostgreSQL 16 + PostGIS 3.4)
```

Docker Compose provides the internal network and service-name DNS. The browser
cannot resolve `backend` or `database`; it uses relative `/api/...` URLs. Nginx
forwards the complete path to `http://backend:8080` without stripping `/api`.
Other paths use the SPA's `index.html` fallback. Vite development retains its
`/api` proxy to `http://localhost:8080`.

## Prerequisites

- Git to clone the repository.
- Docker Engine/Desktop with the Docker Compose plugin (v2 or newer).
- Internet access for initial images/dependencies and OpenStreetMap base-map tiles.

**The Docker workflow does not require Java, Maven, Node.js, Nginx, PostgreSQL or
PostGIS installed on the host.** Host development additionally needs Java 21 and
Node.js 22.12+ with npm; Maven is downloaded by the checked-in wrapper.

## Quick start

Clone this repository and enter its root directory. On a fresh clone:

```sh
cp .env.example .env
# Review .env and replace demonstration credentials as appropriate.
docker compose up --build
```

If `.env` already exists, keep it instead of overwriting it. Compose reads the root
`.env` automatically; **do not run `source .env`**. Required database values fail
with a clear configuration error when absent or empty. The example password is
for local demonstration only. `.env` is ignored; `.env.example` belongs in Git.

For background execution and readiness checks:

```sh
docker compose up -d --build --wait
docker compose ps
curl --fail http://localhost:8080/actuator/health
curl -I http://localhost:3000
curl --fail http://localhost:3000/api/v1/lands/search \
  -H 'Content-Type: application/json' \
  -d '{"longitude":-35.8811,"latitude":-7.2306,"radiusMeters":1500}'
```

- Frontend: <http://localhost:3000>
- Backend health: <http://localhost:8080/actuator/health> (`{"status":"UP"}`)
- API: `http://localhost:8080/api/v1/lands` or same-origin `/api/v1/lands`
- PostgreSQL: `localhost:5432` (credentials from `.env`)

Expected state: database **healthy**, backend **healthy**, frontend **running**.
Database readiness uses `pg_isready`; backend startup waits for database health.
Spring Boot runs Flyway and validates the schema before serving requests. The
backend's image healthcheck uses `curl`, explicitly installed in its Java 21 runtime.
Frontend startup waits for backend health. Readiness dependencies govern startup;
they do not continuously restart dependents if a service later fails.

Both application images use multi-stage builds. The backend packages with the Maven
Wrapper and runs as a non-root user. The frontend uses `npm ci` and `npm run build`
in Node 22, then serves `dist/` with Nginx. Image builds intentionally skip tests;
run the separate quality gates below **before the final image build**.

## Using the map

1. Select **Register land**, click polygon vertices, and click the first point to
   finish. Enter price, description and contact, then submit. Repeating an overlapping
   polygon should show a conflict message.
2. Select **Search area**, draw a circle and observe the radius. Select **Search**.
3. Review the map polygons and the left result list. Select a result to focus and
   highlight its polygon and display its details; use **Back to results** to return.
4. Search an area without registered parcels to see the empty-state message.

Map interactions require a browser. See [full-stack verification](VERIFICATION.md)
for executed checks and the acceptance steps that remain unverified.

## Run without application containers

### Backend

From the root, create `.env` as above, then start only the database:

```sh
docker compose up -d database
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

The `local` profile imports `../.env` as a Java properties file. It does not execute
shell commands. Use simple `KEY=value` entries without `export` or shell quotes;
escape backslashes using Java properties syntax. Run this command from `backend/`.
The file is required by the local profile so missing configuration fails early.
Host environment variables override file values. Tests use dynamic Testcontainers
properties and never load `.env`.

For a fully native setup, install PostgreSQL 16 and PostGIS 3.4, create a database and
login matching `.env`, and provision the extension as an administrator:

```sql
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
```

The application login must be able to create/use the `app` schema and run migrations.
It need not be a superuser when the extension is already provisioned. Start the same
Maven command above without the Docker database command. The native installation
path is documented; runtime verification uses real PostGIS in Docker.

For a packaged application with explicit environment variables, no local profile is
needed. Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and
`SPRING_DATASOURCE_PASSWORD`, then run `java -jar backend/target/backend-0.0.1-SNAPSHOT.jar`.
Do not place real credentials in shared command histories or documentation.

### Frontend

In a second terminal, with the backend running at `localhost:8080`:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite (normally `http://localhost:5173`). The existing Vite
proxy targets port 8080. Changing `BACKEND_PORT` changes only Compose publishing,
not the host Spring server or the Vite proxy. Use port 8080 for this development
workflow, or explicitly adjust the proxy target when choosing another local port.

For a fully native workflow, the database must also be installed and configured as
above. Native PostgreSQL installation is not part of the executed validation.

## Environment variables

| Variable | Purpose / default |
| --- | --- |
| `POSTGRES_DB` | Database name; example `land_marketplace` |
| `POSTGRES_USER` | Local database login; example `land_user` |
| `POSTGRES_PASSWORD` | Required password; example is for local development only |
| `POSTGRES_PORT` | Database host port, default `5432` |
| `BACKEND_PORT` | Compose API host port, default `8080` |
| `FRONTEND_PORT` | Compose Nginx host port, default `3000` |
| `SPRING_DATASOURCE_URL` | Overrides the host JDBC URL; Compose uses hostname `database` |
| `SPRING_DATASOURCE_USERNAME` | Overrides `POSTGRES_USER` for Spring |
| `SPRING_DATASOURCE_PASSWORD` | Overrides `POSTGRES_PASSWORD` for Spring |
| `SERVER_PORT` | Optional Spring HTTP port for a host process, default `8080` |

Published Compose ports bind to localhost. Inside the Compose network the database
is always `database:5432`, regardless of the host port. The frontend uses
a same-origin proxy for `/api`; no unrestricted CORS policy is enabled. Host port
changes do not change internal service ports. Root `.env` configures Compose, not
the browser bundle. `VITE_API_BASE_URL` is an optional existing Vite build-time
override; leave it unset for both standard workflows. Never put secrets in `VITE_*`
variables. Frontend `.env*` files are excluded from the Docker build context so a
local override cannot silently bake an external API URL into the image.

## HTTP API

Base URL through Nginx: `http://localhost:3000/api/v1/lands`. All bodies and responses use JSON.
GeoJSON is a **geometry object**, not a Feature or FeatureCollection. Coordinates are
`[longitude, latitude]` in WGS84/EPSG:4326; positions have exactly two finite numbers.
OpenLayers clients displaying EPSG:3857 must transform coordinates at the API boundary.

| Endpoint | Successful result | Client errors |
| --- | --- | --- |
| `POST /api/v1/lands` | `201`, land body and usable `Location` header | `400` invalid input, `409` overlap |
| `GET /api/v1/lands/{id}` | `200`, land body | `400` malformed UUID, `404` missing land |
| `POST /api/v1/lands/search` | `200`, array of complete land objects; `[]` if none | `400` invalid search |
| `GET /actuator/health` | `200`, application/database health | `503` unhealthy |

Register a parcel:

```sh
curl -i -X POST http://localhost:3000/api/v1/lands \
  -H 'Content-Type: application/json' \
  -d '{
    "price": 250000.00,
    "description": "Residential land",
    "contact": "owner@example.com",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[-35.90,-7.22],[-35.89,-7.22],[-35.89,-7.21],[-35.90,-7.21],[-35.90,-7.22]]]
    }
  }'
```

The response contains `id` (UUID), `price`, `description`, `contact`, `geometry`,
`createdAt` and `updatedAt` (UTC timestamps). Follow the response's `Location`:

```sh
curl http://localhost:3000/api/v1/lands/REPLACE_WITH_RETURNED_UUID
curl -X POST http://localhost:3000/api/v1/lands/search \
  -H 'Content-Type: application/json' \
  -d '{"longitude":-35.90,"latitude":-7.22,"radiusMeters":5000}'
```

Repeating the same registration returns:

```json
{"code":"LAND_OVERLAP","message":"The land overlaps an existing land"}
```

Client errors use `code` and `message`. Validation errors intentionally provide a
safe summary. Unexpected errors remain HTTP 500; stack traces are not returned.

### Spatial and validation contract

- Price is positive with at most 13 integer digits and 2 decimal places.
- Description and contact cannot be blank. Contact is free text, not restricted to email.
- Rings are closed with at least four positions. Valid interior holes are supported.
  Empty, self-intersecting and zero-area polygons are rejected.
- Longitude is in `[-180,180]`, latitude in `[-90,90]`. Polygons crossing the
  antimeridian or spanning 180 degrees or more of longitude are unsupported and rejected.
- Shared edges and vertices are allowed. Interior overlap, equality and containment
  are rejected by `ST_Intersects AND NOT ST_Touches` in PostGIS.
- Search radius must be finite and in `(0,100000]` **meters**. The agreed MVP limit is
  100 km. `ST_DWithin(geometry::geography, point::geography, radius)` uses minimum
  geodesic distance on the WGS84 spheroid, including partial intersections and tangency.
  It does not use centroids, degree distances or Java-side filtering.
- Polygon validity/overlap uses planar WGS84 coordinates; metric search interprets
  edges geodesically. This MVP targets local parcels, not global/polar cadastral
  precision. The antimeridian restriction avoids ambiguous polygon wrapping.
- Search returns all matches, ordered by creation timestamp then ID, without pagination.
  Large result sets and globally serialized registrations are scaling limitations.

## Architecture and consistency

```text
backend/src/main/java/com/landmarketplace/land/
  api/                        HTTP controller, DTOs, GeoJSON mapper, error responses
  application/                Create, find and search use cases; transaction boundaries
  domain/                     Land invariants and LandRepository port
  infrastructure/persistence/ JPA entity, explicit mapper, PostGIS queries, advisory lock
```

`Land` is separate from `LandJpaEntity`; the domain does not depend on JPA. It owns
UUID/timestamp creation and defensively copies mutable JTS geometry. The database
retains defaults for direct SQL inserts; PostgreSQL timestamps have microsecond
precision. Domain and persistence mappers copy all seven fields.

Registration runs at READ COMMITTED. It acquires `pg_advisory_xact_lock(724019, 1)`
on the current Hibernate JDBC connection, checks overlap in a separate statement,
and flushes the insert before commit. Separating the lock and check lets a waiting
transaction see the previous committed insert. Rollback releases the lock as well.
This deliberately serializes registrations across application instances. **All
writers must follow this protocol**; direct SQL can bypass overlap prevention.
The database's row-level checks still enforce valid individual records.

## Database migrations

Flyway owns the schema and runs automatically on application startup. Hibernate
uses `ddl-auto: validate`; it does not generate or replace migrations. Docker setup
requires no new migration.

V1 enables PostGIS in `public`; V2 creates `app.lands`, its constraints and geometry
GiST index. V3 adds a GiST expression index on `geometry::geography`: a 10,000-parcel
query-plan experiment showed that V2's geometry index could not support this cast.
Applied migrations are immutable. See the verification report for measured evidence.

## Tests and coverage

From `backend/`:

```sh
./mvnw clean verify
```

This runs unit tests (Surefire), PostGIS/HTTP/concurrency integration tests (Failsafe),
then the JaCoCo report and check. Docker must be reachable. Testcontainers starts a
disposable PostGIS database, applies the real migrations and supplies credentials
dynamically. It never uses the development database or `.env`. A missing Docker
runtime is an explicit integration-test failure, not a skipped test.

```sh
# Unit tests only; no Docker needed. This is not the full verification gate.
./mvnw test
# Focused persistence regression, explicitly selected through Surefire:
./mvnw -Dtest=LandRepositoryAdapterIntegrationTest test
```

Reports:

- `backend/target/site/jacoco/index.html` (human-readable coverage)
- `backend/target/site/jacoco/jacoco.xml` and `jacoco.csv`
- `backend/target/surefire-reports/` and `backend/target/failsafe-reports/`
- `backend/target/query-plans/` (synthetic search-plan evidence)

The build requires **at least 81% line coverage**, strictly greater than 80%, across
all production classes with no class exclusions. Coverage includes integration
execution. Tests cover domain invariants, GeoJSON holes and invalid positions,
persistence after clearing the JPA cache, spatial conflicts, metric search, real HTTP,
and concurrent commit/rollback with observed PostgreSQL lock waiting.

See [backend verification](backend/VERIFICATION.md) for actual commands, results,
coverage denominators, query plans and remaining limitations.

From `frontend/`:

```sh
npm ci
npm run test:run
npm run test:coverage
npm run build
```

Vitest uses Testing Library, jsdom and V8 coverage. Reports are written to
`frontend/coverage/` (HTML: `index.html`). Current coverage is scoped to files
instrumented by the existing test suite; it is not proof of browser/map end-to-end
coverage. The OpenLayers interaction flow also needs the manual acceptance above.

After both quality gates pass, run `docker compose up -d --build --wait` from the
root. See [full-stack verification](VERIFICATION.md) for measured results.

## Stop and reset the database

```sh
docker compose down
```

This removes containers and the network but **preserves the named database volume**.
Starting the same Compose project again reuses its data.

**DESTRUCTIVE: the following command deletes the project's named volume and ALL
local database records. Use it only when intentionally resetting disposable data.**

```sh
docker compose down -v
```

Existing volumes retain their original database users/passwords. Editing `.env`
does not change those credentials. Restore matching configuration or deliberately
update credentials inside PostgreSQL; do not delete data to fix authentication.

## Troubleshooting

- **Port already in use:** set `POSTGRES_PORT`, `BACKEND_PORT` or `FRONTEND_PORT` in
  `.env` to a free host port, then rerun Compose. Internal DNS/ports stay unchanged.
- **Unhealthy backend:** inspect `docker compose logs --tail=100 backend database`.
  Check credentials, migration errors and database readiness. Use
  `docker compose exec backend curl --fail --silent http://localhost:8080/actuator/health`.
- **Database authentication:** ensure `.env` matches the existing volume's original
  credentials; changing environment values alone does not change PostgreSQL users.
- **Missing configuration:** copy `.env.example` to `.env` on a fresh checkout and
  populate required values. Validate with `docker compose config --quiet`.
- **Rebuild after source changes:** use `docker compose up -d --build --wait`.
  If the backend was replaced independently and Nginx returns 502, use
  `docker compose restart frontend` to refresh its upstream DNS resolution.
- **View logs:** `docker compose logs -f` or `docker compose logs -f backend`.
- **Map tiles missing:** check browser connectivity to OpenStreetMap; the tile
  service is external to Compose. Loading static HTML alone does not prove map rendering.

Compose publishes database, backend and frontend only on `127.0.0.1` for local
work. This is a development/evaluation topology, not an Internet-facing deployment.
Never publish `.env` or resolved `docker compose config` output containing secrets.
