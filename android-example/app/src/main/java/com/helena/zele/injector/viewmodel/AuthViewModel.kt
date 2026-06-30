package com.helena.zele.injector.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.helena.zele.injector.data.models.License
import com.helena.zele.injector.data.models.User
import com.helena.zele.injector.data.repository.AuthRepository
import com.helena.zele.injector.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val user: User) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

data class ProfileUiState(
    val user: User? = null,
    val licenses: List<License> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _loginState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val loginState: StateFlow<AuthUiState> = _loginState.asStateFlow()

    private val _profileState = MutableStateFlow(ProfileUiState())
    val profileState: StateFlow<ProfileUiState> = _profileState.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        checkLoginStatus()
    }

    private fun checkLoginStatus() {
        viewModelScope.launch {
            _isLoggedIn.value = authRepository.isLoggedIn()
        }
    }

    fun login(identifier: String, password: String) {
        viewModelScope.launch {
            _loginState.value = AuthUiState.Loading
            when (val result = authRepository.login(identifier, password)) {
                is Result.Success -> {
                    _loginState.value = AuthUiState.Success(result.data)
                    _isLoggedIn.value = true
                }
                is Result.Error -> {
                    _loginState.value = AuthUiState.Error(result.message)
                }
                Result.Loading -> Unit
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _isLoggedIn.value = false
            _loginState.value = AuthUiState.Idle
            _profileState.value = ProfileUiState()
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            _profileState.value = _profileState.value.copy(isLoading = true, error = null)

            val profileResult = authRepository.getProfile()
            val licensesResult = authRepository.getMyLicenses()

            val user = when (profileResult) {
                is Result.Success -> profileResult.data
                is Result.Error -> {
                    _profileState.value = _profileState.value.copy(isLoading = false, error = profileResult.message)
                    return@launch
                }
                Result.Loading -> null
            }

            val licenses = when (licensesResult) {
                is Result.Success -> licensesResult.data
                else -> emptyList()
            }

            _profileState.value = ProfileUiState(
                user = user,
                licenses = licenses,
                isLoading = false,
                error = null
            )
        }
    }

    fun resetLoginState() {
        _loginState.value = AuthUiState.Idle
    }
}
