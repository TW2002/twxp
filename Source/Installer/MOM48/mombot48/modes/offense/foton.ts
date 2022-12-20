	logging off
	gosub :BOT~loadVars
	loadVar $game~MULTIPLE_PHOTONS


	setVar $BOT~help[1]  $BOT~tab&"- foton [on|off|sec] {a|d|p|s|d|t} {towship} {sector} "
	setVar $BOT~help[2]  $BOT~tab&"                     {return} {den40}"
	setVar $BOT~help[3]  $BOT~tab&"  Multiple use photon script.  "
	setVar $BOT~help[4]  $BOT~tab&"  "
	setVar $BOT~help[5]  $BOT~tab&"  Options: "
	setVar $BOT~help[6]  $BOT~tab&"    {a}djacent - photons adjacent sector when"
	setVar $BOT~help[7]  $BOT~tab&"                 fig/limp/armid hit"
	setVar $BOT~help[8]  $BOT~tab&"    {d}ensity  - constant density scan, photons"
	setVar $BOT~help[9]  $BOT~tab&"                 on density change"
	setVar $BOT~help[10] $BOT~tab&"    {p}lanet   - standard planet warp photon script"
	setVar $BOT~help[11] $BOT~tab&"    {s}urround - attempts to foton retreat sector"
	setVar $BOT~help[12] $BOT~tab&"    d{o}ck     - sits on dock and attempts to foton"
	setVar $BOT~help[13] $BOT~tab&"                 on adjacent fig hit"
	setVar $BOT~help[14] $BOT~tab&"    {t}ow      - twarp tow a photon in a second ship"
	setVar $BOT~help[15] $BOT~tab&"       "
	setVar $BOT~help[16] $BOT~tab&"    {towship}  - Ship in sector with photon you will tow"
	setVar $BOT~help[17] $BOT~tab&"    {sector}   - Apply the mode from/to that sector"
	setVar $BOT~help[18] $BOT~tab&"    {return}   - Returns Planet Home after Pwarp"
	setVar $BOT~help[19] $BOT~tab&"     {den40}   - Only shoots on 40 to 499 Density Change"
	setVar $BOT~help[20] $BOT~tab&"      {holo}   - does holo command after firing"
	setVar $BOT~help[21] $BOT~tab&"   {dockexp}   - Will pop planet to get to 1k"
	setVar $BOT~help[22] $BOT~tab&"                 for dock photon"
	setVar $BOT~help[23] $BOT~tab&"      {self}   - Will pwarp out, photon your current "
	setVar $BOT~help[24] $BOT~tab&"                 sector, and pwarp back in. "
	setVar $BOT~help[25] $BOT~tab&"      {cont}   - Will continue shooting if in density mode."
	setVar $BOT~help[26] $BOT~tab&" {delwalk:n}   - Delay walk will delay the shot for this many MS."
	setVar $BOT~help[27] $BOT~tab&"                 Then add another 100ms to subsequent hit."
	setVar $BOT~help[28] $BOT~tab&"      "
	setVar $BOT~help[29] $BOT~tab&"       Authors: Mind Dagger and The Bounty Hunter "
	gosub :bot~helpfile

	setVar $BOT~script_title "Fast Foton"
	gosub :BOT~banner


	getSectorParameter SECTORS "FIGSEC" $isFigged
	if ($isFigged = "")
		send "'{" $bot~bot_name "} - It appears no grid data is available.  Run a fighter grid checker that uses the sector parameter FIGSEC. (Try figs command)*"
		halt
	end

getWord $bot~user_command_line $bot~parm1 1
getWord $bot~user_command_line $bot~parm2 2
getWord $bot~user_command_line $bot~parm3 3
getWord $bot~user_command_line $bot~parm4 4
getWord $bot~user_command_line $bot~parm5 5
getWord $bot~user_command_line $bot~parm6 6
getWord $bot~user_command_line $bot~parm7 7
getWord $bot~user_command_line $bot~parm8 8
getWordPos " "&$bot~user_command_line&" " $pos " return "
if ($pos > 0)
	setVar $auto_return TRUE
else
	setVar $auto_return FALSE
end

getWordPos " "&$bot~user_command_line&" " $pos " den40 "
if ($pos > 0)
	setVar $shipchange 1
else
	setVar $shipchange 0
end

getWordPos " "&$bot~user_command_line&" " $pos " cont "
if ($pos > 0)
	setVar $dencontinue 1
else
	setVar $dencontinue 0
end

getWordPos " "&$bot~user_command_line&" " $pos " holo "
if ($pos > 0)
	setVar $holo 1
else
	setVar $holo 0
end

getWordPos " "&$bot~user_command_line&" " $pos " dockexp "
if ($pos > 0)
	setVar $dockexp 1
else
	setVar $dockexp 0
end

getWordPos " "&$bot~user_command_line&" " $pos " self "
if ($pos > 0)
	setVar $self 1
else
	setVar $self 0
end

setVar $delaywalk 0
getWordPos $bot~user_command_line $pos "delwalk:"
if ($pos > 0)
	
	setVar $cline $bot~user_command_line & " "
	getText $cline $delaywalk "delwalk:" " "
else
	setVar $delaywalk 0
end

# ============================== START FOTON CHECK SUB ==============================
:foton_check
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	isNumber $isnum $bot~parm1

	if ($bot~parm2 = "d")
	        goto :start_dtorp
	elseif ($bot~parm2 = "a")
	        goto :adjphoton
	elseif ($bot~parm2 = "s")
	        goto :surround_foton
	elseif ($bot~parm2 = "r")
	        goto :trap_foton
	elseif ($bot~parm2 = "o")
	        goto :dockPhoton
	elseif ($bot~parm2 = "t")
			goto :photonTow
	elseif (($bot~parm2 = "p") or ($bot~parm2 = ""))
	        goto :foton
	elseif (($isnum = 1) or ($self = true))
		if ($self)
			setvar $bot~parm1 $player~current_sector
			setvar $auto_return true
		end
		if (($bot~parm1 > 10) and ($bot~parm1 <= SECTORS) and ($bot~parm1 <> STARDOCK))
			gosub :player~quikstats
			goto :photonSector
		elseif (($bot~parm1 < 10) or ($bot~parm1 >= SECTORS) or ($bot~parm1 = STARDOCK))
			send "'{" $bot~bot_name "} - Not a Valid FOTON Sector*"
			halt
		end
	else
		send "'{" $bot~bot_name "} - Please use foton [on/off/sector] {a/d/p/s} {return} format*"
		halt
	end
# ============================== END FOTON CHECK SUB ==============================


:planetPhotonTriggers

	killalltriggers
	setTextLineTrigger 1 :foton_pwplimp "Limpet mine in "
	setTextLineTrigger 2 :foton_pwparmid "Your mines in "
	setTextLineTrigger 3 :foton_fighit "Deployed Fighters Report Sector "
	pause

:towPhotonTriggers

	killalltriggers
	setTextLineTrigger 1 :tow_pwplimp "Limpet mine in "
	setTextLineTrigger 2 :tow_pwparmid "Your mines in "
	setTextLineTrigger 3 :tow_fighit "Deployed Fighters Report Sector "
	pause

:surroundPhotonTriggers

	killalltriggers
	#setTextLineTrigger 1 :foton_pwplimp "Limpet mine in "
	#setTextLineTrigger 2 :foton_pwparmid "Your mines in "
	setTextLineTrigger 3 :surround_foton_fighit "Deployed Fighters Report Sector "
	pause

:trapPhotonTriggers

	killalltriggers
	#setTextLineTrigger 1 :foton_pwplimp "Limpet mine in "
	#setTextLineTrigger 2 :foton_pwparmid "Your mines in "
	setTextLineTrigger 3 :trap_foton_fighit "Deployed Fighters Report Sector "
	pause



:setAdjacentTriggers
	killalltriggers
	setVar $warpies 1
	setDelayTrigger 1 :load_photon 300000
	While ($warpies <= $pwarps)
		setTextTrigger phot&$warpies :shoot&$warpies "Deployed Fighters Report Sector "&SECTOR.WARPS[$psec][$warpies]&":"
		setTextTrigger limp&$warpies :shoot&$warpies "Limpet mine in "&SECTOR.WARPS[$psec][$warpies]&" activated"
		add $warpies 1
	end
	pause

:setDockTriggers
	killalltriggers
	setVar $warpies 1
	
	While ($warpies <= $pwarps)
		setTextTrigger dphot&$warpies :dshoot&$warpies "Deployed Fighters Report Sector "&SECTOR.WARPS[$psec][$warpies]&":"
		setTextTrigger dlimp&$warpies :dshoot&$warpies "Limpet mine in "&SECTOR.WARPS[$psec][$warpies]&" activated"
		add $warpies 1
	end
	pause


# ============================== DOCK PHOTON ==============================================
:dockPhoton


	setVar $startingLocation $player~current_prompt
	
	if ($startingLocation <> "<StarDock>") and ($startingLocation <> "Command") and ($startingLocation <> "<Hardware")
		send "'{" $bot~bot_name "} - Must start at Command, Stardock or Hardware*"
		halt
	end
	if ($bot~parm1 <> "on") and ($bot~parm1 <> "off") and ($bot~parm1 <> "reset")
		send "'{" $bot~bot_name "} - Please use - foton [on/off/reset] format*"
		halt
	end
	if ($bot~parm1 = "on")
		setVar $cooloff ($GAME~PHOTON_DURATION * 1000)
		
		if ($player~photons = 0)
			send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
			setVar $mode "General"
			halt
		end
		if ($player~TURNS < 3)
			send "'{" $bot~bot_name "} - Need a couple of turns..*"
			setVar $mode "General"
			halt
			
		end
		if ($dockexp = 1)

			if (($player~experience < 976) and ($player~alignment >= 0))
				if ($player~fedspacePhotons <> TRUE)
					send "'{" $bot~bot_name "} - Need 976 exp + for this mode.*"
					setVar $mode "General"
					halt
				end
			end

			if ($player~GENESIS < 1)
				send "'{" $bot~bot_name "} - Please buy one genesis torp*"
				setVar $mode "General"
				halt
			end
			setVar $makeMacro " u y n . * z c * "
		else
			if (($player~experience < 1000) and ($player~alignment >= 0))
				if ($player~fedspacePhotons <> TRUE)
					send "'{" $bot~bot_name "} - Fed safe people can't shoot photons from fed..*"
					setVar $mode "General"
					halt
				end
			end
			setVar $makeMacro ""
		end
		send "'{" $bot~bot_name "} - Dock Foton Running - Shooting from the dock at adjacent sectors!*"
		setVar $psec $player~current_sector
		if ($startingLocation = "Command")
			send "psh"
		elseif ($startingLocation = "<StarDock>")
			send "h"
		end 
		setVar $pwarps SECTOR.WARPCOUNT[$psec]
		goto :setDockTriggers
	else
		send "'{" $bot~bot_name "} - Please use - foton [on/off/reset] {a/d/s/p/o} format*"
		halt
	end

:dshoot1
	killalltriggers
	echo "#" "Photon Missile launched into sector "&SECTOR.WARPS[$psec][1] "#"
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][1] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot1 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][1]
	setTextTrigger dmissed :dmissed1 "<Computer deactivated>"
	pause

:dmissed1
	killtrigger dshot
	goto :setDockTriggers

:dshot1
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][1] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers

:dshoot2
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][2] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot2 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][2]
	setTextTrigger dmissed :dmissed2 "<Computer deactivated>"
	pause

:dmissed2
	killtrigger dshot
	goto :setDockTriggers

:dshot2
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][2] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers

:dshoot3
	
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][3] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot3 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][3]
	setTextTrigger dmissed :dmissed3 "<Computer deactivated>"
	pause

:dmissed3
	killtrigger dshot
	goto :setDockTriggers

:dshot3
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][3] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers

:dshoot4
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][4] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot4 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][4]
	setTextTrigger dmissed :dmissed4 "<Computer deactivated>"
	pause

:dmissed4
	killtrigger dshot
	goto :setDockTriggers

:dshot4
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][4] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers
:dshoot5
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][5] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot5 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][5]
	setTextTrigger dmissed :dmissed5 "<Computer deactivated>"
	pause

:dmissed5
	killtrigger dshot
	goto :setDockTriggers

:dshot5
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][5] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers

:dshoot6
	send "q q " $makeMacro "  c  p  y  " SECTOR.WARPS[$psec][6] "**   * q p sh"
	setVar $makeMacro ""
	killtrigger dshot
	killtrigger dmissed
	setTextTrigger dshot :dshot6 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][6]
	setTextTrigger dmissed :dmissed6 "<Computer deactivated>"
	pause

:dmissed6
	killtrigger dshot
	goto :setDockTriggers

:dshot6
	killtrigger dmissed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Photon")
		goto :setDockTriggers
	end
	send "'{" $bot~bot_name "} - Dock Foton Fired -> Sector " SECTOR.WARPS[$psec][6] "*"
	
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setDockTriggers $cooloff
	pause
	goto :setDockTriggers

# ============================== ADJACENT PHOTON (ADJPHOTON) ==============================
:adjphoton

	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if ($startingLocation <> "Citadel") and ($startingLocation <> "Command")
		send "'{" $bot~bot_name "} - Must start at Citadel or Command prompt*"
		halt
	end
	if ($bot~parm1 <> "on") and ($bot~parm1 <> "off") and ($bot~parm1 <> "reset")
		send "'{" $bot~bot_name "} - Please use - foton [on/off/reset] format*"
		halt
	end
	if ($bot~parm1 = "on")
		goto :load_photon
	elseif ($bot~parm1 = "reset")
		send "'{" $bot~bot_name "} - Adjacent Foton - Resetting Sector*"
		goto :load_photon
	else
		send "'{" $bot~bot_name "} - Please use - foton [on/off/reset] {a/d/s/p} format*"
		halt
	end



:load_photon
	if ($startingLocation <> "Citadel") and ($startingLocation <> "Command")
		send "'{" $bot~bot_name "} - Must start at Citadel or Command prompt*"
		halt
	end
	if ($startingLocation = "Citadel")
		send "s*"
		waitFor "<Scan Sector>"
		waitFor "(?="
	elseif ($startingLocation = "Command")
		send "*zn"
		waitFor "<Re-Display>"
		waitFor "Command [TL"
	end
	gosub :player~quikstats
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	if ($player~current_sector <> $psec) and ($psec <> 0)
		send "'{" $bot~bot_name "} - Resetting Adjacent Photon to Sector " $player~current_sector "*"
		setVar $psec $player~current_sector
	end
	setVar $psec $player~current_sector
		send "'{" $bot~bot_name "} - Adjacent Foton Running in Sector " $psec " - " $player~photons " Photon(s) Aboard!*"
	setVar $pwarps SECTOR.WARPCOUNT[$psec]
	goto :setAdjacentTriggers

:shoot1
	send "c  p  y  " SECTOR.WARPS[$psec][1] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot1 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][1]
	setTextTrigger missed :missed1 "<Computer deactivated>"
	pause

:missed1
	killtrigger shot
	goto :setAdjacentTriggers

:shot1
	killtrigger missed
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][1] "*"
	if ($holo)
		gosub :doholo
	end
	subtract $player~photons 1
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	setDelayTrigger cool :setAdjacentTriggers 500
	pause
	goto :setAdjacentTriggers

:shoot2
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "c  p  y  " SECTOR.WARPS[$psec][2] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot2 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][2]
	setTextTrigger missed :missed2 "<Computer deactivated>"
	pause

:missed2
	killtrigger shot
	goto :setAdjacentTriggers

:shot2
	killtrigger missed
	send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][2] "*"
	subtract $player~photons 1
	if ($holo)
		gosub :doholo
	end
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		halt
	end
	goto :setAdjacentTriggers

:shoot3
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "c  p  y  " SECTOR.WARPS[$psec][3] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot3 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][3]
	setTextTrigger missed :missed3 "<Computer deactivated>"
	pause

:missed3
	killtrigger shot
	goto :setAdjacentTriggers

:shot3
	killtrigger missed
        send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][3] "*"
	subtract $player~photons 1
	if ($holo)
		gosub :doholo
	end
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		halt
	end
	goto :setAdjacentTriggers

:shoot4
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "c  p  y  " SECTOR.WARPS[$psec][4] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot4 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][4]
	setTextTrigger missed :missed4 "<Computer deactivated>"
	pause

:missed4
	killtrigger shot
	goto :setAdjacentTriggers

:shot4
	killtrigger missed
	send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][4] "*"
	subtract $player~photons 1
	if ($holo)
		gosub :doholo
	end
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		halt
	end
	goto :setAdjacentTriggers
	
:shoot5
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "c  p  y  " SECTOR.WARPS[$psec][5] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot5 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][5]
	setTextTrigger missed :missed5 "<Computer deactivated>"
	pause

:missed5
	killtrigger shot
	goto :setAdjacentTriggers

:shot5
	killtrigger missed
	send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][5] "*"
	subtract $player~photons 1
	if ($holo)
		gosub :doholo
	end
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		halt
	end
	goto :setAdjacentTriggers

:shoot6
	getWord CURRENTLINE $spoof 1
	if ($spoof <> "Deployed") and ($spoof <> "Limpet")
		goto :setAdjacentTriggers
	end
	send "c  p  y  " SECTOR.WARPS[$psec][6] "**  q*"
	killtrigger shot
	killtrigger missed
	setTextTrigger shot :shot6 "Photon Missile launched into sector "&SECTOR.WARPS[$psec][6]
	setTextTrigger missed :missed6 "<Computer deactivated>"
	pause

:missed6
	killtrigger shot
	goto :setAdjacentTriggers

:shot6
	killtrigger missed
	send "'{" $bot~bot_name "} - Adjacent Foton Fired -> Sector " SECTOR.WARPS[$psec][6] "*"
	subtract $player~photons 1
	if ($holo)
		gosub :doholo
	end
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Adjacent Foton Deactivated*"
		halt
	end
	goto :setAdjacentTriggers
# ============================== END ADJ PHOTON (PHOTON) SUB ==============================


# ======================     START DENSITY PHOTON (DTORP) SUBROUTINE    ==========================
:start_dtorp
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	setArray $adj 7
	setArray $dens 7
	setArray $adjsec 7
	setArray $density 7
	if ($startingLocation = "Command")
		goto :checkndtorps
	elseif ($startingLocation = "Planet")
		gosub :planet~getplanetinfo
		send "q"
		goto :checkndtorps
	elseif ($startingLocation = "Citadel")
		send "q"
		gosub :planet~getplanetinfo
		send "q"
		goto :checkndtorps
	elseif ($startingLocation = "<StarDock>")
		send "q"
		goto :checkndtorps
	else
		send "'{" $bot~bot_name "} - Must be run from Command, Planet, Citadel, or Stardock Prompt.*"
		halt
	end

:checkndtorps
	send "cp*q"
	waitFor "Command [TL="
	setTextTrigger anyphots :anyphots "Photon Missiles left."
	setTextTrigger hmmtorps :hmmtorps "You do not have any Photon Missiles!"
	setTextTrigger fed :feds "The Feds do not permit protected"
	pause

:anyphots
	killTrigger fed
	killTrigger hmmtorps
	gosub :player~turnoffansi
	goto :check_dens

:feds
	send "'{" $bot~bot_name "} - Can't launch from fedspace*"
	halt

:hmmtorps
	send "'{" $bot~bot_name "} - No Fotons*"
	halt

:check_dens
	setVar $mm 0
	setVar $i 0
	send "sz*"
	waiton "Relative Density Scan"

:dtorp_Start
	killTrigger alldone
	setTextLineTrigger getSec :getSec "Sector"
	setTextTrigger allDone :allDone "Command [TL="
	pause

:getSec
	add $i 1
	getText CURRENTLINE $Adj[$i] "Sector" "==>"
	stripText $adj[$i] "("
	stripText $adj[$i] ")"
	stripText $adj[$i] " "
	getText CURRENTLINE $Dens[$i] "==>" "Warps :"
	stripText $dens[$i] ","
	stripText $dens[$i] " "
	goto :dtorp_Start

:allDone
	killTrigger getSec
	gosub :firechk

:letslook
	setVar $w 0

:sublooky
	add $w 1
	if ($w > $i)
		goto :alldone
	elseif ($density[$w] <> $dens[$w])
		if ($shipchange = 1)
			setVar $diff ($density[$w] - $dens[$w])
			if (($diff > 39) and ($diff < 495))
				send "c p y " $adj[$w] "*  Q  "
				send "'{" $bot~bot_name "} - Foton Missle Fired into sector => " $adj[$w] "*"
				subtract $player~PHOTONS 1
				if ($dencontinue = 1) and ($player~PHOTONS > 0)
					send "'{" $bot~bot_name "} - " $player~PHOTONS " left continuing scanning..*"
					setVar $dens[$w] $density[$w]
					goto :sublooky
				else
					gosub :player~turnonansi
					goto :dtorp_end
				end
			else
				goto :sublooky
			end

		else
			send "c p y " $adj[$w] "*  Q  "
			send "'{" $bot~bot_name "} - Foton Missle Fired into sector => " $adj[$w] "*"
			subtract $player~PHOTONS 1
			if ($dencontinue = 1) and ($player~PHOTONS > 0)
				send "'{" $bot~bot_name "} - " $player~PHOTONS " left continuing scanning..*"
				setVar $dens[$w] $density[$w]
				goto :sublooky
			else
				gosub :player~turnonansi
				goto :dtorp_end
			end
		end
	else
		goto :sublooky
	end

:firechk
	add $mm 1
	if ($mm = 150)
		send "'{" $bot~bot_name "} - WARNING  Density Foton Running at My TA!!!*"
		setVar $mm 0
	end
	setVar $y 0
	send "sz*"
	waiton "Relative Density Scan"

:looky
	killtrigger manual_stop
	killtrigger dtop_dtorp
	killtrigger getsec
	killtrigger alldone
	setTextOutTrigger manual_stop :manual_stop "-"
	setTextLineTrigger dtop_dtorp :manual_stop $bot~bot_name & " foton off"
	setTextLineTrigger getSec :looksec "Sector"
	setTextTrigger allDone :donelook "Command [TL="
	pause

:looksec
	add $y 1
	getText CURRENTLINE $Adjsec[$y] "Sector" "==>"
	stripText $adjsec[$y] "("
	stripText $adjsec[$y] ")"
	stripText $adjsec[$y] " "
	getText CURRENTLINE $Density[$y] "==>" "Warps :"
	stripText $density[$y] ","
	stripText $density[$y] " "
	killtrigger dtop_dtorp
	killtrigger manual_Stop
	killtrigger alldone
	goto :looky

:donelook
	killtrigger getSec
	return

:manual_stop
	killtrigger manual_stop
	killtrigger dtop_dtorp
	killtrigger getSec
	killtrigger allDone
	send "'{" $bot~bot_name "} - Density Foton Stoped . . *"
	gosub :player~turnonansi

:dtorp_end
	if (($startingLocation = "Planet") OR ($startingLocation = "Citadel"))
		gosub :planet~landingsub
		halt
	else
		halt
	end
# ======================     END DENSITY PHOTON (DTORP) SUBROUTINE    ==========================


:foton
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if ($startingLocation = "Citadel")
		goto :foton_start
	else
		send "'{" $bot~bot_name "} - Must Start at Citadel.*"
		halt
	end

:foton_start
	setVar $home_sector2 $player~current_sector
	if ($player~photons <= 0)
		goto :foton_out_of_fotons
	end
	send "q"

	gosub :planet~getplanetinfo
	send "c"

:foton_get_figs
	send "*"
	waitFor "Citadel command (?="


:foton_go
	if ($auto_return)
		send "'{" $bot~bot_name "} - Foton Running From Planet " & $planet~planet & " w/ Return Home enabled. " & $player~photons &" Photons armed and ready.*"
	else
		send "'{" $bot~bot_name "} - Foton Running From Planet " & $planet~planet & ", " & $player~photons &" Photons armed and ready.*"
	end
	goto :planetPhotonTriggers




:foton_pwplimp
	gosub :foton_limphit
	goto :foton_pwp_go

:foton_pwparmid
	gosub :foton_minehit
	goto :foton_pwp_go

:foton_pwpfig
	#gosub :foton_fighit

:foton_pwp_go
	killalltriggers
	gosub :foton_get_adj
	if ($delaywalk > 0)
		setDelayTrigger delaywalkTrigger :delaywalkTrigger $delaywalk
		pause
			:delaywalkTrigger
			add $delaywalk 100
	end
	send "p" $adjsec "*y c p y " $sector "**q"
	setTextLineTrigger	wrong	:foton_wrong	"That is not an adjacent sector"
	setTextLineTrigger	gotem	:foton_gotem	"Photon Missile launched into sector"
	setTextLineTrigger	wrong2	:foton_wrong2	"The Feds do not permit Photon Torpedos"
	pause

:foton_wrong2
	killtrigger gotem
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :planetPhotonTriggers

:foton_wrong
	killtrigger gotem
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	setSectorParameter $adjsec "FIGSEC" FALSE
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :planetPhotonTriggers

:foton_gotem
	killtrigger wrong
	send "'{" $bot~bot_name "} - Foton Fired - Sector => " $sector "!*"
	if ($holo)
		gosub :doholo
	end
	if ($auto_return)
		gosub :foton_go_home
	end
	gosub :player~quikstats
	if ($player~photons = 0)
		goto :foton_out_of_fotons
	end
	if ($game~multiple_photons <> TRUE)
		setTextLineTrigger waitingforcooldown :exitcooldown "Photon Wave Duration has ended in sector "&$sector
		pause
		:exitcooldown
	end
	goto :planetPhotonTriggers

:foton_go_home
	send "p" $home_sector2 "*y"
	SetTextLineTrigger homelock :foton_home_lock "Locating beam pinpointed"
	setTextLineTrigger nohomelock :foton_no_home_lock "Your own fighters must be"
	setTextLineTrigger home_now :foton_home_lock "You are already in that sector!"
	pause

	:foton_no_home_lock
		killtrigger homelock
		killtrigger nohomelock
		killtrigger home_now
		send "'{" $bot~bot_name "} - PWarp Lock To Home Failed.*"

        :foton_home_lock
		killtrigger homelock
		killtrigger nohomelock
		killtrigger home_now
	return
:foton_get_adj
	setVar $adjsec 0
	setVar $i 1
	while (SECTOR.WARPS[$Sector][$i] > 0)
		setVar $tempAdj SECTOR.WARPS[$Sector][$i]
                getSectorParameter $tempAdj "FIGSEC" $isFigged
                if ($isFigged)
			setVar $adjsec $tempAdj
			return
		end
		add $i 1
	end
	if ($adjsec <= 0)
		echo ANSI_12 "No Adjacent fig found*" ANSI_7
		goto :planetPhotonTriggers
	end
	return

:foton_limphit
	cutText CURRENTLINE&"      " $ck 1 6
	if ($ck <> "Limpet")
		goto :planetPhotonTriggers
	end
	getWord CURRENTLINE $sector 4
	return

:foton_minehit
	cutText CURRENTLINE&"    " $ck 1 4
	if ($ck <> "Your")
		goto :planetPhotonTriggers
	end

	# Check for alien hits

	getText CURRENTANSILINE $alien_check "damage to" ""
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :planetPhotonTriggers
	end

	getWord CURRENTLINE $sector 4
	return

:foton_fighit
	# Check for spoofs
	
	getWord CURRENTLINE $spoof_test 1
	getWord CURRENTANSILINE $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
	     goto :planetPhotonTriggers
	end

	# Torp only on sector entry
	getWordPos CURRENTLINE $pos "entered sector."
	if ($pos < 1)
		goto :planetPhotonTriggers
	end

	# Check for alien hits
	getText CURRENTANSILINE $alien_check ": " "'s"
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :planetPhotonTriggers
	end

	# Get the sector number
	getWord CURRENTLINE $sector 5
	stripText $sector ":"
	isNumber $result $sector
	if ($result < 1)
		goto :planetPhotonTriggers
	end
	if (($sector > SECTORS) OR ($sector <= 10))
		 goto :planetPhotonTriggers
	end
	goto :foton_pwp_go
	#getText CURRENTANSILINE $sector #27&"[K"&#27&"[1A"&#27&"[1;33mDeployed Fighters "&#27&"[0;32mReport Sector "&#27&"[1;33m" #27&"[0;32m: "&#27&"[1;36m"
	#if ((($radio = "R") OR ($radio = "F") OR ($sector = "") OR ($sector = "0")))
	#	goto :planetPhotonTriggers
	#end
	#getText CURRENTANSILINE $alien_check $START_FIG_HIT_OWNER $END_FIG_HIT_OWNER
	#getWordPos CURRENTLINE $pos $START_FIG_HIT_OWNER
	#getWordPos $alien_check $apos $ALIEN_ANSI
	#if (($apos > 0) OR ($pos <= 0))
	#	goto :planetPhotonTriggers
	#end
#return

:foton_out_of_fotons
	send "'{" $bot~bot_name "} - No photon missles, Foton mode shutting down.*"
	halt

:surround_foton
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if ($startingLocation = "Citadel")
		goto :surround_foton_start
	else
		send "'{" $bot~bot_name "} - Must Start at Citadel.*"
		halt
	end

:surround_foton_start
	setVar $home_sector2 $player~current_sector
	if ($player~photons <= 0)
		goto :foton_out_of_fotons
	end
	send "q"

	gosub :planet~getplanetinfo
	send "c"

:surround_foton_get_figs
	send "*"
	waitFor "Citadel command (?="


:surround_foton_go
	if ($auto_return)
		send "'{" $bot~bot_name "} - Surround Foton Running From Planet " & $planet~planet & " w/ Return Home enabled. " & $player~photons &" Photons armed and ready.*"
	else
		send "'{" $bot~bot_name "} - Surround Foton Running From Planet " & $planet~planet & ", " & $player~photons &" Photons armed and ready.*"
	end
	goto :surroundPhotonTriggers

:surround_foton_fighit
	# Check for spoofs

	getWord CURRENTLINE $spoof_test 1
	getWord CURRENTANSILINE $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
	     goto :surroundPhotonTriggers
	end

	# Torp only on sector entry
	getWordPos CURRENTLINE $pos "entered sector."
	if ($pos < 1)
		goto :surroundPhotonTriggers
	end

	# Check for alien hits
	getText CURRENTANSILINE $alien_check ": " "'s"
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :surroundPhotonTriggers
	end

	# Get the sector number
	getWord CURRENTLINE $sector 5
	stripText $sector ":"
	isNumber $result $sector
	if ($result < 1)
		goto :surroundPhotonTriggers
	end
	if (($sector > SECTORS) OR ($sector <= 10))
		 goto :surroundPhotonTriggers
	end
:attemptSurroundDrop
	setVar $i 1
	setVar $checkSector SECTOR.WARPS[$sector][$i]
	setVar $isFound FALSE
	while (($checkSector > 0) AND ($isFound = FALSE))
		getSectorParameter $checkSector "FIGSEC" $isFigged
		if ($isFigged <> TRUE)
			setVar $retreatSector $checkSector
			setVar $isFound TRUE
		else
			add $i 1
			setVar $checkSector SECTOR.WARPS[$sector][$i]
		end
	end

	if ($isFound)
		setVar $i 2

		setVar $checkSector SECTOR.WARPS[$retreatSector][$i]
		setVar $isFound FALSE
		setVar $targets ""
		setVar $targetCount 0
		while ($checkSector > 0)
			getSectorParameter $checkSector "FIGSEC" $isFigged
			if (($isFigged = TRUE) AND ($checkSector <> $sector))
				setVar $targets $targets&" "&$checkSector&" "
				add $targetCount 1
			end
			setVar $checkSector SECTOR.WARPS[$retreatSector][$i]
			add $i 1
		end
		if ($targetCount > 0)
			:trySurroundFotonAgain
				killalltriggers
				getWord $targets $gotoSector $targetCount
				setVar $targetCount ($targetCount-1)
				send "p" $gotoSector "*y c p y " $retreatSector "**q"
				setTextLineTrigger s_wrong	:surround_foton_wrong	"That is not an adjacent sector"
				setTextLineTrigger s_gotem	:surround_foton_gotem	"Photon Missile launched into sector"
				setTextLineTrigger s_fed	:surround_foton_fed		"The Feds do not permit Photon Torpedos"
				pause
		else
			echo "** No Adjacent Fig Next To Possible Retreat Sector **"
		end
	else
		echo "** No Possible Retreat Sector **"
	end
goto :surroundPhotonTriggers

:surround_foton_fed
	killtrigger s_gotem
	killtrigger s_wrong
	if ($targetCount > 0)
		goto :trySurroundFotonAgain
	end
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	setSectorParameter $gotoSector "FIGSEC" FALSE
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :surroundPhotonTriggers

:surround_foton_wrong
	killtrigger s_gotem
	killtrigger s_fed
	if ($targetCount > 0)
		goto :trySurroundFotonAgain
	end
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :surroundPhotonTriggers

:surround_foton_gotem
	killtrigger s_wrong
	killtrigger s_fed
	send "'{" $bot~bot_name "} - Foton Fired - Sector => " $retreatSector "!*"
	if ($holo)
		gosub :doholo
	end
	if ($auto_return)
		gosub :foton_go_home
	end
	gosub :player~quikstats
	if ($player~photons = 0)
		goto :foton_out_of_fotons
	end
	if ($game~multiple_photons <> TRUE)
		setTextLineTrigger waitingforcooldown :exitcooldownsurround "Photon Wave Duration has ended in sector "&$retreatSector
		pause
		:exitcooldownsurround
	end
	goto :surroundPhotonTriggers


:trap_foton
	gosub :player~quikstats
	setVar $startingLocation $player~current_prompt
	if ($startingLocation = "Citadel")
		goto :trap_foton_start
	else
		send "'{" $bot~bot_name "} - Must Start at Citadel.*"
		halt
	end

:trap_foton_start
	setVar $home_sector2 $player~current_sector
	if ($player~photons <= 0)
		goto :foton_out_of_fotons
	end
	send "q"

	gosub :planet~getplanetinfo
	send "c"

:trap_foton_get_figs
	send "*"
	waitFor "Citadel command (?="


:trap_foton_go
	if ($auto_return)
		send "'{" $bot~bot_name "} - Trap Foton Running From Planet " & $planet~planet & " w/ Return Home enabled. " & $player~photons &" Photons armed and ready.*"
	else
		send "'{" $bot~bot_name "} - Trap Foton Running From Planet " & $planet~planet & ", " & $player~photons &" Photons armed and ready.*"
	end
	goto :trapPhotonTriggers

:trap_foton_fighit
	# Check for spoofs

	getWord CURRENTLINE $spoof_test 1
	getWord CURRENTANSILINE $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
	     goto :trapPhotonTriggers
	end

	# Torp only on sector entry
	getWordPos CURRENTLINE $pos "entered sector."
	if ($pos < 1)
		goto :trapPhotonTriggers
	end

	# Check for alien hits
	getText CURRENTANSILINE $alien_check ": " "'s"
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :trapPhotonTriggers
	end

	# Get the sector number
	getWord CURRENTLINE $sector 5
	stripText $sector ":"
	isNumber $result $sector
	if ($result < 1)
		goto :trapPhotonTriggers
	end
:testTrapEnterHere
	if (($sector > SECTORS) OR ($sector <= 10))
		 goto :trapPhotonTriggers
	end
:attemptTrapDrop
	setVar $i 1
	setVar $checkSector SECTOR.WARPS[$sector][$i]
	setVar $fadj 0
	setVar $fadji 0
	setVar $isFound FALSE
	while ($checkSector > 0)
		getSectorParameter $checkSector "FIGSEC" $isFigged
		getSectorParameter $checkSector "LIMPSEC" $isLimp
		# Can't hide in a sector with limpets
		if (($isFigged = TRUE) and ($isLimp <> TRUE))
			add $fadji 1
			setVar $fadj[$fadji] $checkSector
			setVar $isFound TRUE
		end
		add $i 1
		setVar $checkSector SECTOR.WARPS[$sector][$i]
	end

	if ($isFound)
		setVar $trapSecLand 0
		setVar $trapSecFireTo 0
		setVar $trapSeci 0
		setVar $isFound FALSE
		setVar $i 1
		while ($i <= $fadji)
			setVar $testSector $fadj[$i]
			setVar $y 1
			while ($y <= SECTOR.WARPINCOUNT[$testSector])
				getSectorParameter SECTOR.WARPSIN[$testSector][$y] "FIGSEC" $isFigged
				if (($isFigged = TRUE) and (SECTOR.WARPSIN[$testSector][$y] <> $sector))
					setVar $isFound TRUE
					add $trapSeci 1
					setVar $trapSecLand[$trapSeci] SECTOR.WARPSIN[$testSector][$y]
					setVar $trapSecFireTo[$trapSeci] $testSector
					# we only need one trap drop sector per adjacent ($i) hit sector
					setVar $y 99
				end
				add $y 1
			end
			add $i 1
		end

		if ($isFound = TRUE)
			getRnd $whichTrap 1 $trapSeci
			killalltriggers
			send "p" $trapSecLand[$whichTrap] "*y c p y " $trapSecFireTo[$whichTrap] "**q"
			
			setTextLineTrigger s_wrong	:trap_foton_wrong	"That is not an adjacent sector"
			setTextLineTrigger s_gotem	:trap_foton_gotem	"Photon Missile launched into sector"
			setTextLineTrigger s_fed	:trap_foton_fed		"The Feds do not permit Photon Torpedos"
			pause
		else
			echo "** No Adjacent Fig Next To Possible Adjacent Sector **"
		end
	else
		echo "** No Possible Trap Sector **"
	end
goto :trapPhotonTriggers

:trap_foton_fed
	killtrigger s_gotem
	killtrigger s_wrong
	
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	setSectorParameter $gotoSector "FIGSEC" FALSE
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :trapPhotonTriggers

:trap_foton_wrong
	killtrigger s_gotem
	killtrigger s_fed
	
	send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
	if ($auto_return)
		gosub :foton_go_home
	end
	goto :trapPhotonTriggers

:trap_foton_gotem
	killtrigger s_wrong
	killtrigger s_fed
	send "'{" $bot~bot_name "} - Foton Fired - Sector => " $trapSecFireTo[$whichTrap] "!*"
	if ($holo)
		gosub :doholo
	end
	if ($auto_return)
		gosub :foton_go_home
	end
	gosub :player~quikstats
	if ($player~photons = 0)
		goto :foton_out_of_fotons
	end
	if ($game~multiple_photons <> TRUE)
		setTextLineTrigger waitingforcooldown :exitcooldowntrap "Photon Wave Duration has ended in sector "& $trapSecFireTo[$whichTrap]
		pause
		:exitcooldowntrap
	end
	goto :trapPhotonTriggers


:foton_launch
	killalltriggers
	send "p" $adjsec "*y c p y " $sector "**q"
	setTextLineTrigger launch_wrong :foton_launch_wrong "That is not an adjacent sector"
	setTextLineTrigger launch_gotem :foton_launch_gotem "Photon Missile launched into sector"
	setTextLineTrigger launch_wrong2 :foton_launch_wrong "The Feds do not permit Photon Torpedos to be launched into FedSpace"
	pause

:foton_launch_wrong
	killtrigger launch_gotem
	send "'{" $bot~bot_name "} - That is not an adjacent sector!*"
        HALT

:foton_launch_gotem
	killtrigger wrong
	send "'{" $bot~bot_name "} - Foton Fired - Sector => " $bot~parm2 "!*"
    if ($holo)
    	gosub :doholo
    end
        HALT


:doHolo
	setVar $BOT~command "holo"
	setVar $BOT~user_command_line " holo"
	
	saveVar $BOT~command
	saveVar $BOT~user_command_line
	load "scripts\"&$bot~mombot_directory&"\commands\data\holo.cts"
	setEventTrigger        holoend1        :holoend1 "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\data\holo.cts"
	pause
	:holoend1
		killalltriggers
return



:photonSector
	setVar $startingLocation $player~current_prompt
	
	if ($startingLocation <> "Planet") and ($startingLocation <> "Command") and ($startingLocation <> "Citadel")
		send "'{" $bot~bot_name "} - Must start at Command, Planet or Citadel*"
		halt
	end
	
	if ($player~photons = 0)
		send "'{" $bot~bot_name "} - Out of Fotons - Dock Foton Deactivated*"
		setVar $mode "General"
		halt
	end
	
	//if ($PLAYER~CURRENT_SECTOR = STARDOCK)
	//	if (($player~experience < 1000) and ($player~alignment >= 0))
	//		if ($player~fedspacePhotons <> TRUE)
	//			send "'{" $bot~bot_name "} - Fed safe people can't shoot photons from fed..*"
	//			setVar $mode "General"
	//			halt
	//		end
	//	end
	//end
	
	setVar $returnSector 0
	setVar $adjsec 0
	setVar $psec $bot~parm1
	setVar $psecAdj 0
	setVar $i 1
	while ($i <= SECTOR.WARPCOUNT[$PLAYER~CURRENT_SECTOR])
		if ($psec = SECTOR.WARPS[$PLAYER~CURRENT_SECTOR][$i])
			setVar $psecAdj 1
		end
		add $i 1
	end


	
	if ($psecAdj = 0)
		if ($startingLocation = "Command")
			# TWARP PHOTON
			# At this stage, not plotting courses, just going for it. Let player worry about that.
			if (($player~TWARP_TYPE = 1) or ($player~TWARP_TYPE = 2))
				If ($player~ORE_HOLDS < 2)
					setVar $SWITCHBOARD~message "No fuel ore onboard.*"
					gosub :SWITCHBOARD~switchboard
					halt
				end
			else
				setVar $SWITCHBOARD~message "Photoning non adjacent sectors via TWarp not currently implemented*"
				gosub :SWITCHBOARD~switchboard
				halt
			end

		end
		
		// HB: We could technically allow someone to shoot from fed if they are firing come command prompt
		//     However, I think sending a non-fed safe person in by mistake to high a risk.
		setVar $i 1
		while ($i <= SECTOR.WARPINCOUNT[$psec])

			getSectorParameter SECTOR.WARPSIN[$psec][$i] "FIGSEC" $isFigged
			if ($isFigged)
				setVar $adjsec SECTOR.WARPSIN[$psec][$i]
				setVar $i 7
			end
			add $i 1
		end

		if ($auto_return = TRUE)
			setVar $returnSector $PLAYER~CURRENT_SECTOR
		end

		if ($adjsec = 0)
			setVar $SWITCHBOARD~message "No sector adjacent with a fighter.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		if ($startingLocation = "Planet")
			send "c p" $adjsec "*y "
		elseif ($startingLocation = "Citadel")
			send "p" $adjsec "*y "
		elseif ($startingLocation = "Command")
			
			setVar $warpto $adjsec
			gosub :fotontwarp
			if ($twarpSuccess = FALSE)
				setVar $SWITCHBOARD~message "We did not make the twarp to the location.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
			
		end
		
		send "c p y " $psec "* * q"
	else
		send "c p y " $psec "* * q"
		
	end

	setTextLineTrigger launch_wrong :foton_launch_wrong2 "That is not an adjacent sector"
	setTextLineTrigger launch_gotem :foton_launch_gotem2 "Photon Missile launched into sector"
	setTextLineTrigger launch_wrong2 :foton_launch_wrong2 "The Feds do not permit Photon Torpedos to be launched into FedSpace"
	pause
	:foton_launch_wrong2
		killAllTriggers
		
		setVar $SWITCHBOARD~message "That is not an adjacent sector!*"
		gosub :SWITCHBOARD~switchboard
		goSub :photonCheckReturn
		halt
	:foton_launch_gotem2
		
		killAllTriggers

		setVar $SWITCHBOARD~message "Foton Fired - Sector => " & $bot~parm1 & "!*"
		gosub :SWITCHBOARD~switchboard
		if ($holo)
			gosub :doholo
		end
		goSub :photonCheckReturn
		
halt

:photonTow
	
	setVar $towShip $bot~parm3
	isNumber $number $towShip

	if ($number <> 1)
		setvar $switchboard~message "Please user Foton on t [ship_number] for tow xport foton.*"
		gosub :switchboard~switchboard
		halt
	else
		if ($towShip = 0)
			setvar $switchboard~message "Please user Foton on t [ship_number] for tow xport foton.*"
			gosub :switchboard~switchboard
			halt
		end
	end
	gosUb :prepTow

	setVar $home_sector2 $player~current_sector
	setVar $ourship $player~ship_number

	if ($auto_return)
		send "'{" $bot~bot_name "} - TWarp Tow Foton Running, Towing " & $towShip & " w/ Return Home enabled. Firing one shot.*"
	else
		send "'{" $bot~bot_name "} - TWarp Tow Foton Running, Towing " & $towShip & ", Firing one shot.*"
	end
	goto :towPhotonTriggers

	
	:tow_pwplimp
		gosub :tow_limphit
		goto :tow_pwp_go

	:tow_pwparmid
		gosub :tow_minehit
		goto :tow_pwp_go

	:tow_pwpfig
		#gosub :tow_fighit

	:tow_pwp_go
		killalltriggers
		gosub :tow_get_adj
		if ($adjsec <> $PLAYER~CURRENT_SECTOR)
			setVar $warpto $adjsec
			gosub :fotontwarp
			if ($twarpSuccess = FALSE)
				setVar $SWITCHBOARD~message "We did not make the twarp to the launch sector.. Shutting Down*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
		end
		send "x " $towship "* * " 
		send "c p y " $sector "**q"
		send "x " $ourship "* * "
		send "w n " $towship "*"

		setTextLineTrigger	wrong	:tow_wrong	"That is not an adjacent sector"
		setTextLineTrigger	gotem	:tow_gotem	"Photon Missile launched into sector"
		setTextLineTrigger	wrong2	:tow_wrong2	"The Feds do not permit Photon Torpedos"
		pause

	:tow_wrong2
		killtrigger gotem
		send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
		if ($auto_return and ($adjsec <> $PLAYER~CURRENT_SECTOR))
			gosub :tow_go_home
		end
		goto :towPhotonTriggers

	:tow_wrong
		killtrigger gotem
		send "'{" $bot~bot_name "} - Foton Missed! Resetting!*"
		setSectorParameter $adjsec "FIGSEC" FALSE
		if ($auto_return and ($adjsec <> $PLAYER~CURRENT_SECTOR))
			gosub :tow_go_home
		end
		goto :towPhotonTriggers

	:tow_gotem
		killtrigger wrong
		send "'{" $bot~bot_name "} - Foton Fired - Sector => " $sector "!*"
		if ($holo)
			gosub :doholo
		end
		if ($auto_return and ($adjsec <> $PLAYER~CURRENT_SECTOR))
			gosub :tow_go_home
		end
		gosub :player~quikstats
		send "w"
		setVar $SWITCHBOARD~message "T-warp foton complete - reload ore/fotons and run again.*"
		gosub :SWITCHBOARD~switchboard
		halt
		
	:tow_go_home
		setVar $warpto $home_sector2
		gosub :fotontwarp
		if ($twarpSuccess = FALSE)
			send "'{" $bot~bot_name "} - Failed to twarp back with tow, attemping without!*"
			gosub :fotontwarp
			if ($twarpSuccess = FALSE)
				setVar $SWITCHBOARD~message "Failed to make twarp back without ship. Exiting and then Panicking.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
		end
		
		return
	:tow_get_adj
		# we are exluding fed for now. Could risk 2-10 ?
		setVar $adjsec 0
		setVar $i 1
		while (SECTOR.WARPS[$Sector][$i] > 0)
			setVar $tempAdj SECTOR.WARPS[$Sector][$i]
			getSectorParameter $tempAdj "FIGSEC" $isFigged
			if ($tempAdj = $PLAYER~CURRENT_SECTOR)
				setVar $adjsec $tempAdj
				return
			end
			if ($isFigged)
				setVar $adjsec $tempAdj
				//return
				// This used to return - I'd rather it loops through all and checks for current sector
				// plus guessing first sector is more easy/predicatable and no real speed advantag
			end
			add $i 1
		end
		if ($adjsec <= 0)
			echo ANSI_12 "No Adjacent fig found*" ANSI_7
			goto :towPhotonTriggers
		end
		return

halt

:prepTow
	if ($startingLocation <> "Command")
		setVar $SWITCHBOARD~message "Foton two needs to be from command prompt*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if ($player~TWARP_TYPE = 2)
		If ($player~ORE_HOLDS <> $player~TOTAL_HOLDS)
			setVar $SWITCHBOARD~message "Make sure holds are full of fuel.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	else
		setVar $SWITCHBOARD~message "You need a type two twarp.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	setVar $xportSectorOk 0
	setVar $xportPhotonsOk 0

	send "x"
	:xportwait
	setTextLineTrigger xporttestfed :xporttestfed "Any unmanned ships in FedSpace will be automatically"
	setTextLineTrigger xporttest :xporttest "--<  Available Ship Scan  >--"
	setTextLineTrigger xportfail :xportfail "You do not own any other ships!"
	pause
	:xportfail
		killAllTriggers
		setVar $SWITCHBOARD~message "You don't own any ships to tow.*"
		gosub :SWITCHBOARD~switchboard
		halt
	:xporttestfed
		send "*"
		killAllTriggers
		goto :xportwait
	:xporttest
		killalltriggers
		send "i"
		send $towShip "*q"
		setTextLineTrigger xportShipNA :xportShipNA "That is not an available ship."
		setTextLineTrigger xportShip :xportShip "Ship Name      :"
		pause
		:xportShipNA
			killAllTriggers
			
			setVar $SWITCHBOARD~message "Ship is not available.*"
			gosub :SWITCHBOARD~switchboard
			halt
		:xportShip
			setTextLineTrigger xportShipSec :xportShipSec "Current Sector :"
			setTextLineTrigger xportShipPhoton :xportShipPhoton "Photon Missiles:"
			setTextTrigger xportShipPause :xportShipPause "[Pause]"
			pause
			:xportShipSec
				killAllTriggers
				getWord CURRENTLINE $testSector 4
				if ($testSector = $player~CURRENT_SECTOR)
					setVar $xportSectorOk 1
				end
				goto :xportShip
			:xportShipPhoton
				killalltriggers
				setVar $xportPhotonsOk 1

			:xportShipPause
			killalltriggers
			send "*q"

	

	if ($xportSectorOk = 0)
		setVar $SWITCHBOARD~message "Tow ship is not in same sector.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	if ($xportPhotonsOk = 0)
		setVar $SWITCHBOARD~message "Tow ship has no photons.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

	:xportReStartGo
	send "w"
	setTextLineTrigger xportRestart :xportRestart "You shut off your Tractor Beam."
	setTextTrigger xportStart :xportStart "Do you wish to tow a manned ship?"
	pause
	:xportRestart
		killAllTriggers
		goto :xportReStartGo
	:xportStart
		send "n" $towShip "*"
	
	

return

:photonCheckReturn
	
	if ($returnSector > 0)
		gosub :player~quikstats
		if ($PLAYER~CURRENT_SECTOR <> $returnSector)
			if ($startingLocation = "Command")
				setVar $warpto $returnSector
				gosub :fotontwarp
				if ($twarpSuccess = FALSE)
					setVar $SWITCHBOARD~message "Twarp return failed post foton.*"
					gosub :SWITCHBOARD~switchboard
					halt
				end
			else
				send "p" $returnSector "*y"
			end
			
		end
	end

return

:killtwarptriggers
	killtrigger locking
	killtrigger igd
	killtrigger noturns
	killtrigger noroute
	killtrigger twarp_lock
	killtrigger no_twrp_lock
	killtrigger twarp_adj
	killtrigger no_fuel
	killtrigger twarpDelay
return

:fotontwarp
	# HB: INCOMING CALLS MUST cHECK - NOT ADJACENT - NOT CURRENT SECTOR
	#     I've made this less safe to remove a pause for speed
	setVar $twarpSuccess FALSE
	send "mz" $warpto "*y"


	setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
	setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
	setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
	setTextLineTrigger no_fuel :twarpNoFuel "You do not have enough Fuel Ore"
	setTextTrigger      igd        :twarpIgd       "An Interdictor Generator in this sector holds you fast!"
	setTextTrigger      noturns    :twarpPhotoned  "Your ship was hit by a Photon and has been disabled"
	setDelayTrigger 	twarpDelay  :twarpDelay 2000
		pause
	:twarpNoFuel
		gosub :killtwarptriggers
		
		goto :twarpDone
	:twarp_adj
		gosub :killtwarptriggers
		send "q za  "&$ship~SHIP_MAX_ATTACK&"* * r * "
		setVar $twarpSuccess TRUE
		setVar $msg "Sector was nextdoor so just warped!"
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
	:twarpDelay
		gosub :killtwarptriggers
		setVar $msg "T-Warp timed out - Something went wrong!"
		goto :twarpDone
	:twarp_lock
		gosub :killtwarptriggers
		setVar $target $warpto
		setSectorParameter $target "FIGSEC" TRUE
		send "y   *     "
		setVar $msg "T-warp completed."
		setVar $twarpSuccess TRUE
	:twarpDone

		send "'" $msg "*"
return




:tow_limphit
	cutText CURRENTLINE&"      " $ck 1 6
	if ($ck <> "Limpet")
		goto :towPhotonTriggers
	end
	getWord CURRENTLINE $sector 4
	return

:tow_minehit
	cutText CURRENTLINE&"    " $ck 1 4
	if ($ck <> "Your")
		goto :towPhotonTriggers
	end

	# Check for alien hits

	getText CURRENTANSILINE $alien_check "damage to" ""
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :towPhotonTriggers
	end

	getWord CURRENTLINE $sector 4
	return

:tow_fighit
	# Check for spoofs
	
	getWord CURRENTLINE $spoof_test 1
	getWord CURRENTANSILINE $ansi_spoof_test 1
	getWordPos $ansi_spoof_test $ansi_spoof_pos #27 & "[1;33m"
	if ($spoof_test <> "Deployed") OR ($ansi_spoof_pos <= 0)
	     goto :towPhotonTriggers
	end

	# Torp only on sector entry
	getWordPos CURRENTLINE $pos "entered sector."
	if ($pos < 1)
		goto :towPhotonTriggers
	end

	# Check for alien hits
	getText CURRENTANSILINE $alien_check ": " "'s"
	getWordPos $alien_check $pos #27 & "[1;36m" & #27 & "["
	if ($pos > 0)
	     goto :towPhotonTriggers
	end

	# Get the sector number
	getWord CURRENTLINE $sector 5
	stripText $sector ":"
	isNumber $result $sector
	if ($result < 1)
		goto :towPhotonTriggers
	end
	if (($sector > SECTORS) OR ($sector <= 10))
		 goto :towPhotonTriggers
	end
	goto :tow_pwp_go



#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\player\turnoffansi\player"
include "source\bot_includes\player\turnonansi\player"
include "source\bot_includes\planet\landingsub\planet"
include "source\bot_includes\player\twarp\player"
