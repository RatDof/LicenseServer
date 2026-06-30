package com.licenseserver.data.models

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String? = null,
    val username: String? = null,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val data: LoginData?
)

data class LoginData(
    val user: UserProfile,
    val tokens: TokenData
)

data class TokenData(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("refreshToken") val refreshToken: String,
    @SerializedName("expiresIn") val expiresIn: Long
)

data class RefreshRequest(val refreshToken: String)

data class RefreshResponse(
    val success: Boolean,
    val data: TokenData?
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?,
    val error: String?
)

data class UserProfile(
    val id: String,
    val username: String,
    val email: String,
    val role: String,
    val balance: Double,
    val isActive: Boolean,
    val avatar: String?,
    val lastLoginAt: String?,
    val createdAt: String,
    val updatedAt: String?
)

data class License(
    val id: String,
    val key: String,
    val status: String,
    val type: String,
    val expiresAt: String?,
    val maxDevices: Int,
    val note: String?,
    val createdAt: String,
    val product: ProductInfo?,
    val user: UserInfo?
)

data class ProductInfo(
    val id: String,
    val name: String,
    val version: String?
)

data class UserInfo(
    val id: String,
    val username: String,
    val email: String
)

data class PaginatedResponse<T>(
    val data: List<T>,
    val pagination: Pagination
)

data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean
)

data class LogoutRequest(val refreshToken: String)
