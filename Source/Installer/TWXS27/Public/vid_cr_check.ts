#
#
GetTime $month "mm"
GetTime $day "dd"
GetTime $year "yy"
setvar $script "File Counter & CR Reader "
setvar $version "0.35T"
setvar $filecat GAMENAME &"-"& GAME &"-Unknown.txt"
setvar $filename GAMENAME &"-"& GAME &"-Unknown.txt"
setvar $makelist  "CRlist.txt"
setvar $p 0

if (($year = "06") and ($month > "06")) or (($year > "06") and ($month < "1"))
    send "'*Script no longer Valid*"
    send "EMAIL  vkworld@ite.net*SUBJECT : renew CR_Check*and your player name.**"
waitfor "Sub-space comm-link terminated"
    Halt
end
send " * "
WaitFor "elp)"
GetWord CURRENTLINE $prompt 1

:top
echo " [2J"
ECHO ANSI_10 "* -=  " ANSI_11 $script $version ANSI_10 "  =-**"
ECHO ANSI_15 "1 " ANSI_11 "- " ansi_10 "File to Read " ansi_11 "- " ansi_15 $filecat "*"
echo "*"
echo ansi_15 "*C " ansi_11 "- " ansi_10 "Continue " ansi_15 " Q " ansi_11 "- " ansi_10 "Quit "  ansi_15 " S " ansi_11 "- " ansi_10 "Save*"
echo "*"
getConsoleInput $request SINGLEKEY
uppercase $request
if ($request <> "C") and ($request <> "Q") and ($request <> "1") and ($request <> "S")
 goto :top
end
if ($request = "Q")
   goto :end
end

if ($request = "S")
write $makelist $filecat
goto :top
end

if ($request = "1")
add $p 1
goto :fileit
end

if ($request = "C")
setvar $fa 0
setvar $fb 1
goto :countdown
end
goto :top

:fileit
fileExists $exists $makelist
if ($exists)
read $makelist $filecat $p
   IF ($filecat = EOF)
   setvar $fc ($p-1)
getinput $filecat "  What File to READ ? "
   end
end
if ($exists = "0")
 getinput $filecat "  What File to READ ? "
end
if ($filecat = EOF)
getinput $filecat "  What File to READ ? "
end
if ($filecat = "")
setvar $filecat $filename
end

goto :top

:countdown
add $count 1
add $numcount 1
fileExists $exist $filecat
if ($exist = 0)
echo ansi_9 "*No File to WORK With" ansi_0 "*"
goto :top
end
if ($exist) and ($file <> EOF)
read $filecat $file $count
striptext $file "SECTOR "
getword $file $word 1
isnumber $check $word
if ($check)
goto :countdown
end
if ($check = "0")
subtract $numcount 1
goto :countdown
end
end
if ($file = EOF)
subtract $count 1
subtract $numcount 1
echo ansi_10 "** There are " $count " Lines in the FILE " ansi_0
echo ansi_11 "* There are " $numcount " sector(s) in LIST *" ansi_0
goto :check
end


halt
:check
if ($prompt = "Computer")
send " "
goto :DoWork
end
if ($prompt = "Citadel")
send " c "
goto :DoWork
end
if ($prompt = "Command")
send " c "
goto :DoWork
end
if ($prompt = "Planet")
send " c c "
goto :DoWork
end

:DoWork
add $fa 1
if ($fa > $count)
goto :end
end

fileExists $existsa $filecat
if ($existsa = 0)
echo ansi_12 "*No File to READ" ansi_0 "*"
goto :top
end
read $filecat $filea $fa
striptext $filea "SECTOR "
getword $filea $word 1
isnumber $check $word
if ($check)
#
#send "f*" $word "*"
send "r" $word "*"
#
end
goto :DoWork
pause

:end
if ($prompt = "Computer")
send " q "
end
if ($prompt = "Citadel")
send " q "
end
if ($prompt = "Command")
send " q "
end
if ($prompt = "Planet")
send " q q "
end
Send "' *"
waiton "sent on sub-space"
echo "**" ANSI_3 "     --" ANSI_11 "===| " ANSI_15 "All Done" ANSI_11 " |===" ANSI_3 "--**"
SOUND ding.wav

