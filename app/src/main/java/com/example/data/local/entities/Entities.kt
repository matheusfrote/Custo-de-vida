package com.example.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val email: String,
    val passwordHash: String,
    val currency: String = "BRL",
    val country: String = "Brasil",
    val language: String = "pt-BR",
    val isGuest: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "financial_profiles")
data class FinancialProfileEntity(
    @PrimaryKey val userId: Long = 1,
    val grossSalary: Double = 6000.0,
    val netSalary: Double = 5000.0,
    val incomeType: String = "MONTHLY",
    val hoursPerDay: Double = 8.0,
    val daysPerWeek: Double = 5.0,
    val hoursPerMonth: Double = 176.0
)

@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long = 1,
    val category: String,
    val name: String,
    val amount: Double,
    val isEssential: Boolean = true
)

@Entity(tableName = "purchase_analyses")
data class PurchaseAnalysisEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
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
    val decision: String = "PENDING", // PENDING, PURCHASED, GIVEN_UP
    val decisionDate: Long? = null,
    val moneySaved: Double = 0.0,
    val hoursPreserved: Double = 0.0,
    val reflectionUntil: Long? = null,
    val reflectionStatus: String? = null, // ACTIVE, EXPIRED, DECIDED
    val isFavorite: Boolean = false
)

@Entity(tableName = "saving_goals")
data class SavingGoalEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long = 1,
    val title: String,
    val targetAmount: Double,
    val currentAmount: Double = 0.0,
    val monthlyContribution: Double = 500.0
)

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val iconName: String = "Category",
    val isCustom: Boolean = false
)

@Entity(tableName = "comparison_folders")
data class ComparisonFolderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long = 1,
    val title: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "comparison_items")
data class ComparisonItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val folderId: Long,
    val name: String,
    val price: Double,
    val createdAt: Long = System.currentTimeMillis()
)

