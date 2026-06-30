package com.licenseserver.data.repository

import com.licenseserver.data.api.LicenseServerApi
import com.licenseserver.data.models.*
import com.licenseserver.utils.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val code: Int = 0) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: LicenseServerApi,
    private val tokenManager: TokenManager
) {
    suspend fun login(identifier: String, password: String): Result<LoginData> =
        withContext(Dispatchers.IO) {
            try {
                val request = if (identifier.contains("@"))
                    LoginRequest(email = identifier, password = password)
                else
                    LoginRequest(username = identifier, password = password)

                val response = api.login(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!.data!!
                    tokenManager.saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
                    tokenManager.saveUserInfo(
                        data.user.id, data.user.username,
                        data.user.email, data.user.role, data.user.balance
                    )
                    Result.Success(data)
                } else {
                    Result.Error(response.body()?.message ?: "Login failed", response.code())
                }
            } catch (e: Exception) {
                Result.Error(e.message ?: "Network error")
            }
        }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = tokenManager.getRefreshToken() ?: return@withContext Result.Error("No token")
            api.logout(LogoutRequest(refreshToken))
            tokenManager.clearAll()
            Result.Success(Unit)
        } catch (e: Exception) {
            tokenManager.clearAll()
            Result.Success(Unit)
        }
    }

    suspend fun refreshToken(): Result<TokenData> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = tokenManager.getRefreshToken()
                ?: return@withContext Result.Error("No refresh token")

            val response = api.refresh(RefreshRequest(refreshToken))
            if (response.isSuccessful && response.body()?.success == true) {
                val tokens = response.body()!!.data!!
                tokenManager.saveTokens(tokens.accessToken, tokens.refreshToken)
                Result.Success(tokens)
            } else {
                tokenManager.clearAll()
                Result.Error("Token refresh failed")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }

    suspend fun getProfile(): Result<UserProfile> = withContext(Dispatchers.IO) {
        try {
            val response = api.getProfile()
            if (response.isSuccessful && response.body()?.success == true) {
                val user = response.body()!!.data!!
                tokenManager.saveUserInfo(user.id, user.username, user.email, user.role, user.balance)
                Result.Success(user)
            } else {
                Result.Error(response.body()?.error ?: "Failed to get profile")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }

    suspend fun getMyLicenses(): Result<List<License>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMyLicenses()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data ?: emptyList())
            } else {
                Result.Error(response.body()?.error ?: "Failed to get licenses")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }

    fun isLoggedIn() = tokenManager.isLoggedIn()
    fun getCachedUsername() = tokenManager.getUsername()
    fun getCachedEmail() = tokenManager.getEmail()
    fun getCachedRole() = tokenManager.getRole()
    fun getCachedBalance() = tokenManager.getBalance()
}
