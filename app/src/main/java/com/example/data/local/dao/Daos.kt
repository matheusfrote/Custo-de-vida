package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.local.entities.CategoryEntity
import com.example.data.local.entities.ExpenseEntity
import com.example.data.local.entities.FinancialProfileEntity
import com.example.data.local.entities.PurchaseAnalysisEntity
import com.example.data.local.entities.SavingGoalEntity
import com.example.data.local.entities.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity): Long

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUserById(id: Long): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users ORDER BY id ASC LIMIT 1")
    suspend fun getFirstUser(): UserEntity?

    @Query("DELETE FROM users WHERE id = :id")
    suspend fun deleteUserById(id: Long)
}

@Dao
interface FinancialProfileDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProfile(profile: FinancialProfileEntity)

    @Query("SELECT * FROM financial_profiles WHERE userId = :userId LIMIT 1")
    suspend fun getProfile(userId: Long): FinancialProfileEntity?

    @Query("SELECT * FROM financial_profiles WHERE userId = :userId LIMIT 1")
    fun getProfileFlow(userId: Long): Flow<FinancialProfileEntity?>
}

@Dao
interface ExpenseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity): Long

    @Update
    suspend fun updateExpense(expense: ExpenseEntity)

    @Query("DELETE FROM expenses WHERE id = :id")
    suspend fun deleteExpenseById(id: Long)

    @Query("SELECT * FROM expenses WHERE userId = :userId ORDER BY amount DESC")
    fun getExpensesFlow(userId: Long): Flow<List<ExpenseEntity>>

    @Query("SELECT * FROM expenses WHERE userId = :userId")
    suspend fun getExpensesList(userId: Long): List<ExpenseEntity>

    @Query("SELECT COALESCE(SUM(amount), 0.0) FROM expenses WHERE userId = :userId AND isEssential = 1")
    fun getEssentialExpensesSumFlow(userId: Long): Flow<Double>
}

@Dao
interface PurchaseAnalysisDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnalysis(item: PurchaseAnalysisEntity): Long

    @Update
    suspend fun updateAnalysis(item: PurchaseAnalysisEntity)

    @Query("DELETE FROM purchase_analyses WHERE id = :id")
    suspend fun deleteAnalysisById(id: Long)

    @Query("SELECT * FROM purchase_analyses WHERE id = :id LIMIT 1")
    suspend fun getAnalysisById(id: Long): PurchaseAnalysisEntity?

    @Query("SELECT * FROM purchase_analyses WHERE userId = :userId ORDER BY timestamp DESC")
    fun getAllAnalysesFlow(userId: Long): Flow<List<PurchaseAnalysisEntity>>

    @Query("SELECT * FROM purchase_analyses WHERE userId = :userId ORDER BY timestamp DESC")
    suspend fun getAllAnalysesList(userId: Long): List<PurchaseAnalysisEntity>

    @Query("UPDATE purchase_analyses SET decision = :decision, decisionDate = :decisionDate, moneySaved = :moneySaved, hoursPreserved = :hoursPreserved WHERE id = :id")
    suspend fun updateDecision(id: Long, decision: String, decisionDate: Long, moneySaved: Double, hoursPreserved: Double)

    @Query("UPDATE purchase_analyses SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun toggleFavorite(id: Long, isFavorite: Boolean)

    @Query("UPDATE purchase_analyses SET reflectionUntil = :until, reflectionStatus = :status WHERE id = :id")
    suspend fun updateReflection(id: Long, until: Long?, status: String?)
}

@Dao
interface SavingGoalDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: SavingGoalEntity): Long

    @Update
    suspend fun updateGoal(goal: SavingGoalEntity)

    @Query("DELETE FROM saving_goals WHERE id = :id")
    suspend fun deleteGoalById(id: Long)

    @Query("SELECT * FROM saving_goals WHERE userId = :userId ORDER BY id DESC")
    fun getGoalsFlow(userId: Long): Flow<List<SavingGoalEntity>>

    @Query("SELECT * FROM saving_goals WHERE userId = :userId ORDER BY id DESC")
    suspend fun getGoalsList(userId: Long): List<SavingGoalEntity>
}

@Dao
interface CategoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(cat: CategoryEntity): Long

    @Query("SELECT * FROM categories ORDER BY id ASC")
    fun getAllCategoriesFlow(): Flow<List<CategoryEntity>>

    @Query("DELETE FROM categories WHERE id = :id")
    suspend fun deleteCategoryById(id: Long)

    @Query("SELECT COUNT(*) FROM categories")
    suspend fun count(): Int
}

@Dao
interface ComparisonDao {
    @Query("SELECT * FROM comparison_folders WHERE userId = :userId ORDER BY createdAt DESC")
    fun getFoldersFlow(userId: Long): Flow<List<com.example.data.local.entities.ComparisonFolderEntity>>

    @Query("SELECT * FROM comparison_items WHERE folderId = :folderId ORDER BY price ASC")
    fun getItemsForFolderFlow(folderId: Long): Flow<List<com.example.data.local.entities.ComparisonItemEntity>>

    @Query("SELECT * FROM comparison_items ORDER BY price ASC")
    fun getAllItemsFlow(): Flow<List<com.example.data.local.entities.ComparisonItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFolder(folder: com.example.data.local.entities.ComparisonFolderEntity): Long

    @Query("DELETE FROM comparison_folders WHERE id = :folderId")
    suspend fun deleteFolder(folderId: Long)

    @Query("DELETE FROM comparison_items WHERE folderId = :folderId")
    suspend fun deleteItemsByFolder(folderId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: com.example.data.local.entities.ComparisonItemEntity): Long

    @Query("DELETE FROM comparison_items WHERE id = :itemId")
    suspend fun deleteItem(itemId: Long)
}

