	gosub :BOT~loadVars
	loadvar $bot~corppassword
	loadvar $player~corpnumber

		
	setVar $BOT~help[1]  $BOT~tab&"- corp [join/drop] [corp number] [password]                "
	setVar $BOT~help[2]  $BOT~tab&"      join        - Will join Corporation                          "
	setVar $BOT~help[3]  $BOT~tab&"      drop        - Will Drop current corporation                  "
	setVar $BOT~help[4]  $BOT~tab&"      corp number - The corp number to join                        "
	setVar $BOT~help[5]  $BOT~tab&"      password    - The corp password                              "
	setVar $BOT~help[6]  $BOT~tab&"*NOTE: If corp and password were previously used via bot           "
	setVar $BOT~help[7]  $BOT~tab&"       the corp number and password will be saved                  "
	gosub :bot~helpfile


# ============================== Corp Join/Drop (CORP) ==============================
:corp
		gosub :PLAYER~quikstats
		if (($PLAYER~CURRENT_PROMPT <> "Command") and ($PLAYER~CURRENT_PROMPT <> "Citadel"))
			setVar $SWITCHBOARD~message "Must run from Command or Citadel Prompt*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		if ($bot~parm1 <> "drop")
			   if (((($bot~parm2 < 1) and ($player~corpNumber < 1)) or (($bot~parm3 = "") and ($bot~corpPassword = "")) and ($bot~parm1 <> "join")))
					 setVar $SWITCHBOARD~message "Please use CORP [drop/join] {corp #} {password}*"
					 gosub :SWITCHBOARD~switchboard
					 halt
			   end
		end
		if (($bot~parm2 <> "") and ($bot~parm2 <> ""))
			   setVar $player~corpnumber $bot~parm2
		end
		if (($bot~parm3 <> "") and ($bot~parm3 <> ""))
				setVar $bot~corppassword $bot~parm3
		end
		if ($bot~parm1 = "drop")
			   if ($PLAYER~CURRENT_PROMPT = "Command")
					 send "txy**q*"
				 setTextLineTrigger offCorp :offCorp "Ok!  You're off the Corp"
				 setTextlineTrigger notOnCorp :notOnCorp "You are not currently in a Corporation"
				 pause
		   elseif ($PLAYER~CURRENT_PROMPT = "Citadel")
				 send "xxy*q**"
				 setTextLineTrigger offCorp :offCorp "Ok!  You're off the Corp"
				 setTextlineTrigger notOnCorp :notOnCorp "You are not currently in a Corporation"
				 pause
			   end
		elseif ($bot~parm1 = "join")
			   if ($PLAYER~CURRENT_PROMPT = "Command")
					 send "tj" $player~corpnumber "*"	
					 setTextLineTrigger onCorpAlready :onCorpAlready "You are already on a Corp silly"
		setTextTrigger joinCorp      :joinCorp      "Enter the Password to join"
					 pause
		   elseif ($PLAYER~CURRENT_PROMPT = "Citadel")
				 send "xj"
					 setTextLineTrigger onCorpAlready :onCorpAlready "You are already on a Corp silly"
				 setTextlineTrigger joinCorp      :joinCorp      "Enter the Password to join"
					 pause
			   end
		end
		send  $player~corpnumber & "*"
		setTextLineTrigger fullcorp            :fullCorp      "The Corporation is Full"
		setTextlineTrigger alignConflict       :alignConflict "Sorry, you can only join a Corporation if your alignment doesn't conflict."
		:joinCorp
			killalltriggers
			send $bot~corppassword & "*q"
			setTextlineTrigger badCorpPass         :badCorpPass "Nice try, that has been recorded by Federal Intelligence."
			setTextlineTrigger joinedCorp          :joinedCorp "Welcome Aboard"
			setTextlineTrigger joinedCorp2          :joinedCorp2 "Welcome aboard!"
			pause
		:joinedCorp
		:joinedCorp2
			killalltriggers
			setVar $SWITCHBOARD~message "I joined the Corporation and Claimed my Ship Corporate!*"
			gosub :SWITCHBOARD~switchboard
			saveVar $bot~corpPassword
			saveVar $player~corpNumber
			halt
		:offCorp
			killalltriggers
			setVar $SWITCHBOARD~message "I have removed myself from the Corporation!*"
			gosub :SWITCHBOARD~switchboard
			halt
		:notOnCorp
			killalltriggers
			setVar $SWITCHBOARD~message "I am not currently on a Corporation!*"
			gosub :SWITCHBOARD~switchboard
			halt
		:onCorpAlready
			killalltriggers
			send "q"
			setVar $SWITCHBOARD~message "I am already on a Corporation!*"
			gosub :SWITCHBOARD~switchboard
			halt
		:alignConflict
			killalltriggers
			send "q"
			setVar $SWITCHBOARD~message "My alignment currently prohibits me from joining this corporation!*"
			gosub :SWITCHBOARD~switchboard
			halt
		:badCorpPass
			killalltriggers
			send "q"
			setVar $SWITCHBOARD~message "The Corporation password was incorrect!*"
			gosub :SWITCHBOARD~switchboard
			send "*"
			halt
		:fullCorp
			killalltriggers
			send "q"
			setVar $SWITCHBOARD~message "The Corporation is FULL!*"
			gosub :SWITCHBOARD~switchboard
			halt
# ============================== End Corp Join/Drop (CORP) ==============================






# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
