package com.landmarketplace.land.infrastructure.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SpringDataLandRepository extends JpaRepository<LandJpaEntity, UUID> {

    @Query(
        value = """
            SELECT EXISTS (
                SELECT 1
                FROM app.lands existing
                WHERE public.ST_Intersects(
                    existing.geometry,
                    public.ST_GeomFromText(:wkt, 4326)
                )
                AND NOT public.ST_Touches(
                    existing.geometry,
                    public.ST_GeomFromText(:wkt, 4326)
                )
            )
            """,
        nativeQuery = true
    )
    boolean existsOverlappingLand(@Param("wkt") String wkt);
    @Query(value = """
        SELECT * FROM app.lands
        WHERE public.ST_DWithin(
            geometry::public.geography,
            public.ST_SetSRID(public.ST_MakePoint(:longitude, :latitude), 4326)::public.geography,
            :radiusMeters
        )
        ORDER BY created_at, id
        """, nativeQuery = true)
    List<LandJpaEntity> search(@Param("longitude") double longitude,
        @Param("latitude") double latitude, @Param("radiusMeters") double radiusMeters);
}
