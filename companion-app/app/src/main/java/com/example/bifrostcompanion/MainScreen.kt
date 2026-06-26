package com.example.bifrostcompanion

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.gson.Gson

import android.os.Environment
import android.net.Uri

@Composable
fun MainNavigation() {
    var isScanning by remember { mutableStateOf(false) }
    var config by remember { mutableStateOf<ConnectionConfig?>(null) }
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Home", "Remote PC")
    
    val context = LocalContext.current
    
    var isNotificationListenerEnabled by remember {
        mutableStateOf(isNotificationServiceEnabled(context))
    }

    // Auto-discovery and connection logic
    useEffectAutoConnect(context) { discoveredConfig ->
        config = discoveredConfig
        startConnectionService(context, discoveredConfig)
    }

    // Storage permission check
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                    intent.addCategory("android.intent.category.DEFAULT")
                    intent.data = Uri.parse("package:${context.packageName}")
                    context.startActivity(intent)
                    Toast.makeText(context, "Please allow 'All files access' for File Manager to work", Toast.LENGTH_LONG).show()
                } catch (e: Exception) {
                    val intent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
                    context.startActivity(intent)
                }
            }
        }
    }

    if (isScanning) {
        ScannerScreen(
            onCodeScanned = { qrResult ->
                isScanning = false
                try {
                    val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
                    if (parsed != null && !parsed.ip.isNullOrEmpty() && !parsed.token.isNullOrEmpty() && parsed.port in 1..65535) {
                        config = parsed
                        startConnectionService(context, parsed)
                    } else {
                        Toast.makeText(context, "Invalid QR code data", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(context, "Invalid QR code data", Toast.LENGTH_SHORT).show()
                }
            },
            onCancelScan = {
                isScanning = false
            }
        )
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar {
                    tabs.forEachIndexed { index, title ->
                        NavigationBarItem(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            icon = { Text(title.take(1)) },
                            label = { Text(title) }
                        )
                    }
                }
            }
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues)) {
                if (selectedTab == 0) {
                    MainScreen(
                        config = config,
                        isNotificationListenerEnabled = isNotificationListenerEnabled,
                        onStartScan = { isScanning = true },
                        onStopConnection = {
                            config = null
                            stopConnectionService(context)
                        },
                        onCheckNotificationPermission = {
                            isNotificationListenerEnabled = isNotificationServiceEnabled(context)
                        }
                    )
                } else if (selectedTab == 1) {
                    RemotePCScreen()
                }
            }
        }
    }
}

@Composable
fun MainScreen(
    config: ConnectionConfig?,
    isNotificationListenerEnabled: Boolean,
    onStartScan: () -> Unit,
    onStopConnection: () -> Unit,
    onCheckNotificationPermission: () -> Unit
) {
    val context = LocalContext.current
    
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            onStartScan()
        }
    }
    
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {}

    var isStorageManager by remember {
        mutableStateOf(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Environment.isExternalStorageManager() else true)
    }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Bifrost Companion", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(32.dp))
        
        if (config == null) {
            Button(onClick = {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    onStartScan()
                } else {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                }
            }) {
                Text("Scan QR Code to Connect")
            }
        } else {
            val isConnected by ConnectionService.isConnected.collectAsState()
            
            if (isConnected) {
                Text(
                    "Connected to: ${config.ip}:${config.port}",
                    color = MaterialTheme.colorScheme.primary
                )
            } else {
                Text("Connecting to: ${config.ip}:${config.port}...")
                val error by ConnectionService.connectionErrorFlow.collectAsState()
                if (error != null) {
                    Text(
                        text = error!!,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onStopConnection) {
                Text("Disconnect")
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        if (!isNotificationListenerEnabled) {
            Text("Notification Access is required to sync notifications.")
            Button(onClick = {
                context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }) {
                Text("Grant Notification Access")
            }
        } else {
            Text("Notification Access Granted", color = MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(16.dp))
        
        if (!isStorageManager && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Text("Storage Access is required to browse and transfer files.")
            Button(onClick = {
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                intent.data = Uri.parse("package:${context.packageName}")
                context.startActivity(intent)
            }) {
                Text("Grant Storage Access")
            }
        } else {
            Text("Storage Access Granted", color = MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            onCheckNotificationPermission()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                isStorageManager = Environment.isExternalStorageManager()
            }
        }) {
            Text("Check Permission Status")
        }
    }
}

fun isNotificationServiceEnabled(context: Context): Boolean {
    val packageNames = NotificationManagerCompat.getEnabledListenerPackages(context)
    return packageNames.contains(context.packageName)
}

fun startConnectionService(context: Context, config: ConnectionConfig) {
    val intent = Intent(context, ConnectionService::class.java).apply {
        action = ConnectionService.ACTION_START
        putExtra(ConnectionService.EXTRA_IP, config.ip)
        putExtra(ConnectionService.EXTRA_PORT, config.port)
        putExtra(ConnectionService.EXTRA_TOKEN, config.token)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
    } else {
        context.startService(intent)
    }
}

fun stopConnectionService(context: Context) {
    val intent = Intent(context, ConnectionService::class.java).apply {
        action = ConnectionService.ACTION_STOP
    }
    context.startService(intent)
}

@Composable
fun useEffectAutoConnect(context: Context, onDiscovered: (ConnectionConfig) -> Unit) {
    DisposableEffect(context) {
        val prefs = context.getSharedPreferences("bifrost_prefs", Context.MODE_PRIVATE)
        val lastToken = prefs.getString("last_token", null)

        var nsdManager: android.net.nsd.NsdManager? = null
        var discoveryListener: android.net.nsd.NsdManager.DiscoveryListener? = null

        if (lastToken != null && !ConnectionService.isConnected.value) {
            nsdManager = context.getSystemService(Context.NSD_SERVICE) as android.net.nsd.NsdManager
            
            discoveryListener = object : android.net.nsd.NsdManager.DiscoveryListener {
                override fun onDiscoveryStarted(regType: String) {}
                override fun onServiceFound(service: android.net.nsd.NsdServiceInfo) {
                    if (service.serviceType == "_bifrost._tcp.") {
                        nsdManager?.resolveService(service, object : android.net.nsd.NsdManager.ResolveListener {
                            override fun onResolveFailed(serviceInfo: android.net.nsd.NsdServiceInfo, errorCode: Int) {}
                            override fun onServiceResolved(serviceInfo: android.net.nsd.NsdServiceInfo) {
                                val host = serviceInfo.host.hostAddress
                                val port = serviceInfo.port
                                if (host != null) {
                                    // Found a Bifrost server! Try to auto-connect using our saved token
                                    android.os.Handler(android.os.Looper.getMainLooper()).post {
                                        onDiscovered(ConnectionConfig(host, port, lastToken))
                                    }
                                }
                            }
                        })
                    }
                }
                override fun onServiceLost(service: android.net.nsd.NsdServiceInfo) {}
                override fun onDiscoveryStopped(serviceType: String) {}
                override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {}
                override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
            }
            
            try {
                nsdManager.discoverServices("_bifrost._tcp.", android.net.nsd.NsdManager.PROTOCOL_DNS_SD, discoveryListener)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        onDispose {
            try {
                discoveryListener?.let { nsdManager?.stopServiceDiscovery(it) }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
