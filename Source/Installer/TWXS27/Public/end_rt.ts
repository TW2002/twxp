#Ender's Retaliation v1.0
#Will stop all scripts, and perfrom prespecified actions.

systemScript

send "'Ender's Retaliation v1.0 loaded! *"
clientMessage "Specifiy what action you would like to perform upon someone powering up, or holding you in IDC"

:info
	echo ANSI_13 & "*Would you like to attack your attacker?*"
	getInput $attack "(Y)es / (N)o"

		if ($attack = "Y") or ($attack = "y")
			goto :yattack
		end

	echo ANSI_13 & "*Would you like to xport out of your ship?*"
	getInput $xport "(Y)es / (N)o"
	
		if ($xport = "Y") or ($xport = "y")
			goto :yxport
		else
			clientMessage "You must pick an option"
			goto :info
		end

:yattack
	echo ANSI_13 & "*How many figs would you like to attack with?*"
	getInput $attackwave "Attack wave?"


	echo ANSI_13 & "*How many times would you like to attack?*"
	getInput $attacktimes "Times?"

	SetTextLineTrigger powering :powering "is powering"
	SetTextLineTrigger idc	:idc	"An Interdictor"

PAUSE

:powering
	setDelayTrigger menu_delay :conclude 500
	openMenu TWX_STOPALLFAST

:conclude
	send "ay" $attackwave "*"
	add $attacked 1
	If ($attacktimes = $attacked)
		send "'Retaliated! *"
		HALT
	end

goto :powering

:idc
	setDelayTrigger menu_delay :conclude2 500
	openMenu TWX_STOPALLFAST

:conclude2
	send "ay" $attackwave "*"
	add $attacked 1
	If ($attacktimes = $attacked)
		send "'Retaliated! *"
		HALT
	end
goto :idc

:yxport
	echo ANSI_13 & "*What ship would you like to xport to?*"
	getInput $xportnumber "Xport ship?"

	SetTextLineTrigger powering2 :powering2 "is powering"
	SetTextLineTrigger idc	:idc2	"An Interdictor"
PAUSE

:powering2
	setDelayTrigger menu_delay :conclude3 500
	openMenu TWX_STOPALLFAST

:conclude3
	send "X" $xportnumber "**"
	send "'Xported! *"
HALT

:idc2
	setDelayTrigger menu_delay :conclude4 500
	openMenu TWX_STOPALLFAST

:conclude4
	send "X" $xportnumber "**"
	send "'Xported! *"
HALT

#-------------------------------------#
#Thanks go out to Singularity and another others who helped with this script
#-------------------------------------#
	