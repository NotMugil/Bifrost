import re

with open("app/src/main/java/com/example/bifrostcompanion/MainScreen.kt", "r") as f:
    content = f.read()

navigation_replacement = """@Composable
fun MainNavigation() {
    var isScanning by remember { mutableStateOf(false) }
    var config by remember { mutableStateOf<ConnectionConfig?>(null) }
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Home", "Remote PC")
    
    val context = LocalContext.current
    
    var isNotificationListenerEnabled by remember {
        mutableStateOf(isNotificationServiceEnabled(context))
    }

    if (isScanning) {
        ScannerScreen(onCodeScanned = { qrResult ->
            isScanning = false
            try {
                val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
                config = parsed
                startConnectionService(context, parsed)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        })
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
}"""

content = re.sub(r'@Composable\nfun MainNavigation\(\) \{.*?(?=@Composable\nfun MainScreen\()', navigation_replacement + "\n\n", content, flags=re.DOTALL)

with open("app/src/main/java/com/example/bifrostcompanion/MainScreen.kt", "w") as f:
    f.write(content)
