package com.example.domain.engine

import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

data class TimeDiffResult(
    val diffPrice: Double,
    val diffMinutes: Long,
    val percentage: Double,
    val isMore: Boolean,
    val adaptiveDuration: String,
    val percentageFormatted: String,
    val summaryText: String,
    val narrativePhrase: String
)

object TimeScaleFormatter {

    private val ptBrLocale = Locale("pt", "BR")

    fun formatCurrency(value: Double): String {
        val formatter = NumberFormat.getCurrencyInstance(ptBrLocale)
        return formatter.format(value)
    }

    /**
     * Formata minutos de trabalho adaptando a escala temporal dinamicamente:
     * - Horas e minutos (quando < 1 dia de trabalho)
     * - Dias úteis e horas (quando entre 1 dia e 1 semana)
     * - Semanas e dias úteis (quando entre 1 semana e 1 mês)
     * - Meses e semanas/dias (quando >= 1 mês de trabalho)
     */
    fun formatWorkTimeAdaptive(
        minutes: Long,
        hoursPerDay: Double = 8.0,
        daysPerWeek: Double = 5.0
    ): String {
        val safeHoursPerDay = hoursPerDay.coerceAtLeast(1.0)
        val safeDaysPerWeek = daysPerWeek.coerceAtLeast(1.0)
        val hoursPerWeek = safeHoursPerDay * safeDaysPerWeek
        val hoursPerMonth = hoursPerWeek * (52.0 / 12.0)

        val absMinutes = abs(minutes)
        val totalHours = absMinutes / 60.0
        val remainingMinutes = (absMinutes % 60).toInt()

        return when {
            // Menos de 1 dia útil de trabalho: exibe horas e minutos
            totalHours < safeHoursPerDay -> {
                val h = totalHours.toInt()
                if (h > 0 && remainingMinutes > 0) "${h}h ${remainingMinutes}min"
                else if (h > 0) "${h}h"
                else "${remainingMinutes}min"
            }
            // Entre 1 dia e 1 semana: exibe dias úteis e horas restantes
            totalHours < hoursPerWeek -> {
                val days = (totalHours / safeHoursPerDay).toInt()
                val remHours = (totalHours % safeHoursPerDay).roundToInt()
                val dayStr = if (days == 1) "1 dia" else "$days dias"
                if (remHours > 0) {
                    "$dayStr e ${remHours}h"
                } else {
                    dayStr
                }
            }
            // Entre 1 semana e 1 mês: exibe semanas e dias úteis restantes
            totalHours < hoursPerMonth -> {
                val weeks = (totalHours / hoursPerWeek).toInt()
                val remHours = totalHours % hoursPerWeek
                val remDays = (remHours / safeHoursPerDay).roundToInt()
                val weekStr = if (weeks == 1) "1 semana" else "$weeks semanas"
                if (remDays > 0) {
                    val dayStr = if (remDays == 1) "1 dia" else "$remDays dias"
                    "$weekStr e $dayStr"
                } else {
                    weekStr
                }
            }
            // 1 mês ou mais de trabalho: exibe meses e semanas restantes
            else -> {
                val months = (totalHours / hoursPerMonth).toInt()
                val remHours = totalHours % hoursPerMonth
                val remWeeks = (remHours / hoursPerWeek).roundToInt()
                val monthStr = if (months == 1) "1 mês" else "$months meses"
                if (remWeeks > 0) {
                    val weekStr = if (remWeeks == 1) "1 semana" else "$remWeeks semanas"
                    "$monthStr e $weekStr"
                } else {
                    monthStr
                }
            }
        }
    }

    /**
     * Calcula a diferença entre dois produtos e retorna o valor em %, o tempo
     * adaptativo em horas/dias/semanas/meses e as frases narrativas.
     */
    fun calculateDiff(
        basePrice: Double,
        baseMinutes: Long,
        targetPrice: Double,
        targetMinutes: Long,
        baseName: String = "Opção Base",
        targetName: String = "Opção Escolhida",
        hoursPerDay: Double = 8.0,
        daysPerWeek: Double = 5.0
    ): TimeDiffResult {
        val diffPrice = targetPrice - basePrice
        val diffMinutes = targetMinutes - baseMinutes
        val isMore = diffMinutes >= 0

        val absMinutes = abs(diffMinutes)
        val adaptiveDuration = formatWorkTimeAdaptive(absMinutes, hoursPerDay, daysPerWeek)

        val percentage = if (basePrice > 0) {
            ((diffPrice / basePrice) * 100.0)
        } else {
            0.0
        }

        val roundedPercent = (abs(percentage) * 10).roundToInt() / 10.0
        val percentSign = if (isMore) "+" else "-"
        val percentageFormatted = "$percentSign$roundedPercent%"

        val summaryText = if (isMore) {
            "+$adaptiveDuration a mais ($percentageFormatted)"
        } else {
            "-$adaptiveDuration a menos ($percentageFormatted)"
        }

        val narrativePhrase = if (isMore) {
            "Se escolher $targetName em vez de $baseName, você terá que trabalhar $adaptiveDuration a mais ($percentageFormatted) da sua vida."
        } else {
            "Se escolher $targetName em vez de $baseName, você economiza $adaptiveDuration de trabalho ($percentageFormatted) da sua vida."
        }

        return TimeDiffResult(
            diffPrice = diffPrice,
            diffMinutes = diffMinutes,
            percentage = percentage,
            isMore = isMore,
            adaptiveDuration = adaptiveDuration,
            percentageFormatted = percentageFormatted,
            summaryText = summaryText,
            narrativePhrase = narrativePhrase
        )
    }
}
