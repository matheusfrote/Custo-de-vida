package com.example.domain.engine

import com.example.domain.model.CalculationResult
import com.example.domain.model.FinancialProfileData
import com.example.domain.model.GoalEffortCalculation
import com.example.domain.model.InstallmentResult
import com.example.domain.model.OpportunityCostResult
import com.example.domain.model.RecurringCostResult
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.pow
import kotlin.math.roundToLong

object FinancialEngine {

    fun calculate(
        price: Double,
        profile: FinancialProfileData,
        monthlyEssentialExpenses: Double = 0.0,
        installments: InstallmentResult? = null
    ): CalculationResult {
        val safeNetSalary = if (profile.netSalary > 0.0) profile.netSalary else 5000.0
        val safeGrossSalary = if (profile.grossSalary > 0.0) profile.grossSalary else safeNetSalary * 1.2
        val safeHoursPerMonth = if (profile.hoursPerMonth > 0.0) profile.hoursPerMonth else 176.0
        val safeHoursPerDay = if (profile.hoursPerDay > 0.0) profile.hoursPerDay else 8.0
        val safeDaysPerWeek = if (profile.daysPerWeek > 0.0) profile.daysPerWeek else 5.0

        val grossHourlyRate = safeGrossSalary / safeHoursPerMonth
        val netHourlyRate = safeNetSalary / safeHoursPerMonth

        val disposableIncome = (safeNetSalary - monthlyEssentialExpenses).coerceAtLeast(0.0)
        val disposableHourlyRate = if (disposableIncome > 0.0) {
            disposableIncome / safeHoursPerMonth
        } else {
            netHourlyRate
        }

        val totalHoursDecimal = if (netHourlyRate > 0.0) price / netHourlyRate else 0.0
        val totalWorkMinutes = (totalHoursDecimal * 60.0).roundToLong().coerceAtLeast(0L)
        val workHours = totalWorkMinutes / 60
        val workMinutesRemaining = totalWorkMinutes % 60

        val workDays = if (safeHoursPerDay > 0.0) totalHoursDecimal / safeHoursPerDay else 0.0
        val workWeeks = if (safeDaysPerWeek > 0.0) workDays / safeDaysPerWeek else 0.0

        val salaryPercentage = if (safeNetSalary > 0.0) (price / safeNetSalary) * 100.0 else 0.0
        val disposableIncomePercentage = if (disposableIncome > 0.0) (price / disposableIncome) * 100.0 else 0.0
        val monthsOfDisposableIncome = if (disposableIncome > 0.0) price / disposableIncome else 0.0

        val timeFormatted = formatWorkTime(workHours, workMinutesRemaining)
        val daysFormatted = formatWorkDays(workDays, safeHoursPerDay)

        val interpretationPhrases = generateInterpretationPhrases(
            workHours = workHours,
            workMinutes = workMinutesRemaining,
            workDays = workDays,
            salaryPercentage = salaryPercentage,
            disposableIncomePercentage = disposableIncomePercentage,
            monthsOfDisposableIncome = monthsOfDisposableIncome,
            price = price
        )

        return CalculationResult(
            price = price,
            grossHourlyRate = grossHourlyRate,
            netHourlyRate = netHourlyRate,
            disposableHourlyRate = disposableHourlyRate,
            totalWorkMinutes = totalWorkMinutes,
            workHours = workHours,
            workMinutesRemaining = workMinutesRemaining,
            workDays = workDays,
            workWeeks = workWeeks,
            salaryPercentage = salaryPercentage,
            disposableIncomePercentage = disposableIncomePercentage,
            monthsOfDisposableIncome = monthsOfDisposableIncome,
            timeFormatted = timeFormatted,
            daysFormatted = daysFormatted,
            interpretationPhrases = interpretationPhrases,
            installmentResult = installments
        )
    }

    fun simulateInstallments(
        price: Double,
        installmentCount: Int,
        manualInstallmentAmount: Double? = null,
        monthlyInterestPercent: Double = 0.0,
        downPayment: Double = 0.0,
        netHourlyRate: Double
    ): InstallmentResult {
        val count = installmentCount.coerceAtLeast(1)
        val principal = (price - downPayment).coerceAtLeast(0.0)

        val installmentAmount: Double = if (manualInstallmentAmount != null && manualInstallmentAmount > 0.0) {
            manualInstallmentAmount
        } else if (monthlyInterestPercent > 0.0) {
            val i = monthlyInterestPercent / 100.0
            val factor = (1.0 + i).pow(count.toDouble())
            if (factor > 1.0) {
                principal * (i * factor) / (factor - 1.0)
            } else {
                principal / count
            }
        } else {
            principal / count
        }

        val totalPaid = downPayment + (installmentAmount * count)
        val totalInterest = (totalPaid - price).coerceAtLeast(0.0)

        val safeRate = if (netHourlyRate > 0.0) netHourlyRate else 28.41
        val productWorkHours = price / safeRate
        val interestWorkHours = totalInterest / safeRate

        val interestHoursInt = interestWorkHours.roundToLong()
        val interestPhrase = if (totalInterest > 1.0) {
            "Você trabalhará aproximadamente ${interestHoursInt}h apenas para pagar os juros."
        } else {
            "Sem incidência de juros adicionais."
        }

        return InstallmentResult(
            installmentCount = count,
            installmentAmount = installmentAmount,
            downPayment = downPayment,
            monthlyInterestRate = monthlyInterestPercent,
            totalPaid = totalPaid,
            totalInterest = totalInterest,
            productWorkHours = productWorkHours,
            interestWorkHours = interestWorkHours,
            interestPhrase = interestPhrase
        )
    }

    fun simulateOpportunityCost(
        investedAmount: Double,
        annualRatePercent: Double,
        years: Int,
        netHourlyRate: Double
    ): OpportunityCostResult {
        val r = annualRatePercent / 100.0
        val futureValue = investedAmount * (1.0 + r).pow(years.toDouble())
        val totalEarned = (futureValue - investedAmount).coerceAtLeast(0.0)
        val safeRate = if (netHourlyRate > 0.0) netHourlyRate else 28.41
        val futureWorkHoursEquivalent = futureValue / safeRate

        return OpportunityCostResult(
            investedAmount = investedAmount,
            annualRatePercent = annualRatePercent,
            years = years,
            futureValue = futureValue,
            totalEarned = totalEarned,
            futureWorkHoursEquivalent = futureWorkHoursEquivalent
        )
    }

    fun simulateRecurringCost(
        title: String,
        amount: Double,
        isDaily: Boolean,
        netHourlyRate: Double
    ): RecurringCostResult {
        val safeRate = if (netHourlyRate > 0.0) netHourlyRate else 28.41
        val (monthly, yearly, fiveYears, label) = if (isDaily) {
            val m = amount * 30.416
            val y = amount * 365.0
            val fy = amount * 365.0 * 5.0
            Quad(m, y, fy, "por dia")
        } else {
            val m = amount
            val y = amount * 12.0
            val fy = amount * 60.0
            Quad(m, y, fy, "por mês")
        }

        val mHours = monthly / safeRate
        val yHours = yearly / safeRate
        val fyHours = fiveYears / safeRate

        val interpretation = "Essa despesa custa aproximadamente ${yHours.roundToLong()} horas do seu trabalho por ano."

        return RecurringCostResult(
            title = title,
            unitAmount = amount,
            frequencyLabel = label,
            monthlyCost = monthly,
            yearlyCost = yearly,
            fiveYearCost = fiveYears,
            monthlyHours = mHours,
            yearlyHours = yHours,
            fiveYearHours = fyHours,
            interpretation = interpretation
        )
    }

    fun formatWorkTime(hours: Long, minutes: Long): String {
        return if (hours == 0L) {
            "${minutes}min"
        } else if (minutes == 0L) {
            "${hours}h"
        } else {
            "${hours}h ${minutes}min"
        }
    }

    fun formatWorkDays(workDays: Double, hoursPerDay: Double): String {
        val totalDays = workDays.toInt()
        val remainingHours = ((workDays - totalDays) * hoursPerDay).roundToLong()
        return if (totalDays == 0) {
            "${remainingHours}h de jornada"
        } else if (remainingHours == 0L) {
            "$totalDays dias de trabalho"
        } else {
            "$totalDays dias e ${remainingHours}h de trabalho"
        }
    }

    private fun generateInterpretationPhrases(
        workHours: Long,
        workMinutes: Long,
        workDays: Double,
        salaryPercentage: Double,
        disposableIncomePercentage: Double,
        monthsOfDisposableIncome: Double,
        price: Double
    ): List<String> {
        val phrases = mutableListOf<String>()

        val timeStr = formatWorkTime(workHours, workMinutes)
        phrases.add("Essa compra custa $timeStr do seu trabalho.")

        val daysRounded = ceil(workDays).toInt().coerceAtLeast(1)
        phrases.add("Você precisará trabalhar aproximadamente $daysRounded dias para pagar essa compra.")

        val salaryPctRounded = (salaryPercentage * 10.0).roundToLong() / 10.0
        phrases.add("Essa compra representa $salaryPctRounded% do seu salário mensal.")

        if (disposableIncomePercentage > 0.0) {
            val dispPctRounded = (disposableIncomePercentage * 10.0).roundToLong() / 10.0
            phrases.add("Essa compra representa $dispPctRounded% da sua renda disponível mensal.")
        }

        if (monthsOfDisposableIncome > 0.0) {
            val fullMonths = monthsOfDisposableIncome.toInt()
            val remainingDays = ((monthsOfDisposableIncome - fullMonths) * 30.0).roundToLong()
            val savePhrase = if (fullMonths == 0) {
                "Você precisará guardar toda sua renda disponível durante $remainingDays dias."
            } else if (remainingDays == 0L) {
                "Você precisará guardar toda sua renda disponível durante $fullMonths ${if (fullMonths == 1) "mês" else "meses"}."
            } else {
                "Você precisará guardar toda sua renda disponível durante $fullMonths ${if (fullMonths == 1) "mês" else "meses"} e $remainingDays dias."
            }
            phrases.add(savePhrase)
        }

        return phrases
    }

    fun formatCurrency(value: Double, currencyCode: String = "BRL"): String {
        return try {
            val locale = when (currencyCode.uppercase()) {
                "USD" -> Locale.US
                "EUR" -> Locale.GERMANY
                "GBP" -> Locale.UK
                else -> Locale("pt", "BR")
            }
            val formatter = NumberFormat.getCurrencyInstance(locale)
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 2
            formatter.format(value)
        } catch (_: Exception) {
            "R$ " + String.format(Locale.getDefault(), "%.2f", value)
        }
    }

    /**
     * Formata um valor monetário em horas, semanas ou meses de trabalho de acordo com a magnitude
     */
    fun formatAdaptiveWorkTime(
        amount: Double,
        hourlyRate: Double,
        weeklyHours: Double = 40.0,
        hoursPerMonth: Double = 176.0
    ): String {
        if (amount <= 0.0 || hourlyRate <= 0.0) return "0h"
        val totalHours = amount / hourlyRate
        val safeWeekly = if (weeklyHours > 0.0) weeklyHours else 40.0
        val safeMonthlyHours = if (hoursPerMonth > 0.0) hoursPerMonth else safeWeekly * (52.0 / 12.0)

        val months = totalHours / safeMonthlyHours
        val weeks = totalHours / safeWeekly

        return when {
            months >= 1.0 -> {
                val formatted = String.format(Locale.getDefault(), "%.1f", months).replace(".0", "")
                if (formatted == "1") "1 mês de trabalho" else "$formatted meses de trabalho"
            }
            weeks >= 1.0 -> {
                val formatted = String.format(Locale.getDefault(), "%.1f", weeks).replace(".0", "")
                if (formatted == "1") "1 semana de trabalho" else "$formatted semanas de trabalho"
            }
            totalHours >= 1.0 -> {
                val h = totalHours.toInt()
                val m = ((totalHours - h) * 60).roundToLong()
                if (m == 0L) "${h}h de trabalho" else "${h}h ${m}min de trabalho"
            }
            else -> {
                val m = (totalHours * 60).roundToLong().coerceAtLeast(1L)
                "${m}min de trabalho"
            }
        }
    }

    fun calculateGoalEffort(
        goalAmount: Double,
        currentAmount: Double,
        monthlyContribution: Double,
        profile: FinancialProfileData,
        fixedLivingCosts: Double
    ): GoalEffortCalculation {
        val safeNetSalary = if (profile.netSalary > 0.0) profile.netSalary else 5000.0
        val safeHoursPerMonth = if (profile.hoursPerMonth > 0.0) profile.hoursPerMonth else 176.0
        val safeHoursPerDay = if (profile.hoursPerDay > 0.0) profile.hoursPerDay else 8.0

        val baseHourlyRate = safeNetSalary / safeHoursPerMonth
        val remainingAmount = (goalAmount - currentAmount).coerceAtLeast(0.0)

        val freeMonthlyIncome = (safeNetSalary - fixedLivingCosts).coerceAtLeast(0.0)
        val fixedCostRatioPercent = if (safeNetSalary > 0.0) (fixedLivingCosts / safeNetSalary) * 100.0 else 0.0
        val isDeficit = fixedLivingCosts >= safeNetSalary

        val realFreeHourlyRate = if (freeMonthlyIncome > 0.0) {
            freeMonthlyIncome / safeHoursPerMonth
        } else {
            0.0
        }

        val nominalWorkHours = if (baseHourlyRate > 0.0) remainingAmount / baseHourlyRate else 0.0
        val nominalWorkDays = if (safeHoursPerDay > 0.0) nominalWorkHours / safeHoursPerDay else 0.0

        val realWorkHours = if (realFreeHourlyRate > 0.0) {
            remainingAmount / realFreeHourlyRate
        } else {
            nominalWorkHours
        }
        val realWorkDays = if (safeHoursPerDay > 0.0) realWorkHours / safeHoursPerDay else 0.0

        val effectiveContribution = if (monthlyContribution > 0.0) {
            monthlyContribution
        } else if (freeMonthlyIncome > 0.0) {
            freeMonthlyIncome
        } else {
            1.0
        }

        val monthsRemaining = if (effectiveContribution > 0.0) remainingAmount / effectiveContribution else 0.0
        val monthsByFreeIncome = if (freeMonthlyIncome > 0.0) remainingAmount / freeMonthlyIncome else 0.0

        val summaryText = if (isDeficit) {
            "Atenção: seus custos fixos (${formatCurrency(fixedLivingCosts)}) consom toda a sua renda. É necessário renegociar despesas essenciais para conseguir poupar para esta meta."
        } else if (fixedLivingCosts > 0.0) {
            "Considerando seus custos fixos de ${formatCurrency(fixedLivingCosts)} (${String.format(Locale.getDefault(), "%.0f", fixedCostRatioPercent)}% da renda), sobram ${formatCurrency(freeMonthlyIncome)}/mês (${formatCurrency(realFreeHourlyRate)}/h livre). Você precisará investir ${realWorkHours.roundToLong()}h reais (${String.format(Locale.getDefault(), "%.1f", realWorkDays)} dias úteis) e cerca de ${String.format(Locale.getDefault(), "%.1f", monthsRemaining)} meses de economia."
        } else {
            "Sem custos fixos cadastrados: você precisará de ${nominalWorkHours.roundToLong()}h nominais (${String.format(Locale.getDefault(), "%.1f", nominalWorkDays)} dias úteis) e ${String.format(Locale.getDefault(), "%.1f", monthsRemaining)} meses."
        }

        return GoalEffortCalculation(
            goalAmount = goalAmount,
            currentAmount = currentAmount,
            remainingAmount = remainingAmount,
            monthlyContribution = monthlyContribution,
            netSalary = safeNetSalary,
            fixedLivingCosts = fixedLivingCosts,
            freeMonthlyIncome = freeMonthlyIncome,
            fixedCostRatioPercent = fixedCostRatioPercent,
            baseHourlyRate = baseHourlyRate,
            realFreeHourlyRate = realFreeHourlyRate,
            nominalWorkHours = nominalWorkHours,
            nominalWorkDays = nominalWorkDays,
            realWorkHours = realWorkHours,
            realWorkDays = realWorkDays,
            monthsRemaining = monthsRemaining,
            monthsByFreeIncome = monthsByFreeIncome,
            isDeficit = isDeficit,
            summaryText = summaryText
        )
    }

    private data class Quad(val m: Double, val y: Double, val fy: Double, val label: String)
}
