package com.helena.zele.injector.data.api

import com.helena.zele.injector.data.local.TokenManager
import com.helena.zele.injector.data.models.RefreshRequest
import com.google.gson.Gson
import com.helena.zele.injector.data.models.ApiResponse
import com.helena.zele.injector.data.models.TokenPair
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Provider

/**
 * Automatically refreshes the access token when a request fails with 401,
 * then retries the original request once with the new token.
 */
class TokenAuthenticator @Inject constructor(
    private val tokenManager: TokenManager,
    private val baseUrl: String
) : Authenticator {

    private val gson = Gson()

    override fun authenticate(route: Route?, response: okhttp3.Response): Request? {
        // Avoid infinite retry loop
        if (responseCount(response) >= 2) return null

        val refreshToken = runBlocking { tokenManager.getRefreshToken() } ?: return null

        return runBlocking {
            try {
                val client = OkHttpClient.Builder().build()
                val body = gson.toJson(RefreshRequest(refreshToken))
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url("${baseUrl}auth/refresh")
                    .post(body)
                    .build()

                val refreshResponse = client.newCall(request).execute()
                val responseBody = refreshResponse.body?.string()

                if (refreshResponse.isSuccessful && responseBody != null) {
                    val parsed = gson.fromJson(
                        responseBody,
                        ApiResponse::class.java
                    )
                    if (parsed.success && parsed.data != null) {
                        val map = parsed.data as Map<*, *>
                        val newAccessToken = map["accessToken"] as String
                        val newRefreshToken = map["refreshToken"] as String
                        tokenManager.saveTokens(newAccessToken, newRefreshToken)

                        response.request.newBuilder()
                            .header("Authorization", "Bearer $newAccessToken")
                            .build()
                    } else {
                        tokenManager.clearTokens()
                        null
                    }
                } else {
                    tokenManager.clearTokens()
                    null
                }
            } catch (e: Exception) {
                null
            }
        }
    }

    private fun responseCount(response: okhttp3.Response): Int {
        var result = 1
        var prior = response.priorResponse
        while (prior != null) {
            result++
            prior = prior.priorResponse
        }
        return result
    }
}
