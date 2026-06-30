package com.helena.zele.injector.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object TimeUtils {

    private val isoFormats = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd'T'HH:mm:ssXXX"
    )

    fun parseIsoDate(value: String?): Date? {
        if (value.isNullOrBlank()) return null
        for (pattern in isoFormats) {
            try {
                val sdf = SimpleDateFormat(pattern, Locale.US)
                sdf.timeZone = TimeZone.getTimeZone("UTC")
                return sdf.parse(value)
            } catch (e: Exception) {
                // try next pattern
            }
        }
        return null
    }

    fun formatDate(value: String?): String {
        val date = parseIsoDate(value) ?: return "Never"
        val sdf = SimpleDateFormat("MMM dd, yyyy", Locale.US)
        return sdf.format(date)
    }

    /**
     * Returns a human readable remaining-time string for a license expiry timestamp.
     * Returns "Never" for permanent licenses (null expiry) and "Expired" for past dates.
     */
    fun getTimeRemaining(expiresAt: String?): String {
        if (expiresAt.isNullOrBlank()) return "Never (Permanent)"
        val expiry = parseIsoDate(expiresAt) ?: return "Unknown"
        val diffMs = expiry.time - System.currentTimeMillis()
        if (diffMs <= 0) return "Expired"

        val days = diffMs / (1000 * 60 * 60 * 24)
        val hours = (diffMs / (1000 * 60 * 60)) % 24
        val minutes = (diffMs / (1000 * 60)) % 60

        return when {
            days > 0 -> "${days}d ${hours}h remaining"
            hours > 0 -> "${hours}h ${minutes}m remaining"
            else -> "${minutes}m remaining"
        }
    }

    fun isExpired(expiresAt: String?): Boolean {
        if (expiresAt.isNullOrBlank()) return false
        val expiry = parseIsoDate(expiresAt) ?: return false
        return expiry.time < System.currentTimeMillis()
    }
}
