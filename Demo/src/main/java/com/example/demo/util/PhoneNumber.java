package com.example.demo.util;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PhoneValidator.class)
@Target( { ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface PhoneNumber {
        String message() default "Invalid phone number// loi";
        Class<?>[] groups() default {};
        Class<? extends Payload>[] payload() default {};
}