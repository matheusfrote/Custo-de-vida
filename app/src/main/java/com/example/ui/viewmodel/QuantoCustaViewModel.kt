package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.local.entities.ExpenseEntity
import com.example.data.local.entities.PurchaseAnalysisEntity
import com.example.data.local.entities.SavingGoalEntity
import com.example.data.local.entities.UserEntity
import com.example.data.remote.ExtractedProductInfo
import com.example.data.remote.LinkMetadataFetcher
import com.example.data.repository.QuantoCustaRepository
import com.example.domain.engine.FinancialEngine
import com.example.domain.model.CalculationResult
import com.example.domain.model.ComparisonProduct
import com.example.domain.model.DashboardMetrics
import com.example.domain.model.ExpenseCategory
import com.example.domain.model.FinancialProfileData
import com.example.domain.model.InstallmentResult
import com.example.domain.model.OpportunityCostResult
import com.example.domain.model.PurchaseDecision
import com.example.domain.model.RecurringCostResult
import com.example.domain.model.ReflectionDuration
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class AppTab(val title: String) {
    CALCULATOR("Calculadora"),
    COMPARATOR("Comparar"),
    HISTORY("Histórico"),
    GOALS("Metas"),
    DASHBOARD("Dashboard"),
    SETTINGS("Ajustes")
}

class QuantoCustaViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    val repository = QuantoCustaRepository(db)

    val currentUser: StateFlow<UserEntity?> = repository.currentUser

    private val _currentTab = MutableStateFlow(AppTab.CALCULATOR)
    val currentTab: StateFlow<AppTab> = _currentTab.asStateFlow()

    // Financial Profile Flow
    val financialProfile: StateFlow<FinancialProfileData> = repository.getFinancialProfileFlow(1)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), FinancialProfileData())

    // Expenses Flow
    val expenses: StateFlow<List<ExpenseEntity>> = repository.getExpensesFlow(1)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val essentialExpensesSum: StateFlow<Double> = repository.getEssentialExpensesSumFlow(1)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    // Purchase Analyses Flow
    val analyses: StateFlow<List<PurchaseAnalysisEntity>> = repository.getAllAnalysesFlow(1)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Goals Flow
    val goals: StateFlow<List<SavingGoalEntity>> = repository.getSavingGoalsFlow(1)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Categories Flow
    val categories: StateFlow<List<String>> = repository.getAllCategoriesFlow()
        .combine(MutableStateFlow(Unit)) { list, _ ->
            list.map { it.name }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), listOf("Tecnologia", "Casa", "Lazer", "Outros"))

    // Current Calculation State
    private val _productNameInput = MutableStateFlow("")
    val productNameInput: StateFlow<String> = _productNameInput.asStateFlow()

    private val _priceInput = MutableStateFlow("2499.00")
    val priceInput: StateFlow<String> = _priceInput.asStateFlow()

    private val _selectedCategory = MutableStateFlow("Tecnologia")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _currentCalculation = MutableStateFlow<CalculationResult?>(null)
    val currentCalculation: StateFlow<CalculationResult?> = _currentCalculation.asStateFlow()

    // Installments Simulation
    private val _installmentResult = MutableStateFlow<InstallmentResult?>(null)
    val installmentResult: StateFlow<InstallmentResult?> = _installmentResult.asStateFlow()

    // Opportunity Cost Simulation
    private val _opportunityCostResult = MutableStateFlow<OpportunityCostResult?>(null)
    val opportunityCostResult: StateFlow<OpportunityCostResult?> = _opportunityCostResult.asStateFlow()

    // Recurring Cost Simulation
    private val _recurringCostResult = MutableStateFlow<RecurringCostResult?>(null)
    val recurringCostResult: StateFlow<RecurringCostResult?> = _recurringCostResult.asStateFlow()

    // Comparison Folders & Products (Starts empty by default)
    val comparisonFolders: StateFlow<List<com.example.domain.model.ComparisonFolderData>> = combine(
        repository.getComparisonFoldersFlow(1),
        repository.getComparisonItemsFlow(),
        financialProfile,
        essentialExpensesSum
    ) { folders, items, profile, expensesSum ->
        folders.map { folder ->
            val folderItems = items.filter { it.folderId == folder.id }.map { item ->
                val calc = FinancialEngine.calculate(item.price, profile, expensesSum)
                ComparisonProduct(
                    id = item.id.toString(),
                    folderId = item.folderId,
                    name = item.name,
                    price = item.price,
                    calculation = calc
                )
            }
            com.example.domain.model.ComparisonFolderData(
                id = folder.id,
                title = folder.title,
                createdAt = folder.createdAt,
                items = folderItems
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedFolderId = MutableStateFlow<Long?>(null)
    val selectedFolderId: StateFlow<Long?> = _selectedFolderId.asStateFlow()

    // UI Feedback & Dialogs
    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage: StateFlow<String?> = _snackbarMessage.asStateFlow()

    private val _showOnboarding = MutableStateFlow(false)
    val showOnboarding: StateFlow<Boolean> = _showOnboarding.asStateFlow()

    private val _showAuthDialog = MutableStateFlow(false)
    val showAuthDialog: StateFlow<Boolean> = _showAuthDialog.asStateFlow()

    private val _showLinkImportDialog = MutableStateFlow(false)
    val showLinkImportDialog: StateFlow<Boolean> = _showLinkImportDialog.asStateFlow()

    private val _isImportingLink = MutableStateFlow(false)
    val isImportingLink: StateFlow<Boolean> = _isImportingLink.asStateFlow()

    private val _showShareDialog = MutableStateFlow(false)
    val showShareDialog: StateFlow<Boolean> = _showShareDialog.asStateFlow()

    private val _shareCardText = MutableStateFlow("")
    val shareCardText: StateFlow<String> = _shareCardText.asStateFlow()

    private val _shareCardTitle = MutableStateFlow("")
    val shareCardTitle: StateFlow<String> = _shareCardTitle.asStateFlow()

    // Dashboard metrics derived
    val dashboardMetrics: StateFlow<DashboardMetrics> = combine(analyses, financialProfile) { list, profile ->
        computeDashboardMetrics(list, profile)
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        DashboardMetrics(0, 0.0, 0.0, 0.0, 0, 0.0, 0.0, 0, 0.0, 0.0, "", emptyList())
    )

    init {
        // Initial calculation on launch
        performCalculation(2499.00, "Smartphone")
        // Note: Comparison tab starts empty by default as requested by the user
    }

    fun setTab(tab: AppTab) {
        _currentTab.value = tab
    }

    fun onProductNameChange(name: String) {
        _productNameInput.value = name
    }

    fun onPriceChange(price: String) {
        _priceInput.value = price
    }

    fun onCategoryChange(cat: String) {
        _selectedCategory.value = cat
    }

    fun calculateFromInputs() {
        val raw = _priceInput.value.replace(",", ".").replace("R$", "").trim()
        val price = raw.toDoubleOrNull() ?: 0.0
        if (price <= 0.0) {
            _snackbarMessage.value = "Por favor, digite um preço válido maior que zero."
            return
        }
        performCalculation(price, _productNameInput.value.ifBlank { "Produto" })
    }

    fun performCalculation(price: Double, name: String = "Produto") {
        val profile = financialProfile.value
        val essential = essentialExpensesSum.value
        val result = FinancialEngine.calculate(
            price = price,
            profile = profile,
            monthlyEssentialExpenses = essential,
            installments = _installmentResult.value
        )
        _currentCalculation.value = result
    }

    fun simulateInstallments(
        count: Int,
        manualParcelValue: Double? = null,
        interestPercent: Double = 0.0,
        downPayment: Double = 0.0
    ) {
        val calc = _currentCalculation.value ?: return
        val result = FinancialEngine.simulateInstallments(
            price = calc.price,
            installmentCount = count,
            manualInstallmentAmount = manualParcelValue,
            monthlyInterestPercent = interestPercent,
            downPayment = downPayment,
            netHourlyRate = calc.netHourlyRate
        )
        _installmentResult.value = result
        _currentCalculation.value = calc.copy(installmentResult = result)
    }

    fun clearInstallments() {
        _installmentResult.value = null
        val calc = _currentCalculation.value ?: return
        _currentCalculation.value = calc.copy(installmentResult = null)
    }

    fun simulateOpportunityCost(years: Int = 5, ratePercent: Double = 10.5) {
        val calc = _currentCalculation.value ?: return
        val result = FinancialEngine.simulateOpportunityCost(
            investedAmount = calc.price,
            annualRatePercent = ratePercent,
            years = years,
            netHourlyRate = calc.netHourlyRate
        )
        _opportunityCostResult.value = result
    }

    fun simulateRecurringCost(title: String, amount: Double, isDaily: Boolean) {
        val calc = _currentCalculation.value ?: return
        val result = FinancialEngine.simulateRecurringCost(
            title = title,
            amount = amount,
            isDaily = isDaily,
            netHourlyRate = calc.netHourlyRate
        )
        _recurringCostResult.value = result
    }

    // --- Actions on Current Analysis ---
    fun saveCurrentAnalysis(decision: PurchaseDecision = PurchaseDecision.PENDING, notes: String? = null) {
        val calc = _currentCalculation.value ?: return
        val user = currentUser.value ?: return
        val name = _productNameInput.value.ifBlank { "Produto Analisado" }

        val moneySaved = if (decision == PurchaseDecision.GIVEN_UP) calc.price else 0.0
        val hoursPreserved = if (decision == PurchaseDecision.GIVEN_UP) (calc.totalWorkMinutes / 60.0) else 0.0

        val entity = PurchaseAnalysisEntity(
            userId = user.id,
            productName = name,
            category = _selectedCategory.value,
            price = calc.price,
            workHours = calc.totalWorkMinutes / 60.0,
            workMinutes = calc.totalWorkMinutes,
            workDays = calc.workDays,
            salaryUsed = financialProfile.value.netSalary,
            disposableIncomeUsed = (financialProfile.value.netSalary - essentialExpensesSum.value).coerceAtLeast(0.0),
            installmentDetails = calc.installmentResult?.let { "${it.installmentCount}x de ${FinancialEngine.formatCurrency(it.installmentAmount)}" },
            notes = notes,
            decision = decision.name,
            decisionDate = if (decision != PurchaseDecision.PENDING) System.currentTimeMillis() else null,
            moneySaved = moneySaved,
            hoursPreserved = hoursPreserved
        )

        viewModelScope.launch {
            repository.insertAnalysis(entity)
            _snackbarMessage.value = when (decision) {
                PurchaseDecision.GIVEN_UP -> "Desistência registrada! Você economizou ${FinancialEngine.formatCurrency(calc.price)} e preservou ${calc.timeFormatted} de vida."
                PurchaseDecision.PURCHASED -> "Compra registrada com sucesso no seu histórico!"
                else -> "Análise salva com sucesso no histórico!"
            }
        }
    }

    fun setReflectionPeriod(duration: ReflectionDuration) {
        val calc = _currentCalculation.value ?: return
        val user = currentUser.value ?: return
        val name = _productNameInput.value.ifBlank { "Produto em Reflexão" }
        val untilTimestamp = System.currentTimeMillis() + (duration.hours * 3600000L)

        val entity = PurchaseAnalysisEntity(
            userId = user.id,
            productName = name,
            category = _selectedCategory.value,
            price = calc.price,
            workHours = calc.totalWorkMinutes / 60.0,
            workMinutes = calc.totalWorkMinutes,
            workDays = calc.workDays,
            salaryUsed = financialProfile.value.netSalary,
            disposableIncomeUsed = (financialProfile.value.netSalary - essentialExpensesSum.value).coerceAtLeast(0.0),
            decision = PurchaseDecision.PENDING.name,
            reflectionUntil = untilTimestamp,
            reflectionStatus = "ACTIVE",
            notes = "Pensando antes de comprar (${duration.label})"
        )

        viewModelScope.launch {
            repository.insertAnalysis(entity)
            _snackbarMessage.value = "Compra adicionada à lista de reflexão por ${duration.label}."
        }
    }

    fun updateAnalysisDecision(item: PurchaseAnalysisEntity, decision: PurchaseDecision) {
        val moneySaved = if (decision == PurchaseDecision.GIVEN_UP) item.price else 0.0
        val hoursPreserved = if (decision == PurchaseDecision.GIVEN_UP) item.workHours else 0.0

        viewModelScope.launch {
            repository.updateDecision(item.id, decision, moneySaved, hoursPreserved)
            _snackbarMessage.value = if (decision == PurchaseDecision.GIVEN_UP) {
                "Parabéns! Você economizou ${FinancialEngine.formatCurrency(item.price)} e preservou ${item.workHours.toInt()}h de trabalho."
            } else {
                "Decisão atualizada para '${decision.label}'."
            }
        }
    }

    fun toggleFavorite(item: PurchaseAnalysisEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(item.id, !item.isFavorite)
        }
    }

    fun deleteAnalysis(item: PurchaseAnalysisEntity) {
        viewModelScope.launch {
            repository.deleteAnalysis(item.id)
            _snackbarMessage.value = "Análise removida do histórico."
        }
    }

    fun reloadAnalysisIntoCalculator(item: PurchaseAnalysisEntity) {
        _productNameInput.value = item.productName
        _priceInput.value = item.price.toString()
        _selectedCategory.value = item.category
        performCalculation(item.price, item.productName)
        _currentTab.value = AppTab.CALCULATOR
        _snackbarMessage.value = "Análise carregada na calculadora."
    }

    // --- Product Link Import ---
    fun openLinkImportDialog() {
        _showLinkImportDialog.value = true
    }

    fun closeLinkImportDialog() {
        _showLinkImportDialog.value = false
    }

    fun importProductFromUrl(url: String) {
        if (url.isBlank()) return
        viewModelScope.launch {
            _isImportingLink.value = true
            val info = LinkMetadataFetcher.extract(url)
            _isImportingLink.value = false
            _showLinkImportDialog.value = false

            if (info != null) {
                if (!info.title.isNullOrBlank()) {
                    _productNameInput.value = info.title
                }
                if (info.price != null && info.price > 0.0) {
                    _priceInput.value = info.price.toString()
                    performCalculation(info.price, info.title ?: "Produto Importado")
                    _snackbarMessage.value = "Produto importado com sucesso: ${info.storeName ?: "Loja"}"
                } else {
                    _snackbarMessage.value = "Não conseguimos identificar o preço automaticamente. Por favor, preencha o valor manualmente."
                }
            } else {
                _snackbarMessage.value = "Não conseguimos identificar os dados da página. Preencha os campos manualmente."
            }
        }
    }

    // --- Product Comparator (Folder-based & empty by default) ---
    fun selectComparisonFolder(folderId: Long?) {
        _selectedFolderId.value = folderId
    }

    fun createComparisonFolder(title: String) {
        val cleanTitle = title.trim()
        if (cleanTitle.isBlank()) return
        viewModelScope.launch {
            val id = repository.createComparisonFolder(cleanTitle)
            _selectedFolderId.value = id
            _snackbarMessage.value = "Comparação '$cleanTitle' criada!"
        }
    }

    fun deleteComparisonFolder(folderId: Long) {
        viewModelScope.launch {
            repository.deleteComparisonFolder(folderId)
            if (_selectedFolderId.value == folderId) {
                _selectedFolderId.value = null
            }
            _snackbarMessage.value = "Comparação excluída."
        }
    }

    fun addComparisonProduct(folderId: Long, name: String, price: Double) {
        val cleanName = name.trim()
        if (cleanName.isBlank() || price <= 0.0) return
        viewModelScope.launch {
            repository.addComparisonItem(folderId, cleanName, price)
            _snackbarMessage.value = "Item '$cleanName' adicionado à comparação."
        }
    }

    fun addComparisonProduct(name: String, price: Double) {
        val currentFolderId = _selectedFolderId.value
            ?: comparisonFolders.value.firstOrNull()?.id
        if (currentFolderId != null) {
            addComparisonProduct(currentFolderId, name, price)
        } else {
            viewModelScope.launch {
                val newFolderId = repository.createComparisonFolder("Geral")
                _selectedFolderId.value = newFolderId
                repository.addComparisonItem(newFolderId, name.trim(), price)
                _snackbarMessage.value = "Item '$name' adicionado."
            }
        }
    }

    fun removeComparisonProduct(itemId: Long) {
        viewModelScope.launch {
            repository.deleteComparisonItem(itemId)
            _snackbarMessage.value = "Item removido da comparação."
        }
    }

    fun removeComparisonProduct(idStr: String) {
        val idLong = idStr.toLongOrNull()
        if (idLong != null) {
            removeComparisonProduct(idLong)
        }
    }

    // --- Share Card Generator ---
    fun prepareShareCard(analysisTitle: String? = null, timeStr: String? = null, isGivenUp: Boolean = false) {
        val calc = _currentCalculation.value ?: return
        val title = analysisTitle ?: _productNameInput.value.ifBlank { "Esse item" }
        val time = timeStr ?: calc.timeFormatted

        if (isGivenUp) {
            _shareCardTitle.value = "Vitória Financeira!"
            _shareCardText.value = "Desisti de comprar $title e preservei $time de trabalho da minha vida! ⏱️🌱 #CustoDeVida"
        } else {
            _shareCardTitle.value = "Custo de Vida"
            _shareCardText.value = "$title custa $time da minha vida trabalhando. E o seu tempo, quanto custa? ⏱️💡 #CustoDeVida"
        }
        _showShareDialog.value = true
    }

    fun closeShareDialog() {
        _showShareDialog.value = false
    }

    // --- Profile & Financial Settings ---
    fun updateSalaryAndWeeklyHours(
        netSalary: Double,
        weeklyHours: Double,
        useCltDivisor: Boolean = false
    ) {
        val safeNet = netSalary.coerceAtLeast(1.0)
        val safeWeekly = weeklyHours.coerceAtLeast(1.0)
        val safeDays = 5.0
        val hoursPerDay = safeWeekly / safeDays
        val hoursPerMonth = if (useCltDivisor) {
            safeWeekly * 5.0
        } else {
            safeWeekly * (52.0 / 12.0)
        }

        val updated = financialProfile.value.copy(
            grossSalary = safeNet,
            netSalary = safeNet,
            hoursPerDay = hoursPerDay,
            daysPerWeek = safeDays,
            hoursPerMonth = hoursPerMonth
        )
        viewModelScope.launch {
            repository.updateFinancialProfile(updated)
            val hourlyRate = safeNet / hoursPerMonth
            _snackbarMessage.value = "Base de cálculo salva! Sua hora vale ${FinancialEngine.formatCurrency(hourlyRate)}/h"
            _currentCalculation.value?.let { current ->
                performCalculation(current.price, _productNameInput.value)
            }
        }
    }

    fun updateFinancialProfile(
        gross: Double,
        net: Double,
        hoursDay: Double,
        daysWeek: Double,
        hoursMonth: Double
    ) {
        val updated = financialProfile.value.copy(
            grossSalary = gross,
            netSalary = net,
            hoursPerDay = hoursDay,
            daysPerWeek = daysWeek,
            hoursPerMonth = hoursMonth
        )
        viewModelScope.launch {
            repository.updateFinancialProfile(updated)
            _snackbarMessage.value = "Configurações financeiras salvas!"
            // Recompute current calculation with new rates
            _currentCalculation.value?.let { current ->
                performCalculation(current.price, _productNameInput.value)
            }
        }
    }

    fun addExpense(category: ExpenseCategory, name: String, amount: Double, isEssential: Boolean = true) {
        viewModelScope.launch {
            val user = currentUser.value ?: return@launch
            val entity = ExpenseEntity(
                userId = user.id,
                category = category.name,
                name = name,
                amount = amount,
                isEssential = isEssential
            )
            repository.addExpense(entity)
            _snackbarMessage.value = "Despesa adicionada com sucesso!"
        }
    }

    fun deleteExpense(id: Long) {
        viewModelScope.launch {
            repository.deleteExpense(id)
            _snackbarMessage.value = "Despesa excluída."
        }
    }

    fun addSavingGoal(title: String, targetAmount: Double, currentAmount: Double, monthlyContribution: Double) {
        viewModelScope.launch {
            val user = currentUser.value ?: return@launch
            val entity = SavingGoalEntity(
                userId = user.id,
                title = title,
                targetAmount = targetAmount,
                currentAmount = currentAmount,
                monthlyContribution = monthlyContribution
            )
            repository.addSavingGoal(entity)
            _snackbarMessage.value = "Meta '$title' criada com sucesso!"
        }
    }

    fun updateSavingGoalProgress(goal: SavingGoalEntity, addedAmount: Double) {
        viewModelScope.launch {
            val updated = goal.copy(currentAmount = (goal.currentAmount + addedAmount).coerceAtMost(goal.targetAmount))
            repository.updateSavingGoal(updated)
            _snackbarMessage.value = "Progresso da meta atualizado!"
        }
    }

    fun deleteSavingGoal(id: Long) {
        viewModelScope.launch {
            repository.deleteSavingGoal(id)
            _snackbarMessage.value = "Meta excluída."
        }
    }

    // --- Authentication Actions ---
    fun openAuthDialog() {
        _showAuthDialog.value = true
    }

    fun closeAuthDialog() {
        _showAuthDialog.value = false
    }

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            val res = repository.login(email, pass)
            res.onSuccess {
                _showAuthDialog.value = false
                _snackbarMessage.value = "Bem-vindo de volta, ${it.name}!"
            }.onFailure {
                _snackbarMessage.value = it.message ?: "Falha ao entrar."
            }
        }
    }

    fun register(name: String, email: String, pass: String) {
        viewModelScope.launch {
            val res = repository.register(name, email, pass)
            res.onSuccess {
                _showAuthDialog.value = false
                _snackbarMessage.value = "Conta criada com sucesso, ${it.name}!"
            }.onFailure {
                _snackbarMessage.value = it.message ?: "Falha no cadastro."
            }
        }
    }

    fun recoverPassword(email: String) {
        viewModelScope.launch {
            val res = repository.recoverPassword(email)
            res.onSuccess {
                _snackbarMessage.value = it
            }.onFailure {
                _snackbarMessage.value = it.message ?: "Falha ao recuperar senha."
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _snackbarMessage.value = "Sessão encerrada."
        }
    }

    fun deleteAccount() {
        viewModelScope.launch {
            repository.deleteAccount()
            _snackbarMessage.value = "Conta e dados excluídos."
        }
    }

    fun toggleOnboarding(show: Boolean) {
        _showOnboarding.value = show
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }

    // --- Dashboard Math ---
    private fun computeDashboardMetrics(list: List<PurchaseAnalysisEntity>, profile: FinancialProfileData): DashboardMetrics {
        val totalCount = list.size
        val totalMoney = list.sumOf { it.price }
        val totalHours = list.sumOf { it.workHours }
        val safeHoursPerDay = if (profile.hoursPerDay > 0) profile.hoursPerDay else 8.0
        val totalDays = totalHours / safeHoursPerDay

        val avoidedList = list.filter { it.decision == PurchaseDecision.GIVEN_UP.name }
        val completedList = list.filter { it.decision == PurchaseDecision.PURCHASED.name }

        val moneySaved = avoidedList.sumOf { it.price }
        val hoursSaved = avoidedList.sumOf { it.workHours }
        val moneySpent = completedList.sumOf { it.price }

        val highest = list.maxByOrNull { it.price }

        val catMap = mutableMapOf<String, Double>()
        list.forEach { item ->
            catMap[item.category] = (catMap[item.category] ?: 0.0) + item.price
        }
        val topCategories = catMap.toList().sortedByDescending { it.second }.take(4)

        return DashboardMetrics(
            totalAnalysesCount = totalCount,
            totalMoneyAnalyzed = totalMoney,
            totalWorkHoursAnalyzed = totalHours,
            totalWorkDaysAnalyzed = totalDays,
            purchasesAvoidedCount = avoidedList.size,
            moneySaved = moneySaved,
            hoursPreserved = hoursSaved,
            purchasesCompletedCount = completedList.size,
            moneySpent = moneySpent,
            highestPriceAnalyzed = highest?.price ?: 0.0,
            highestProductName = highest?.productName ?: "Nenhum",
            topCategories = topCategories
        )
    }
}
