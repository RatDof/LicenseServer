# Add project specific ProGuard rules here.
-keepattributes Signature
-keepattributes *Annotation*

# Retrofit / Gson
-keep class com.helena.zele.injector.data.api.** { *; }
-keep class com.helena.zele.injector.data.repository.** { *; }
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.google.gson.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
