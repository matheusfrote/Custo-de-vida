package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.entities.SavingGoalEntity
import com.example.domain.engine.FinancialEngine
import com.example.ui.dialogs.AddGoalDialog
import com.example.ui.theme.AccentGold
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.OnEmeraldContainer
import com.example.ui.viewmodel.QuantoCustaViewModel
import kotlin.math.roundToInt

@Composable
fun GoalsScreen(viewModel: QuantoCustaViewModel) {
    val goals by viewModel.goals.collectAsState()
    val profile by viewModel.financialProfile.collectAsState()
    val essentialExpensesSum by viewModel.essentialExpensesSum.collectAsState()

    var showAddGoalDialog by remember { mutableStateOf(false) }
    var selectedGoalForDeposit by remember { mutableStateOf<SavingGoalEntity?>(null) }
    var depositAmount by remember { mutableStateOf("") }
    var filterType by remember { mutableStateOf("ALL") } // "ALL", "PURCHASE", "SAVINGS"

    val safeHourlyRate = if (profile.hoursPerMonth > 0) profile.netSalary / profile.hoursPerMonth else 28.41
    val freeIncome = (profile.netSalary - essentialExpensesSum).coerceAtLeast(1.0)
    val freeHourlyRate = freeIncome / profile.hoursPerMonth.coerceAtLeast(1.0)
    val hoursPerDay = profile.hoursPerDay.coerceAtLeast(1.0)

    val filteredGoals = when (filterType) {
        "PURCHASE" -> goals.filter { it.goalType == "PURCHASE" }
        "SAVINGS" -> goals.filter { it.goalType == "SAVINGS" }
        else -> goals
    }

    if (showAddGoalDialog) {
        AddGoalDialog(
            onDismiss = { showAddGoalDialog = false },
            onAdd = { title, target, current, monthly, goalType ->
                viewModel.addSavingGoal(title, target, current, monthly, goalType)
            },
            essentialExpenses = essentialExpensesSum,
            freeIncome = freeIncome
        )
    }

    selectedGoalForDeposit?.let { goal ->
        AlertDialog(
            onDismissRequest = { selectedGoalForDeposit = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (goal.goalType == "PURCHASE") Icons.Default.ShoppingCart else Icons.Default.Savings,
                        contentDescription = null,
                        tint = EmeraldPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (goal.goalType == "PURCHASE") "Aporte para Compra" else "Guardar na Poupança")
                }
            },
            text = {
                Column {
                    Text("Adicionar valor economizado para '${goal.title}':")
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = depositAmount,
                        onValueChange = { depositAmount = it },
                        label = { Text("Valor guardado (R$)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val v = depositAmount.replace(",", ".").toDoubleOrNull() ?: 0.0
                        if (v > 0.0) {
                            viewModel.updateSavingGoalProgress(goal, v)
                            depositAmount = ""
                            selectedGoalForDeposit = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Salvar Aporte", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedGoalForDeposit = null }) {
                    Text("Cancelar")
                }
            }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = EmeraldContainer.copy(alpha = 0.35f))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.HourglassTop, contentDescription = null, tint = EmeraldPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "METAS DE COMPRA & POUPANÇA",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Transforme objetivos em tempo real de vida",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Nas metas de compra, consideramos seus custos fixos (${FinancialEngine.formatCurrency(essentialExpensesSum)}/mês) para dizer as horas, dias ou meses reais de esforço livre necessários!",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Filter Tabs: Todas, Metas de Compra, Metas de Poupança
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = filterType == "ALL",
                        onClick = { filterType = "ALL" },
                        label = { Text("Todas (${goals.size})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.Black
                        )
                    )
                    FilterChip(
                        selected = filterType == "PURCHASE",
                        onClick = { filterType = "PURCHASE" },
                        leadingIcon = {
                            Icon(
                                Icons.Default.ShoppingCart,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (filterType == "PURCHASE") Color.Black else EmeraldPrimary
                            )
                        },
                        label = { Text("Metas de Compra (${goals.count { it.goalType == "PURCHASE" }})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.Black
                        )
                    )
                    FilterChip(
                        selected = filterType == "SAVINGS",
                        onClick = { filterType = "SAVINGS" },
                        leadingIcon = {
                            Icon(
                                Icons.Default.Savings,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (filterType == "SAVINGS") Color.Black else AccentGold
                            )
                        },
                        label = { Text("Poupança (${goals.count { it.goalType == "SAVINGS" }})") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.Black
                        )
                    )
                }
            }

            if (filteredGoals.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Flag, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.outline)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = if (filterType == "PURCHASE") "Nenhuma meta de compra cadastrada"
                                       else if (filterType == "SAVINGS") "Nenhuma meta de poupança cadastrada"
                                       else "Nenhuma meta criada ainda",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Toque no botão '+' abaixo para cadastrar seu objetivo!",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            items(filteredGoals) { goal ->
                val isPurchase = goal.goalType == "PURCHASE"
                val progress = if (goal.targetAmount > 0) (goal.currentAmount / goal.targetAmount).toFloat().coerceIn(0f, 1f) else 0f
                val remainingAmount = (goal.targetAmount - goal.currentAmount).coerceAtLeast(0.0)

                // Standard Nominal Time
                val nominalTargetHours = goal.targetAmount / safeHourlyRate
                val nominalRemainingHours = remainingAmount / safeHourlyRate

                // Real Time factoring in Fixed Living Expenses (Custos de Vida Fixos)
                // When fixed costs exist, disposable wage is freeHourlyRate instead of nominal hourlyRate:
                val realTargetHours = if (freeHourlyRate > 0) goal.targetAmount / freeHourlyRate else nominalTargetHours
                val realRemainingHours = if (freeHourlyRate > 0) remainingAmount / freeHourlyRate else nominalRemainingHours
                val realDays = realRemainingHours / hoursPerDay
                val realMonthsByContribution = if (goal.monthlyContribution > 0) remainingAmount / goal.monthlyContribution else 0.0
                val realMonthsByFreeIncome = if (freeIncome > 0) remainingAmount / freeIncome else 0.0

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = if (isPurchase) BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.4f)) else BorderStroke(1.dp, AccentGold.copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                // Goal Type Badge
                                Surface(
                                    color = if (isPurchase) EmeraldContainer else AccentGold.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            if (isPurchase) Icons.Default.ShoppingCart else Icons.Default.Savings,
                                            contentDescription = null,
                                            tint = if (isPurchase) EmeraldPrimary else AccentGold,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (isPurchase) "META DE COMPRA" else "META DE POUPANÇA",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isPurchase) EmeraldPrimary else AccentGold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = goal.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Valor Alvo: ${FinancialEngine.formatCurrency(goal.targetAmount)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            IconButton(onClick = { viewModel.deleteSavingGoal(goal.id) }) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error)
                            }
                        }

                        // Special Calculation Card for Purchase Goal factoring in Fixed Costs
                        if (isPurchase) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = EmeraldContainer.copy(alpha = 0.25f))
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Calculate,
                                            contentDescription = null,
                                            tint = EmeraldPrimary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Investimento Real (Livre de Custos Fixos):",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = EmeraldPrimary
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "${realRemainingHours.roundToInt()}h",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = EmeraldPrimary
                                            )
                                            Text(
                                                text = "Horas Livres",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "${String.format("%.1f", realDays)}d",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = EmeraldPrimary
                                            )
                                            Text(
                                                text = "Dias Úteis",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            val displayMonths = if (goal.monthlyContribution > 0) realMonthsByContribution else realMonthsByFreeIncome
                                            Text(
                                                text = "${String.format("%.1f", displayMonths)}m",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = EmeraldPrimary
                                            )
                                            Text(
                                                text = "Meses de Aporte",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = "Considerando seus custos fixos de ${FinancialEngine.formatCurrency(essentialExpensesSum)}, cada hora trabalhada rende ${FinancialEngine.formatCurrency(freeHourlyRate)} de dinheiro 100% livre.",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        } else {
                            // Savings Goal Freedom Metrics
                            Spacer(modifier = Modifier.height(10.dp))
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                color = AccentGold.copy(alpha = 0.1f)
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Shield, contentDescription = null, tint = AccentGold, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Equivale a ${(goal.targetAmount / safeHourlyRate).toInt()} horas de independência e segurança financeira.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Progress Bar
                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = if (isPurchase) EmeraldPrimary else AccentGold,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Guardado: ${FinancialEngine.formatCurrency(goal.currentAmount)} (${(progress * 100).toInt()}%)",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Faltam ${FinancialEngine.formatCurrency(remainingAmount)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isPurchase) EmeraldPrimary else AccentGold,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = { selectedGoalForDeposit = goal },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (isPurchase) EmeraldPrimary else AccentGold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                if (isPurchase) "+ Guardar para Compra" else "+ Aportar na Poupança",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(70.dp))
            }
        }

        FloatingActionButton(
            onClick = { showAddGoalDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp),
            containerColor = EmeraldPrimary,
            contentColor = Color.Black
        ) {
            Icon(Icons.Default.Add, contentDescription = "Nova Meta")
        }
    }
}
