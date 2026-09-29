package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.land.infrastructure.persistence.LandJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SpringDataLandRepository extends JpaRepository<LandJpaEntity, UUID> {

    @Query(
        value = """
            WITH candidate AS (
                SELECT public.ST_GeomFromText(:wkt, 4326) AS geometry
            )
            SELECT EXISTS (
                SELECT 1
                FROM app.lands existing
                CROSS JOIN candidate
                WHERE public.ST_Intersects(
                    existing.geometry,
                    candidate.geometry
                )
                AND NOT public.ST_Touches(
                    existing.geometry,
                    candidate.geometry
                )
            )
            """,
        nativeQuery = true
    )
    boolean existsOverlappingLand(@Param("wkt") String wkt);
}
