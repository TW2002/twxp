# ZeD's Z-Bot Help Index 
#
# VERSION 1.01 
#
# HELPINDEX1 
:HELPINDEX1
SetVar $helptitle "QSS*"
SetVar $helpbody "Displays player information over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " qss*")
Goto :DISPLAYHELP
# HELPINDEX2 
:HELPINDEX2
SetVar $helptitle "SCRIPTS*"
SetVar $helpbody "Displays currently active scripts over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " scripts*")
Goto :DISPLAYHELP
# HELPINDEX3 
:HELPINDEX3
SetVar $helptitle "RESET*"
SetVar $helpbody "Resets Z-Bot, reloads the Options file and refreshes the*"
SetVar $helpbody ($helpbody & "triggers. Also tries to put you at the Citadel or Command prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " reset*")
Goto :DISPLAYHELP
# HELPINDEX4 
:HELPINDEX4
SetVar $helptitle "CORPY*"
SetVar $helpbody "Clears and re-populates the corpy list based on current members.*"
SetVar $helpbody ($helpbody & "Members do not have to be online to be included in the list.*")
SetVar $helpbody ($helpbody & "Members must be on the list to access this bot.*")
SetVar $helpbody ($helpbody & "Members can also send a corporate memo to gain access to the list.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " corpy*")
Goto :DISPLAYHELP
# HELPINDEX5 
:HELPINDEX5
SetVar $helptitle "MOW*"
SetVar $helpbody "Moves the player to a destination sector without stopping.*"
SetVar $helpbody ($helpbody & "The bot owner can set details about the figs, mines and limpets*")
SetVar $helpbody ($helpbody & "to drop along the way in the menu. Plows right through enemy forces.*")
SetVar $helpbody ($helpbody & "Various commands can be executed at the destination automatically.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mow [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " m [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "      SECTOR - Destination sector number (1-SECTORS) or*")
SetVar $helpbody ($helpbody & "   SHORTCODE - D for STARDOCK      - DB STARDOCK BACKDOOR*")
SetVar $helpbody ($helpbody & "             - A for ALPHA         - AB ALPHA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - R for RYLOS         - RB RYLOS BACKDOOR*")
SetVar $helpbody ($helpbody & "             - B for BASE          - TB TERRA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - S for SAFESECTOR*")
SetVar $helpbody ($helpbody & "             - L for LASTSECTOR    - H  LAST HIT SECTOR*")
SetVar $helpbody ($helpbody & "             - J for NEXT JUMP (requires " & GAMENAME & "_JUMPLIST.txt)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "     OPTIONS - G Gas               - K Kill*")
SetVar $helpbody ($helpbody & "             - U Surround          - P Port*")
SetVar $helpbody ($helpbody & "             - W WaveCap           - N {PLANETNUMBER} Land*")
SetVar $helpbody ($helpbody & "             - C Cap               - V Call Saveme*")
SetVar $helpbody ($helpbody & "             - X Holo-attack       - Z Buzz (1 fig waves)*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "             - E Clean             - M Run Macro*")
End
SetVar $helpbody ($helpbody & "             - [BOTCOMMAND] Run a bot command with PARMS*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Options run in the following order if present:*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "      G E U W C Z K X M P N V*")
Else
	SetVar $helpbody ($helpbody & "      G U W C Z K X M P N V*")
End
SetVar $helpbody ($helpbody & "      P, N and V are mutually exclusive.*")
Goto :DISPLAYHELP
# HELPINDEX6 
:HELPINDEX6
SetVar $helptitle "CHARGE*"
SetVar $helpbody "Moves the player to a destination sector without stopping.*"
SetVar $helpbody ($helpbody & "This one moves fast, stopping for nothing. It's a safer alternative*")
SetVar $helpbody ($helpbody & "to the mow command as it doesn't slow down to drop figs.*")
SetVar $helpbody ($helpbody & "Various commands can be executed at the destination automatically.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " charge [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " c [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "      SECTOR - Destination sector number (1-SECTORS) or*")
SetVar $helpbody ($helpbody & "   SHORTCODE - D for STARDOCK      - DB STARDOCK BACKDOOR*")
SetVar $helpbody ($helpbody & "             - A for ALPHA         - AB ALPHA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - R for RYLOS         - RB RYLOS BACKDOOR*")
SetVar $helpbody ($helpbody & "             - B for BASE          - TB TERRA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - S for SAFESECTOR*")
SetVar $helpbody ($helpbody & "             - L for LASTSECTOR    - H  LAST HIT SECTOR*")
SetVar $helpbody ($helpbody & "             - J for NEXT JUMP (requires " & GAMENAME & "_JUMPLIST.txt)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "     OPTIONS - G Gas               - K Kill*")
SetVar $helpbody ($helpbody & "             - U Surround          - P Port*")
SetVar $helpbody ($helpbody & "             - W WaveCap           - N {PLANETNUMBER} Land*")
SetVar $helpbody ($helpbody & "             - C Cap               - V Call Saveme*")
SetVar $helpbody ($helpbody & "             - X Holo-attack       - Z Buzz (1 fig waves)*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "             - E Clean             - M Run Macro*")
End
SetVar $helpbody ($helpbody & "             - [BOTCOMMAND] Run a bot command with PARMS*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Options run in the following order if present:*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "      G E U W C Z K X M P N V*")
Else
	SetVar $helpbody ($helpbody & "      G U W C Z K X M P N V*")
End
SetVar $helpbody ($helpbody & "      P, N and V are mutually exclusive.*")
Goto :DISPLAYHELP
# HELPINDEX7 
:HELPINDEX7
SetVar $helptitle "FIGS*"
SetVar $helpbody "Refreshes the FIGSEC parameter for each sector in the game database.*"
SetVar $helpbody ($helpbody & "Counts the number of sectors gridded and makes the information*")
SetVar $helpbody ($helpbody & "available for other scripts that may need it.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " figs*")
Goto :DISPLAYHELP
# HELPINDEX8 
:HELPINDEX8
SetVar $helptitle "MINES*"
SetVar $helpbody "Refreshes the MINESEC parameter for each sector in the game database.*"
SetVar $helpbody ($helpbody & "Counts the number of sectors gridded and makes the information*")
SetVar $helpbody ($helpbody & "available for other scripts that may need it.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mines*")
Goto :DISPLAYHELP
# HELPINDEX9 
:HELPINDEX9
SetVar $helptitle "LIMPS*"
SetVar $helpbody "Refreshes the LIMPSEC parameter for each sector in the game database.*"
SetVar $helpbody ($helpbody & "Counts the number of sectors gridded and makes the information*")
SetVar $helpbody ($helpbody & "available for other scripts that may need it.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " limps*")
Goto :DISPLAYHELP
# HELPINDEX10 
:HELPINDEX10
SetVar $helptitle "CALL*"
SetVar $helpbody "Call Saveme. Summons a planet to your sector, you land and refurb*"
SetVar $helpbody ($helpbody & "when it arrives, and then optionally return to the planets*")
SetVar $helpbody ($helpbody & "original sector. Requires a corpy to be running a saveme*")
SetVar $helpbody ($helpbody & "script on the planet such as Zed's Rescue Service.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " call*")
Goto :DISPLAYHELP
# HELPINDEX11 
:HELPINDEX11
SetVar $helptitle "SURROUND*"
SetVar $helpbody "Surrounds a sector laying figs and optionally mines and limps in*"
SetVar $helpbody ($helpbody & "adjacent sectors. The number of figs, mines and limps and*")
SetVar $helpbody ($helpbody & "their owner (corp or personal), and the fig type (o,d,t), can*")
SetVar $helpbody ($helpbody & "be set in the Bot Options Menu by the bot owner.*")
SetVar $helpbody ($helpbody & "Surround avoids dangerous sectors and fed space.*")
SetVar $helpbody ($helpbody & "The FORCE parameter causes SURROUND to ignore enemy limps.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " surround {force}*")
Goto :DISPLAYHELP
# HELPINDEX12 
:HELPINDEX12
SetVar $helptitle "OREUP*"
SetVar $helpbody "Buys down fuel ore from a port and drops it on a planet.*"
SetVar $helpbody ($helpbody & "Start from the planet prompt of the planet to fill.*")
SetVar $helpbody ($helpbody & "OreUp will buy as much as it can with the cash and space*")
SetVar $helpbody ($helpbody & "available... fast!.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " oreup*")
Goto :DISPLAYHELP
# HELPINDEX13 
:HELPINDEX13
SetVar $helptitle "LAND*"
SetVar $helpbody "Lands the player on the specified planet and enters the*"
SetVar $helpbody ($helpbody & "citadel if one exists. If there is only one planet*")
SetVar $helpbody ($helpbody & "in sector then there is no need to specify a planet number.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " land {PLANETNUMBER}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " l {PLANETNUMBER}*")
Goto :DISPLAYHELP
# HELPINDEX14 
:HELPINDEX14
SetVar $helptitle "LIFT*"
SetVar $helpbody "Lifts off from a planet or citadel and enters orbit.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " lift*")
Goto :DISPLAYHELP
# HELPINDEX15 
:HELPINDEX15
SetVar $helptitle "MAC*"
SetVar $helpbody "Allows you to control the bot using a macro.*"
SetVar $helpbody ($helpbody & "Use an asterisk (" & #42 & ") to signify a press of the ENTER key.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mac [MACRO STRING]*")
Goto :DISPLAYHELP
# HELPINDEX16 
:HELPINDEX16
SetVar $helptitle "HELP*"
SetVar $helpbody "Displays help in the form of lists of available commands.*"
SetVar $helpbody ($helpbody & "The INTERNAL parameter displays the internal commands.*")
SetVar $helpbody ($helpbody & "The EXTERNAL parameter displays the external commands*")
SetVar $helpbody ($helpbody & "available through the z-options.cfg file (commands you add).*")
SetVar $helpbody ($helpbody & "The LIST parameter displays a list of the internal commands*")
SetVar $helpbody ($helpbody & "with short descriptions.*")
SetVar $helpbody ($helpbody & "The XLIST parameter displays a list of external commands*")
SetVar $helpbody ($helpbody & "with short descriptions.*")
SetVar $helpbody ($helpbody & "The ALL parameter displays a complete command list.*")
SetVar $helpbody ($helpbody & "Use A thru Z as a parameter to display a list of ALL commands*")
SetVar $helpbody ($helpbody & "starting with the given letter.*")
SetVar $helpbody ($helpbody & "Use help {TEXT} to SEARCH for text in the commands and their *")
SetVar $helpbody ($helpbody & "descriptions. Example: help foton .*")
SetVar $helpbody ($helpbody & "Place the search criteria in square brackets to force a search.*")
SetVar $helpbody ($helpbody & "The parameter can also be a category. Available categories are:*")
SetVar $helpbody ($helpbody & "COMBAT, CASH, RESOURCE, DATA, GRID, UTILITY, or DAEMON.*")
SetVar $helpbody ($helpbody & "Help can be obtained for each command using the form [COMMAND ?].*")
SetVar $helpbody ($helpbody & "Use the SORT parameter to sort the help list alphabetically.*")
SetVar $helpbody ($helpbody & "Use the CONFIG parameter to view info about Z-Bot config files.*")
SetVar $helpbody ($helpbody & "Help with no parameters displays the main help screen.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "CONVENTIONS used in HELP's    Usage:   area are:*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Square brackets  []  - denote a MANDATORY parameter.*")
SetVar $helpbody ($helpbody & "Curly braces     {}  - denote an OPTIONAL parameter.*")
SetVar $helpbody ($helpbody & "The pipe         |   - means  'or'  - you have a choice of the*")
SetVar $helpbody ($helpbody & "                       parameters on either side of the pipe.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "CAPITAL letters denote a parameter that needs to be replaced with*")
SetVar $helpbody ($helpbody & "a value (example: SECTOR would need to be replaced by a number).*")
SetVar $helpbody ($helpbody & "Small lettered parameters are typed in AS IS.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " help {list|xlist|internal|external|all}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " help {a..z|sort|config|movesys|override|?}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " help {CATEGORY}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " help {SEARCH CRITERIA}*")
Goto :DISPLAYHELP
# HELPINDEX17 
:HELPINDEX17
:HELPINDEX16
SetVar $helptitle "STATUS*"
SetVar $helpbody "Displays status information about the player including the.*"
SetVar $helpbody ($helpbody & "sector and prompt they are currently at.*")
SetVar $helpbody ($helpbody & "Also displays the Base and Safe sectors as specified in the menu.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " status*")
Goto :DISPLAYHELP
# HELPINDEX18 
:HELPINDEX18
SetVar $helptitle "AUTOSS*"
SetVar $helpbody "Allows you to toggle the Auto SubSpace Channel Changer*"
SetVar $helpbody ($helpbody & "OFF and ON. If set to ON the bot will automatically change*")
SetVar $helpbody ($helpbody & "channels to a random channel at the top of each hour.*")
SetVar $helpbody ($helpbody & "Your corpies will change to the same channel if they are running.*")
SetVar $helpbody ($helpbody & "the bot or Z-FigMon and have AUTOSS turned ON.*")
SetVar $helpbody ($helpbody & "Note that if you run Z-Bot and Z-FigMon at the same time that*")
SetVar $helpbody ($helpbody & "the bot will change channels, Z-FigMon will stand down from this*")
SetVar $helpbody ($helpbody & "duty. (Z-FigMon IS recommended for use with Z-Bot).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " autoss [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX19 
:HELPINDEX19
SetVar $helptitle "PAGE*"
SetVar $helpbody "Pages the bot owner. Uses sound and flashing text on the*"
SetVar $helpbody ($helpbody & "screen to attract the attention of the player not at keys.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " page*")
Goto :DISPLAYHELP
# HELPINDEX20 
:HELPINDEX20
SetVar $helptitle "SCAN or HOLO*"
SetVar $helpbody "Holoscans and density scans the surrounding sectors and sends*"
SetVar $helpbody ($helpbody & "the findings over subspace. Needs a Holo scanner but will*")
SetVar $helpbody ($helpbody & "just do a density scan if that is the only scanner available.*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "Use FED as the first parameter to send the scan over FEDSPACE.*")
End
SetVar $helpbody ($helpbody & "Use /d as a parameter to only do a density scan.*")
SetVar $helpbody ($helpbody & " *")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " scan {fed} {/d}*")
	SetVar $helpbody ($helpbody & "   or: " & $botaddress & " holo {fed} {/d}*")
Else
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " scan {/d}*")
	SetVar $helpbody ($helpbody & "   or: " & $botaddress & " holo {/d}*")
End
Goto :DISPLAYHELP
# HELPINDEX21 
:HELPINDEX21
SetVar $helptitle "EXIT*"
SetVar $helpbody "Does an EXIT/ENTER.*"
SetVar $helpbody ($helpbody & "The player should be at the citadel or command prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " exit*")
Goto :DISPLAYHELP
# HELPINDEX22 
:HELPINDEX22
SetVar $helptitle "PDROP*"
SetVar $helpbody "PDrop direct and adjacent.*"
SetVar $helpbody ($helpbody & "Use the RETURN parameter to return the planet to the start*")
SetVar $helpbody ($helpbody & "sector after the pdrop. (set the delay in Bot Options)*")
SetVar $helpbody ($helpbody & "Use the KILL or the CAP parameter for a continued attack.*")
SetVar $helpbody ($helpbody & "The ALERT parameter will sound the pdropalert.wav file if pdrop is*")
SetVar $helpbody ($helpbody & "triggered. You can replace this file with your own  .wav  file.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pdrop [on|off] {return} {kill|cap} {alert}*")
Goto :DISPLAYHELP
# HELPINDEX23 
:HELPINDEX23
SetVar $helptitle "CITKILL*"
SetVar $helpbody "CitKill - attacks enemies who enter sector - refurbs after each wave.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " citkill [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX24 
:HELPINDEX24
SetVar $helptitle "EVAC*"
SetVar $helpbody "CitEvac - Evacuates the planet when an enemy hits a fig in an*"
SetVar $helpbody ($helpbody & "adjacent sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " evac [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX25 
:HELPINDEX25
SetVar $helptitle "QSET*"
SetVar $helpbody "Quasor Cannon Setter.*"
SetVar $helpbody ($helpbody & "Enter the amount of damage you want to inflict for each cannon.*")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100k = 100,000*")
SetVar $helpbody ($helpbody & "If the result is below 1% after rounding it will be set to 1%.*")
SetVar $helpbody ($helpbody & "If the result is above 100% after rounding it will be set to 100%.*")
SetVar $helpbody ($helpbody & "Use OFF to set the cannon to 0%.*")
SetVar $helpbody ($helpbody & "You must set the atmos cannon specifically, the sector cannon, if*")
SetVar $helpbody ($helpbody & "left blank, will be set to the same damage as the atmos cannon.*")
SetVar $helpbody ($helpbody & "The setting for the atmos cannon takes into account the cost of*")
SetVar $helpbody ($helpbody & "the sector cannon blast.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " qset [ATMOS DAMAGE|off] {SECTOR DAMAGE|off}*")
Goto :DISPLAYHELP
# HELPINDEX26 
:HELPINDEX26
SetVar $helptitle "PE*"
SetVar $helpbody "Photon Enter - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pe [sector]*")
Goto :DISPLAYHELP
# HELPINDEX27 
:HELPINDEX27
SetVar $helptitle "PEL*"
SetVar $helpbody "Photon Enter Land - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pel [sector] [planet]*")
Goto :DISPLAYHELP
# HELPINDEX28 
:HELPINDEX28
SetVar $helptitle "PELK*"
SetVar $helpbody "Photon Enter Land Kill - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pelk [sector] [planet*")
Goto :DISPLAYHELP
# HELPINDEX29 
:HELPINDEX29
SetVar $helptitle "PXE*"
SetVar $helpbody "Photon Xport Enter - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pxe [xportship] [sector]*")
Goto :DISPLAYHELP
# HELPINDEX30 
:HELPINDEX30
SetVar $helptitle "PXEL*"
SetVar $helpbody "Photon Xport Enter Land - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pxel [xportship] [sector] [planet]*")
Goto :DISPLAYHELP
# HELPINDEX31 
:HELPINDEX31
SetVar $helptitle "PXELK*"
SetVar $helpbody "Photon Xport Enter Land Kill - Invasion macro.*"
SetVar $helpbody ($helpbody & "Parameters must be entered in the order as shown.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pxelk [xportship] [sector] [planet]*")
Goto :DISPLAYHELP
# HELPINDEX32 
:HELPINDEX32
SetVar $helptitle "TWARP*"
SetVar $helpbody "TWarps the player to a destination sector.*"
SetVar $helpbody ($helpbody & "If the destination is unfigged it will attempt to TWarp adjacent*")
SetVar $helpbody ($helpbody & "and then move into the destination sector.*")
SetVar $helpbody ($helpbody & "Will TWarp direct into fedspace if Alignment is >= 1000.*")
SetVar $helpbody ($helpbody & "Various commands can be executed at the destination automatically.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " twarp [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " t [SECTOR|SHORTCODE]{OPTIONS}*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "      SECTOR - Destination sector number (1-SECTORS) or*")
SetVar $helpbody ($helpbody & "   SHORTCODE - D for STARDOCK      - DB STARDOCK BACKDOOR*")
SetVar $helpbody ($helpbody & "             - A for ALPHA         - AB ALPHA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - R for RYLOS         - RB RYLOS BACKDOOR*")
SetVar $helpbody ($helpbody & "             - B for BASE          - TB TERRA BACKDOOR*")
SetVar $helpbody ($helpbody & "             - S for SAFESECTOR*")
SetVar $helpbody ($helpbody & "             - L for LASTSECTOR    - H  LAST HIT SECTOR*")
SetVar $helpbody ($helpbody & "             - J for NEXT JUMP (requires " & GAMENAME & "_JUMPLIST.txt)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "     OPTIONS - G Gas               - K Kill*")
SetVar $helpbody ($helpbody & "             - U Surround          - P Port*")
SetVar $helpbody ($helpbody & "             - W WaveCap           - N {PLANETNUMBER} Land*")
SetVar $helpbody ($helpbody & "             - C Cap               - V Call Saveme*")
SetVar $helpbody ($helpbody & "             - X Holo-attack       - Z Buzz (1 fig waves)*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "             - E Clean             - M Run Macro*")
End
SetVar $helpbody ($helpbody & "             - [BOTCOMMAND] Run a bot command with PARMS*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Options run in the following order if present:*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "      G E U W C Z K X M P N V*")
Else
	SetVar $helpbody ($helpbody & "      G U W C Z K X M P N V*")
End
SetVar $helpbody ($helpbody & "      P, N and V are mutually exclusive.*")
Goto :DISPLAYHELP
# HELPINDEX33 
:HELPINDEX33
Goto :HELPINDEX32
# HELPINDEX34 
:HELPINDEX34
Goto :HELPINDEX5
# HELPINDEX35 
:HELPINDEX35
Goto :HELPINDEX6
# HELPINDEX36 
:HELPINDEX36
Goto :HELPINDEX13
# HELPINDEX37 
:HELPINDEX37
SetVar $helptitle "CHANGESS*"
SetVar $helpbody "Attempts to change the SubSpace channel to a specified channel.*"
SetVar $helpbody ($helpbody & "The player must be at the Command or Citadel prompt for a few seconds*")
SetVar $helpbody ($helpbody & "for this to work. If it is successful it will send a message on the*")
SetVar $helpbody ($helpbody & "new channel. If not, you will have to try again..*")
SetVar $helpbody ($helpbody & "It will also turn off the AUTO SS Changer when used with a parameter.*")
SetVar $helpbody ($helpbody & "Used without a specified channel this command will immediately attempt*")
SetVar $helpbody ($helpbody & "to change to the current AUTO SS channel if the AUTO SS Changer is on.*")
SetVar $helpbody ($helpbody & "It will NOT turn off the AUTO SS changer if used without a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " changess {NEW CHANNEL}*")
Goto :DISPLAYHELP
# HELPINDEX38 
:HELPINDEX38
SetVar $helptitle "CLASS0*"
SetVar $helpbody "Class 0  Port Locations and Backdoors displayed over SS.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " class0*")
Goto :DISPLAYHELP
# HELPINDEX39 
:HELPINDEX39
SetVar $helptitle "TOW*"
SetVar $helpbody "Hooks a tow onto the specified ship, or the first ship in*"
SetVar $helpbody ($helpbody & "sector if none is specified.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " tow {SHIP NUMBER}*")
Goto :DISPLAYHELP
# HELPINDEX40 
:HELPINDEX40
SetVar $helptitle "VER*"
SetVar $helpbody "Displays VERSION information over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ver*")
Goto :DISPLAYHELP
# HELPINDEX41 
:HELPINDEX41
SetVar $helptitle "TOPOFF*"
SetVar $helpbody "Tops up fighters on your ship from the fighters in sector.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " topoff*")
Goto :DISPLAYHELP
# HELPINDEX42 
:HELPINDEX42
SetVar $helptitle "IG*"
SetVar $helpbody "Sets the ship's Interdictor Generator ON or OFF.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ig [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX43 
:HELPINDEX43
SetVar $helptitle "DC*"
SetVar $helpbody "Deposit Cash. Deposits credits into the Citadel.*"
SetVar $helpbody ($helpbody & "Specify how much to KEEP and the rest is deposited.*")
SetVar $helpbody ($helpbody & "If you omit the amount to keep it will default to 100,001.*")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100m = 100,000,000*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " dc {AMOUNT}*")
Goto :DISPLAYHELP
# HELPINDEX44 
:HELPINDEX44
SetVar $helptitle "WC*"
SetVar $helpbody "Withdraw Cash. Withdraws credits from the Citadel.*"
SetVar $helpbody ($helpbody & "Specify how much to withdraw.*")
SetVar $helpbody ($helpbody & "If you omit the amount to withdraw it will default to the*")
SetVar $helpbody ($helpbody & "maximum amount possible.*")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100m = 100,000,000*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " wc {AMOUNT}*")
Goto :DISPLAYHELP
# HELPINDEX45 
:HELPINDEX45
SetVar $helptitle "PLIMP*"
SetVar $helpbody "Drops 1 personal limpet mine in sector.*"
SetVar $helpbody ($helpbody & "Changes existing limpets in sector to personal.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " plimp*")
Goto :DISPLAYHELP
# HELPINDEX46 
:HELPINDEX46
SetVar $helptitle "FIND*"
SetVar $helpbody "Finds the 6 nearest fuel ports and displays their locations on SS.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " find*")
Goto :DISPLAYHELP
# HELPINDEX47 
:HELPINDEX47
SetVar $helptitle "STOPALL*"
SetVar $helpbody "Stops all active non-system scripts and resets mode to GENERAL.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " stopall*")
Goto :DISPLAYHELP
# HELPINDEX48 
:HELPINDEX48
SetVar $helptitle "CN9*"
SetVar $helpbody "Sets CN9 (Abort display on ALL KEYS/SPACE) to SPACE.*"
SetVar $helpbody ($helpbody & "Reports results of check/action taken.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " cn9*")
Goto :DISPLAYHELP
# HELPINDEX49 
:HELPINDEX49
SetVar $helptitle "DEPLOY*"
SetVar $helpbody "Deploy fighters in sector from a planet.*"
SetVar $helpbody ($helpbody & "Specify how many fighters to deploy (leave blank for all).*")
SetVar $helpbody ($helpbody & "The fighters deployed will be rounded up to ship maximum.*")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100m = 100,000,000*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " deploy {FIGHTERS}*")
Goto :DISPLAYHELP
# HELPINDEX50 
:HELPINDEX50
SetVar $helptitle "CLEARALLBUSTS*"
SetVar $helpbody "Clears the busted parameter across all sectors.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " clearallbusts*")
Goto :DISPLAYHELP
# HELPINDEX51 
:HELPINDEX51
SetVar $helptitle "BUSTUP*"
SetVar $helpbody "Busts planets at Stardock until you reach a specified experience*"
SetVar $helpbody ($helpbody & "level is reached. You must have an alignment of 0 or less and*")
SetVar $helpbody ($helpbody & "you must have the cash you need for torps and dets.*")
SetVar $helpbody ($helpbody & "Also you should start at the <StarDock> prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " bustup [TARGET EXPERIENCE LEVEL]*")
Goto :DISPLAYHELP
# HELPINDEX52 
:HELPINDEX52
SetVar $helptitle "AVOIDS*"
SetVar $helpbody "Displays a list of the current avoids over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " avoids*")
Goto :DISPLAYHELP
# HELPINDEX53 
:HELPINDEX53
SetVar $helptitle "XPORT*"
SetVar $helpbody "Xports the bot into the specified ship number.*"
SetVar $helpbody ($helpbody & "The bot's ship must be within range of the specified ship*")
SetVar $helpbody ($helpbody & "Include a 'p' to immediately port after the xport.*")
SetVar $helpbody ($helpbody & "You can specify the 'P' without a ship number to jump off*")
SetVar $helpbody ($helpbody & "Stardock, get a ship list (local only), and dock again.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Z-Bot will try to land if you started on a planet.*")
SetVar $helpbody ($helpbody & "You will be placed at the citadel or planet prompt,*")
SetVar $helpbody ($helpbody & "depending where you started. If you want to specifically*")
SetVar $helpbody ($helpbody & "port at the other end, start from the command prompt.*")
SetVar $helpbody ($helpbody & "The LAND functionality is meant for swapping ships in the*")
SetVar $helpbody ($helpbody & "same sector while under siege (or not).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " xport {SHIP NUMBER} {p}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " x {SHIP NUMBER} {p}*")
Goto :DISPLAYHELP
# HELPINDEX54 
:HELPINDEX54
SetVar $helptitle "DISR*"
SetVar $helpbody "Disrupts enemy armid mines in all adjacent sectors.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " disr*")
Goto :DISPLAYHELP
# HELPINDEX55 
:HELPINDEX55
Goto :HELPINDEX53
# HELPINDEX56 
:HELPINDEX56
SetVar $helptitle "PLIST*"
SetVar $helpbody "Displays a list of planets in sector over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " plist*")
Goto :DISPLAYHELP
# HELPINDEX57 
:HELPINDEX57
SetVar $helptitle "AMTRAK*"
SetVar $helpbody "Creates a list of all adjacent sectors to Fedspace, Rylos, Alpha,*"
SetVar $helpbody ($helpbody & "Stardock, and the MSLs in a file called " & GAMENAME & "_AMTRAK.txt.*")
SetVar $helpbody ($helpbody & "You can feed this list into a list gridder such as Z-ListGridder.*")
SetVar $helpbody ($helpbody & "You must find Stardock, Rylos & Alpha and turn on MSLs in your*")
SetVar $helpbody ($helpbody & "options settings before this command will work.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " amtrak*")
Goto :DISPLAYHELP
# HELPINDEX58 
:HELPINDEX58
SetVar $helptitle "SAFETYNET*"
SetVar $helpbody "Turns Safetynet ON or OFF.*"
SetVar $helpbody ($helpbody & "Issue the command without a parameter to display current status.*")
SetVar $helpbody ($helpbody & "Safetynet will xport you into a safeship if you are threatened or*")
SetVar $helpbody ($helpbody & "attacked. If you are out of range it will do a CALL SAVEME.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " safetynet {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX59 
:HELPINDEX59
SetVar $helptitle "SAFESHIP*"
SetVar $helpbody "Sets the bot's safeship to the specified ship number.*"
SetVar $helpbody ($helpbody & "Used with Safety Net.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " safeship [SHIP NUMBER]*")
Goto :DISPLAYHELP
# HELPINDEX60 
:HELPINDEX60
SetVar $helptitle "MSLS*"
SetVar $helpbody "Creates a list of all sectors connecting Fedspace, Rylos & Alpha.*"
SetVar $helpbody ($helpbody & "The MSL list is placed in a file called " & GAMENAME & "_MSLS.txt.*")
SetVar $helpbody ($helpbody & "You can feed this list into a list gridder such as Z-ListGridder.*")
SetVar $helpbody ($helpbody & "You must find Stardock, Rylos & Alpha and turn on MSLs in your*")
SetVar $helpbody ($helpbody & "options settings before this command will work.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " msls*")
Goto :DISPLAYHELP
# HELPINDEX61 
:HELPINDEX61
SetVar $helptitle "OVERLOAD*"
SetVar $helpbody "Checks for sectors with too many planets and sends a*"
SetVar $helpbody ($helpbody & "list over SS. Includes any MSL sectors containing planets.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " overload*")
Goto :DISPLAYHELP
# HELPINDEX62 
:HELPINDEX62
SetVar $helptitle "MAX*"
SetVar $helpbody "Upgrades a port to the max with or without experience.*"
SetVar $helpbody ($helpbody & "Specify the category to upgrade with F O E.(Fuel,Organics,Equipment)*")
SetVar $helpbody ($helpbody & "You can specify more than 1 category separated by spaces.*")
SetVar $helpbody ($helpbody & "Use NOEXP to upgrade gradually without gaining experience.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " max [{f} {o} {e}] {noexp}*")
Goto :DISPLAYHELP
# HELPINDEX63 
:HELPINDEX63
SetVar $helptitle "CLEAR*"
SetVar $helpbody "Disrupts mines in adjacent sectors, does a surround,*"
SetVar $helpbody ($helpbody & "and clears limpets as necessary in each surrounding sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " clear*")
Goto :DISPLAYHELP
# HELPINDEX64 
:HELPINDEX64
SetVar $helptitle "BUY*"
SetVar $helpbody "Calls CK Buydown to buydown the port to the planet.*"
SetVar $helpbody ($helpbody & "Specify what to buy and the buydown mode as follows:*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "F = Fuel Ore*")
SetVar $helpbody ($helpbody & "O = Organics*")
SetVar $helpbody ($helpbody & "E = Equipment*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "B = Best Price*")
SetVar $helpbody ($helpbody & "W = Worst Price*")
SetVar $helpbody ($helpbody & "S = Speed Mode*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " buy [f|o|e] [b|w|s]*")
Goto :DISPLAYHELP
# HELPINDEX65 
:HELPINDEX65
SetVar $helptitle "NEG*"
SetVar $helpbody "Calls CK Planet Nego to Sell Goods to the port.*"
SetVar $helpbody ($helpbody & "Specify what to sell as follows:*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "F = Fuel Ore*")
SetVar $helpbody ($helpbody & "O = Organics*")
SetVar $helpbody ($helpbody & "E = Equipment*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " neg [f|o|e]*")
Goto :DISPLAYHELP
# HELPINDEX66 
:HELPINDEX66
SetVar $helptitle "AVOID*"
SetVar $helpbody "Avoids a given sector or several sectors.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " avoid [SECTOR] {SECTOR} {SECTOR} {...}*")
Goto :DISPLAYHELP
# HELPINDEX67 
:HELPINDEX67
SetVar $helptitle "UNAVOID*"
SetVar $helpbody "Unavoids a given sector or several sectors (or ALL sectors).*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " unavoid {all}|[SECTOR] {SECTOR} {SECTOR} {...}*")
Goto :DISPLAYHELP
# HELPINDEX68 
:HELPINDEX68
SetVar $helptitle "RECALL*"
SetVar $helpbody "Recalls all figs in sector to the planet.*"
SetVar $helpbody ($helpbody & "Run this command from the planet prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " recall*")
Goto :DISPLAYHELP
# HELPINDEX69 
:HELPINDEX69
SetVar $helptitle "DROPALL*"
SetVar $helpbody "Drops all figs on ship into sector.*"
SetVar $helpbody ($helpbody & "Creates a planet if necessary.*")
SetVar $helpbody ($helpbody & "Run this command from the command prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " dropall*")
Goto :DISPLAYHELP
# HELPINDEX70 
:HELPINDEX70
SetVar $helptitle "FURB*"
SetVar $helpbody "Buys and delivers a furb ship.*"
SetVar $helpbody ($helpbody & "Twarps to STARDOCK, buys the specified ship, optionally*")
SetVar $helpbody ($helpbody & "buys extra holds, and tows it to the delivery sector.*")
SetVar $helpbody ($helpbody & "Ship Letter is the button pressed to buy the ship at dock.*")
SetVar $helpbody ($helpbody & "FURB will remember previous settings on subsequent calls.*")
SetVar $helpbody ($helpbody & "SHIP LETTER and HOLDS can be set in the Options Menu.*")
SetVar $helpbody ($helpbody & "Use  /DC  as the last parameter to DECASH your corpy.*")
SetVar $helpbody ($helpbody & "Default will  leave corpy with $300000. Edit $z_float to change.*")
SetVar $helpbody ($helpbody & "Note: Furb will return to, and sit on, STARDOCK when completed,*")
 SetVar $helpbody ($helpbody & "if the /DC option is used.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " furb [DELIVERY SECTOR] {SHIP LETTER} {HOLDS} {/dc}*")
Goto :DISPLAYHELP
# HELPINDEX71 
:HELPINDEX71
SetVar $helptitle "WATCH*"
SetVar $helpbody "Turns ONLINE WATCH ON and OFF.*"
SetVar $helpbody ($helpbody & "ONLINE WATCH will report when players login and leave the game.*")
SetVar $helpbody ($helpbody & "If CLV Watch is ON (in the Bot Options menu) it will also report*")
SetVar $helpbody ($helpbody & "experience, alignment and ship changes.*")
SetVar $helpbody ($helpbody & "Use without parameters to report current ON/OFF status.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " watch {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX72 
:HELPINDEX72
SetVar $helptitle "NMAC*"
SetVar $helpbody "Runs a macro a number of times.*"
SetVar $helpbody ($helpbody & "The first parameter is the number of times to execute.*")
SetVar $helpbody ($helpbody & "The rest of the command line is the macro.*")
SetVar $helpbody ($helpbody & "Use an asterisk (" & #42 & ") to signify a press of the ENTER key.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " nmac [ITERATIONS] [MACRO STRING]*")
Goto :DISPLAYHELP
# HELPINDEX73 
:HELPINDEX73
SetVar $helptitle "CLIMP*"
SetVar $helpbody "Drops 1 corporate limpet mine in sector.*"
SetVar $helpbody ($helpbody & "Changes existing limpets in sector to corporate.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " climp*")
Goto :DISPLAYHELP
# HELPINDEX74 
:HELPINDEX74
SetVar $helptitle "GAS*"
SetVar $helpbody "Fills the ship with ore from a nearby fuel port.*"
SetVar $helpbody ($helpbody & "Searches for the fuel port if none are nearby.*")
SetVar $helpbody ($helpbody & "Cargo is jettisoned if carrying anything other than ore.*")
SetVar $helpbody ($helpbody & "Requires a Transwarp drive, Holo Scanner, and 5000+ credits.*")
SetVar $helpbody ($helpbody & "Press [BACKSPACE] to abort the search for fuel.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " gas*")
Goto :DISPLAYHELP
# HELPINDEX75 
:HELPINDEX75
SetVar $helptitle "SENTRY*"
SetVar $helpbody "Automatically refills fighters from a planet when attacked.*"
SetVar $helpbody ($helpbody & "Use this for a defender ship guarding a planet that has a supply of*")
SetVar $helpbody ($helpbody & "fighters.*")
SetVar $helpbody ($helpbody & "Use ' " & $botaddress & " sentry off ' to turn off Sentry mode.*")
SetVar $helpbody ($helpbody & "Also press the tilde key to turn off Sentry mode.*")
SetVar $helpbody ($helpbody & "Use S as the second parameter to refurb shields as well.*")
SetVar $helpbody ($helpbody & " *")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "Use DUO or DUO1 as a parameter to run SENTRY in DUO mode.*")
	SetVar $helpbody ($helpbody & "This will allow 2 corpies to operate in tandem, always keeping 1*")
	SetVar $helpbody ($helpbody & "player in sector while the other refills on the planet.*")
	SetVar $helpbody ($helpbody & "One player should use the DUO parameter and the other should use*")
	SetVar $helpbody ($helpbody & "the DUO1 parameter.*")
	SetVar $helpbody ($helpbody & "If a corpy is already running SENTRY in solo mode, use the DUO*")
	SetVar $helpbody ($helpbody & "parameter to join him in DUO mode. He will switch automatically.*")
	SetVar $helpbody ($helpbody & " *")
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sentry [PLANETNUMBER|off] {s} {duo|duo1}*")
Else
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sentry [PLANETNUMBER|off] {s}*")
End
Goto :DISPLAYHELP
# HELPINDEX76 
:HELPINDEX76
SetVar $helptitle "DENSITY*"
SetVar $helpbody "Displays a report on sectors with high density over SS.*"
SetVar $helpbody ($helpbody & "Specify the minimum density to report as the parameter.*")
SetVar $helpbody ($helpbody & "Default is 499.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " density {MINIMUM DENSITY}*")
Goto :DISPLAYHELP
# HELPINDEX77 
:HELPINDEX77
SetVar $helptitle "SENDMAP*"
SetVar $helpbody "Sends a warpspec over subspace to your corpies.*"
SetVar $helpbody ($helpbody & "Please run the GETMAP command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDMAP command.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sendmap*")
Goto :DISPLAYHELP
# HELPINDEX78 
:HELPINDEX78
SetVar $helptitle "GETMAP*"
SetVar $helpbody "Receives a warpspec over subspace from your corpy.*"
SetVar $helpbody ($helpbody & "Please run the GETMAP command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDMAP command on the sender bot.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " getmap*")
Goto :DISPLAYHELP
# HELPINDEX79 
:HELPINDEX79
SetVar $helptitle "ALIENS*"
SetVar $helpbody "Sends a list of know alien sectors over Subspace.*"
SetVar $helpbody ($helpbody & "Also creates a file in the TWX Root named*")
SetVar $helpbody ($helpbody & GAMENAME & "_ALIENS.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " aliens*")
Goto :DISPLAYHELP
# HELPINDEX80 
:HELPINDEX80
SetVar $helptitle "PFIGS*"
SetVar $helpbody "Changes figs in sector to personal.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pfigs*")
Goto :DISPLAYHELP
# HELPINDEX81 
:HELPINDEX81
SetVar $helptitle "CFIGS*"
SetVar $helpbody "Changes figs in sector to corporate.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " cfigs*")
Goto :DISPLAYHELP
# HELPINDEX82 
:HELPINDEX82
SetVar $helptitle "TEAM*"
SetVar $helpbody "Sets the bot's team name for group commands.*"
SetVar $helpbody ($helpbody & "You can then issue commands to all bots with the same team name*")
SetVar $helpbody ($helpbody & "with one subspace message using the team name as the bot name.*")
SetVar $helpbody ($helpbody & "Use with no parameter to report the current team.*")
SetVar $helpbody ($helpbody & "Use with the NONE parameter to clear the team name.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " team {TEAMNAME|none}*")
Goto :DISPLAYHELP
# HELPINDEX83 
:HELPINDEX83
SetVar $helptitle "SECTOR*"
SetVar $helpbody "Displays last known information about a given sector over subspace.*"
SetVar $helpbody ($helpbody & "The information displayed is collected from the TWX database.*")
SetVar $helpbody ($helpbody & "Pass the sector number as a parameter.*")
SetVar $helpbody ($helpbody & "Use the SS or FED parameter to redirect output.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sector [SECTOR NUMBER] {ss|fed}*")
Goto :DISPLAYHELP
# HELPINDEX84 
:HELPINDEX84
SetVar $helptitle "SETPARM*"
SetVar $helpbody "Sets a sector parameter for a given sector to a given value.*"
SetVar $helpbody ($helpbody & "Pass the sector number, the parameter to set, and the value to set it to.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " setparm [SECTOR NUMBER] [PARAMETER NAME] [NEW VALUE]*")
Goto :DISPLAYHELP
# HELPINDEX85 
:HELPINDEX85
SetVar $helptitle "CLEARPARM*"
SetVar $helpbody "Clears a sector parameter for a given sector from the TWX database.*"
SetVar $helpbody ($helpbody & "Pass the sector number and the parameter to clear.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " clearparm [SECTOR NUMBER] [PARAMETER NAME]*")
Goto :DISPLAYHELP
# HELPINDEX86 
:HELPINDEX86
SetVar $helptitle "LISTPARM*"
SetVar $helpbody "Lists all sector parameters for a given sector over subspace.*"
SetVar $helpbody ($helpbody & "Pass the sector number to list (or leave blank for current sector).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " listparm {SECTOR NUMBER}*")
Goto :DISPLAYHELP
# HELPINDEX87 
:HELPINDEX87
SetVar $helptitle "COUNTBUSTS*"
SetVar $helpbody "Counts the number of sectors you have marked as BUSTED and*"
SetVar $helpbody ($helpbody & "reports over subspace. Also reports the last ROB/STEAL sector.*")
SetVar $helpbody ($helpbody & "Also creates and writes to   " & GAMENAME & "_busts.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " countbusts*")
Goto :DISPLAYHELP
# HELPINDEX88 
:HELPINDEX88
SetVar $helptitle "FIGGER*"
SetVar $helpbody "Turns the AUTO Refigger ON and OFF.*"
SetVar $helpbody ($helpbody & "When ON, the Bot will respond to  xxxxx=figme!  where xxxxx is the*")
SetVar $helpbody ($helpbody & "sector number (5 digits). The bot will jump to the callers sector and*")
SetVar $helpbody ($helpbody & "fill the caller with figs. The bot will refill with ore in sector and*")
SetVar $helpbody ($helpbody & "wait for the next call so it is best to call from a sector with a fuel*")
SetVar $helpbody ($helpbody & "port.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " figger [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX89 
:HELPINDEX89
SetVar $helptitle "SETMATRIX*"
SetVar $helpbody "Sets the sectors to examine with the matrix command.*"
SetVar $helpbody ($helpbody & "You can set up to 12 sectors (separated by spaces).*")
SetVar $helpbody ($helpbody & "Stores the sectors in a file in the TWX Root folder named*")
SetVar $helpbody ($helpbody & GAMENAME & "_MATRIX.txt*")
SetVar $helpbody ($helpbody & "Note that this requires Z-FigMon 1.32 or higher to monitor the*")
SetVar $helpbody ($helpbody & "busted and last rob/steal sectors.*")
SetVar $helpbody ($helpbody & "Use   setmatrix C   to clear the matrix. (C can be any alphabetical*")
SetVar $helpbody ($helpbody & "letter or word. (just not a number)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " setmatrix [c|SECTORNUMBER] {SECTORNUMBER} {...}*")
Goto :DISPLAYHELP
# HELPINDEX90 
:HELPINDEX90
SetVar $helptitle "MATRIX*"
SetVar $helpbody "Displays the busted status of the red cashing sectors.*"
SetVar $helpbody ($helpbody & "Reports over subspace. Use SETMATRIX to set the sectors to display.*")
SetVar $helpbody ($helpbody & "Note that this requires Z-FigMon 1.32 or higher to monitor the*")
SetVar $helpbody ($helpbody & "busted and last rob/steal sectors.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " matrix*")
Goto :DISPLAYHELP
# HELPINDEX91 
:HELPINDEX91
SetVar $helptitle "BUSY*"
SetVar $helpbody "Responds if the bot is not busy and the prompt is not changing.*"
SetVar $helpbody ($helpbody & "If the bot does not respond within a few seconds then it is busy.*")
SetVar $helpbody ($helpbody & "Useful to check that a remote bot is not busy before issuing commands*")
SetVar $helpbody ($helpbody & "that could disrupt it.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " busy*")
Goto :DISPLAYHELP
# HELPINDEX92 
:HELPINDEX92
SetVar $helptitle "ZMAC*"
SetVar $helpbody "Runs a macro of move commands a number of times.*"
SetVar $helpbody ($helpbody & "This command requires that one of the bot move commands are called in*")
SetVar $helpbody ($helpbody & "the macro as it waits for the 'Arrived at' and 'did not arrive at'*")
SetVar $helpbody ($helpbody & "messages from the move commands before continuing each iteration.*")
SetVar $helpbody ($helpbody & "The first parameter is the number of times to execute.*")
SetVar $helpbody ($helpbody & "The rest of the command line is the macro.*")
SetVar $helpbody ($helpbody & "Use an asterisk (" & #42 & ") to signify a press of the ENTER key.*")
SetVar $helpbody ($helpbody & "Use (^m) to signify a belated press of the ENTER key.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to ABORT.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Used with the J option of the move hotkeys.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " zmac [ITERATIONS] [MACRO STRING]*")
Goto :DISPLAYHELP
# HELPINDEX93 
:HELPINDEX93
SetVar $helptitle "NDMAC*"
SetVar $helpbody "Runs a macro a number of times with a specified delay.*"
SetVar $helpbody ($helpbody & "The first parameter is the number of times to execute.*")
SetVar $helpbody ($helpbody & "The second parameter is the delay in seconds between each iteration.*")
SetVar $helpbody ($helpbody & "The rest of the command line is the macro.*")
SetVar $helpbody ($helpbody & "Use an asterisk (" & #42 & ") to signify a press of the ENTER key.*")
SetVar $helpbody ($helpbody & "Use (^m) to signify a belated press of the ENTER key.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to ABORT.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ndmac [ITERATIONS] [DELAY] [MACRO STRING]*")
Goto :DISPLAYHELP
# HELPINDEX94 
:HELPINDEX94
SetVar $helptitle "SENDLIST*"
SetVar $helpbody "Sends the jumplist over subspace to your corpies.*"
SetVar $helpbody ($helpbody & "Please run the GETLIST command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDLIST command.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Used with the J option of the move hotkeys.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sendlist*")
Goto :DISPLAYHELP
# HELPINDEX95 
:HELPINDEX95
SetVar $helptitle "GETLIST*"
SetVar $helpbody "Receives the jumplist over subspace from your corpy.*"
SetVar $helpbody ($helpbody & "Please run the GETLIST command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDLIST command on the sender bot.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & "Populates the Jumplist array and creates a file in the TWX Root*")
SetVar $helpbody ($helpbody & "named " & GAMENAME & "_JUMPLIST.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Used with the J option of the move hotkeys.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " getlist*")
Goto :DISPLAYHELP
# HELPINDEX96 
:HELPINDEX96
SetVar $helptitle "SETNEXT*"
SetVar $helpbody "Sets the next sector in the jumplist.*"
SetVar $helpbody ($helpbody & "The given sector must be in the list.*")
SetVar $helpbody ($helpbody & "Set it to 0 to make it reset to the first in the list.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Used with the J option of the move hotkeys.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " setnext [SECTOR NUMBER]*")
Goto :DISPLAYHELP
# HELPINDEX97 
:HELPINDEX97
SetVar $helptitle "HOOK*"
SetVar $helpbody "Hooks a tow onto a manned ship.*"
SetVar $helpbody ($helpbody & "This will drop fighters and take any fighters from the ship*")
SetVar $helpbody ($helpbody & "being towed, hook up then give the fighters back. The dropped*")
SetVar $helpbody ($helpbody & "fighters are retrieved. Note that a planet may be created if*")
SetVar $helpbody ($helpbody & "necessary and if torps are available.*")
SetVar $helpbody ($helpbody & "With no parameter HOOK will hook onto the first corpy in sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " hook {PLAYER NAME}*")
Goto :DISPLAYHELP
# HELPINDEX98 
:HELPINDEX98
SetVar $helptitle "PRETAX & UNLOCK*"
SetVar $helpbody "Sets cash to minimum for tax time and does an Exit/Enter.*"
SetVar $helpbody ($helpbody & "Checks the ship is unlocked as well if possible.*")
SetVar $helpbody ($helpbody & "Cash will be picked up or dropped off at the citadel as needed.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pretax*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " unlock*")
Goto :DISPLAYHELP
# HELPINDEX99 
:HELPINDEX99
SetVar $helptitle "DAMAGE*"
SetVar $helpbody "Sets damage recording ON & OFF and reports quasar damage.*"
SetVar $helpbody ($helpbody & "Use without a parameter to see a report of quasar blasts since the*")
SetVar $helpbody ($helpbody & "last report. (Only available if DAMAGE recording is ON).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " damage {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX100 
:HELPINDEX100
SetVar $helptitle "MCIC*"
SetVar $helpbody "Displays a list of high MCIC ports over subspace.*"
SetVar $helpbody ($helpbody & "Ports displayed are equipment buyers with -48 or better MCIC.*")
SetVar $helpbody ($helpbody & "You can set the maximum MCIC to display as a parameter.*")
SetVar $helpbody ($helpbody & "(DO NOT ENTER THE MINUS SIGN)*")
SetVar $helpbody ($helpbody & "This checks the MCIC sector parameter for the MCIC info.*")
SetVar $helpbody ($helpbody & "Requires _ck_equip_haggle_tracker found in the Zed-Pack to*")
SetVar $helpbody ($helpbody & "maintain the MCIC sector parameters.*")
SetVar $helpbody ($helpbody & "The list is also written to " & GAMENAME & "_MCICS.txt in the TWX root.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mcic {MAXIMUM MCIC}*")
Goto :DISPLAYHELP
# HELPINDEX101 
:HELPINDEX101
Goto :HELPINDEX98
# HELPINDEX102 
:HELPINDEX102
SetVar $helptitle "BOT*"
SetVar $helpbody "Turns the bot ON and OFF.*"
SetVar $helpbody ($helpbody & "Puts the bot in a dormant state or reawakens it.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "NOTE:*")
SetVar $helpbody ($helpbody & "If the bot is NOT RUNNING and figmon IS RUNNING use:*")
SetVar $helpbody ($helpbody & $botaddress & " FIGMON BOT ON to load the bot.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " bot [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX103 
:HELPINDEX103
SetVar $helptitle "DP*"
SetVar $helpbody "Density Photon.*"
SetVar $helpbody ($helpbody & "Scans for changes in density and photons if density increases.*")
SetVar $helpbody ($helpbody & "Use " & $botaddress & " dp OFF to turn off the command remotely.*")
SetVar $helpbody ($helpbody & "Use the tilde key to stop the command locally.*")
SetVar $helpbody ($helpbody & "Start from the citadel or command prompt. If started from a citadel,*")
SetVar $helpbody ($helpbody & "DP will return your ship to the citadel after firing or stopping.*")
SetVar $helpbody ($helpbody & "Used without parameters, DP will react to changes to all adjacents.*")
SetVar $helpbody ($helpbody & "Specify sectors as parameters and DP will only react to those sectors.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " dp [off|{SECTOR} {SECTOR} {SECTOR} {SECTOR} {SECTOR}]*")
Goto :DISPLAYHELP
# HELPINDEX104 
:HELPINDEX104
SetVar $helptitle "ROB*"
SetVar $helpbody "Attempts to rob the port in sector.*"
SetVar $helpbody ($helpbody & "Run from the CITADEL or COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Rob writes to a file called " & GAMENAME & "_PortCash.txt recording the*")
SetVar $helpbody ($helpbody & "sector number and the amount of cash left on the port after the rob.*")
SetVar $helpbody ($helpbody & "For best results, run z-figmon which tracks your busts.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " rob*")
Goto :DISPLAYHELP
# HELPINDEX105 
:HELPINDEX105
SetVar $helptitle "NAIL*"
SetVar $helpbody "Attempts to attack a fast target at a busy STARDOCK.*"
SetVar $helpbody ($helpbody & "Run this command from the COMMAND prompt at STARDOCK.*")
SetVar $helpbody ($helpbody & "Use this command when STARDOCK has a lot of ships/traders in it or*")
SetVar $helpbody ($helpbody & "when the target is docking and leaving too quickly to hit.*")
SetVar $helpbody ($helpbody & "Specify the player name as the first parameter. (One word)*")
SetVar $helpbody ($helpbody & "Nail has a predictive mode, which may catch particularly fast*")
SetVar $helpbody ($helpbody & "targets. Use PRE as the second parameter to use predictive mode.*")
SetVar $helpbody ($helpbody & "Allow for a few attempts in predictive mode while Nail determines*")
SetVar $helpbody ($helpbody & "the correct timing.*")
SetVar $helpbody ($helpbody & "Nail will refurb figs after each wave if the cash is available.*")
SetVar $helpbody ($helpbody & "Abort locally with the tilde key or use nail OFF remotely.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " nail [off|[TARGETNAME] {pre}]*")
Goto :DISPLAYHELP
# HELPINDEX106 
:HELPINDEX106
SetVar $helptitle "COMMS*"
SetVar $helpbody "Sets the comms ON.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " comms*")
Goto :DISPLAYHELP
# HELPINDEX107 
:HELPINDEX107
SetVar $helptitle "REFILL*"
SetVar $helpbody "Refills figs and shields from a planet or Class0/9.*"
SetVar $helpbody ($helpbody & "Start this command at the PLANET or COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Or, if you are at a Class0 or STARDOCK sector, start*")
SetVar $helpbody ($helpbody & "from the COMMAND, STARDOCK or WHICH ITEM prompt.*")
SetVar $helpbody ($helpbody & "If you start at the COMMAND prompt and there is more than 1*")
SetVar $helpbody ($helpbody & "planet in sector you will need to specify the planet number.*")
SetVar $helpbody ($helpbody & "NOTE that the planet must have more than 200 shields.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " refill {PLANETNUMBER}*")
Goto :DISPLAYHELP
# HELPINDEX108 
:HELPINDEX108
SetVar $helptitle "GAMESETTINGS*"
SetVar $helpbody "Retrieves the game settings.*"
SetVar $helpbody ($helpbody & "Start this command at the CITADEL or COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Retrieves the game settings and places them in a file called*")
SetVar $helpbody ($helpbody & GAMENAME & "_GAMESETTINGS.txt. The old " & GAMENAME & "_GAMESETTINGS.txt,*")
SetVar $helpbody ($helpbody & "if any, will be backed up to " & GAMENAME & "_GAMESETTINGS-last.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " gamesettings*")
Goto :DISPLAYHELP
# HELPINDEX109 
:HELPINDEX109
SetVar $helptitle "BASE*"
SetVar $helpbody "Sets the BASE sector.*"
SetVar $helpbody ($helpbody & "Sets the bots BASE sector for use with the move commands.*")
SetVar $helpbody ($helpbody & "Used without a parameter this command will report the*")
SetVar $helpbody ($helpbody & "current setting.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " base {SECTOR}*")
Goto :DISPLAYHELP
# HELPINDEX110 
:HELPINDEX110
SetVar $helptitle "SAFESECTOR*"
SetVar $helpbody "Sets the SAFE sector.*"
SetVar $helpbody ($helpbody & "Sets the bots SAFE sector for use with the move commands.*")
SetVar $helpbody ($helpbody & "Enter the sector number as a parameter.*")
SetVar $helpbody ($helpbody & "You can use A for ALPHA, R for RYLOS, and D for STARDOCK.*")
SetVar $helpbody ($helpbody & "Used without a parameter this command will report the*")
SetVar $helpbody ($helpbody & "current setting.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " safesector {SECTOR|A|R|D}*")
Goto :DISPLAYHELP
# HELPINDEX111 
:HELPINDEX111
SetVar $helptitle "SCRUB*"
SetVar $helpbody "Twarps you to SAFESECTOR and then to BASE.*"
SetVar $helpbody ($helpbody & "It is assumed that your corpy has dropped personal limpets in the*")
SetVar $helpbody ($helpbody & "safe sector. SCRUB will pick up fuel if possible at the start*")
SetVar $helpbody ($helpbody & "sector and at the safe sector.*")
SetVar $helpbody ($helpbody & "Note that used without a parameter, both BASE and SAFESECTOR must*")
SetVar $helpbody ($helpbody & "be preset in the options menu or via the BASE and SAFESECTOR commands.*")
SetVar $helpbody ($helpbody & "You can alternatively specify a temporary safe sector as a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "NOTE: The scrub sector CAN be a Class0 or STARDOCK.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " scrub {SAFESECTOR}*")
Goto :DISPLAYHELP
# HELPINDEX112 
:HELPINDEX112
SetVar $helptitle "SCRUBZONE*"
SetVar $helpbody "Lists sectors with personal limpets.*"
SetVar $helpbody ($helpbody & "Displays the list over sub space and includes the amount of limps*")
SetVar $helpbody ($helpbody & "in each sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " scrubzone*")
Goto :DISPLAYHELP
# HELPINDEX113 
:HELPINDEX113
SetVar $helptitle "CCS*"
SetVar $helpbody "Cascaded Cannon Setter.*"
SetVar $helpbody ($helpbody & "Sets the Sector cannons for all the planets in sector which have*")
SetVar $helpbody ($helpbody & "cannons and fuel. The planets share the burden of delivering the*")
SetVar $helpbody ($helpbody & "specified damage shot between them.*")
SetVar $helpbody ($helpbody & "The parameter is the amount of damage to inflict on a ship if it*")
SetVar $helpbody ($helpbody & "enters the sector.*")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100k = 100,000*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Also sets the atmospheric cannons to the specified damage.*")
SetVar $helpbody ($helpbody & "Specify NOATMOS as the second parameter to leave the atmospheric*")
SetVar $helpbody ($helpbody & "cannons as they are.*")
SetVar $helpbody ($helpbody & "Specify ATMOSOFF as the second parameter to turn them OFF.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the Citadel prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ccs [DAMAGE] {noatmos|atmosoff}*")
Goto :DISPLAYHELP
# HELPINDEX114 
:HELPINDEX114
SetVar $helptitle "TP*"
SetVar $helpbody "Twarp Photon.*"
SetVar $helpbody ($helpbody & "Twarps (or Bwarps if available) to an adjacent sector of the*")
SetVar $helpbody ($helpbody & "specified sector, fires a photon into the specified sector, and*")
SetVar $helpbody ($helpbody & "optionally Enters or TWarps back. It also allows some of the*")
SetVar $helpbody ($helpbody & "Movement system arrival options for after the photon launch.*")
SetVar $helpbody ($helpbody & "The Options are:*")
SetVar $helpbody ($helpbody & "E - Enter the target sector (mow).*")
SetVar $helpbody ($helpbody & "R - Return to start sector (TWarp).*")
SetVar $helpbody ($helpbody & "U - Surround target sector.*")
SetVar $helpbody ($helpbody & "K - Kill.*")
SetVar $helpbody ($helpbody & "X - HoloAttack (Continue attack in adjacent).*")
SetVar $helpbody ($helpbody & "W - WaveCap (Wavecap Macro).*")
SetVar $helpbody ($helpbody & "C - Capture.*")
SetVar $helpbody ($helpbody & "V - Call Saveme (No Return with this option).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note that you can use more than 1 option.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " tp [SECTOR] {r}{e}{u}{k}{x}{w}{c}{v}*")
Goto :DISPLAYHELP
# HELPINDEX115 
:HELPINDEX115
SetVar $helptitle "AUTOMATE*"
SetVar $helpbody "Turns Automate ON or OFF and sets Automate parameters.*"
SetVar $helpbody "Change settings individually or load a snapshot.*"
SetVar $helpbody "Do NOT include the extension (.aut) in the snapshot filename.*"
SetVar $helpbody ($helpbody & "Use without a parameter to check the status.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " automate {on|off}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {settype [text|textline|time12|time24]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setcommand [COMMANDLINE]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {settrigger [TRIGGER]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setreturn [WORDNUM|[BEFORETEXT] {AFTERTEXT}]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setconst1 [VALUE]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setconst2 [VALUE]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setstrip [STRIPTEXT]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setrename [SOURCEFILE DESTFILE]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {setplanet [PLANETNUM|none]}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " automate {load [SNAPSHOTFILENAME]}*")
Goto :DISPLAYHELP
# HELPINDEX116 
:HELPINDEX116
SetVar $helptitle "NEAR*"
SetVar $helpbody "Displays the 16 nearest figged sectors to the specified sector.*"
SetVar $helpbody ($helpbody & "If no sector is specified it uses the current sector.*")
SetVar $helpbody ($helpbody & "You can specify the sector number, or ALPHA, RYLOS or DOCK.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " near {SECTOR NUMBER|rylos|alpha|dock}*")
Goto :DISPLAYHELP
# HELPINDEX117 
:HELPINDEX117
SetVar $helptitle "FEDWATCH*"
SetVar $helpbody "Sends a message over sub-space when someone comes into sector.*"
SetVar $helpbody ($helpbody & "This is meant for keeping a watch on Terra or Stardock.*")
SetVar $helpbody ($helpbody & "Reports it's ON/OFF status when used without a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " fedwatch {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX118 
:HELPINDEX118
SetVar $helptitle "BBOP*"
SetVar $helpbody "Allows a planet rider to collect port data while a corpy drives the planet.*"
SetVar $helpbody ($helpbody & "Reports it's ON/OFF status when used without a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " bbop {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX119 
:HELPINDEX119
SetVar $helptitle "PRICES*"
SetVar $helpbody "Displays Hold, Fighter and Shield prices as collected each reset.*"
SetVar $helpbody ($helpbody & "This allows you to spot any upward or downward trend in pricing.*")
SetVar $helpbody ($helpbody & "The information is stored in " & GAMENAME & "_Z-Market.txt in the*")
SetVar $helpbody ($helpbody & "TWX root.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " prices*")
Goto :DISPLAYHELP
# HELPINDEX120 
:HELPINDEX120
SetVar $helptitle "DEFIG*"
SetVar $helpbody "Quickly removes a fig from an adjacent sector and retreats.*"
SetVar $helpbody ($helpbody & "USE WITH CAUTION! Only 1 wave of fighters is used.*")
SetVar $helpbody ($helpbody & "DO NOT use this command if there are enemy mines, enemy planets,*")
SetVar $helpbody ($helpbody & "or enemy traders in the adjacent sector.*")
SetVar $helpbody ($helpbody & "The first parameter is the sector number of the adjacent.*")
SetVar $helpbody ($helpbody & "The second parameter is how many fighters to use in the wave.*")
SetVar $helpbody ($helpbody & "If left blank a full wave will be used.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " defig [ADJACENT] {WAVE}*")
Goto :DISPLAYHELP
# HELPINDEX121 
:HELPINDEX121
SetVar $helptitle "GLEAN*"
SetVar $helpbody "Periodically picks up figs from the planet.*"
SetVar $helpbody ($helpbody & "Specify the delay in seconds between gleans.*")
SetVar $helpbody ($helpbody & "If no delay is specified it will default to 30 seconds.*")
SetVar $helpbody ($helpbody & "Stop this command locally with the tilde key.*")
SetVar $helpbody ($helpbody & "Add the word {cit} to the command line to wait at the citadel prompt.*")
SetVar $helpbody ($helpbody & "Add the word {sect} to the command line to wait at the command prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the PLANET prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " glean {SECONDS|off} {cit|sect}*")
Goto :DISPLAYHELP
# HELPINDEX122 
:HELPINDEX122
SetVar $helptitle "PLOCK*"
SetVar $helpbody "Allows you to prelock on a fig and Pdrop when the fig is hit.*"
SetVar $helpbody ($helpbody & "The Pdrop will work even if the fig is taken out.*")
SetVar $helpbody ($helpbody & "You can optionally CITCAP or CITKILL when you arrive.*")
SetVar $helpbody ($helpbody & "Use the RETURN parameter to return after the drop.*")
SetVar $helpbody ($helpbody & "Stop this command locally with the tilde key.*")
SetVar $helpbody ($helpbody & "Stop this command remotely with the OFF parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " plock [SECTOR|off] {kill|cap} {return}*")
Goto :DISPLAYHELP
# HELPINDEX123 
:HELPINDEX123
SetVar $helptitle "NEWS*"
SetVar $helpbody "Displays a summary of the daily logs.*"
SetVar $helpbody ($helpbody & "Use the ALL parameter to summarise all news from the start of*")
SetVar $helpbody ($helpbody & "the game.*")
SetVar $helpbody ($helpbody & "Use the SS and FED parameters to redirect output.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND or CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " news {all} {ss|fed}*")
Goto :DISPLAYHELP
# HELPINDEX124 
:HELPINDEX124
SetVar $helptitle "SHIPS*"
SetVar $helpbody "Lists known ships, optionally within a specified XPORT range.*"
SetVar $helpbody ($helpbody & "Set the range (in sectors) as the parameter.*")
SetVar $helpbody ($helpbody & "If no range is set it will display all ships.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ships {RANGE}*")
Goto :DISPLAYHELP
# HELPINDEX125 
:HELPINDEX125
SetVar $helptitle "MODE*"
SetVar $helpbody "Displays the bots MODE over subspace.*"
SetVar $helpbody ($helpbody & "You can reset the mode to GENERAL using the G parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mode {g}*")
Goto :DISPLAYHELP
# HELPINDEX126 
:HELPINDEX126
SetVar $helptitle "AUTOFURB*"
SetVar $helpbody "Sets the bot to attack a towed ship when it arrives in sector.*"
SetVar $helpbody ($helpbody & "Throws 20 figs at the first target offered.*")
SetVar $helpbody ($helpbody & "Reports it's ON/OFF status when used without a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " autofurb {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX127 
:HELPINDEX127
SetVar $helptitle "PLOW*"
SetVar $helpbody "Charges to a specified sector and calls for a planet.*"
SetVar $helpbody ($helpbody & "Uses a call saveme command to call the planet.*")
SetVar $helpbody ($helpbody & "This is faster than using the mow command with the*")
SetVar $helpbody ($helpbody & "CALL SAVEME option.*")
SetVar $helpbody ($helpbody & "The target sector must be the first parameter.*")
SetVar $helpbody ($helpbody & "The second parameter can optionally be the planet number*")
SetVar $helpbody ($helpbody & "to land on at the target sector.*")
SetVar $helpbody ($helpbody & "You can add as the last parameter the word `mow' to*")
SetVar $helpbody ($helpbody & "plow in mow mode instead of charge mode.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "NOTE: A Planet Scanner is recommended when specifying a planet.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " plow [SECTOR] {PLANETNUMBER} {mow}*")
Goto :DISPLAYHELP
# HELPINDEX128 
:HELPINDEX128
SetVar $helptitle "EVACUATE*"
SetVar $helpbody "Evacuates all movable planets to the specified sector.*"
SetVar $helpbody ($helpbody & "Use [b] to specify BASE sector or [S] for SAFE sector.*")
SetVar $helpbody ($helpbody & "You must have a TWARP for this command.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND or CITADEL prompt.*")
SetVar $helpbody ($helpbody & "This command will leave you at the target sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " evacuate [SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX129 
:HELPINDEX129
SetVar $helptitle "MOVESHIPS*"
SetVar $helpbody "Evacuates all ships to the specified sector.*"
SetVar $helpbody ($helpbody & "Use [b] to specify BASE sector or [S] for SAFE sector.*")
SetVar $helpbody ($helpbody & "You must have a TWARP for this command.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & "This command will leave you at the start sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " moveships [SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX130 
:HELPINDEX130
SetVar $helptitle "PWARP*"
SetVar $helpbody "Pwarps a planet to a specified sector.*"
SetVar $helpbody ($helpbody & "Use [b] to specify BASE sector or [S] for SAFE sector.*")
SetVar $helpbody ($helpbody & "Start this command from the CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pwarp [SECTOR]*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " p [SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX131 
:HELPINDEX131
Goto :HELPINDEX130
# HELPINDEX132 
:HELPINDEX132
SetVar $helptitle "CSHIP*"
SetVar $helpbody "Sets the current ship to corporate ownership.*"
SetVar $helpbody ($helpbody & "Also removes any existing ship password.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND or CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " cship*")
Goto :DISPLAYHELP
# HELPINDEX133 
:HELPINDEX133
SetVar $helptitle "TURNS*"
SetVar $helpbody "Displays the number of turns left over subspace.*"
SetVar $helpbody ($helpbody & "Also displays the MINIMUM TURNS as set in the bot options,*")
SetVar $helpbody ($helpbody & "and displays the amount of time left in a time limited game.*")
SetVar $helpbody ($helpbody & "Optionally set the MINIMUM TURNS Bot Option as a parameter.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " turns {MINIMUM TURNS}*")
Goto :DISPLAYHELP
# HELPINDEX134 
:HELPINDEX134
SetVar $helptitle "PINFO*"
SetVar $helpbody "Displays information about the current planet over subspace.*"
SetVar $helpbody ($helpbody & "Start this command from the PLANET prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pinfo*")
Goto :DISPLAYHELP
# HELPINDEX135 
:HELPINDEX135
SetVar $helptitle "DELIMP*"
SetVar $helpbody "Clears enemy limps from the current sector using EXIT/ENTER.*"
SetVar $helpbody ($helpbody & "Optionally places limps in sector.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " delimp {LIMPS}*")
Goto :DISPLAYHELP
# HELPINDEX136 
:HELPINDEX136
SetVar $helptitle "SEED*"
SetVar $helpbody "Sets a seed for the AUTOSS system.*"
SetVar $helpbody ($helpbody & "Allows an extra level of security when changing*")
SetVar $helpbody ($helpbody & "to a random channel with AUTOSS.*")
SetVar $helpbody ($helpbody & "The SEEDNUMBER should be a positive number.*")
SetVar $helpbody ($helpbody & "To specify 0 use none or zero or nil or clear.*")
SetVar $helpbody ($helpbody & "ALL members of the corp should have the same seed.*")
SetVar $helpbody ($helpbody & "Use without a parameter to display the current seed.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " seed {SEEDNUMBER|none|zero|nil|clear}*")
Goto :DISPLAYHELP
# HELPINDEX137 
:HELPINDEX137
SetVar $helptitle "PROMPT*"
SetVar $helpbody "Places you at the specified prompt.*"
SetVar $helpbody ($helpbody & "Possible prompts are COMMAND, CITADEL, PLANET, CITCOM.*")
SetVar $helpbody ($helpbody & "CITCOM will try for the CITADEL, if unsuccessful it will try*")
SetVar $helpbody ($helpbody & "for the COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Use without a parameter to display the current prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "You can use COM, CIT or PLA as the parameters, in place*")
SetVar $helpbody ($helpbody & "of COMMAND, CITADEL or PLANET. CITCOM has no abbreviation.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " prompt {command|citadel|planet|citcom|com|cit|pla}*")
Goto :DISPLAYHELP
# HELPINDEX138 
:HELPINDEX138
SetVar $helptitle "FS*"
SetVar $helpbody "TWARPS you to Fedspace.*"
SetVar $helpbody ($helpbody & "This will choose an adjacent at random if you are not commissioned*")
SetVar $helpbody ($helpbody & "and will move you in from there. You can specify a destination*")
SetVar $helpbody ($helpbody & "sector to charge to once in fedspace.*")
SetVar $helpbody ($helpbody & "You can also specify to land or port at the destination.*")
SetVar $helpbody ($helpbody & "Use d for stardock as the destination. Use p to port or l to land.*")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND or CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " FS {SECTOR|d} {p|l}*")
Goto :DISPLAYHELP
# HELPINDEX139 
:HELPINDEX139
SetVar $helptitle "CLEARBUST*"
SetVar $helpbody "Clears the bust parameter in a given sector.*"
SetVar $helpbody ($helpbody & "If no sector is given it uses the current sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " clearbust {SECTOR}*")
Goto :DISPLAYHELP
# HELPINDEX140 
:HELPINDEX140
SetVar $helptitle "SETBUST*"
SetVar $helpbody "Sets the bust parameter in a given sector.*"
SetVar $helpbody ($helpbody & "If no sector is given it uses the current sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " setbust {SECTOR}*")
Goto :DISPLAYHELP
# HELPINDEX141 
:HELPINDEX141
SetVar $helptitle "PORTCHECK*"
SetVar $helpbody "Sends a commerce report over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " portcheck*")
Goto :DISPLAYHELP
# HELPINDEX142 
:HELPINDEX142
SetVar $helptitle "SELLSHIPS*"
SetVar $helpbody "Sells ALL ships in the Stardock sector.*"
SetVar $helpbody ($helpbody & "Start this command from the StarDock prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sellships*")
Goto :DISPLAYHELP
# HELPINDEX143 
:HELPINDEX143
SetVar $helptitle "DISPLAY*"
SetVar $helpbody "Displays the current sector over Subspace.*"
SetVar $helpbody ($helpbody & "Start this command from the Command prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " display*")
Goto :DISPLAYHELP
# HELPINDEX144 
:HELPINDEX144
Goto :HELPINDEX20
# HELPINDEX145 
:HELPINDEX145
SetVar $helptitle "MEGA*"
SetVar $helpbody "Mega robs a port in an MBBS game.*"
SetVar $helpbody ($helpbody & "Run from the CITADEL or COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Mega writes to a file called " & GAMENAME & "_PortCash.txt*")
SetVar $helpbody ($helpbody & "recording the sector number and the amount of cash left on the*")
SetVar $helpbody ($helpbody & "port after the rob.*")
SetVar $helpbody ($helpbody & "For best results, run z-figmon which tracks your busts.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " mega*")
Goto :DISPLAYHELP
# HELPINDEX146 
:HELPINDEX146
SetVar $helptitle "BANK*"
SetVar $helpbody "Handle transactions with the Galactic Bank.*"
SetVar $helpbody ($helpbody & "Use the D parameter to deposit, W to withdraw, or T to transfer.*")
SetVar $helpbody ($helpbody & "Leave it blank to get a bank balance.*")
SetVar $helpbody ($helpbody & "The second parameter is the amount to deposit or withdraw.*")
SetVar $helpbody ($helpbody & "Leave it blank to use the maximum amount for a deposit or*")
SetVar $helpbody ($helpbody & "withdrawal but it MUST be set for a transfer.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "You can use M for millions or T or K for thousands.*")
SetVar $helpbody ($helpbody & "Example: 100k = 100,000*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the last parameter for the PLAYER NAME to transfer to.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from Stardock. (Command or Stardock prompt)*")
SetVar $helpbody ($helpbody & "The bot will return to the previous prompt after the transaction*")
SetVar $helpbody ($helpbody & "except for a bank balance when it will wait at the Galactic Bank.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " bank {d|w} {AMOUNT}*")
SetVar $helpbody ($helpbody & "   or: " & $botaddress & " bank [t] [AMOUNT] [PLAYERNAME]*")
Goto :DISPLAYHELP
# HELPINDEX147 
:HELPINDEX147
SetVar $helptitle "LEAVE*"
SetVar $helpbody "Leave the game for X number of seconds.*"
SetVar $helpbody ($helpbody & "Waits at the 'T' prompt until time is up.*")
SetVar $helpbody ($helpbody & "The default time is 10 seconds if none is given.*")
SetVar $helpbody ($helpbody & "You can automatically run a command when you log back in.*")
SetVar $helpbody ($helpbody & "Place the command line between square brackets []*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " leave {SECONDS} {[COMMANDLINE]}*")
Goto :DISPLAYHELP
# HELPINDEX148 
:HELPINDEX148
SetVar $helptitle "DELIVER*"
SetVar $helpbody "Pickup and deliver a ship using TWarp.*"
SetVar $helpbody ($helpbody & "Specify the PICKUP sector, the SHIP number, and the DELIVERY*")
SetVar $helpbody ($helpbody & "sector in the parameters. ALL Parameters must be specified.*")
SetVar $helpbody ($helpbody & "Use b = Base sector, s = Safe sector, . (period) = Current*")
SetVar $helpbody ($helpbody & "d = Stardock, r = Rylos, a = Alpha.*")
SetVar $helpbody ($helpbody & "sector for the pickup and/or delivery sectors.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " deliver [PICKUP SECTOR] [SHIP] [DELIVERY SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX149 
:HELPINDEX149
SetVar $helptitle "PR*"
SetVar $helpbody "Automatic PHOTON RESPONDER.*"
SetVar $helpbody ($helpbody & "With MULTI-PHOTONS ON:*")
SetVar $helpbody ($helpbody & "PR will fire 1 photon into every adjacent in random sequence*")
SetVar $helpbody ($helpbody & "if hit by a photon and if photons are available.*")
SetVar $helpbody ($helpbody & "With MULTI-PHOTONS OFF:*")
SetVar $helpbody ($helpbody & "PR fire at a sector randomly.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "With only one target sector PR will act very FAST.*")
SetVar $helpbody ($helpbody & "You can specify a TARGET sector for it to fire at instead of `ON'.*")
SetVar $helpbody ($helpbody & "This means that the target will be the only sector fired at.*")
SetVar $helpbody ($helpbody & "The ON parameter resets the Target sector to 0.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use without parameters to report the current PR status.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pr {ON|SECTOR|OFF}*")
Goto :DISPLAYHELP
# HELPINDEX150 
:HELPINDEX150
SetVar $helptitle "PLANET*"
SetVar $helpbody "Sets the Main Planet Number.*"
SetVar $helpbody ($helpbody & "For use with the LAND and REFILL commands, the `N' Arrival option *")
SetVar $helpbody ($helpbody & "of the Movement System, and more.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use without parameters to report the current setting.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " planet {PLANET}*")
Goto :DISPLAYHELP
# HELPINDEX151 
:HELPINDEX151
SetVar $helptitle "HERALDTURNS*"
SetVar $helpbody "Toggles HERALD TURNS ON and OFF.*"
SetVar $helpbody ($helpbody & "Use without parameters to report current status.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " heraldturns {on|off}*")
Goto :DISPLAYHELP
# HELPINDEX152 
:HELPINDEX152
SetVar $helptitle "FP*"
SetVar $helpbody "FAST Photon ATTACK.*"
SetVar $helpbody ($helpbody & "Responds to fig hits, mine and limp hits.*")
SetVar $helpbody ($helpbody & "Uses the TARGETING ARRAY for speed.*")
SetVar $helpbody ($helpbody & "Use the ARMS parameter to send the CALL to ARMS alert.*")
SetVar $helpbody ($helpbody & "Use the TWARP parameter to use TWARP to jump adjacent.*")
SetVar $helpbody ($helpbody & "Use the FAST parameter for speed at a tradeoff for safety.*")
SetVar $helpbody ($helpbody & "WARNING!! FP DOES NOT CHECK for a TWARP BLINDJUMP when the*")
SetVar $helpbody ($helpbody & "FAST option is used. Note: FAST mode only works with TWARP mode.*")
SetVar $helpbody ($helpbody & "Use the NOBUY parameter to NOT refill photons as they run out.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "PLEASE do an INIT before use or FP will.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the tilde key to abort locally. The OFF parameter remotely.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " fp {on|off|fast|twarp|arms|nobuy}*")
Goto :DISPLAYHELP
# HELPINDEX153 
:HELPINDEX153
SetVar $helptitle "INIT*"
SetVar $helpbody "Initialises the advanced TARGETING SYSTEM.*"
SetVar $helpbody ($helpbody & "Needed by some combat commands.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the QUICK parameter to skip the fig/mine refresh.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " init {quick}*")
Goto :DISPLAYHELP
# HELPINDEX154 
:HELPINDEX154
SetVar $helptitle "RADAR*"
SetVar $helpbody "Limpet Tracking Radar.*"
SetVar $helpbody ($helpbody & "Rotates on K2 sending targeting data over subspace to your.*")
SetVar $helpbody ($helpbody & "corpies. Use the OFF parameter over subspace to ABORT remotely.*")
SetVar $helpbody ($helpbody & "Use the tilde key to abort locally.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "RADAR writes sector and time data to a file in the TWX root*")
SetVar $helpbody ($helpbody & "called " & GAMENAME & "_RADARREPORT.txt only if it detects a hit.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " radar [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX155 
:HELPINDEX155
SetVar $helptitle "CLEAN*"
SetVar $helpbody "Defigs ALL surrounding adjacents FAST.*"
SetVar $helpbody ($helpbody & "Does a scan to check for shielded planets first.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the CITADEL or COMMAND prompts.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " clean*")
Goto :DISPLAYHELP
# HELPINDEX156 
:HELPINDEX156
SetVar $helptitle "COMPILE*"
SetVar $helpbody "Compiles a list of UPGRADED ports.*"
SetVar $helpbody ($helpbody & "The list is saved into the TWX Root folder with the name*")
SetVar $helpbody ($helpbody & GAMENAME & "_UPGRADED.txt. This file can then be requested by,*")
SetVar $helpbody ($helpbody & "and sent to, corpies via the GETFILE and SENDFILE commands.*")
SetVar $helpbody ($helpbody & "NOTE: Any existing UPGRADED file will be renamed to*")
SetVar $helpbody ($helpbody & GAMENAME & "_UPGRADED-backup.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Set the minimum capacity to report with the MINIMUM parameter.*")
SetVar $helpbody ($helpbody & "If no minimum is set it will default to 5000.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "NOTE: Maximums are approximations based on rounded percentages.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " compile {MINIMUM}*")
Goto :DISPLAYHELP
# HELPINDEX157 
:HELPINDEX157
SetVar $helptitle "SPG*"
SetVar $helpbody "Smart Passive Gridder.*"
SetVar $helpbody ($helpbody & "Passively grids the universe, slowly, methodically, and*")
SetVar $helpbody ($helpbody & "turn consciously.*")
SetVar $helpbody ($helpbody & "Use  ON  as the first parameter. Optionally use the second*")
SetVar $helpbody ($helpbody & "parameter to set the amount of turns to conserve.*")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "Use the  HUNT  parameter to grid sectors owned by players who*")
	SetVar $helpbody ($helpbody & "are offline, or aliens.*")
	SetVar $helpbody ($helpbody & "Use the  RABID  parameter to grid enemy sectors regardless.*")
	SetVar $helpbody ($helpbody & "Use the  SR  parameter to engage the Sector Responder if attacked.*")
End
SetVar $helpbody ($helpbody & "Use the  SS=XXX  parameter to broadcast high density*")
SetVar $helpbody ($helpbody & "sectors over SS (where XXX is the minimum density).*")
SetVar $helpbody ($helpbody & "Default is 500. Use ss=off to turn density broadcasting off.*")
SetVar $helpbody ($helpbody & "Sectors are written to a file in the TWX root called*")
SetVar $helpbody ($helpbody & GAMENAME & "_Z-SPG_HIGH_DENSITY_REPORT.txt.*")
SetVar $helpbody ($helpbody & "The REFILL parameter will refill mines, limps, figs and*")
SetVar $helpbody ($helpbody & "shields at STARDOCK as necessary.*")
SetVar $helpbody ($helpbody & "The  CALL  parameter will do a CALL SAVEME when SPG stops.*")
SetVar $helpbody ($helpbody & "The  RETURN  parameter will return you to base when done.*")
SetVar $helpbody ($helpbody & "The SCRUB parameter will jump to your SAFESECTOR to clear limps,*")
SetVar $helpbody ($helpbody & "and then to BASE. (SAFESECTOR and BASE must be set in Bot Options)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the tilde key to ABORT locally. Use the  OFF parameter*")
SetVar $helpbody ($helpbody & "to ABORT remotely.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "You can use the BRANCHES or FORKS parameter to display the number*")
SetVar $helpbody ($helpbody & "of BRANCHES left. (and then exit SPG)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Start this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & " *")
If ($z = TRUE)
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " spg [on|off|branches|forks] {MINTURNS} {ss=XXX|ss=off}*")
	SetVar $helpbody ($helpbody & "           {hunt|rabid} {sr} {refill} {call|scrub|return}*")
Else
	SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " spg [on|off|branches|forks] {MINTURNS} {ss=XXX|ss=off}*")
	SetVar $helpbody ($helpbody & "               {refill} {call|scrub|return}*")
End
Goto :DISPLAYHELP
# HELPINDEX158 
:HELPINDEX158
SetVar $helptitle "LIST*"
SetVar $helpbody "Lists files approved to be sent over SS.*"
SetVar $helpbody ($helpbody & "Edit the z-filelist.cfg file in the TWX Root to set*")
SetVar $helpbody ($helpbody & "which files (if any) are on this list.*")
SetVar $helpbody ($helpbody & "Use the SENDFILE/GETFILE commands to transmit the file.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " list*")
Goto :DISPLAYHELP
# HELPINDEX159 
:HELPINDEX159
SetVar $helptitle "SENDFILE*"
SetVar $helpbody "Sends a file over subspace.*"
SetVar $helpbody ($helpbody & "Please run the GETFILE command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDFILE command on the sender bot.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & "The file MUST appear in the z-filelist.cfg file or*")
SetVar $helpbody ($helpbody & "it is considered not approved and therefore unavailable.*")
SetVar $helpbody ($helpbody & "Do not add the " & GAMENAME & "_ or the .txt to the*")
SetVar $helpbody ($helpbody & "filename. This is done automatically.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sendfile [FILENAME]*")
Goto :DISPLAYHELP
# HELPINDEX160 
:HELPINDEX160
SetVar $helptitle "GETFILE*"
SetVar $helpbody "Receives a file over subspace.*"
SetVar $helpbody ($helpbody & "Please run the GETFILE command on the receiver bots before*")
SetVar $helpbody ($helpbody & "running the SENDFILE command on the sender bot.*")
SetVar $helpbody ($helpbody & "Use the BACKSPACE key to abort.*")
SetVar $helpbody ($helpbody & "The file MUST appear in the z-filelist.cfg file or*")
SetVar $helpbody ($helpbody & "it is considered not approved and therefore unavailable.*")
SetVar $helpbody ($helpbody & "Do not add the " & GAMENAME & "_ or the .txt to the*")
SetVar $helpbody ($helpbody & "filename. This is done automatically.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " getfile [FILENAME]*")
Goto :DISPLAYHELP
# HELPINDEX161 
:HELPINDEX161
SetVar $helptitle "PLIMPS*"
SetVar $helpbody "Drops max personal limpet mines in sector.*"
SetVar $helpbody ($helpbody & "Changes existing limpets in sector to personal.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " plimp*")
Goto :DISPLAYHELP
# HELPINDEX162 
:HELPINDEX162
SetVar $helptitle "CLIMPS*"
SetVar $helpbody "Drops max corporate limpet mines in sector.*"
SetVar $helpbody ($helpbody & "Changes existing limpets in sector to corporate.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " climp*")
Goto :DISPLAYHELP
# HELPINDEX163 
:HELPINDEX163
SetVar $helptitle "ASSETS*"
SetVar $helpbody "Displays the Corporate Assets Report.*"
SetVar $helpbody ($helpbody & "Saves the report to a file in the TWX root called*")
SetVar $helpbody ($helpbody & GAMENAME & "_Z-ASSETS.txt.*")
SetVar $helpbody ($helpbody & "Use the SS and FED parameters to redirect output.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " assets {ss|fed}*")
Goto :DISPLAYHELP
# HELPINDEX164 
:HELPINDEX164
SetVar $helptitle "CITCAP*"
SetVar $helpbody "Attacks enemies who enter sector - refurbs after each attack.*"
SetVar $helpbody ($helpbody & "Captures the ships if possible.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " citcap [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX165 
:HELPINDEX165
SetVar $helptitle "HERALDHITS*"
SetVar $helpbody "Displays fig hit sector and adjacent over subspace.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " heraldhits [on|off]*")
Goto :DISPLAYHELP
# HELPINDEX166 
:HELPINDEX166
SetVar $helptitle "CAP*"
SetVar $helpbody "Attacks an enemy in sector - from sector or a citadel.*"
SetVar $helpbody ($helpbody & "Captures the ship if possible.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " cap*")
Goto :DISPLAYHELP
# HELPINDEX167 
:HELPINDEX167
SetVar $helptitle "SHIPPRICES*"
SetVar $helpbody "Collects ship prices if at the STARDOCK prompt and stores them*"
SetVar $helpbody ($helpbody & "in " & GAMENAME & "_SHIPPRICES.txt. Subsequent calls to this*")
SetVar $helpbody ($helpbody & "command will display the ship prices over subspace.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " shipprices*")
Goto :DISPLAYHELP
# HELPINDEX168 
:HELPINDEX168
SetVar $helptitle "ENEMYFIGS*"
SetVar $helpbody "Displays sectors with enemy figs over subspace and stores them*"
SetVar $helpbody ($helpbody & "in " & GAMENAME & "_ENEMYFIGS.txt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " enemyfigs*")
Goto :DISPLAYHELP
# HELPINDEX169 
:HELPINDEX169
SetVar $helptitle "RETIRE*"
SetVar $helpbody "Retire in a Citadel.*"
SetVar $helpbody ($helpbody & "Deposits excess credits into the citadel and unlocks the ship.*")
SetVar $helpbody ($helpbody & "Exits the game via the Citadel and shuts down Z-Bot.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Start this command from the CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " retire*")
Goto :DISPLAYHELP
# HELPINDEX170 
:HELPINDEX170
SetVar $helptitle "PA*"
SetVar $helpbody "Photon Adjacent.*"
SetVar $helpbody ($helpbody & "Fires a photon blindly at the given adjacent sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Start this command from the CITADEL or COMMAND prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " pa [SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX171 
:HELPINDEX171
SetVar $helptitle "EMPTY*"
SetVar $helpbody "Drops all but 99 ship figs onto the planet.*"
SetVar $helpbody ($helpbody & "Note: Start this command from the PLANET prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " empty*")
Goto :DISPLAYHELP
# HELPINDEX172 
:HELPINDEX172
SetVar $helptitle "SWITCHBOT*"
SetVar $helpbody "Unloads Z-Bot and loads another bot.*"
SetVar $helpbody ($helpbody & "Note: Set the  SWITCHBOT:  option in the z-options.cfg*")
SetVar $helpbody ($helpbody & "to the script filename before use.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Example z-options.cfg entry:*")
SetVar $helpbody ($helpbody & "SWITCHBOT: scripts\Mombot\__mom_bot3_1032.cts*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " switchbot*")
Goto :DISPLAYHELP
# HELPINDEX173 
:HELPINDEX173
SetVar $helptitle "XFER*"
SetVar $helpbody "Transfer figs, shields, mines to a corpy.*"
SetVar $helpbody ($helpbody & "The corpy must be in sector.*")
SetVar $helpbody ($helpbody & "Place the corpy name between square brackets on the command line.*")
SetVar $helpbody ($helpbody & "eg: [corpy]*")
SetVar $helpbody ($helpbody & "Use the FROM parameter to take items instead of give them.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use ONE of the following parameters to specify what to transfer:*")
SetVar $helpbody ($helpbody & "FS = both fighters and shields.*")
SetVar $helpbody ($helpbody & "F  = fighters only.*")
SetVar $helpbody ($helpbody & "S  = shields only.*")
SetVar $helpbody ($helpbody & "M  = armids only.*")
SetVar $helpbody ($helpbody & "L  = limps only.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "XFER will use previous settings if available on subsequent calls*")
SetVar $helpbody ($helpbody & "if no parameters are specified.*")
SetVar $helpbody ($helpbody & "XFER will always transfer the maximum amount possible.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " xfer {[CORPYNAME]} {from} {fs|f|s|m|l}*")
Goto :DISPLAYHELP
# HELPINDEX174 
:HELPINDEX174
SetVar $helptitle "ABOUT*"
SetVar $helpbody "Displays the splash screen and the z-banner.txt file.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " about*")
Goto :DISPLAYHELP
# HELPINDEX175 
:HELPINDEX175
SetVar $helptitle "AUTOREFURB*"
SetVar $helpbody "Turns the AutoRefurb ON or OFF.*"
SetVar $helpbody ($helpbody & "When ON, the AutoRefurb will respond to corpy busts with a*")
SetVar $helpbody ($helpbody & "furb command.*")
SetVar $helpbody ($helpbody & "The Furb Ship and Furb Holds need to be preset in Bot Options.*")
SetVar $helpbody ($helpbody & "Use the /DC parameter to turn on automatic decashing.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Start from the CITADEL, COMMAND or STARDOCK prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " autorefurb {on|off} {/dc}*")
Goto :DISPLAYHELP
# HELPINDEX176 
:HELPINDEX176
SetVar $helptitle "SETFURB*"
SetVar $helpbody "Sets the Furb Ship Letter and the Extra furb holds.*"
SetVar $helpbody ($helpbody & "The first parameter is the ship letter used to buy the*")
SetVar $helpbody ($helpbody & "ship at STARDOCK. Example: B  or  +A*")
SetVar $helpbody ($helpbody & "The second parameter is the number of extra holds to buy for*")
SetVar $helpbody ($helpbody & "the ship if the default holds are not enough.*")
SetVar $helpbody ($helpbody & "The extra holds parameter will be set to 0 if unspecified.*")
SetVar $helpbody ($helpbody & "Used without parameters, SETFURB reports the current settings.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " setfurb {SHIPLETTER} {EXTRAHOLDS}*")
Goto :DISPLAYHELP
# HELPINDEX177 
:HELPINDEX177
SetVar $helptitle "DASH*"
SetVar $helpbody "Displays a dashboard of active features.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " dash*")
Goto :DISPLAYHELP
# HELPINDEX178 
:HELPINDEX178
SetVar $helptitle "ACTIVE*"
SetVar $helpbody "Displays the active limp list.*"
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " active*")
Goto :DISPLAYHELP
# HELPINDEX179 
:HELPINDEX179
SetVar $helptitle "BS*"
SetVar $helpbody "Buys a ship and outfits it.*"
SetVar $helpbody ($helpbody & "BS will Twarp you to STARDOCK, buy and outfit the ship*")
SetVar $helpbody ($helpbody & "and tow it back.*")
SetVar $helpbody ($helpbody & "The first PARAMETER should be the letter used to buy the*")
SetVar $helpbody ($helpbody & "ship at STARDOCK. Include a + if it's on the second page.*")
SetVar $helpbody ($helpbody & "Example:  +e  will get a Red Rum in Sub Zero.*")
SetVar $helpbody ($helpbody & "Use the SHIPPRICES command to find the shipletters.*")
SetVar $helpbody ($helpbody & "If you want to name the ship, include the name between square brackets. []*")
SetVar $helpbody ($helpbody & "Example: [shipname] . If unnamed, the ship will be called Ship-xxx,*")
SetVar $helpbody ($helpbody & "where xxx is a random number.*")
SetVar $helpbody ($helpbody & "You can also specify what to buy for the ship.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Buy Options:*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "          R - Buy Scanners*")
SetVar $helpbody ($helpbody & "          W - Buy a Transwarp Drive*")
SetVar $helpbody ($helpbody & "          N - Buy Planet Scanners*")
SetVar $helpbody ($helpbody & "          Y - Buy Psychic Probes*")
SetVar $helpbody ($helpbody & "          H - Buy Cargo Holds*")
SetVar $helpbody ($helpbody & "          F - Buy Fighters*")
SetVar $helpbody ($helpbody & "         SH - Buy Shields*")
SetVar $helpbody ($helpbody & "          A - Buy Atomic Detonators*")
SetVar $helpbody ($helpbody & "          B - Buy Beacons*")
SetVar $helpbody ($helpbody & "          C - Buy Corbomite Devices*")
SetVar $helpbody ($helpbody & "          D - Buy Cloaking Devices*")
SetVar $helpbody ($helpbody & "          E - Buy Ethernet Probes*")
SetVar $helpbody ($helpbody & "          L - Buy Limpet Mines*")
SetVar $helpbody ($helpbody & "          M - Buy Armid Mines*")
SetVar $helpbody ($helpbody & "          P - Buy Photon Missiles*")
SetVar $helpbody ($helpbody & "         P1 - Buy 1 Photon Missile*")
SetVar $helpbody ($helpbody & "          S - Buy Mine Disruptors*")
SetVar $helpbody ($helpbody & "          T - Buy Genesis Torpedos*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Start from the CITADEL, COMMAND or STARDOCK prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "WARNING: Ensure you have enough cash for the transaction.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " bs [SHIPLETTER] {[NAME]} {BUY OPTIONS}*")
Goto :DISPLAYHELP
# HELPINDEX180 
:HELPINDEX180
SetVar $helptitle "SP*"
SetVar $helpbody "Shield a planet using Twarp and STARDOCK.*"
SetVar $helpbody ($helpbody & "Drop ALL shields on the planet, Twarp to STARDOCK, buy Shields,*")
SetVar $helpbody ($helpbody & "Twarp back, land on the planet, enter the citadel.*")
SetVar $helpbody ($helpbody & "To repeat, use a parameter to specify how many trips.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: Start this command from the CITADEL prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "WARNING: Ensure you have enough cash for the transaction.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sp {TRIPS}*")
Goto :DISPLAYHELP
# HELPINDEX181 
:HELPINDEX181
SetVar $helptitle "FCR*"
SetVar $helpbody "Turns the FedCom Responder ON/OFF.*"
SetVar $helpbody ($helpbody & "FCR responds to certain phrases over FedCom with preset responses.*")
SetVar $helpbody ($helpbody & "Triggers phrases can have AND logic, and multiple responses.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Edit the z-fcr.cfg file in the TWX root to change the triggers*")
SetVar $helpbody ($helpbody & "and their responses. (or to see more FCR help)*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the tilde key to ABORT locally.*")
SetVar $helpbody ($helpbody & "Use the OFF parameter to ABORT remotely.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "FCR maintains a log file called " & GAMENAME & "_Z-FCR.log*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Note: There is a random delay between triggering and responding.*")
SetVar $helpbody ($helpbody & "Use the FAST parameter to respond faster.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " fcr [on|off|fast]*")
Goto :DISPLAYHELP
# HELPINDEX182 
:HELPINDEX182
SetVar $helptitle "COURSE*"
SetVar $helpbody "Plot a `safe' course from one sector to another.*"
SetVar $helpbody ($helpbody & "Displays the output over Subspace and writes to a file called*")
SetVar $helpbody ($helpbody & GAMENAME & "_BESTCOURSE.txt in the TWX Root.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "The first Parameter is the FROM sector, unless there is no second*")
SetVar $helpbody ($helpbody & "parameter, in which case the first parameter is used as the*")
SetVar $helpbody ($helpbody & "destination sector and the current sector is used as the FROM sector.*")
SetVar $helpbody ($helpbody & "The second parameter is the destination sector.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "This will check various courses and offer up a fully figged route if *")
SetVar $helpbody ($helpbody & "available. If not, it will offer the route with the least enemy figs,*")
SetVar $helpbody ($helpbody & "according to the database.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "The heading will display DIRECT COURSE if the course did not require*")
SetVar $helpbody ($helpbody & "any detours from the default path (mow or charge straight to it),*")
SetVar $helpbody ($helpbody & "otherwise it will display BEST COURSE.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the GO parameter to accept the course and attempt to move there.*")
SetVar $helpbody ($helpbody & "The GO option assumes you have NO SCANNERS or TWARP (like in a pod).*")
SetVar $helpbody ($helpbody & "Use the GO option VERY carefully! (like as a last resort >:)*")
SetVar $helpbody ($helpbody & "GO must be the last parameter on the command line.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Run the FIGS command before COURSE for better results.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " course [FROM SECTOR|TO SECTOR] {TO SECTOR} {go}*")
Goto :DISPLAYHELP
# HELPINDEX183 
:HELPINDEX183
SetVar $helptitle "SR*"
SetVar $helpbody "Sets the Sector Responder mode.*"
SetVar $helpbody ($helpbody & "Use the KILL or ON parameter to set SR to Kill mode.*")
SetVar $helpbody ($helpbody & "Use the CAP parameter to set it to CAP mode.*")
SetVar $helpbody ($helpbody & "Used with no parameters SR reports the current setting.*")
SetVar $helpbody ($helpbody & "The SR setting is persistent between resets.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " sr {kill|cap|on|off}*")
Goto :DISPLAYHELP
# HELPINDEX184 
:HELPINDEX184
SetVar $helptitle "HTX*"
SetVar $helpbody "Hook -> TWarp -> Xport -> Photon!*"
SetVar $helpbody ($helpbody & "The Photon ship MUST be in sector and have photons onboard.*")
SetVar $helpbody ($helpbody & "The Advanced Targeting System MUST be initialised.*")
SetVar $helpbody ($helpbody & "Ensure you have enough fuel for the jump.*")
SetVar $helpbody ($helpbody & "The FIRST parameter is the TARGET sector.*")
SetVar $helpbody ($helpbody & "The SECOND parameter is the photon ship number.*")
SetVar $helpbody ($helpbody & "Use the RETURN parameter (or /R) to return to the start sector.*")
SetVar $helpbody ($helpbody & "Use the STAY parameter (or /S) to stay in the photon ship.*")
SetVar $helpbody ($helpbody & "Use the ARMS parameter to issue a call to arms.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "You can also specify arrival options if you are NOT returning.*")
SetVar $helpbody ($helpbody & "E=Enter target sector, U=Surround, K=Kill, W=WaveCap, C=Cap,*")
SetVar $helpbody ($helpbody & "V= CallSave, X=HoloAttack.*")
SetVar $helpbody ($helpbody & "You can automatically run a command when all else is done.*")
SetVar $helpbody ($helpbody & "Place the command line between square brackets []*")
SetVar $helpbody ($helpbody & "Note: Start this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " htx [SECTOR] [SHIPNUM] {return|/r|stay|/s}*")
SetVar $helpbody ($helpbody & "               {e}{u}{k}{w}{c}{v}{x}*")
Goto :DISPLAYHELP
# HELPINDEX185 
:HELPINDEX185
SetVar $helptitle "MANIFEST*"
SetVar $helpbody "Displays a list of ship data over subspace.*"
SetVar $helpbody ($helpbody & "This data is kept in a file in the TWX root called*")
SetVar $helpbody ($helpbody & GAMENAME & "_MANIFEST.txt.*")
SetVar $helpbody ($helpbody & "You can sort the data using 1 of the following parameters:*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "  T = Turns Per Warp*")
SetVar $helpbody ($helpbody & "  H = Max Holds*")
SetVar $helpbody ($helpbody & "  F = Max Fighters*")
SetVar $helpbody ($helpbody & "  S = Max Shields*")
SetVar $helpbody ($helpbody & "  O = Offensive Odds*")
SetVar $helpbody ($helpbody & "  D = Defensive Odds*")
SetVar $helpbody ($helpbody & "  W = Max Fighter Attack Wave*")
SetVar $helpbody ($helpbody & "  R = Transport Range*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Use the A parameter as the 2nd parameter to set the sort to*")
SetVar $helpbody ($helpbody & "ascending (defaults to descending).*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " manifest {t|h|f|s|o|d|w|r} {a}*")
Goto :DISPLAYHELP
# HELPINDEX186 
:HELPINDEX186
SetVar $helptitle "WAVER*"
SetVar $helpbody "Wave on an adjacent sector and retreat.*"
SetVar $helpbody ($helpbody & "Waver will place a fig before retreating if it gets in.*")
SetVar $helpbody ($helpbody & "The parameter is the adjacent sector number to wave at.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Run this command from the COMMAND prompt.*")
SetVar $helpbody ($helpbody & "Waver will return you to your planet if you are on one.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " waver [SECTOR]*")
Goto :DISPLAYHELP
# HELPINDEX187 
:HELPINDEX187
SetVar $helptitle "EE*"
SetVar $helpbody "Fast Exit/Enter.*"
SetVar $helpbody ($helpbody & "For clearing limps*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Run this command from the COMMAND or CITADEL prompt.*")
SetVar $helpbody ($helpbody & "EE will return you to your planet if you are on one.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " ee*")
Goto :DISPLAYHELP
# HELPINDEX188 
:HELPINDEX188
SetVar $helptitle "REDSHIPS*"
SetVar $helpbody "Set the sector numbers for your red cashing ships.*"
SetVar $helpbody ($helpbody & "Allows Z-Figmon to track corpy busts via a ship number.*")
SetVar $helpbody ($helpbody & "The format is:")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "shipnum=sectornum shipnum=sectornum ....*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Each entry has no spaces, but is separated from the next entry by a space.*")
SetVar $helpbody ($helpbody & "Use without parameters to see the current setting.*")
SetVar $helpbody ($helpbody & "Use a minus sign (-) as the parameter to clear redships settings.*")
SetVar $helpbody ($helpbody & "New settings will replace any settings previously set by redships.*")
SetVar $helpbody ($helpbody & " *")
SetVar $helpbody ($helpbody & "Usage: " & $botaddress & " redships {SHIPNUM=SECTORNUM SHIPNUM=SECTORNUM}*")
Goto :DISPLAYHELP

# DISPLAYHELP 
:DISPLAYHELP
SetVar $helpline "----------------------------------------------------------------------*"
SetVar $Z_Lib~message $helpline & "Z-Bot: Help - " & $helptitle & $helpline & $helpbody & $helpline
SetVar $Z_Lib~messageto $messageto
SetVar $Z_Lib~messagemode $messagemode
Gosub :Z_Lib~MESSAGE
SetVar $messageto ""
SetVar $messagemode "R"
SetVar $helpline ""
SetVar $helptitle ""
SetVar $helpbody ""
Return
