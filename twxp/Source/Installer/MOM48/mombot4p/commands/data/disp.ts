	gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"dep {cash to deposit} "
	setVar $BOT~help[2]  $BOT~tab&"  Deposits cash into citadel treasury."
	setVar $BOT~help[3]  $BOT~tab&"        default is max credits possible"
	gosub :bot~helpfile


#=============================== SS SCANNING =============================================
:disp
	setVar $scan_macro "d"
	goto :start_scan
:start_scan
		gosub :PLAYER~quikstats
		if ($PLAYER~unlimitedGame <> TRUE)
				if (($scan_macro = " sh") and (($PLAYER~TURNS <= $bot_turn_limit) or ($PLAYER~TURNS = 0)))
						 goto :no_turns_available1
				end
		end
		if (($scan_macro = " sh") and (($PLAYER~SCAN_TYPE = "None") OR ($PLAYER~SCAN_TYPE = "Density")))
				goto :no_scanner_available1
		end
	gosub  :player~currentPrompt
	setArray $scan_array 1000
	setVar $bot~startingLocation $PLAYER~CURRENT_PROMPT
	if ($scan_macro = "") OR ($scan_macro = 0)
		setVar $scan_macro " sd* "
	end
	setVar $bot~validPrompts "Citadel Command"
	gosub :bot~checkStartingPrompt
	if ($PLAYER~startingLocation = "Citadel")
		if ($scan_macro = "d")
			setVar $scan_macro "s"
		else
			send " q "
			gosub :PLANET~getPlanetInfo
			send " q "
		end
	end
	setVar $idx 0
	setTextLineTrigger noscanner_1 :no_scanner_available1 "You don't have a long range scanner."
	send $scan_macro
	if ($scan_macro = "d")
		waitOn "<Re-Display>"
	elseif ($scan_macro = "s")
		waitOn "<Scan Sector>"
	elseif ($scan_macro = " sd")
		setTextLineTrigger noScanner_2 :no_scanner_available2 "Relative Density Scan"
		waiton "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] D"
		killTrigger noScanner_1
		killTrigger noScanner_2
	elseif ($scan_macro = "x** * ")
		waitOn "Ship  Sect Name                  Fighters Shields Hops Type"
		waitOn "--------------------------------------------------------------------------"
	else
		waitOn "Select (H)olo Scan or (D)ensity Scan or (Q)uit? [D] H"
	end
	if ($scan_macro = "s")
		setTextTrigger end_of_line2 :end_of_lines "Citadel command (?=help)"
		setTextTrigger end_of_line3 :end_of_lines "Mined Sector: Do you wish to Avoid this sector in the future? (Y/N)"
	elseif ($scan_macro = "x** * ")
		setTextTrigger end_of_line4 :end_of_lines "<I> Ship details"
		add $idx 1
		setVar $scan_array[$idx] "                 --<  Available Ship Scan  >--"
		add $idx 1
		setVar $scan_array[$idx] "Ship  Sect Name                  Fighters Shields Hops Type"
		add $idx 1
		setVar $scan_array[$idx] "----------------------------------------------------------------------"
	else
		setTextTrigger end_of_line1 :end_of_lines "Command [TL="
	end

	setTextLineTrigger line_trig :parse_scan_line
	pause
	:parse_scan_line
		setVar $current_line CURRENTLINE
		if ($idx >= 1000)
				goto :end_of_lines
		end
		if ($scan_macro = "s") OR ($scan_macro = "d")
			if ($idx = 0)
				setVar $current_line "-=-=-=-=-=-=-=-=-=-=-=-=-=| Display |=-=-=-=-=-=-=-=-=-=-=-=-=-"
			end
			getWordPos $current_line $pos1 "Citadel treasury contains"
			getWordPos $current_line $pos2 "(?=Help)? :"
			getWordPos $current_line $pos3 "<Re-Display>"
			if ($pos1 < 1) AND ($pos2 < 1) AND ($pos3 < 1)
					 if ($current_line = "") OR ($current_line = 0)
				 elseif ($idx >= 5000)
						 else
								add $idx 1
							replaceText $current_line "Warps to Sector(s) :  " "Warps To: "
							replaceText $current_line "Warps to Sector(s) : " "Warps To: "
							setVar $scan_array[$idx] $current_line
					 end
			end
		elseif ($scan_macro = "x** * ")
			getWordPos $current_line $em_end "(?=Help)? :"
			if ($em_end > 0)
					goto :end_of_lines
			end
			getWordPos $current_line $em_end "<I> Ship details"
			if ($em_end > 0)
				goto :end_of_lines
			end
			getLength $current_line $length
			if ($length > 70)
				cutText $current_line $current_line 1 70
			end
			if ($current_line <> "")
				add $idx 1
				setVar $scan_array[$idx] $current_line
			end
		else
			getWordPos $current_line $em_end "(?=Help)? :"
			if ($em_end > 0)
				goto :end_of_lines
			end
				getWordPos $current_line $pos "One turn deducted,"
				if ($pos > 0)
				   setVar $current_line "-=-=-=-=-=-=-=-=-=-=-=-=-| Holo Scan |-=-=-=-=-=-=-=-=-=-=-=-=-"
				end
				getWordPos $current_line $pos "Relative Density Scan"
				if ($pos > 0)
					setVar $current_line "-=-=-=-=-=-=-=-=-=-| Relative Density Scan |-=-=-=-=-=-=-=-=-=-"
				end
				if ($current_line = "") OR ($current_line = 0)
					goto :bogus
				end
				getWordPos $current_line $pos "Sector  :"
				if ($pos > 0)
					add $idx 1
					setVar $scan_array[$idx] "    "
				end
				getWordPos $current_line $pos1 "-------"
				getWordPos $current_line $pos2 "Long Range Scan"
				getWordPos $current_line $pos3 "Select (H)olo Scan or (D)ensity Scan or (Q)uit?"
				getWordPos $current_line $pos4 "<Mine Control>"
				getWordPos $current_line $pos5 "(?=Help)? :"
				if ($pos1 < 1) AND ($pos2 < 1) AND ($pos3 < 1) AND ($pos4 < 1) AND ($pos5 < 1)
					replaceText $current_line "Warps to Sector(s) :  " "Warps To: "
					replaceText $current_line "Warps to Sector(s) : " "Warps To: "
					replaceText $current_line " ==>    " " => "
					replaceText $current_line "  Warps : " "  Warps: "
					replaceText $current_line "   NavHaz :   " " Haz: "
					replaceText $current_line "  Anom : " " Anom: "
					add $idx 1
					setVar $scan_array[$idx] $current_line
				end
				:bogus
		end
		setTextLineTrigger line_trig :parse_scan_line
		pause
	:end_of_lines
		killalltriggers
		if ($PLAYER~startingLocation = "Citadel")
			if ($scan_macro = "d") OR ($scan_macro = "s")
				send "* "
			else
				send " l " & $planet~planet & "* c s* "
			end
		end
		gosub :spitItOut
		halt
	:no_turns_available1
		setvar $switchboard~message "No turns available.** "
		halt
		:no_scanner_available1
		setvar $switchboard~message "No scanner available.** "
		halt
	:no_scanner_available2
		setVar $current_line "-=-=-=-=-=-=-=-=-=-| Relative Density Scan |-=-=-=-=-=-=-=-=-=-"
		add $idx 1
		setVar $scan_array[$idx] $current_line
		setTextLineTrigger line_trig :parse_scan_line
		pause

	:handle_mines
		send "*"
		goto :end_of_lines
:SpitItOut
	setvar $switchboard~message ""
	setvar $i 1
	while ($i <= $idx)
		if ($scan_array[$i] <> "0")
				setvar $switchboard~message $switchboard~message & $scan_array[$i] & "*"
		end
		add $i 1
	end
	gosub :switchboard~switchboard
	:continuecommpscan2
return
#================================ END SS SCANNER =======================================    

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\currentprompt\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
