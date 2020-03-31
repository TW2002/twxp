	gosub :BOT~loadVars
		
	setVar $BOT~help[1] $BOT~tab&"Reboot"
	setVar $BOT~help[2] $BOT~tab&"  - Kill bot and restart it"
	gosub :bot~helpfile

	setVar $i 1
	setVar $found FALSE
	setVar $rebooted FALSE
	setVar $SWITCHBOARD~message "Rebooting Mombot..*"
	gosub :SWITCHBOARD~switchboard
	setdelaytrigger waitforrebootlist :listokaynow 1500
	pause
	:listokaynow
	listActiveScripts $scripts
	while ($i <= $scripts)
		getWordPos "<><><>"&$scripts[$i] $pos "<><><>mombot"
		if ($pos > 0)
			stop $scripts[$i]
			if ($found = FALSE)
				setVar $boot_this $scripts[$i]
				setVar $found TRUE
			end
		end
		add $i 1
	end
	if ($FOUND = FALSE)
		setVar $SWITCHBOARD~message "No mombot script found to reboot.*"
		gosub :SWITCHBOARD~switchboard
	end
	setdelaytrigger waitforreboot :okaynow 3000
	pause
	:okaynow
	load "scripts\mombot\"&$boot_this
	halt





#INCLUDES:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
