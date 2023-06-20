
gosub :promptcheck_inc~globalPromptCheck
if ($promptcheck_inc~promptCheck <> 1)
	echo ANSI_15 "This script needs to be run from a global-friendly prompt."
	halt
end
setVar $prompt $promptcheck_inc~prompt
setVar $ztmstatusfile GAMENAME & "_ZTM.txt"
loadVar $SupGZTM
if ($SupGZTM)
	loadVar $SupGZTM_midpass
	loadVar $SupGZTM_runmode
	setVar $runmode $SupGZTM_runmode
	setVar $midpass $SupGZTM_midpass
	if ($midpass = 6)
		setVar $midpass "Auto"
	end
	setVar $resume "Yes"
else
	setVar $midpass "Auto"
	setVAr $resume "No"
	setVar $runmode "Interrogation"
end

:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptname "SupGZTM"
setVar $signature_inc~version "1.b"
setVar $signature_inc~date "02/10/04"
gosub :signature_inc~signature

echo ANSI_15 "SupGZTM Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Middle Passes         " ANSI_10 "["
echo ANSI_6 $midpass
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Resume                " ANSI_10 "["
echo ANSI_6 $resume
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Run Mode              " ANSI_10 "["
echo ANSI_6 $runmode
echo ANSI_10 "]*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	if ($midpass = "Auto")
		:topper
		getInput $midpass "How many middle passes? (1 - 5) 3 recommended, 5 most accurate"
		if ($midpass < 0) OR ($pass > 5)
			echo ANSI_15 " Invalid entry."
			goto :topper
		end
	else
		setVar $midpass "Auto"
	end
elseif ($SupGZTM = 1) and ($choice = 2)
	if ($resume = "No")
		setVar $resume "Yes"
	else
		setVar $resume "No"
	end
elseif ($choice = 3)
	if ($runmode = "Interrogation") AND (($prompt = "Command") OR ($prompt = "Citadel"))
		setVar $runmode "Computer"
	else
		setVar $runmode "Interrogation"
	end
elseif ($choice = "c")
	if ($midpass = "Auto")
		setVar $midpass 6
	end
	setVar $SupGZTM 1
	setVar $SupGZTM_midpass $midpass
	setVar $SupGZTM_runmode $runmode

	saveVar $SupGZTM
	saveVar $SupGZTM_midpass
	saveVar $SupGZTM_runmode
	if ($resume = "Yes")
		if ($runmode = "Interrogation")
			send "^"	
		else
			setVar $gameinfo_inc~cn9 "SPACE"
			gosub :gameinfo_inc~cn
			send "c"
		end
		loadVar $SupGZTM_pass
		loadVar $SupGZTM_totalPlots
		loadVar $SupGZTM_totalWarps
		setVar $totalPlots $SupGZTM_totalPlots
		setVar $totalWarps $SupGZTM_totalWarps
		getTime $date "mm.dd.yy"
		getTime $time "hh:nn:ss"
		if ($SupGZTM_pass = 1)
			loadVar $SupGZTM_top
			loadVar $SupGZTM_bottom
			setVar $top $SupGZTM_top
			setVar $bottom $SupGZTM_bottom
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Resuming Initial Plot from sector :" & $bottom & "."
			goto :resumePlot
		elseif ($SupGZTM_pass > 1) AND ($SupGZTM_pass < 7)
			loadVar $SupGZTM_donesector
			loadVar $SupGZTM_plotfrom
			setVar $donesector $SupGZTM_donesector
			setVar $pass ($SupGZTM_pass - 1)
			setVar $plotfrom $SupGZTM_plotfrom
			if ($plotfrom = 0)
				setVar $plotfrom 1
			end
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Resuming Void Plot " & $pass & " from sector : " & $plotfrom & "."
			goto :rnd
		elseif ($SupGZTM_pass = 9)
			loadVar $SupGZTM_counter
			setVar $counter $SupGZTM_counter
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Resuming Backdoor Plot from sector : " & $counter &"."
			goto :bdresume
		end
	else
		delete $ztmstatusfile
		goto :start
	end
end
goto :menu

:start
setVar $SupGZTM_pass 1
setVar $top SECTORS
setVar $bottom 1
gosub :save
getTime $date "mm.dd.yy"
getTime $time "hh:nn:ss"
write $ztmstatusfile $date & ", " & $time & " - SupGZTM Started..."  
if ($runmode = "Interrogation")
	send "^"
else
	setVar $gameinfo_inc~cn9 "SPACE"
	gosub :gameinfo_inc~cn
	send "c"
end
:resumePlot
setVar $burster 0
:plotCourse
if ($burster < 5)
	add $burster 1
	:bottom
	if (SECTOR.WARPCOUNT[$bottom] = 0)
		setVar $macro $macro & "f" & $bottom & "*"
		add $totalPlots 1
		setVar $last $bottom
		setVar $plotted[$bottom] 1
	else
		add $bottom 1
		if ($bottom > SECTORS)
			goto :pass2
		end
		goto :bottom
	end
	:top
	if ($plotted[$top] = 1) OR (SECTOR.WARPCOUNT[$top] = 0) OR ($top = 1) OR ($top < $bottom)
		if ($top = $bottom)
			subtract $top 1
			goto :top
		end
	else
		subtract $top 1
		goto :top
	end
	
		
	setVar $macro $macro & $top & "*"
	add $bottom 1
	subtract $top 1
	if ($top < 1)
		setVar $top 1
	end
	if ($bottom > SECTORS)
		gosub :completionCheck
		goto :pass2
	end
	goto :plotCourse
end
send $macro
gosub :save
if ($runmode = "Interrogation")
	waitFor " > " & $last
else
	waitFor $last & " > "
end
setVar $macro ""
setVar $burster 0
goto :plotCourse

:pass2
gosub :totalWarps
write $ztmstatusfile "     Initial pass - total plots : " & $totalPlots & ", total warps : " & $totalWarps 
getTime $date "mm.dd.yy"
getTime $time "hh:nn:ss"
write $ztmstatusfile $date & ", " & $time & " - SupGZTM Initial Pass Completed..."
setVar $pass 0
send $macro
:pass
setVar $donesector 0
setVAr $totalplots 0
if ($pass < $midpass)
	add $pass 1
	getTime $date "mm.dd.yy"
	getTime $time "hh:nn:ss"
	write $ztmstatusfile $date & ", " & $time & " - SupGZTM Void pass " & $pass & " started..."
	setVar $burster 0
	setVar $plotfrom 1
	setVar $SupGZTM_pass ($pass + 1)
	gosub :save
	:rnd
	getRnd $plotto 1 SECTORS
	:getplotto
	if (SECTOR.WARPCOUNT[$plotto] <> $pass) OR (SECTOR.EXPLORED[$plotto] = "YES")
		add $plotto 1
		if ($plotto > SECTORS)
			setVar $plotto 1
		end
		goto :getplotto
	end
	:getplotfrom
	if ($burster < 5)
		add $burster 1
		:plot
		if (SECTOR.WARPCOUNT[$plotfrom] = $pass) AND (SECTOR.EXPLORED[$plotfrom] <> "YES") AND ($plotfrom <> $plotto)
			setVar $wrpcnt 0
			:wrpcnt
			if ($wrpcnt < $pass)
				add $wrpcnt 1
				setVar $warpout[$wrpcnt] SECTOR.WARPS[$plotfrom][$wrpcnt]
				if ($runmode = "Interrogation")	
					setVar $macro $macro & "s" & $warpout[$wrpcnt] & "*"
				else
					setVar $macro $macro & "v" & $warpout[$wrpcnt] & "*"
				end
				goto :wrpcnt
			end
			setVAr $macro $macro & "f" & $plotfrom & "*" & $plotto & "*y  "
			add $totalPlots 1
			setVar $rmvoid 0
			:rmvoid
			if ($rmvoid < $pass) AND ($runmode = "Interrogation")
				add $rmvoid 1
				setVar $macro $macro & "c" & $warpout[$rmvoid] & "*"
				setVAr $last $warpout[$rmvoid]
				goto :rmvoid
			elseif ($runmode = "Computer")
				setVar $macro $macro & "v*yy"
				setVAr $last $warpout[$pass]
			end
		else
			add $plotfrom 1
			if ($plotfrom > SECTORS)
				gosub :totalWarps
				setVar $perc (($donesector * 100) / $totalPlots)
				write $ztmstatusfile "     Void Pass " & $pass & " - total plots : " & $totalPlots & ", total warps : " & $totalWarps
				write $ztmstatusfile "     " & $donesector & " sectors of " & $totalPlots & " are accurate. (" & $perc & "%)"
				getTime $date "mm.dd.yy"
				getTime $time "hh:nn:ss"
				write $ztmstatusfile $date & ", " & $time & " - SupGZTM Void pass "& $pass &" completed..."
				if ($midpass = 6)
					if ($perc >= 90) OR ($pass = 5)
						goto :pass5
					end
				end
				goto :pass
			end
			goto :plot
		end
		add $plotfrom 1
		if ($plotfrom > SECTORS)
			gosub :totalWarps
			setVar $perc (($donesector * 100) / $totalPlots)
			write $ztmstatusfile "     Void Pass " & $pass & " - total plots : " & $totalPlots & ", total warps : " & $totalWarps
			write $ztmstatusfile "     " & $donesector & " sectors of " & $totalPlots & " are accurate. (" & $perc & "%)"
			getTime $date "mm.dd.yy"
			getTime $time "hh:nn:ss"
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Void pass "& $pass &" completed..."
			if ($midpass = 6)
				if ($perc >= 90) OR ($pass = 5)
					goto :pass5
				end
			end
			goto :pass
		end
		goto :rnd
	end
	send $macro
	:donetrigger
	setTextTrigger secdone :secdone "No route within"
	if ($runmode = "Interrogation")
		setTextTrigger burstdone :burstdone "Sector: " & $last
	else
		setTextTrigger burstdone :burstdone "Sector " & $last
	end
	pause

	:secdone
	killtrigger burstdone
	add $donesector 1
	goto :donetrigger
	
	:burstdone
	killtrigger secdone
	gosub :save
	setVar $macro ""
	setVar $burster 0
	goto :getplotfrom
end

:pass5
gosub :completionCheck
send $macro
setVar $SupGZTM_pass 9
gosub :save
getTime $date "mm.dd.yy"
getTime $time "hh:nn:ss"
write $ztmstatusfile $date & ", " & $time & " - SupGZTM Backdoor pass started..."
setVar $totalPlots 0
setVar $counter 1
:bdresume
gosub :completionCheck
setVar $burster 0
:getdeds
if ($burster < 5)
	add $burster 1
	:nxtcounter
	if (SECTOR.BACKDOORCOUNT[$counter] > 0)
		setVar $bkdoor 0
		:bkdoor
		if ($bkdoor < SECTOR.BACKDOORCOUNT[$counter])
			add $bkdoor 1
			setVar $macro $macro & "f" & $counter & "*" & SECTOR.BACKDOORS[$counter][1] & "*"
			add $totalPlots 1
			setVar $last $counter
			goto :bkdoor
		end			
		add $counter 1
		if ($counter > SECTORS)
			gosub :totalWarps
			write $ztmstatusfile "     Backdoor Pass - total plots : " & $totalPlots & ", total warps : " & $totalWarps
			getTime $date "mm.dd.yy"
			getTime $time "hh:nn:ss"
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Backdoor pass completed..."
			send $macro
			send "q"
			waitFor "(?="
			echo ANSI_15 "*Done, ZTM summary in " $ztmstatusfile ".*"
			halt
		end
		goto :getdeds
	else
		add $counter 1
		if ($counter > SECTORS)
			gosub :totalWarps
			write $ztmstatusfile "     Backdoor Pass - total plots : " & $totalPlots & ", total warps : " & $totalWarps
			getTime $date "mm.dd.yy"
			getTime $time "hh:nn:ss"
			write $ztmstatusfile $date & ", " & $time & " - SupGZTM Backdoor pass completed..."
			send $macro
			send "q"
			waitFor "(?="
			echo ANSI_15 "*Done, ZTM summary in " $ztmstatusfile ".*"
			halt
		end
		goto :nxtcounter
	end
end
send $macro
gosub :save
setVAr $burster 0
if ($runmode = "Interrogation")
	waitFor " > " & $last
else
	waitfor $last & " > "
end
setVAr $macro ""
goto :getdeds
halt

:totalWarps
setVar $totalWarps 0
setVar $ttlwrps 0
:ttlwrps
if ($ttlwrps < SECTORS)
	add $ttlwrps 1
	add $totalWarps SECTOR.WARPCOUNT[$ttlwrps]
	goto :ttlwrps
end
return

:completionCheck
setVar $loop 0
:comp_loop
if ($loop < SECTORS)
	add $loop 1
	if (SECTOR.WARPCOUNT[$loop] = 0)
		if ($loop = 1)
			send "f" $loop "*" SECTORS "*"
		else
			send "f" $loop "*1*"
		end
		if ($runmode = "Interrogation")
			waitFor " > " & $loop
			waitFor ":"
		else
			waitFor  $loop & " > "
			waitFor "Computer"
		end
	end
	goto :comp_loop
end
return

:save
setVar $SupGZTM_totalPlots $totalPlots
setVar $SupGZTM_totalWarps $totalWarps
setVar $SupGZTM_top $top
setVar $SupGZTM_bottom $bottom
setVar $SupGZTM_donesector $donesector
setVar $SupGZTM_counter $counter
setVar $SupGZTM_plotfrom $plotfrom

saveVar $SupGZTM_totalPlots
saveVar $SupGZTM_totalWarps
saveVar $SupGZTM_top
saveVar $SupGZTM_bottom
saveVar $SupGZTM_donesector
saveVar $SupGZTM_counter
saveVar $SupGZTM_plotfrom

saveVar $SupGZTM_pass

setVar $SupGZTM 1
saveVar $SupGZTM
return

include "supginclude\signature_inc"
include "supginclude\promptcheck_inc"
include "supginclude\gameinfo_inc"