package com.landmarketplace.land.api;

import java.util.UUID;
import java.util.List;
import com.landmarketplace.land.api.dto.SearchLandsRequest;
import com.landmarketplace.land.application.FindLandUseCase;
import com.landmarketplace.land.application.SearchLandsUseCase;
import com.landmarketplace.land.api.dto.CreateLandRequest;
import com.landmarketplace.land.api.dto.LandResponse;
import com.landmarketplace.land.application.CreateLandUseCase;
import com.landmarketplace.land.domain.Land;

import jakarta.validation.Valid;

import org.locationtech.jts.geom.Polygon;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;


@RestController
@RequestMapping("/api/v1/lands")
public class LandController {

    private final CreateLandUseCase createLandUseCase;
    private final LandApiMapper landApiMapper;
    private final SearchLandsUseCase searchLandsUseCase;
    private final FindLandUseCase findLandUseCase;

    public LandController(CreateLandUseCase createLandUseCase, LandApiMapper landApiMapper,
        SearchLandsUseCase searchLandsUseCase,
        FindLandUseCase findLandUseCase) {
        this.createLandUseCase = createLandUseCase;
        this.landApiMapper = landApiMapper;
        this.searchLandsUseCase = searchLandsUseCase;
        this.findLandUseCase = findLandUseCase;
    }

    @PostMapping("/search")
    public List<LandResponse> search(
        @Valid @RequestBody SearchLandsRequest request
    ) {
        return searchLandsUseCase.execute(request.longitude(), request.latitude(), request.radiusMeters())
            .stream().map(landApiMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public LandResponse find(@PathVariable UUID id) {
        return landApiMapper.toResponse(findLandUseCase.execute(id));
    }

    @PostMapping
    public ResponseEntity<LandResponse> create(
        @Valid @RequestBody CreateLandRequest createLandRequest
    ) {
        Polygon geometry = landApiMapper.toPolygon(createLandRequest.geometry());

        Land land = createLandUseCase.execute(
            createLandRequest.price(),
            createLandRequest.description(),
            createLandRequest.contact(),
            geometry
        );

        LandResponse response = landApiMapper.toResponse(land);

        URI location = URI.create(
            "/api/v1/lands/" + land.getId()
        );

        return ResponseEntity.created(location).body(response);
    }
}
