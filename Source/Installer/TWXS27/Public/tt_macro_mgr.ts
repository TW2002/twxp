# Script Name	: Traitor's Macro Manager
# Author        : Traitor <traitor@tw-cabal.com> 
# Description   : A simple tool for macro management.
setvar $version "2.2.4 08/25/06"
# TODO:
#	Add in [ ] for system variables
#	Add in ( ) for replace text
#	make it handle up to 25 macros

# if you don't like system scripts, comment out the following line:
systemscript

# This section defines the arrays and sets other fixxed variables
:setArrays
setarray $macros 15
setarray $t_hotKey 21
setvar $fullLetterString "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"
setvar $macroLetterString "B C D E F G J K L N O P Q R S T U W X Y Z"

# This section is where I load any previously stored information.
# This data can be found in the twx\data directory in the <gamname>.cfg file.
:loadMacros
loadvar $t_macro_1
loadvar $t_macro_2
loadvar $t_macro_3
loadvar $t_macro_4
loadvar $t_macro_5
loadvar $t_macro_6
loadvar $t_macro_7
loadvar $t_macro_8
loadvar $t_macro_9
loadvar $t_macro_10
loadvar $t_macro_11
loadvar $t_macro_12
loadvar $t_macro_13
loadvar $t_macro_14
loadvar $t_macro_15
loadvar $t_hotKey_B
loadvar $t_hotKey_C
loadvar $t_hotKey_D
loadvar $t_hotKey_E
loadvar $t_hotKey_F
loadvar $t_hotKey_G
loadvar $t_hotKey_J
loadvar $t_hotKey_K
loadvar $t_hotKey_L
loadvar $t_hotKey_N
loadvar $t_hotKey_O
loadvar $t_hotKey_P
loadvar $t_hotKey_Q
loadvar $t_hotKey_R
loadvar $t_hotKey_S
loadvar $t_hotKey_T
loadvar $t_hotKey_U
loadvar $t_hotKey_W
loadvar $t_hotKey_X
loadvar $t_hotKey_Y
loadvar $t_hotKey_Z
# The following hotkeys are NOT used because they conflict with existing keys,
#   Things like Enter, Tab, backspace, etc...
# loadvar $t_hotKey_A
# loadvar $t_hotKey_H
# loadvar $t_hotKey_I
# loadvar $t_hotKey_M
# loadvar $t_hotKey_V

# If there are no previous macros, then this sets them all to SPACE
if ($t_macro_1 = 0) OR ($t_macro_1 = "")
	setvar $t_macro_1 " "
	setvar $t_macro_2 " "
	setvar $t_macro_3 " "
	setvar $t_macro_4 " "
	setvar $t_macro_5 " "
	setvar $t_macro_6 " "
	setvar $t_macro_7 " "
	setvar $t_macro_8 " "
	setvar $t_macro_9 " "
	setvar $t_macro_10 " "
	setvar $t_macro_11 " "
	setvar $t_macro_12 " "
	setvar $t_macro_13 " "
	setvar $t_macro_14 " "
	setvar $t_macro_15 " "
	setvar $t_hotKey_B " "
	setvar $t_hotKey_C " "
	setvar $t_hotKey_D " "
	setvar $t_hotKey_E " "
	setvar $t_hotKey_F " "
	setvar $t_hotKey_G " "
	setvar $t_hotKey_J " "
	setvar $t_hotKey_K " "
	setvar $t_hotKey_L " "
	setvar $t_hotKey_N " "
	setvar $t_hotKey_O " "
	setvar $t_hotKey_P " "
	setvar $t_hotKey_Q " "
	setvar $t_hotKey_R " "
	setvar $t_hotKey_S " "
	setvar $t_hotKey_T " "
	setvar $t_hotKey_U " "
	setvar $t_hotKey_W " "
	setvar $t_hotKey_X " "
	setvar $t_hotKey_Y " "
	setvar $t_hotKey_Z " "
	# The following hotkeys are NOT used because they conflict with existing keys,
	#   Things like Enter, Tab, backspace, etc...
	# setvar $t_hotKey_A " "
	# setvar $t_hotKey_H " "
	# setvar $t_hotKey_I " "
	# setvar $t_hotKey_M " "
	# setvar $t_hotKey_V " "
end
# This puts the saved data into the macro and hotkey arrays
setvar $macros[1] $t_macro_1
setvar $macros[2] $t_macro_2
setvar $macros[3] $t_macro_3
setvar $macros[4] $t_macro_4
setvar $macros[5] $t_macro_5
setvar $macros[6] $t_macro_6
setvar $macros[7] $t_macro_7
setvar $macros[8] $t_macro_8
setvar $macros[9] $t_macro_9
setvar $macros[10] $t_macro_10
setvar $macros[11] $t_macro_11
setvar $macros[12] $t_macro_12
setvar $macros[13] $t_macro_13
setvar $macros[14] $t_macro_14
setvar $macros[15] $t_macro_15
setvar $t_hotkey[1] $t_hotKey_B
setvar $t_hotkey[2] $t_hotKey_C
setvar $t_hotkey[3] $t_hotKey_D
setvar $t_hotkey[4] $t_hotKey_E
setvar $t_hotkey[5] $t_hotKey_F
setvar $t_hotkey[6] $t_hotKey_G
setvar $t_hotkey[7] $t_hotKey_J
setvar $t_hotkey[8] $t_hotKey_K
setvar $t_hotkey[9] $t_hotKey_L
setvar $t_hotkey[10] $t_hotKey_N
setvar $t_hotkey[11] $t_hotKey_O
setvar $t_hotkey[12] $t_hotKey_P
setvar $t_hotkey[13] $t_hotKey_Q
setvar $t_hotkey[14] $t_hotKey_R
setvar $t_hotkey[15] $t_hotKey_S
setvar $t_hotkey[16] $t_hotKey_T
setvar $t_hotkey[17] $t_hotKey_U
setvar $t_hotkey[18] $t_hotKey_W
setvar $t_hotkey[19] $t_hotKey_X
setvar $t_hotkey[20] $t_hotKey_Y
setvar $t_hotkey[21] $t_hotKey_Z
goto :banners

# Here is where the banner and instructions are called
:banners
killalltriggers
gosub :egoBanner
echo ANSI_9 "**      " #42 #42 #42 ANSI_10 " Traitor's " ANSI_11 "Macro Manager, " ANSI_3 "version: " ANSI_11 $version " " ANSI_9 #42 #42 #42 "**"
echo ANSI_10 "Welcome to Traitor's Macro Manager, a simple macro manager similar to DOSKEY.*"
gosub :instructions
echo ANSI_11 "*TMM " ANSI_10 "Loaded! Press any " ANSI_11 "Arrow" ANSI_10 " Key to activate. ***"
send #145
goto :start

# This is where the script waits for an arrow or a hotket to be pressed
:start
setvar $count 1
setvar $isHotKey 0
setvar $tempMacro $macros[1]
replacetext $tempMacro "#42" "*"
replacetext $tempMacro #42 "*"
getlength $tempMacro $tempMacroLength
setvar $cursorPos ($tempMacroLength + 1)
setvar $frontMacro $macros[1]
setvar $tailMacro ""
settextouttrigger waitUpArrow :waitArrow #27 & "[A"
settextouttrigger waitDownArrow :waitArrow #27 & "[B"
settextouttrigger waitRightArrow :waitArrow #27 & "[C"
settextouttrigger waitLeftArrow :waitArrow #27 & "[D"
settextouttrigger waitCtrlA :waitCtrlA #1
settextouttrigger waitCtrlB :waitHotKey #2
settextouttrigger waitCtrlC :waitHotKey #3
settextouttrigger waitCtrlD :waitHotKey #4
settextouttrigger waitCtrlE :waitHotKey #5
settextouttrigger waitCtrlF :waitHotKey #6
settextouttrigger waitCtrlG :waitHotKey #7
settextouttrigger waitCtrlJ :waitHotKey #10
settextouttrigger waitCtrlK :waitHotKey #11
settextouttrigger waitCtrlL :waitHotKey #12
settextouttrigger waitCtrlN :waitHotKey #14
settextouttrigger waitCtrlO :waitHotKey #15
settextouttrigger waitCtrlP :waitHotKey #16
settextouttrigger waitCtrlQ :waitHotKey #17
settextouttrigger waitCtrlR :waitHotKey #18
settextouttrigger waitCtrlS :waitHotKey #19
settextouttrigger waitCtrlT :waitHotKey #20
settextouttrigger waitCtrlU :waitHotKey #21
settextouttrigger waitCtrlW :waitHotKey #23
settextouttrigger waitCtrlX :waitHotKey #24
settextouttrigger waitCtrlY :waitHotKey #25
settextouttrigger waitCtrlZ :waitHotKey #26
pause

:waitArrow
killtrigger waitUpArrow
killtrigger waitDownArrow
killtrigger waitRightArrow
killtrigger waitLeftArrow
killtrigger waitCtrlA
echo ANSI_11 "**T_Macro Edit Mode. " ANSI_10 "Press '" ANSI_11 "+" ANSI_10 "' for help.**"
:editMode
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
replacetext $tempMacro " " #250
echo ANSI_10 $tempMacro
replacetext $tempMacro #250 " "
replacetext $tempMacro #42 "*"
replacetext $tempMacro "#42" "*"
getlength $tempMacro $tempMacroLength
setvar $cursorPos ($tempMacroLength + 1)
setvar $frontMacro $tempMacro
setvar $tailMacro ""
:arrowTriggers
settextouttrigger upArrow :upArrow #27 & "[A"
settextouttrigger downArrow :downArrow #27 & "[B"
settextouttrigger rightArrow :rightArrow #27 & "[C"
settextouttrigger leftArrow :leftArrow #27 & "[D"
settextouttrigger endKey :endKey #27 & "[K"
settextouttrigger homeKey :homeKey #27 & "[H"
settextouttrigger tabKey :tabKey #9
settextouttrigger openBrace :openBrace "{"
settextouttrigger grabText :grabText
settexttrigger reEcho :reEcho 
# shift+tab reserved for something I'll think of later :)
# settextouttrigger shiftTab :shiftTab #27 & "[Z"
pause

# This is here for when incoming text obliterates your macro in progress!!
:reEcho
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
replacetext $tempMacro " " #250
echo ANSI_10 #27 "[99D" #27 "[K" $tempMacro #27 "[" ($tempMacroLength - ($cursorPos - 1)) "D"
if ($cursorPos >= $tempMacroLength)
	echo ANSI_10 #27 "[1C"
end
if ($cursorPos = 1)
	echo ANSI_10 #27 "[1D"
end
replacetext $tempMacro #250 " "
replacetext $tempMacro #42 "*"
replacetext $tempMacro "#42" "*"
settexttrigger reEcho :reEcho 
pause

:tabKey
killalltriggers
setvar $tabCount 1
echo ANSI_11 "**Please select a macro:*"
while ($tabCount <= 15)
	setvar $tempMacro $macros[$tabCount]
	replacetext $tempMacro "*" #42
	replacetext $tempMacro "#42" #42
	replacetext $tempMacro " " #250
	echo ANSI_14 " " $tabCount ": '" ANSI_10 $tempMacro ANSI_14 "'*"
	add $tabCount 1
end
echo ANSI_11 & "*Which number? "     
getinput $tabSelection ""
isnumber $yn $tabSelection 
if ($yn = 0)
	goto :endkey
end
if ($tabSelection > 15) OR ($tabSelection < 1)
	goto :endkey
else
	setvar $tempMacro $macros[$tabSelection]
	echo ANSI_10 "*"
	goto :editMode
end

:homekey
killalltriggers
setvar $tempMacro ""
echo ANSI_10 #27 "[99D" #27 "[K"
goto :arrowTriggers

:endkey
killalltriggers
echo ANSI_11 "*Canceled.  TMM still active.*"
goto :start

:grabText
getouttext $key
# If they press enter, process the macro
if ($key = #13)
	goto :processMacro
end
# if they press Backspace
if ($key = #8)
	goto :backspaceKey
end
# if they press Delete
if ($key = #127)
	goto :deleteKey
end
if ($key = #22)
	goto :insertKey
end
if ($key = "+")
	goto :banners
end
# if they press any other key besides an arrow key, add it in
if ($cursorPos = 1)
	setvar $frontMacro ""
	setvar $tailMacro $tempMacro
elseif ($cursorPos >= $tempMacroLength)
	setvar $frontMacro $tempMacro
	setvar $tailMacro ""
else
	cuttext $tempMacro $frontMacro 1 ($cursorPos - 1)
	cuttext $tempMacro $tailMacro $cursorPos ($tempMacroLength - ($cursorPos - 1))
end
setvar $tempMacro $frontMacro & $key & $tailMacro
getlength $tailMacro $tailLength
getlength $tempMacro $tempMacroLength
if ($tailLength = 0)
	setvar $tailLength 1
end
replacetext $tempMacro "*" #42
replacetext $tempMacro " " #250
echo ANSI_10 #27 "[99D" #27 "[K" $tempMacro #27 "[" ($tempMacroLength - $cursorPos) "D"
if ($tailMacro = "")
	echo ANSI_10 #27 "[1C"
end
add $cursorPos 1
# add $tempMacroLength 1
settextouttrigger grabText :grabText
pause

# The insert key will add a macro to the list without sending it.
:insertKey
killalltriggers
setvar $insertOnly 1
goto :processMacro

:backspaceKey
killalltriggers
if ($cursorPos = 1)
	goto :arrowTriggers
elseif ($cursorPos >= $tempMacroLength)
	setvar $frontMacro $tempMacro
	setvar $tailMacro ""
else
	cuttext $tempMacro $frontMacro 1 ($cursorPos - 1)
	cuttext $tempMacro $tailMacro $cursorPos ($tempMacroLength - ($cursorPos - 1))
end
getlength $frontMacro $frontLength
cuttext $frontMacro $frontMacro 1 ($frontLength - 1)
setvar $tempMacro $frontMacro & $tailMacro
getlength $tempMacro $tempMacroLength
subtract $cursorPos 1
replacetext $tempMacro "*" #42
replacetext $tempMacro " " #250
if ($frontMacro = "")
	setvar $cursorPos 1
end
echo ANSI_10 #27 "[99D" #27 "[K" $tempMacro #27 "[" ($tempMacroLength - ($cursorPos -1)) "D"
if ($tailMacro = "") AND ($frontMacro <> "")
	echo ANSI_10 #27 "[1C"
end
goto :arrowTriggers

:deleteKey
killalltriggers
if ($cursorPos = 1)
	setvar $frontMacro ""
	setvar $tailMacro $tempMacro
elseif ($cursorPos > $tempMacroLength)
	goto :arrowTriggers
elseif ($cursorPos = $tempMacroLength)
	cuttext $tempMacro $tempMacro 1 ($tempMacroLength - 1)
	subtract $tempMacroLength 1
	replacetext $tempMacro "*" #42
	replacetext $tempMacro " " #250
	echo ANSI_10 #27 "[99D" #27 "[K" $tempMacro #27 "[" ($tempMacroLength - ($cursorPos -1)) "D"
	if ($tailMacro = "")
		echo ANSI_10 #27 "[1C"
	end
	goto :arrowTriggers
else
	cuttext $tempMacro $frontMacro 1 $cursorPos
	cuttext $tempMacro $tailMacro ($cursorPos + 1) ($tempMacroLength - $cursorPos)
end
getlength $frontMacro $frontLength
if ($frontLength = 0)
	cuttext $tailMacro $tailMacro 2 ($tempMacroLength - 1)
else
	cuttext $frontMacro $frontMacro 1 ($frontLength - 1)
end
setvar $tempMacro $frontMacro & $tailMacro
getlength $tempMacro $tempMacroLength
replacetext $tempMacro "*" #42
replacetext $tempMacro " " #250
if ($frontMacro = "")
	setvar $cursorPos 1
end
echo ANSI_10 #27 "[99D" #27 "[K" $tempMacro #27 "[" ($tempMacroLength - ($cursorPos -1)) "D"
if ($tailMacro = "") AND ($frontMacro <> "")
	echo ANSI_10 #27 "[1C"
end
goto :arrowTriggers

:upArrow
killalltriggers
if ($count = 15)
	setvar $count 1
else
	add $count 1
end
setvar $tempMacro $macros[$count] 
if ($tempMacro = "") OR ($tempMacro = " ")
	goto :upArrow
end
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
replacetext $tempMacro " " #250
echo ANSI_10 #27 "[99D" #27 "[K"
goto :editMode

:downArrow
killalltriggers
if ($count = 1)
	setvar $count 15
else
	subtract $count 1
end
setvar $tempMacro $macros[$count] 
if ($tempMacro = "") OR ($tempMacro = " ")
	goto :downArrow
end
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
replacetext $tempMacro " " #250
echo ANSI_10 #27 "[99D" #27 "[K"
goto :editMode

:rightArrow
killalltriggers
if ($cursorPos > $tempMacroLength)
	goto :arrowTriggers
else
	add $cursorPos 1
	echo ANSI_10 #27 "[1C"
	goto :arrowTriggers
end
 
:leftArrow
killalltriggers
if ($cursorPos = 1)
	goto :arrowTriggers
else
	subtract $cursorPos 1
	echo ANSI_10 #27 "[1D"
	goto :arrowTriggers
end

:processMacro
killalltriggers
replacetext $tempMacro "*" #42
replacetext $tempMacro #250 " "
if ($tempMacro = "")
	goto :start
end
setvar $tempMacro $tempMacro & "@@"
gettext $tempMacro $loops ":" "@@"
striptext $tempMacro "@"
isnumber $yn $loops
if ($yn = 0)
	setvar $loops 1
else
	getwordpos $tempMacro $tempMacroLength ":"
	subtract $tempMacroLength 1
	cuttext $tempMacro $tempMacro 1 $tempMacroLength
end

# insert processing of the [] commands and the / commands

if ($insertOnly = 1)
	echo ANSI_10 "*MACRO TO STORE: '" ANSI_11 $tempMacro ANSI_10 "'"
	replacetext $tempMacro #42 "*"
	replacetext $tempMacro "#42" "*"
	goto :cleanup
else
	echo ANSI_10 "*MACRO TO EXECUTE: '" ANSI_11 $tempMacro ANSI_10 "'"
	echo ANSI_10 "*Send Macro " ANSI_11 $loops ANSI_10 " times.*"
	replacetext $tempMacro #42 "*"
	replacetext $tempMacro "#42" "*"
	setvar $loopCount 1
end
while ($loopCount <= $loops)
	send $tempMacro
	add $loopCount 1
end

:cleanup
# cleanup and macro save
setvar $insertOnly 0
if ($loops > 1)
	setvar $tempMacro $tempMacro & ":" & $loops
end
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
if ($tempMacro = $macros[1]) OR ($isHotKey = 1)
	goto :start
else
	replacetext $tempMacro "*" #42
	setvar $macros[15] $macros[14]
	setvar $macros[14] $macros[13]
	setvar $macros[13] $macros[12]
	setvar $macros[12] $macros[11]
	setvar $macros[11] $macros[10]
	setvar $macros[10] $macros[9]
	setvar $macros[9] $macros[8]
	setvar $macros[8] $macros[7]
	setvar $macros[7] $macros[6]
	setvar $macros[6] $macros[5]
	setvar $macros[5] $macros[4]
	setvar $macros[4] $macros[3]
	setvar $macros[3] $macros[2]
	setvar $macros[2] $macros[1]
	setvar $macros[1] $tempMacro
	setvar $t_macro_1 $macros[1]
	setvar $t_macro_2 $macros[2]
	setvar $t_macro_3 $macros[3]
	setvar $t_macro_4 $macros[4]
	setvar $t_macro_5 $macros[5]
	setvar $t_macro_6 $macros[6]
	setvar $t_macro_7 $macros[7]
	setvar $t_macro_8 $macros[8]
	setvar $t_macro_9 $macros[9]
	setvar $t_macro_10 $macros[10]
	setvar $t_macro_11 $macros[11]
	setvar $t_macro_12 $macros[12]
	setvar $t_macro_13 $macros[13]
	setvar $t_macro_14 $macros[14]
	setvar $t_macro_15 $macros[15]
	savevar $t_macro_1
	savevar $t_macro_2
	savevar $t_macro_3
	savevar $t_macro_4
	savevar $t_macro_5
	savevar $t_macro_6
	savevar $t_macro_7
	savevar $t_macro_8
	savevar $t_macro_9
	savevar $t_macro_10
	savevar $t_macro_11
	savevar $t_macro_12
	savevar $t_macro_13
	savevar $t_macro_14
	savevar $t_macro_15
	goto :start
end

#--------------------------------------------
# ----====[ MACRO RECORDING SECTION ]====----
#--------------------------------------------
:openBrace
killalltriggers
echo ANSI_10 #27 "[99D" #27 "[K MACRO RECORDING MODE! Press } to stop recording!**"
send #145
setvar $tempMacro ""

:beginRecording
settextouttrigger recordKey :recordKey
pause

:recordKey
getouttext $key
if ($key = "}")
	goto :endRecording
end
setvar $tempMacro $tempMacro & $key
processout $key
settextouttrigger recordKey :recordKey
pause

:endRecording
killalltriggers
echo ANSI_10 "**MACRO RECORDING FINSIHED!**"
replacetext $tempMacro "*" #42
replacetext $tempMacro " " #250
if ($tempMacro = "")
	goto :start
end
echo ANSI_10 "*Recorded Macro: '" ANSI_11 $tempMacro ANSI_10 "'*"
replacetext $tempMacro #250 " "
replacetext $tempMacro #42 "*"
replacetext $tempMacro "#42" "*"
goto :cleanup

#-----------------------------
# ----====[ HOT KEYS ]====----
#-----------------------------
:waitCtrlA
killalltriggers
echo ANSI_11 "*Macro Hotkey Mode!*"

echo ANSI_11 "**Please select " ANSI_11 "Hot Key" ANSI_10 " or press " ANSI_11 "I" ANSI_10 " to import or " ANSI_11 "E" ANSI_10 " to export.:*"
setvar $HKCount 1
echo ANSI_14 "* HotKey      Macro*"
while ($HKCount <= 21)
	getword $macroLetterString $HKLetter $HKCount
	replacetext $t_hotkey[$HKCount] " " #250
	echo ANSI_11 "Ctrl + " $HKLetter ANSI_14 " =  '" ANSI_10  $t_hotkey[$HKCount] ANSI_14 "'*"
	replacetext $t_hotkey[$HKCount] #250 " "
	add $HKCount 1
end
echo ANSI_10 "**Press the hotkey you want the macro bound too.**"
getconsoleinput $bind SINGLEKEY
if ($bind = "e")
	goto :exportHK
end
if ($bind = "i")
	goto :importHK
end
striptext $bind "#"
getcharcode $bind $bind
if ($bind < 1) OR ($bind > 26) OR ($bind = 8) OR ($bind = 9) OR ($bind = 13) OR ($bind = 22)
	goto :endkey
end
setvar $tabCount 1
echo ANSI_11 "**Now, select a macro:*"
while ($tabCount <= 15)
	setvar $tempMacro $macros[$tabCount]
	replacetext $tempMacro "*" #42
	replacetext $tempMacro "#42" #42
	replacetext $tempMacro " " #250
	echo ANSI_14 " " $tabCount ": '" ANSI_10 $tempMacro ANSI_14 "'*"
	add $tabCount 1
end
echo ANSI_11 & "*Enter the macro number: "
getinput $tabSelection ""
isnumber $yn $tabSelection 
if ($yn = 0)
	goto :endkey
end
if ($tabSelection > 15) OR ($tabSelection < 1)
	goto :endkey
else
	setvar $tempMacro $macros[$tabSelection]
end
replacetext $tempMacro "*" #42
replacetext $tempMacro "#42" #42
replacetext $tempMacro " " #250
getword $fullLetterString $tempLetter $bind
echo ANSI_14 "* '" ANSI_10 $tempMacro ANSI_14 "' bound too '" ANSI_10 "Ctrl + " $tempLetter " *"
replacetext $tempMacro #250 " "
replacetext $tempMacro #42 "*"
replacetext $tempMacro "#42" "*"
replacetext $tempMacro "*" #42
if ($bind > 22)
	subtract $bind 5
elseif ($bind > 13)
	subtract $bind 4
elseif ($bind > 9)
	subtract $bind 3
else
	subtract $bind 1
end
setvar $t_hotkey[$bind] $tempMacro
:saveHotkeys
setvar $t_hotKey_B $t_hotkey[1]
setvar $t_hotKey_C $t_hotkey[2]
setvar $t_hotKey_D $t_hotkey[3]
setvar $t_hotKey_E $t_hotkey[4]
setvar $t_hotKey_F $t_hotkey[5]
setvar $t_hotKey_G $t_hotkey[6]
setvar $t_hotKey_J $t_hotkey[7]
setvar $t_hotKey_K $t_hotkey[8]
setvar $t_hotKey_L $t_hotkey[9]
setvar $t_hotKey_N $t_hotkey[10]
setvar $t_hotKey_O $t_hotkey[11]
setvar $t_hotKey_P $t_hotkey[12]
setvar $t_hotKey_Q $t_hotkey[13]
setvar $t_hotKey_R $t_hotkey[14]
setvar $t_hotKey_S $t_hotkey[15]
setvar $t_hotKey_T $t_hotkey[16]
setvar $t_hotKey_U $t_hotkey[17]
setvar $t_hotKey_W $t_hotkey[18]
setvar $t_hotKey_X $t_hotkey[19]
setvar $t_hotKey_Y $t_hotkey[20]
setvar $t_hotKey_Z $t_hotkey[21]

savevar $t_hotKey_B
savevar $t_hotKey_C
savevar $t_hotKey_D
savevar $t_hotKey_E
savevar $t_hotKey_F
savevar $t_hotKey_G
savevar $t_hotKey_J
savevar $t_hotKey_K
savevar $t_hotKey_L
savevar $t_hotKey_N
savevar $t_hotKey_O
savevar $t_hotKey_P
savevar $t_hotKey_Q
savevar $t_hotKey_R
savevar $t_hotKey_S
savevar $t_hotKey_T
savevar $t_hotKey_U
savevar $t_hotKey_W
savevar $t_hotKey_X
savevar $t_hotKey_Y
savevar $t_hotKey_Z
goto :start

:waitHotKey
killalltriggers
getouttext $hotKey
if ($hotkey = #2)
	setvar $tempMacro $t_hotkey[1]
elseif ($hotkey = #3)
	setvar $tempMacro $t_hotkey[2]
elseif ($hotkey = #4)
	setvar $tempMacro $t_hotkey[3]
elseif ($hotkey = #5)
	setvar $tempMacro $t_hotkey[4]
elseif ($hotkey = #6)
	setvar $tempMacro $t_hotkey[5]
elseif ($hotkey = #7)
	setvar $tempMacro $t_hotkey[6]
elseif ($hotkey = #10)
	setvar $tempMacro $t_hotkey[7]
elseif ($hotkey = #11)
	setvar $tempMacro $t_hotkey[8]
elseif ($hotkey = #12)
	setvar $tempMacro $t_hotkey[9]
elseif ($hotkey = #14)
	setvar $tempMacro $t_hotkey[10]
elseif ($hotkey = #15)
	setvar $tempMacro $t_hotkey[11]
elseif ($hotkey = #16)
	setvar $tempMacro $t_hotkey[12]
elseif ($hotkey = #17)
	setvar $tempMacro $t_hotkey[13]
elseif ($hotkey = #18)
	setvar $tempMacro $t_hotkey[14]
elseif ($hotkey = #19)
	setvar $tempMacro $t_hotkey[15]
elseif ($hotkey = #20)
	setvar $tempMacro $t_hotkey[16]
elseif ($hotkey = #21)
	setvar $tempMacro $t_hotkey[17]
elseif ($hotkey = #23)
	setvar $tempMacro $t_hotkey[18]
elseif ($hotkey = #24)
	setvar $tempMacro $t_hotkey[19]
elseif ($hotkey = #25)
	setvar $tempMacro $t_hotkey[20]
elseif ($hotkey = #26)
	setvar $tempMacro $t_hotkey[21]
end
# echo ANSI_10 "*$tempMacro = '" ANSI_11 $tempMacro ANSI_10 "'*"
setvar $isHotKey 1
goto :processMacro

:importHK
echo ANSI_10 "**Importing Hotkeys from File!*"
echo ANSI_10 "*Enter Hotkey file name: (.txt will be appended)**"
getinput $HKFileName ""
setvar $HKFileName $HKFileName & ".txt"
fileexists $yn $HKFileName
if ($yn = 0)
	echo ANSI_12 "**Invalid File Name!**"
	goto :endkey
end
echo ANSI_10 "*Importing macros from: " ANSI_11 $HKFilename ANSI_10 ". Are you sure? (y/n)"
getconsoleinput $yn SINGLEKEY
if ($yn = "y")
	setvar $hkcount 1
	while ($hkcount <= 21)
		read $HKFileName $t_hotkey[$hkcount] $hkcount
		add $hkcount 1
	end
	echo ANSI_10 "**Finished Import!**"
	goto :saveHotkeys
else
	goto :endkey
end

:exportHK
echo ANSI_10 "**Exporting Hotkeys to File!*"
echo ANSI_10 "*Enter Hotkey file name: (.txt will be appended)**"
getinput $HKFileName ""
setvar $HKFileName $HKFileName & ".txt"
fileexists $yn $HKFileName
if ($yn = 1)
	echo ANSI_14 "**File exists! Overwrite? (y/n)"
	getconsoleinput $yn SINGLEKEY
	if ($yn = "y")
		delete $HKFileName
	else
		goto :endkey
	end
end
setvar $hkcount 1
while ($hkcount <= 21)
	write $HKFileName $t_hotkey[$hkcount]
	add $hkcount 1
end
echo ANSI_10 "**Finished Export!**"
goto :start


#---------------------------------
# ----====[ INSTRUCTIONS ]====----
#---------------------------------
:instructions
echo ANSI_10 "This script is designed to be loaded from any prompt, or even off-line.*"
echo ANSI_10 "To start, press any " ANSI_11 "arrow" ANSI_10 " key.  This will recall the last macro, if any.*"
echo ANSI_10 "Press the " ANSI_11 "up" ANSI_10 " and " ANSI_11 "down" ANSI_10 " arrows to cycle through the last 15 macros.*"
echo ANSI_10 "Press the " ANSI_11 "right" ANSI_10 " or " ANSI_11 "left" ANSI_10 " arrows to move the cursor.*"
echo ANSI_10 "Type in whatever text you want, and it will insert it at the cursor location.*"
echo ANSI_10 "Use the '" ANSI_11 #42 ANSI_10 "' key for enters, just like in a regular " ANSI_11 "Burst" ANSI_10 " or " ANSI_11 "Send" ANSI_10 " command.*"
echo ANSI_10 "Press '" ANSI_11 "Delete" ANSI_10 "' to delete the character under the cursor.*"
echo ANSI_10 "Press '" ANSI_11 "Backspace" ANSI_10 "' to delete the character to the left of the cursor.*"
echo ANSI_10 "Press '" ANSI_11 "Tab" ANSI_10 "' to show the last 15 macros.  If you enter the corresponding*"
echo ANSI_11 "  number" ANSI_10 "  from there, it will select that macro.*"
echo ANSI_10 "Press '" ANSI_11 "Home" ANSI_10 "' to clear the current macro and start fresh.*"
echo ANSI_10 "Press '" ANSI_11 "End" ANSI_10 "' to cancel and return to your last game prompt.*"
echo ANSI_10 "Press '" ANSI_11 "Enter" ANSI_10 "' to " ANSI_11 "RUN" ANSI_10 " the macro. (i.e. " ANSI_11 "send" ANSI_10 " it to the " ANSI_11 "TWGS" ANSI_10 ")*"
echo ANSI_10 "Press '" ANSI_11 "Insert" ANSI_10 "' to just " ANSI_11 "ADD" ANSI_10 " the macro to the macro list without sending it.*"
echo ANSI_10 "  (This is so you can prepare to run a macro at a later time.)*"

echo ANSI_10 "*This script also has a " ANSI_11 "MACRO RECORDING" ANSI_10 " feature!*"
echo ANSI_10 "  Press '" ANSI_11 "{" ANSI_10 "' to begin recording.  Then play as normal.*"
echo ANSI_10 "  When finished recording, press '" ANSI_11 "}" ANSI_10 "' to stop recording.*"
echo ANSI_10 "  The new recorded macro will be added to your macro list.*"
echo ANSI_10 "*This script also has a " ANSI_11 "LOOPING" ANSI_10 " feature!*"
echo ANSI_10 "  At the end of your macro, you have the option to tell it how many times*"
echo ANSI_10 "  you want the macro to run.  Just add a '" ANSI_11 ":" ANSI_10 "' followed by a number to the*"
echo ANSI_10 "  end of your macro.  The number is how many loops you want.*"
echo ANSI_10 "  For example: '" ANSI_11 "s n t 1 " #42 " q j y l :100" ANSI_10 "' would run that colo jet 100 times.*"
echo ANSI_10 "*This script also has a " ANSI_11 "HOT KEY" ANSI_10 " feature!*"
echo ANSI_10 "  This script can store up to " ANSI_11 "21" ANSI_10 " hotkeys.  Hotkeys are accessed by pressing*"
echo ANSI_10 "  '" ANSI_11 "Ctrl" ANSI_10 "' + '" ANSI_11 "a" ANSI_10 "'.  This brings up the hot key menu.  Simply select a hotkey*"
echo ANSI_10 "  from the list by pressing it.  Then choose a macro to bind to it.  From*"
echo ANSI_10 "  that point on, whenever you press that hotkey, it sends that macro.*"
echo ANSI_10 "  Hotkeys are always saved between sessions too.*"
echo ANSI_10 "  The hotkeys are always '" ANSI_11 "Ctrl" ANSI_10 "' + " ANSI_11 "<alpha character>" ANSI_10 ".*"
echo ANSI_10 "  '" ANSI_11 "Ctrl" ANSI_10 "' + '" ANSI_11 "a" ANSI_10 "', '" ANSI_11 "h" ANSI_10 "', '" ANSI_11 "i" ANSI_10 "', '" ANSI_11 "m" ANSI_10 "', and '" ANSI_11 "v" ANSI_10 "' are not allowed because they emulate*"
echo ANSI_10 "  other keyboard functions. (like Enter, Tab, Delete, etc...)*"
echo ANSI_10 "  You can press '" ANSI_11 "Ctrl" ANSI_10 "' + '" ANSI_11 "a" ANSI_10 "' at any time to change your hotkeys.*"
echo ANSI_10 "  You can also import and export hotkeys for use between different games.*"

echo ANSI_14 "*NOTE:" ANSI_10 " Spaces are displayed as '" ANSI_11 #250 ANSI_10 "'.  this is normal, and only actual spaces*"
echo ANSI_10 "      are sent.*"
echo ANSI_14 "NOTE:" ANSI_10 " Macros and Hotkeys are saved for each game, but are not shared between*"
echo ANSI_10 "      different games!*"
echo ANSI_14 "NOTE:" ANSI_10 " Macros longer than one line of text will work, but editing them is*"
echo ANSI_10 "      difficult and not recommended!  " ANSI_14 "Seriously" ANSI_10 ", at that point, use notepad*"
echo ANSI_10 "      or something and paste them in instead.*"
echo ANSI_14 "NOTE:" ANSI_12 " THIS IS A SYSTEM SCRIPT! Press '" ANSI_11 "$ s i k" ANSI_12 "' and select the corresponding*"
echo ANSI_12 "      number to halt it!**"
echo ANSI_12 #27 "[5;31;40mATTENTION SWATH USERS! " #27 "[0;33;40m" ANSI_14 " You can't use this script because Swath has *"
echo ANSI_14 "   remapped the arrow keys.  I e-mailed Stein to make the remap optional.*"
echo ANSI_14 "   But for now, Sorry :(**"
return

# Trying to add this to a later version.
# These folowing remarked out features are not present:
# echo ANSI_10 "Anything inbetween " ANSI_11 "[" ANSI_10 " and " ANSI_11 "]" ANSI_10 " will be processed as a system variable.*"
# echo ANSI_10 "  i.e. the macro: '" ANSI_11 "m [STARDOCK] " #42 " y y p s'" ANSI_10 " will transwarp to Dock and port.*"
# echo ANSI_10 "  The following " ANSI_11 "system variables" ANSI_10 " are currently available:*"
# echo ANSI_10 "    STARDOCK, ALPHACENTAURI, RYLOS, CURRENTSECTOR, TERRA, PASSSWORD*"
# echo ANSI_10 "    And, you can use A1, A2, A3, A4, A5, A6 for adjacent sectors*"
# echo ANSI_10 "Also, you can use the " ANSI_11 "/" ANSI_10 " key at the end of the macro and it will replace*"
# echo ANSI_10 "  anything that is between 2 " ANSI_11 "/" ANSI_10 "'s.*"
# echo ANSI_10 "  i.e. the macro: " ANSI_11 "'q x   /11/" #42 " p  s'" ANSI_10 "  if you add " ANSI_11 "/12/" ANSI_10 " to the end,*"
# echo ANSI_10 "  the " ANSI_11 "11" ANSI_10 " will be replaced with " ANSI_11 "12" ANSI_10 ".  *"

#-----------------------------------
# ----====[ BANNER SECTION ]====----
#-----------------------------------
:egoBanner
echo ANSI_14 "***"
echo ANSI_14 "                                 /\         *"
echo ANSI_14 "                                /  \        *"
echo ANSI_14 "                               /    \       *"
echo ANSI_14 "                              / ____ \      *"
echo ANSI_14 "                             / /\   \_\     *"
echo ANSI_14 "                            /   " #17 #42 & #16 "-   \    *"
echo ANSI_14 "                           /    " #245 "\_     \   *"
echo ANSI_14 "                          /______________\  *"
echo ANSI_14 "                          www.tw-cabal.com"
return