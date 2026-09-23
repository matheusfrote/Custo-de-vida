package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.dialogs.AuthDialog
import com.example.ui.dialogs.LinkImportDialog
import com.example.ui.dialogs.OnboardingWizardDialog
import com.example.ui.dialogs.ShareCardDialog
import com.example.ui.screens.*
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.AppTab
import com.example.ui.viewmodel.QuantoCustaViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: QuantoCustaViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                val currentTab by viewModel.currentTab.collectAsState()
                val snackbarMessage by viewModel.snackbarMessage.collectAsState()
                val showOnboarding by viewModel.showOnboarding.collectAsState()
                val showLinkImportDialog by viewModel.showLinkImportDialog.collectAsState()
                val isImportingLink by viewModel.isImportingLink.collectAsState()
                val showShareDialog by viewModel.showShareDialog.collectAsState()
                val shareCardText by viewModel.shareCardText.collectAsState()
                val shareCardTitle by viewModel.shareCardTitle.collectAsState()
                val currentUser by viewModel.currentUser.collectAsState()
                val showAuthDialog by viewModel.showAuthDialog.collectAsState()
                val isAuthLoading by viewModel.isAuthLoading.collectAsState()

                val snackbarHostState = remember { SnackbarHostState() }

                LaunchedEffect(snackbarMessage) {
                    snackbarMessage?.let { msg ->
                        snackbarHostState.showSnackbar(msg)
                        viewModel.clearSnackbar()
                    }
                }

                // Global Dialogs
                if (showAuthDialog) {
                    AuthDialog(
                        onDismiss = { viewModel.closeAuthDialog() },
                        onLogin = { email, pass -> viewModel.login(email, pass) },
                        onRegister = { name, email, pass -> viewModel.register(name, email, pass) },
                        onRecover = { email -> viewModel.recoverPassword(email) },
                        onGoogleSignIn = { viewModel.signInWithGoogle(this@MainActivity) },
                        isLoading = isAuthLoading
                    )
                }

                if (showOnboarding) {
                    OnboardingWizardDialog(
                        onDismiss = { viewModel.toggleOnboarding(false) },
                        onSaveProfile = { gross, net, hDay, dWeek, hMonth ->
                            viewModel.updateFinancialProfile(gross, net, hDay, dWeek, hMonth)
                        }
                    )
                }

                if (showLinkImportDialog) {
                    LinkImportDialog(
                        isLoading = isImportingLink,
                        onDismiss = { viewModel.closeLinkImportDialog() },
                        onImport = { url -> viewModel.importProductFromUrl(url) }
                    )
                }

                if (showShareDialog) {
                    ShareCardDialog(
                        title = shareCardTitle,
                        content = shareCardText,
                        onDismiss = { viewModel.closeShareDialog() }
                    )
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        TopAppBar(
                            title = {
                                Row(modifier = Modifier.padding(vertical = 4.dp)) {
                                    Icon(
                                        Icons.Default.HourglassBottom,
                                        contentDescription = null,
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Custo de Vida",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    )
                                }
                            },
                            actions = {
                                IconButton(onClick = { viewModel.toggleOnboarding(true) }) {
                                    Icon(Icons.Default.HelpOutline, contentDescription = "Tutorial Interativo")
                                }
                                if (currentUser?.isGuest == true) {
                                    TextButton(onClick = { viewModel.openAuthDialog() }) {
                                        Text("Entrar", color = EmeraldPrimary, fontWeight = FontWeight.Bold)
                                    }
                                } else {
                                    Surface(
                                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                                        color = EmeraldContainer,
                                        modifier = Modifier.padding(end = 8.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                Icons.Default.AccountCircle,
                                                contentDescription = null,
                                                tint = EmeraldPrimary,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = currentUser?.name?.split(" ")?.firstOrNull() ?: "Perfil",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = EmeraldPrimary
                                            )
                                        }
                                    }
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.background
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 6.dp
                        ) {
                            NavigationBarItem(
                                selected = currentTab == AppTab.CALCULATOR,
                                onClick = { viewModel.setTab(AppTab.CALCULATOR) },
                                icon = { Icon(Icons.Default.Calculate, contentDescription = "Calculadora") },
                                label = { Text("Calcular", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == AppTab.COMPARATOR,
                                onClick = { viewModel.setTab(AppTab.COMPARATOR) },
                                icon = { Icon(Icons.Default.CompareArrows, contentDescription = "Comparar") },
                                label = { Text("Comparar", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == AppTab.HISTORY,
                                onClick = { viewModel.setTab(AppTab.HISTORY) },
                                icon = { Icon(Icons.Default.History, contentDescription = "Histórico") },
                                label = { Text("Histórico", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == AppTab.GOALS,
                                onClick = { viewModel.setTab(AppTab.GOALS) },
                                icon = { Icon(Icons.Default.Flag, contentDescription = "Metas") },
                                label = { Text("Metas", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == AppTab.DASHBOARD,
                                onClick = { viewModel.setTab(AppTab.DASHBOARD) },
                                icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                                label = { Text("Painel", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                            NavigationBarItem(
                                selected = currentTab == AppTab.SETTINGS,
                                onClick = { viewModel.setTab(AppTab.SETTINGS) },
                                icon = { Icon(Icons.Default.Tune, contentDescription = "Configurações") },
                                label = { Text("Config", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color.Black,
                                    indicatorColor = EmeraldPrimary
                                )
                            )
                        }
                    },
                    snackbarHost = { SnackbarHost(snackbarHostState) }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        Crossfade(targetState = currentTab, label = "TabCrossfade") { tab ->
                            when (tab) {
                                AppTab.CALCULATOR -> CalculatorScreen(viewModel)
                                AppTab.COMPARATOR -> ComparatorScreen(viewModel)
                                AppTab.HISTORY -> HistoryScreen(viewModel)
                                AppTab.GOALS -> GoalsScreen(viewModel)
                                AppTab.DASHBOARD -> DashboardScreen(viewModel)
                                AppTab.SETTINGS -> SettingsScreen(viewModel)
                            }
                        }
                    }
                }
            }
        }
    }
}
