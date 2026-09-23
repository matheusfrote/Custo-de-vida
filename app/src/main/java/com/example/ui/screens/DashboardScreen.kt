package com.example.ui.screens

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.domain.engine.FinancialEngine
import com.example.ui.dialogs.AddExpenseDialog
import com.example.ui.theme.AccentGold
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.viewmodel.QuantoCustaViewModel
import kotlin.math.roundToInt

@Composable
fun DashboardScreen(viewModel: QuantoCustaViewModel) {
    val metrics by viewModel.dashboardMetrics.collectAsState()
    val profile by viewModel.financialProfile.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val essentialExpensesSum by viewModel.essentialExpensesSum.collectAsState()

    var showAddExpenseDialog by remember { mutableStateOf(false) }

    val hourlyRate = if (profile.hoursPerMonth > 0) profile.netSalary / profile.hoursPerMonth else 28.41
    val weeklyHoursValue = (profile.hoursPerDay * profile.daysPerWeek).coerceAtLeast(1.0)
    val freeIncome = (profile.netSalary - essentialExpensesSum).coerceAtLeast(0.0)

    if (showAddExpenseDialog) {
        AddExpenseDialog(
            onDismiss = { showAddExpenseDialog = false },
            onAdd = { category, name, amount, isEssential ->
                viewModel.addExpense(category, name, amount, isEssential)
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Hero Victory Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.5.dp, EmeraldPrimary, RoundedCornerShape(22.dp)),
                colors = CardDefaults.cardColors(containerColor = EmeraldContainer.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(22.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(28.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SEU TEMPO DE VIDA PRESERVADO",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "${metrics.hoursPreserved.toInt()} horas",
                        style = MaterialTheme.typography.displaySmall,
                        fontWeight = FontWeight.Black,
                        color = EmeraldPrimary
                    )

                    Text(
                        text = "de esforço e trabalho não desperdiçados em compras por impulso.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Economia Real: ${FinancialEngine.formatCurrency(metrics.moneySaved)}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${metrics.purchasesAvoidedCount} compras evitadas",
                            style = MaterialTheme.typography.bodyMedium,
                            color = AccentGold,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // 2x2 Grid of Metrics
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Tempo Analisado",
                    value = "${metrics.totalWorkHoursAnalyzed.toInt()}h",
                    sub = "${String.format("%.1f", metrics.totalWorkDaysAnalyzed)} dias de vida",
                    icon = Icons.Default.HourglassBottom,
                    tint = EmeraldPrimary
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Total em Reais",
                    value = FinancialEngine.formatCurrency(metrics.totalMoneyAnalyzed),
                    sub = "${metrics.totalAnalysesCount} análises feitas",
                    icon = Icons.Default.AttachMoney,
                    tint = AccentGold
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val winRate = if (metrics.totalAnalysesCount > 0) {
                    (metrics.purchasesAvoidedCount.toDouble() / metrics.totalAnalysesCount * 100).toInt()
                } else 0

                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Taxa de Vitória",
                    value = "$winRate%",
                    sub = "Decisões de desistência",
                    icon = Icons.Default.EmojiEvents,
                    tint = AccentGold
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    title = "Compras Feitas",
                    value = metrics.purchasesCompletedCount.toString(),
                    sub = FinancialEngine.formatCurrency(metrics.moneySpent),
                    icon = Icons.Default.ShoppingBag,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // --- O QUE ISSO SIGNIFICA NA PRÁTICA? ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Insights, contentDescription = null, tint = EmeraldPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "O Que Isso Significa na Prática?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Veja quanto tempo da sua vida custam compras do dia a dia com sua hora líquida atual (${FinancialEngine.formatCurrency(hourlyRate)}/h):",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    fun formatDemoTime(price: Double): String {
                        if (hourlyRate <= 0) return "0 min"
                        val totalMinutes = (price / hourlyRate * 60).roundToInt()
                        val hours = totalMinutes / 60
                        val mins = totalMinutes % 60
                        return if (hours > 0) "${hours}h ${mins}min" else "${mins}min"
                    }

                    val examples = listOf(
                        Triple("☕ Café ou lanche rápido", 15.0, formatDemoTime(15.0)),
                        Triple("🍕 Almoço ou jantar fora", 80.0, formatDemoTime(80.0)),
                        Triple("👟 Tênis esportivo", 350.0, formatDemoTime(350.0)),
                        Triple("📱 Smartphone moderno", 2500.0, formatDemoTime(2500.0)),
                        Triple("💻 Notebook de trabalho", 4800.0, formatDemoTime(4800.0))
                    )

                    examples.forEach { (itemTitle, price, timeEquivalent) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(itemTitle, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                Text(
                                    FinancialEngine.formatCurrency(price),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Surface(
                                color = EmeraldPrimary.copy(alpha = 0.12f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = timeEquivalent,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                            }
                        }
                        if (itemTitle != examples.last().first) {
                            HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                        }
                    }
                }
            }
        }

        // --- CUSTOS FIXOS & RENDA LIVRE ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Custos Fixos & Renda Livre",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            val essentialTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = essentialExpensesSum,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = profile.hoursPerMonth
                            )
                            val freeIncomeTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = freeIncome,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = profile.hoursPerMonth
                            )
                            Text(
                                text = "Custos Fixos: ${FinancialEngine.formatCurrency(essentialExpensesSum)} ($essentialTime)",
                                style = MaterialTheme.typography.bodySmall,
                                color = EmeraldPrimary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Renda Livre: ${FinancialEngine.formatCurrency(freeIncome)} ($freeIncomeTime)",
                                style = MaterialTheme.typography.bodySmall,
                                color = AccentGold,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        IconButton(onClick = { showAddExpenseDialog = true }) {
                            Icon(Icons.Default.AddCircle, contentDescription = "Adicionar despesa", tint = EmeraldPrimary, modifier = Modifier.size(28.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (expenses.isEmpty()) {
                        Text(
                            text = "Nenhum custo fixo cadastrado. Cadastre suas contas essenciais (aluguel, água, luz, internet) para saber sua renda livre.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        expenses.forEach { exp ->
                            val expTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = exp.amount,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = profile.hoursPerMonth
                            )
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(exp.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                                    Text(
                                        "${if (exp.isEssential) "Essencial" else "Opcional"} • $expTime",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    FinancialEngine.formatCurrency(exp.amount),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                IconButton(
                                    onClick = { viewModel.deleteExpense(exp.id) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                                }
                            }
                            HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                        }
                    }
                }
            }
        }

        // Categories distribution
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PieChart, contentDescription = null, tint = EmeraldPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Distribuição por Categoria",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (metrics.topCategories.isEmpty()) {
                        Text(
                            text = "Nenhuma análise categorizada ainda.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        val maxCat = metrics.totalMoneyAnalyzed.coerceAtLeast(1.0)
                        metrics.topCategories.forEach { (catName, amount) ->
                            val pct = (amount / maxCat).toFloat().coerceIn(0f, 1f)
                            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(catName, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                                    Text(
                                        "${FinancialEngine.formatCurrency(amount)} (${(pct * 100).toInt()}%)",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                LinearProgressIndicator(
                                    progress = { pct },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(3.dp)),
                                    color = EmeraldPrimary,
                                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Philosophy & Financial consciousness tip
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = AccentGold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Filosofia do Tempo de Vida",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Dinheiro é tempo de vida materializado. Quando você compra algo, você não paga apenas com dinheiro: paga com as horas da sua juventude, saúde e esforço que foram necessárias para ganhá-lo. Cada compra evitada é tempo recuperado para você.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    sub: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    tint: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
