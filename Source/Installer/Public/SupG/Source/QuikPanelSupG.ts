systemscript
reqrecording
setVar $file GAMENAME & "_QUIK.txt"
setVar $bustfile GAMENAME & "_BUST.txt"
fileExists $chk $file
if ($chk = 1)
	gosub :readFile
	gosub :save
	delete $file
end
loadVar $quikSaved
if ($quikSaved)
	loadVar $quik_ahaggle
	loadVar $quik_hfactor
	loadVar $quik_sfactor
	loadVar $quik_rfactor
	loadVar $quik_figkill
	loadVar $quik_pptstop
	loadVar $quik_bwarn
	loadVar $quik_bwarp
	loadVar $quik_asteal
	loadVar $quik_arob
	loadVar $quik_lsteal
	loadVar $quik_lbust
	loadVar $quik_showSSM
	loadVar $quik_showOre
	loadVar $quik_showOrg
	loadVAr $quik_showEqu
else
	setVar $quik_ahaggle "Off"
	setVar $quik_hfactor 5
	setVar $quik_sfactor 21
	setVar $quik_rfactor 6
	setVar $quik_pptstop 25
	setVar $quik_figkill "Off"
	setVar $quik_bwarn "Off"
	setVar $quik_bwarp "Off"
	setVar $quik_asteal "Off"
	setVar $quik_arob "Off"
	setVar $quik_lsteal 0
	setVar $quik_lbust 0
	setVar $quik_showSSM "Yes"
	setVar $quik_showOre "Yes"
	setVAr $quik_showOrg "Yes"
	setVar $quik_showEqu "Yes"
end

setVar $ahaggle $quik_ahaggle
setVar $hfactor $quik_hfactor
setVar $sfactor $quik_sfactor
setVar $rfactor $quik_rfactor
setVar $figkill $quik_figkill
setVar $bwarn $quik_bwarn
setVar $bwarp $quik_bwarp
setVar $asteal $quik_asteal
setVar $arob $quik_arob
setVar $lsteal $quik_lsteal
setVar $lbust $quik_lbust

gosub :save

if ($bwarn = "On")
	fileExists $chk $bustfile
	if ($chk = 1)
	:abust
		echo ansi_15 "**Would You like to clear your busts?**"
		getConsoleInput $clear singlekey
		if ($clear = "y") or ($clear = "Y")
			delete $bustfile
		elseif ($clear = "n") or ($clear = "N")
			setArray $busts SECTORS
			setVar $read 1
	:rbust
			read $bustfile $bustsec $read
			if ($bustsec <> "EOF")
				setVar $busts[$bustsec] 1
				add $read 1
				goto :rbust
			end
		else
			goto :abust
		end
	end
end

:setmenu
echo "[2J"
setVar $signature_inc~scriptName "SupGQuikPanel"
setVar $signature_inc~version "3.b"
setVar $signature_inc~date "02/23/04"
:menu
gosub :signature_inc~signature
echo ANSI_15 "Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Auto Haggle           " ANSI_10 "["
echo ANSI_6 $ahaggle
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Auto Steal            " ANSI_10 "["
echo ANSI_6 $asteal
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Auto Rob              " ANSI_10 "["
echo ANSI_6 $arob
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Haggle Factor         " ANSI_10 "["
echo ANSI_6 $hfactor
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Steal Factor          " ANSI_10 "["
echo ANSI_6 $sfactor
echo ANSI_10 "]*"
echo ANSI_14 "6." ANSI_15 " Rob Factor            " ANSI_10 "["
echo ANSI_6 $rfactor
echo ANSI_10 "]*"
echo ANSI_14 "7." ANSI_15 " Fig Kill              " ANSI_10 "["
echo ANSI_6 $figkill
echo ANSI_10 "]*"
echo ANSI_14 "8." ANSI_15 " Bust Warning          " ANSI_10 "["
echo ANSI_6 $bwarn
echo ANSI_10 "]*"
echo ANSI_14 "9." ANSI_15 " Blind Warp Protection " ANSI_10 "["
echo ANSI_6 $bwarp
echo ANSI_10 "]*"
echo ANSI_14 "0." ANSI_15 " PPT Stop Percentage   " ANSI_10 "["
echo ANSI_6 $quik_pptstop
echo ANSI_10 "]*"
echo ANSI_14 "D." ANSI_15 " Display Options*"
echo ANSI_14 "M." ANSI_15 " Game Options Menu*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to continue.**"
getConsoleInput $choice singlekey
lowercase $choice
if ($choice = 1)
	if ($ahaggle = "Off")
		setVar $ahaggle "On"
	else
		setVar $ahaggle "Off"
	end
elseif ($choice = 4)
	getInput $hfactor "Enter Haggle Factor"
	isNumber $chk $hfactor
	if ($chk = 0)
		setVar $hfactor 5
	end
elseif ($choice = 2)
	if ($asteal = "Off")
		setVar $asteal "On"
	else
		setVar $asteal "Off"
	end	
elseif ($choice = 5)
	getInput $sfactor "Enter Steal Factor"
	isNumber $chk $sfactor
	if ($chk = 0)
		setVar $sfactor 21
	end
elseif ($choice = 3)
	if ($arob = "Off")
		setVar $arob "On"
	else
		setVar $arob "Off"
	end
elseif ($choice = 6)
	getInput $rfactor "Enter Rob Factor"
	isNumber $chk $rfactor
	if ($chk = 0)
		setVar $rfactor 6
	end
elseif ($choice = 7)
	if ($figkill = "Off")
		setVar $figkill "On"
	else
		setVar $figkill "Off"
	end
elseif ($choice = 8)	
	if ($bwarn = "Off")
		setVar $bwarn "On"
		fileExists $chk $bustfile
		if ($chk = 1)
		:askbust
			echo ansi_15 "*Would You like to clear your busts?*"
			getConsoleInput $clear singlekey
			if ($clear = "y") or ($clear = "Y")
				delete $bustfile
			elseif ($clear = "n") or ($clear = "N")
				setArray $busts SECTORS
				setVar $read 1
			:readbust
				read $bustfile $bustsec $read
				if ($bustsec <> "EOF")
					setVar $busts[$bustsec] 1
					add $read 1
					goto :readbust
				end
			else
				goto :askbust
			end
		end
	else
		setVar $bwarn "Off"
	end
elseif ($choice = 9)
	if ($bwarp = "Off")
		setVar $bwarp "On"
	else
		setVAr $bwarp "Off"
	end
elseif ($choice = 0)
	getInput $quik_pptstop "PPT stop percentage"
	isNumber $chk $quik_pptstop
	if ($chk = 0) OR ($quik_pptstop < 0) OR ($quik_pptstop > 100)
		setVar $quik_pptstop 25
	end
elseif ($choice = "d")
	gosub :displayOptions
elseif ($choice = "c") or ($choice = "m")
	gosub :save
	if ($choice = "m")
		goto :optmenu
	end
	goto :wait
else
	goto :setmenu
end
goto :setmenu

:wait
killalltriggers
setTextTrigger autooff :autooff "SUPGSCRIPT_AUTO_OFF"
setTextTrigger bwarpoff :bwarpoff "SUPGSCRIPT_BWARP_OFF"
setTextTrigger figkilloff :killoff "SUPGSCRIPT_KILL_OFF"
if ($ahaggle = "On")
	SetTextTrigger ptrade :bunits "do you want to buy"
	SetTextTrigger strade :sunits "do you want to sell"
	setTextTrigger planettrade :plnttrade "<Negotiate Planetary TradeAgreement>"
end
if ($asteal = "On")
	setTextTrigger steal :steal "to swipe? ["
end
if ($arob = "On")
	setTextLineTrigger rob :rob "has in excess of"
end
if ($figkill = "On")
	setTextTrigger moving :moving "You have to destroy the fighters"
	setTextTrigger mines :moving "<Re-Display>"
	setTextTrigger citmine :moving "<Scan Sector>"
end
if ($bwarp = "On")
	setTextTrigger bwarp :bwarp "Do you want to make this jump blind?"
	setTextTrigger bbwar :bwarp "Do you want to make this transport blind?"
end
setTextTrigger busted :busted "Suddenly you're Busted"
setTextTrigger nobust :ssteal "Success!"
setTextTrigger chkbust :chkbust "] (?=Help)?"
setTextTrigger info :get_info "<Info>"
setTextLineTrigger keep :keepalive "Your session will be terminated in"
setTextOutTrigger sets :optmenu "~" 
pause

:get_info
killalltriggers
setTextLineTrigger alnexp :alnexp "Rank "
setTextTrigger gotinf :wait "(?=Help)?"
pause

:alnexp
getText CURRENTLINE $knownexp ": " " points,"
stripText $knownexp ","
getWord CURRENTLINE $knownalign 7
stripText $knownalign "Alignment="
stripText $knownalign ","
pause

:plnttrade
killalltriggers
gosub :phaggle_inc~planet_neg
goto :wait


:bunits
setVar $ppt_inc~multiplier (100 - $hfactor)
goto :units
:sunits
setVar $ppt_inc~multiplier (100 + $hfactor)


:units
killtrigger ptrade
killtrigger strade
killtrigger go
killtrigger done
SetTextTrigger ptrade :bunits "do you want to buy ["
SetTextTrigger strade :sunits "do you want to sell ["
setTextLineTrigger go :finishhaggle "Agreed, "
setTextLineTrigger done :donehaggle "empty cargo holds."
pause
:finishhaggle
killtrigger done
gosub :ppt_inc~haggle
:donehaggle
goto :wait

:moving
setVar $ship_inc~singlestep 1
gosub :ship_inc~clear_sector
goto :wait

:steal
getText CURRENTLINE $maxholds "[" "]"
setVar $stealholds ($knownExp / $sfactor)
if ($stealholds > $maxholds)
	send $maxholds "*"
else
	send $stealholds "*"
end
pause

:rob
getWord CURRENTLINE $cop 11
stripText $cop ","
if ($cop = 0)
	send "*"
else
	setVar $robamount ($knownExp * $rfactor)
	if ($robamount > $cop)
		setVar $cop (($cop * 110) / 100)
		send $cop "*"
	else
		send $robamount "*"
	end
end
pause

:chkbust
getText CURRENTLINE $cursec "]:[" "] ("
if ($bwarn = "On")
	if ($lbust = $cursec)
		echo ANSI_5 "[" ANSI_12 "LAST BUST" ANSI_5 "] : "
	elseif ($busts[$cursec] = 1)
		echo ANSI_5 "[" ANSI_12 "BUSTED" ANSI_5 "] : "
	elseif ($lsteal = $cursec)
		echo ANSI_5 "[" ANSI_14 "LAST STEAL" ANSI_5 "] : "
	end
end
goto :wait

:busted
waitFor "(?=Help)? :"
getText CURRENTLINE $cursec "]:[" "] ("
setVar $busts[$cursec] 1
write $bustfile $cursec
setVar $lbust $cursec
gosub :save
if ($bwarn = "On")
	echo ANSI_5 "[" ANSI_12 "LAST BUST" ANSI_5 "] : "
end
goto :wait

:ssteal
waitFor "(?=Help)? :"
getText CURRENTLINE $cursec "]:[" "] ("
setVar $lsteal $cursec
gosub :save
if ($bwarn = "On")
	echo ANSI_5 "[" ANSI_14 "LAST STEAL" ANSI_5 "] : "
end
goto :wait

:bwarp
send "n"
goto :wait

#==-=-=-=-=-==-=-=
:optmenu
cutText CURRENTLINE $location 1 7
if ($location = "Command") OR ($location = "Citadel") OR ($location = "Compute") OR ($location = "Corpora") OR ($location = "<StarDo") OR ($location = "Planet ") OR ($location = "Engage ") OR ($location = "Option?") OR ($location = "<Tavern")
	gosub :gameinfo_inc~quikstats
	setVar $cursec $gameinfo_inc~quikstats[SECT]
	setVar $align $gameinfo_inc~quikstats[ALN]
else
	setVar $align $knownalign
end

:alnmenu
echo "[2J"
setVar $signature_inc~scriptName "SupGQuikPanel"
setVar $signature_inc~version "3.b"
setVar $signature_inc~date "02/23/04"
gosub :signature_inc~signature
echo ANSI_15 "*Option Menu *"

if (PORT.CLASS[$cursec] <> "-1")
	setVar $round 0
	setVar $menuitem 0
	:round
	if ($round < SECTOR.WARPCOUNT[$cursec])
		add $round 1
		setVar $adjsec SECTOR.WARPS[$cursec][$round]
		if (PORT.CLASS[$adjsec] = "-1")
			goto :round
		end
		if ((PORT.BUYEQUIP[$cursec] = 1) AND (PORT.BUYEQUIP[$adjsec] = 0) AND ($quik_showEqu = "Yes")) OR ((PORT.BUYORG[$cursec] = 0) AND (PORT.BUYORG[$adjsec] = 1) AND ($quik_showOrg = "Yes")) OR ((PORT.BUYEQUIP[$cursec] = 0) AND (PORT.BUYEQUIP[$adjsec] = 1) AND ($quik_showEqu = "Yes")) OR ((PORT.BUYORG[$cursec] = 1) AND (PORT.BUYORG[$adjsec] = 0) AND ($quik_showOrg = "Yes")) OR ((PORT.BUYFUEL[$cursec] = 1) AND (PORT.BUYFUEL[$adjsec] = 0) AND ($quik_showOre = "Yes")) OR ((PORT.BUYFUEL[$cursec] = 0) AND (PORT.BUYFUEL[$adjsec] = 1) AND ($quik_showOre = "Yes"))
			if (PORT.CLASS[$cursec] <> 9) AND (PORT.CLASS[$adjsec] <> 9) AND (PORT.CLASS[$cursec] <> 0) AND (PORT.CLASS[$adjsec] <> 0) AND ($location = "Command")
				add $menuitem 1
				setVar $port_inc~classchk PORT.CLASS[$cursec]
				gosub :port_inc~chkclass
				setVar $class1 $port_inc~class
				setVar $port_inc~classchk PORT.CLASS[$adjsec]
				gosub :port_inc~chkclass
				setVar $class2 $port_inc~class
				setVar $makemenu[$menuitem] "PPT " & $cursec & " " & $adjsec
				echo ANSI_14 $menuitem ". " ANSI_15 "PPT - " $cursec & " (" & $class1 & ")"
				if ($busts[$cursec] = 1)
					echo ANSI_15 " (" ANSI_12 "Busted" ANSI_15 ") "
				end
				if ($lbust = $cursec)
					echo ANSI_15 " (" ANSI_12 "Last Bust" ANSI_15 ") "
				end
				if ($lsteal = $cursec)
					echo ANSI_15 " (" ANSI_14 "Last Steal" ANSI_15 ") "
				end
				echo "and " $adjsec  & " (" & $class2 & ")"
				if ($busts[$adjsec] = 1)
					echo ANSI_15 " (" ANSI_12 "Busted" ANSI_15 ") "
				end
				if ($lbust = $adjsec)
					echo ANSI_15 " (" ANSI_12 "Last Bust" ANSI_15 ") "
				end
				if ($lsteal = $adjsec)
					echo ANSI_15 " (" ANSI_14 "Last Steal" ANSI_15 ") "
				end
				echo "*"
			end
		end
		if (PORT.BUYEQUIP[$cursec] = 1) AND (PORT.BUYEQUIP[$adjsec] = 1) AND ($align < "-100") AND ($quik_showSSM = "Yes") AND ($location = "Command")
			add $menuitem 1
			setVar $makemenu[$menuitem] "SSM " & $cursec & " " & $adjsec
			echo ANSI_14 $menuitem ". " ANSI_15 "SSM - " $cursec  
			if ($busts[$cursec] = 1)
				echo ANSI_15 " (" ANSI_12 "Busted" ANSI_15 ") "
			end
			if ($lbust = $cursec)
				echo ANSI_15 " (" ANSI_12 "Last Bust" ANSI_15 ") "
			end
			if ($lsteal = $cursec)
				echo ANSI_15 " (" ANSI_14 "Last Steal" ANSI_15 ") "
			end
			echo " and " $adjsec 
			if ($busts[$adjsec] = 1)
				echo ANSI_15 " (" ANSI_12 "Busted" ANSI_15 ") "
			end
			if ($lbust = $adjsec)
				echo ANSI_15 " (" ANSI_12 "Last Bust" ANSI_15 " )"
			end
			if ($lsteal = $adjsec)
				echo ANSI_15 " (" ANSI_14 "Last Steal" ANSI_15 ") "
			end
			echo "*"
		end
		goto :round
	end
end
if (($location = "Command") or ($location = "Citadel")) AND ($gameinfo_inc~quikstats[PHOT] > 0)
	echo ANSI_14 "P. " ANSI_15 "Adjacent Photon Watch*"
end
echo ANSI_14 "S. " ANSI_15 "Settings*" 
echo ANSI_14 "Q. " ANSI_15 "Close Menu*"
if ($menuitem < 10)
	getConsoleInput $optchoice singlekey
else
	getConsoleInput $optchoice
end
lowercase $optchoice
isNumber $num $optchoice
if ($optchoice = "p") and ($location = "Command") or ($location = "Citadel")
	gosub :gameinfo_inc~quikstats
	setVar $cursec $gameinfo_inc~quikstats[SECT]	
	Echo ANSI_15 "*Now in Photon Mode Press ~ to Return to Normal Mode...*"
	:torpwait
	killalltriggers
	setTextLineTrigger limpet :limpet "Limpet mine in"
	setTextLineTrigger fighter :fighter "Deployed Fighters Report Sector"
	setTextOutTrigger sets :return "~"
	pause
	:limpet
	killTrigger fighter
	getWord CURRENTLINE $adj_sec 4
	getWord CURRENTLINE $fi 1
	goto :check

	:fighter
	killTrigger limpet
	getWord CURRENTLINE $adj_sec 5
	getWord CURRENTLINE $fi 1
	stripText $adj_sec ":"
	

	:check 
	if ($fi <> "Deployed") AND ($fi <> "Limpet")
		goto :torpwait
	end
	getDistance $dist $cursec $adj_sec
	if ($dist = 1)
		send "cpy" $adj_sec "*q"
	end
	goto :torpwait
elseif ($optchoice = "s")
	goto :setmenu
elseif ($optchoice = "q")
	goto :wait
elseif ($num = 1)
	if ($optchoice <= $menuitem) AND ($optchoice > 0)
		getWord $makemenu[$optchoice] $sub 1
		getWord $makemenu[$optchoice] $port1 2
		getWord $makemenu[$optchoice] $port2 3
	else
		goto :alnmenu
	end
	if ($sub = "PPT")
		killalltriggers
		setVar $ppt_inc~port1 $port1
		setVar $ppt_inc~port2 $port2
		setVar $ppt_inc~haggle $hfactor
		setVAr $ppt_inc~stopperc $quik_pptstop
		setTextOutTrigger abort :return "~"
		gosub :ppt_inc~ppt
	elseif ($sub = "SSM")
		killalltriggers
		send "jy"
		setVar $ssm_inc~port1 $port1
		setVar $ssm_inc~port2 $port2
		setVar $ssm_inc~haggle $hfactor
		setVar $ssm_inc~hag 1
		setVar $ssm_inc~stdiv $sfactor
		setTextOutTrigger abort :return "~"
		gosub :ssm_inc~ssm
		killtrigger abort
		setVar $busts[$cash_inc~busted] 1
		write $bustfile $ssm_inc~busted
		setVar $lbust $ssm_inc~busted
		if ($port1 = $ssm_inc~busted)
			setVar $lsteal $port2
		else
			setVar $lsteal $port1
		end
		gosub :save
	end
	goto :wait
else
	goto :alnmenu
end

:return
Echo ANSI_15 "*Returning to Normal Operation*"
goto :wait

:keepalive
send "#"
goto :wait

include "supginclude\ssm_inc"
include "supginclude\ppt_inc"
include "supginclude\port_inc"
include "supginclude\gameinfo_inc"
include "supginclude\phaggle_inc"
include "supginclude\signature_inc"
include "supginclude\ship_inc"

:save
setVar $quik_ahaggle $ahaggle
setVar $quik_hfactor $hfactor
setVar $quik_sfactor $sfactor
setVar $quik_rfactor $rfactor
setVar $quik_figkill $figkill
setVar $quik_bwarn $bwarn
setVar $quik_bwarp $bwarp
setVar $quik_asteal $asteal
setVar $quik_arob $arob
setVar $quik_lsteal $lsteal
setVar $quik_lbust $lbust

saveVar $quik_ahaggle
saveVar $quik_pptstop
saveVar $quik_hfactor
saveVar $quik_sfactor
saveVar $quik_rfactor
saveVar $quik_figkill
saveVar $quik_bwarn
saveVar $quik_bwarp
saveVar $quik_asteal
saveVar $quik_arob
saveVar $quik_lsteal
saveVar $quik_lbust
saveVar $quik_showSSM
saveVar $quik_showOre
saveVar $quik_showOrg
saveVAr $quik_showEqu

	
setVar $quikSaved 1
saveVar $quikSaved
return

:readFile
read $file $ahaggle 1
read $file $hfactor 2
read $file $sfactor 3
read $file $rfactor 4
read $file $figkill 5
read $file $bwarn 6
read $file $bwarp 7
read $file $asteal 8
read $file $arob 9
read $file $lsteal 10
read $file $lbust 11
return

:autooff
echo "*heh"
if ($ahaggle = "On") OR ($asteal = "On") OR ($arob = "On")
	clientMessage "(SupGQuikPanel) - SupGCashing script started, turning off auto haggle, rob, steal."
	setVar $ahaggle "Off"
	setVar $asteal "Off"
	setVar $arob "Off"
end
goto :wait

:bwarpoff
if ($bwarp = "On")
	clientMessage "(SupGQuikPanel) - SupGMove/Colo script started, turning off blind warp protection."
	setVar $bwarp "Off"
end
goto :wait

:killoff
if ($figkill = "On")
	clientMessage "(SupGQuikPanel) - SupGClearing script started, turning off auto fighter killing."
	setVar $figkill "Off"
end
goto :wait

:displayOptions
:setdisplaymenu
echo "[2J"
setVar $signature_inc~scriptName "SupGQuikPanel"
setVar $signature_inc~version "3.b"
setVar $signature_inc~date "02/23/04"
:displaymenu
gosub :signature_inc~signature
echo ANSI_15 "Display Options for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Display SSM Pairs      " ANSI_10 "["
echo ANSI_6 $quik_showSSM
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Display Fuel Pairs     " ANSI_10 "["
echo ANSI_6 $quik_showOre
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Display Organics Pairs " ANSI_10 "["
echo ANSI_6 $quik_showOrg
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Display Equipment Pairs" ANSI_10 "["
echo ANSI_6 $quik_showEqu
echo ANSI_10 "]*"
echo ANSI_14 "D." ANSI_15 " Done"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " D" ANSI_5 " when you are done.**"
getConsoleInput $displaychoice singlekey
lowercase $displaychoice
if ($displaychoice = 1)
	if ($quik_showSSM = "No")
		setVar $quik_showSSM "Yes"
	else
		setVar $quik_showSSM "No"
	end
elseif ($displaychoice = 2)
	if ($quik_showOre = "No")
		setVar $quik_showore "Yes"
	else
		setVar $quik_showore "No"
	end
elseif ($displaychoice = 3)
	if ($quik_showorg = "No")
		setVar $quik_showorg "Yes"
	else
		setVar $quik_showorg "No"
	end	
elseif ($displaychoice = 4)
	if ($quik_showequ = "No")
		setVar $quik_showequ "Yes"
	else
		setVar $quik_showequ "No"
	end
elseif ($displaychoice = "d")
	return
else
	goto :setdisplaymenu
end
goto :setdisplaymenu