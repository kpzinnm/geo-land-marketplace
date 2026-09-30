# Backend implementation and verification

Verified on 2026-09-29 in America/Fortaleza (some container logs use 2026-09-30 UTC).
This report concerns the backend scope only. No commit, push or submission was made.

## Outcome

Registration, single-land retrieval and circular search are implemented and exercised
against real PostGIS. HTTP validation and overlap errors, independent concurrent
transactions, Docker startup, host startup and the coverage gate passed.

| Final check | Result |
| --- | --- |
| `cd backend && ./mvnw clean verify` | BUILD SUCCESS; 33 unit + 18 integration tests |
| Failures / errors / skipped | 0 / 0 / 0 |
| JaCoCo lines | **194 / 198 = 97.98%** |
| JaCoCo branches | **94 / 102 = 92.16%** |
| Coverage gate | LINE COVEREDRATIO >= 0.81; no production-class exclusions |
| `docker compose config --quiet` | Passed without printing resolved configuration |
| `docker compose build backend` | Final multi-stage image built successfully |
| Isolated Compose startup/update | Both services healthy; V1, V2 and V3 successful |
| Container HTTP smoke | Health UP; create 201; GET 200; duplicate 409; search 200; invalid search 400 |
| Host local-profile startup | Health UP and search 200 against the temporary database |
| V1/V2 comparison against HEAD | No changes |
| `git diff --check` | Passed |

Coverage artifacts are generated in `backend/target/site/jacoco/`. Test XML reports
are in `target/surefire-reports/` and `target/failsafe-reports/`. `clean` removes these
outputs; the documented command regenerates them.

## Changes and decisions

| Files (relative to repository root) | Change and reason |
| --- | --- |
| `backend/pom.xml` | Testcontainers PostgreSQL module 2.0.5, managed by Spring Boot; Surefire/Failsafe split; JaCoCo 0.8.14 report and 81% line gate |
| `backend/src/main/resources/application.yml` | Explicit Spring datasource overrides and configurable host database port |
| `backend/src/main/resources/application-local.yml` | Import `../.env` as properties for host development, without shell evaluation |
| `backend/src/main/java/com/landmarketplace/land/domain/Land.java` | Final fields, defensive JTS copies, numeric-column limits, coordinate and antimeridian validation |
| `backend/src/main/java/com/landmarketplace/land/domain/LandRepository.java` | Metric search port returning domain objects |
| `backend/src/main/java/com/landmarketplace/land/application/CreateLandUseCase.java` | Explicit READ COMMITTED transaction and English comment for the lock/check/insert sequence |
| `backend/src/main/java/com/landmarketplace/land/application/SearchLandsUseCase.java` | Finite center/radius validation, 100 km maximum, read-only search transaction |
| `backend/src/main/java/com/landmarketplace/land/application/FindLandUseCase.java` | Read-only lookup for the registration Location header |
| `backend/src/main/java/com/landmarketplace/land/application/LandNotFoundException.java` | Explicit missing-land application error |
| `backend/src/main/java/com/landmarketplace/land/infrastructure/persistence/LandRepositoryAdapter.java` | Search mapping and transaction-bound JDBC execution of the PostgreSQL advisory lock |
| `backend/src/main/java/com/landmarketplace/land/infrastructure/persistence/SpringDataLandRepository.java` | Parameterized geography search with stable result ordering |
| `backend/src/main/java/com/landmarketplace/land/api/LandController.java` | POST search and GET by UUID, keeping HTTP orchestration thin |
| `backend/src/main/java/com/landmarketplace/land/api/LandExceptionHandler.java` | Missing-land 404, malformed UUID 400 and shared invalid-input responses |
| `backend/src/main/java/com/landmarketplace/land/api/dto/SearchLandsRequest.java` | Non-null longitude, latitude and radius payload |
| `backend/src/main/java/com/landmarketplace/land/api/dto/GeoJsonPolygon.java` | Correct English documentation of longitude/latitude order |
| `backend/src/main/resources/db/migration/V3__index_land_geography.sql` | GiST expression index, justified by measured plans below |
| `backend/Dockerfile`, `backend/.dockerignore`, `docker-compose.yml` | Non-root backend image, healthcheck, database readiness dependency, explicit credentials and secret-free build context |
| `.env.example`, `.gitignore` | Documented demo values/ports and ignored local environment/backup/credential files |
| `README.md`, `backend/VERIFICATION.md` | English setup, contract, architecture, test instructions, measured results and limitations |
| `docs/planejamento.txt` (ignored local context) | Replace stale status with verified progress and remaining work |

Existing user edits were preserved. `LandJpaEntity` already had the protected Lombok
no-argument constructor; this session verified it rather than adding a duplicate.
The existing `LandApiMapper`, creation DTOs, persistence mapper and overlap query were
retained and exercised by expanded tests. No frontend files were changed.

### Test files

Under `backend/src/test/java/com/landmarketplace/`:

- `BackendApplicationIntegrationTest.java`: renamed context test into the Failsafe lifecycle.
- `support/PostgisIntegrationSupport.java`: one disposable PostGIS instance per integration JVM,
  dynamic datasource properties and automatic Testcontainers cleanup.
- `support/LandFixtures.java`: reusable valid domain/geometry fixtures.
- `land/domain/LandTest.java`: invariants, persistence-compatible price limits and defensive copies.
- `land/application/SearchLandsUseCaseTest.java`: metric-search delegation and invalid inputs.
- `land/api/LandApiMapperTest.java`: added hole roundtrip, metadata and malformed coordinate cases.
- `land/api/LandHttpIntegrationTest.java`: actual HTTP server, 201/200/400/404/409, search and concurrent requests.
- `land/infrastructure/persistence/LandRepositoryAdapterIntegrationTest.java`: database roundtrip
  after clearing the persistence context, equal/contained/touching/disjoint polygons, holes,
  minimum-distance search and tangency within numerical tolerance.
- `land/infrastructure/persistence/RegistrationConcurrencyIntegrationTest.java`: two independent
  transactions, actual waiting observed in `pg_locks`, commit and rollback outcomes.
- `land/infrastructure/persistence/SearchQueryPlanIntegrationTest.java`: migration index usage
  and comparative plans on 10,000 synthetic parcels; changes roll back in the test database.

The existing `CreateLandUseCaseTest` also passes and verifies operation order and
conflict behavior with Mockito. It is not used as a substitute for database concurrency tests.

## Query-plan evidence and migration decision

The initial assumption was that no schema change would be needed. Measurement showed
that the V2 geometry index did not serve `geometry::geography`, which justified V3.

The final experiment inserts a 100 x 100 grid of non-overlapping 0.001-degree parcels,
spaced 0.01 degrees apart, between longitude -36/-35 and latitude -8/-7. A 500 m query
at (-35.5,-7.5) returns one parcel. The test runs ANALYZE and warms each query before
recording `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, including the production ORDER BY.

| Plan | Observed execution | Shared buffer hits | Results |
| --- | --- | --- | --- |
| V2 geometry index only: Sort -> Seq Scan | 167.961 ms | 295 | 1; 9,999 filtered out |
| V3 expression index: Sort -> Index Scan `idx_lands_geography` | 0.110 ms | 3 | 1 |

These are local synthetic observations, not a production benchmark or latency promise.
The final test starts with the migrated index, measures it, temporarily drops it only
inside the disposable test transaction for the comparison, and rolls back. It verifies
that the migrated index is actually selected; it does not assert fragile timing limits.
Raw JSON: `target/query-plans/geometry-index.json` and `geography-index.json`.

`ST_DWithin` on geography uses meters and defaults to spheroidal distances; see the
[PostGIS reference](https://postgis.net/docs/ST_DWithin.html). The index matches that
expression. V1/V2 were not edited, and no Flyway repair/reset was performed.

## Runtime verification method

The development database and its volume were not used for the new test suite or smoke
writes. A separate Compose project, `geo-backend-verification`, used `.env.example`,
host ports 55439/18089 and an override replacing its database volume with tmpfs.
The override selected the locally built backend image. No real `.env` was modified.

The equivalent startup command was:

```sh
POSTGRES_PORT=55439 BACKEND_PORT=18089 docker compose --env-file .env.example \
  -p geo-backend-verification -f docker-compose.yml \
  -f /tmp/geo-compose-verification.yml up -d --no-build --wait
```

The scratch override is a session verification artifact, not required for normal use.
Registration/search curl equivalents from the README were sent by an HTTP smoke script.
The first image started with V1/V2; updating to the final image applied V3 and preserved
the previously created parcel. Both fresh migration (Testcontainers) and upgrade
(Compose) paths were exercised.

Host startup used `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` from `backend/`,
with explicit datasource environment overrides pointing to that temporary database
and `SERVER_PORT=18090`. This proved local-profile loading and runtime connectivity
without targeting the personal database. A fully native PostgreSQL installation was
not provisioned during this session.

The session-created host process and temporary Compose services were stopped after
verification. The intentional termination of the host Java process made the Maven
run goal report exit code 143 after the successful HTTP checks; it was not a startup
failure. No project data volume was removed.

## Failures found and resolved

1. Initial sandbox execution could not open the database socket. A permitted rerun
   reproduced the actual configuration error: username literally `${POSTGRES_USER}`.
   Dynamic test properties and the explicit local profile resolve the two environments.
2. The first expanded full run had one timestamp assertion failure: PostgreSQL rounded
   nanoseconds to microseconds while the test truncated. The test now checks a difference
   below one microsecond and verifies both timestamps.
3. Search-plan inspection found a sequential scan despite V2's geometry index. V3
   adds the matching expression index; real query plans verify its use.

## Remaining scope and risks

- Frontend drawing, interactive radius, popups, frontend coverage and its Compose service remain pending.
- Global advisory locking limits registration throughput; external writers must follow the same protocol.
- Search returns all matches without pagination; large result sets can consume memory and bandwidth.
- Antimeridian/large longitude-span polygons are rejected; global/polar cadastral semantics are not claimed.
- This MVP has no authentication, rate limiting or public deployment configuration.
- V3 uses ordinary CREATE INDEX; applying it to a large live table needs an operational migration plan.
- The original submission deadline is still unknown. No commit/push was authorized or performed.

A separate Portuguese study guide, `GEO_LAND_BACKEND_STUDY_GUIDE_2026-09-29.md`,
was delivered in the user's Downloads/Temp directory outside the repository. It explains
the final code and design trade-offs.
