:deploy
if ($personal)
	setvar $mine "p"
else
	setvar $mine "c"
end

gosub :mineprotections
if ($mines~ready <> true)
	return
end

setvar $predeployarmids $player~armids
setvar $predeploylimpets $player~limpets
if ($bot~startinglocation = "Citadel")
	send "s"
	setvar $start_mac "q q "
	setvar $end_mac "l "&$planet~planet&"* c s"
else
	send "*"
	setvar $start_mac ""
	setvar $end_mac "*"
end
waiton "Warps to Sector(s) :"
send "* "

setvar $armid_count sector.mines.quantity[$player~current_sector]
setvar $limpet_count sector.limpets.quantity[$player~current_sector]
setvar $limpetowner sector.limpets.owner[$player~current_sector]
setvar $armidowner sector.mines.owner[$player~current_sector]

if (($player~armids <= 0) and (($armidowner <> "belong to your Corp") and ($armidowner <> "yours")))
	setvar $switchboard~message "Out of armids!*"
	gosub :switchboard~switchboard
	return
elseif ($amount > $player~armids)
	setvar $amount $player~armids
end

if (($player~limpets <= 0) and (($limpetowner <> "belong to your Corp") and ($limpetowner <> "yours")))
	setvar $switchboard~message "Out of limpets!*"
	gosub :switchboard~switchboard
	return
elseif ($amount > $player~limpets)
	setvar $amount $player~limpets
end

if ((($armidowner <> "belong to your Corp") and ($armidowner <> "yours")) and (($limpetowner <> "belong to your Corp") and ($limpetowner <> "yours")) and ($limpet_count >= $amount) and ($armid_count >= $amount))
	setvar $switchboard~message "Armid and limpet mines already deployed into this sector!*"
	gosub :switchboard~switchboard
	return
end

send $start_mac "z n h 2 z " $amount "*  z" $mine "* h 1 z " $amount "*  z " $mine "* q q * " $end_mac
waiton "Warps to Sector(s) :"
gosub :player~quikstats
send "* "

if ((($predeployarmids > $player~armids) and ($predeploylimpets > $player~limpets)) or (($predeploylimpets = $player~limpets) and (($limpetowner = "belong to your Corp") or ($limpetowner = "yours")) and ($predeployarmids = $player~armids) and (($armidowner = "belong to your Corp") or ($armidowner = "yours"))))
	setvar $switchboard~message $amount&" Armid and Limpet mines deployed into the sector!*"
	gosub :switchboard~switchboard
	setsectorparameter $player~current_sector "LIMPSEC" true
	setsectorparameter $player~current_sector "MINESEC" true
else
	if ($predeployarmids > $player~armids)
		setvar $switchboard~message $switchboard~message&$amount&" Armid mine(s) deployed into the sector!*"
		setsectorparameter $player~current_sector "MINESEC" true
	end
	if ($predeploylimpets > $player~limpets)
		setvar $switchboard~message $switchboard~message&$amount&" Limpet mine(s) deployed into the sector!*"
		setsectorparameter $player~current_sector "LIMPSEC" true
	end
	gosub :switchboard~switchboard
end

if ($predeployarmids < $player~armids)
	setvar $switchboard~message ($player~armids - $predeployarmids)&" Armid mines picked up from sector!*"
elseif (($predeployarmids = $player~armids) and (($armidowner <> "belong to your Corp") and ($armidowner <> "yours")))
	setvar $switchboard~message "Enemy armid(s) present in sector, cannot deploy!*"
end
gosub :switchboard~switchboard

if ($predeploylimpets < $player~limpets)
	setvar $switchboard~message ($player~limpets - $predeploylimpets)&" Limpet mines picked up from sector!*"
elseif (($predeploylimpets = $player~limpets) and (($limpetowner <> "belong to your Corp") and ($limpetowner <> "yours")))
	setvar $switchboard~message "Enemy limpet(s) present in sector, cannot deploy!*"
end
gosub :switchboard~switchboard
return

# ============================== END MINES (ARMID AND LIMP) SUB ==============================
:deployarmid
if ($personal)
	setvar $mine "p"
else
	setvar $mine "c"
end

gosub :mineprotections
if ($mines~ready <> true)
	return
end
if ($player~armids <= 0)
	if ($player~startinglocation = "Citadel")
		send "s* "
		waitfor "Warps to Sector(s) :"
	elseif ($player~startinglocation = "Command")
		send "d* "
	end
	if ((sector.mines.owner[$player~current_sector] = "belong to your Corp") or (sector.mines.owner[$player~current_sector] = "yours"))
		if ($amount > sector.mines.quantity[$player~current_sector])
			setvar $amount sector.mines.quantity[$player~current_sector]
		end
	else
		setvar $switchboard~message "Out of Armid Mines!*"
		gosub :switchboard~switchboard
		return
	end
elseif ($amount > $player~armids)
	setvar $amount $player~armids
end

:retryarmid
killalltriggers

if ($player~startinglocation = "Citadel")
	send "q q z n h1 z " $amount "*  z" $mine " z n n  *l " $planet~planet "* c"
else
	send "z n h1 z " $amount "*  z" $mine " z n"
end
settextlinetrigger toomanyarmid :toomanyarmid "!  You are limited to "
settextlinetrigger armiddone :armiddone "Done. You have "
settextlinetrigger armidenemy :armidblocked "These mines are not under your control."
settextlinetrigger armidnotenough :armidnotenough "You don't have that many mines available."
pause

:armiddone
killalltriggers
setvar $ismined true
if ($player~startinglocation = "Citadel")
	waiton "Citadel command (?=help)"
	send "s*"
else
	waiton "Command [TL="
	send "d*"
end
settextlinetrigger armidpersonal :armidpersonal "(Type 1 Armid) (yours)"
settextlinetrigger armidcorp :armidcorp "(Type 1 Armid) (belong to your Corp)"
settextlinetrigger armidblocked :armidblocked "Citadel treasury contains"
pause

:armidcorp
setvar $switchboard~message $amount&" Corporate Mines Deployed!*"
gosub :switchboard~switchboard
goto :donearmiddeploy

:armidpersonal
setvar $switchboard~message $amount&" Personal Mines Deployed!*"
gosub :switchboard~switchboard
goto :donearmiddeploy

:armidblocked
setvar $switchboard~message "Sector already has enemy Armid Mines present!*"
gosub :switchboard~switchboard
setvar $ismined false
goto :donearmiddeploy

:toomanyarmid
getword currentline $max_mines 11

if ((sector.mines.owner[$player~current_sector] = "belong to your Corp") or (sector.mines.owner[$player~current_sector] = "yours"))
	setvar $switchboard~message "Your ship only holds "&$max_mines&", retrying!*"
	gosub :switchboard~switchboard
	setvar $amount ((sector.mines.quantity[$player~current_sector] + $player~armids) - $max_mines)
	goto :retryarmid
else
	setvar $switchboard~message "Too many mines in the sector!*"
	gosub :switchboard~switchboard
	goto :donearmiddeploy
end

:armidnotenough
setvar $switchboard~message "You don't have that many available!*"
gosub :switchboard~switchboard

:donearmiddeploy
if ($ismined)
	setsectorparameter $player~current_sector "MINESEC" true
else
	setsectorparameter $player~current_sector "MINESEC" false
end
killalltriggers
return

:deploylimp
if ($personal)
	setvar $mine "p"
else
	setvar $mine "c"
end

gosub :mineprotections
if ($mines~ready <> true)
	return
end
if ($player~limpets <= 0)
	if ($player~startinglocation = "Citadel")
		send "s* "
		waitfor "Warps to Sector(s) :"
	elseif ($player~startinglocation = "Command")
		send "d* "
	end
	if ((sector.limpets.owner[$player~current_sector] = "belong to your Corp") or (sector.limpets.owner[$player~current_sector] = "yours"))
		if ($amount > sector.limpets.quantity[$player~current_sector])
			setvar $amount sector.limpets.quantity[$player~current_sector]
		end
	else
		setvar $switchboard~message "Out of limpets!*"
		gosub :switchboard~switchboard
		return
	end
elseif ($amount > $player~limpets)
	setvar $amount $player~limpets
end

:retrylimp
killalltriggers

if ($player~startinglocation = "Citadel")
	send "q q z* h2z" $amount "* z " $mine " z * * *l " $planet~planet "* c"
else
	send "z* h2z" $amount "* z " $mine " z * *"
end
settextlinetrigger toomanylimp :toomanylimp "!  You are limited to "
settextlinetrigger limpdone :limpdone "Done. You have "
settextlinetrigger limpenemy :limpblocked "These mines are not under your control."
settextlinetrigger limpnotenough :limpnotenough "You don't have that many mines available."
pause

:limpdone
killalltriggers
setvar $islimped true
if ($player~startinglocation = "Citadel")
	waiton "Citadel command (?=help)"
	send "s* "
else
	send "d* "
end
settextlinetrigger limppersonal :limppersonal "(Type 2 Limpet) (yours)"
settextlinetrigger limpcorp :limpcorp "(Type 2 Limpet) (belong to your Corp)"
settextlinetrigger limpblocked :limpblocked "Warps to Sector(s) :"
pause

:limpcorp
killalltriggers
setvar $switchboard~message $amount&" Corporate Limpets Deployed!*"
gosub :switchboard~switchboard
goto :donelimpdeploy

:limppersonal
killalltriggers
setvar $switchboard~message $amount&" Personal Limpet Deployed!*"
gosub :switchboard~switchboard
goto :donelimpdeploy

:limpblocked
killalltriggers
setvar $switchboard~message "Sector already has enemy limpets present!*"
gosub :switchboard~switchboard
setvar $islimped false
goto :donelimpdeploy

:toomanylimp
getword currentline $max_mines 11

if ((sector.limpets.owner[$player~current_sector] = "belong to your Corp") or (sector.limpets.owner[$player~current_sector] = "yours"))
	setvar $switchboard~message "Your ship only holds "&$max_mines&", retrying!*"
	gosub :switchboard~switchboard
	setvar $amount ((sector.limpets.quantity[$player~current_sector] + $player~limpets) - $max_mines)
	goto :retrylimp
else
	setvar $switchboard~message "Too many mines in the sector!*"
	gosub :switchboard~switchboard
	goto :donelimpdeploy
end

:limpnotenough
setvar $switchboard~message "You don't have that many available!*"
gosub :switchboard~switchboard

:donelimpdeploy
if ($islimped)
	setsectorparameter $player~current_sector "LIMPSEC" true
else
	setsectorparameter $player~current_sector "LIMPSEC" false
end
killalltriggers
return

:updatearmids
setvar $switchboard~message "Loading current armid locations. . .*"
gosub :switchboard~switchboard

setarray $pmines sectors

:readarmidlist
setvar $count 0
setvar $personalcount 0
send "k1"
setvar $i 1
setvar $limpetoutput ""
setvar $personaloutput " "
setvar $output " "

:keepcountingarmids
killtrigger corporate
killtrigger personal
killtrigger donecountingfigs
killtrigger donenofigs
settextlinetrigger corporate :corpcountarmids " Corp"
settextlinetrigger personal :personalcountarmids "Personal "
settextlinetrigger donecountingfigs :donecountingarmids "Total"
settextlinetrigger donenofigs :donecountingarmids "No mines deployed"
pause

:personalcountarmids
add $count 1
add $personalcount 1
getword currentline $sector 1
getword currentline $nummines 2
setvar $personaloutput $personaloutput&$sector&"  "
setvar $pmines[$sector] $nummines
settextlinetrigger personal :personalcountarmids "Personal "
pause

:corpcountarmids
add $count 1
add $player~corpcount 1
getword currentline $sector 1
getword currentline $nummines 2
while ($i <= $sector)
	getwordpos $personaloutput $pos " "&$i&" "
	if (($sector = $i) or ($pos > 0))
		if ($pos > 0)
			setvar $output $output&$pmines[$i]&"*"
		else
			setvar $output $output&$nummines&"*"
		end
		setsectorparameter $i "MINESEC" true
	else
		setvar $output $output&"0*"
		setsectorparameter $i "MINESEC" false
	end
	add $i 1
end
settextlinetrigger corporate :corpcountarmids " Corp"
pause

:donecountingarmids
killtrigger corporate
killtrigger personal
killtrigger donecountingfigs
killtrigger donenofigs

while ($i <= sectors)
	getwordpos $personaloutput $pos " "&$i&" "
	if ($pos > 0)
		setvar $output $output&$nummines&"*"
		setsectorparameter $i "MINESEC" true
	else
		setvar $output $output&"0*"
		setsectorparameter $i "MINESEC" false
	end
	add $i 1
end
setvar $armidgridcount $count
setvar $armidgridpersonalcount $personalcount
return

:reportarmids
loadvar $bot~armid_count
setvar $percent (($armidgridcount * 100) / sectors)
setvar $gridchange $armidgridcount - $bot~armid_count
if ($gridchange > 0)
	setvar $gridchange "+"&$gridchange
end
setvar $bot~armid_count $armidgridcount
savevar $bot~armid_count
setvar $switchboard~message $switchboard~message&"          - Armid Grid Report -*          - "&$armidgridcount&" sectors, "&$armidgridpersonalcount&" personal. ("&$percent&"%) ("&$gridchange&" Change)**"
return

:updatelimps
setarray $plimps sectors

setvar $switchboard~message "Loading current limpet locations. . .*"
gosub :switchboard~switchboard

:readlimplist
setvar $count 0
setvar $personalcount 0
send "k2"
setvar $i 1
setvar $limpetoutput ""
setvar $personaloutput " "
setvar $output " "

:keepcountinglimps
killtrigger corporate
killtrigger personal
killtrigger donecountingfigs
killtrigger donenofigs
settextlinetrigger corporate :corpcountlimps " Corp"
settextlinetrigger personal :personalcountlimps "Personal "
settextlinetrigger donecountingfigs :donecountinglimps "Total"
settextlinetrigger donenofigs :donecountinglimps "No Limpet mines deployed"
pause

:personalcountlimps
add $count 1
add $personalcount 1
getword currentline $sector 1
getword currentline $nummines 2
setvar $personaloutput $personaloutput&$sector&"  "
setvar $plimps[$sector] $nummines
settextlinetrigger personal :personalcountlimps "Personal "
pause

:corpcountlimps
add $count 1
add $player~corpcount 1
getword currentline $sector 1
getword currentline $nummines 2
while ($i <= $sector)
	getwordpos $personaloutput $pos " "&$i&" "
	if (($sector = $i) or ($pos > 0))
		if ($pos > 0)
			setvar $output $output& $plimps[$i] &"*"
		else
			setvar $output $output&$nummines&"*"
		end
		setsectorparameter $i "LIMPSEC" true
	else
		setvar $output $output&"0*"
		setsectorparameter $i "LIMPSEC" false
	end
	add $i 1
end
settextlinetrigger corporate :corpcountlimps " Corp"
pause

:donecountinglimps
killtrigger corporate
killtrigger personal
killtrigger donecountingfigs
killtrigger donenofigs
settexttrigger checklimps :checkmarkedlimps "Activated  Limpet  Scan"
pause

:checkmarkedlimps
settextlinetrigger donechecking :donecheckinglimps "Total"
settextlinetrigger donecheckingtoo :donecheckinglimps "No Active Limpet mines detected"
settextlinetrigger corporate :marklimpet " Corp"
settextlinetrigger personal :marklimpet "Personal "
pause

:marklimpet
killtrigger corporate
killtrigger personal
setvar $temp currentline
striptext $temp #42
setvar $limpetoutput $limpetoutput&"             "&$temp&"*"
killtrigger unfreezingtrigger
setdelaytrigger unfreezingtrigger :unfreezebot 10000
settextlinetrigger corporate :marklimpet " Corp"
settextlinetrigger personal :marklimpet "Personal "
pause

:donecheckinglimps
killtrigger donechecking
killtrigger donecheckingtoo
while ($i <= sectors)
	getwordpos $personaloutput $pos " "&$i&" "
	if ($pos > 0)
		setvar $output $output&$nummines&"*"
		setsectorparameter $i "LIMPSEC" true
	else
		setvar $output $output&"0*"
		setsectorparameter $i "LIMPSEC" false
	end
	add $i 1
end
setvar $limpetgridcount $count
setvar $limpetgridpersonalcount $personalcount
setvar $limpetgridoutput $limpetoutput
return

:reportlimps
loadvar $bot~limpet_count
setvar $percent (($limpetgridcount * 100) / sectors)
setvar $gridchange ($limpetgridcount - $bot~limpet_count)
if ($gridchange > 0)
	setvar $gridchange "+"&$gridchange
end
setvar $bot~limpet_count $limpetgridcount
savevar $bot~limpet_count
setvar $player~limpetsgridded true
setvar $switchboard~message $switchboard~message&"          - Limpet Grid Report -*          - "&$limpetgridcount&" sectors, "&$limpetgridpersonalcount&" personal. ("&$percent&"%) ("&$gridchange&" Change)*          - Activated  Limpet  Scan*            *             Sector    Personal/Corp*            ========================*"&$limpetgridoutput&"*"
return

:unfreezebot
echo "*Bot timed out, unfreezing..*"
setdeafclients false
halt

:mineprotections
setvar $mines~ready false
killalltriggers
gosub :player~quikstats
if (($player~current_sector < 10) or ($player~current_sector = $map~stardock))
	setvar $switchboard~message "Cannot deploy in FedSpace!*"
	gosub :switchboard~switchboard
	return
end
if ($player~current_prompt = 0)
	gosub :player~currentprompt
end
setvar $player~startinglocation $player~current_prompt
isnumber $test $amount
if (($test = false) or ($amount = 0))
	setvar $amount 1
end
setvar $bot~startinglocation $player~current_prompt
setvar $bot~validprompts "Command Citadel"
getwordpos " "&$bot~validprompts&" " $bot~pos $player~current_prompt
if ($bot~pos <= 0)
	setvar $switchboard~message "Invalid starting prompt: ["&$player~current_prompt&"]. Valid prompt(s) for this command: ["&$bot~validprompts&"]*"
	gosub :switchboard~switchboard
	return
end
if ($player~startinglocation = "Citadel")
	send "q"
	gosub :planet~getplanetinfo
	send "c"
end
setvar $mines~ready true
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:mines~clear
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
loadvar $game~game_menu_prompt
gosub :player~quikstats
setvar $mines~startinglocation $player~current_prompt
if ((currentsector = $map~stardock) or (currentsector <= 10))
	setvar $switchboard~message "Can't clear fedspace.*"
	gosub :switchboard~switchboard
	return
end
setvar $bot~validprompts "Command Citadel"
gosub :player~checkstartingprompt

setvar $mines~bwarp false
if ($mines~startinglocation = "Citadel")
	send "q"
	gosub :planet~getplanetinfo
	send "c  s*"
	if (($planet~planet_transport >= 1) and ($player~unlimitedgame = true))
		setvar $mines~bwarp true
	end
else
	send "*"
end
getwordpos " "&$bot~user_command_line&" " $mines~pos " bwarp "
if ($mines~pos > 0)
	setvar $mines~bwarp true
end

setvar $mines~beforelimpets $player~limpets
setvar $mines~beforearmids $player~armids
setvar $mines~placedlimpet false
setvar $mines~placedarmid false
waiton "Warps to Sector(s) :"
gosub :refresh_clear_sector_state
if ($mines~sectorclear = true)
	setvar $switchboard~message "Current Sector Already Clear of Enemy Mines!*"
	return
end
if (($player~limpets <= 0) and ($mines~limpetcount > 0) and (($mines~limpetowner <> "belong to your Corp") and ($mines~limpetowner <> "yours")))
	setvar $switchboard~message "Need limpets to clear this sector*"
	return
end
if (($player~armids <= 0) and ($mines~armidcount > 0) and (($mines~armidowner <> "belong to your Corp") and ($mines~armidowner <> "yours")))
	setvar $switchboard~message "Need armids to clear this sector*"
	return
end

gosub :attemptclearingmines
while (($mines~placedlimpet = false) or ($mines~placedarmid = false))
	gosub :attemptclearingmines
end

setsectorparameter $player~current_sector "LIMPSEC" true
setsectorparameter $player~current_sector "MINESEC" true
setvar $switchboard~message "Sector Cleared*"
return

:mines~attemptclearingmines
killtrigger laid_limp
killtrigger laid_armid
setvar $mines~laid_armid $mines~placedarmid
setvar $mines~laid_limp $mines~placedlimpet

if ($mines~bwarp = true)
	setvar $mines~i 0
	setvar $mines~bwarp_move "b"&$player~current_sector&"*"
	setvar $mines~bwarp_clear "y   *  l j"&#8&#8&#8&#8&#8&$planet~planet&"*  j  c  *  "

	if ($mines~reckless <> true)
		while ($mines~i <= 5)
			killtrigger 1
			killtrigger 2
			killtrigger 3
			killtrigger 4
			settexttrigger 1 :no_bwarp_lock "Do you want to make this transport blind?"
			settexttrigger 2 :bwarp_lock "All Systems Ready, shall we engage?"
			settextlinetrigger 3 :bwarpnofuel "This planet does not have enough Fuel Ore to transport you."
			settexttrigger 4 :switchtononbwarp "Your ship was hit by a Photon and has been disabled."
			send $mines~bwarp_move
			pause

			:mines~no_bwarp_lock
			killalltriggers
			send "n "
			setvar $switchboard~message "Fighter is gone from sector!  Stopping, check for enemies!*"
			gosub :switchboard~switchboard
			halt

			:mines~bwarpnofuel
			killalltriggers
			setvar $switchboard~message "Not enough fuel on the planet! Stopping.*"
			gosub :switchboard~switchboard
			halt

			:mines~bwarp_lock
			send $mines~bwarp_clear

			add $mines~i 1
		end
	else
		send $mines~bwarp_move "  " $mines~bwarp_clear $mines~bwarp_move "  " $mines~bwarp_clear $mines~bwarp_move "  " $mines~bwarp_clear $mines~bwarp_move "  " $mines~bwarp_clear $mines~bwarp_move "  " $mines~bwarp_clear
	end

	killtrigger 1
	killtrigger 2
	killtrigger 3
	if ($player~surroundmine <= 0)
		setvar $player~surroundmine 3
	end
	if ($player~surroundlimp <= 0)
		setvar $player~surroundlimp 3
	end
	setvar $mines~grid_armids $player~surroundmine
	setvar $mines~grid_limpets $player~surroundlimp
	if ($mines~grid_armids = 0)
		setvar $mines~_armids_ " "
		setvar $mines~placedarmid true
	else
		setvar $mines~_armids_ " h 1 z "&$mines~grid_armids&"* z c * "
		settextlinetrigger laid_armid :laid_armid "Armid mine(s) on board."
	end
	if ($mines~grid_limpets = 0)
		setvar $mines~_limps_ " "
		setvar $mines~placedlimpet true
	else
		setvar $mines~_limps_ "h 2 z "&$mines~grid_limpets&"* z c * "
		settextlinetrigger laid_limp :laid_limp "Limpet mine(s) on board."
	end

	send "q  q  "&$mines~_armids_&$mines~_limps_&" l "&$planet~planet&"*  c  "

	gosub :player~quikstats
	waiton "Citadel command"

else

	:mines~switchtononbwarp
	setvar $mines~minestodeploy $mines~grid_armids
	setvar $mines~limpstodeploy $mines~grid_limpets
	gosub :player~quikstats
	if ($player~current_prompt = "Qcannon")
		send "s" $mines~percenttoset "* "
		gosub :player~quikstats
	end
	gosub :clear_sector_attemptclearingmines
	gosub :player~quikstats
	setsectorparameter $player~current_sector "MINESEC" true
	setsectorparameter $player~current_sector "LIMPSEC" true
	setvar $mines~laid_armid true
	setvar $mines~laid_limp true
	setvar $mines~placedlimpet true
	setvar $mines~placedarmid true
end
return

:mines~laid_armid
setvar $mines~laid_armid true
setvar $mines~placedarmid true
pause

:mines~laid_limp
setvar $mines~laid_limp true
setvar $mines~placedlimpet true
pause

:mines~refresh_clear_sector_state
setvar $mines~limpetowner sector.limpets.owner[$player~current_sector]
setvar $mines~armidowner sector.mines.owner[$player~current_sector]
setvar $mines~limpetcount sector.limpets.quantity[$player~current_sector]
setvar $mines~armidcount sector.mines.quantity[$player~current_sector]
setvar $mines~sectorclear false
if ((($mines~limpetcount <= 0) or (($mines~limpetowner = "belong to your Corp") or ($mines~limpetowner = "yours"))) and ((($mines~armidcount <= 0) or (($mines~armidowner = "belong to your Corp") or ($mines~armidowner = "yours")))))
	setvar $mines~sectorclear true
end
return

:mines~clear_sector_attemptclearingmines
setvar $mines~i 0
gosub :refresh_clear_sector_state
while (($mines~i < 10) and ($mines~sectorclear <> true))
	gosub :xenter~xenter
	add $mines~i 1
	gosub :refresh_clear_sector_state
end
gosub :player~quikstats

if ($mines~startinglocation = "Citadel")
	send "q qq z n *  "
end
if ($player~surroundmine <= 0)
	setvar $player~surroundmine 3
end
if ($player~surroundlimp <= 0)
	setvar $player~surroundlimp 3
end
if ($mines~minestodeploy <= 0)
	if ($player~armids < $player~surroundmine)
		setvar $mines~minestodeploy $player~armids
	else
		setvar $mines~minestodeploy $player~surroundmine
	end
end
if ($mines~limpstodeploy <= 0)
	if ($player~limpets < $player~surroundlimp)
		setvar $mines~limpstodeploy $player~limpets
	else
		setvar $mines~limpstodeploy $player~surroundlimp
	end
end
setvar $mines~clearmac ""
if (($mines~armidowner <> "belong to your Corp") and ($mines~armidowner <> "yours"))
	setvar $mines~clearmac $mines~clearmac&"h  1  z "&$mines~minestodeploy&"*  z c  *  "
end
if (($mines~limpetowner <> "belong to your Corp") and ($mines~limpetowner <> "yours"))
	setvar $mines~clearmac $mines~clearmac&"h  2  z "&$mines~limpstodeploy&"*  z c  *   "
end
send $mines~clearmac
gosub :player~quikstats
if (($mines~beforelimpets > $player~limpets) or ($mines~limpetowner = "belong to your Corp") or ($mines~limpetowner = "yours"))
	setvar $mines~placedlimpet true
end
if (($mines~beforearmids > $player~armids) or ($mines~armidowner = "belong to your Corp") or ($mines~armidowner = "yours"))
	setvar $mines~placedarmid true
end
if ($mines~startinglocation = "Citadel")
	send "l j"&#8&$planet~planet&"* c  "
end
return

:mines~disr
:mines~disrupt
# $SCANIT = TRUE or FALSE
# $BURSTING = TRUE or FALSE
# $TARGET = TARGET SECTOR

setarray $adj2hit 6 1

if (($target = 0) and ($scanit = 0))
	setvar $idx 1
	while (sector.warps[currentsector][$idx] > 0)
		setvar $adj sector.warps[currentsector][$idx]
		setvar $adj2hit[$idx] $adj
		setvar $adj2hit[$idx][1] 1
		add $idx 1
	end
elseif ($target > 0)
	setvar $adj2hit[1] $target
	setvar $adj2hit[1][1] 1
	setvar $scanit false
end

gosub :player~quikstats

if ($player~mine_disruptors = 0)
	setvar $mines~result "No Disruptors On Board!"
	#gosub :switchboard~switchboard
	return
end

setvar $planet~planet 0
if ($player~current_prompt = "Planet")
	setvar $planet~noheader 1
	gosub :planet~planetinfo
	if ($planet~planet = 0)
		setvar $mines~result "Unable To Obtain Planet Number!"
		#gosub :switchboard~switchboard
		return
	end
	send "  Q  "
elseif ($player~current_prompt = "Citadel")
	send "  Q  "
	setvar $planet~noheader 1
	gosub :planet~planetinfo
	if ($planet~planet = 0)
		setvar $mines~result "Unable To Obtain Planet Number!"
		#gosub :switchboard~switchboard
		return
	end
elseif ($player~current_prompt = "Command")

elseif ($player~current_prompt = "Computer")
	send "  Q  "
	gosub :player~currentprompt
elseif (($player~current_prompt = "StarDock") or ($player~current_prompt = "Stardock"))
	send "Q  "
	gosub :player~currentprompt
elseif ($player~current_prompt = "Port")
	send " 0*  0*  0*  0*  "
	gosub :player~currentprompt
else
	setvar $switchboard~message "Unknown Prompt!*"
	gosub :switchboard~switchboard
	return
end
setvar $start_prompt $player~current_prompt

if ($scanit)
	gosub :do_scan
	setvar $idx 1

	while (sector.warps[currentsector][$idx] > 0)
		setvar $adj sector.warps[currentsector][$idx]
		if (sector.mines.quantity[$adj] <> 0)
			if ((sector.mines.owner[$adj] <> "belong to your Corp") and (sector.mines.owner[$adj] <> "yours"))
				setvar $adj2hit[$idx] $adj
				setvar $adj2hit[$idx][1] sector.mines.quantity[$adj]
			else
				setvar $adj2hit[$idx][1] 0
			end
		end
		add $idx 1
	end
end

gosub :star_burst

if ($planet~planet <> 0)
	if ($start_prompt = "Citadel")
		send " Q Q Q Z N L Z"&#8&$planet~planet&"*  *  J  C  *  * "
	else
		send " Q Q Q Z N L Z"&#8&$planet~planet&"*  *  "
	end
elseif (($start_prompt = "StarDock") or ($start_prompt = "Stardock"))
	settextlinetrigger limpet_found :limpet_found "A port official runs up to you as you dock and informs you that"
	settexttrigger on_dock :on_dock "<StarDock> Where to?"
	send " P  S"
	pause

	:limpet_found
	send " Y "
	pause

	:on_dock
	killalltriggers
elseif ($start_prompt = "Port")
	send " P  T  "
end
setvar $idx 1
setvar $str ""
while ($idx <= 6)
	if ($adj2hit[$idx][1] <> 0)
		setvar $str $str&"        Sector "&$adj2hit[$idx]&", "&$adj2hit[$idx][1]&" Mines Remain*"
	end
	add $idx 1
end

if ($str = "")
	setvar $mines~result "Disr - Disrupted "&$total_mines_poofed&" Mines!"
	return
else
	setvar $mines~result "Disr - Status Report:**"
	setvar $mines~result $mines~result&$str
	setvar $mines~result $mines~result&"        Disrupted: "&$total_mines_poofed&"**"
	return
end
halt

:do_scan
setdelaytrigger whoa_wuzup :whoa_wuzup 4000
settextlinetrigger scan_complete :scan_complete "Warps to Sector(s)"
if ($start_prompt = "Citadel")
	send " S  H"
elseif ($start_prompt = "Planet")
	send " S  H"
elseif (($start_prompt = "StarDock") or ($start_prompt = "Stardock"))
	send "  S  H"
elseif ($start_prompt = "Command")
	send "  S  H"
elseif ($start_prompt = "Port")
	send " S   H"
else
	gosub :player~quikstats
	setvar $switchboard~message "Disr - Unknown Problem Occured, at '"&$player~current_prompt&"' Prompt!*"
	gosub :switchboard~switchboard
	halt
end
pause

:whoa_wuzup
killalltriggers
setvar $switchboard~message "Disr - Unknown Problem Occurred, Attempting to reach Command Prompt!*"
gosub :switchboard~switchboard
send "*  P D 0* 0* 0* * *** * C  Q  Q  Q  Q  Q  Z  2  2  C  Q  *  Z  *  ***  *  *  ^Q"
waitfor ": ENDINTERROG"
gosub :player~quikstats
setvar $switchboard~message "Disr - Unknown Problem Occurred, at '"&$player~current_prompt&"' Prompt!*"
gosub :switchboard~switchboard
return

:scan_complete
killalltriggers
return

:planet_info
settextlinetrigger planet :planet "Planet #"
send "D"
pause

:planet
killtrigger planet
getword currentline $planet 2
striptext $planet "#"
isnumber $tst $planet
if ($tst = 0)
	setvar $planet 0
end
return
gosub :player~quikstats
setvar $scan_type $player~scan_type
setvar $mine_disruptors $player~mine_disruptors
striptext $player~current_prompt "<"
striptext $player~current_prompt ">"
return

:star_burst
setvar $disruptors $player~mine_disruptors
send " C "

:lets_go_again
setvar $idx 1
setvar $adj_hits 0
while ($idx <= 6)
	if ($adj2hit[$idx][1] <> 0)
		settextlinetrigger nomines :nomines "There were no mines in sector "&$adj2hit[$idx]
		settextlinetrigger minesgone :minesgone "of the mines in sector "&$adj2hit[$idx]&"!"
		settextlinetrigger notadj :notadj "That is not an adjacent sector"
		send " W Y "&$adj2hit[$idx]&"*"
		pause

		:nomines
		killalltriggers
		setvar $disruptors ($disruptors - 1)
		setvar $adj2hit[$idx][1] 0
		goto :loop_d_lou

		:notadj
		killalltriggers
		send " Q"
		setvar $adj2hit[$idx][1] 0
		goto :loop_d_lou

		:minesgone
		killalltriggers
		setvar $temp currentline
		getwordpos $temp $pos "remain)"
		setvar $disruptors ($disruptors - 1)
		if ($pos = 0)
			getword $temp $temp 4
			isnumber $tst $temp
			if ($tst)
				setvar $total_mines_poofed ($total_mines_poofed + $temp)
			end
			setvar $adj2hit[$idx][1] 0
		else
			getword $temp $temp2 3
			isnumber $tst $temp2
			if ($tst)
				setvar $total_mines_poofed ($total_mines_poofed + $temp2)
			end
			gettext $temp $temp $adj2hit[$idx]&"! (" " remain)"
			isnumber $tst $temp
			if ($tst = 0)
				setvar $temp 0
			end
			setvar $adj2hit[$idx][1] $temp
			setvar $adj_hits ($adj_hits + 1)
		end

		:loop_d_lou
		if ($disruptors < 1)
			setvar $idx 6
		end
	end
	add $idx 1
end
if (($adj_hits <> 0) and (($disruptors > 0) and ($bursting = 0)))
	goto :lets_go_again
end
send " Q "
return

include "source\include\player"
include "source\include\xenter"
include "source\include\planet"
