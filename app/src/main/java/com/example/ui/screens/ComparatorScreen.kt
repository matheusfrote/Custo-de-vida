package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.domain.engine.FinancialEngine
import com.example.domain.engine.TimeScaleFormatter
import com.example.domain.model.ComparisonFolderData
import com.example.domain.model.ComparisonProduct
import com.example.ui.theme.AccentGold
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.OnEmeraldContainer
import com.example.ui.viewmodel.QuantoCustaViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComparatorScreen(viewModel: QuantoCustaViewModel) {
    val folders by viewModel.comparisonFolders.collectAsState()
    val selectedFolderId by viewModel.selectedFolderId.collectAsState()
    val profile by viewModel.financialProfile.collectAsState()

    // Pasta selecionada no momento (se não houver selecionada, seleciona a primeira da lista)
    val currentFolder: ComparisonFolderData? = remember(folders, selectedFolderId) {
        if (selectedFolderId != null) {
            folders.firstOrNull { it.id == selectedFolderId } ?: folders.firstOrNull()
        } else {
            folders.firstOrNull()
        }
    }

    // Estados dos Diálogos
    var showCreateFolderDialog by remember { mutableStateOf(false) }
    var newFolderTitleInput by remember { mutableStateOf("") }

    var showAddItemDialog by remember { mutableStateOf(false) }
    var newItemNameInput by remember { mutableStateOf("") }
    var newItemPriceInput by remember { mutableStateOf("") }

    var showDeleteFolderConfirm by remember { mutableStateOf(false) }

    // Estado do Comparador Direto (Opção A vs Opção B) dentro da pasta
    var selectedBaseItemId by remember { mutableStateOf<String?>(null) }
    var selectedTargetItemId by remember { mutableStateOf<String?>(null) }

    // Diálogo: Criar Nova Pasta
    if (showCreateFolderDialog) {
        val presetTitles = listOf("📱 Celulares", "👕 Blusas & Roupas", "💻 Notebooks", "👟 Tênis", "🚗 Carros", "✈️ Viagens")

        AlertDialog(
            onDismissRequest = {
                showCreateFolderDialog = false
                newFolderTitleInput = ""
            },
            icon = {
                Icon(Icons.Default.CreateNewFolder, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(32.dp))
            },
            title = {
                Text("Nova Comparação", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Dê um nome para a comparação onde você vai adicionar as opções de compra:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    OutlinedTextField(
                        value = newFolderTitleInput,
                        onValueChange = { newFolderTitleInput = it },
                        label = { Text("Nome da comparação (ex: Celulares, Blusas...)") },
                        placeholder = { Text("Ex: Celulares") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Text(
                        text = "Sugestões rápidas:",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(presetTitles) { preset ->
                            val cleanPreset = preset.replace(Regex("^[\\p{So}\\p{Sk}]*\\s*"), "")
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.clickable { newFolderTitleInput = cleanPreset }
                            ) {
                                Text(
                                    text = preset,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newFolderTitleInput.isNotBlank()) {
                            viewModel.createComparisonFolder(newFolderTitleInput)
                            newFolderTitleInput = ""
                            showCreateFolderDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    enabled = newFolderTitleInput.isNotBlank()
                ) {
                    Text("Criar Comparação", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showCreateFolderDialog = false
                    newFolderTitleInput = ""
                }) {
                    Text("Cancelar")
                }
            }
        )
    }

    // Diálogo: Adicionar Produto à Pasta Atual
    if (showAddItemDialog && currentFolder != null) {
        AlertDialog(
            onDismissRequest = {
                showAddItemDialog = false
                newItemNameInput = ""
                newItemPriceInput = ""
            },
            icon = {
                Icon(Icons.Default.AddShoppingCart, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(30.dp))
            },
            title = {
                Text("Adicionar a '${currentFolder.title}'", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Insira o modelo e preço para converter em tempo de trabalho e comparar:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    OutlinedTextField(
                        value = newItemNameInput,
                        onValueChange = { newItemNameInput = it },
                        label = { Text("Nome da opção (ex: iPhone 15, Blusa Linho)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = newItemPriceInput,
                        onValueChange = { newItemPriceInput = it },
                        label = { Text("Preço (R$)") },
                        placeholder = { Text("Ex: 450,00") },
                        prefix = { Text("R$ ", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanPrice = newItemPriceInput.replace(".", "").replace(",", ".").toDoubleOrNull() ?: 0.0
                        if (newItemNameInput.isNotBlank() && cleanPrice > 0.0) {
                            viewModel.addComparisonProduct(currentFolder.id, newItemNameInput, cleanPrice)
                            newItemNameInput = ""
                            newItemPriceInput = ""
                            showAddItemDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Adicionar", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showAddItemDialog = false
                    newItemNameInput = ""
                    newItemPriceInput = ""
                }) {
                    Text("Cancelar")
                }
            }
        )
    }

    // Diálogo: Confirmar Exclusão da Comparação
    if (showDeleteFolderConfirm && currentFolder != null) {
        AlertDialog(
            onDismissRequest = { showDeleteFolderConfirm = false },
            title = { Text("Excluir Comparação '${currentFolder.title}'?") },
            text = {
                Text("Todos os itens e opções desta comparação serão apagados.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteComparisonFolder(currentFolder.id)
                        showDeleteFolderConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Excluir", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteFolderConfirm = false }) {
                    Text("Cancelar")
                }
            }
        )
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    if (folders.isEmpty()) {
                        showCreateFolderDialog = true
                    } else {
                        showAddItemDialog = true
                    }
                },
                containerColor = EmeraldPrimary,
                contentColor = Color.Black,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = {
                    Text(
                        if (folders.isEmpty()) "Criar Comparação" else "Adicionar Opção",
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { scaffoldPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(scaffoldPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(6.dp))
            }

            // --- CABEÇALHO GERAL DA ABA DE COMPARAÇÃO ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(22.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CompareArrows, contentDescription = null, tint = EmeraldPrimary)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "COMPARADOR DE DECISÃO",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary,
                                    letterSpacing = 1.sp
                                )
                            }

                            if (folders.isNotEmpty()) {
                                OutlinedButton(
                                    onClick = { showCreateFolderDialog = true },
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(Icons.Default.CreateNewFolder, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("+ Nova Comparação", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Compare Opções por Tempo de Vida",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Descubra quanto em % e em horas, dias, semanas ou meses a mais ou a menos você terá que trabalhar se escolher determinado produto.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // --- CASO 1: ABA TOTALMENTE VAZIA POR PADRÃO (SEM NENHUMA PASTA) ---
            if (folders.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    ) {
                        Column(
                            modifier = Modifier.padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(EmeraldContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.FolderOpen,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(38.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(18.dp))

                            Text(
                                text = "Nenhuma Comparação Criada",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Crie uma comparação para agrupar as opções que você está em dúvida — por exemplo: 'Celulares', 'Blusas', 'Notebooks' ou 'Carros'.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            Button(
                                onClick = { showCreateFolderDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Criar Comparação",
                                    color = Color.Black,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Text(
                                text = "Exemplos de comparações que você pode criar:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center
                            ) {
                                listOf("📱 Celulares", "👕 Blusas", "💻 Notebooks").forEach { example ->
                                    val clean = example.replace(Regex("^[\\p{So}\\p{Sk}]*\\s*"), "")
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier
                                            .padding(horizontal = 4.dp)
                                            .clickable {
                                                newFolderTitleInput = clean
                                                showCreateFolderDialog = true
                                            }
                                    ) {
                                        Text(
                                            text = example,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // --- CASO 2: EXISTEM PASTAS CADASTRADAS ---

                // SELETOR DE PASTAS (TABS HORIZONTAIS)
                item {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Suas Comparações:",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Text(
                                text = "${folders.size} comparação(ões)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(folders) { folder ->
                                val isSelected = folder.id == currentFolder?.id
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.selectComparisonFolder(folder.id) },
                                    label = {
                                        Text(
                                            "${folder.title} (${folder.items.size})",
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    leadingIcon = {
                                        Icon(
                                            if (isSelected) Icons.Default.FolderOpen else Icons.Default.Folder,
                                            contentDescription = null,
                                            tint = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldContainer,
                                        selectedLabelColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                )
                            }

                            item {
                                Surface(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .height(32.dp)
                                        .clickable { showCreateFolderDialog = true }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Nova Comparação", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }

                if (currentFolder != null) {
                    val folderItems = currentFolder.items.sortedBy { it.price }
                    val minItem = folderItems.firstOrNull()
                    val maxItem = folderItems.lastOrNull()

                    // BARRA DE TÍTULO DA PASTA SELECIONADA
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.FolderOpen, contentDescription = null, tint = EmeraldPrimary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = currentFolder.title,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.ExtraBold
                                        )
                                        Text(
                                            text = "${folderItems.size} opção(ões) adicionada(s)",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Row {
                                    IconButton(onClick = { showAddItemDialog = true }) {
                                        Icon(Icons.Default.AddCircle, contentDescription = "Adicionar", tint = EmeraldPrimary)
                                    }
                                    IconButton(onClick = { showDeleteFolderConfirm = true }) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Excluir Comparação", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                            }
                        }
                    }

                    // --- SE A PASTA ESTIVER VAZIA DE ITENS ---
                    if (folderItems.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        Icons.Default.PlaylistAdd,
                                        contentDescription = null,
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(40.dp)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = "Esta comparação está vazia",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Adicione produtos (ex: modelos diferentes de ${currentFolder.title}) para comparar o tempo de trabalho necessário.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Center
                                    )
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Button(
                                        onClick = { showAddItemDialog = true },
                                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Adicionar Primeira Opção", color = Color.Black, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    } else if (folderItems.size == 1) {
                        // APENAS 1 ITEM NA PASTA
                        val single = folderItems.first()
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(single.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                            Text(
                                                FinancialEngine.formatCurrency(single.price),
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = EmeraldPrimary,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                        IconButton(onClick = { viewModel.removeComparisonProduct(single.id.toLongOrNull() ?: 0L) }) {
                                            Icon(Icons.Default.Close, contentDescription = "Remover", tint = MaterialTheme.colorScheme.error)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Equivalente a: ${TimeScaleFormatter.formatWorkTimeAdaptive(single.calculation.totalWorkMinutes, profile.hoursPerDay, profile.daysPerWeek)} de trabalho",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Default.Info, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = "Adicione mais uma opção nesta comparação para vermos quanto % e tempo a mais ou a menos você vai trabalhar.",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // --- 2 OU MAIS ITENS NA PASTA: COMPARAÇÃO COMPLETA! ---
                        // BANNER DE DISPARIDADE DA PASTA
                        if (minItem != null && maxItem != null && minItem.id != maxItem.id) {
                            val maxDiff = TimeScaleFormatter.calculateDiff(
                                basePrice = minItem.price,
                                baseMinutes = minItem.calculation.totalWorkMinutes,
                                targetPrice = maxItem.price,
                                targetMinutes = maxItem.calculation.totalWorkMinutes,
                                baseName = minItem.name,
                                targetName = maxItem.name,
                                hoursPerDay = profile.hoursPerDay,
                                daysPerWeek = profile.daysPerWeek
                            )

                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = EmeraldContainer)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "DISPARIDADE TOTAL DA COMPARAÇÃO",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = OnEmeraldContainer,
                                                letterSpacing = 1.sp
                                            )
                                            Icon(Icons.Default.Insights, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(18.dp))
                                        }

                                        Spacer(modifier = Modifier.height(6.dp))

                                        Text(
                                            text = "Entre a mais barata e a mais cara: ${maxDiff.summaryText}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color.White
                                        )

                                        Spacer(modifier = Modifier.height(4.dp))

                                        Text(
                                            text = maxDiff.narrativePhrase,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color.White.copy(alpha = 0.9f)
                                        )
                                    }
                                }
                            }
                        }

                        // --- LISTA DE ITENS COM DIFERENÇAS EM % E TEMPO ADAPTATIVO ---
                        items(folderItems) { item ->
                            val isCheapest = minItem?.id == item.id
                            val diffFromMin = if (minItem != null && !isCheapest) {
                                TimeScaleFormatter.calculateDiff(
                                    basePrice = minItem.price,
                                    baseMinutes = minItem.calculation.totalWorkMinutes,
                                    targetPrice = item.price,
                                    targetMinutes = item.calculation.totalWorkMinutes,
                                    baseName = minItem.name,
                                    targetName = item.name,
                                    hoursPerDay = profile.hoursPerDay,
                                    daysPerWeek = profile.daysPerWeek
                                )
                            } else null

                            val itemDurationFormatted = TimeScaleFormatter.formatWorkTimeAdaptive(
                                minutes = item.calculation.totalWorkMinutes,
                                hoursPerDay = profile.hoursPerDay,
                                daysPerWeek = profile.daysPerWeek
                            )

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .then(
                                        if (isCheapest) Modifier.border(1.5.dp, EmeraldPrimary, RoundedCornerShape(20.dp))
                                        else Modifier
                                    ),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isCheapest) EmeraldContainer.copy(alpha = 0.2f)
                                    else MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = item.name,
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                if (isCheapest) {
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Surface(
                                                        color = EmeraldPrimary,
                                                        shape = RoundedCornerShape(6.dp)
                                                    ) {
                                                        Text(
                                                            text = "🏆 Menor Custo",
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = Color.Black,
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 10.sp
                                                        )
                                                    }
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(2.dp))

                                            Text(
                                                text = FinancialEngine.formatCurrency(item.price),
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = EmeraldPrimary
                                            )
                                        }

                                        IconButton(
                                            onClick = { viewModel.removeComparisonProduct(item.id.toLongOrNull() ?: 0L) },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(Icons.Default.Close, contentDescription = "Remover", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // TEMPO DE TRABALHO ADAPTATIVO DO PRODUTO
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Schedule, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "Tempo necessário:",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Text(
                                            text = itemDurationFormatted,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }

                                    // DIFERENÇA EM % E TEMPO A MAIS EM RELAÇÃO AO MAIS ECONÔMICO
                                    if (diffFromMin != null) {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                                        Spacer(modifier = Modifier.height(8.dp))

                                        Surface(
                                            color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.25f),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    modifier = Modifier.weight(1f)
                                                ) {
                                                    Icon(
                                                        Icons.Default.TrendingUp,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.error,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = "Trabalho a mais vs ${minItem?.name ?: "Opção Base"}:",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        fontWeight = FontWeight.SemiBold
                                                    )
                                                }

                                                Column(horizontalAlignment = Alignment.End) {
                                                    Text(
                                                        text = "+${diffFromMin.adaptiveDuration}",
                                                        style = MaterialTheme.typography.labelMedium,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        color = MaterialTheme.colorScheme.error
                                                    )
                                                    Text(
                                                        text = "(+${diffFromMin.percentageFormatted})",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        fontWeight = FontWeight.Bold,
                                                        color = MaterialTheme.colorScheme.error
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // --- SIMULADOR DE CONFRONTO DIRETO: OPÇÃO A vs OPÇÃO B ---
                        item {
                            val activeBaseId = selectedBaseItemId ?: folderItems.firstOrNull()?.id ?: ""
                            val activeTargetId = selectedTargetItemId ?: folderItems.getOrNull(1)?.id ?: ""

                            val itemA = folderItems.firstOrNull { it.id == activeBaseId } ?: folderItems.first()
                            val itemB = folderItems.firstOrNull { it.id == activeTargetId } ?: folderItems.last()

                            val confrontationDiff = remember(itemA, itemB, profile) {
                                TimeScaleFormatter.calculateDiff(
                                    basePrice = itemA.price,
                                    baseMinutes = itemA.calculation.totalWorkMinutes,
                                    targetPrice = itemB.price,
                                    targetMinutes = itemB.calculation.totalWorkMinutes,
                                    baseName = itemA.name,
                                    targetName = itemB.name,
                                    hoursPerDay = profile.hoursPerDay,
                                    daysPerWeek = profile.daysPerWeek
                                )
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(22.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Compare, contentDescription = null, tint = EmeraldPrimary)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Confronto Direto Entre 2 Opções",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    // Seletores das Opções A e B
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        // Opção A
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text("Se escolher:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text(itemB.name, fontWeight = FontWeight.Bold, maxLines = 1, fontSize = 12.sp)
                                                    Text(FinancialEngine.formatCurrency(itemB.price), color = EmeraldPrimary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                                }
                                            }
                                        }

                                        // Opção B
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text("Em vez de:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text(itemA.name, fontWeight = FontWeight.Bold, maxLines = 1, fontSize = 12.sp)
                                                    Text(FinancialEngine.formatCurrency(itemA.price), color = EmeraldPrimary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(14.dp))

                                    // RESULTADO DA DECISÃO
                                    Surface(
                                        color = if (confrontationDiff.isMore) {
                                            MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.35f)
                                        } else {
                                            EmeraldContainer.copy(alpha = 0.45f)
                                        },
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(14.dp)) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Text(
                                                    text = if (confrontationDiff.isMore) "TRABALHO A MAIS" else "ECONOMIA DE TEMPO",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (confrontationDiff.isMore) MaterialTheme.colorScheme.error else EmeraldPrimary,
                                                    letterSpacing = 1.sp
                                                )
                                                Text(
                                                    text = confrontationDiff.percentageFormatted,
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = if (confrontationDiff.isMore) MaterialTheme.colorScheme.error else EmeraldPrimary
                                                )
                                            }

                                            Spacer(modifier = Modifier.height(6.dp))

                                            Text(
                                                text = confrontationDiff.summaryText,
                                                style = MaterialTheme.typography.titleLarge,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )

                                            Spacer(modifier = Modifier.height(6.dp))

                                            Text(
                                                text = confrontationDiff.narrativePhrase,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(70.dp))
            }
        }
    }
}
