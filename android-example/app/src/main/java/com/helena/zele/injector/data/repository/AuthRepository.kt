package com.helena.zele.injector.data.repository

import com.helena.zele.injector.data.api.ApiService
import com.helena.zele.injector.data.local.TokenManager
import com.helena.zele.injector.data.models.License
import com.helena.zele.injector.data.models.LoginRequest
import com.helena.zele.injector.data.models.LogoutRequest
import com.helena.zele.injector.data.models.User
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    val accessTokenFlow: Flow<String?> = tokenManager.accessTokenFlow

    suspend fun login(identifier: String, password: String): Result<User> {
        return try {
            val isEmail = identifier.contains("@")
            val request = if (isEmail) {
                LoginRequest(email = identifier, password = password)
            } else {
                LoginRequest(username = identifier, password = password)
            }

            val response = apiService.login(request)
            if (response.isSuccessful && response.body()?.success == true) {
                val loginData = response.body()!!.data!!
                tokenManager.saveTokens(loginData.tokens.accessToken, loginData.tokens.refreshToken)
                tokenManager.saveUsername(loginData.user.username)
                Result.Success(loginData.user)
            } else {
                Result.Error(response.body()?.error ?: "Login failed. Check your credentials.")
            }
        } catch (e: Exception) {
            Result.Error(e.localizedMessage ?: "Network error occurred")
        }
    }

    suspend fun logout() {
        try {
            val refreshToken = tokenManager.getRefreshToken()
            if (refreshToken != null) {
                apiService.logout(LogoutRequest(refreshToken))
            }
        } catch (e: Exception) {
            // Best effort — clear local tokens regardless
        } finally {
            tokenManager.clearTokens()
        }
    }

    suspend fun getProfile(): Result<User> {
        return try {
            val response = apiService.getProfile()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.error ?: "Failed to load profile")
            }
        } catch (e: Exception) {
            Result.Error(e.localizedMessage ?: "Network error occurred")
        }
    }

    suspend fun getMyLicenses(): Result<List<License>> {
        return try {
            val response = apiService.getMyLicenses()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data ?: emptyList())
            } else {
                Result.Error(response.body()?.error ?: "Failed to load licenses")
            }
        } catch (e: Exception) {
            Result.Error(e.localizedMessage ?: "Network error occurred")
        }
    }

    suspend fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()
}
