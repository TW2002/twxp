SystemScript
SetVar $version "v1.03"
SetVar $tital "ParrotHead's MSL Echo"
SetVar $mslfile (GAMENAME &"-"& GAME & "-msl.txt")
SetVar $finalbatch GAMENAME &"-"& GAME &"-finallist.txt"
Delete $finalbatch
send "'*" $tital & " " & $version & " Active **"
waitOn "Sub-space comm-link terminated"

:start
if ($mslfile <> "")
  fileExists $exists $mslfile
  if ($exists)
echo "*" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "Ready for USE" ANSI_11 " |===" ANSI_3 "--*"
SOUND ding.wav
  else
  goto :config
end
SetVar $k 1
read $mslfile $readmsl $k
while ($readmsl <> EOF)
SetVar $msllist[$k] $readmsl
add $k 1
read $mslfile $readmsl $k
end
SetVar $countmsl ($k - 1)
:trigger
SetVar $i 1
SetTextLineTrigger cit :gocit "Citadel command"
SetTextLineTrigger go :go "Command [TL"
pause
:gocit
KillAllTriggers
SetTextLineTrigger goo :gocitsect "Sector  :"
pause
:gocitsect
GetText CURRENTLINE $cursec "Sector  : " " in"
goto :skip
:go
KillAllTriggers
GetText CURRENTLINE $cursec "]:[" "] (?=Help)?"
:skip
while ($i <= $countmsl)
if ($cursec = $msllist[$i])
echo #27 & "[1;5;32m" & "Msl Sector " & #27 & "[0m" & ANSI_5 & ": "
goto :trigger
end
add $i 1
end
goto :trigger
:config
SetVar $stardock STARDOCK
if ($stardock <> "0")
echo ANSI_14 "*             STARDOCK is in Sector " $stardock "*"
goto :class0
else
SetTextLineTrigger getSD :getSD "The StarDock is located in sector "
send "v"
pause
end
waitFor "elp)?"

#******************************************add sector bounds check
:getSD
GetWord CURRENTLINE $stardock 7
StripText $stardock "."
:output
SaveVar $stardock
if ($stardock < "1")
     clientMessage "Find Stardock and rerun program"
     halt
end
echo ANSI_14 "             STARDOCK is in Sector " $stardock "*"
#-----verifies class0 port locations
:class0
SetVar $i 2
SetVar $k 1
SetArray $class0 2
while ($i < SECTORS)
if (PORT.CLASS[$i] = "0")
    setVar $class0[$k] $i
    add $k 1
    end
add $i 1
end
SetVar $class0a $class0[1]
SaveVar $class0a
SetVar $class0b $class0[2]
SaveVar $class0b
if ($class0a <> "0")
echo ANSI_14 "             Class 0 port is in Sector " $class0a "*"
else
echo ANSI_14 "             Class 0 port is Unknown  " "*"
getinput $class0a "Class 0 Location ?" 0
isnumber $number $class0a
if ($number) and ($class0a <> "0")
SetVar $class0[1] $class0a
else
goto :nogood
end
end
if ($class0b <> "0")
echo ANSI_14 "             Class 0 port is in Sector " $class0b "*"
else
echo ANSI_14 "             Class 0 port is Unknown  " "*"
getinput $class0b "Class 0 Location ?" 0
isnumber $number $class0b
if ($number) and ($class0b <> "0")
SetVar $class0[2] $class0b
else
goto :nogood
end
end
#-updates TWX database with course info
echo ANSI_8 "*" " Updating Nav Info ......."
send "*"
waitFor "<Re-Display>"
waitFor "elp)?"
send "^"
waitFor ":"
send "f"
waitFor ">"
send "1*"
waitFor ">"
send $stardock "*"
waitFor ":"
send "f"
waitFor ">"
send $stardock "*"
waitFor ">"
send "1*"
waitFor ":"
send "f"
waitFor ">"
send $class0a "*"
waitFor ">"
send $stardock "*"
waitFor ":"
send "f"
waitFor ">"
send $class0b "*"
waitFor ">"
send $stardock "*"
waitFor ":"
send "f"
waitFor ">"
send $stardock "*"
waitFor ">"
send $class0a "*"
waitFor ":"
send "f"
waitFor ">"
send $stardock "*"
waitFor ">"
send $class0b "*"
waitFor ":"
send "f"
waitFor ">"
send $class0b "*"
waitFor ">"
send "1*"
waitFor ":"
send "f"
waitFor ">"
send "1*"
waitFor ">"
send $class0b "*"
waitFor ":"
send "f"
waitFor ">"
send "1*"
waitFor ">"
send $class0a "*"
waitFor ":"
send "f"
waitFor ">"
send $class0a "*"
waitFor ">"
send "1*"
send "q"
waitFor "elp)?"
#---gets and saves msl sectors
send "*"
waitFor "<Re-Display>"
waitFor "elp)?"
#stardock to 1st and 2nd Class0 port
SetVar $k 1
:loop1
SetVar $i 1
SetVar $j 2
GetCourse $course $stardock $class0[$k]
SetArray $msl ($course - 1)
while ($i <= $course - 1)
  SetVar $msl[$i] $course[$j]
  add $i 1
  add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
write $mslfile $msl[$l]
add $l 1
end
add $k 1
if ($k < 3)
goto :loop1
end
#1st and 2nd Class0 port to stardock
SetVar $k 1
:loop2
SetVar $i 1
SetVar $j 2
GetCourse $course $class0[$k] $stardock
SetArray $msl ($course - 1)
while ($i <= $course - 1)
  setVar $msl[$i] $course[$j]
  add $i 1
  add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
write $mslfile $msl[$l]
add $l 1
end
add $k 1
if ($k < 3)
goto :loop2
end

#1st and 2nd Class0 port to terra
SetVar $k 1
:loop9
SetVar $i 1
SetVar $j 2
GetCourse $course $class0[$k] 1
SetArray $msl ($course - 1)
while ($i <= $course - 1)
  SetVar $msl[$i] $course[$j]
  add $i 1
  add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
write $mslfile $msl[$l]
add $l 1
end
add $k 1
if ($k < 3)
goto :loop9
end
#terra to 1st and 2nd Class0 port
SetVar $k 1
:loop11
SetVar $i 1
SetVar $j 2
GetCourse $course "1" $class0[$k]
SetArray $msl ($course - 1)
while ($i <= $course - 1)
  SetVar $msl[$i] $course[$j]
  add $i 1
  add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
write $mslfile $msl[$l]
add $l 1
end
add $k 1
if ($k < 3)
goto :loop11
end
#terra to stardock
SetVar $i 1
SetVar $j 2
GetCourse $course 1 $stardock
SetArray $msl ($course - 1)
while ($i <= $course - 1)
  SetVar $msl[$i] $course[$j]
  add $i 1
  add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
if ($msl[$l] > 10)
write $mslfile $msl[$l]
end
add $l 1
end
#stardock to terra
SetVar $i 1
SetVar $j 2
GetCourse $course $stardock 1
SetArray $msl ($course - 1)
while ($i <= $course - 1)
 SetVar $msl[$i] $course[$j]
 add $i 1
 add $j 1
end
SetVar $l 1
while ($l <= $course - 1)
if ($msl[$l] > 10)
write $mslfile $msl[$l]
end
add $l 1
end
#add stardock and class0 ports
:fed
write $mslfile $class0a
write $mslfile $class0b
:Main
Add $xi 1
read $mslfile $check $xi
if ($check = EOF)
Subtract $xi 1
goto :countdown
end
goto :Main

:countdown
SetVar $count $xi
Add $fa 1
Add $rc 1
:compare1
if ($fa > $count)
goto :nearend
end
read $mslfile $filea $fa
fileExists $existsa $mslfile
fileExists $existsb $finalbatch
if ($existsa = 0)
echo ansi_12 "*No File to Compare With*"
goto :end
end
getword $filea $word1 1
if ($existsb = 0)
write $finalbatch $filea
setvar $fb 1
goto :compare1
end
If ($existsb)
read $finalbatch $fileb $fb
read $mslfile $filea $fa
getword $fileb $word2 1
getword $filea $word1 1
end

if ($word1 = $word2)
setvar $fb 1
add $fa 1
goto :compare1
else
add $fb 1
read $finalbatch $fileb $fb
getword $fileb $word2 1
end
if ($word1 = $word2)
setvar $fb 1
add $fa 1
goto :compare1
end
if ($fileb = EOF)
write $finalbatch $filea
setvar $fb 1
Add $rc 1
goto :compare1
end
goto :compare1

:nearend
Delete $mslfile
Rename $finalbatch $mslfile
:end
send "*"
waitFor "elp)"
echo "*" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "All Done" ANSI_11 " |===" ANSI_3 "--*"
Echo ANSI_10 " Started  with "& $count &"* Finished with "& $rc &"*"
goto :start
:nogood
     clientMessage "Find Class 0 ports and rerun program"
SOUND ding.wav
     halt
end
halt
