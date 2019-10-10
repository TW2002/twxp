:banner
setarray $echogrid 14
setvar $echogrid 14
setvar $echogrid[1] "B"
setvar $echogrid[2] "r"
setvar $echogrid[3] "o"
setvar $echogrid[4] "u"
setvar $echogrid[5] "g"
setvar $echogrid[6] "h"
setvar $echogrid[7] "t"
setvar $echogrid[8] " "
setvar $echogrid[9] "t"
setvar $echogrid[10] "o"
setvar $echogrid[11] " "
setvar $echogrid[12] "y"
setvar $echogrid[13] "o"
setvar $echogrid[14] "u"

#-=-=-=-=scrolling banner-=-=-=-=

ECHO ANSI_9 "*----------------------------------------*"
ECHO ANSI_14 "       " & $title &  "*"
ECHO ANSI_3 "       " & $version &  "*" & "       *"
ECHO ANSI_9 "----------------------------------------**"
echo ANSI_11 #27 & "[3A" & "       "
setvar $i 1
while ($i <= $echogrid)
killalltriggers
echo $echogrid[$i]
setdelaytrigger echox :echox 150
pause
:echox
add $i 1
end
echo ANSI_11 #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 & #8 &"       by " & $owner & "*"
echo ANSI_11 #27 & "[2B"
send "* "
return