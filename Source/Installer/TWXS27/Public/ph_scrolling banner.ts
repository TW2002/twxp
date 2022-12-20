#scrolling banner
#setvar with gosub so you can put clutter at bottom of script
setVar $title "Some Cool Script Name here :-) "
setVar $version "Version 0.00 "
setVar $author "Parrothead "
gosub :bannervariables
#show banner with gosub
gosub :banner
#script here
halt
:banner
#send "'" & $author & $title & "Warming Up- Comms Down*"
#waitOn "Message sent on sub-space channel"
#set fixed text and spacing and color
# you have to play with spacing here
ECHO ANSI_9 "*----------------------------------------*"
ECHO ANSI_14 "       " & $title &  "*"
# you have to play with spacing here to get text centered etc...........
# your createing a empty line for the scrolling text to go
ECHO ANSI_3 "       " & $version &  "*" & "       *"
ECHO ANSI_9 "----------------------------------------**"
#move cursor up "3A" means 3 lines UP "3B" means 3 lines down
echo ANSI_11 #27 & "[3A" & "       "
#spin out banner text with a loop
setvar $i 1
while ($i <= $echogrid)
killalltriggers
echo $echogrid[$i]
#slight pause here so u can see it scroll
setdelaytrigger echox :echox 55
pause
:echox
add $i 1
end
#erase text move cursor back where it belongs and reset command line
#you can use a loop here too if u want to output the backspaces
echo ANSI_11 #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 &"       by " & $author & "*"
#cursur back where it belongs here
echo ANSI_11 #27 & "[2B"
send "* "
return
:bannervariables
#set size and fill in letters etc
#addding backspaces and variable timing will make it look like someone is typing badly...laff
setvar $echogrid 13
setvar $echogrid[1] "B"
setvar $echogrid[2] "r"
setvar $echogrid[3] "o"
setvar $echogrid[4] "g"
setvar $echogrid[5] "h"
setvar $echogrid[6] "t"
setvar $echogrid[7] " "
setvar $echogrid[8] "t"
setvar $echogrid[9] "o"
setvar $echogrid[10] " "
setvar $echogrid[11] "y"
setvar $echogrid[12] "o"
setvar $echogrid[13] "u"
return

