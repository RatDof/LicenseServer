# LicenseServer — Android Example App

A complete Kotlin + Jetpack Compose Android client demonstrating integration with the LicenseServer backend: login, secure JWT storage, automatic token refresh, profile display, and license expiry/remaining-time tracking.

## Stack

- Kotlin, Jetpack Compose (Material 3)
- MVVM architecture (`ViewModel` + `StateFlow`)
- Hilt for dependency injection
- Retrofit + OkHttp + Gson for networking
- Coroutines for async work
- Jetpack DataStore (Preferences) for secure token persistence
- Navigation Compose

## Project Structure

```
app/src/main/java/com/helena/zele/injector/
├── LicenseServerApp.kt          # Hilt Application class
├── MainActivity.kt              # Navigation host (Login ↔ Profile)
├── data/
│   ├── api/                     # Retrofit interface + interceptors
│   ├── local/                   # TokenManager (DataStore secure storage)
│   ├── models/                  # Data classes (User, License, etc.)
│   └── repository/              # AuthRepository (single source of truth)
├── di/                          # Hilt modules (NetworkModule)
├── ui/
│   ├── components/               # Reusable glassmorphism UI (GlassCard)
│   ├── screens/login/            # LoginScreen
│   ├── screens/profile/          # ProfileScreen (licenses, expiry, logout)
│   └── theme/                    # Color, Typography, Theme (AMOLED dark)
├── utils/                        # TimeUtils (expiry/remaining-time formatting)
└── viewmodel/                    # AuthViewModel (StateFlow-driven UI state)
```

## How It Works

1. **Login** — `LoginScreen` collects email/username + password, calls `AuthViewModel.login()`, which delegates to `AuthRepository.login()`. On success, the access + refresh tokens are persisted via `TokenManager` (Jetpack DataStore).
2. **Authenticated requests** — `AuthInterceptor` automatically attaches `Authorization: Bearer <token>` to every outgoing request (except `/auth/login` and `/auth/refresh`).
3. **Token refresh** — `TokenAuthenticator` (an OkHttp `Authenticator`) intercepts any `401 Unauthorized` response, calls `/auth/refresh` with the stored refresh token, persists the new token pair, and transparently retries the original request — completely invisible to the rest of the app.
4. **Profile + Licenses** — `ProfileScreen` calls `GET /auth/profile` and `GET /licenses/my`, displaying the user's balance, role, and every license assigned to them with live-formatted expiry dates and remaining time (`TimeUtils.getTimeRemaining`).
5. **Logout** — Clears local tokens and notifies the backend via `POST /auth/logout` (best-effort).

## Configuration

The backend base URL is defined in `app/build.gradle.kts` via `buildConfigField`:

```kotlin
// Debug (emulator talking to host machine)
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:4000/api/v1/\"")

// Release
buildConfigField("String", "API_BASE_URL", "\"https://your-domain.com/api/v1/\"")
```

`10.0.2.2` is the special alias the Android Emulator uses to reach `localhost` on your host machine. If you're running on a **physical device**, replace it with your computer's LAN IP (e.g. `http://192.168.1.50:4000/api/v1/`) and make sure your phone is on the same network.

## Building

### Option A — Android Studio (recommended)

1. Open Android Studio → **Open** → select the `android-example/` folder.
2. Let Gradle sync (Android Studio auto-downloads the Gradle wrapper jar on first sync).
3. Click **Run ▶** with an emulator or physical device connected.

### Option B — Command line

```bash
cd android-example
gradle wrapper --gradle-version 8.4   # generates gradlew + gradlew.bat (run once)
./gradlew assembleDebug               # macOS/Linux
gradlew.bat assembleDebug             # Windows
```

The debug APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## Default Test Credentials

Use the same seeded accounts as the web admin panel:

| Identifier | Password |
|---|---|
| `admin@licenseserver.com` | `Admin@123456` |
| `user1@licenseserver.com` | `User1@123` |
