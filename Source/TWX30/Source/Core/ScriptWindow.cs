using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    /// <summary>
    /// Interface for script windows that can display text content
    /// </summary>
    public interface IScriptWindow : IDisposable
    {
        string Name { get; }
        string Title { get; }
        int Width { get; }
        int Height { get; }
        bool OnTop { get; }
        string TextContent { get; set; }
        bool IsVisible { get; }
        void Show();
        void Hide();
    }

    /// <summary>
    /// Factory for creating script windows
    /// </summary>
    public interface IScriptWindowFactory
    {
        IScriptWindow CreateWindow(string name, string title, int width, int height, bool onTop = false);
    }

    /// <summary>
    /// Service that the UI layer provides so script windows can add/remove
    /// draggable panels inside the main application window.
    /// </summary>
    public interface IPanelOverlayService
    {
        void AddPanel(string name, string title, int width, int height, Action<string> contentSetter);
        void UpdatePanel(string name, string content);
        void RemovePanel(string name);
    }

    /// <summary>
    /// Default stub implementation (logs to console, no actual window)
    /// </summary>
    public class ConsoleScriptWindow : IScriptWindow
    {
        private readonly string _name;
        private readonly string _title;
        private readonly int _width;
        private readonly int _height;
        private readonly bool _onTop;
        private string _textContent;
        private bool _isVisible;

        public ConsoleScriptWindow(string name, string title, int width, int height, bool onTop = false)
        {
            _name = name;
            _title = title;
            _width = width;
            _height = height;
            _onTop = onTop;
            _textContent = string.Empty;
            _isVisible = false;
        }

        public string Name => _name;
        public string Title => _title;
        public int Width => _width;
        public int Height => _height;
        public bool OnTop => _onTop;

        public string TextContent
        {
            get => _textContent;
            set
            {
                _textContent = value;
                UpdateContent();
            }
        }

        public bool IsVisible => _isVisible;

        /// <summary>
        /// Show the window
        /// </summary>
        public void Show()
        {
            if (!_isVisible)
            {
                _isVisible = true;
                CreateWindow();
            }
        }

        /// <summary>
        /// Hide the window
        /// </summary>
        public void Hide()
        {
            if (_isVisible)
            {
                _isVisible = false;
                DestroyWindow();
            }
        }

        /// <summary>
        /// Create the window (console stub version)
        /// </summary>
        private void CreateWindow()
        {
            Console.WriteLine($"[ScriptWindow] Created window '{_name}' - {_width}x{_height} - '{_title}' (console stub)");
        }

        /// <summary>
        /// Update window content (console stub version)
        /// </summary>
        private void UpdateContent()
        {
            if (_isVisible)
            {
                Console.WriteLine($"[ScriptWindow] Updated '{_name}' content: {_textContent.Substring(0, Math.Min(50, _textContent.Length))}...");
            }
        }

        /// <summary>
        /// Destroy the window (console stub version)
        /// </summary>
        private void DestroyWindow()
        {
            Console.WriteLine($"[ScriptWindow] Destroyed window '{_name}'");
        }

        public void Dispose()
        {
            Hide();
        }
    }

    /// <summary>
    /// Default factory that creates console stub windows
    /// </summary>
    public class ConsoleScriptWindowFactory : IScriptWindowFactory
    {
        public IScriptWindow CreateWindow(string name, string title, int width, int height, bool onTop = false)
        {
            return new ConsoleScriptWindow(name, title, width, height, onTop);
        }
    }

    /// <summary>
    /// Menu item for custom script menus
    /// </summary>
    public class MenuItem
    {
        public string Parent { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public char Hotkey { get; set; }
        public string Reference { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public bool CloseMenu { get; set; }
        public string Value { get; set; } = string.Empty;
        public string Help { get; set; } = string.Empty;
        public object? Script { get; set; }

        // Menu options (Q, ?, +)
        public bool OptionQ { get; set; } = true;
        public bool OptionHelp { get; set; } = true;
        public bool OptionPlus { get; set; } = true;

        public void SetOptions(bool q, bool help, bool plus)
        {
            OptionQ = q;
            OptionHelp = help;
            OptionPlus = plus;
        }
    }

    /// <summary>
    /// Menu system for managing custom script menus
    /// </summary>
    public interface ITWXMenu
    {
        MenuItem? AddCustomMenu(string parent, string name, string description,
            string reference, string prompt, char hotkey, bool closeMenu, object script);
        void OpenMenu(string menuName, int flags);
        void CloseMenu(bool force);
        void RemoveScriptMenus(object script);
        MenuItem? GetMenuByName(string menuName);
        bool TryGetCurrentPrompt(out string prompt);
        void BeginScriptInput(Script script, CmdParam varParam, bool singleKey);
        void SuspendMenuForInput(bool clearDisplay = true);
        bool HasSuspendedMenu { get; }
    }

    /// <summary>
    /// Simple menu manager implementation
    /// </summary>
    public class MenuManager : ITWXMenu
    {
        private readonly TwxRuntimeContext? _runtimeContext;
        private readonly Dictionary<string, MenuItem> _menus = new Dictionary<string, MenuItem>(StringComparer.OrdinalIgnoreCase);
        private readonly List<MenuItem> _menuItems = new();
        private Stack<MenuItem> _menuStack = new Stack<MenuItem>();
        private List<MenuItem>? _suspendedMenuStack;
        private readonly HashSet<int> _autoDeafClientIndices = new();
        private bool _scriptMenuAutoDeafActive;
        private Script? _inputScript;
        private CmdParam? _inputVarParam;
        private bool _inputSingleKey;

        public MenuManager(TwxRuntimeContext? runtimeContext = null)
        {
            _runtimeContext = runtimeContext;
        }

        private IDisposable BindRuntimeContext()
        {
            return GlobalModules.UseRuntimeContext(_runtimeContext);
        }

        public MenuItem? AddCustomMenu(string parent, string name, string description,
            string reference, string prompt, char hotkey, bool closeMenu, object script)
        {
            using var runtimeScope = BindRuntimeContext();
            var menuItem = new MenuItem
            {
                Parent = parent.ToUpper(),
                Name = name.ToUpper(),
                Description = description,
                Hotkey = hotkey,
                Reference = reference,
                Prompt = prompt,
                CloseMenu = closeMenu,
                Script = script
            };

            _menuItems.Add(menuItem);
            if (IsNamedMenu(menuItem.Name) && !_menus.ContainsKey(menuItem.Name))
                _menus[menuItem.Name] = menuItem;
            return menuItem;
        }

        public void OpenMenu(string menuName, int flags)
        {
            using var runtimeScope = BindRuntimeContext();
            menuName = menuName.ToUpper();

            if (!IsNamedMenu(menuName))
                throw new Exception("Menu name cannot be blank");

            if (!_menus.TryGetValue(menuName, out var menu))
                throw new Exception($"Menu '{menuName}' not found");

            if (_suspendedMenuStack is { Count: > 0 })
            {
                int suspendedIndex = _suspendedMenuStack.FindIndex(m =>
                    m.Name.Equals(menuName, StringComparison.OrdinalIgnoreCase));
                if (suspendedIndex >= 0)
                {
                    _menuStack.Clear();
                    for (int i = 0; i <= suspendedIndex; i++)
                        _menuStack.Push(_suspendedMenuStack[i]);

                    GlobalModules.DebugLog(
                        $"[Menu] Restored suspended stack directly to '{menuName}' (depth={_menuStack.Count})\n");
                    _suspendedMenuStack = null;
                    DisplayScriptMenu(_menuStack.Peek());
                    return;
                }
            }

            if (_menuStack.Count > 0 &&
                _menuStack.Peek().Name.Equals(menuName, StringComparison.OrdinalIgnoreCase))
            {
                GlobalModules.DebugLog($"[Menu] OpenMenu('{menuName}') ignored because it is already current\n");
                DisplayScriptMenu(_menuStack.Peek());
                return;
            }

            _suspendedMenuStack = null;
            _menuStack.Push(menu);
            EnsureScriptMenuDeafening(menu);

            // Display the menu to the user
            DisplayScriptMenu(menu);
        }

        public void CloseMenu(bool force)
        {
            using var runtimeScope = BindRuntimeContext();
            if (_menuStack.Count == 0 && _suspendedMenuStack is not { Count: > 0 })
                return;

            int clearedDepth = _menuStack.Count;
            _menuStack.Clear();
            _suspendedMenuStack = null;
            Console.WriteLine($"[Menu] Closed menu stack (depth={clearedDepth}, force={force})");
            ClearMenuDisplay();
            RestoreScriptMenuDeafeningIfNeeded();
        }

        public void RemoveScriptMenus(object script)
        {
            using var runtimeScope = BindRuntimeContext();
            bool stackChanged = false;
            bool suspendedChanged = false;

            var removedMenuItems = _menuItems
                .Where(menu => ReferenceEquals(menu.Script, script))
                .ToList();

            if (removedMenuItems.Count == 0)
            {
                if (ReferenceEquals(_inputScript, script))
                {
                    _inputScript = null;
                    _inputVarParam = null;
                    _inputSingleKey = false;
                }
                return;
            }

            foreach (MenuItem removedMenu in removedMenuItems)
                _menuItems.Remove(removedMenu);

            _menus.Clear();
            foreach (MenuItem menuItem in _menuItems)
            {
                if (IsNamedMenu(menuItem.Name) && !_menus.ContainsKey(menuItem.Name))
                    _menus[menuItem.Name] = menuItem;
            }

            if (_menuStack.Count > 0)
            {
                var retainedStack = _menuStack
                    .Reverse()
                    .Where(menu => !ReferenceEquals(menu.Script, script))
                    .ToList();

                stackChanged = retainedStack.Count != _menuStack.Count;
                if (stackChanged)
                {
                    _menuStack.Clear();
                    foreach (var menu in retainedStack)
                        _menuStack.Push(menu);
                }
            }

            if (_suspendedMenuStack is { Count: > 0 })
            {
                var retainedSuspended = _suspendedMenuStack
                    .Where(menu => !ReferenceEquals(menu.Script, script))
                    .ToList();

                suspendedChanged = retainedSuspended.Count != _suspendedMenuStack.Count;
                _suspendedMenuStack = retainedSuspended.Count > 0 ? retainedSuspended : null;
            }

            if (ReferenceEquals(_inputScript, script))
            {
                _inputScript = null;
                _inputVarParam = null;
                _inputSingleKey = false;
            }

            GlobalModules.DebugLog(
                $"[Menu] Removed {removedMenuItems.Count} menu item(s) for disposed script; " +
                $"stackChanged={stackChanged} suspendedChanged={suspendedChanged}\n");

            if (stackChanged)
            {
                if (_menuStack.Count > 0)
                    DisplayScriptMenu(_menuStack.Peek());
                else
                {
                    ClearMenuDisplay();
                    RestoreScriptMenuDeafeningIfNeeded();
                }
            }
            else if (suspendedChanged && _menuStack.Count == 0 && _suspendedMenuStack == null)
            {
                ClearMenuDisplay();
                RestoreScriptMenuDeafeningIfNeeded();
            }
        }

        public MenuItem? GetMenuByName(string menuName)
        {
            using var runtimeScope = BindRuntimeContext();
            menuName = menuName.ToUpper();
            if (_menus.TryGetValue(menuName, out var menu))
            {
                return menu;
            }
            throw new Exception($"Menu '{menuName}' not found");
        }

        public void BeginScriptInput(Script script, CmdParam varParam, bool singleKey)
        {
            using var runtimeScope = BindRuntimeContext();
            _inputScript = script;
            _inputVarParam = varParam;
            _inputSingleKey = singleKey;

            // Start async input collection
            if (singleKey)
            {
                // Single key input mode
                Task.Run(() =>
                {
                    var key = Console.ReadKey(true);
                    CompleteInput(key.KeyChar.ToString());
                });
            }
            else
            {
                // Line input mode
                Task.Run(() =>
                {
                    var line = Console.ReadLine() ?? string.Empty;
                    CompleteInput(line);
                });
            }
        }

        public bool IsMenuOpen()
        {
            using var runtimeScope = BindRuntimeContext();
            return _menuStack.Count > 0;
        }

        public bool TryGetCurrentPrompt(out string prompt)
        {
            using var runtimeScope = BindRuntimeContext();
            prompt = string.Empty;
            if (_menuStack.Count == 0)
                return false;

            MenuItem menu = _menuStack.Peek();
            string promptText = !string.IsNullOrEmpty(menu.Prompt) ? menu.Prompt : menu.Name;
            prompt = $"{promptText}> ";
            return true;
        }

        public bool IsMenuOnStack(string menuName)
        {
            using var runtimeScope = BindRuntimeContext();
            return _menuStack.Any(m => m.Name.Equals(menuName, StringComparison.OrdinalIgnoreCase));
        }

        public bool HasSuspendedMenu => _suspendedMenuStack is { Count: > 0 };

        public void SuspendMenuForInput(bool clearDisplay = true)
        {
            using var runtimeScope = BindRuntimeContext();
            if (_menuStack.Count == 0)
                return;

            _suspendedMenuStack = _menuStack.Reverse().ToList();
            _menuStack.Clear();
            GlobalModules.DebugLog($"[Menu] Suspended menu stack for GETINPUT (depth={_suspendedMenuStack.Count})\n");
            if (clearDisplay)
                ClearMenuDisplay(restoreCurrentLine: false);
        }

        public void ClearSuspendedMenu()
        {
            using var runtimeScope = BindRuntimeContext();
            if (_suspendedMenuStack is not { Count: > 0 })
                return;

            GlobalModules.DebugLog($"[Menu] Cleared suspended menu stack (depth={_suspendedMenuStack.Count})\n");
            _suspendedMenuStack = null;
            RestoreScriptMenuDeafeningIfNeeded();
        }

        private void SendMenuMessage(string message)
        {
            using var runtimeScope = BindRuntimeContext();
            GlobalModules.TWXServer?.Broadcast(message, broadcastDeaf: true);
        }

        private void ClearMenuDisplay(bool restoreCurrentLine = true)
        {
            using var runtimeScope = BindRuntimeContext();
            string exitText = "\r" + AnsiCodes.ANSI_CLEARLINE;
            if (restoreCurrentLine)
            {
                string currentAnsiLine = ScriptRef.GetCurrentAnsiLine();
                if (!string.IsNullOrEmpty(currentAnsiLine))
                    exitText += currentAnsiLine;
            }

            SendMenuMessage(exitText);
        }

        private void CompleteInput(string inputText)
        {
            using var runtimeScope = BindRuntimeContext();
            if (_inputScript != null && _inputVarParam != null)
            {
                _inputScript.InputCompleted(inputText, _inputVarParam);
                _inputScript = null;
                _inputVarParam = null;
            }
        }

        private void DisplayScriptMenu(MenuItem menu)
        {
            using var runtimeScope = BindRuntimeContext();
            if (GlobalModules.DebugMode)
                GlobalModules.DebugLog($"[DEBUG] Displaying menu: {menu.Name}, Parent: {menu.Parent}, Options: Q={menu.OptionQ} ?={menu.OptionHelp} +={menu.OptionPlus}\n");

            string title = menu.Description.Replace("\r", string.Empty).Replace("\n", string.Empty);
            if (!string.IsNullOrWhiteSpace(title))
                SendMenuMessage(AnsiCodes.ANSI_CLEARLINE + "\r" + title + ":\r\n");
            else
                SendMenuMessage(AnsiCodes.ANSI_CLEARLINE + "\r\n");

            // Get all menu items that have this menu as their parent
            // Note: Parent '0' means display in all menus (like root-level items)
            if (GlobalModules.DebugMode)
            {
                GlobalModules.DebugLog($"[DEBUG] Checking children for menu '{menu.Name}' (parent='{menu.Parent}'):\n");
                foreach (var m in _menuItems)
                {
                    bool parentMatch = m.Parent == menu.Name;
                    bool zeroMatch = m.Parent == "0" && (string.IsNullOrEmpty(menu.Parent) || menu.Name == "MAIN");
                    bool included = parentMatch || zeroMatch;
                    GlobalModules.DebugLog($"[DEBUG]   Item '{m.Name}' parent='{m.Parent}' hotkey='{m.Hotkey}': parentMatch={parentMatch}, zeroMatch={zeroMatch}, included={included}\n");
                }
            }
            var childItems = _menuItems.Where(m =>
                m.Parent == menu.Name ||
                (m.Parent == "0" && (string.IsNullOrEmpty(menu.Parent) || menu.Name == "MAIN"))
            ).OrderBy(m => m.Hotkey).ToList();

            if (GlobalModules.DebugMode)
                GlobalModules.DebugLog($"[DEBUG] Found {childItems.Count} child items\n");

            // Display menu items
            foreach (var item in childItems)
            {
                // Display with value if available
                if (!string.IsNullOrEmpty(item.Value))
                {
                    // Replace carriage returns with * for display (TWX script convention)
                    string displayValue = item.Value.Replace("\r", "*");
                    SendMenuMessage($"{item.Hotkey} - {item.Description,-25} {displayValue}\r\n");
                }
                else
                {
                    SendMenuMessage($"{item.Hotkey} - {item.Description}\r\n");
                }
            }

            // Display standard menu options
            if (menu.OptionQ)
                SendMenuMessage((_menuStack.Count <= 1 ? "Q - Terminate script" : "Q - Exit menu") + "\r\n");
            if (menu.OptionHelp)
                SendMenuMessage("? - Command list\r\n");
            if (menu.OptionPlus)
                SendMenuMessage("+ - Help on command\r\n");

            // Use prompt if available, otherwise use name
            string prompt = !string.IsNullOrEmpty(menu.Prompt) ? menu.Prompt : menu.Name;
            SendMenuMessage($"\r\n{prompt}> ");
        }

        private void EchoMenuKey(char key)
        {
            using var runtimeScope = BindRuntimeContext();
            GlobalModules.TWXServer?.Broadcast(char.ToUpperInvariant(key).ToString(), broadcastDeaf: true);
        }

        public bool HandleMenuInput(char keyChar)
        {
            using var runtimeScope = BindRuntimeContext();
            if (_menuStack.Count == 0)
                return false;

            // Custom script menus are single-key hotkey driven. When a menu is first
            // opened from a typed command, the trailing LF from the user's Enter can
            // arrive after the script has already opened the menu. Pascal behavior is
            // to ignore that newline rather than moving the prompt to the next line.
            if (keyChar == '\r' || keyChar == '\n')
                return true;

            var currentMenu = _menuStack.Peek();

            // Handle standard options
            char upperKey = char.ToUpper(keyChar);
            if (upperKey == 'Q')
            {
                EchoMenuKey(upperKey);

                // Q always goes back/closes menu (never passes to server)
                if (_menuStack.Count > 1)
                {
                    // In submenu - pop back to parent
                    _menuStack.Pop();
                    var parentMenu = _menuStack.Peek();
                    DisplayScriptMenu(parentMenu);
                }
                else
                {
                    // In the root menu, Pascal/TWX semantics are "Terminate script".
                    // The menu text already says "Q - Terminate script", so close the
                    // menu UI and stop the owning script rather than merely dismissing it.
                    var rootMenu = _menuStack.Peek();
                    CloseMenu(true);

                    if (rootMenu.Script is Script rootScript)
                    {
                        ClearSuspendedMenu();
                        GlobalModules.DebugLog($"[Menu] Root Q terminating script '{rootScript.ScriptName}'\n");
                        rootScript.Controller.StopByHandle(rootScript);
                    }
                }
                return true; // Always consume Q key
            }

            // Find matching menu item
            // Include items with parent matching current menu, or parent '0' (global items)
            var matchingItem = _menuItems.FirstOrDefault(m =>
                (m.Parent == currentMenu.Name || (m.Parent == "0" && (string.IsNullOrEmpty(currentMenu.Parent) || currentMenu.Name == "MAIN"))) &&
                char.ToUpper(m.Hotkey) == upperKey);

            if (matchingItem != null)
            {
                // Execute menu item reference (GOSUB to label)
                if (matchingItem.Script is Script script)
                {
                    try
                    {
                        bool hasChildMenu = HasNamedChildMenu(matchingItem);
                        EchoMenuKey(upperKey);

                        // Get the label reference and strip leading ':' if present
                        string labelName = matchingItem.Reference;
                        if (labelName.StartsWith(':'))
                            labelName = labelName.Substring(1);

                        // If reference is empty, this is a submenu - open it
                        if (string.IsNullOrEmpty(labelName))
                        {
                            if (hasChildMenu)
                            {
                                if (matchingItem.CloseMenu)
                                {
                                    GlobalModules.DebugLog(
                                        $"[Menu] Clearing current menu '{currentMenu.Name}' before opening submenu '{matchingItem.Name}' while preserving back stack\n");
                                    ClearMenuDisplay(restoreCurrentLine: false);
                                }

                                OpenMenu(matchingItem.Name, 0);
                                return true;
                            }
                            GlobalModules.TWXServer?.BroadcastLiteral($"\r\nMenu item '{matchingItem.Description}' has no submenu defined.\r\n");
                            return true;
                        }

                        // Start each hotkey handler with a clean pause reason so
                        // Pascal-style submenu stubs like ":Menu_Nav -> pause" don't
                        // inherit a stale OpenMenu/Input reason from the previous menu action.
                        script.PausedReason = PauseReason.None;

                        // Unpause the script and GOSUB to the reference label
                        script.Paused = false;
                        int initialSubStackDepth = script.SubStackDepth; // Remember depth before GOSUB
                        // Close-menu items like "Start" should resume the script after OPENMENU
                        // instead of returning to EOF like config-only menu handlers.
                        script.GosubFromMenu(labelName, matchingItem.CloseMenu);

                        // Close menu if configured
                        if (matchingItem.CloseMenu)
                        {
                            CloseMenu(true);
                        }

                        // Call Execute() to actually run the GOSUBed code
                        // Execute until handler completes (RETURN) or pauses (GETINPUT)
                        GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Calling Execute() for handler '{labelName}', subStack depth before={initialSubStackDepth}...\n");
                        GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Hotkey '{upperKey}' matched menu item '{matchingItem.Name}'\n");

                        bool handlerCompleted = false;
                        bool handlerMenuAlreadyDisplayed = false;
                        int maxIterations = 100; // Safety limit
                        int iterations = 0;

                        while (!handlerCompleted && iterations < maxIterations)
                        {
                            GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Loop iteration {iterations + 1}, Paused={script.Paused}, WaitingForInput={script.WaitingForInput}, SubStackDepth={script.SubStackDepth}\n");

                            bool scriptCompleted = script.Execute();
                            iterations++;

                            GlobalModules.DebugLog($"[DEBUG HandleMenuInput] After Execute(): completed={scriptCompleted}, Paused={script.Paused}, WaitingForInput={script.WaitingForInput}, SubStackDepth={script.SubStackDepth}\n");

                            // Check if handler completed (script reached end or HALT)
                            // Note: Don't check SubStackDepth == initialSubStackDepth because handlers can call GOSUB
                            // and still have more code to execute after the GOSUB returns (e.g., HALT)
                            if (scriptCompleted)
                            {
                                GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler COMPLETED (script ended or HALT)\n");
                                handlerCompleted = true;
                                break;
                            }

                            // Check if paused for input (GETINPUT)
                            if (script.Paused && script.WaitingForInput)
                            {
                                GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler paused for GETINPUT\n");
                                if (!matchingItem.CloseMenu)
                                    SuspendMenuForInput(clearDisplay: false);
                                break; // Exit - will resume later when input received
                            }

                            // If paused but NOT waiting for input, it might be from OPENMENU - continue
                            if (script.Paused && !script.WaitingForInput)
                            {
                                if (script.PausedReason == PauseReason.OpenMenu)
                                {
                                    GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler ended via OPENMENU\n");
                                    handlerCompleted = true;
                                    handlerMenuAlreadyDisplayed = true;
                                    break;
                                }
                                else if (script.PausedReason == PauseReason.Command && hasChildMenu)
                                {
                                    script.CompletePendingNonResumingMenuHandler();
                                    GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Paused for Command on submenu '{matchingItem.Name}' - opening child menu\n");
                                    OpenMenu(matchingItem.Name, 0);
                                    return true;
                                }
                                else
                                {
                                    GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Paused for {script.PausedReason} - NOT unpausing, exiting handler loop\n");
                                    break; // Exit handler loop - script is paused for a reason
                                }
                            }
                        }

                        GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Execute() finished after {iterations} iterations, handlerCompleted={handlerCompleted}, script.Paused={script.Paused}, SubStackDepth={script.SubStackDepth}\n");

                        // After execution, redisplay menu if handler completed
                        if (!matchingItem.CloseMenu && _menuStack.Count > 0)
                        {
                            if (handlerCompleted)
                            {
                                // Handler completed - check if it was GETINPUT or just normal completion
                                if (script.WaitingForInput)
                                {
                                    GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler waiting for GETINPUT, will resume later\n");
                                }
                                else
                                {
                                    GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler completed normally, redisplaying menu\n");
                                    // Handler completed with RETURN - ensure script is paused for menu and redisplay
                                    script.Paused = true;
                                    if (!handlerMenuAlreadyDisplayed)
                                    {
                                        var currentMenuAfter = _menuStack.Peek();
                                        DisplayScriptMenu(currentMenuAfter);
                                    }
                                }
                            }
                            else
                            {
                                GlobalModules.DebugLog($"[DEBUG HandleMenuInput] Handler not completed yet (iterations limit or other reason)\n");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        SendMenuMessage($"\r\nMenu error: {ex.Message}\r\n");

                        // Re-display the menu after error
                        DisplayScriptMenu(currentMenu);
                    }
                }
                return true;
            }

            return false;
        }

        private void EnsureScriptMenuDeafening(MenuItem menu)
        {
            using var runtimeScope = BindRuntimeContext();
            if (_scriptMenuAutoDeafActive ||
                menu.Script is null ||
                !IsNamedMenu(menu.Name) ||
                GlobalModules.TWXServer == null)
                return;

            int clientCount = GlobalModules.TWXServer.ClientCount;
            for (int i = 0; i < clientCount; i++)
            {
                if (GlobalModules.TWXServer.GetClientType(i) == ClientType.Standard)
                {
                    GlobalModules.TWXServer.SetClientType(i, ClientType.Deaf);
                    _autoDeafClientIndices.Add(i);
                }
            }

            _scriptMenuAutoDeafActive = true;
            GlobalModules.DebugLog($"[Menu] Auto-deafened {_autoDeafClientIndices.Count} client(s) for script menu '{menu.Name}'\n");
        }

        private void RestoreScriptMenuDeafeningIfNeeded()
        {
            using var runtimeScope = BindRuntimeContext();
            if (!_scriptMenuAutoDeafActive)
                return;

            if (_menuStack.Count > 0 || _suspendedMenuStack is { Count: > 0 })
                return;

            if (GlobalModules.TWXServer != null)
            {
                foreach (int index in _autoDeafClientIndices)
                {
                    if (GlobalModules.TWXServer.GetClientType(index) == ClientType.Deaf)
                        GlobalModules.TWXServer.SetClientType(index, ClientType.Standard);
                }
            }

            GlobalModules.DebugLog($"[Menu] Restored {_autoDeafClientIndices.Count} auto-deafened client(s)\n");
            _autoDeafClientIndices.Clear();
            _scriptMenuAutoDeafActive = false;
        }

        private static bool IsNamedMenu(string? menuName)
            => !string.IsNullOrWhiteSpace(menuName);

        private bool HasNamedChildMenu(MenuItem menuItem)
        {
            if (!IsNamedMenu(menuItem.Name) || !_menus.ContainsKey(menuItem.Name))
                return false;

            return _menuItems.Any(m =>
                string.Equals(m.Parent, menuItem.Name, StringComparison.OrdinalIgnoreCase));
        }
    }
}
