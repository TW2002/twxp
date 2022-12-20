gosub :BOT~loadVars

	setvar $bot~command "switch"
	setVar $BOT~help[1]  $BOT~tab&"switch {"&#34&"trader_name"&#34&"} "
	setVar $BOT~help[2]  $BOT~tab&"     "
	setVar $BOT~help[3]  $BOT~tab&"   Switch ships with trader in citadel"
	setVar $BOT~help[4]  $BOT~tab&"     "
	setVar $BOT~help[5]  $BOT~tab&"   {"&#34&"trader_name"&#34&"} - trader's name to trade ships with"
	setVar $BOT~help[6]  $BOT~tab&"     "
	setVar $BOT~help[7]  $BOT~tab&"     Examples:"
	setVar $BOT~help[8]  $BOT~tab&"         >switch "&#34&"mind dagger"&#34&"  "
	setVar $BOT~help[9]  $BOT~tab&"         >switch mind"
	gosub :bot~helpfile

	getWordPos $bot~user_command_line $pos #34
	if ($pos > 0)
		getText $bot~user_command_line $trader_name #34 #34
		if ($trader_name = false)
			setVar $SWITCHBOARD~message "Trader name entered wrong.*"
			gosub :SWITCHBOARD~switchboard
			halt			
		end
	else
		setvar $trader_name $bot~parm1
	end

    gosub :switchships
    if ($foundSwitchShip = true)
        setvar $switchboard~message "Switched successfully!*"
    else
        setvar $switchboard~message "Could not find ship to switch with!*"
    end
    gosub :switchboard~switchboard
    halt
:switchships 
	setvar $switchto $trader_name
	:doswitch
	setvar $foundSwitchShip false
	killtrigger 1
	killtrigger 2
	setTextTrigger	1	:switchcheck	"Trade with "
	setTextTrigger	2	:switchdone 	"Citadel treasury contains "
	send " e"
	pause

	:switchcheck
		if ($foundSwitchShip = true)
			send "*"
		else
            setvar $current_line currentline
            lowercase $current_line
            lowercase $switchto
            trim $switchto
			getwordpos $current_line $pos "trade with "&$switchto
			if ($pos > 0)
				setvar $foundSwitchShip true
				send "y"
			else
				send "*"
			end		
		end
		setTextTrigger	1	:switchcheck	"Trade with "
		pause
	:switchdone
		killtrigger 1
		killtrigger 2	
return

#includes
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
