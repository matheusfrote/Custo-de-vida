package com.example.data.repository

import com.example.data.local.AppDatabase
import com.example.data.local.entities.CategoryEntity
import com.example.data.local.entities.ExpenseEntity
import com.example.data.local.entities.FinancialProfileEntity
import com.example.data.local.entities.PurchaseAnalysisEntity
import com.example.data.local.entities.SavingGoalEntity
import com.example.data.local.entities.UserEntity
import com.example.domain.engine.FinancialEngine
import com.example.domain.model.ExpenseCategory
import com.example.domain.model.FinancialProfileData
import com.example.domain.model.IncomeType
import com.example.domain.model.PurchaseDecision
import com.example.domain.model.SavingGoalItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class QuantoCustaRepository(private val db: AppDatabase) {

    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser: StateFlow<UserEntity?> = _currentUser.asStateFlow()

    init {
        CoroutineScope(Dispatchers.IO).launch {
            seedInitialDataIfNeeded()
        }
    }

    private suspend fun seedInitialDataIfNeeded() = withContext(Dispatchers.IO) {
        // Seed default user if none
        var user = db.userDao().getFirstUser()
        if (user == null) {
            val defaultUserId = db.userDao().insertUser(
                UserEntity(
                    name = "Convidado",
                    email = "usuario@quantocusta.app",
                    passwordHash = hashPassword("123456"),
                    currency = "BRL",
                    country = "Brasil",
                    language = "pt-BR",
                    isGuest = true
                )
            )
            user = db.userDao().getUserById(defaultUserId)

            // Seed financial profile
            db.financialProfileDao().upsertProfile(
                FinancialProfileEntity(
                    userId = defaultUserId,
                    grossSalary = 6200.0,
                    netSalary = 5000.0,
                    incomeType = "MONTHLY",
                    hoursPerDay = 8.0,
                    daysPerWeek = 5.0,
                    hoursPerMonth = 176.0
                )
            )

            // Seed initial essential expenses (Housing, Food, Transport, Energy, Water, Internet, Phone)
            val initialExpenses = listOf(
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.HOUSING.name, name = "Aluguel / Condomínio", amount = 1600.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.FOOD.name, name = "Supermercado & Alimentação", amount = 950.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.TRANSPORT.name, name = "Transporte & Combustível", amount = 350.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.ENERGY.name, name = "Conta de Luz", amount = 180.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.WATER.name, name = "Água & Esgoto", amount = 85.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.INTERNET.name, name = "Internet Fibra", amount = 120.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.PHONE.name, name = "Plano Celular", amount = 65.0, isEssential = true),
                ExpenseEntity(userId = defaultUserId, category = ExpenseCategory.SUBSCRIPTIONS.name, name = "Streamings & Assinaturas", amount = 150.0, isEssential = false)
            )
            initialExpenses.forEach { db.expenseDao().insertExpense(it) }

            // Seed initial sample analyses
            val sampleNotebook = PurchaseAnalysisEntity(
                userId = defaultUserId,
                productName = "Notebook Dell Inspiron",
                category = "Tecnologia",
                price = 4500.0,
                timestamp = System.currentTimeMillis() - 86400000L * 3,
                workHours = 158.4,
                workMinutes = 9504,
                workDays = 19.8,
                salaryUsed = 5000.0,
                disposableIncomeUsed = 1500.0,
                installmentDetails = "10x de R$ 450,00 sem juros",
                notes = "Para trabalho e estudo",
                decision = PurchaseDecision.PURCHASED.name,
                decisionDate = System.currentTimeMillis() - 86400000L * 2
            )
            val sampleSmartphone = PurchaseAnalysisEntity(
                userId = defaultUserId,
                productName = "Smartphone Premium",
                category = "Tecnologia",
                price = 3200.0,
                timestamp = System.currentTimeMillis() - 86400000L * 6,
                workHours = 112.6,
                workMinutes = 6758,
                workDays = 14.0,
                salaryUsed = 5000.0,
                disposableIncomeUsed = 1500.0,
                decision = PurchaseDecision.GIVEN_UP.name,
                decisionDate = System.currentTimeMillis() - 86400000L * 5,
                moneySaved = 3200.0,
                hoursPreserved = 112.6,
                notes = "O meu celular atual ainda funciona perfeitamente!"
            )
            val sampleWatch = PurchaseAnalysisEntity(
                userId = defaultUserId,
                productName = "Smartwatch Esportivo",
                category = "Lazer",
                price = 1200.0,
                timestamp = System.currentTimeMillis() - 86400000L,
                workHours = 42.2,
                workMinutes = 2534,
                workDays = 5.2,
                salaryUsed = 5000.0,
                disposableIncomeUsed = 1500.0,
                decision = PurchaseDecision.PENDING.name,
                reflectionUntil = System.currentTimeMillis() + 86400000L * 2,
                reflectionStatus = "ACTIVE"
            )
            db.purchaseAnalysisDao().insertAnalysis(sampleNotebook)
            db.purchaseAnalysisDao().insertAnalysis(sampleSmartphone)
            db.purchaseAnalysisDao().insertAnalysis(sampleWatch)

            // Seed initial goals (Savings and Purchase)
            db.savingGoalDao().insertGoal(
                SavingGoalEntity(
                    userId = defaultUserId,
                    title = "Reserva de Emergência",
                    targetAmount = 15000.0,
                    currentAmount = 4500.0,
                    monthlyContribution = 750.0,
                    goalType = "SAVINGS"
                )
            )
            db.savingGoalDao().insertGoal(
                SavingGoalEntity(
                    userId = defaultUserId,
                    title = "Smartphone Top de Linha",
                    targetAmount = 4200.0,
                    currentAmount = 1200.0,
                    monthlyContribution = 400.0,
                    goalType = "PURCHASE"
                )
            )
        }

        // Seed categories if empty
        if (db.categoryDao().count() == 0) {
            val defaultCategories = listOf(
                "Tecnologia", "Casa", "Automóveis", "Viagens", "Roupas",
                "Alimentação", "Assinaturas", "Educação", "Saúde", "Lazer", "Presentes", "Outros"
            )
            defaultCategories.forEach {
                db.categoryDao().insertCategory(CategoryEntity(name = it, isCustom = false))
            }
        }

        _currentUser.value = user
    }

    // --- Authentication & User Management ---
    suspend fun register(name: String, email: String, password: String):Result<UserEntity> = withContext(Dispatchers.IO) {
        val existing = db.userDao().getUserByEmail(email.trim().lowercase())
        if (existing != null && !existing.isGuest) {
            return@withContext Result.failure(Exception("Já existe uma conta com este e-mail."))
        }
        val current = _currentUser.value
        val entity = if (current != null && current.isGuest) {
            // Upgrade guest user
            val updated = current.copy(
                name = name.trim(),
                email = email.trim().lowercase(),
                passwordHash = hashPassword(password),
                isGuest = false
            )
            db.userDao().updateUser(updated)
            updated
        } else {
            val newId = db.userDao().insertUser(
                UserEntity(
                    name = name.trim(),
                    email = email.trim().lowercase(),
                    passwordHash = hashPassword(password),
                    isGuest = false
                )
            )
            val newUser = db.userDao().getUserById(newId)!!
            db.financialProfileDao().upsertProfile(FinancialProfileEntity(userId = newId))
            newUser
        }
        _currentUser.value = entity
        Result.success(entity)
    }

    suspend fun signInWithGoogleUser(name: String, email: String, photoUrl: String?): Result<UserEntity> = withContext(Dispatchers.IO) {
        val existing = db.userDao().getUserByEmail(email.trim().lowercase())
        val current = _currentUser.value
        val entity = if (existing != null) {
            val updated = existing.copy(
                name = if (name.isNotBlank()) name else existing.name,
                isGuest = false
            )
            db.userDao().updateUser(updated)
            updated
        } else if (current != null && current.isGuest) {
            val updated = current.copy(
                name = if (name.isNotBlank()) name else "Usuário Google",
                email = email.trim().lowercase(),
                isGuest = false
            )
            db.userDao().updateUser(updated)
            updated
        } else {
            val newId = db.userDao().insertUser(
                UserEntity(
                    name = if (name.isNotBlank()) name else "Usuário Google",
                    email = email.trim().lowercase(),
                    passwordHash = "",
                    isGuest = false
                )
            )
            val newUser = db.userDao().getUserById(newId)!!
            db.financialProfileDao().upsertProfile(FinancialProfileEntity(userId = newId))
            newUser
        }
        _currentUser.value = entity
        Result.success(entity)
    }

    suspend fun login(email: String, password: String): Result<UserEntity> = withContext(Dispatchers.IO) {
        val user = db.userDao().getUserByEmail(email.trim().lowercase())
            ?: return@withContext Result.failure(Exception("Usuário não encontrado."))
        if (user.passwordHash != hashPassword(password)) {
            return@withContext Result.failure(Exception("Senha incorreta."))
        }
        _currentUser.value = user
        Result.success(user)
    }

    suspend fun recoverPassword(email: String): Result<String> = withContext(Dispatchers.IO) {
        val user = db.userDao().getUserByEmail(email.trim().lowercase())
            ?: return@withContext Result.failure(Exception("E-mail não cadastrado."))
        // Generates temporary recovery code and resets hash to default temporary
        val tempPass = "Temp" + (1000..9999).random()
        db.userDao().updateUser(user.copy(passwordHash = hashPassword(tempPass)))
        Result.success("Código de recuperação gerado com sucesso: $tempPass. Utilize esta senha temporária para acessar e altere sua senha no perfil.")
    }

    suspend fun updatePassword(oldPass: String, newPass: String): Result<Unit> = withContext(Dispatchers.IO) {
        val user = _currentUser.value ?: return@withContext Result.failure(Exception("Nenhum usuário logado."))
        if (user.passwordHash != hashPassword(oldPass)) {
            return@withContext Result.failure(Exception("Senha atual não confere."))
        }
        db.userDao().updateUser(user.copy(passwordHash = hashPassword(newPass)))
        _currentUser.value = db.userDao().getUserById(user.id)
        Result.success(Unit)
    }

    suspend fun updateProfile(name: String, currency: String, language: String): Result<Unit> = withContext(Dispatchers.IO) {
        val user = _currentUser.value ?: return@withContext Result.failure(Exception("Nenhum usuário logado."))
        val updated = user.copy(name = name, currency = currency, language = language)
        db.userDao().updateUser(updated)
        _currentUser.value = updated
        Result.success(Unit)
    }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        // Return to guest mode or seed a fresh session
        val guest = UserEntity(
            name = "Convidado",
            email = "convidado@quantocusta.app",
            passwordHash = hashPassword("guest"),
            isGuest = true
        )
        val id = db.userDao().insertUser(guest)
        db.financialProfileDao().upsertProfile(FinancialProfileEntity(userId = id))
        _currentUser.value = db.userDao().getUserById(id)
        Result.success(Unit)
    }

    suspend fun deleteAccount(): Result<Unit> = withContext(Dispatchers.IO) {
        val user = _currentUser.value ?: return@withContext Result.failure(Exception("Nenhum usuário logado."))
        db.userDao().deleteUserById(user.id)
        logout()
    }

    // --- Financial Profile ---
    fun getFinancialProfileFlow(userId: Long): Flow<FinancialProfileData> {
        return db.financialProfileDao().getProfileFlow(userId).map { entity ->
            if (entity != null) {
                FinancialProfileData(
                    userId = entity.userId,
                    grossSalary = entity.grossSalary,
                    netSalary = entity.netSalary,
                    incomeType = try { IncomeType.valueOf(entity.incomeType) } catch (_: Exception) { IncomeType.MONTHLY },
                    hoursPerDay = entity.hoursPerDay,
                    daysPerWeek = entity.daysPerWeek,
                    hoursPerMonth = entity.hoursPerMonth
                )
            } else {
                FinancialProfileData(userId = userId)
            }
        }
    }

    suspend fun updateFinancialProfile(profile: FinancialProfileData) = withContext(Dispatchers.IO) {
        db.financialProfileDao().upsertProfile(
            FinancialProfileEntity(
                userId = profile.userId,
                grossSalary = profile.grossSalary,
                netSalary = profile.netSalary,
                incomeType = profile.incomeType.name,
                hoursPerDay = profile.hoursPerDay,
                daysPerWeek = profile.daysPerWeek,
                hoursPerMonth = profile.hoursPerMonth
            )
        )
    }

    // --- Expenses ---
    fun getExpensesFlow(userId: Long): Flow<List<ExpenseEntity>> = db.expenseDao().getExpensesFlow(userId)

    fun getEssentialExpensesSumFlow(userId: Long): Flow<Double> = db.expenseDao().getEssentialExpensesSumFlow(userId)

    suspend fun addExpense(expense: ExpenseEntity) = withContext(Dispatchers.IO) {
        db.expenseDao().insertExpense(expense)
    }

    suspend fun updateExpense(expense: ExpenseEntity) = withContext(Dispatchers.IO) {
        db.expenseDao().updateExpense(expense)
    }

    suspend fun deleteExpense(id: Long) = withContext(Dispatchers.IO) {
        db.expenseDao().deleteExpenseById(id)
    }

    // --- Analyses ---
    fun getAllAnalysesFlow(userId: Long): Flow<List<PurchaseAnalysisEntity>> = db.purchaseAnalysisDao().getAllAnalysesFlow(userId)

    suspend fun insertAnalysis(analysis: PurchaseAnalysisEntity): Long = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().insertAnalysis(analysis)
    }

    suspend fun updateAnalysis(analysis: PurchaseAnalysisEntity) = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().updateAnalysis(analysis)
    }

    suspend fun deleteAnalysis(id: Long) = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().deleteAnalysisById(id)
    }

    suspend fun updateDecision(id: Long, decision: PurchaseDecision, moneySaved: Double, hoursPreserved: Double) = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().updateDecision(
            id = id,
            decision = decision.name,
            decisionDate = System.currentTimeMillis(),
            moneySaved = moneySaved,
            hoursPreserved = hoursPreserved
        )
    }

    suspend fun toggleFavorite(id: Long, isFavorite: Boolean) = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().toggleFavorite(id, isFavorite)
    }

    suspend fun setReflection(id: Long, untilTimestamp: Long) = withContext(Dispatchers.IO) {
        db.purchaseAnalysisDao().updateReflection(id, untilTimestamp, "ACTIVE")
    }

    // --- Saving Goals ---
    fun getSavingGoalsFlow(userId: Long): Flow<List<SavingGoalEntity>> = db.savingGoalDao().getGoalsFlow(userId)

    suspend fun addSavingGoal(goal: SavingGoalEntity) = withContext(Dispatchers.IO) {
        db.savingGoalDao().insertGoal(goal)
    }

    suspend fun updateSavingGoal(goal: SavingGoalEntity) = withContext(Dispatchers.IO) {
        db.savingGoalDao().updateGoal(goal)
    }

    suspend fun deleteSavingGoal(id: Long) = withContext(Dispatchers.IO) {
        db.savingGoalDao().deleteGoalById(id)
    }

    // --- Categories ---
    fun getAllCategoriesFlow(): Flow<List<CategoryEntity>> = db.categoryDao().getAllCategoriesFlow()

    suspend fun addCategory(name: String) = withContext(Dispatchers.IO) {
        db.categoryDao().insertCategory(CategoryEntity(name = name.trim(), isCustom = true))
    }

    // --- Export in JSON and CSV ---
    suspend fun exportDataJson(userId: Long): String = withContext(Dispatchers.IO) {
        val user = _currentUser.value
        val profile = db.financialProfileDao().getProfile(userId)
        val expenses = db.expenseDao().getExpensesList(userId)
        val analyses = db.purchaseAnalysisDao().getAllAnalysesList(userId)
        val goals = db.savingGoalDao().getGoalsList(userId)

        val root = JSONObject()
        root.put("exportDate", SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()))
        root.put("app", "Custo de Vida")

        // User info
        val userJson = JSONObject()
        userJson.put("name", user?.name)
        userJson.put("email", user?.email)
        userJson.put("currency", user?.currency)
        root.put("user", userJson)

        // Financial Profile
        if (profile != null) {
            val profJson = JSONObject()
            profJson.put("grossSalary", profile.grossSalary)
            profJson.put("netSalary", profile.netSalary)
            profJson.put("hoursPerMonth", profile.hoursPerMonth)
            profJson.put("hoursPerDay", profile.hoursPerDay)
            root.put("financialProfile", profJson)
        }

        // Expenses
        val expArr = JSONArray()
        expenses.forEach { exp ->
            val obj = JSONObject()
            obj.put("category", exp.category)
            obj.put("name", exp.name)
            obj.put("amount", exp.amount)
            obj.put("isEssential", exp.isEssential)
            expArr.put(obj)
        }
        root.put("expenses", expArr)

        // Analyses
        val analysesArr = JSONArray()
        analyses.forEach { a ->
            val obj = JSONObject()
            obj.put("productName", a.productName)
            obj.put("category", a.category)
            obj.put("price", a.price)
            obj.put("workHours", a.workHours)
            obj.put("workDays", a.workDays)
            obj.put("decision", a.decision)
            obj.put("moneySaved", a.moneySaved)
            obj.put("hoursPreserved", a.hoursPreserved)
            obj.put("date", SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(a.timestamp)))
            analysesArr.put(obj)
        }
        root.put("purchaseAnalyses", analysesArr)

        // Goals
        val goalsArr = JSONArray()
        goals.forEach { g ->
            val obj = JSONObject()
            obj.put("title", g.title)
            obj.put("targetAmount", g.targetAmount)
            obj.put("currentAmount", g.currentAmount)
            obj.put("monthlyContribution", g.monthlyContribution)
            goalsArr.put(obj)
        }
        root.put("savingGoals", goalsArr)

        root.toString(2)
    }

    suspend fun exportDataCsv(userId: Long): String = withContext(Dispatchers.IO) {
        val analyses = db.purchaseAnalysisDao().getAllAnalysesList(userId)
        val sb = StringBuilder()
        sb.append("ID,Produto,Categoria,Preco,HorasTrabalho,DiasTrabalho,Decisao,EconomiaReais,HorasPreservadas,Data\n")
        val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
        analyses.forEach { a ->
            val dateStr = sdf.format(Date(a.timestamp))
            sb.append("${a.id},\"${a.productName.replace("\"", "\"\"")}\",\"${a.category}\",${a.price},${a.workHours},${a.workDays},${a.decision},${a.moneySaved},${a.hoursPreserved},\"$dateStr\"\n")
        }
        sb.toString()
    }

    // --- Comparison Folders & Items ---
    fun getComparisonFoldersFlow(userId: Long = 1): Flow<List<com.example.data.local.entities.ComparisonFolderEntity>> {
        return db.comparisonDao().getFoldersFlow(userId)
    }

    fun getComparisonItemsFlow(): Flow<List<com.example.data.local.entities.ComparisonItemEntity>> {
        return db.comparisonDao().getAllItemsFlow()
    }

    suspend fun createComparisonFolder(title: String, userId: Long = 1): Long = withContext(Dispatchers.IO) {
        val folder = com.example.data.local.entities.ComparisonFolderEntity(
            userId = userId,
            title = title.trim()
        )
        db.comparisonDao().insertFolder(folder)
    }

    suspend fun deleteComparisonFolder(folderId: Long) = withContext(Dispatchers.IO) {
        db.comparisonDao().deleteItemsByFolder(folderId)
        db.comparisonDao().deleteFolder(folderId)
    }

    suspend fun addComparisonItem(folderId: Long, name: String, price: Double): Long = withContext(Dispatchers.IO) {
        val item = com.example.data.local.entities.ComparisonItemEntity(
            folderId = folderId,
            name = name.trim(),
            price = price
        )
        db.comparisonDao().insertItem(item)
    }

    suspend fun deleteComparisonItem(itemId: Long) = withContext(Dispatchers.IO) {
        db.comparisonDao().deleteItem(itemId)
    }

    private fun hashPassword(password: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(password.toByteArray())
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}
