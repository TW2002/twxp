	gosub :BOT~loadVars
		
	setVar $BOT~help[1] $BOT~tab&"Attempts a mega rob on port"
	gosub :bot~helpfile


:mega
	setVar $isMega TRUE
:rob
	gosub :PLAYER~quikstats
	setVar $BOT~validPrompts "Citadel Command"
	gosub :BOT~checkStartingPrompt
	setVar $startingLocation $player~CURRENT_PROMPT

	if (($PLAYER~TURNS = 0) and ($PLAYER~unlimitedGame = FALSE))
		setvar $switchboard~message "I have no turns*"
		gosub :switchboard~switchboard
		halt
	end
	cutText $PLAYER~ALIGNMENT $neg_ck 1 1
	stripText $PLAYER~ALIGNMENT "-"
	if ((($PLAYER~ALIGNMENT < 100) and ($neg_ck = "-")) OR ($neg_ck <> "-"))
		setvar $switchboard~message "Need -100 Alignment Minimum*"
		gosub :switchboard~switchboard
		goto :portrm_done
	end
	if ($startingLocation = "Citadel")
		send "q"
		gosub :PLANET~getPlanetInfo
		send "q"
	end
	setVar $second_mega 0
	setvar $leftover_cash 0
	setVar $mega_min 2970000
	setVar $mega_max 5760000
	send "p r * r"
	setTextLineTrigger fake :port_fake "Busted!"
	setTextLinetrigger mega :port_ok "port has in excess of"
	pause
:port_fake
	killalltriggers
	if ($startingLocation = "Citadel")
		gosub :PLANET~landingSub
	end
	setSectorParameter $PLAYER~CURRENT_SECTOR "BUSTED" TRUE
	setvar $switchboard~message "Fake Busted*"
	gosub :switchboard~switchboard
	goto :portrm_done
:port_ok
	killalltriggers
	setVar $rob ($rob_factor*$PLAYER~EXPERIENCE)
	getWord CURRENTLINE $port_cash 11
	stripText $port_cash ","
	if ($port_cash < $mega_min)
		if ($isMega)
			setVar $port_cash (($port_cash*10)/9)
			setVar $mega_short (3300000 - $port_cash)
			send "0* "
			if ($startingLocation = "Citadel")
				gosub :PLANET~landingSub
			end
			setvar $switchboard~message "Port is short "&$mega_short&" credits*"
			gosub :switchboard~switchboard
			goto :portrm_done
		else
			goto :do_rob        
		end
	elseif (($game~mbbs = TRUE) AND ($isMega = FALSE))
		setvar $switchboard~message  $port_cash&" credits on port.  Port is ready for Mega Rob*"
		gosub :switchboard~switchboard
		send "*"
		if ($startingLocation = "Citadel")
			gosub :PLANET~landingSub
		end
		goto :portrm_done
	else
		if ($isMega)
			setVar $actual_cash $port_cash
			multiply $actual_cash 10
			divide $actual_cash 9
			setVar $mega_cash $actual_cash
			if ($actual_cash >= 3300000)
				:mega_loop
					if ($mega_cash > 6400000)
						subtract $mega_cash 3300000
						add $leftover_cash 3300000
						setVar $second_mega 1
						goto :mega_loop
					end
					if ($second_mega = 0)
						send $actual_cash "*"
					elseif ($second_mega = 1)
						send $mega_cash "*"
						setVar $actual_cash $mega_cash
					end
			end
			setTextLineTrigger mega_suc :port_suc "Success!"
			setTextLineTrigger mega_bust :port_bust "Busted!"
			pause
		else
			goto :do_rob
		end
	end
:port_bust
	killalltriggers
	if ($startingLocation = "Citadel")
		gosub :PLANET~landingSub
	end
	setSectorParameter $PLAYER~CURRENT_SECTOR "BUSTED" TRUE
	send "'<" & $subspace & ">[Busted:" & $PLAYER~CURRENT_SECTOR & "]<" & $subspace & ">*"
	goto :portrm_done
:port_suc
	killalltriggers
	if ($startingLocation = "Citadel")
		gosub :PLANET~landingSub
		send "tt" $actual_cash "*"
	end
	setvar $switchboard~message "Success! - "&$actual_cash&" credits robbed*"
	gosub :switchboard~switchboard
	if ($second_mega = TRUE)
		setvar $switchboard~message "There are "&$leftover_cash&" credits left for a second mega*"
		gosub :switchboard~switchboard
	end
:portrm_done
	setVar $isMega FALSE
	halt
:do_rob
	setVar $port_cash (($port_cash*10)/9)
	if ($port_cash < $rob)
		setVar $rob $port_cash
	end
	send $rob "*"
	setVar $actual_cash $rob
	setTextLineTrigger port_empty :port_suc "Maybe some other day, eh?"
	setTextLineTrigger mega_suc :port_suc "Success!"
	setTextLineTrigger port_bust :port_bust "Busted!"
	pause






# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\module_includes\bot\checkstartingprompt\bot"
include "source\bot_includes\planet\getplanetinfo\planet"
include "source\bot_includes\planet\landingsub\planet"
