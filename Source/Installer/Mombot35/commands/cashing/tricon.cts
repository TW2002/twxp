	gosub :BOT~loadVars
		
	setVar $BOT~help[1] $BOT~tab&"Plays tricon for you"
	setVar $BOT~help[2] $BOT~tab&"  - Must be started at stardock"
	gosub :bot~helpfile

if ($bot~parm1 <> "")
	setVar $games $bot~parm1
end
setVar $gamestoplay $games
setVar $games_played 0
gosub :player~quikstats
if ((STARDOCK = "") and (STARDOCK = 0) and ($map~stardock = "0"))
	setvar $switchboard~message "Tri-Conn - StarDock's Not In TWX DBase!*"
	gosub :switchboard~switchboard
	halt
end
if (($player~current_sector <> STARDOCK) and ($player~current_sector <> $map~stardock))
	setvar $switchboard~message "Tri-Conn Must Be Started at StarDock!*"
	gosub :switchboard~switchboard
	halt
end
setVar $INITCREDITS $player~credits
setVar $prompt $player~current_prompt
if ($bot~parm1 = "")
		setVar $towin "YES"
END
IF ($player~current_prompt = "<Tavern>")
	Goto :Start
ELSEIF ($player~current_prompt = "<StarDock>")
	send "t"
	Goto :Start
ELSEIF ($player~current_prompt = "Command")
	#Added Scrub Buffer
	send "psgygqt"
	Goto :Start
ELSE
		setvar $switchboard~message "Unknown Prompt.*"
		gosub :switchboard~switchboard
		halt
END

:start
#send "g"
		send "gny"

:nextRound
		killTrigger 1
		killTrigger 2
		killTrigger 3
		killtrigger 4
		setTextTrigger 1 :done "Play again?"
		setTextLineTrigger 2 :round "Round "
		setTextLineTrigger 3 :won "C o n g r a t u l a t i o n s ! ! ! !"
		setTextLineTrigger 4 :nocred "You ain't got the creds"
		pause

:round
		send "231"
		goto :nextRound

:done
		add $games_played 1
		subtract $games 1
		IF (($games = 0) and ($towin <> "YES"))
				gosub :player~quikstats
				subtract $player~credits $INITCREDITS
				setvar $switchboard~message "Tri-Conn Played Winning "&$player~credits&" in "&$games_played&" Games.*"
				gosub :switchboard~switchboard
				send "n"
				goto :end
		END
		send "y"
		goto :nextRound

:won
		subtract $games 1
		add $games_played 1
		IF (($games = 0) and ($towin <> "YES"))
				gosub :player~quikstats
				subtract $player~credits $INITCREDITS
				setvar $switchboard~message "Tri-Conn Played Winning "&$player~credits&" in "&$games_played&" Games.*"
				gosub :switchboard~switchboard
				send "n"
				goto :end
		END
		IF ($towin = "YES")
				 gosub :player~quikstats
				 subtract $player~credits $INITCREDITS
				 setvar $switchboard~message "Tri-Conn Won.  I won "&$player~credits&" by playing "&$games_played&" Games.*"
				 gosub :switchboard~switchboard
				 goto :end
		END
		goto :start

:nocred
		gosub :player~quikstats
		subtract $player~credits $INITCREDITS
		setvar $switchboard~message "Out of Credits.  Tri-Conn Games played Winning "&$player~credits&" in "&$games_played&" Games.*"
		gosub :switchboard~switchboard
		send "n"

:end
		if ($prompt = "Command")
				send "qqqzn"
		elseif ($prompt = "<StarDock>")
				send "q"
		else
		END
		halt
		

#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
