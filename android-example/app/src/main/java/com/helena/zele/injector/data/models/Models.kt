package com.helena.zele.injector.data.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val username: String,
    val email: String,
    val role: String,
    val balance: Double,
    val isActive: Boolean,
    val avatar: String? = null,
    val lastLoginAt: String? = null,
    val createdAt: String? = null
)

data class TokenPair(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Int
)

data class LoginRequest(
    val email: String? = null,
    val username: String? = null,
    val password: String
)

data class LoginData(
    val user: User,
    val tokens: TokenPair
)

data class RefreshRequest(
    val refreshToken: String
)

data class LogoutRequest(
    val refreshToken: String
)

data class License(
    val id: String,
    val key: String,
    val status: String,
    val type: String,
    val expiresAt: String? = null,
    val maxDevices: Int,
    val createdAt: String,
    val product: ProductSummary,
    val note: String? = null
)

data class ProductSummary(
    val id: String? = null,
    val name: String,
    val version: String? = null
)

data class ValidateLicenseRequest(
    val key: String,
    val deviceId: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val error: String? = null
)
