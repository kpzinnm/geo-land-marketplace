package com.landmarketplace.land.api;

import com.landmarketplace.support.PostgisIntegrationSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LandHttpIntegrationTest extends PostgisIntegrationSupport {
    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();
    private static final String REQUEST = """
        {"price":250000.00,"description":"Residential land","contact":"owner@example.com",
         "geometry":{"type":"Polygon","coordinates":[[[0,0],[0.01,0],[0.01,0.01],[0,0.01],[0,0]]]}}
        """;

    @BeforeEach
    @org.junit.jupiter.api.AfterEach
    void cleanDedicatedDatabase() {
        jdbc.update("DELETE FROM app.lands");
    }

    @Test
    void shouldCreateReadSearchAndRejectOverlapOverHttp() throws Exception {
        var created = post("", REQUEST);
        assertEquals(201, created.statusCode(), created.body());
        JsonNode body = json.readTree(created.body());
        assertEquals("Polygon", body.path("geometry").path("type").asText());
        assertEquals(250000, body.path("price").asDouble());
        assertFalse(body.path("createdAt").asText().isEmpty());
        var location = created.headers().firstValue("Location").orElseThrow();
        var read = client.send(HttpRequest.newBuilder(URI.create(baseUrl() + location)).GET().build(),
            HttpResponse.BodyHandlers.ofString());
        assertEquals(200, read.statusCode());
        assertEquals(body.path("id"), json.readTree(read.body()).path("id"));
        assertEquals(409, post("", REQUEST).statusCode());
        var search = post("/search", "{\"longitude\":0,\"latitude\":0,\"radiusMeters\":1}");
        assertEquals(200, search.statusCode(), search.body());
        assertEquals(body.path("id"), json.readTree(search.body()).get(0).path("id"));
        assertEquals("[]", post("/search", "{\"longitude\":10,\"latitude\":10,\"radiusMeters\":1}").body());
    }

    @Test
    void shouldReturnActionableClientErrors() throws Exception {
        assertEquals(400, post("", "{").statusCode());
        assertEquals(400, post("", "{}").statusCode());
        assertEquals(400, post("", REQUEST.replace("250000.00", "-1")).statusCode());
        assertEquals(400, post("", REQUEST.replace("Polygon", "Point")).statusCode());
        assertEquals(400, post("", REQUEST.replace("[[0,0]", "[[181,0]")).statusCode());
        assertEquals(400, post("/search", "{}").statusCode());
        assertEquals(400, post("/search", "{\"longitude\":0,\"latitude\":0,\"radiusMeters\":100001}").statusCode());
        assertEquals(400, get("not-a-uuid").statusCode());
        assertEquals(404, get(java.util.UUID.randomUUID().toString()).statusCode());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.lands", Integer.class));
    }

    @Test
    void shouldAllowOnlyOneOfTwoConcurrentConflictingRequests() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            var ready = new CountDownLatch(2);
            var start = new CountDownLatch(1);
            java.util.concurrent.Callable<Integer> create = () -> {
                ready.countDown();
                assertTrue(start.await(10, TimeUnit.SECONDS));
                return post("", REQUEST).statusCode();
            };
            var first = executor.submit(create);
            var second = executor.submit(create);
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            assertEquals(List.of(201, 409), java.util.stream.Stream.of(
                first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)).sorted().toList());
            assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM app.lands", Integer.class));
        }
    }

    private String baseUrl() { return "http://localhost:" + port; }

    private HttpResponse<String> get(String id) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(baseUrl() + "/api/v1/lands/" + id)).GET().build(),
            HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String suffix, String body) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create(baseUrl() + "/api/v1/lands" + suffix))
            .timeout(java.time.Duration.ofSeconds(15)).header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
}
