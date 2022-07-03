Changes in 2.06.06
+ Added 11 new system vars
+ Added addQuickText and clearQuickText
+ Added getBotList command
+ Added setAutoTrigger command
+ Added reqVersion command
+ added sort and find commands for single dimention arrays
+ Added modulas command (%) and operator (%=)
+ Added mergetext operator (&=)
+ Added dirExists and labelExists commands
+ Added openInstabce and closetInstance commands
+ Added 8 Database Managment commands
+ Added startTimer and stopTimer commands
+ Added Stop All Scripts to popup menu and stopAll command
+ Added Reset Database Feature - For rebangs or script testing
+ Added Streaming Mode feature - Hides numbers from your stream
+ Added Concat command and operator &=
+ Added Text to CP437 conversion to Echo for drawing menus.
+ Enhance Delete Database Feature - Optionally deletes script created data
+ Fixed - Issue 46 List index out of bounds - fatal crash
+ Fixed - ClearGlobal is now ClearGlobals as documented (typo)
+ Compiler will now throw an exception on duplicate label

Changes in 2.06.05
+ Added AutoLineTrigger command
+ Added Asignment Operators feature
+ Fixed - Issue 36 String Comparisons do not work like they did in 2.04

Changes in 2.06.04
+ New - Installer - Includes public scripts, Mombot 3.58p, and authorized Zedbot 2.19
+ New - Update checker - Now you will alsways know you are runnning the latest.
+ New - Quick Load - Quickly load any script the popup menu.
+ New - Bot Loader - Load or switch bots from the popup menu.
+ New - SwitchBot command and ACTIVEBOT system varable.
+ Enhanced remote connection support - now allows mnultiple ip addreses and wildcards.
+ Fixed - Issue 32 Notification menu flickers when disconnecting and re-connecting.
+ Fixed - Issue 28 Opening screen is disrupted by command prompt if connected.
+ Fixed - Issue 26 ZTM Import/Export is not compatible with Swath

Changes in 2.06.03
+ Fixed - Initial connect fails when launching Mombot after a manual disconnect.
+ Fixed - Same database is loaded on second launch.
+ Fixed - Multiple instances of the the same script conflicts.
+ Fixed - Sometimes a script will leave TWXP in Deaf Mode.
+ Fixed - Mombot crashes when trying to view the stats screen.
+ Fixed - Memory leak associated with new TrayIcon.
+ Fixed - Logon script runs even if unchecked in the config.
+ Fixed - Sector index out of bounds, on several commands.
+ Fixed - Logging permanently disabled on write error.

Features added in 2.06.02 and earlier
+ Notification icon support - To help identify multiple games.
+ Remote connection support

Changes were not documented prior to this version
