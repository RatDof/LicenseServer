package com.helena.zele.injector.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.helena.zele.injector.data.models.License
import com.helena.zele.injector.ui.components.GlassCard
import com.helena.zele.injector.ui.theme.*
import com.helena.zele.injector.utils.TimeUtils
import com.helena.zele.injector.viewmodel.AuthViewModel

@Composable
fun ProfileScreen(
    onLoggedOut: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val state by viewModel.profileState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
    ) {
        if (state.isLoading && state.user == null) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = BrandIndigo
            )
        } else if (state.error != null && state.user == null) {
            Column(
                modifier = Modifier.align(Alignment.Center).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(state.error ?: "Something went wrong", color = AccentRed, fontSize = 13.sp)
                Spacer(Modifier.height(12.dp))
                Button(onClick = { viewModel.loadProfile() }) { Text("Retry") }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    ProfileHeader(
                        username = state.user?.username ?: "—",
                        email = state.user?.email ?: "—",
                        role = state.user?.role ?: "USER",
                        balance = state.user?.balance ?: 0.0,
                        onLogout = {
                            viewModel.logout()
                            onLoggedOut()
                        }
                    )
                }

                item {
                    Text("My Licenses", style = MaterialTheme.typography.titleLarge)
                }

                if (state.licenses.isEmpty()) {
                    item {
                        GlassCard(modifier = Modifier.fillMaxWidth()) {
                            Text("No licenses assigned to your account yet.", color = TextTertiary, fontSize = 13.sp)
                        }
                    }
                } else {
                    items(state.licenses) { license ->
                        LicenseCard(license)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileHeader(
    username: String,
    email: String,
    role: String,
    balance: Double,
    onLogout: () -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(BrandIndigo, BrandPurple))),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    username.firstOrNull()?.uppercase() ?: "?",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(12.dp))
            Text(username, style = MaterialTheme.typography.titleLarge)
            Text(email, color = TextTertiary, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(BrandIndigo.copy(alpha = 0.15f))
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Filled.Shield, contentDescription = null, tint = BrandIndigo, modifier = Modifier.size(12.dp))
                Spacer(Modifier.width(4.dp))
                Text(role, color = BrandIndigo, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(Modifier.height(16.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Account Balance", color = TextTertiary, fontSize = 11.sp)
                    Spacer(Modifier.height(2.dp))
                    Text(
                        "$${"%.2f".format(balance)}",
                        color = AccentGreen,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            OutlinedButton(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentRed)
            ) {
                Icon(Icons.Filled.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Sign Out")
            }
        }
    }
}

@Composable
private fun LicenseCard(license: License) {
    val expired = TimeUtils.isExpired(license.expiresAt)
    val statusColor = when {
        license.status == "SUSPENDED" -> AccentYellow
        license.status == "EXPIRED" || expired -> AccentRed
        license.status == "ACTIVE" -> AccentGreen
        else -> TextTertiary
    }

    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Key, contentDescription = null, tint = BrandIndigo, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(license.product.name, style = MaterialTheme.typography.titleMedium)
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(statusColor.copy(alpha = 0.15f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(license.status, color = statusColor, fontSize = 10.sp, fontWeight = FontWeight.Medium)
                }
            }

            Spacer(Modifier.height(10.dp))
            Text(
                license.key,
                color = BrandIndigo,
                fontSize = 12.sp,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(BrandIndigo.copy(alpha = 0.08f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(TimeUtils.formatDate(license.expiresAt), color = TextTertiary, fontSize = 11.sp)
                }
                Text(
                    TimeUtils.getTimeRemaining(license.expiresAt),
                    color = if (expired) AccentRed else AccentCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
