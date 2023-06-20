# ======================    START INTERNAL TWARP SUBROUTINE     ==========================
:twarp
	setVar $twarpSuccess FALSE
	setVar $original 9999999
	setVar $target 0
	if ($CURRENT_SECTOR = $warpto)
		setVar $msg "Already in that sector!"
		goto :twarpDone
	elseif (($warpto <= 0) OR ($warpto > SECTORS))
		setVar $msg "Destination sector is out of range!"
		goto :twarpDone
	end
	if ($TWARP_TYPE = "No")
		setVar $msg "No T-warp drive on this ship!"
		goto :twarpDone
	end
	loadvar $ship~SHIP_MAX_ATTACK
	if ($ship~SHIP_MAX_ATTACK = 0)
		setvar $ship~SHIP_MAX_ATTACK 9999
	end
	if (($fighters > 0) and ($fighters < $ship~ship_max_attack))
		setvar $ship~ship_max_attack $fighters
	end
	# check adj's for Dock.. if present, then we don't need a jump sector.
	setVar $WeAreAdjDock FALSE
	if (($warpto = $MAP~stardock) OR ($warpto <= 10))
		setVar $target $warpto
		setVar $a 1
		setVar $START_SECTOR $CURRENT_SECTOR
		while ($a <= SECTOR.WARPCOUNT[$START_SECTOR])
			setVar $adj_start SECTOR.WARPS[$START_SECTOR][$a]
			if ($adj_start = $target)
				setVar $WeAreAdjDock TRUE
			end
			add $a 1
		end
	end
	setVar $RED_adj 0
	if (($ALIGNMENT < 1000) AND ($WeAreAdjDock = FALSE) AND (($warpto = $MAP~stardock) OR ($warpto <= 10)))
		setVar $target $warpto
		gosub :FindJumpSector
		if ($RED_adj <> 0)
			setVar $original $warpto
			setVar $WARPTO $RED_adj
		else
			waitfor "Command [TL="
			setVar $msg "Cannot Find Jump Sector Adjacent Sector " & $target & "."
			goto :twarpDone
		end
	end
	if ($RED_adj <> 0)
		goto :twarp_lock
	end
	if ($startingLocation = "Citadel")
		send "q t*t1* q q * c u y q mz" $warpto "*"
	elseif ($startingLocation = "Planet")
		send "t*t1* q q * c u y q mz" $warpto "*"
	else
		if ($fasttwarp)
			send "mz" $warpto "*"		
		else
			send "q q q n n 0 * c u y q mz" $warpto "*"
		end
	end
	setTextTrigger      there      :adj_warp       "You are already in that sector!"
	setTextLineTrigger  adj_warp   :adj_warp       "Sector  : "&$warpto&" "
	setTextTrigger      locking    :locking        "Do you want to engage the TransWarp drive?"
	setTextTrigger      igd        :twarpIgd       "An Interdictor Generator in this sector holds you fast!"
	setTextTrigger      noturns    :twarpPhotoned  "Your ship was hit by a Photon and has been disabled"
	setTextTrigger      noroute    :twarpNoRoute   "Do you really want to warp there? (Y/N)"
	setTextLineTrigger no_fuel     :twarpNoFuel "You do not have enough Fuel Ore"
	pause
	:adj_warp   
		gosub :killtwarptriggers
		send "z*"
		goto :twarp_adj
	:locking
		gosub :killtwarptriggers
		send "y"
		setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
		setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
		setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
		setTextLineTrigger no_fuel :twarpNoFuel "You do not have enough Fuel Ore"
		pause
	:twarpNoFuel
		gosub :killtwarptriggers
		setVar $msg "Not enough fuel for T-warp."
		goto :twarpDone
	:twarp_adj
		gosub :killtwarptriggers
		send "za  "&$ship~SHIP_MAX_ATTACK&"* * r * "
		setVar $msg "That sector is next door, just plain warping."
		setVar $twarpSuccess TRUE
		goto :twarpDone
	:twarpNoRoute
		gosub :killtwarptriggers
		send "n* z* "
		setVar $msg "No route available to that sector!"
		goto :twarpDone
	:no_twarp_lock
		gosub :killtwarptriggers
		send "n* z* "
		setVar $target $warpto
		setSectorParameter $target "FIGSEC" FALSE
		setVar $msg "No fighters at T-warp point!"
		goto :twarpDone
	:twarpIgd
		gosub :killtwarptriggers
		setVar $msg "My ship is being held by Interdictor!"
		goto :twarpDone
	:twarpPhotoned
		gosub :killtwarptriggers
		setVar $msg "I have been photoned and can not T-warp!"
		goto :twarpDone
	:twarp_lock
		gosub :killtwarptriggers
		setVar $target $warpto
		setSectorParameter $target "FIGSEC" TRUE
		send "y   *     "
		setVar $msg "T-warp completed."
		setVar $twarpSuccess TRUE
	:twarpDone
	if (($twarpSuccess = TRUE) AND (($original = $MAP~stardock) OR ($original <= 10)))
		send "* m "&$original&"*  za"&$ship~SHIP_MAX_ATTACK&"* * "
	end
	if ($twarpSuccess = true)
		setvar $player~current_sector $warpto
	end
return

:killtwarptriggers
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
# ======================    END INTERNAL TWARP SUBROUTINE     ==========================

include "source\bot_includes\player\findjumpsector\player"
