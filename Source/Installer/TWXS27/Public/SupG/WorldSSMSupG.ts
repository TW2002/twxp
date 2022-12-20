ReqRecording
processin 1 "SUPGSCRIPT_AUTO_OFF"
processin 1 "SUPGSCRIPT_KILL_OFF"
setVar $bustfile GAMENAME & "_BUST.txt"
cutText CURRENTLINE $location 1 12
if ($location <> "Command [TL=")
        clientMessage "This script must be run from the command menu"
        halt
end
setArray $badsec SECTORS
loadVar $SupGWSSMSaved
if ($SupGWSSMSaved)
	loadVar $SupGWSSM_c0
	loadVar $quik_sfactor
	loadVar $SupGWSSM_restock
	loadVar $SupGWSSM_escapeshp
	loadVar $SupGWSSM_figlay
	loadVar $SupGWSSM_fignum
	loadVar $SupGWSSM_figtype
	loadVar $SupGWSSM_minelay
	loadVar $SupGWSSM_limpnum
	loadVar $SupGWSSM_armnum
	
else
	setVar $SupGWSSM_c0 1
	setVar $quik_sfactor 30
	setVar $SupGWSSM_restock "Yes"
	setVar $SupGWSSM_escapeshp 0
	setVar $SupGWSSM_figlay "On"
	setVar $SupGWSSM_fignum 1
	setVar $SupGWSSM_figtype "Defensive"
	setVar $SupGWSSM_minelay "Off"
	setVar $SupGWSSM_limpnum 0
	setVar $SupGWSSM_armnum 0
end

setVar $c0 $SupGWSSM_c0
setVar $sd $quik_sfactor
setVar $rs $SupGWSSM_restock
setVar $escape $SupGWSSM_escapeshp
setVar $figlay $SupGWSSM_figlay
setVar $fignum $SupGWSSM_fignum
setVar $figtype $SupGWSSM_figtype
setVar $minelay $SupGWSSM_minelay
setVar $limpnum $SupGWSSM_limpnum
setVar $armnum $SupGWSSM_armnum
if (STARDOCK <= 0)
	getInput $stard "Where is StarDock located?"
else
	setVar $stard STARDOCK
end

gosub :save

:main
echo "[2J"
setVar $signature_inc~scriptName "SupGWorldSSM "
setVAr $signature_inc~date "03/14/04"
setVar $signature_inc~version "2.final"
:menu
gosub :signature_inc~signature
echo ANSI_14 "1." ANSI_15 " Class 0 Location  " ANSI_10 "["
echo ANSI_6 $c0
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Steal Divisor     " ANSI_10 "["
echo ANSI_6 $sd
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Restock           " ANSI_10 "["
echo ANSI_6 $rs
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Lay Fighters      " ANSI_10 "["
echo ANSI_6 $figlay 
	if ($figlay = "On")
		echo ANSI_6 ": " $fignum " - " $figtype
	end
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Lay Mines         " ANSI_10 "["
echo ANSI_6 $minelay 
echo ANSI_10 "]*"

if ($minelay = "On")	
	echo ANSI_14 "  a." ANSI_15 "  Armid Mines    " ANSI_10 "["
	echo ANSI_6 $armnum 
	echo ANSI_10 "]*"
	echo ANSI_14 "  b." ANSI_15 "  Limpet Mines   " ANSI_10 "["
	echo ANSI_6 $limpnum 
	echo ANSI_10 "]*"
end

echo ANSI_14 "6." ANSI_15 " Escape Ship       " ANSI_10 "["
echo ANSI_6 $escape 
echo ANSI_10 "]*"
echo ANSI_14 "C  " ANSI_15 "Continue*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to run*the script.*"
getConsoleInput $choice singlekey
if ($choice = 1)
	getInput $c0 "Class 0 Sector?"
	isNumber $tst $c0
	if ($tst = 1) AND ($c0 <= SECTORS) AND ($c0 > 0)
		goto :main
	else
		setVar $c0 1
		goto :main
	end
elseif ($choice = 2)
	getInput $sd "Steal Divisor?"
	isNumber $tst $sd
	if ($tst = 1)
		goto :main
	else
		setVar $sd 30
		goto :main
	end
elseif ($choice = 3)
	if ($rs = "Yes")
		setVar $rs "No"
	else
		setVar $rs "Yes"
	end
	goto :main
elseif ($choice = 4)
	if ($figlay = "On")
		setVar $figlay "Off"
	else
		setVar $figlay "On"
		:figtype
		echo ANSI_15 "*(" ANSI_12 "D" ANSI_15 ")efensive, (" ANSI_12 "O" ANSI_15 ")ffensive, or {" ANSI_12 "T" ANSI_15 ")oll fighters?*"
		getConsoleInput $ft singlekey
		lowercase $ft
		if ($ft = "d")
			setVar $figtype "Defensive"
		elseif ($ft = "o")
			setVar $figtype "Offensive"
		elseif ($ft = "t")
			setVar $figtype "Toll"
		else
			goto :figtype
		end
		:fignum
		getInput $fignum "How many fighters to lay?"
		isNumber $fn $fignum
		if ($fn = 0)
			goto :fignum
		end
	end
	goto :main
elseif ($choice = 5)
	if ($minelay = "On")
		setVar $minelay "Off"
	else
		setVar $minelay "On"
	end
	goto :main
elseif ($choice = 6)
	getInput $escape "Input escape ship number (0 if none)"
	isnumber $tst $escape
	if ($tst = 0)
		setVar $escape 0
	end
	goto :main
elseif ($choice = "c") or ($choice = "C")
	gosub :save
	goto :run
elseif ($choice = "a") AND ($minelay = "On")
	:numarm
	getInput $armnum "How many armid mines in each sector?"
	isNumber $an $armnum
	if ($an = 0)
		goto :numarm
	end
	goto :main
elseif ($choice = "b") AND ($minelay = "On")
	:numlimp
	getInput $limpnum "How many armid mines in each sector?"
	isNumber $ln $limpnum
	if ($ln = 0)
		goto :numlimp
	end
	goto :main
else
	goto :main
end

:run
fileExists $chk1 $bustfile
if ($chk1 = 1)
	setVar $rdfl 1
:bustclear
	Echo ansi_15 "*Would you like to clear your busts?*"
	getConsoleInput $clr singlekey
	if ($clr = "y") or ($clr = "Y")
		delete $bustfile
	elseif ($clr = "n") or ($clr = "N")
		:rdfl
		read $bustfile $busted $rdfl
		if ($busted <> "EOF")
			setVar $badsec[$busted] 1
			add $rdfl 1
			goto :rdfl
		end
	else
		goto :bustclear
	end
end
setVar $gameinfo_inc~cn9 "ALL"
setVar $gameinfo_inc~cn2 "Off"
setVar $gameinfo_inc~cnb "No"
setVar $gameinfo_inc~cna "Compact"
gosub :gameinfo_inc~cn
send "c;"
setTextLineTrigger oo :oo "Offensive Odds:"
pause
:oo
setVar $info_line CURRENTLINE
stripText $info_line "Main Drive Cost:"
stripText $info_line "Max Fighters:"
stripText $info_line "Offensive Odds:"
getWord $info_line $off_odds 3
striptext $off_odds "."
striptext $off_odds ":1"
send "q"
setTextLineTrigger exp :exp "Rank and Exp   :"
setTextLineTrigger scantype :scan_type "LongRange Scan :"
setTextLineTrigger noscan :no_scanner "Credits        :"
setTextLineTrigger startsec :starter "Current Sector :"
send "i"
pause

:no_scanner
clientMessage "This script requires the use of a Holographic Scanner...  Shutting down..."
halt

:exp
getWord CURRENTLINE $exp 5
stripText $exp ","
pause

:starter
getWord CURRENTLINE $cursec 4
pause

:scan_type
killtrigger noscan
getWord CURRENTLINE $scntpe 4
if ($scntpe <> "Holographic")
	clientMessage "This script requires the use of a Holographic Scanner...  Shutting down..."
	halt
end
setTextLineTrigger creds :creds "Credits        :"
pause

:creds
getWord CURRENTLINE $creds 3
stripText $creds ","

send "jy"
setVar $tb 0
setVar $prev 0
setVar $badsec[$stard] 1
if ($sw = "On")
	Window status 200 100 "Status" yes
end
#pair finder =-=-=-=-=-=-=-=-=-=-=-=-
:fndpair
setVar $prbloop 0
setVar $status "Finding Pair"
send "sd"
waitFor "Relative Density Scan"
waitFor "(?=Help)? :"
setVar $lp 0
setVar $holo 0
:lp
if ($lp < SECTOR.WARPCOUNT[$cursec])
	add $lp 1
	setVar $expchk SECTOR.WARPS[$cursec][$lp]
	if (SECTOR.EXPLORED[$expchk] <> "YES")
		setVar $holo 1
	end
	goto :lp
end
if ($holo = 1)
	send "sh"
	waitFor "(Q)uit? [D] H"
	waitFor "(?=Help)? :"
	setVar $lp 0
	:loop
	if ($lp < SECTOR.WARPCOUNT[$cursec])
		add $lp 1
		setVar $expchk SECTOR.WARPS[$cursec][$lp]
		if (PORT.BUYEQUIP[$expchk] <> 1)
			setVar $badsec[$expchk] 1
		end
		goto :loop
	end
end

:nxtwarp
setVar $prob 500
if ($prbloop < SECTOR.WARPCOUNT[$cursec])
	add $prbloop 1
	setVar $adjsec SECTOR.WARPS[$cursec][$prbloop]
		if ($adjsec > 0) AND ($adjsec < 11)
		add $prob 99999
	end
	if ($adjsec = $stard)
		add $prob 99999
	end
	if (SECTOR.DENSITY[$adjsec] > 1000)
		add $prob SECTOR.DENSITY[$adjsec]
	end
	if ($adjsec = $prev)
		add $prob 100
	end
	if (SECTOR.DENSITY[$adjsec] = 100)
		subtract $prob 10
	end
	if ($badsec[$adjsec] = 1)
		add $prob 50
	end
	if (SECTOR.BUYEQUIP[$adjsec] = 1)
		subtract $prob 40
	end
	subtract $prob SECTOR.WARPCOUNT[$adjsec]
	getRnd $rndprob 0 20
	subtract $prob $rndprob
	if ($prbloop = 1)
		setVar $bestind $prbloop
		setVar $bestpro $prob
	else
		if ($prob < $bestpro)
			setVar $bestind $prbloop
			setVar $bestpro $prob
		end
	end
	if (PORT.BUYEQUIP[$cursec] = 1) AND ($badsec[$cursec] = 0) AND (PORT.BUYEQUIP[$adjsec] = 1) AND ($badsec[$adjsec] = 0) AND (SECTOR.DENSITY[$cursec] < 1000) AND (SECTOR.DENSITY[$adjsec] < 1000) AND ($prob < 1000) AND ((SECTOR.MINES.OWNER[$cursec] = "") OR (SECTOR.MINES.OWNER[$cursec] = "yours") OR (SECTOR.MINES.OWNER[$cursec] = "belong to your Corp")) AND ((SECTOR.MINES.OWNER[$adjsec] = "") OR (SECTOR.MINES.OWNER[$adjsec] = "yours") OR (SECTOR.MINES.OWNER[$adjsec] = "belong to your Corp"))
		send "cf" $adjsec "*" $cursec "*"
		waitFor "The shortest path"
		waitfor "Computer command"
		send "q"
		getDistance $dist $adjsec $cursec
		if ($dist > 1)
			add $prob 4
		else
			setVar $status "SSM"
			send "m" $adjsec "*za9999**"
			if ($figlay = "On")
				send "ft"
				send $fignum "*c"
				if ($figtype = "Defensive")
					send "D"
				elseif ($figtype = "Offensive")
					send "O"
				else
					send "T"
				end
			end
			if ($minelay = "On")
				if ($limpnum > 0)
					send "h2t"
					send $limpnum "*zc*"
				end
				if ($armnum > 0)
					send "h1t"
					send $armnum "*zc*"
				end
			end
			setVar $ssm_inc~port2 $cursec
			setVar $ssm_inc~port1 $adjsec
			setVar $ssm_inc~stdiv $sd
			gosub :ssm_inc~ssm
			if ($ssm_inc~noexp = 1)
				echo ANSI_15 "Not enough experience to continue"
				halt
			end						
			setVar $badsec[$ssm_inc~busted] 1
			write $bustfile $ssm_inc~busted
			goto :refurb
		end
	end
	goto :nxtwarp
end
if ($bestpro > 90000)
	clientMessage "Walled In, Unsafe to move.."
	halt
end
send "m" SECTOR.WARPS[$cursec][$bestind] "*za9999**"
if ($figlay = "On")
	send "ft"
	send $fignum "*c"
	if ($figtype = "Defensive")
		send "D"
	elseif ($figtype = "Offensive")
		send "O"
	else
		send "T"
	end
end
if ($minelay = "On")
	if ($limpnum > 0)
		send "h2t"
		send $limpnum "*zc*"
	end
	if ($armnum > 0)
		send "h1t"
		send $armnum "*zc*"
	end
end
send "d"
waitfor ")? : D"
waitfor "(?="
setVar $badsec[$cursec] 1
setVar $prev $cursec
setVar $cursec SECTOR.WARPS[$cursec][$bestind]
goto :fndpair

:refurb
setVar $status "Refurbing"
setVar $ship_inc~expressto $c0
gosub :ship_inc~express
if ($ship_inc~expressto = "-2")
	goto :warping_out
elseif ($ship_inc~expressto = "-1")
	setVar $ship_inc~xportto $escape
	gosub :ship_inc~xport
	if ($ship_inc~xportto > 0)
		clientMessage "In escape ship, halting script."
		halt
	else
		send "'Help my TA, I have been interdicted and cannot reach my escape ship.*"
		halt
	end
end
send "pt"
setTextLineTrigger c0c :c0c "You have"
pause
:c0c
getWord CURRENTLINE $credits 3
stripText $credits ","
setTextTrigger limpet :remove_limpet "A port official runs up to you"
setTextLineTrigger c0h :c0h "A  Cargo holds     :"
pause

:remove_limpet
send "y"
pause

:c0h
killtrigger limpet
getWord CURRENTLINE $max_buyable_holds 10
send "a" $max_buyable_holds "*y"
setTextLineTrigger c0mh :c0mh "more holds is"
pause
:c0mh
getWord CURRENTLINE $price 8
stripText $price ","
subtract $credits $price
if ($rs = "Yes")
	setTextLineTrigger c0sp :c0sp "C  Shield Points   :"
	setTextLineTrigger c0fg :c0fg "B  Fighters        :"
	pause
	:c0fg
	getWord CURRENTLINE $figprice 4
	getWord CURRENTLINE $maxfigbuy 8
	pause
	:c0sp
	getWord CURRENTLINE $shieldprice 5
	getWord CURRENTLINE $maxshieldbuy 9
	if ($shieldprice < $figprice)
		setVar $bought "s"
	else
		setVar $bought "f"
	end
	setVar $fsbuy 0
	:bfigshi
	if ($credits > 500000)
		setVar $spendable ($credits - 500000)
		if ($bought = "s")	
			setVar $buyable ($spendable / $shieldprice)
			if ($buyable > $maxshieldbuy)
				send "c" $maxshieldbuy "*"
				setVar $credits ($credits - ($maxshieldbuy * $shieldprice))
			else
				send "c" $buyable "*q"
				setVar $credits ($credits - ($buyable * $shieldprice))
				goto :warping_out
			end
		else
			setVar $buyable ($spendable / $figprice)
			if ($buyable > $maxfigbuy)
				send "b" $maxfigbuy "*"
				setVar $credits ($credits - ($maxfigbuy * $figprice))
			else
				send "b" $buyable "*q"
				setVar $credits ($credits - ($maxfigbuy * $figprice))
				goto :warping_out
			end
		end
		if ($fsbuy < 1)
			add $fsbuy 1
			if ($bought = "s")
				setVar $bought "f"
			else
				setVar $bought "s"
			end
			goto :bfigshi
		end
	end

end
send "Q"
:warping_out
getRnd $ship_inc~expressto 11 SECTORS
setVar $goaround $ship_inc~expressto
:getgood
if ($badsec[$ship_inc~expressto] = 1)
	add $ship_inc~expressto 1
	if ($ship_inc~expressto = $goaround)
		echo ANSI_15 "*Out of good ports... Script Halting..."
		halt
	end
	if ($ship_inc~expressto > SECTORS)
		setVar $ship_inc~expressto 11
	end
	goto :getgood
end
setVar $status "Warping Out"
gosub :ship_inc~express
if ($ship_inc~expressto = "-2")
	goto :warping_out
elseif ($ship_inc~expressto = "-1")
	setVar $ship_inc~xportto $escape
	if ($escape > 0)
		gosub :ship_inc~xport
	end
	if ($ship_inc~xportto > 0)
		clientMessage "In escape ship, halting script."
		halt
	else
		send "'Help my TA, I have been interdicted and cannot reach my escape ship.*"
		halt
	end
end
setVar $cursec $ship_inc~expressto
goto :fndpair

:save
setVar $SupGWSSM_c0 $c0
setVar $quik_sfactor $sd
setVar $SupGWSSM_restock $rs
setVar $SupGWSSM_escapeshp $escape
setVar $SupGWSSM_figlay $figlay
setVar $SupGWSSM_fignum $fignum
setVar $SupGWSSM_figtype $figtype
setVar $SupGWSSM_minelay $minelay
setVar $SupGWSSM_limpnum $limpnum
setVar $SupGWSSM_armnum $armnum

saveVar $SupGWSSM_c0
saveVar $quik_sfactor
saveVar $SupGWSSM_restock
saveVar $SupGWSSM_escapeshp
saveVar $SupGWSSM_figlay
saveVar $SupGWSSM_fignum
saveVar $SupGWSSM_figtype
saveVar $SupGWSSM_minelay
saveVar $SupGWSSM_limpnum
saveVar $SupGWSSM_armnum

setVar $SupGWSSMSaved 1

saveVar $SupGWSSMSaved
return


include "supginclude\gameinfo_inc"
include "supginclude\signature_inc"
include "supginclude\ssm_inc"
include "supginclude\ship_inc"