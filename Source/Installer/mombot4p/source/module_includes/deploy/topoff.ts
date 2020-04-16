:deploy
	killalltriggers
	gosub  :player~currentPrompt
	setVar $bot~startingLocation $PLAYER~current_prompt
	setVar $bot~validPrompts "Citadel Command"
	gosub :bot~checkStartingPrompt
	if ($bot~startingLocation = "Citadel")
		send " q "
		gosub :PLANET~getPlanetInfo
		send " q "
	end
	if ($bot~parm1 <> "o") AND ($bot~parm1 <> "t") AND ($bot~parm1 <> "d")
		setVar $type "d"
		isNumber $test CURRENTSECTOR
		if ($test = TRUE)
			if ((CURRENTSECTOR > 0) AND (CURRENTSECTOR <= SECTORS))
				setVar $type SECTOR.FIGS.TYPE[CURRENTSECTOR]
				if ($type = "Offensive")
					setVar $type "o"
				elseif ($type = "Defensive")
					setVar $type "d"
				elseif ($type = "Toll")
					setVar $type "t"
				else
					setVar $type "d"
				end
			end
		end
		setVar $bot~parm1 $type
	end
	setVar $to_drop $bot~parm1
	gosub :do_topoff
	if ($bot~startingLocation = "Citadel")
		gosub :PLANET~landingSub
	end
	setVar $SWITCHBOARD~message "TopOff complete Left "&$ftrs_to_leave&" fighters.*"
	gosub :SWITCHBOARD~switchboard
	return
:do_topoff
	:do_topoff_again
		killalltriggers
		send " F"
		waitOn "Your ship can support up to"
		getWord CURRENTLINE $ftrs_to_leave 10
		stripText $ftrs_to_leave ","
		stripText $ftrs_to_leave " "
		if ($ftrs_to_leave < 1)
			setVar $ftrs_to_leave 1
		end
		send " " & $ftrs_to_leave & " * C " & $to_drop
		setTextLineTrigger topoff_success :topoff_success "Done. You have "
		setTextLineTrigger topoff_failure1 :do_topoff_again "You don't have that many fighters available."
		setTextLineTrigger topoff_failure2 :do_topoff_again "Too many fighters in your fleet!  You are limited to"
		pause
	:topoff_success
return
#============================== END TOPOFF (TOPOFF) ==============================
