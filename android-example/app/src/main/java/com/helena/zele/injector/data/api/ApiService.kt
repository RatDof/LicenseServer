package com.helena.zele.injector.data.api

import com.helena.zele.injector.data.models.ApiResponse
import com.helena.zele.injector.data.models.License
import com.helena.zele.injector.data.models.LoginData
import com.helena.zele.injector.data.models.LoginRequest
import com.helena.zele.injector.data.models.LogoutRequest
import com.helena.zele.injector.data.models.RefreshRequest
import com.helena.zele.injector.data.models.TokenPair
import com.helena.zele.injector.data.models.User
import com.helena.zele.injector.data.models.ValidateLicenseRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginData>>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): Response<ApiResponse<Unit>>

    @POST("auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): Response<ApiResponse<TokenPair>>

    @GET("auth/profile")
    suspend fun getProfile(): Response<ApiResponse<User>>

    @GET("licenses/my")
    suspend fun getMyLicenses(): Response<ApiResponse<List<License>>>

    @POST("licenses/validate")
    suspend fun validateLicense(@Body request: ValidateLicenseRequest): Response<ApiResponse<Map<String, Any>>>
}
