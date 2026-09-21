package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.domain.engine.FinancialEngine
import com.example.domain.model.FinancialProfileData
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("Custo de Vida", appName)
  }

  @Test
  fun `financial engine converts price into hours correctly`() {
    val profile = FinancialProfileData(
      netSalary = 5000.0,
      hoursPerMonth = 176.0,
      hoursPerDay = 8.0,
      daysPerWeek = 5.0
    )
    val result = FinancialEngine.calculate(price = 2500.0, profile = profile)
    // 5000 / 176 = 28.40909 / hr
    // 2500 / 28.40909 = 88.0 hours
    assertEquals(88L, result.workHours)
    assertEquals(11.0, result.workDays, 0.1)
    assertEquals(50.0, result.salaryPercentage, 0.1)
    assertTrue(result.interpretationPhrases.isNotEmpty())
  }

  @Test
  fun `calculation with 40 weekly hours and net salary is precise`() {
    val netSalary = 4000.0
    val weeklyHours = 40.0
    val monthlyHours = weeklyHours * (52.0 / 12.0) // ~173.333h
    val hourlyRate = netSalary / monthlyHours // ~23.0769 R$/h

    val profile = FinancialProfileData(
      grossSalary = netSalary,
      netSalary = netSalary,
      hoursPerDay = weeklyHours / 5.0,
      daysPerWeek = 5.0,
      hoursPerMonth = monthlyHours
    )

    val itemPrice = 230.77
    val result = FinancialEngine.calculate(price = itemPrice, profile = profile)

    // ~10 hours of work
    assertEquals(10L, result.workHours)
    assertEquals(hourlyRate, result.netHourlyRate, 0.01)
  }

  @Test
  fun `time scale formatter scales correctly from hours to days weeks and months`() {
    // 3 hours (180 mins) -> "3h"
    assertEquals("3h", com.example.domain.engine.TimeScaleFormatter.formatWorkTimeAdaptive(180L, 8.0, 5.0))

    // 18 hours (1080 mins) -> 2 days (16h) and 2h remaining -> "2 dias e 2h"
    assertEquals("2 dias e 2h", com.example.domain.engine.TimeScaleFormatter.formatWorkTimeAdaptive(1080L, 8.0, 5.0))

    // 80 hours (4800 mins) -> 2 weeks (80h) -> "2 semanas"
    assertEquals("2 semanas", com.example.domain.engine.TimeScaleFormatter.formatWorkTimeAdaptive(4800L, 8.0, 5.0))

    // 400 hours (24000 mins) -> ~2 months and 1 week -> contains "meses"
    val monthScale = com.example.domain.engine.TimeScaleFormatter.formatWorkTimeAdaptive(24000L, 8.0, 5.0)
    assertTrue(monthScale.contains("mês") || monthScale.contains("meses"))
  }

  @Test
  fun `calculate difference shows percent and time more or less correctly`() {
    // Base: 100 reais, 5 hours (300 mins)
    // Target: 200 reais, 10 hours (600 mins)
    // Diff: +100%, +5 hours
    val diff = com.example.domain.engine.TimeScaleFormatter.calculateDiff(
      basePrice = 100.0,
      baseMinutes = 300L,
      targetPrice = 200.0,
      targetMinutes = 600L,
      baseName = "Blusa A",
      targetName = "Blusa B",
      hoursPerDay = 8.0,
      daysPerWeek = 5.0
    )

    assertEquals(100.0, diff.percentage, 0.1)
    assertTrue(diff.isMore)
    assertEquals("+100.0%", diff.percentageFormatted)
    assertTrue(diff.summaryText.contains("+5h a mais (+100.0%)"))
    assertTrue(diff.narrativePhrase.contains("trabalhar 5h a mais"))
  }
}


