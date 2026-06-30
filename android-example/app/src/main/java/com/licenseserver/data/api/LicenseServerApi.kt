package com.licenseserver.data.api

import com.licenseserver.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface LicenseServerApi {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): Response<ApiResponse<Unit>>

    @POST("auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): Response<RefreshResponse>

    @GET("auth/profile")
    suspend fun getProfile(): Response<ApiResponse<UserProfile>>

    @GET("licenses/my")
    suspend fun getMyLicenses(): Response<ApiResponse<List<License>>>

    @GET("licenses")
    suspend fun getAllLicenses(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("status") status: String? = null
    ): Response<ApiResponse<PaginatedResponse<License>>>
}
