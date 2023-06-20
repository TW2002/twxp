	gosub :BOT~loadVars


	setVar $BOT~help[1]  $BOT~tab&"Ship list"
	setVar $BOT~help[2]  $BOT~tab&"  Displays ship list on subspace"
	setVar $BOT~help[3]  $BOT~tab&"    {fed} - display on fed space"
	gosub :bot~helpfile


#=============================== SS SCANNING =============================================
:slist
	setVar $scan_macro "x** * "
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
		setVar $scan_array[$idx] "-----------------------------------------------------------------"
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
:pscan
	setArray $scan_array 30
	gosub :PLAYER~quikstats

	isNumber $test $bot~parm1   
	setVar $startingLocation $PLAYER~current_prompt 
	if ((($PLAYER~current_prompt = "Citadel") OR ($PLAYER~current_prompt = "Planet")) OR (($PLAYER~current_prompt = "Command") AND (($bot~parm1 <> "") AND ($test = TRUE))))
		
		if (($bot~parm1 <> "") AND ($test = TRUE))
			send "  q  q *"
			setVar $LandOn $bot~parm1
			setVar $planet~planet $bot~parm1
			gosub :PLANET~landingSub
			gosub  :player~currentPrompt
			if ($PLAYER~current_prompt = "Citadel")
				send "q "
				waitOn "Planet command ("
			elseif ($PLAYER~current_prompt <> "Planet")
				setvar $switchboard~message "PScan - Problem with landing on the planet you provided.*"
				halt
			end
			gosub :start_pscan
		else
			if ($startingLocation = "Citadel")
				send "q "
			end
			gosub :start_pscan
		end
	elseif ($Location = "Command")
			setvar $switchboard~message "PScan - If Starting From Sector Please Specify Planet Number.*"
			halt
	else
		setvar $switchboard~message "PScan - Please Start from Command, Citadel, or Planet Prompt*"
	end
	if ($gotScan)
		gosub :SpitItOut
	end
	halt
:start_pscan
	setVar $idx 0
	send "D"
	:continuepscan
		waitOn "Planet #"
		setTextTrigger done :pscan_done "Planet command"
		setTextLineTrigger line_trig :parse_pscan_line
		pause
	:parse_pscan_line
		killTrigger line_trig
		setVar $s CURRENTLINE
		if (($s = "") OR ($s = 0))
			setVar $s "          "
		end
		getWordPos $s $pos "Fuel Ore"
		gosub :doPscanText
		getWordPos $s $pos "Organics"
		gosub :doPscanText
		getWordPos $s $pos "Equipment"
		gosub :doPscanText
		getWordPos $s $pos "Fighters "
		gosub :doPscanText
		replacetext $s "  Item    Colonists  Colonists    Daily     Planet      Ship      Planet" "Item  Colonists Colonists    Daily     Planet    Planet"
		replaceText $s "           (1000s)   2 Build 1   Product    Amount     Amount     Maximum"  "       (1000s)  2 Build 1   Product    Amount    Maximum"
		replaceText $s " -------  ---------  ---------  ---------  ---------  ---------  ---------" "---  ---------  ---------  ---------  ---------  ---------"
		replaceText $s "Fuel Ore" "Ore"
		replaceText $s "Organics" "Org"
		replaceText $s "Equipment" "Equ "
		replaceText $s "Fighters " "Figs"
		replaceText $s "Military reaction" "Mil-React"
		add $idx 1
		setVar $scan_array[$idx] $s
		setTextLineTrigger line_trig :parse_pscan_line
		pause
	:is_pscan_done
		if ($idx < 5)
			killtrigger line_trig
			goto :continuepscan
		end
	:pscan_done
		killalltriggers
		setVar $gotScan TRUE
return
:doPscanText
	if ($pos <> 0)
		CutText $s $s_temp1 1 53
		CutText $s $s_temp2 65 75
		setVar $s ($s_temp1 & $s_temp2)
	end
return
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
include "source\bot_includes\planet\landingsub\planet"
