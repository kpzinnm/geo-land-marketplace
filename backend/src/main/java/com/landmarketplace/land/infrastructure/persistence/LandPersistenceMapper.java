package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.land.domain.Land;
import org.springframework.stereotype.Component;

@Component
public class LandPersistenceMapper {

    public LandJpaEntity toEntity(Land land) {
        return new LandJpaEntity(
            land.getId(),
            land.getPrice(),
            land.getDescription(),
            land.getContact(),
            land.getGeometry(),
            land.getCreatedAt(),
            land.getUpdatedAt()
        );
    }

    public Land toDomain(LandJpaEntity entity) {
        return Land.restore(
            entity.getId(),
            entity.getPrice(),
            entity.getDescription(),
            entity.getContact(),
            entity.getGeometry(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
