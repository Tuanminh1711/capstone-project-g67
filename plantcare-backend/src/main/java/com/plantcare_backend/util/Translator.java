package com.plantcare_backend.util;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Create by TaHoang
 */

@Component
public class Translator {
    private static MessageSource messageSource;

    public Translator(MessageSource messageSource) {
        Translator.messageSource = messageSource;
    }

    public static String toLocale(String msgCode) {
        return messageSource.getMessage(msgCode, null, LocaleContextHolder.getLocale());
    }

    public static String toLocale(String msgCode, Object... args) {
        return messageSource.getMessage(msgCode, args, LocaleContextHolder.getLocale());
    }
}