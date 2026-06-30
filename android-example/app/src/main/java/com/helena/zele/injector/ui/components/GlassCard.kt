package com.helena.zele.injector.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.helena.zele.injector.ui.theme.GlassBorder

/**
 * A glassmorphism-styled card container with rounded 24dp corners,
 * subtle translucent gradient background, and a soft border —
 * mirroring the web admin panel's "liquid glass" aesthetic.
 */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Int = 24,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius.dp))
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.07f),
                        Color.White.copy(alpha = 0.02f)
                    )
                )
            )
            .border(
                width = 1.dp,
                color = GlassBorder,
                shape = RoundedCornerShape(cornerRadius.dp)
            )
            .padding(20.dp)
    ) {
        content()
    }
}
