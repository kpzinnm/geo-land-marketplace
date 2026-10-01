# Geo Land Marketplace

Geo Land Marketplace is a geospatial land-listing MVP. Users can draw and register a land parcel, search within a circular area, and inspect matching parcels on a map. The application uses React and OpenLayers in the frontend, Spring Boot in the backend, and PostgreSQL with PostGIS for spatial storage and queries.

## Features

- Register a polygon with a price, description, and contact.
- Reject parcels whose interiors overlap an existing parcel. Shared edges and vertices are allowed.
- Search for parcels that intersect a circle with a radius of up to 100 km.
- Show search results on the map and in a sidebar; select a parcel to focus it and view its details.

Authentication, offers, editing, and deletion are outside the MVP.

## Architecture

```text
Browser
  |
  v
Frontend: React + OpenLayers
  |
  | same-origin /api requests through Nginx
  v
Backend: Spring Boot + Hibernate Spatial / JTS
  |
  v
Database: PostgreSQL 16 + PostGIS 3.4
```

Docker Compose starts the three services. Nginx serves the frontend and forwards `/api` requests to the backend. Flyway applies database migrations at startup, and Hibernate validates the resulting schema. PostGIS checks polygon overlap and performs distance-based searches.

## Run with Docker

You need Docker Engine or Docker Desktop with the Docker Compose plugin. The first build also needs internet access for images and dependencies; the map uses OpenStreetMap tiles.

From a fresh clone, run:

```sh
cp .env.example .env
docker compose up --build
```

Review the demonstration credentials in `.env` before use. Compose reads this file automatically. Java, Maven, Node.js, PostgreSQL, and PostGIS are not required on the host for this workflow.

Open **http://localhost:3000**. The backend health endpoint is available at **http://localhost:8080/actuator/health**. The database is published on `localhost:5432` by default. Host ports can be changed in `.env` using `FRONTEND_PORT`, `BACKEND_PORT`, and `POSTGRES_PORT`.

To run in the background and check startup:

```sh
docker compose up -d --build --wait
docker compose ps
curl --fail http://localhost:8080/actuator/health
```

The expected Compose state is a healthy database, a healthy backend, and a running frontend. The frontend has no separate container healthcheck.

### Try the application

In the browser, register a polygon with a price, description, and contact. Registering an overlapping polygon should produce a conflict. Then draw a search circle, run the search, and select a result to view its details. An area without matching parcels should show an empty result.

The user has reported completing the application flow successfully in a browser. The separate Docker verification recorded successful HTTP requests through Nginx for registration, overlap rejection, search, and retrieval; its author could not run a browser test in that verification session.

### Stop or reset

```sh
docker compose down
```

This preserves the database volume and its records. To delete the project's database volume and **all records stored in it**, use `docker compose down -v` only when you intend to reset disposable data. Changing credentials in `.env` does not change the credentials of an existing database volume.

## Run locally

For host development, use Java 21 and Node.js 22.12+ with npm. The Maven Wrapper downloads Maven as needed. Start the database with Compose, then run the backend from `backend/`:

```sh
docker compose up -d database
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

The local profile reads `../.env`. Keep its entries as simple `KEY=value` lines. In another terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally **http://localhost:5173**. Its `/api` proxy targets the backend on `localhost:8080`. Changing `BACKEND_PORT` changes Compose's published port; it does not change this local development proxy.

A fully native setup also requires PostgreSQL and PostGIS configured with the database credentials and schema permissions described in the existing project configuration. The recorded local development check used a Docker database; a native PostgreSQL installation was not verified.

## Essential API

Use `http://localhost:3000` as the base URL when the application runs through Compose. Requests and responses use JSON.

| Request                     | Result                                                                        |
| --------------------------- | ----------------------------------------------------------------------------- |
| `POST /api/v1/lands`        | Creates a parcel (`201`); invalid input returns `400`, overlap returns `409`. |
| `GET /api/v1/lands/{id}`    | Returns a parcel (`200`); a missing parcel returns `404`.                     |
| `POST /api/v1/lands/search` | Returns an array of matching parcels (`200`), or `[]` when none match.        |
| `GET /actuator/health`      | Reports backend health; this endpoint is available on the backend port.       |

Register a parcel:

```sh
curl -i http://localhost:3000/api/v1/lands \
  -H 'Content-Type: application/json' \
  -d '{
    "price": 250000.00,
    "description": "Residential land",
    "contact": "owner@example.com",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-35.90, -7.22],
        [-35.89, -7.22],
        [-35.89, -7.21],
        [-35.90, -7.21],
        [-35.90, -7.22]
      ]]
    }
  }'
```

Search around a point:

```sh
curl http://localhost:3000/api/v1/lands/search \
  -H 'Content-Type: application/json' \
  -d '{"longitude":-35.90,"latitude":-7.22,"radiusMeters":5000}'
```

Geometry is a GeoJSON **geometry object**, with `[longitude, latitude]` coordinates in WGS84/EPSG:4326. Search radius is measured in meters and must be greater than zero and no more than 100,000. Search includes parcels that partially intersect or touch the search area.

## Limitations and troubleshooting

The MVP targets local parcels. Polygons crossing the antimeridian or spanning at least 180 degrees of longitude are unsupported. Search results are not paginated, and registrations are serialized to prevent concurrent overlap through the application. Writers that bypass the application can also bypass that overlap protocol. OpenStreetMap tiles require an external connection.

For common startup issues:

- **Missing configuration:** Copy `.env.example` to `.env` and check the required database values. Run `docker compose config --quiet` to validate Compose configuration.
- **Port in use:** Change the corresponding host port in `.env` and restart Compose.
- **Backend unhealthy:** Inspect `docker compose logs --tail=100 backend database` for database, credential, or migration errors.
- **Database login fails after editing `.env`:** An existing database volume keeps its original users and passwords. Restore matching settings or update the credentials in PostgreSQL.
- **Nginx returns 502 after the backend container was replaced separately:** Run `docker compose restart frontend`.
- **Map tiles are missing:** Check the browser's connection to OpenStreetMap.

Compose publishes the services on `127.0.0.1` for local development and evaluation.

## Tests and coverage

Run the backend checks from `backend/`:

```sh
./mvnw clean verify
```

This runs unit and real PostGIS integration tests, generates a JaCoCo report, and enforces the configured coverage gate. Integration tests use Testcontainers and require a working Docker runtime; they use a disposable database rather than the development database.

Run the frontend checks from `frontend/`:

```sh
npm ci
npm run test:run
npm run test:coverage
npm run build
```

`test:run` runs the suite once. `test:coverage` runs the same suite with V8 coverage enabled; it can be used on its own when you need both test results and a coverage report.

The recorded results on **2026-10-01** are shown below. Frontend results reflect the developer-provided runs at 11:12 after the latest component/test changes; backend results come from the earlier verification.

| Area     | Tests                                         | Coverage                                                                            |
| -------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend  | 33 unit tests and 18 integration tests passed | JaCoCo: **97.98% lines**, **92.16% branches**                                       |
| Frontend | 28 tests passed in 6 files                    | Vitest/V8: **88.37% lines and statements**, **81.48% branches**, **100% functions** |

The backend build passed its JaCoCo gate, which requires at least 81% line coverage across production classes. Reports are generated at `backend/target/site/jacoco/index.html`, with test reports under `backend/target/surefire-reports/` and `backend/target/failsafe-reports/`. Frontend coverage is available at `frontend/coverage/index.html`.

**Frontend coverage has a limited measurement scope.** Its report covers the tested API client, components, and map utility; it does not include `App`, `LandMapPage`, or `MapView`. These percentages do not represent whole-application or browser end-to-end coverage. The map interaction flow therefore also relies on manual browser validation.

The frontend production build passed in the earlier verification, with an existing warning for a JavaScript chunk above 500 kB. The latest supplied test output does not include a new build result. See [the verification report](VERIFICATION.md) for the detailed commands and evidence behind these results.
