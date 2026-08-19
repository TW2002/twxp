#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~getportinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~quikstats
setvar $sector $player~current_sector
setvar $startinglocation $player~current_prompt
if ($player~current_prompt = "Citadel")
	send "|S*CR"
elseif ($player~current_prompt = "Command")
	send "|CR"
else
	setvar $switchboard~message "Must be at Command or Citadel prompt to get port info.*"
	gosub :switchboard~switchboard
	return
end
if ($port~remoteport > 0)
	send $port~remoteport
	setvar $sector $port~remoteport
	setvar $port~remoteport 0
end
send "*"

setvar $port~remoteport 0
setvar $port~noport 0
setvar $port~foundport false
setvar $port~orebuying 0
setvar $port~orgbuying 0
setvar $port~equbuying 0
setvar $port~oretrading 0
setvar $port~orgtrading 0
setvar $port~equtrading 0
setvar $port~orepercent 0
setvar $port~orgpercent 0
setvar $port~equpercent 0
setvar $port~oremcic 0
setvar $port~orgmcic 0
setvar $port~equmcic 0
setvar $port~orgvalue 0
setvar $port~equvalue 0
setvar $port~portvalue 0

settextlinetrigger foundport :foundport "Items     Status  Trading % of max OnBoard"
settextlinetrigger noport :noport "I have no information about a port in that sector."
settextlinetrigger noport2 :noport "You have never visted sector"
settextlinetrigger noport3 :noport "credits / next hold"
settextlinetrigger noport4 :noport "A  Cargo holds     :"
pause

:noport
killalltriggers
setvar $port~noport 1
setvar $port~foundport false
send "q"
return

:foundport
killalltriggers
setvar $port~foundport true
setvar $port~noport 0
settextlinetrigger portinfo1 :portinfo1 "Fuel Ore "
settextlinetrigger portinfo2 :portinfo2 "Organics"
settextlinetrigger portinfo3 :portinfo3 "Equipment"
settexttrigger gotcr :gotcr "Computer command [TL="
pause

:portinfo1
getword currentline $port~orebuying 3
getword currentline $port~oretrading 4
getword currentline $port~orepercent 5
striptext $port~orepercent "%"
pause

:portinfo2
getword currentline $port~orgbuying 2
getword currentline $port~orgtrading 3
getword currentline $port~orgpercent 4
striptext $port~orgpercent "%"
pause

:portinfo3
getword currentline $port~equbuying 2
getword currentline $port~equtrading 3
getword currentline $port~equpercent 4
striptext $port~equpercent "%"
pause

:gotcr
killalltriggers
send "Q|"
getsectorparameter $sector "OREMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~oremcic $tmp
	striptext $port~oremcic "-"
end
getsectorparameter $sector "ORGMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~orgmcic $tmp
	striptext $port~orgmcic "-"
end
getsectorparameter $sector "EQUMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~equmcic $tmp
	striptext $port~equmcic "-"
end
setvar $orgunitvalue ((24200 + (734 * $port~orgmcic) + (213 * $port~orgpercent) + 500) / 1000)
setvar $equunitvalue ((31300 + (1227 * $port~equmcic) + (554 * $port~equpercent) + 500) / 1000)
if ($port~orgbuying = "Buying") and ($port~orgtrading > 500) and ($port~orgpercent > 50)
	setvar $port~orgvalue ($port~orgtrading * $orgunitvalue)
end
if ($port~equbuying = "Buying") and ($port~equtrading > 500) and ($port~equpercent > 50)
	setvar $port~equvalue ($port~equtrading * $equunitvalue)
end
setvar $port~portvalue ($port~orgvalue + $port~equvalue)
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~getportdbinfo
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $port~noport 0
setvar $port~foundport false
setvar $port~orebuying 0
setvar $port~orgbuying 0
setvar $port~equbuying 0
setvar $port~oretrading 0
setvar $port~orgtrading 0
setvar $port~equtrading 0
setvar $port~orepercent 0
setvar $port~orgpercent 0
setvar $port~equpercent 0
setvar $port~oremcic 0
setvar $port~orgmcic 0
setvar $port~equmcic 0
setvar $port~oretotal false
setvar $port~orgtotal false
setvar $port~equtotal false
setvar $port~orgvalue 0
setvar $port~equvalue 0
setvar $port~portvalue 0
setvar $port~sector $port~target
if ($port~sector <= 0)
	setvar $port~sector $sector
end

if (port.exists[$port~sector] <> true)
	setvar $port~noport 1
	setvar $port~target 0
	return
else
	setvar $port~foundport true
end

if (port.buyfuel[$port~sector] = true)
	setvar $port~orebuying "Buying"
else
	setvar $port~orebuying "Selling"
end
if (port.buyorg[$port~sector] = true)
	setvar $port~orgbuying "Buying"
else
	setvar $port~orgbuying "Selling"
end
if (port.buyequip[$port~sector] = true)
	setvar $port~equbuying "Buying"
else
	setvar $port~equbuying "Selling"
end
setvar $port~oretrading port.fuel[$port~sector]
setvar $port~orgtrading port.org[$port~sector]
setvar $port~equtrading port.equip[$port~sector]
setvar $port~orepercent port.percentfuel[$port~sector]
setvar $port~orgpercent port.percentorg[$port~sector]
setvar $port~equpercent port.percentequip[$port~sector]
striptext $port~orepercent "%"
striptext $port~orgpercent "%"
striptext $port~equpercent "%"

if ($port~orepercent > 0)
	setvar $port~oretotal (($port~oretrading * 100) / $port~orepercent)
end
if ($port~orgpercent > 0)
	setvar $port~orgtotal (($port~orgtrading * 100) / $port~orgpercent)
end
if ($port~equpercent > 0)
	setvar $port~equtotal (($port~equtrading * 100) / $port~equpercent)
end

getsectorparameter $port~sector "OREMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~oremcic $tmp
	striptext $port~oremcic "-"
end
getsectorparameter $port~sector "ORGMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~orgmcic $tmp
	striptext $port~orgmcic "-"
end
getsectorparameter $port~sector "EQUMCIC" $tmp
isnumber $test $tmp
if ($test = true)
	setvar $port~equmcic $tmp
	striptext $port~equmcic "-"
end
setvar $orgunitvalue ((24200 + (734 * $port~orgmcic) + (213 * $port~orgpercent) + 500) / 1000)
setvar $equunitvalue ((31300 + (1227 * $port~equmcic) + (554 * $port~equpercent) + 500) / 1000)
if ($port~orgbuying = "Buying") and ($port~orgtrading > 500) and ($port~orgpercent > 50)
	setvar $port~orgvalue ($port~orgtrading * $orgunitvalue)
end
if ($port~equbuying = "Buying") and ($port~equtrading > 500) and ($port~equpercent > 50)
	setvar $port~equvalue ($port~equtrading * $equunitvalue)
end
setvar $port~portvalue ($port~orgvalue + $port~equvalue)
setvar $port~target 0
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~buildport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
gosub :player~quikstats
setvar $bot~startinglocation $player~current_prompt
setvar $port~startinglocation $player~current_prompt
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt

if ($port~startinglocation = "Command")
	send "** "
	waiton "Warps to Sector(s)"
else
	send "q"
	gosub :planet~getplanetinfo
	send "m*** cs* "
	gosub :player~quikstats
end
if (port.exists[$player~current_sector] = true)
	setvar $switchboard~message "Already a port in sector!*"
	gosub :switchboard~switchboard
	halt
end

if (($bot~user_command_line = "") or ($bot~user_command_line = 0))
	setvar $port~port_name "Mind ()ver Matter"
else
	setvar $port~port_name $bot~user_command_line
end
killalltriggers

if ($port~startinglocation = "Citadel")
	if ($player~credits < 50000)
		send "T F 50000*"
	end
end
gosub :player~quikstats

if ($player~credits < 50000)
	setvar $switchboard~message "Not Enough Credits to Make Ports*"
	gosub :switchboard~switchboard
	halt
end

send "q q q z n * o3y" $port~port_name "*"
killtrigger 1
killtrigger 2
setvar $port~fail false
settextlinetrigger 1 :too_many "Sorry... All of the StarPort Licenses have been granted."
settextlinetrigger 2 :build_success "For building this Starport, you receive"
pause

:port~too_many
setvar $switchboard~message "Too many ports in the universe!*"
gosub :switchboard~switchboard
setvar $port~fail true

:port~build_success
if ($port~fail = false)
	setvar $switchboard~message "Port successfully created!*"
	gosub :switchboard~switchboard
end
killtrigger 1
killtrigger 2
if ($port~startinglocation = "Citadel")
	send "l "&#8&$planet~planet&"*  c  s* "
end

return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~destroyport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :player~quikstats
setvar $bot~startinglocation $player~current_prompt
setvar $port~startinglocation $player~current_prompt
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt

if ($port~startinglocation = "Command")
	send "** "
	waiton "Warps to Sector(s)"
else
	if ($planet~planet = 0)
		send "q"
		gosub :planet~getplanetinfo
		send "m*** cs* "
		gosub :player~quikstats
	end
end
if (port.exists[$player~current_sector] <> true)
	setvar $switchboard~message "No port in sector!*"
	gosub :switchboard~switchboard
	halt
end
gosub :ship~getshipstats

if (port.exists[$player~current_sector] = true)

	:port~keepdestroying
	killtrigger 1
	killtrigger 2
	killtrigger 3
	killtrigger 4
	gosub :player~quikstats
	if ($player~fighters >= $ship~ship_max_attack)
		if ($port~startinglocation = "Citadel")
			send "q q q * *  "
		end
		send "p"
		settexttrigger 1 :portalreadygone "Captain! Are you sure you want to port here?"
		settexttrigger 2 :continuedestroy "<A> Attack this Port"
		pause

		:port~continuedestroy
		killtrigger 1
		killtrigger 2
		killtrigger 3
		killtrigger 4
		send " a y "&$ship~ship_max_attack&"** "
		if ($port~startinglocation = "Citadel")
			send "l "&$planet~planet&"* m * * * q "
		end
		settexttrigger 1 :keepdestroying "Incoming laser barrage from"
		settexttrigger 2 :donedestroying "You destroyed the Star Port!"
		pause

		:port~donedestroying
		:port~portalreadygone
		send "*   "
		if ($port~startinglocation = "Citadel")
			send "l "&$planet~planet&"* c s*  "
		end
		killtrigger 1
		killtrigger 2
		killtrigger 3
		killtrigger 4

		setvar $switchboard~message "Port Destroyed.*"
		gosub :switchboard~switchboard

	else
		setvar $switchboard~message "Not enough fighters.  Better reload before the you blow up this port.*"
		gosub :switchboard~switchboard
		halt
	end
end
halt

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~max
:port~upgradeport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
killalltriggers
gosub :player~quikstats
setvar $bot~startinglocation $player~current_prompt
setvar $port~startinglocation $player~current_prompt
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt

getwordpos " "&$bot~user_command_line&" " $port~pos " f "
if ($port~pos > 0)
	setvar $port~dofuel true
end
getwordpos " "&$bot~user_command_line&" " $port~pos " o "
if ($port~pos > 0)
	setvar $port~doorg true
end
getwordpos " "&$bot~user_command_line&" " $port~pos " e "
if ($port~pos > 0)
	setvar $port~doequ true
end
getwordpos " "&$bot~user_command_line&" " $port~pos " noexp "
if ($port~pos > 0)
	setvar $port~no_exp true
else
	setvar $port~no_exp false
end
if ($port~startinglocation = "Command")
	send "** "
	waiton "Warps to Sector(s)"
else
	send "s* "
	waiton "Warps to Sector(s)"
end
if (port.exists[$player~current_sector] <> true)
	setvar $switchboard~message "No port in sector!*"
	gosub :switchboard~switchboard
	halt
end

if (($port~dofuel <> true) and (($port~doorg <> true) and ($port~doequ <> true)))
	if (port.buyfuel[$player~current_sector] = false)
		setvar $port~dofuel true
	end
	if (port.buyorg[$player~current_sector] = true)
		setvar $port~doorg true
	end
	if (port.buyequip[$player~current_sector] = true)
		setvar $port~doequ true
	end
end

setvar $port~total_creds_needed 0
if (($port~startinglocation = "Planet") or ($port~startinglocation = "Citadel"))
	if ($port~startinglocation = "Citadel")
		send "q"
	end
	gosub :planet~getplanetinfo
	if ($planet~citadel > 0)
		send "cs* "
		waiton "<Enter Citadel>"
		waiton "Warps to Sector(s)"
		if (port.exists[$player~current_sector])
			send "cr*q"
			waiton "Fuel Ore"
			getword currentline $port~portfuel 4
			getword currentline $port~portfuelpercent 5
			striptext $port~portfuelpercent "%"
			waiton "Organics"
			getword currentline $port~portorg 3
			getword currentline $port~portorgpercent 4
			striptext $port~portorgpercent "%"
			waiton "Equipment"
			getword currentline $port~portequip 3
			getword currentline $port~portequippercent 4
			striptext $port~portequippercent "%"
			if ($port~portequippercent <= 0)
				setvar $port~portequippercent 1
			end
			if ($port~portorgpercent <= 0)
				setvar $port~portorgpercent 1
			end
			if ($port~portfuelpercent <= 0)
				setvar $port~portfuelpercent 1
			end
			setvar $port~totalfuelupgradeneeded ((($port~port_max - (($port~portfuel * 100) / $port~portfuelpercent)) / 10) + 1)
			setvar $port~totalorgupgradeneeded ((($port~port_max - (($port~portorg * 100) / $port~portorgpercent)) / 10) + 1)
			setvar $port~totalequipupgradeneeded ((($port~port_max - (($port~portequip * 100) / $port~portequippercent)) / 10) + 1)
			setvar $port~total_creds_needed 0
			if ($port~dofuel = "f")
				add $port~total_creds_needed (300 * $port~totalfuelupgradeneeded)
			elseif ($port~doorg = "o")
				add $port~total_creds_needed (500 * $port~totalorgupgradeneeded)
			else
				add $port~total_creds_needed (1000 * $port~totalequipupgradeneeded)
			end
			if ($port~total_creds_needed > $player~credits)
				setvar $port~cashonhand $planet~citadel_credits
				add $port~cashonhand $player~credits
				if ($port~cashonhand > $port~total_creds_needed)
					if ($port~startinglocation = "Planet")
						send "C"
					end
					send "T T "&$player~credits&"* "
					send "T F "&$port~total_creds_needed&"* "
					setvar $player~credits $port~total_creds_needed
					setvar $switchboard~message "Withdrew funds from the Treasury to complete the port max*"
					gosub :switchboard~switchboard
				end
			end
		end
		send "q q"
	else
		send "q"
	end
end
setvar $port~wrong false
if ($port~dofuel)
	setvar $port~product 1
	setvar $port~noexpamount 9
	gosub :domaxport
end
if ($port~doorg)
	setvar $port~product 2
	setvar $port~noexpamount 4
	gosub :domaxport
end
if ($port~doequ)
	setvar $port~product 3
	setvar $port~noexpamount 3
	gosub :domaxport
end
if (($port~startinglocation = "Citadel") or ($port~startinglocation = "Planet"))
	gosub :planet~landingsub
end
if ($port~wrong)
	setvar $switchboard~message "No valid port here.*"
	gosub :switchboard~switchboard
end
setvar $switchboard~message "Port upgrade complete.*"
gosub :switchboard~switchboard
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~domaxport
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
send "o z" $port~product "z0* "
settextlinetrigger norealporthere :wrongporttype "Do you want to initiate construction on this port?"
settextlinetrigger construction :wrongporttype "Do you want instructions (Y/N)"
waiton ", 0 to quit)"
killalltriggers
getword currentline $port~upgradeamount 9
striptext $port~upgradeamount "("
send "o "
if ($port~no_exp)
	while ($port~upgradeamount > 0)
		if ($port~upgradeamount > 3)
			send $port~product " " $port~noexpamount "* "
			subtract $port~upgradeamount $port~noexpamount
		else
			send $port~product " " $port~upgradeamount "* "
			subtract $port~upgradeamount $port~upgradeamount
		end
	end
	send "* * "
else
	send $port~product " " $port~upgradeamount "* * "
end
send "CR*Q"
waiton "<Computer deactivated>"

:port~donemaxport
killalltriggers
return

:port~wrongporttype
setvar $port~wrong true
goto :donemaxport

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~shipsell
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($player~current_sector <> stardock)
	setvar $switchboard~message "Must be at StarDock, Ported or in Sector!*"
	gosub :switchboard~switchboard
	halt
end

setvar $port~i 0
setvar $port~startinglocation $player~current_prompt
striptext $port~startinglocation ">"
striptext $port~startinglocation "<"
if (($port~startinglocation <> "Command") and (($port~startinglocation <> "StarDock") and ($port~startinglocation <> "Shipyards")))
	setvar $switchboard~message "Ship Sell must be run from Command, Stardock or Shipyard prompt.*"
	gosub :switchboard~switchboard
	halt
end
if ($port~startinglocation = "Command")
	send "p ss ys *"
elseif ($port~startinglocation = "StarDock")
	send "s"
elseif ($port~startinglocation = "Shipyard")
	goto :startshipsell
end

:port~startshipsell
setvar $port~cash $player~credits
setvar $port~inc 0
send "|S|"
waitfor "-------------------------------------------"
settextlinetrigger noship :shipselldone "You do not own any other ships orbiting the Stardock!"
settexttrigger done :done "Choose which ship to sell (Q=Quit)"
settextlinetrigger line :line
pause

:port~line
getword currentline $port~i 1
isnumber $port~tst $port~i
if ($port~tst)
	if ($port~i <> 0)
		add $port~inc 1
		setvar $port~selling[$port~inc] $port~i
	end
end
settextlinetrigger line :line
pause

:port~done
killalltriggers
send "  Q  "
setvar $port~i 1
if ($port~inc <> 0)
	while ($port~i <= $port~inc)
		send " S  "&$port~selling[$port~i]&"* Y  "
		waiton "You have "
		add $port~i 1
	end
end

:port~shipselldone
killalltriggers
if ($port~inc > 0)
	gosub :player~quikstats
	setvar $port~cashamount ($player~credits - $port~cash)
	gosub :commasize
	setvar $switchboard~message "You sold "&$port~inc&" ships. You made $"&$port~cashamount&" credits.*"
	gosub :switchboard~switchboard

elseif ($port~inc < 1)
	setvar $switchboard~message " No Ships to Sell.*"
	gosub :switchboard~switchboard
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:port~commasize
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($port~cashamount < 1000)

elseif ($port~cashamount < 1000000)
	getlength $port~cashamount $port~len
	setvar $port~len ($port~len - 3)
	cuttext $port~cashamount $port~tmp 1 $port~len
	cuttext $port~cashamount $port~tmp1 ($port~len + 1) 999
	setvar $port~tmp $port~tmp&","&$port~tmp1
	setvar $port~cashamount $port~tmp
elseif ($port~cashamount <= 999999999)
	getlength $port~cashamount $port~len
	setvar $port~len ($port~len - 6)
	cuttext $port~cashamount $port~tmp 1 $port~len
	setvar $port~tmp $port~tmp&","
	cuttext $port~cashamount $port~tmp1 ($port~len + 1) 3
	setvar $port~tmp $port~tmp&$port~tmp1&","
	cuttext $port~cashamount $port~tmp1 ($port~len + 4) 999
	setvar $port~tmp $port~tmp&$port~tmp1
	setvar $port~cashamount $port~tmp
end
return

include "source\include\player"
include "source\include\planet"
include "source\include\ship"
include "source\include\switchboard"

halt
