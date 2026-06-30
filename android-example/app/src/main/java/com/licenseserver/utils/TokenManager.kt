package com.licenseserver.utils

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "license_server_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_EMAIL = "email"
        private const val KEY_ROLE = "role"
        private const val KEY_BALANCE = "balance"
    }

    fun saveTokens(accessToken: String, refreshToken: String) {
        sharedPreferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
    }

    fun getAccessToken(): String? = sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    fun getRefreshToken(): String? = sharedPreferences.getString(KEY_REFRESH_TOKEN, null)

    fun saveUserInfo(id: String, username: String, email: String, role: String, balance: Double) {
        sharedPreferences.edit()
            .putString(KEY_USER_ID, id)
            .putString(KEY_USERNAME, username)
            .putString(KEY_EMAIL, email)
            .putString(KEY_ROLE, role)
            .putFloat(KEY_BALANCE, balance.toFloat())
            .apply()
    }

    fun getUserId(): String? = sharedPreferences.getString(KEY_USER_ID, null)
    fun getUsername(): String? = sharedPreferences.getString(KEY_USERNAME, null)
    fun getEmail(): String? = sharedPreferences.getString(KEY_EMAIL, null)
    fun getRole(): String? = sharedPreferences.getString(KEY_ROLE, null)
    fun getBalance(): Double = sharedPreferences.getFloat(KEY_BALANCE, 0f).toDouble()

    fun isLoggedIn(): Boolean = getAccessToken() != null

    fun clearAll() {
        sharedPreferences.edit().clear().apply()
    }
}
