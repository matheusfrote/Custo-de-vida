package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.local.dao.CategoryDao
import com.example.data.local.dao.ComparisonDao
import com.example.data.local.dao.ExpenseDao
import com.example.data.local.dao.FinancialProfileDao
import com.example.data.local.dao.PurchaseAnalysisDao
import com.example.data.local.dao.SavingGoalDao
import com.example.data.local.dao.UserDao
import com.example.data.local.entities.CategoryEntity
import com.example.data.local.entities.ComparisonFolderEntity
import com.example.data.local.entities.ComparisonItemEntity
import com.example.data.local.entities.ExpenseEntity
import com.example.data.local.entities.FinancialProfileEntity
import com.example.data.local.entities.PurchaseAnalysisEntity
import com.example.data.local.entities.SavingGoalEntity
import com.example.data.local.entities.UserEntity

@Database(
    entities = [
        UserEntity::class,
        FinancialProfileEntity::class,
        ExpenseEntity::class,
        PurchaseAnalysisEntity::class,
        SavingGoalEntity::class,
        CategoryEntity::class,
        ComparisonFolderEntity::class,
        ComparisonItemEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun financialProfileDao(): FinancialProfileDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun purchaseAnalysisDao(): PurchaseAnalysisDao
    abstract fun savingGoalDao(): SavingGoalDao
    abstract fun categoryDao(): CategoryDao
    abstract fun comparisonDao(): ComparisonDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "quanto_custa_meu_tempo.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
