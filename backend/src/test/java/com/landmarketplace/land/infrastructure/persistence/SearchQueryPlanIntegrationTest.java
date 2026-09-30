package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.support.PostgisIntegrationSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SearchQueryPlanIntegrationTest extends PostgisIntegrationSupport {
    @Autowired JdbcTemplate jdbc;

    @Test
    void shouldCharacterizeMetricSearchOnTenThousandDistributedParcels() throws Exception {
        jdbc.update("DELETE FROM app.lands");
        jdbc.update("""
            INSERT INTO app.lands (price, description, contact, geometry)
            SELECT 100, 'Synthetic query-plan parcel', 'fixture@example.com',
                public.ST_MakeEnvelope(-36 + x * 0.01, -8 + y * 0.01,
                    -36 + x * 0.01 + 0.001, -8 + y * 0.01 + 0.001, 4326)
            FROM generate_series(0, 99) x CROSS JOIN generate_series(0, 99) y
            """);
        jdbc.execute("ANALYZE app.lands");
        String sql = """
            EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
            SELECT * FROM app.lands WHERE public.ST_DWithin(geometry::public.geography,
                public.ST_SetSRID(public.ST_MakePoint(-35.5, -7.5), 4326)::public.geography, 500)
            ORDER BY created_at, id
            """;
        jdbc.queryForObject(sql, String.class);
        String after = jdbc.queryForObject(sql, String.class);
        assertTrue(after.contains("idx_lands_geography"), after);
        // Compare against V2 in the disposable test transaction; rollback restores V3.
        jdbc.execute("DROP INDEX app.idx_lands_geography");
        jdbc.queryForObject(sql, String.class);
        String before = jdbc.queryForObject(sql, String.class);
        Files.createDirectories(Path.of("target/query-plans"));
        Files.writeString(Path.of("target/query-plans/geometry-index.json"), before);
        Files.writeString(Path.of("target/query-plans/geography-index.json"), after);
        assertEquals(1, jdbc.queryForObject("""
            SELECT count(*) FROM app.lands WHERE public.ST_DWithin(geometry::public.geography,
                public.ST_SetSRID(public.ST_MakePoint(-35.5, -7.5), 4326)::public.geography, 500)
            """, Integer.class));
    }
}
