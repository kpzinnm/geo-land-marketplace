package com.landmarketplace.land.application;

import com.landmarketplace.land.domain.LandRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SearchLandsUseCaseTest {
    private final LandRepository repository = mock(LandRepository.class);
    private final SearchLandsUseCase useCase = new SearchLandsUseCase(repository);

    @Test
    void shouldDelegateValidMetricSearch() {
        var expected = java.util.List.of(com.landmarketplace.support.LandFixtures.land("POLYGON((0 0,1 0,1 1,0 1,0 0))"));
        when(repository.search(-35.9, -7.22, 5000)).thenReturn(expected);
        assertSame(expected, useCase.execute(-35.9, -7.22, 5000));
        useCase.execute(180, 90, 100000);
        useCase.execute(-180, -90, 1);
    }

    @ParameterizedTest
    @CsvSource({"181,0,1", "-181,0,1", "0,91,1", "0,-91,1", "0,0,0", "0,0,-1",
        "0,0,100001", "NaN,0,1", "0,NaN,1", "0,0,NaN", "Infinity,0,1", "0,0,Infinity"})
    void shouldRejectInvalidSearchBeforeQuery(double longitude, double latitude, double radius) {
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(longitude, latitude, radius));
        verifyNoInteractions(repository);
    }
}
