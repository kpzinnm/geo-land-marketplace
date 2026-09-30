# Geo Land Marketplace

A geospatial land-listing MVP. The backend registers a parcel from a GeoJSON polygon,
rejects overlapping land interiors, and finds parcels intersecting a circular search
area. Price, description, contact, geometry and timestamps are returned for map popups.

## Status and scope

The Java backend and database are implemented. **The React + OpenLayers frontend is
pending.** Compose currently starts two services: `database` and `backend`. The final
application will also need polygon drawing, mouse-driven circles with live radius,
popups, frontend tests and a frontend Compose service. Authentication, offers, editing
and deletion are outside the current backend scope.

## Requirements

- Docker Engine/Desktop with Compose v2 for the complete backend stack and integration tests.
- Java 21 for host development; the Maven wrapper downloads its pinned Maven version.
- PostgreSQL 16 with PostGIS 3.4 for a fully native database installation.
- Internet access on the first build to download dependencies and container images.

## Start with Docker

From the repository root, create a local environment file if one does not exist:

```sh
cp -n .env.example .env
# Review .env and replace demonstration credentials as appropriate.
docker compose up -d --build --wait
curl --fail http://localhost:8080/actuator/health
```

Expected health response: `{"status":"UP"}`. The database must become healthy before
Spring starts; Flyway applies migrations and Hibernate validates the schema. The
backend image runs as a non-root user. Its healthcheck uses curl, installed in the
runtime image. Tests run separately before image builds; the packaging stage does
not require access to a Docker socket.

```sh
docker compose logs backend
docker compose stop
```

Stopping services preserves data. Existing database volumes retain the credentials
with which they were initialized: changing `.env` does not change existing database
users or passwords. Do not remove the volume or edit applied migrations to solve an
authentication error. Never publish `.env` or resolved `docker compose config` output.
Use `docker compose config --quiet` to validate configuration without printing secrets.

## Run the backend locally

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

| Variable | Purpose / default |
| --- | --- |
| `POSTGRES_DB` | Database name; example `land_marketplace` |
| `POSTGRES_USER` | Local database login; example `land_user` |
| `POSTGRES_PASSWORD` | Required password; example is for local development only |
| `POSTGRES_PORT` | Database host port, default `5432` |
| `BACKEND_PORT` | Compose API host port, default `8080` |
| `SPRING_DATASOURCE_URL` | Overrides the host JDBC URL; Compose uses hostname `database` |
| `SPRING_DATASOURCE_USERNAME` | Overrides `POSTGRES_USER` for Spring |
| `SPRING_DATASOURCE_PASSWORD` | Overrides `POSTGRES_PASSWORD` for Spring |
| `SERVER_PORT` | Optional Spring HTTP port for a host process, default `8080` |

Published Compose ports bind to localhost. Inside the Compose network the database
is always `database:5432`, regardless of the host port. A future frontend should use
a same-origin proxy for `/api`; no unrestricted CORS policy is enabled.

## HTTP API

Base URL: `http://localhost:8080/api/v1/lands`. All bodies and responses use JSON.
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
curl -i -X POST http://localhost:8080/api/v1/lands \
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
curl http://localhost:8080/api/v1/lands/REPLACE_WITH_RETURNED_UUID
curl -X POST http://localhost:8080/api/v1/lands/search \
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
