package com.helena.zele.injector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.helena.zele.injector.ui.screens.login.LoginScreen
import com.helena.zele.injector.ui.screens.profile.ProfileScreen
import com.helena.zele.injector.ui.theme.BgPrimary
import com.helena.zele.injector.ui.theme.LicenseServerTheme
import com.helena.zele.injector.viewmodel.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint

object Routes {
    const val LOGIN = "login"
    const val PROFILE = "profile"
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LicenseServerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BgPrimary
                ) {
                    val navController = rememberNavController()
                    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()

                    NavHost(
                        navController = navController,
                        startDestination = if (isLoggedIn) Routes.PROFILE else Routes.LOGIN
                    ) {
                        composable(Routes.LOGIN) {
                            LoginScreen(
                                onLoginSuccess = {
                                    navController.navigate(Routes.PROFILE) {
                                        popUpTo(Routes.LOGIN) { inclusive = true }
                                    }
                                },
                                viewModel = authViewModel
                            )
                        }
                        composable(Routes.PROFILE) {
                            ProfileScreen(
                                onLoggedOut = {
                                    navController.navigate(Routes.LOGIN) {
                                        popUpTo(Routes.PROFILE) { inclusive = true }
                                    }
                                },
                                viewModel = authViewModel
                            )
                        }
                    }
                }
            }
        }
    }
}
