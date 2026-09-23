package com.example.domain.model

enum class IncomeType(val labelPt: String, val labelEn: String) {
    MONTHLY("Mensal", "Monthly"),
    WEEKLY("Semanal", "Weekly"),
    DAILY("Diário", "Daily"),
    HOURLY("Por Hora", "Hourly"),
    FREELANCER("Freelancer", "Freelancer"),
    VARIABLE("Variável", "Variable")
}

enum class ExpenseCategory(val labelPt: String, val iconName: String) {
    HOUSING("Moradia", "Home"),
    FOOD("Alimentação", "Restaurant"),
    TRANSPORT("Transporte", "DirectionsCar"),
    ENERGY("Energia Elétrica", "Bolt"),
    WATER("Água e Saneamento", "WaterDrop"),
    INTERNET("Internet", "Wifi"),
    PHONE("Telefone / Celular", "PhoneAndroid"),
    HEALTH("Saúde & Medicamentos", "LocalHospital"),
    EDUCATION("Educação", "School"),
    DEBTS("Dívidas e Empréstimos", "AccountBalance"),
    SUBSCRIPTIONS("Assinaturas e Streaming", "Subscriptions"),
    CHILDREN("Filhos e Dependentes", "FamilyRestroom"),
    LEISURE("Lazer e Entretenimento", "Celebration"),
    OTHER("Outros Custos", "Category")
}

enum class PurchaseDecision(val label: String) {
    PENDING("Pendente"),
    PURCHASED("Comprei"),
    GIVEN_UP("Desisti da Compra")
}

enum class ReflectionDuration(val label: String, val hours: Long) {
    HOURS_24("24 Horas", 24),
    DAYS_3("3 Dias", 72),
    DAYS_7("7 Dias", 168),
    DAYS_15("15 Dias", 360),
    DAYS_30("30 Dias", 720)
}

data class FinancialProfileData(
    val userId: Long = 1,
    val grossSalary: Double = 6000.0,
    val netSalary: Double = 5000.0,
    val incomeType: IncomeType = IncomeType.MONTHLY,
    val hoursPerDay: Double = 8.0,
    val daysPerWeek: Double = 5.0,
    val hoursPerMonth: Double = 176.0
)

data class ExpenseItem(
    val id: Long = 0,
    val userId: Long = 1,
    val category: ExpenseCategory,
    val name: String,
    val amount: Double,
    val isEssential: Boolean = true
)

data class InstallmentResult(
    val installmentCount: Int,
    val installmentAmount: Double,
    val downPayment: Double,
    val monthlyInterestRate: Double,
    val totalPaid: Double,
    val totalInterest: Double,
    val productWorkHours: Double,
    val interestWorkHours: Double,
    val interestPhrase: String
)

data class CalculationResult(
    val price: Double,
    val grossHourlyRate: Double,
    val netHourlyRate: Double,
    val disposableHourlyRate: Double,
    val totalWorkMinutes: Long,
    val workHours: Long,
    val workMinutesRemaining: Long,
    val workDays: Double,
    val workWeeks: Double,
    val salaryPercentage: Double,
    val disposableIncomePercentage: Double,
    val monthsOfDisposableIncome: Double,
    val timeFormatted: String,
    val daysFormatted: String,
    val interpretationPhrases: List<String>,
    val installmentResult: InstallmentResult? = null
)

data class OpportunityCostResult(
    val investedAmount: Double,
    val annualRatePercent: Double,
    val years: Int,
    val futureValue: Double,
    val totalEarned: Double,
    val futureWorkHoursEquivalent: Double
)

data class RecurringCostResult(
    val title: String,
    val unitAmount: Double,
    val frequencyLabel: String,
    val monthlyCost: Double,
    val yearlyCost: Double,
    val fiveYearCost: Double,
    val monthlyHours: Double,
    val yearlyHours: Double,
    val fiveYearHours: Double,
    val interpretation: String
)

data class ProductAnalysisItem(
    val id: Long = 0,
    val userId: Long = 1,
    val productName: String,
    val category: String,
    val price: Double,
    val timestamp: Long = System.currentTimeMillis(),
    val workHours: Double,
    val workMinutes: Long,
    val workDays: Double,
    val salaryUsed: Double,
    val disposableIncomeUsed: Double,
    val productUrl: String? = null,
    val imageUrl: String? = null,
    val installmentDetails: String? = null,
    val notes: String? = null,
    val decision: PurchaseDecision = PurchaseDecision.PENDING,
    val decisionDate: Long? = null,
    val moneySaved: Double = 0.0,
    val hoursPreserved: Double = 0.0,
    val reflectionUntil: Long? = null,
    val reflectionStatus: String? = null,
    val isFavorite: Boolean = false
)

enum class GoalType(val key: String, val label: String) {
    SAVINGS("SAVINGS", "Meta de Poupança"),
    PURCHASE("PURCHASE", "Meta de Compra")
}

data class GoalEffortCalculation(
    val goalAmount: Double,
    val currentAmount: Double,
    val remainingAmount: Double,
    val monthlyContribution: Double,
    val netSalary: Double,
    val fixedLivingCosts: Double,
    val freeMonthlyIncome: Double,
    val fixedCostRatioPercent: Double,
    val baseHourlyRate: Double,
    val realFreeHourlyRate: Double,
    val nominalWorkHours: Double,
    val nominalWorkDays: Double,
    val realWorkHours: Double,
    val realWorkDays: Double,
    val monthsRemaining: Double,
    val monthsByFreeIncome: Double,
    val isDeficit: Boolean,
    val summaryText: String
)

data class SavingGoalItem(
    val id: Long = 0,
    val userId: Long = 1,
    val title: String,
    val targetAmount: Double,
    val currentAmount: Double = 0.0,
    val monthlyContribution: Double = 500.0,
    val goalType: String = "SAVINGS",
    val targetWorkHours: Double = 0.0,
    val remainingWorkHours: Double = 0.0,
    val monthsToTarget: Double = 0.0,
    val percentComplete: Double = 0.0
)

data class ComparisonProduct(
    val id: String,
    val folderId: Long = 0L,
    val name: String,
    val price: Double,
    val calculation: CalculationResult
)

data class ComparisonFolderData(
    val id: Long,
    val title: String,
    val createdAt: Long = System.currentTimeMillis(),
    val items: List<ComparisonProduct> = emptyList()
)

data class DashboardMetrics(
    val totalAnalysesCount: Int,
    val totalMoneyAnalyzed: Double,
    val totalWorkHoursAnalyzed: Double,
    val totalWorkDaysAnalyzed: Double,
    val purchasesAvoidedCount: Int,
    val moneySaved: Double,
    val hoursPreserved: Double,
    val purchasesCompletedCount: Int,
    val moneySpent: Double,
    val highestPriceAnalyzed: Double,
    val highestProductName: String,
    val topCategories: List<Pair<String, Double>>
)
