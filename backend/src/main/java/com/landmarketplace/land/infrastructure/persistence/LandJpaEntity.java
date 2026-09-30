package com.landmarketplace.land.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lands", schema = "app")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LandJpaEntity {
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "contact", nullable = false, columnDefinition = "TEXT")
    private String contact;

    @Column(name = "geometry", nullable = false, columnDefinition = "geometry(POLYGON, 4326)")
    private Polygon geometry;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
     
    protected LandJpaEntity(
        UUID id,
        BigDecimal price,
        String description,
        String contact,
        Polygon geometry,
        Instant createdAt,
        Instant updatedAt
    ) {
        this.id = id;
        this.price = price;
        this.description = description;
        this.contact = contact;
        this.geometry = geometry;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
