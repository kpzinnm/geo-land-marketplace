package com.landmarketplace.land.application;

public class LandOverlapException extends RuntimeException {

    public LandOverlapException() {
        super("The land overlaps an existing land");
    }
}
