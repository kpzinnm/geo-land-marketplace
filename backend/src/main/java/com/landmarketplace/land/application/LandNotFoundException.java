package com.landmarketplace.land.application;

public class LandNotFoundException extends RuntimeException {
    public LandNotFoundException() {
        super("Land not found");
    }
}
