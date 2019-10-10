# check if we can run it from here
cutText CURRENTLINE $location 1 7


send "'OZ Planet Grid Powering Up *"
if ($location <> "Citadel")
        echo ANSI_12 "**This script must be run from the citadel**"
	halt
end
# get denisty limit
:getdens
waitFor "(?="
:alter
getInput $dens_limit "Enter max density"
isNumber $number $dens_limit
if ($number = 0)
	echo ansi_12 "*Invalid Number*"
	goto :getdens
end
:get_delay
getInput $delay "Enter Move Delay"
isNumber $number $delay
if ($number = 0)
	echo ansi_12 "*Invalid Number*"
	goto :get_delay
end
if ($delay = 0)
	setVar $delay 1
end
:getarmids
getInput $armids "Enter # of Armid Mines to Deploy"
isNumber $number $armids
if ($number = 0)
	echo ansi_12 "*Invalid Number*"
	goto :getarmids
end
:getclimp
getInput $climps "Enter # of Corp Limpet Mines to Deploy"
isNumber $number $climps
if ($number = 0)
	echo ansi_12 "*Invalid Number*"
	goto :getclimp
end
:getplimp
getInput $plimps "Enter # of Personal Limpet Mines to Deploy"
isNumber $number $plimps
if ($number = 0)
	echo ansi_12 "*Invalid Number*"
	goto :getplimp
end



# lets get planet 
killAllTriggers
send "qdc"
setTextLineTrigger pnum :pnum "Planet #"
pause
:pnum
getWord CURRENTLINE $planet 2
stripText $planet "#"

# lets get transport range
killAllTriggers
send "c;q"
waitFor "Max Figs Per Attack:"
getWord CURRENTLINE $attack_figs 5


# main
:main
killAllTriggers
setDelayTrigger quikdelay :quikdelay 100
pause
:quikdelay
KillAllTriggers
gosub :quikstats
echo "*sector = " $quikstats[$h[1]] "*"
killAllTriggers
echo ansi_11 "*OZ Planet Grid running from planet #" $planet " - type " #34 "TAB ?" #34 " for help*"
gosub :echo_display
killAllTriggers
setTextOutTrigger tab :tab #9
pause

:tab
	getConsoleInput $sektor singlekey
	lowercase $sektor
	if ($sektor = 1) or ($sektor = 2) or ($sektor = 3) or ($sektor = 4) or ($sektor = 5) or ($sektor = 6)
		goto :prep
	elseif ($sektor = "h") or ($sektor = "d") or ($sektor = "?") or ($sektor = "m") or ($sektor = "a")
		goto :prep2
	elseif ($sektor = 7) or ($sektor = 8) or ($sektor = 9) or ($sektor = 0)
		goto :prep3
	else
		goto :main
	end
:prep3
	if ($sektor = 7)
		send "qq  h  1  z  " $armid "  *  z  c  z  n  l  " $planet "*  c  "
		waitFor "<Enter Citadel>"
		send "'OZ - Planet Grid - " $armids " Corp Armid Mine(s) Deployed*"
		goto :main
	elseif ($sektor = 8)
		send "qq  h  2  z  " $climps "  *  z  c  z  n  l  " $planet "*  c  "
		waitFor "<Enter Citadel>"
		send "'OZ - Planet Grid - " $climps " Corp Limpet Mine(s) Deployed*"
		goto :main
	elseif ($sektor = 9)
		send "qq  h  2  z  " $plimps "  *  z  p  z  n  l  " $planet "*  c  "
		waitFor "<Enter Citadel>"
		send "'OZ - Planet Grid - " $plimps " Personal Limpet Mine(s) Deployed*"
		goto :main
	elseif ($sektor = 0)
		if (GAME = "") or (PASSWORD = "")
			echo ansi_12 "*Unable to quick-exit - Game Letter and Password Incomplete*"
			goto :main
		end
		send "zqqznqnqyn  t*n   " PASSWORD "**  zaznznza999*zn  f  1*  c  d  l  " $planet "*  c"
		waitFor "<Enter Citadel>"
		goto :main
	end
		
:prep2
	setVar $startsec $quikstats[$h[1]]
	if ($sektor = "h")
		send "qq  sh*znl  " $planet "*  c  "
		waitFor "<Enter Citadel>"
		goto :main
	elseif ($sektor = "d")
		send "qq  sdl  " $planet "*  c  "
		waitFor "<Enter Citadel>"
		goto :main
	elseif ($sektor = "m")
		goto :getmow
	elseif ($sektor = "a")
		goto :alter
	elseif ($sektor = "?")
		echo ansi_11 "*Functions work by pressing TAB and a HOTKEY"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "1" ansi_11 " - Grid Adj Warp 1"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "2" ansi_11 " - Grid Adj Warp 2"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "3" ansi_11 " - Grid Adj Warp 3"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "4" ansi_11 " - Grid Adj Warp 4"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "5" ansi_11 " - Grid Adj Warp 5"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "6" ansi_11 " - Grid Adj Warp 6"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "7" ansi_11 " - Deploy Armid Mine"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "8" ansi_11 " - Deploy Corp Limpet"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "9" ansi_11 " - Deploy Perosnal Limpet"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "0" ansi_11 " - Quick-Exit Clear Sector"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "M" ansi_11 " - Planet Grid to Sector"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "D" ansi_11 " - Lift - D-Scan - Land"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "H" ansi_11 " - Lift - Holo-Scan - Land"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "A" ansi_11 " - Alter Settings"
		echo ansi_12 "*TAB " ansi_11 "+ " ansi_12 "?" ansi_11 " - List Help"
		goto :main
	end





:prep
	cutText CURRENTLINE $location 1 7
	gosub :quikstats
	setVar $startsec $quikstats[$h[1]]
	if ($sektor > SECTOR.WARPCOUNT[$quikstats[$h[1]]])
		goto :main
	end
	if ($location <> "Citadel")
		echo ansi_12 "*Not at Citadel Prompt*"
		goto :main
	end
:prep_move
	setVar $sector SECTOR.WARPS[$startsec][$sektor]
	goto :plot


# lets check distances
:getmow
killAllTriggers
getInput $sector "Enter the Sector to Grid"


:top
setVar $sec_check 0
:sub_move
add $sec_check 1
if ($secinfo.warp[$sec_check] = 0)
:repeat_mow
	echo ansi_12 "*Sector Not Adjacent**Mow to Sector (Y/N)**"
	getConsoleInput $mow singlekey
	:mow_check
elseif ($sector <> $secinfo.warp[$sec_check])
	goto :sub_move
elseif ($sector = $secinfo.warp[$sec_check])
	goto :plot
end

:mow_check
upperCase $mow
if ($mow = "Y")
	goto :plot
elseif ($mow = "N")
	goto :main
else 
	goto :repeat_mow
end

:continue_move
add $move_count 1
if ($move_count = $plot)
	goto :at_last_sec
end

send "qq  f  z  9  *  z  c  d  z  n  l  " $planet "*  c"
setDelayTrigger figdelay :figdelay 2000
pause

:figdelay 

:nophot
	killAllTriggers
setDelayTrigger movedelay :moveDelay $delay
pause
:moveDelay
killAllTriggers
send "qqsdl  " $planet "*c"
getSector $warppath[$move_count] $movesector
if ($movesector.density > $dens_limit)
	send "'WARNING - Density Limit - " $dens_limit " - Actual - " $movesector.density " - Move Halted!*"
	killAllTriggers
	goto :main
elseif ($warppath[$move_count] < 11) or ($warppath[$move_count] = STARDOCK)
	send "'WARNING - Sector is a Federation Sector - Move Halted!*"
	KillAllTriggers
	goto :main
end
waitFor "<Preparing ship to land on planet surface>"
waitFor "(?="
setVar  $savesec $warppath[$move_count]
if ($savesec < 100)
	setVar $savesec "000"&$savesec 
elseif ($savesec < 1000)
	setVar $savesec "00"&$savesec 
elseif ($savesec < 10000)
	setVar $savesec "0"&$savesec 
end
send "'" $warppath[$move_count] "=saveme*"
gosub :move

:init_land
setVar $land_attempt 0
setVar $land_try 0
killAllTriggers
:land_macro
killAllTriggers
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "l  " #8 #8 "z  " #8 #8 #8 $planet " *  "
send "*  *  "
send "@"
waitFor "Average Interval Lag:"
setTextLineTrigger prompty :prompty "(?="
pause

:prompty
killAllTriggers
cutText CURRENTLINE $where 1 6
if ($where <> "Planet")
	add $land_attempt 1
	goto :landing_again
elseif ($where = "Planet")
	goto :onit
else
	goto :skrewed
end

:landing_again
if ($land_try = 1)
	goto :skrewed
else
	send "i"
	waitFor "Current Sector :"
	getWord CURRENTLINE $savesec 4
	if ($savesec < 100)
		mergeText "000" $savesec $savesec
	elseif ($savesec < 1000)
		mergeText "00" $savesec $savesec
	elseif ($savesec < 10000)
		mergeText "0" $savesec $savesec
	end
	send "'" $savesec "=saveme*"
	setVar $land_attempt 0
	add $land_try 1
	goto :land_macro

end


:onit
killAllTriggers
send "*mnt*"
send "cs"
waitfor "<Scan Sector>"
setTextTrigger citmine :citmine "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
setTextTrigger incit :incit "Citadel command (?=help)"
pause

:citmine
killAllTriggers
send "n"
send "cuyq"
waitFor "Citadel treasury"
gosub :grabsector
goto :continue_move

:incit
killAllTriggers
send "cuyq"
waitFor "Citadel treasury"
gosub :grabsector
goto :continue_move


:move
send "cunq"
send "qq  f  z  1  *  z  c  d  z  n  "
send "m" $warppath[$move_count] "*  *  za" $attack_figs "*  z  n  f  z  1  *  z  c  d z  n  "
killAllTriggers
return

:plot
send "cv1*v2*v3*v4*v5*v6*v7*v8*v9*v10*v" STARDOCK "*q"
setVar $move_count 0
setVar $from_count 0
setVar $to_count 1
setArray $warppath 200
setVar $plot 1
:WarpPathBuilder
setVar $distance 2
send "^f" $startsec "*" $sector "*q"
setTextlinetrigger BuildPath :BuildPath $startsec&" > "
setTextLineTrigger NoRoute :NoRoute "No route within"
pause
:BuildPath
killAllTriggers
setVar $routeline CURRENTLINE
striptext $routeline " >"
striptext $routeline "("
striptext $routeline ")"
:PathLoop
getWord $routeline $warppath[$plot] $distance
if ($warppath[$plot] = $sector)
	add $plot 1
	add $distance 1
	Goto :gotPath
end
if ($warppath[$plot] = "0")
	settextlinetrigger NextLine :NextLine " "
	pause
end
add $plot 1
add $distance 1
goto :PathLoop
:NextLine
setVar $distance 1
setVar $routeline CURRENTLINE
striptext $routeline " >"
striptext $routeline ")"
striptext $routeline "("
goto :PathLoop
:gotPath
goto :continue_move






# lets get Sector info
:grabsector
killAllTriggers
send "s"
waitfor "Sector  :"
getWord CURRENTLINE $startSec 3
getSector $startSec $secinfo
setTextTrigger citmine :secmine "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
setTextTrigger incit :nosecmine "Citadel command (?=help)"
pause

:secmine
send "n"
waitFor "Citadel treasury"
:nosecmine
return

:skrewed
killAllTriggers
send "'WARNING - Can't Land - I must be Skrewed!!!*"
halt

:stopit
killAllTriggers
halt

:at_last_sec
send "cv0*yyq"
echo ansi_12 "**Charge Complete!**"
killAllTriggers
goto :main

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
# hotkey move


:quikstats
	setVar $h[1] "Sect"
	setVar $h[2] "Turns"
	setVar $h[3] "Creds"
	setVar $h[4] "Figs"
	setVar $h[5] "Shlds"
	setVar $h[6] "Hlds"
	setVar $h[7] "Ore"
	setVar $h[8] "Org"
	setVar $h[9] "Equ"
	setVar $h[10] "Col" 
	setVar $h[11] "Phot"
	setVar $h[12] "Armd"
	setVar $h[13] "Lmpt"
	setVar $h[14] "GTorp"
	setVar $h[15] "TWarp"
	setVar $h[16] "Clks"
	setVar $h[17] "Beacns"
	setVar $h[18] "AtmDt"
	setVar $h[19] "Crbo"
	setVar $h[20] "EPrb"
	setVar $h[21] "MDis"
	setVar $h[22] "PsPrb"
	setVar $h[23] "PlScn"
	setVar $h[24] "LRS"
	setVar $h[25] "Aln"
	setVar $h[26] "Exp"
	setVar $h[27] "Ship"
	setVar $cnt 0
	send "/"
:chk
	setTextLineTrigger getLine :getLine
	pause

:getLine
	killtrigger done
	add $cnt 1
	setVar $culine CURRENTLINE
	replaceText $culine #179 " " & #179 & " "
	setVar $line[$cnt] $culine
	getWordPos $culine $pos " Ship "
	if ($pos > 0)
	     goto :done_read
	end
	goto :chk

:done_read
	killtrigger getLine
	setVar $hcount 0
:hcount
	if ($hcount < 27)
 	    add $hcount 1
	     setVar $lncount 1
     :lncount
 	    if ($lncount < $cnt)
   	       add $lncount 1
   	       getWordPos $line[$lncount] $pos $h[$hcount]
   	       if ($pos > 0)
              	 setVar $work $line[$lncount]
              	 cutText $work $work $pos 9999
              	 upperCase $h[$hcount]
              	 getWord $work $quikstats[$h[$hcount]] 2
              	 stripText $quikstats[$h[$hcount]] ","
          	else
            	   goto :lncount
         	 end
     	end
     	goto :hcount
	end
	return

:echo_display
killAllTriggers
	SetVar $engageprompt 1	
	ECHO ANSI_9 "**[" ANSI_11 " current turns: " ANSI_12 $quikstats[$h[2]] ANSI_9 " ]"
	setVar $displaycheckloop 1
	:DisplayCheckLoop
		if ($displaycheckloop > SECTOR.WARPCOUNT[$quikstats[$h[1]]])
			goto :DoneDisplayCheckLoop
		end
		ECHO ANSI_9 "*[ " ANSI_11 "warp(" $displaycheckloop "): " ANSI_14 SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop]
		if (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] < 10000) and (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] > 999)
			echo " "
		elseif (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] < 1000) and (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] > 99)
			echo "  "
		elseif (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] < 100) and (SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop] > 9)
			echo "   "
		end
		ECHO ANSI_9 " - "
		ECHO ANSI_3 "warps: " ANSI_12 SECTOR.WARPCOUNT[SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop]] ANSI_9 " - "
		ECHO ansi_3 "planets: " ansi_12 SECTOR.PLANETCOUNT[SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop]] ansi_9 " - "
		ECHO ansi_3 "corp-fig: "
		if (SECTOR.FIGS.OWNER[SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop]] = "belong to your Corp")
 			echo ansi_12 "YES"
		else
			echo ansi_12 "NO "
		end
 		echo ansi_9 " - "
		ECHO ANSI_3 "density: " ANSI_12 SECTOR.DENSITY[SECTOR.WARPS[$quikstats[$h[1]]][$displaycheckloop]] ANSI_9 " ]"
		
		add $displaycheckloop 1
		goto :DisplayCheckLoop
	:DoneDisplayCheckLoop
	echo "**"
	return
