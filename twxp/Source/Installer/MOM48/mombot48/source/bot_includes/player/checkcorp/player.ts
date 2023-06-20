:checkcorp
	setarray $corp_members 10 1
	setvar $corp_count 0
    gosub :quikstats
    if ($player~current_prompt = "Citadel")
    	send "xa"
	else
    	send "ta"
    end
    waiton "    Corp Member Name                   Sector  Fighters Shields Mines  Credits"
	waiton "------------------------------------------------------------------------------"
	
	:ta_again
		setTextLineTrigger taline :ta_check
		pause

		:ta_check
			getwordpos CURRENTLINE $pos "P indicates Trader is on a planet in that sector"
			getwordpos CURRENTLINE $pos2 "Corporate command ["
			if (($pos > 0) or ($pos2 > 0))
				goto :done_ta
			end
			setvar $line CURRENTLINE
			trim $line
			if ($line <> "")
				cutText $line $name 1 30
				replacetext $line $name ""
				trim $name
				add $corp_count 1
				setvar $corp_members[$corp_count] $name
				getword $line $corp_members[$corp_count][1] 1
				replacetext $corp_members[$corp_count][1] "P" ""
			end
		goto :ta_again

	:done_ta
	send "q"
return
