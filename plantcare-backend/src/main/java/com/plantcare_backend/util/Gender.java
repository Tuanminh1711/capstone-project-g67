package com.plantcare_backend.util;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Create by TaHoang
 */

public enum Gender {
    @JsonProperty("male")
    MALE,
    @JsonProperty("female")
    FEMALE,
    @JsonProperty("other")
    OTHER;
}
