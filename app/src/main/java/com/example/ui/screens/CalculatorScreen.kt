package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.domain.engine.FinancialEngine
import com.example.domain.model.PurchaseDecision
import com.example.ui.viewmodel.AppTab
import com.example.domain.model.ReflectionDuration
import com.example.ui.dialogs.ReflectionDialog
import com.example.ui.theme.*
import com.example.ui.viewmodel.QuantoCustaViewModel

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CalculatorScreen(viewModel: QuantoCustaViewModel) {
    val productName by viewModel.productNameInput.collectAsState()
    val priceInput by viewModel.priceInput.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val calculation by viewModel.currentCalculation.collectAsState()
    val installmentResult by viewModel.installmentResult.collectAsState()
    val opportunityCost by viewModel.opportunityCostResult.collectAsState()
    val recurringCost by viewModel.recurringCostResult.collectAsState()
    val profile by viewModel.financialProfile.collectAsState()

    val focusManager = LocalFocusManager.current
    var showReflectionDialog by remember { mutableStateOf(false) }

    // Section expansions
    var showInstallmentTool by remember { mutableStateOf(false) }
    var showOpportunityTool by remember { mutableStateOf(false) }
    var showRecurringTool by remember { mutableStateOf(false) }

    // Installment inputs
    var installmentCount by remember { mutableIntStateOf(12) }
    var interestRate by remember { mutableStateOf("2.5") }
    var downPayment by remember { mutableStateOf("0") }

    // Opportunity cost inputs
    var oppYears by remember { mutableIntStateOf(5) }
    var oppRate by remember { mutableStateOf("11.5") }

    // Recurring inputs
    var recurringAmount by remember { mutableStateOf("30") }
    var recurringIsDaily by remember { mutableStateOf(true) }

    if (showReflectionDialog) {
        ReflectionDialog(
            onDismiss = { showReflectionDialog = false },
            onSelectDuration = { duration ->
                viewModel.setReflectionPeriod(duration)
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- HERO HEADER ---
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp)),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.HourglassEmpty,
                        contentDescription = null,
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "CONVERSOR DE PREÇO EM TEMPO",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = EmeraldPrimary,
                        letterSpacing = 1.sp
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "QUANTO DA SUA VIDA ISSO CUSTA?",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(10.dp))

                Surface(
                    color = EmeraldContainer.copy(alpha = 0.35f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.clickable { viewModel.setTab(AppTab.SETTINGS) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Tune,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Sua hora líquida: ${FinancialEngine.formatCurrency(profile.netSalary / profile.hoursPerMonth)} • Configurar",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // --- INPUT CARD ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                OutlinedTextField(
                    value = productName,
                    onValueChange = { viewModel.onProductNameChange(it) },
                    label = { Text("O que você quer comprar? (opcional)") },
                    placeholder = { Text("Ex: Notebook, Smartphone, Tênis...") },
                    leadingIcon = { Icon(Icons.Default.ShoppingBag, contentDescription = null, tint = EmeraldPrimary) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = priceInput,
                    onValueChange = { viewModel.onPriceChange(it) },
                    label = { Text("Preço do Produto") },
                    placeholder = { Text("0,00") },
                    prefix = { Text("R$ ", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = {
                        focusManager.clearFocus()
                        viewModel.calculateFromInputs()
                    }),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    textStyle = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Categories chips
                Text(
                    text = "Categoria:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(categories) { cat ->
                        FilterChip(
                            selected = (cat == selectedCategory),
                            onClick = { viewModel.onCategoryChange(cat) },
                            label = { Text(cat, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary,
                                selectedLabelColor = Color.Black
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Primary Calculate Button
                Button(
                    onClick = {
                        focusManager.clearFocus()
                        viewModel.calculateFromInputs()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Icon(Icons.Default.Calculate, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "CALCULAR MEU TEMPO",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.Black
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Link import button
                OutlinedButton(
                    onClick = { viewModel.openLinkImportDialog() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Link, contentDescription = null, modifier = Modifier.size(18.dp), tint = EmeraldPrimary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Colar Link de Loja (Amazon, ML, etc.)", fontSize = 13.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // --- HIGH IMPACT RESULT DISPLAY ---
        calculation?.let { calc ->
            AnimatedVisibility(
                visible = true,
                enter = fadeIn() + slideInVertically()
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                width = 1.5.dp,
                                brush = Brush.linearGradient(
                                    listOf(EmeraldPrimary, EmeraldContainer, AccentGold)
                                ),
                                shape = RoundedCornerShape(24.dp)
                            ),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier.padding(22.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = FinancialEngine.formatCurrency(calc.price),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "=",
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))

                            // Giant Highlight
                            Text(
                                text = calc.timeFormatted,
                                style = MaterialTheme.typography.displayMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 42.sp,
                                    letterSpacing = (-1).sp
                                ),
                                color = EmeraldPrimary,
                                textAlign = TextAlign.Center
                            )

                            Text(
                                text = "DO SEU TEMPO DE VIDA TRABALHANDO",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                                letterSpacing = 1.sp
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                            Spacer(modifier = Modifier.height(16.dp))

                            // Sub-metrics Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                MetricPill(
                                    title = "Jornada",
                                    value = calc.daysFormatted,
                                    icon = Icons.Default.CalendarToday
                                )
                                MetricPill(
                                    title = "% Salário",
                                    value = "${String.format("%.1f", calc.salaryPercentage)}%",
                                    icon = Icons.Default.PieChart
                                )
                                val disposableRate = if (calc.disposableHourlyRate > 0) calc.disposableHourlyRate else calc.netHourlyRate
                                val rendaLivreTimeFormatted = FinancialEngine.formatAdaptiveWorkTime(
                                    amount = calc.price,
                                    hourlyRate = disposableRate,
                                    weeklyHours = if (profile.hoursPerDay > 0 && profile.daysPerWeek > 0) profile.hoursPerDay * profile.daysPerWeek else 40.0,
                                    hoursPerMonth = if (profile.hoursPerMonth > 0) profile.hoursPerMonth else 176.0
                                )
                                MetricPill(
                                    title = "Renda Livre",
                                    value = rendaLivreTimeFormatted.replace(" de trabalho", ""),
                                    icon = Icons.Default.Savings
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Interpretation phrases
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Lightbulb, contentDescription = null, tint = AccentGold, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Interpretação do Impacto Real",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            calc.interpretationPhrases.forEach { phrase ->
                                Row(
                                    modifier = Modifier.padding(vertical = 3.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Text("• ", color = EmeraldPrimary, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = phrase,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Actions Bar: Comprei / Desisti / Pensar / Compartilhar
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { viewModel.saveCurrentAnalysis(PurchaseDecision.PURCHASED) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSecondaryContainer)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Comprei", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSecondaryContainer)
                        }

                        Button(
                            onClick = {
                                viewModel.saveCurrentAnalysis(PurchaseDecision.GIVEN_UP)
                                viewModel.prepareShareCard(isGivenUp = true)
                            },
                            modifier = Modifier.weight(1.2f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.Black)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Desisti (Salvar)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }

                        IconButton(
                            onClick = { showReflectionDialog = true },
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Icon(Icons.Default.Bedtime, contentDescription = "Pensar antes de comprar", tint = AccentGold)
                        }

                        IconButton(
                            onClick = { viewModel.prepareShareCard() },
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = "Compartilhar", tint = EmeraldPrimary)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // --- EXPANDABLE ADVANCED TOOLS ACCORDION ---
        Text(
            text = "SIMULAÇÕES & IMPACTO FINANCEIRO",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        // 1. Tool: Parcelamento & Juros
        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showInstallmentTool = !showInstallmentTool },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CreditCard, contentDescription = null, tint = EmeraldPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Simular Parcelamento & Juros",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Icon(
                        if (showInstallmentTool) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null
                    )
                }

                if (showInstallmentTool) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Descubra quantas horas você precisará trabalhar exclusivamente para pagar os juros do parcelamento.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = installmentCount.toString(),
                            onValueChange = { installmentCount = it.toIntOrNull() ?: 1 },
                            label = { Text("Parcelas") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = interestRate,
                            onValueChange = { interestRate = it },
                            label = { Text("Juros (% ao mês)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        onClick = {
                            val rate = interestRate.replace(",", ".").toDoubleOrNull() ?: 0.0
                            val down = downPayment.replace(",", ".").toDoubleOrNull() ?: 0.0
                            viewModel.simulateInstallments(
                                count = installmentCount,
                                interestPercent = rate,
                                downPayment = down
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Calcular Juros em Horas", color = Color.Black, fontWeight = FontWeight.Bold)
                    }

                    installmentResult?.let { inst ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "${inst.installmentCount}x de ${FinancialEngine.formatCurrency(inst.installmentAmount)} = Total ${FinancialEngine.formatCurrency(inst.totalPaid)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Juros totais: ${FinancialEngine.formatCurrency(inst.totalInterest)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = DangerRed
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "⚡ ${inst.interestPhrase}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = AccentGold
                                )
                            }
                        }
                    }
                }
            }
        }

        // 2. Tool: Custo de Oportunidade
        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showOpportunityTool = !showOpportunityTool },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.TrendingUp, contentDescription = null, tint = AccentGold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Custo de Oportunidade (E se investisse?)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Icon(
                        if (showOpportunityTool) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null
                    )
                }

                if (showOpportunityTool) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Se em vez de comprar você investisse esse valor a juros compostos:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = oppYears.toString(),
                            onValueChange = { oppYears = it.toIntOrNull() ?: 5 },
                            label = { Text("Prazo (Anos)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = oppRate,
                            onValueChange = { oppRate = it },
                            label = { Text("Rentabilidade % a.a.") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        onClick = {
                            val r = oppRate.replace(",", ".").toDoubleOrNull() ?: 10.5
                            viewModel.simulateOpportunityCost(years = oppYears, ratePercent = r)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = AccentGold)
                    ) {
                        Text("Simular Rendimento Futuro", color = Color.Black, fontWeight = FontWeight.Bold)
                    }

                    opportunityCost?.let { opp ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Valor projetado em ${opp.years} anos: ${FinancialEngine.formatCurrency(opp.futureValue)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                                Text(
                                    text = "Lucro limpo gerado: ${FinancialEngine.formatCurrency(opp.totalEarned)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Text(
                                    text = "Equivale a acumular ${opp.futureWorkHoursEquivalent.toInt()}h de tempo livre no futuro!",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "* Esta é uma simulação matemática e não constitui recomendação de investimento.",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 3. Tool: Custo Recorrente / Assinaturas
        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showRecurringTool = !showRecurringTool },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Repeat, contentDescription = null, tint = EmeraldLight)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Analisar Assinatura ou Gasto Diário",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Icon(
                        if (showRecurringTool) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null
                    )
                }

                if (showRecurringTool) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Ex: R$ 20/dia de delivery ou R$ 59,90/mês de streaming somam uma quantia assustadora de tempo ao longo dos anos.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = recurringAmount,
                            onValueChange = { recurringAmount = it },
                            label = { Text("Valor (R$)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            FilterChip(
                                selected = recurringIsDaily,
                                onClick = { recurringIsDaily = true },
                                label = { Text("Diário") }
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            FilterChip(
                                selected = !recurringIsDaily,
                                onClick = { recurringIsDaily = false },
                                label = { Text("Mensal") }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        onClick = {
                            val v = recurringAmount.replace(",", ".").toDoubleOrNull() ?: 20.0
                            viewModel.simulateRecurringCost("Gasto Recorrente", v, recurringIsDaily)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Calcular Custo ao Longo do Tempo", color = Color.Black, fontWeight = FontWeight.Bold)
                    }

                    recurringCost?.let { rec ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "1 Mês: ${FinancialEngine.formatCurrency(rec.monthlyCost)} (${rec.monthlyHours.toInt()}h de trabalho)",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                Text(
                                    text = "1 Ano: ${FinancialEngine.formatCurrency(rec.yearlyCost)} (${rec.yearlyHours.toInt()}h de trabalho)",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "5 Anos: ${FinancialEngine.formatCurrency(rec.fiveYearCost)} (${rec.fiveYearHours.toInt()}h de trabalho)",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = rec.interpretation,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
private fun MetricPill(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(horizontal = 4.dp)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = EmeraldPrimary)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
