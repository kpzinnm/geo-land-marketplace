package com.landmarketplace.land.api;

import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import com.landmarketplace.land.application.LandNotFoundException;
import com.landmarketplace.land.application.LandOverlapException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class LandExceptionHandler {

    @ExceptionHandler(LandNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("code", "LAND_NOT_FOUND", "message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleInvalidPath(RuntimeException exception) {
        return ResponseEntity.badRequest().body(Map.of("code", "INVALID_PARAMETER", "message", "Invalid path parameter"));
    }

    @ExceptionHandler(LandOverlapException.class)
    public ResponseEntity<Map<String, String>> handleOverlap(
        LandOverlapException exception
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            Map.of(
                "code", "LAND_OVERLAP",
                "message", exception.getMessage()
            )
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidArgument(
        IllegalArgumentException exception
    ) {
        return ResponseEntity.badRequest().body(
            Map.of(
                "code", "INVALID_ARGUMENT",
                "message", exception.getMessage()
            )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
        MethodArgumentNotValidException exception
    ) {
        return ResponseEntity.badRequest().body(
            Map.of(
                "code", "VALIDATION_ERROR",
                "message", "Invalid request data"
            )
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMalformedRequest(
        HttpMessageNotReadableException exception
    ) {
        return ResponseEntity.badRequest().body(
            Map.of(
                "code", "MALFORMED_REQUEST",
                "message", "Invalid JSON request body"
            )
        );
    }
}
