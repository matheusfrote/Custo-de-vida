package com.example.ui.screens

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.domain.engine.FinancialEngine
import com.example.ui.dialogs.AddExpenseDialog
import com.example.ui.dialogs.AuthDialog
import com.example.ui.theme.AccentGold
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.OnEmeraldContainer
import com.example.ui.viewmodel.QuantoCustaViewModel
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun SettingsScreen(viewModel: QuantoCustaViewModel) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val coroutineScope = rememberCoroutineScope()

    val user by viewModel.currentUser.collectAsState()
    val profile by viewModel.financialProfile.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val essentialExpensesSum by viewModel.essentialExpensesSum.collectAsState()
    val showAuthDialog by viewModel.showAuthDialog.collectAsState()

    // Configuração principal: Salário Líquido e Horas Semanais
    val initialWeekly = if (profile.hoursPerDay > 0 && profile.daysPerWeek > 0) {
        (profile.hoursPerDay * profile.daysPerWeek).roundToInt()
    } else {
        40
    }

    var netSalaryInput by remember(profile.netSalary) {
        val initialVal = if (profile.netSalary % 1.0 == 0.0) {
            profile.netSalary.toLong().toString()
        } else {
            profile.netSalary.toString()
        }
        mutableStateOf(initialVal)
    }

    var weeklyHoursInput by remember(profile) {
        mutableStateOf(initialWeekly.toString())
    }

    var useCltDivisor by remember { mutableStateOf(false) }
    var showExplanation by remember { mutableStateOf(false) }

    var showAddExpenseDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    var showExtensionDialog by remember { mutableStateOf(false) }

    // Parse dinâmico para preview em tempo real
    val cleanNetText = netSalaryInput.replace(".", "").replace(",", ".").trim()
    val netValue = cleanNetText.toDoubleOrNull() ?: profile.netSalary
    val weeklyHoursValue = weeklyHoursInput.toDoubleOrNull()?.coerceIn(1.0, 100.0) ?: 40.0

    // Cálculo exato de horas no mês:
    // Média astronômica real (52 semanas / 12 meses = 4.3333 semanas/mês) OU padrão CLT (semanas * 5 = 200h ou 220h)
    val monthlyHours = if (useCltDivisor) {
        weeklyHoursValue * 5.0
    } else {
        weeklyHoursValue * (52.0 / 12.0)
    }

    val hourlyRate = if (monthlyHours > 0) netValue / monthlyHours else 0.0
    val minuteRate = if (hourlyRate > 0) hourlyRate / 60.0 else 0.0
    val dailyRate = hourlyRate * (weeklyHoursValue / 5.0)

    if (showAuthDialog) {
        AuthDialog(
            onDismiss = { viewModel.closeAuthDialog() },
            onLogin = { email, pass -> viewModel.login(email, pass) },
            onRegister = { name, email, pass -> viewModel.register(name, email, pass) },
            onRecover = { email -> viewModel.recoverPassword(email) }
        )
    }

    if (showAddExpenseDialog) {
        AddExpenseDialog(
            onDismiss = { showAddExpenseDialog = false },
            onAdd = { category, name, amount, isEssential ->
                viewModel.addExpense(category, name, amount, isEssential)
            }
        )
    }

    if (showTermsDialog) {
        AlertDialog(
            onDismissRequest = { showTermsDialog = false },
            title = { Text("Política de Privacidade & Termos") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "1. Seus dados financeiros (salário líquido, jornada de trabalho, despesas e compras) são mantidos estritamente confidenciais e armazenados apenas no seu aparelho.\n\n" +
                                "2. Ao compartilhar cards de tempo com amigos ou redes sociais, o aplicativo nunca divulga seu salário ou o valor em dinheiro da sua hora — apenas o tempo de vida equivalente.\n\n" +
                                "3. Você pode alterar sua base de cálculo ou excluir todos os dados a qualquer momento.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Button(onClick = { showTermsDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)) {
                    Text("Entendi", color = Color.Black)
                }
            }
        )
    }

    if (showExtensionDialog) {
        AlertDialog(
            onDismissRequest = { showExtensionDialog = false },
            title = { Text("Extensão para Navegador") },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "A extensão oficial 'Custo de Vida' para Chrome e Firefox converte os preços de lojas online diretamente em horas de trabalho com base no salário líquido e horas semanais configurados aqui.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Button(onClick = { showExtensionDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)) {
                    Text("OK", color = Color.Black)
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- HERO HEADER: CONFIGURAÇÃO DA BASE DE CÁLCULO ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(EmeraldContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.HourglassTop,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(30.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Configuração da Base de Tempo",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Insira seu salário líquido e suas horas semanais para que a conversão de preços em tempo de vida seja 100% precisa.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Surface(
                        color = EmeraldPrimary.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Speed,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Taxa Atual: ${FinancialEngine.formatCurrency(hourlyRate)}/h",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                    }
                }
            }
        }

        // --- FORMULÁRIO PRINCIPAL: SALÁRIO LÍQUIDO & HORAS SEMANAIS ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = EmeraldPrimary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Dados de Entrada",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        IconButton(onClick = { showExplanation = !showExplanation }) {
                            Icon(
                                if (showExplanation) Icons.Default.ExpandLess else Icons.Default.Info,
                                contentDescription = "Mais detalhes",
                                tint = EmeraldPrimary
                            )
                        }
                    }

                    AnimatedVisibility(visible = showExplanation) {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Por que pedimos apenas o salário líquido?",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "O salário líquido é o dinheiro real que cai na sua conta bancária após os descontos de impostos (INSS, IRRF) e benefícios. É sobre esse valor que o seu poder de compra se sustenta.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 1. CAMPO DE SALÁRIO MENSAL LÍQUIDO
                    Text(
                        text = "1. Salário Mensal Líquido (R$)",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = netSalaryInput,
                        onValueChange = { netSalaryInput = it },
                        label = { Text("Valor líquido que cai na sua conta") },
                        placeholder = { Text("5000,00") },
                        prefix = { Text("R$ ", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Next),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        textStyle = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Peça somente o valor líquido: impostos e deduções já devem estar descontados.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // 2. CAMPO DE HORAS DE TRABALHO SEMANAIS
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "2. Horas de Trabalho Semanais",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${weeklyHoursValue.roundToInt()}h / semana",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = weeklyHoursInput,
                        onValueChange = { weeklyHoursInput = it },
                        label = { Text("Horas semanais trabalhadas") },
                        placeholder = { Text("40") },
                        suffix = { Text("horas / semana") },
                        leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null, tint = EmeraldPrimary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Chips de atalho rápido para jornadas comuns
                    Text(
                        text = "Jornadas Comuns:",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            "20" to "20h (Meio período)",
                            "30" to "30h (6h/dia)",
                            "40" to "40h (8h/dia)",
                            "44" to "44h (CLT)"
                        ).forEach { (preset, label) ->
                            val isSelected = weeklyHoursInput == preset
                            FilterChip(
                                selected = isSelected,
                                onClick = { weeklyHoursInput = preset },
                                label = { Text(label, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldContainer,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Método de Divisor Mensal (Média Real Calendário vs Padrão CLT)
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "Base do Divisor Mensal:",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                FilterChip(
                                    selected = !useCltDivisor,
                                    onClick = { useCltDivisor = false },
                                    label = { Text("Média Real (4,33 semanas)", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldContainer,
                                        selectedLabelColor = Color.White
                                    )
                                )
                                FilterChip(
                                    selected = useCltDivisor,
                                    onClick = { useCltDivisor = true },
                                    label = { Text("Padrão CLT (Divisor 5x)", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldContainer,
                                        selectedLabelColor = Color.White
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = if (!useCltDivisor) {
                                    "Cálculo exato de calendário: 52 semanas ÷ 12 meses = ${(monthlyHours * 10).roundToInt() / 10.0}h no mês."
                                } else {
                                    "Convenção trabalhista CLT: jornada semanal × 5 = ${monthlyHours.roundToInt()}h no mês."
                                },
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // BOTÃO PRINCIPAL: SALVAR BASE DE CÁLCULO
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            viewModel.updateSalaryAndWeeklyHours(
                                netSalary = netValue,
                                weeklyHours = weeklyHoursValue,
                                useCltDivisor = useCltDivisor
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Salvar Base de Cálculo",
                            color = Color.Black,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }

        // --- PAINEL DE PRECISÃO: VALOR DA HORA, MINUTO E DIA ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldContainer)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "RESULTADO DA BASE DE CÁLCULO",
                            style = MaterialTheme.typography.labelSmall,
                            color = OnEmeraldContainer,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "${FinancialEngine.formatCurrency(hourlyRate)} / hora",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    HorizontalDivider(color = Color.White.copy(alpha = 0.15f))

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Valor por Minuto",
                                style = MaterialTheme.typography.labelSmall,
                                color = OnEmeraldContainer
                            )
                            Text(
                                text = FinancialEngine.formatCurrency(minuteRate),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Column {
                            Text(
                                text = "Valor por Dia Útil",
                                style = MaterialTheme.typography.labelSmall,
                                color = OnEmeraldContainer
                            )
                            Text(
                                text = FinancialEngine.formatCurrency(dailyRate),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Column {
                            Text(
                                text = "Horas / Mês",
                                style = MaterialTheme.typography.labelSmall,
                                color = OnEmeraldContainer
                            )
                            Text(
                                text = "${(monthlyHours * 10).roundToInt() / 10.0}h",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }

        // --- PAINEL: EXEMPLOS PRÁTICOS NA VIDA REAL ---
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

                    Spacer(modifier = Modifier.height(12.dp))

                    // Função auxiliar de formatação para demonstração
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
                        Triple("📱 Smartphone moderno", 2500.0, formatDemoTime(2500.0))
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

        // --- CUSTOS FIXOS & RENDA DISPONÍVEL (OPCIONAL) ---
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
                            val freeIncome = (netValue - essentialExpensesSum).coerceAtLeast(0.0)
                            val essentialTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = essentialExpensesSum,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = monthlyHours
                            )
                            val freeIncomeTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = freeIncome,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = monthlyHours
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
                            Icon(Icons.Default.AddCircle, contentDescription = "Adicionar despesa", tint = EmeraldPrimary)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (expenses.isEmpty()) {
                        Text(
                            text = "Nenhum custo fixo cadastrado. Cadastre aluguel, luz, internet se desejar ver sua hora livre além da hora líquida.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        expenses.take(4).forEach { exp ->
                            val expTime = FinancialEngine.formatAdaptiveWorkTime(
                                amount = exp.amount,
                                hourlyRate = hourlyRate,
                                weeklyHours = weeklyHoursValue,
                                hoursPerMonth = monthlyHours
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

        // --- CONTA & DADOS LOCAIS ---
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
                                text = user?.name ?: "Convidado",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (user?.isGuest == true) "Modo Convidado (Dados salvos localmente)" else user?.email ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        if (user?.isGuest == true) {
                            Button(
                                onClick = { viewModel.openAuthDialog() },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Criar Conta", fontSize = 12.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            OutlinedButton(
                                onClick = { viewModel.logout() },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Sair", fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                val json = viewModel.repository.exportDataJson(1)
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, json)
                                    type = "application/json"
                                }
                                context.startActivity(Intent.createChooser(sendIntent, "Exportar Dados (JSON)"))
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Exportar Meus Dados (JSON)")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                val csv = viewModel.repository.exportDataCsv(1)
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, csv)
                                    type = "text/csv"
                                }
                                context.startActivity(Intent.createChooser(sendIntent, "Exportar Histórico (CSV)"))
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.TableChart, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Exportar Histórico para Planilha (CSV)")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = { showExtensionDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Extension, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Extensão de Navegador (Info)")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = { viewModel.toggleOnboarding(true) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.HelpOutline, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Reiniciar Tutorial Interativo")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    TextButton(
                        onClick = { showTermsDialog = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Termos de Uso e Privacidade")
                    }
                }
            }
        }

        // --- ZONA DE PERIGO: LIMPAR DADOS ---
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Excluir Conta e Dados",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Apaga permanentemente seu histórico de análises, custos fixos e configurações.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = { viewModel.deleteAccount() },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Limpar Todos os Meus Dados")
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}
