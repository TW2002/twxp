# MOVE.TS -- Movement related functions and subroutines.
#
# Exposed routines:
#
# :move~move - Automated adjacent movement.
# :move~moveintosector - Build and send a direct move/deploy macro.
# :move~twarp - Warp to a sector, with checking for range, fighter lock, and fuel.
# :move~findjumpsector - Find a legal adjacent jump sector for red Stardock/fedspace movement.
# :move~test_red_sector - Probe whether a red-adjacent sector can be t-warped to.
#
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~move
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
settextlinetrigger 1 :getsector "Sector  : "
send "d"
pause

:move~getsector
getword currentline $move~cursector 3

setvar $move~history[9] $move~history[8]
setvar $move~history[8] $move~history[7]
setvar $move~history[7] $move~history[6]
setvar $move~history[6] $move~history[5]
setvar $move~history[5] $move~history[4]
setvar $move~history[4] $move~history[3]
setvar $move~history[3] $move~history[2]
setvar $move~history[2] $move~history[1]
setvar $move~history[1] $move~cursector

if ($move~extrasendall = "")
	setvar $move~extrasendall 0
end

if ($move~confirmsector = 1)

	settextlinetrigger tollfigs :tollfigs "You have to destroy the fighters or pay"
	settextlinetrigger figs :figs "You have to destroy the fighters to remain"
	settexttrigger mines :mineprompt "Mined Sector:"
	settexttrigger arrived :arrived "Command [TL="
	pause

	:move~tollfigs
	setvar $move~paidtoll false
	if ($move~attack = 3)

		send "py"
		setvar $move~paidtoll true
	else

		send "a9999*"
	end
	pause

	:move~figs
	send "a9999*"
	pause

	:move~mineprompt
	send "*"
	pause

	:move~arrived
	killtrigger tollfigs
	killtrigger figs
	killtrigger mines
else
	waiton "Command [TL="
end

getsector $move~cursector $move~cursector
setvar $move~confirmsector 0
setvar $move~found 0
setvar $move~noscan 0

gosub $move~checksub

if ($move~found = 1)
	return
end

if (($move~scanholo = 2) and ($move~noscan < 2))
	setvar $move~scannedholo 1
	send "shsd"
	waiton "Relative Density Scan"
	waiton "Command [TL="
elseif ($move~noscan = 0)
	setvar $move~scannedholo 0
	send "sd"
	waiton "Relative Density Scan"
	waiton "Command [TL="
end

getsector $move~cursector $move~cursector

:move~assess
setvar $move~i 1
setvar $move~bestscore 1000
setvar $move~bestwarp 0
setvar $move~bestattack 0
setvar $move~willholo 0

:move~testwarp
if ($move~cursector.warp[$move~i] > 0)
	setvar $move~score 0
	setvar $move~safe 1

	getsector $move~cursector.warp[$move~i] $move~thissector

	if ($move~evasion <> 2)
		if ($move~scannedholo = 0)

			if (($move~thissector.density <> 0) and ($move~thissector.density <> 100))
				if (($move~thissector.density = 5) or ($move~thissector.density = 105))
					setvar $move~safe 2
				else
					setvar $move~safe 0
				end
			end
		end
		if ($move~scannedholo = 1)

			if ($move~thissector.anomoly = "YES")

				setvar $move~safe 0
			end
			if (($move~thissector.figs.owner <> "belong to your Corp") and (($move~thissector.figs.owner <> "yours") and ($move~thissector.figs.quantity > 0)))
				if ($move~evasion = 1)
					setvar $move~safe 0
				else

					setvar $move~safe 2

					if ($move~thissector.figs.quantity > 20)
						setvar $move~safe 0
					end
				end
			end
			if ($move~thissector.density > 0)
				setvar $move~density $move~thissector.density

				if ($move~thissector.figs.quantity > 0)
					setvar $move~x $move~thissector.figs.quantity
					multiply $move~x 5
					subtract $move~density $move~x
				end

				if ((($move~density <> 100) or ($move~thissector.port.exists = 0)) and ($move~density > 0))
					setvar $move~safe 0
				end
			end
		end
	end

	if (($move~safe = 2) and ($move~evasion = 1))
		add $move~score 500
	end

	if ($move~safe = 0)
		add $move~score 500
		setvar $move~willholo 1
	end

	setvar $move~x 1

	:move~checkhistory
	if ($move~x <= 10)
		if ($move~history[$move~x] = $move~cursector.warp[$move~i])
			setvar $move~m 10
			subtract $move~m $move~x
			multiply $move~m 10
			add $move~score $move~m
		end
		add $move~x 1
		goto :move~checkhistory
	end

	if ($move~portpriority = 1)

		if (($move~scannedholo = 1) and ($move~thissector.port.exists = 1)) or (($move~scannedholo = 0) and ($move~thissector.density = 100))
			subtract $move~score 3
		end
	end

	if ($move~dedpriority = 1)

		if ($move~thissector.warps = 1)
			subtract $move~score 3
		end
	end

	getrnd $move~random 1 5
	add $move~score $move~random

	if ($move~score < $move~bestscore)
		setvar $move~bestscore $move~score
		setvar $move~bestwarp $move~cursector.warp[$move~i]
		setvar $move~bestsafe $move~safe
	end

	add $move~i 1
	goto :move~testwarp
end

if ($move~bestscore > 400)
	setvar $move~willholo 1
end

if (($move~willholo = 1) and (($move~scannedholo = 0) and ($move~scanholo = 1)))
	send "sh"
	waitfor "Sector  : "
	waitfor "Command [TL="
	setvar $move~scannedholo 1
	goto :move~assess
end

if (($move~bestscore > 400) and ($move~evasion = 1))
	clientmessage "No safe options!"
	halt
end

setvar $move~figcount sector.figs.quantity[$move~cursector]

if (($move~paidtoll <> true) and ($move~extrasend <> ""))
	if (($move~extrasendall = 1) and (($move~cursector > 10) and ($move~cursector <> stardock)))
		send $move~extrasend
	elseif (($move~figcount <= 0) and (($move~cursector > 10) and (port.class[$move~cursector] < 9)))
		send $move~extrasend
	end
end

if ((sectors > 5000) or ($move~bestwarp < 600))
	setvar $move~warpsuffix "*"
else
	setvar $move~warpsuffix "."
end

if (($move~bestsafe = 2) and ($move~attack = 1)) or ($move~attack = 2)
	send $move~bestwarp $move~warpsuffix "*na9999**"
else
	send $move~bestwarp $move~warpsuffix
	setvar $move~confirmsector 1
end
goto :move~move

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~moveintosector
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $move~result ""
setvar $move~dropfigs true
setvar $move~result $move~result&"m "&$move~moveintosector&"*"
if (($move~moveintosector > 10) and ($move~moveintosector <> $map~stardock))
	if ($player~fighters > $ship~ship_max_attack)
		setvar $move~result $move~result&"za"&$ship~ship_max_attack&"* * "
	else
		setvar $move~result $move~result&"za"&$player~fighters&"* * "
	end
end
if ($player~surroundfigs <= 0)
	setvar $player~surroundfigs 1
end
if (($move~moveintosector > 10) and ($move~moveintosector <> $map~stardock))
	if ($player~surroundfigs > 0)
		setvar $move~result $move~result&"f  z  "&$player~surroundfigs&"* z  c  d  *  "
	end
	if ($player~surroundlimp > 0)
		setvar $move~result $move~result&"  H  2  Z  "&$player~surroundlimp&"*  Z C  *  "
	end
	if ($player~surroundmine > 0)
		setvar $move~result $move~result&"  H  1  Z  "&$player~surroundmine&"*  Z C  *  "
	end
end
send $move~result
setvar $player~current_sector $move~moveintosector
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~mow
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

loadvar $player~fighter_deploy_type
loadvar $player~surroundfigs
loadvar $player~surroundlimp
loadvar $player~surroundmine
setvar $move~success false

gosub :player~quikstats
gosub :ship~getshipstats
setvar $player~startinglocation $player~current_prompt

# uses $bot~startinglocation in mow.ts command

if ($player~startinglocation = "Citadel")
	send "q q "
elseif ($player~startinglocation = "Planet")
	send "q "
elseif ($player~startinglocation = "<StarDock>")
	send "q "
elseif ($player~startinglocation <> "Command")
	setvar $switchboard~message "Bad starting prompt, cannot mow!*"
	gosub :switchboard~switchboard
	return
end

# uses $player~startingsector as starting sector
# uses $player~destination as destination sector
# $figsToDrop
# $doholo
# $backdoormow

if ($ship~ship_max_attack <= 0)
	setvar $ship~ship_max_attack 99991111
end

isnumber $number $move~target
if ($number <> 1)
	setvar $switchboard~message "Sector entered is not a number, cannot mow!*"
	gosub :switchboard~switchboard
	return
elseif (($move~target <= 0) or ($move~target > sectors))
	setvar $switchboard~message "Sector entered is not valid, cannot mow!*"
	gosub :switchboard~switchboard
	return
end

if ($ship~ship_max_attack > $player~fighters)
	setvar $ship~ship_max_attack 9999
end

gosub :player~getcourse
gosub :player~quikstats
setvar $player~starting_point $player~current_sector
setvar $player~destination $move~target
gosub :player~getcourse
setvar $j 2
setvar $macro "q q q * "

while ($j <= $player~courselength)
	subtract $player~turns $tpw
	setvar $macro $macro&"m  "&$player~course[$j]&"*   "
	if (($player~course[$j] > 10) and ($player~course[$j] <> $map~stardock))
		setvar $macro $macro&"za  "&$ship~ship_max_attack&"* *  "
	end
	if (($player~course[$j] > 10) and ($player~course[$j] <> $map~stardock) and ($j > 1))
		if ($player~surroundfigs > 0) and ($player~fighters > 50)
			setvar $macro $macro&"f "&$player~surroundfigs&" * c d "
			setvar $player~target $player~course[$j]
			gosub :player~addfigtodata
		end
		if ($player~surroundmine > 0) and ($player~armids > 0)
			setvar $macro $macro&"  H  1  Z  "&$player~surroundmine&"*  Z C  *  "
			setvar $player~target $player~course[$j]
			#gosub :player~addArmidToData
		end
		if ($player~surroundlimp > 0) and ($player~limpets > 0)
			setvar $macro $macro&"  H  2  Z  "&$player~surroundlimp&"*  Z C  *  "
			setvar $player~target $player~course[$j]
			#gosub :player~addLimpetToData
		end
	end
	if (($called = false) and ($move~saveme = true) and ($j >= ($player~courselength-2)))
		setvar $macro $macro&"'"&$msec&"=saveme*  "
		setvar $move~called true
	end
	add $j 1
end

send $macro

killalltriggers
gosub :player~quikstats

if ($player~current_prompt = "Planet")
	send "m * * * c s* "
end

if (($player~current_prompt = "<StarDock>") or ($player~current_prompt = "<Hardware"))
	setvar $switchboard~message "Safely on Stardock*"
	gosub :switchboard~switchboard
	setvar $move~success true
end

if ($player~current_sector <> $move~target)
	setvar $switchboard~message "Mow did not reach destination!*"
	gosub :switchboard~switchboard
	return
else
	setvar $switchboard~message "Mow completed.*"
	gosub :switchboard~switchboard
	setvar $move~success true
end

return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~twarp
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~twarpsuccess false
setvar $player~original 9999999
setvar $player~target 0

if ($player~current_sector = $player~warpto)
	setvar $player~msg "Already in that sector!"
	goto :move~twarpdone
elseif (($player~warpto <= 0) or ($player~warpto > sectors))
	setvar $player~msg "Destination sector is out of range!"
	goto :move~twarpdone
end
if ($player~twarp_type = "No")
	setvar $player~msg "No T-warp drive on this ship!"
	goto :move~twarpdone
end
if (($player~photons > 0) and ($player~override <> true))
	setvar $switchboard~message "You can't twarp with photons without override!*"
	gosub :switchboard~switchboard
	setvar $player~msg "You can't twarp with photons without override!"
	goto :move~twarpdone
end
loadvar $ship~ship_max_attack
if ($ship~ship_max_attack = 0)
	setvar $ship~ship_max_attack 9999
end
if (($player~fighters > 0) and ($player~fighters < $ship~ship_max_attack))
	setvar $ship~ship_max_attack $player~fighters
end

getdistance $dist $player~current_sector $player~warpto
if ($dist < 2)
	setvar $player~msg "That sector is adjacent, just plain warping."
	goto :move~move
end

setvar $player~weareadjdock false
if (($player~warpto = $map~stardock) or ($player~warpto <= 10))
	setvar $player~target $player~warpto
	setvar $player~a 1
	setvar $player~start_sector $player~current_sector
	while ($player~a <= sector.warpcount[$player~start_sector])
		setvar $player~adj_start sector.warps[$player~start_sector][$player~a]
		if ($player~adj_start = $player~target)
			setvar $player~weareadjdock true
		end
		add $player~a 1
	end
end
setvar $player~red_adj 0
if (($player~alignment < 1000) and ((($player~weareadjdock = false) and (($player~warpto = $map~stardock) or ($player~warpto <= 10)))))
	setvar $player~target $player~warpto
	gosub :move~findjumpsector
	if ($player~red_adj <> 0)
		setvar $player~original $player~warpto
		setvar $player~warpto $player~red_adj
	else
		waitfor "Command [TL="
		setvar $player~msg "Cannot Find Jump Sector Adjacent Sector "&$player~target&"."
		goto :move~twarpdone
	end
end
if ($player~red_adj <> 0)
	send "* mz" $player~warpto "*"
else
	if ($player~ondock = 1)
		#    send "q q * c u y q mz" $PLAYER~WARPTO "*"
		send "q q * mz" $player~warpto "*"
		setvar $player~ondock 0
	elseif ($player~startinglocation = "Citadel")
		#    send "q t*t1* q q * c u y q mz" $PLAYER~WARPTO "*"
		send "q t*t1* q q * mz" $player~warpto "*"
	elseif ($player~startinglocation = "Planet")
		#    send "t*t1* q q * c u y q mz" $PLAYER~WARPTO "*"
		send "t*t1* q q * mz" $player~warpto "*"
	else
		if ($player~fasttwarp)
			send "mz" $player~warpto "*"
		else
			#      send "q q q n n 0 * c u y q mz" $PLAYER~WARPTO "*"
			send "q q q n n 0 * mz" $player~warpto "*"
		end
	end
end

# Added by Shadow 5/13/24
settextlinetrigger twarpstart :twarpstart "That Warp Lane is not adjacent."
pause

:twarpstart
settexttrigger there :move~adj_warp "You are already in that sector!"
settextlinetrigger adj_warp :move~adj_warp "Sector  : "&$player~warpto&" "
settexttrigger locking :move~locking "Do you want to engage the TransWarp drive?"
settexttrigger igd :move~twarpigd "An Interdictor Generator in this sector holds you fast!"
settexttrigger noturns :move~twarpphotoned "Your ship was hit by a Photon and has been disabled"
settexttrigger noroute :move~twarpnoroute "Do you really want to warp there? (Y/N)"
settextlinetrigger no_fuel :move~twarpnofuel "You do not have enough Fuel Ore"
pause

:move~adj_warp
gosub :move~killtwarptriggers
send "z*"
goto :move~twarp_adj

:move~locking
gosub :move~killtwarptriggers
send "y"
settextlinetrigger twarp_lock :move~twarp_lock "TransWarp Locked"
settextlinetrigger no_twrp_lock :move~no_twarp_lock "No locating beam found"
settextlinetrigger twarp_adj :move~twarp_adj "<Set NavPoint>"
settextlinetrigger no_fuel :move~twarpnofuel "You do not have enough Fuel Ore"
pause

:move~twarpnofuel
gosub :move~killtwarptriggers
setvar $player~msg "Not enough fuel for T-warp."
goto :move~twarpdone

:move~twarp_adj
gosub :move~killtwarptriggers
send "za  "&$ship~ship_max_attack&"* * r * "
setvar $player~msg "That sector is next door, just plain warping."
setvar $player~twarpsuccess true
goto :move~twarpdone

:move~twarpnoroute
gosub :move~killtwarptriggers
send "n* z* "
setvar $player~msg "No route available to that sector!"
goto :move~twarpdone

:move~no_twarp_lock
gosub :move~killtwarptriggers
send "n* z* "
setvar $player~target $player~warpto
setsectorparameter $player~target "FIGSEC" false
setvar $player~msg "No fighters at T-warp point!"
goto :move~twarpdone

:move~twarpigd
gosub :move~killtwarptriggers
setvar $player~msg "My ship is being held by Interdictor!"
goto :move~twarpdone

:move~twarpphotoned
gosub :move~killtwarptriggers
setvar $player~msg "I have been photoned and can not T-warp!"
goto :move~twarpdone

:move~twarp_lock
gosub :move~killtwarptriggers
setvar $player~target $player~warpto
setsectorparameter $player~target "FIGSEC" true
send "y   *     "
setvar $player~msg "T-warp completed."
setvar $player~twarpsuccess true

:move~twarpdone
if (($player~twarpsuccess = true) and (($player~original = $map~stardock) or ($player~original <= 10)))
	send "* m "&$player~original&"*  za"&$ship~ship_max_attack&"* * "
end
if ($player~twarpsuccess = true)
	setvar $player~current_sector $player~warpto
end
return

:move~killtwarptriggers
killtrigger there
killtrigger adj_warp
killtrigger locking
killtrigger igd
killtrigger noturns
killtrigger noroute
killtrigger twarp_lock
killtrigger no_twrp_lock
killtrigger twarp_adj
killtrigger no_fuel
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~findjumpsector
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~red_adj 0
if ($player~startinglocation = "Citadel")
	send "qt*t1*q* "
else
	send "qq* "
end

setvar $player~k 1
while (sector.backdoors[$player~target][$player~k] > 0)
	setvar $player~red_adj sector.backdoors[$player~target][$player~k]
	gosub :move~test_red_sector
	if ($player~foundsector = true)
		goto :move~sectorlocked
	end
	add $player~k 1
end

setvar $player~i 1
while (sector.warpsin[$player~target][$player~i] > 0)
	setvar $player~red_adj sector.warpsin[$player~target][$player~i]
	gosub :move~test_red_sector
	if ($player~foundsector = true)
		goto :move~sectorlocked
	end
	add $player~i 1
end

:move~noadjsfound
setvar $player~red_adj 0
return

:move~sectorlocked
if ($player~target = $map~stardock)
	setvar $map~backdoor $player~red_adj
	savevar $map~backdoor
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:move~test_red_sector
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

setvar $player~foundsector false
send "m "&$player~red_adj&"* y"
settexttrigger twarpblind :move~twarpblind "Do you want to make this jump blind? "
settexttrigger twarplocked :move~twarplocked "All Systems Ready, shall we engage? "
settextlinetrigger twarpvoided :move~twarpvoided "Danger Warning Overridden"
settextlinetrigger twarpadj :move~twarpadj "<Set NavPoint>"
pause

:move~twarpadj
gosub :move~killfindjumpsectors
send " * "
return

:move~twarpvoided
gosub :move~killfindjumpsectors
send " N N "
return

:move~twarplocked
gosub :move~killfindjumpsectors
send " * "
setvar $player~foundsector true
return

:move~twarpblind
gosub :move~killfindjumpsectors
send " N "
return

:move~killfindjumpsectors
killtrigger twarpblind
killtrigger twarplocked
killtrigger twarpvoided
killtrigger twarpadj
return

include "source\include\switchboard"
include "source\include\player"
include "source\include\ship"
