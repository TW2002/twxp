#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planethaggle~planetneg
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $planethaggle~output_file ""
setvar $planethaggle~selldelay 0
setvar $planethaggle~oremcic "-90"
setvar $planethaggle~orgmcic "-75"
setvar $planethaggle~equmcic "-65"
setvar $planethaggle~version "3.0.0"
setvar $planethaggle~startinglocation $player~current_prompt
setvar $planethaggle~oreprofit 0
setvar $planethaggle~orgprofit 0
setvar $planethaggle~equprofit 0
setvar $planethaggle~profit 0
setvar $planethaggle~sellhagglesucceeded false
setvar $planethaggle~restore_messages false
setvar $planethaggle~messages_silenced false

:planethaggle~verifyprompt
if (($planethaggle~startinglocation <> "Citadel") and ($planethaggle~startinglocation <> "Planet"))
	setvar $planethaggle~exit_message "Must start at Citadel or Planet Prompt for Planet Nego"
	goto :exitneg
end

setvar $planethaggle~_ck_ptradesetting $game~ptradesetting
setvar $planethaggle~quantityunknown 0

if ($planethaggle~startinglocation = "Citadel")
	send "Q"
elseif ($planethaggle~startinglocation = "Planet ")
	setvar $planethaggle~startinglocation "Planet"
end
gosub :planet~getplanetinfo
send "Q"
gosub :player~getinfo
send "*"

if ($planethaggle~hasprods = 0)
	gosub :port~getportinfo
	if ($port~foundport = false)
		gosub :negotiateland
		setvar $planethaggle~exit_message "No port to sell to"
		goto :exitneg
	end
end

:planethaggle~initinfo
if ($player~turns <= 0)
	gosub :negotiateland
	setvar $planethaggle~exit_message "I have no turns to negotiate this planet"
	goto :exitneg
end
if ($player~credits > 900000000)
	gosub :negotiateland
	setvar $planethaggle~exit_message "I have too much cash on hand"
	goto :exitneg
end

if ($planethaggle~_ck_pnego_fueltosell = "-1")
	setvar $planethaggle~fueltosell 0
elseif ($planethaggle~_ck_pnego_fueltosell = "max")
	setvar $planethaggle~fueltosell $planet~planetfuel
else
	setvar $planethaggle~fueltosell $planethaggle~_ck_pnego_fueltosell

end
if ($planethaggle~fueltosell > $planet~planetfuel)
	setvar $planethaggle~fueltosell $planet~planetfuel
end

if ($planethaggle~_ck_pnego_orgtosell = "-1")
	setvar $planethaggle~orgtosell 0
elseif ($planethaggle~_ck_pnego_orgtosell = "max")
	setvar $planethaggle~orgtosell $planet~planetorg
else
	setvar $planethaggle~orgtosell $planethaggle~_ck_pnego_orgtosell

end
if ($planethaggle~orgtosell > $planet~planetorg)
	setvar $planethaggle~orgtosell $planet~planetorg
end

if ($planethaggle~_ck_pnego_equiptosell = "-1")
	setvar $planethaggle~equiptosell 0
elseif ($planethaggle~_ck_pnego_equiptosell = "max")
	setvar $planethaggle~equiptosell $planet~planetequip
else
	setvar $planethaggle~equiptosell $planethaggle~_ck_pnego_equiptosell

end
if ($planethaggle~equiptosell > $planet~planetequip)
	setvar $planethaggle~equiptosell $planet~planetequip
end

if (($port~orebuying <> "Buying") or ($port~orepercent < 15))
	setvar $planethaggle~fueltosell 0
end
if (($port~orgbuying <> "Buying") or ($port~orgpercent < 15))
	setvar $planethaggle~orgtosell 0
end
if (($port~equbuying <> "Buying") or ($port~equpercent < 15))
	setvar $planethaggle~equiptosell 0
end

:planethaggle~selloff
if (($planethaggle~fueltosell <> 0) or ($planethaggle~orgtosell <> 0) or ($planethaggle~equiptosell <> 0))
	setvar $planethaggle~ore_sell_failures 0
	setvar $planethaggle~org_sell_failures 0
	setvar $planethaggle~equ_sell_failures 0
	setvar $planethaggle~oreselloutput ""
	setvar $planethaggle~orgselloutput ""
	setvar $planethaggle~equselloutput ""
	setvar $planethaggle~oreprofit 0
	setvar $planethaggle~orgprofit 0
	setvar $planethaggle~equprofit 0
	setvar $planethaggle~profit 0
	setvar $planethaggle~sellhagglesucceeded false

	gosub :planethaggle~msgs_off
	gosub :sell
	gosub :negotiateland
	if ($planethaggle~startinglocation = "Citadel")

		if ($planethaggle~oreprofit <> 0)
			send "TT"&$planethaggle~oreprofit&"*"
			subtract $player~credits $planethaggle~oreprofit
		end
		if ($planethaggle~orgprofit <> 0)
			send "TT"&$planethaggle~orgprofit&"*"
			subtract $player~credits $planethaggle~orgprofit
		end
		if ($planethaggle~equprofit <> 0)
			send "TT"&$planethaggle~equprofit&"*"
			subtract $player~credits $planethaggle~equprofit
		end
	end

	if ($planethaggle~restore_messages = true)
		gosub :planethaggle~msgs_on
	end

	setvar $planethaggle~generaloutput "*Sector "&$player~current_sector&"*"
	if ($planethaggle~output_file <> "")
		write $planethaggle~output_file $planethaggle~generaloutput
	end

	if ($planethaggle~oreselloutput <> "")

		setvar $switchboard~message "  *"&$planethaggle~oreselloutput
		if ($switchboard~self_command <> true)
			setvar $switchboard~self_command 2
		end

		if ($planethaggle~output_file <> "")
			write $planethaggle~output_file $planethaggle~oreselloutput
		end
	end
	if ($planethaggle~orgselloutput <> "")

		setvar $switchboard~message "  *"&$planethaggle~orgselloutput
		if ($switchboard~self_command <> true)
			setvar $switchboard~self_command 2
		end

		if ($planethaggle~output_file <> "")
			write $planethaggle~output_file $planethaggle~orgselloutput
		end
	end
	if ($planethaggle~equselloutput <> "")

		setvar $switchboard~message "  *"&$planethaggle~equselloutput
		if ($switchboard~self_command <> true)
			setvar $switchboard~self_command 2
		end

		if ($planethaggle~output_file <> "")
			write $planethaggle~output_file $planethaggle~equselloutput
		end
	end
	#setvar $planethaggle~exit_message "Done with port"
	goto :exitneg
else
	gosub :negotiateland
	setvar $planethaggle~exit_message "Nothing to sell"
	goto :exitneg
end

:planethaggle~sell
:planethaggle~resell
if ($player~turns <= 0)
	send "'I'm out of turns*"
	return
end
setvar $planethaggle~thisorefailed 0
setvar $planethaggle~thisorgfailed 0
setvar $planethaggle~thisequfailed 0
if ($planethaggle~fueltosell > 0)
	setvar $planethaggle~attemptore 1
	setvar $planethaggle~attemptoreconfirmed 0
end
if ($planethaggle~orgtosell > 0)
	setvar $planethaggle~attemptorg 1
	setvar $planethaggle~attemptorgconfirmed 0
end
if ($planethaggle~equiptosell > 0)
	setvar $planethaggle~attemptequ 1
	setvar $planethaggle~attemptequconfirmed 0
end
isnumber $planethaggle~number $planet~planet
setvar $planethaggle~findplanet 0
if ($planethaggle~number = 0)
	send "PN"
	setvar $planethaggle~findplanet 1
else
	send "PN"
end

subtract $player~turns 1

:planethaggle~getpercts
settextlinetrigger orepct :orepct "Fuel Ore   Buying"
settextlinetrigger orgpct :orgpct "Organics   Buying"
settextlinetrigger equpct :equpct "Equipment  Buying"
settextlinetrigger gotpercts :gotpercts "Registry# and Planet Name"
pause

:planethaggle~orepct
killtrigger orepct
killtrigger orgpct
killtrigger equpct
killtrigger gotpercts
getword currentline $port~oretrading 4
getword currentline $port~orepercent 5
striptext $port~orepercent "%"
if ($port~orepercent < 100)
	add $port~orepercent 1
end
goto :getpercts

:planethaggle~orgpct
killtrigger orepct
killtrigger orgpct
killtrigger equpct
killtrigger gotpercts
getword currentline $port~orgtrading 3
getword currentline $port~orgpercent 4
striptext $port~orgpercent "%"
if ($port~orgpercent < 100)
	add $port~orgpercent 1
end
goto :getpercts

:planethaggle~equpct
killtrigger orepct
killtrigger orgpct
killtrigger equpct
killtrigger gotpercts
getword currentline $port~equtrading 3
getword currentline $port~equpercent 4
striptext $port~equpercent "%"
if ($port~equpercent < 100)
	add $port~equpercent 1
end
goto :getpercts

:planethaggle~gotpercts
isnumber $planethaggle~test1 $port~oretrading
isnumber $planethaggle~test2 $port~orepercent
if (($planethaggle~test1 = 0) or ($planethaggle~test2 = 0))
	send "'DEBUG: NAN on oretrading:"&$planethaggle~test1&" orepercent:" $planethaggle~test2 "*"
	setvar $port~orepercent 1
	setvar $port~oretrading 1
end
isnumber $planethaggle~test3 $port~orgtrading
isnumber $planethaggle~test4 $port~orgpercent
if (($planethaggle~test3 = 0) or ($planethaggle~test4 = 0))
	send "'DEBUG: NAN on orgtrading:"&$planethaggle~test3&" orgpercent:" $planethaggle~test4 "*"
	setvar $port~orgpercent 1
	setvar $port~orgtrading 1
end

isnumber $planethaggle~test5 $port~equtrading
isnumber $planethaggle~test6 $port~equpercent
if (($planethaggle~test5 = 0) or ($planethaggle~test6 = 0))
	send "'DEBUG: NAN on equtrading:"&$planethaggle~test5&" equpercent:" $planethaggle~test6 "*"
	setvar $port~equpercent 1
	setvar $port~equtrading 1
end
killtrigger orepct
killtrigger orgpct
killtrigger equpct
killtrigger gotpercts
if ($planethaggle~findplanet = 1)
	settextlinetrigger planetnum :planetnum "> "&$planet~planet
	setdelaytrigger noplanetnum :noplanetnum 3000
	pause

	:planethaggle~noplanetnum
	killalltriggers
	setvar $planethaggle~exit_message "Could not determine port number!"
	send "q*"
	goto :exitneg

	:planethaggle~planetnum
	killtrigger planetnum
	killtrigger noplanetnum
	getword currentline $planet~planet 1
	striptext $planet~planet ">"
	send $planet~planet "*"
else
	send $planet~planet "*"
end

:planethaggle~sellproduct
settexttrigger sellfuel :sellfuel "How many units of Fuel Ore"
settexttrigger sellorg :sellorg "How many units of Organics"
settexttrigger sellequ :sellequ "How many units of Equipment"
settexttrigger donewithport :donewithport "Command [TL="
killtrigger notours
settexttrigger notours :notours "You don't own that planet!  Were you expecting us to invade it?"
pause

:planethaggle~notours
send "*"
setvar $planethaggle~exit_message "We don't own this planet!"
pause

:planethaggle~sellfuel
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger donewithport
if ($planethaggle~quantityunknown = 1)
	getword currentline $planethaggle~fueltosell 12
	striptext $planethaggle~fueltosell "["
	striptext $planethaggle~fueltosell "]"
	striptext $planethaggle~fueltosell "?"
end

isnumber $planethaggle~test $planethaggle~fueltosell
if ($planethaggle~test = 0)
	send "'DEBUG: NAN on fueltosell:"&$planethaggle~fueltosell "*"
	setvar $planethaggle~fueltosell 0
end
if (($port~orepercent >= 15) and ($planethaggle~fueltosell > 0))
	if ($planethaggle~fueltosell > $port~oretrading)
		setvar $planethaggle~fueltosell $port~oretrading
	end
	setvar $planethaggle~attemptoreconfirmed 1
	setvar $planethaggle~prodtosell "ore"
	setvar $planethaggle~portbuying $planethaggle~fueltosell
	gosub :sellhaggle
	if ($planethaggle~currenthaggle = "succeeded")
		setvar $planethaggle~orehaggle "succeeded"
		setvar $planethaggle~fueltosell 0
	else
		setvar $planethaggle~orehaggle "failed"
	end
else
	send "az0*"
	setvar $planethaggle~fueltosell 0
end
goto :sellproduct

:planethaggle~sellorg
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger donewithport
if ($planethaggle~quantityunknown = 1)
	getword currentline $planethaggle~orgtosell 11
	striptext $planethaggle~orgtosell "["
	striptext $planethaggle~orgtosell "]"
	striptext $planethaggle~orgtosell "?"
end

isnumber $planethaggle~test $planethaggle~orgtosell
if ($planethaggle~test = 0)
	send "'DEBUG: NAN on orgtosell:"&$planethaggle~orgtosell "*"
	setvar $planethaggle~orgtosell 0
end
if (($port~orgpercent >= 15) and ($planethaggle~orgtosell > 0))
	if ($planethaggle~orgtosell > $port~orgtrading)
		setvar $planethaggle~orgtosell $port~orgtrading
	end
	setvar $planethaggle~attemptorgconfirmed 1
	setvar $planethaggle~prodtosell "org"
	setvar $planethaggle~portbuying $planethaggle~orgtosell
	gosub :sellhaggle
	if ($planethaggle~currenthaggle = "succeeded")
		setvar $planethaggle~orghaggle "succeeded"
		setvar $planethaggle~orgtosell 0
	else
		setvar $planethaggle~orghaggle "failed"
	end
else
	send "az0*"
	setvar $planethaggle~orgtosell 0
end
goto :sellproduct

:planethaggle~sellequ
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger donewithport
if ($planethaggle~quantityunknown = 1)
	getword currentline $planethaggle~equiptosell 11
	striptext $planethaggle~equiptosell "["
	striptext $planethaggle~equiptosell "]"
	striptext $planethaggle~equiptosell "?"
end

isnumber $planethaggle~test $planethaggle~equiptosell
if ($planethaggle~test = 0)
	send "'DEBUG: NAN on equiptosell:"&$planethaggle~equiptosell "*"
	setvar $planethaggle~equiptosell 0
end
if (($port~equpercent >= 15) and ($planethaggle~equiptosell > 0))
	if ($planethaggle~equiptosell > $port~equtrading)
		setvar $planethaggle~equiptosell $port~equtrading
	end
	setvar $planethaggle~attemptequconfirmed 1
	setvar $planethaggle~prodtosell "equ"
	setvar $planethaggle~portbuying $planethaggle~equiptosell
	gosub :sellhaggle
	if ($planethaggle~currenthaggle = "succeeded")
		setvar $planethaggle~equhaggle "succeeded"
		setvar $planethaggle~equiptosell 0
	else
		setvar $planethaggle~equhaggle "failed"
	end
else
	send "az0*"
	setvar $planethaggle~equiptosell 0
end
goto :sellproduct

:planethaggle~donewithport
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger donewithport

if (($planethaggle~attemptore = 1) and ($planethaggle~attemptoreconfirmed = 0))

	setvar $planethaggle~fueltosell 0
end
if (($planethaggle~attemptorg = 1) and ($planethaggle~attemptorgconfirmed = 0))
	setvar $planethaggle~orgtosell 0
end
if (($planethaggle~attemptequ = 1) and ($planethaggle~attemptequconfirmed = 0))
	setvar $planethaggle~equiptosell 0
end

if (($planethaggle~ore_sell_failures > 1) or ($planethaggle~org_sell_failures > 4) or ($planethaggle~equ_sell_failures > 4))
	setvar $planethaggle~selloutput $planethaggle~selloutput&"Multiple Haggle Failures - Please cut and paste this haggling session and email to Cherokee*"
	return
elseif (($planethaggle~fueltosell = 0) and (($planethaggle~orgtosell = 0) and ($planethaggle~equiptosell = 0)))
	if (($planethaggle~attemptoreconfirmed = 0) and (($planethaggle~attemptorgconfirmed = 0) and ($planethaggle~attemptequconfirmed = 0)))
		setvar $planethaggle~exit_message "Nothing to sell here!"
	end
	return
else
	goto :resell
end

:planethaggle~sellhaggle
if (haggle)
	goto :planethaggle~sellhagglenative
end

killalltriggers
settextlinetrigger sellfirstoffer :sellfirstoffer "We'll buy them for"
send "az"&$planethaggle~portbuying&"*"
pause

:planethaggle~sellhagglenative
setvar $planethaggle~currenthaggle "pending"
setvar $planethaggle~oldcredits $player~credits
setvar $planethaggle~mcic ""
send $planethaggle~portbuying&"*"

:planethaggle~sellhagglenativewait
killalltriggers
settextlinetrigger nativesellexperience :planethaggle~nativesellexperience "experience point(s)"
settextlinetrigger nativesellyouhave :planethaggle~nativesellyouhave "You have"
settextlinetrigger nativesellnotinterested :planethaggle~nativesellnotinterested "We're not interested."
settextlinetrigger nativesellprompt :planethaggle~nativesellprompt "Command [TL="
pause

:planethaggle~nativesellexperience
killalltriggers
getword currentline $planethaggle~exp_bonus 7
isnumber $planethaggle~testexp $planethaggle~exp_bonus
if ($planethaggle~testexp <> 0)
	add $planethaggle~experience $planethaggle~exp_bonus
end
goto :planethaggle~sellhagglenativewait

:planethaggle~nativesellyouhave
killalltriggers
getword currentline $planethaggle~credits 3
striptext $planethaggle~credits ","
isnumber $planethaggle~testcredits $planethaggle~credits
if ($planethaggle~testcredits = 0)
	goto :planethaggle~sellhagglenativewait
end
getword currentline $planethaggle~creditlabel 4
if ($planethaggle~creditlabel <> "credits.")
	goto :planethaggle~sellhagglenativewait
end
setvar $planethaggle~counter $planethaggle~credits
subtract $planethaggle~counter $planethaggle~oldcredits
setvar $player~credits $planethaggle~credits
if ($planethaggle~counter <= 0)
	setvar $planethaggle~currenthaggle "failed"
	goto :sellhagglefailed
end
setvar $planethaggle~currenthaggle "succeeded"
setvar $planethaggle~mcic $haggle~mcic
gosub :planethaggle~loadnativemcic
goto :sellhagglesucceeded

:planethaggle~nativesellnotinterested
killalltriggers
setvar $planethaggle~currenthaggle "failed"
goto :sellhagglefailed

:planethaggle~nativesellprompt
killalltriggers
if ($planethaggle~currenthaggle <> "succeeded")
	if ($haggle~abort <> 1)
		setvar $planethaggle~credits $haggle~credits
		isnumber $planethaggle~testcredits $planethaggle~credits
		if ($planethaggle~testcredits <> 0)
			setvar $planethaggle~counter $planethaggle~credits
			subtract $planethaggle~counter $planethaggle~oldcredits
			if ($planethaggle~counter > 0)
				setvar $player~credits $planethaggle~credits
				setvar $planethaggle~currenthaggle "succeeded"
				setvar $planethaggle~mcic $haggle~mcic
				gosub :planethaggle~loadnativemcic
				goto :sellhagglesucceeded
			end
		end
	end
	setvar $planethaggle~currenthaggle "failed"
	goto :sellhagglefailed
end
return

:planethaggle~loadnativemcic
isnumber $planethaggle~mcicvalid $planethaggle~mcic
if ($planethaggle~mcicvalid = 0)
	if ($planethaggle~prodtosell = "ore")
		getsectorparameter $player~current_sector "OREMCIC" $planethaggle~mcic
	elseif ($planethaggle~prodtosell = "org")
		getsectorparameter $player~current_sector "ORGMCIC" $planethaggle~mcic
	elseif ($planethaggle~prodtosell = "equ")
		getsectorparameter $player~current_sector "EQUMCIC" $planethaggle~mcic
	end
	isnumber $planethaggle~mcicvalid $planethaggle~mcic
end
if ($planethaggle~mcicvalid = 0)
	if ($planethaggle~prodtosell = "ore")
		setvar $planethaggle~mcic $planethaggle~oremcic
	elseif ($planethaggle~prodtosell = "org")
		setvar $planethaggle~mcic $planethaggle~orgmcic
	elseif ($planethaggle~prodtosell = "equ")
		setvar $planethaggle~mcic $planethaggle~equmcic
	end
	isnumber $planethaggle~mcicvalid $planethaggle~mcic
end
if ($planethaggle~mcicvalid <> 0)
	if ($planethaggle~prodtosell = "ore")
		setvar $planethaggle~oremcic $planethaggle~mcic
		setsectorparameter $player~current_sector "OREMCIC" $planethaggle~mcic
	elseif ($planethaggle~prodtosell = "org")
		setvar $planethaggle~orgmcic $planethaggle~mcic
		setsectorparameter $player~current_sector "ORGMCIC" $planethaggle~mcic
	elseif ($planethaggle~prodtosell = "equ")
		setvar $planethaggle~equmcic $planethaggle~mcic
		setsectorparameter $player~current_sector "EQUMCIC" $planethaggle~mcic
	end
end
return

:planethaggle~sellfirstoffer
killtrigger sellfirstoffer
getword currentline $planethaggle~offer 5
striptext $planethaggle~offer ","

gosub :player~swathoff
if ($player~swathoff = false)
	gosub :negotiateland
	setvar $planethaggle~exit_message $player~swathoffmessage
	goto :exitneg
end

setvar $planethaggle~perunitinitoffer $planethaggle~offer
multiply $planethaggle~perunitinitoffer 100
divide $planethaggle~perunitinitoffer $planethaggle~_ck_ptradesetting
multiply $planethaggle~perunitinitoffer 100
divide $planethaggle~perunitinitoffer $planethaggle~portbuying
setvar $planethaggle~portmaxinit $planethaggle~perunitinitoffer
divide $planethaggle~perunitinitoffer 10

if ($planethaggle~prodtosell = "ore")
	setvar $planethaggle~basevalue 256055800
	setvar $planethaggle~basepercent 11725
	setvar $planethaggle~basepercentinverse 88275
	setvar $planethaggle~percentfrombase $port~orepercent
elseif ($planethaggle~prodtosell = "org")
	setvar $planethaggle~basevalue 506276400
	setvar $planethaggle~basepercent 11287
	setvar $planethaggle~basepercentinverse 88713
	setvar $planethaggle~percentfrombase $port~orgpercent
elseif ($planethaggle~prodtosell = "equ")
	setvar $planethaggle~basevalue 906281000
	setvar $planethaggle~basepercent 10989
	setvar $planethaggle~basepercentinverse 89010
	setvar $planethaggle~percentfrombase $port~equpercent
end

if ($planethaggle~percentfrombase = 100)
	divide $planethaggle~portmaxinit 10
elseif ($planethaggle~percentfrombase >= 15)
	multiply $planethaggle~portmaxinit 100000
	subtract $planethaggle~portmaxinit $planethaggle~basevalue
	multiply $planethaggle~percentfrombase 1000
	subtract $planethaggle~percentfrombase $planethaggle~basepercent
	divide $planethaggle~portmaxinit $planethaggle~percentfrombase
	multiply $planethaggle~portmaxinit $planethaggle~basepercentinverse
	add $planethaggle~portmaxinit $planethaggle~basevalue
	divide $planethaggle~portmaxinit 1000000
elseif ($planethaggle~prodtosell = "ore")
	setvar $planethaggle~portmaxinit 340
elseif ($planethaggle~prodtosell = "org")
	setvar $planethaggle~portmaxinit 635
elseif ($planethaggle~prodtosell = "equ")
	setvar $planethaggle~portmaxinit 1063
end

if ($planethaggle~prodtosell = "ore")
	if ($planethaggle~portmaxinit >= 436)
		setvar $planethaggle~mcic "-90"
		setvar $planethaggle~multiple 1494
	elseif ($planethaggle~portmaxinit >= 434)
		setvar $planethaggle~mcic "-89"
		setvar $planethaggle~multiple 1488
	elseif ($planethaggle~portmaxinit >= 433)
		setvar $planethaggle~mcic "-88"
		setvar $planethaggle~multiple 1482
	elseif ($planethaggle~portmaxinit >= 431)
		setvar $planethaggle~mcic "-87"
		setvar $planethaggle~multiple 1476
	elseif ($planethaggle~portmaxinit >= 429)
		setvar $planethaggle~mcic "-86"
		setvar $planethaggle~multiple 1470
	elseif ($planethaggle~portmaxinit >= 427)
		setvar $planethaggle~mcic "-85"
		setvar $planethaggle~multiple 1464
	elseif ($planethaggle~portmaxinit >= 425)
		setvar $planethaggle~mcic "-84"
		setvar $planethaggle~multiple 1458
	elseif ($planethaggle~portmaxinit >= 424)
		setvar $planethaggle~mcic "-83"
		setvar $planethaggle~multiple 1452
	elseif ($planethaggle~portmaxinit >= 422)
		setvar $planethaggle~mcic "-82"
		setvar $planethaggle~multiple 1446
	elseif ($planethaggle~portmaxinit >= 420)
		setvar $planethaggle~mcic "-81"
		setvar $planethaggle~multiple 1440
	elseif ($planethaggle~portmaxinit >= 418)
		setvar $planethaggle~mcic "-80"
		setvar $planethaggle~multiple 1434
	elseif ($planethaggle~portmaxinit >= 416)
		setvar $planethaggle~mcic "-79"
		setvar $planethaggle~multiple 1428
	elseif ($planethaggle~portmaxinit >= 414)
		setvar $planethaggle~mcic "-78"
		setvar $planethaggle~multiple 1423
	elseif ($planethaggle~portmaxinit >= 412)
		setvar $planethaggle~mcic "-77"
		setvar $planethaggle~multiple 1417
	elseif ($planethaggle~portmaxinit >= 411)
		setvar $planethaggle~mcic "-76"
		setvar $planethaggle~multiple 1411
	elseif ($planethaggle~portmaxinit >= 409)
		setvar $planethaggle~mcic "-75"
		setvar $planethaggle~multiple 1405
	elseif ($planethaggle~portmaxinit >= 407)
		setvar $planethaggle~mcic "-74"
		setvar $planethaggle~multiple 1399
	elseif ($planethaggle~portmaxinit >= 405)
		setvar $planethaggle~mcic "-73"
		setvar $planethaggle~multiple 1393
	elseif ($planethaggle~portmaxinit >= 403)
		setvar $planethaggle~mcic "-72"
		setvar $planethaggle~multiple 1387
	elseif ($planethaggle~portmaxinit >= 401)
		setvar $planethaggle~mcic "-71"
		setvar $planethaggle~multiple 1381
	elseif ($planethaggle~portmaxinit >= 399)
		setvar $planethaggle~mcic "-70"
		setvar $planethaggle~multiple 1375
	elseif ($planethaggle~portmaxinit >= 397)
		setvar $planethaggle~mcic "-69"
		setvar $planethaggle~multiple 1369
	elseif ($planethaggle~portmaxinit >= 396)
		setvar $planethaggle~mcic "-68"
		setvar $planethaggle~multiple 1363
	elseif ($planethaggle~portmaxinit >= 394)
		setvar $planethaggle~mcic "-67"
		setvar $planethaggle~multiple 1357
	elseif ($planethaggle~portmaxinit >= 392)
		setvar $planethaggle~mcic "-66"
		setvar $planethaggle~multiple 1351
	elseif ($planethaggle~portmaxinit >= 390)
		setvar $planethaggle~mcic "-65"
		setvar $planethaggle~multiple 1345
	elseif ($planethaggle~portmaxinit >= 388)
		setvar $planethaggle~mcic "-64"
		setvar $planethaggle~multiple 1341
	elseif ($planethaggle~portmaxinit >= 386)
		setvar $planethaggle~mcic "-63"
		setvar $planethaggle~multiple 1336
	elseif ($planethaggle~portmaxinit >= 384)
		setvar $planethaggle~mcic "-62"
		setvar $planethaggle~multiple 1330
	elseif ($planethaggle~portmaxinit >= 382)
		setvar $planethaggle~mcic "-61"
		setvar $planethaggle~multiple 1324
	elseif ($planethaggle~portmaxinit >= 380)
		setvar $planethaggle~mcic "-60"
		setvar $planethaggle~multiple 1318
	elseif ($planethaggle~portmaxinit >= 378)
		setvar $planethaggle~mcic "-59"
		setvar $planethaggle~multiple 1312
	elseif ($planethaggle~portmaxinit >= 376)
		setvar $planethaggle~mcic "-58"
		setvar $planethaggle~multiple 1306
	elseif ($planethaggle~portmaxinit >= 374)
		setvar $planethaggle~mcic "-57"
		setvar $planethaggle~multiple 1300
	elseif ($planethaggle~portmaxinit >= 372)
		setvar $planethaggle~mcic "-56"
		setvar $planethaggle~multiple 1294
	elseif ($planethaggle~portmaxinit >= 370)
		setvar $planethaggle~mcic "-55"
		setvar $planethaggle~multiple 1291
	elseif ($planethaggle~portmaxinit >= 368)
		setvar $planethaggle~mcic "-54"
		setvar $planethaggle~multiple 1285
	elseif ($planethaggle~portmaxinit >= 366)
		setvar $planethaggle~mcic "-53"
		setvar $planethaggle~multiple 1279
	elseif ($planethaggle~portmaxinit >= 364)
		setvar $planethaggle~mcic "-52"
		setvar $planethaggle~multiple 1273
	elseif ($planethaggle~portmaxinit >= 362)
		setvar $planethaggle~mcic "-51"
		setvar $planethaggle~multiple 1267
	elseif ($planethaggle~portmaxinit >= 360)
		setvar $planethaggle~mcic "-50"
		setvar $planethaggle~multiple 1261
	elseif ($planethaggle~portmaxinit >= 358)
		setvar $planethaggle~mcic "-49"
		setvar $planethaggle~multiple 1255
	elseif ($planethaggle~portmaxinit >= 356)
		setvar $planethaggle~mcic "-48"
		setvar $planethaggle~multiple 1249
	elseif ($planethaggle~portmaxinit >= 354)
		setvar $planethaggle~mcic "-46"
		setvar $planethaggle~multiple 1246
	elseif ($planethaggle~portmaxinit >= 352)
		setvar $planethaggle~mcic "-46"
		setvar $planethaggle~multiple 1240
	elseif ($planethaggle~portmaxinit >= 350)
		setvar $planethaggle~mcic "-45"
		setvar $planethaggle~multiple 1234
	elseif ($planethaggle~portmaxinit >= 348)
		setvar $planethaggle~mcic "-44"
		setvar $planethaggle~multiple 1228
	elseif ($planethaggle~portmaxinit >= 346)
		setvar $planethaggle~mcic "-43"
		setvar $planethaggle~multiple 1222
	elseif ($planethaggle~portmaxinit >= 344)
		setvar $planethaggle~mcic "-42"
		setvar $planethaggle~multiple 1219
	elseif ($planethaggle~portmaxinit >= 342)
		setvar $planethaggle~mcic "-41"
		setvar $planethaggle~multiple 1209
	elseif ($planethaggle~portmaxinit >= 340)
		setvar $planethaggle~mcic "-40"
		setvar $planethaggle~multiple 1208
	else
		setvar $planethaggle~mcic 0
		setvar $planethaggle~multiple 1208
	end
elseif ($planethaggle~prodtosell = "org")
	if ($planethaggle~portmaxinit >= 813)
		setvar $planethaggle~mcic "-75"
		setvar $planethaggle~multiple 1405
	elseif ($planethaggle~portmaxinit >= 810)
		setvar $planethaggle~mcic "-74"
		setvar $planethaggle~multiple 1399
	elseif ($planethaggle~portmaxinit >= 806)
		setvar $planethaggle~mcic "-73"
		setvar $planethaggle~multiple 1393
	elseif ($planethaggle~portmaxinit >= 802)
		setvar $planethaggle~mcic "-72"
		setvar $planethaggle~multiple 1387
	elseif ($planethaggle~portmaxinit >= 798)
		setvar $planethaggle~mcic "-71"
		setvar $planethaggle~multiple 1381
	elseif ($planethaggle~portmaxinit >= 795)
		setvar $planethaggle~mcic "-70"
		setvar $planethaggle~multiple 1375
	elseif ($planethaggle~portmaxinit >= 791)
		setvar $planethaggle~mcic "-69"
		setvar $planethaggle~multiple 1369
	elseif ($planethaggle~portmaxinit >= 787)
		setvar $planethaggle~mcic "-68"
		setvar $planethaggle~multiple 1363
	elseif ($planethaggle~portmaxinit >= 783)
		setvar $planethaggle~mcic "-67"
		setvar $planethaggle~multiple 1357
	elseif ($planethaggle~portmaxinit >= 779)
		setvar $planethaggle~mcic "-66"
		setvar $planethaggle~multiple 1351
	elseif ($planethaggle~portmaxinit >= 775)
		setvar $planethaggle~mcic "-65"
		setvar $planethaggle~multiple 1345
	elseif ($planethaggle~portmaxinit >= 772)
		setvar $planethaggle~mcic "-64"
		setvar $planethaggle~multiple 1339
	elseif ($planethaggle~portmaxinit >= 768)
		setvar $planethaggle~mcic "-63"
		setvar $planethaggle~multiple 1336
	elseif ($planethaggle~portmaxinit >= 764)
		setvar $planethaggle~mcic "-62"
		setvar $planethaggle~multiple 1330
	elseif ($planethaggle~portmaxinit >= 760)
		setvar $planethaggle~mcic "-61"
		setvar $planethaggle~multiple 1324
	elseif ($planethaggle~portmaxinit >= 756)
		setvar $planethaggle~mcic "-60"
		setvar $planethaggle~multiple 1318
	elseif ($planethaggle~portmaxinit >= 752)
		setvar $planethaggle~mcic "-59"
		setvar $planethaggle~multiple 1312
	elseif ($planethaggle~portmaxinit >= 748)
		setvar $planethaggle~mcic "-58"
		setvar $planethaggle~multiple 1306
	elseif ($planethaggle~portmaxinit >= 744)
		setvar $planethaggle~mcic "-57"
		setvar $planethaggle~multiple 1300
	elseif ($planethaggle~portmaxinit >= 740)
		setvar $planethaggle~mcic "-56"
		setvar $planethaggle~multiple 1294
	elseif ($planethaggle~portmaxinit >= 737)
		setvar $planethaggle~mcic "-55"
		setvar $planethaggle~multiple 1291
	elseif ($planethaggle~portmaxinit >= 733)
		setvar $planethaggle~mcic "-54"
		setvar $planethaggle~multiple 1285
	elseif ($planethaggle~portmaxinit >= 729)
		setvar $planethaggle~mcic "-53"
		setvar $planethaggle~multiple 1279
	elseif ($planethaggle~portmaxinit >= 725)
		setvar $planethaggle~mcic "-52"
		setvar $planethaggle~multiple 1273
	elseif ($planethaggle~portmaxinit >= 721)
		setvar $planethaggle~mcic "-51"
		setvar $planethaggle~multiple 1267
	elseif ($planethaggle~portmaxinit >= 717)
		setvar $planethaggle~mcic "-50"
		setvar $planethaggle~multiple 1261
	elseif ($planethaggle~portmaxinit >= 713)
		setvar $planethaggle~mcic "-49"
		setvar $planethaggle~multiple 1255
	elseif ($planethaggle~portmaxinit >= 709)
		setvar $planethaggle~mcic "-48"
		setvar $planethaggle~multiple 1252
	elseif ($planethaggle~portmaxinit >= 705)
		setvar $planethaggle~mcic "-47"
		setvar $planethaggle~multiple 1246
	elseif ($planethaggle~portmaxinit >= 701)
		setvar $planethaggle~mcic "-46"
		setvar $planethaggle~multiple 1236
	elseif ($planethaggle~portmaxinit >= 697)
		setvar $planethaggle~mcic "-45"
		setvar $planethaggle~multiple 1233
	elseif ($planethaggle~portmaxinit >= 693)
		setvar $planethaggle~mcic "-44"
		setvar $planethaggle~multiple 1227
	elseif ($planethaggle~portmaxinit >= 688)
		setvar $planethaggle~mcic "-43"
		setvar $planethaggle~multiple 1224
	elseif ($planethaggle~portmaxinit >= 684)
		setvar $planethaggle~mcic "-42"
		setvar $planethaggle~multiple 1214
	elseif ($planethaggle~portmaxinit >= 680)
		setvar $planethaggle~mcic "-41"
		setvar $planethaggle~multiple 1213
	elseif ($planethaggle~portmaxinit >= 676)
		setvar $planethaggle~mcic "-40"
		setvar $planethaggle~multiple 1203
	elseif ($planethaggle~portmaxinit >= 672)
		setvar $planethaggle~mcic "-39"
		setvar $planethaggle~multiple 1200
	elseif ($planethaggle~portmaxinit >= 668)
		setvar $planethaggle~mcic "-38"
		setvar $planethaggle~multiple 1194
	elseif ($planethaggle~portmaxinit >= 664)
		setvar $planethaggle~mcic "-37"
		setvar $planethaggle~multiple 1191
	elseif ($planethaggle~portmaxinit >= 660)
		setvar $planethaggle~mcic "-36"
		setvar $planethaggle~multiple 1181
	elseif ($planethaggle~portmaxinit >= 656)
		setvar $planethaggle~mcic "-35"
		setvar $planethaggle~multiple 1178
	elseif ($planethaggle~portmaxinit >= 651)
		setvar $planethaggle~mcic "-34"
		setvar $planethaggle~multiple 1172
	elseif ($planethaggle~portmaxinit >= 647)
		setvar $planethaggle~mcic "-33"
		setvar $planethaggle~multiple 1166
	elseif ($planethaggle~portmaxinit >= 643)
		setvar $planethaggle~mcic "-32"
		setvar $planethaggle~multiple 1160
	elseif ($planethaggle~portmaxinit >= 639)
		setvar $planethaggle~mcic "-31"
		setvar $planethaggle~multiple 1157
	elseif ($planethaggle~portmaxinit >= 635)
		setvar $planethaggle~mcic "-30"
		setvar $planethaggle~multiple 1154
	else
		setvar $planethaggle~mcic 0
		setvar $planethaggle~multiple 1154
	end
elseif ($planethaggle~prodtosell = "equ")
	if ($planethaggle~portmaxinit >= 1393)
		setvar $planethaggle~mcic "-65"
		setvar $planethaggle~multiple 1347
	elseif ($planethaggle~portmaxinit >= 1386)
		setvar $planethaggle~mcic "-64"
		setvar $planethaggle~multiple 1341
	elseif ($planethaggle~portmaxinit >= 1379)
		setvar $planethaggle~mcic "-63"
		setvar $planethaggle~multiple 1336
	elseif ($planethaggle~portmaxinit >= 1372)
		setvar $planethaggle~mcic "-62"
		setvar $planethaggle~multiple 1330
	elseif ($planethaggle~portmaxinit >= 1365)
		setvar $planethaggle~mcic "-61"
		setvar $planethaggle~multiple 1324
	elseif ($planethaggle~portmaxinit >= 1358)
		setvar $planethaggle~mcic "-60"
		setvar $planethaggle~multiple 1319
	elseif ($planethaggle~portmaxinit >= 1351)
		setvar $planethaggle~mcic "-59"
		setvar $planethaggle~multiple 1313
	elseif ($planethaggle~portmaxinit >= 1344)
		setvar $planethaggle~mcic "-58"
		setvar $planethaggle~multiple 1307
	elseif ($planethaggle~portmaxinit >= 1337)
		setvar $planethaggle~mcic "-57"
		setvar $planethaggle~multiple 1302
	elseif ($planethaggle~portmaxinit >= 1329)
		setvar $planethaggle~mcic "-56"
		setvar $planethaggle~multiple 1296
	elseif ($planethaggle~portmaxinit >= 1323)
		setvar $planethaggle~mcic "-55"
		setvar $planethaggle~multiple 1291
	elseif ($planethaggle~portmaxinit >= 1315)
		setvar $planethaggle~mcic "-54"
		setvar $planethaggle~multiple 1285
	elseif ($planethaggle~portmaxinit >= 1308)
		setvar $planethaggle~mcic "-53"
		setvar $planethaggle~multiple 1279
	elseif ($planethaggle~portmaxinit >= 1301)
		setvar $planethaggle~mcic "-52"
		setvar $planethaggle~multiple 1274
	elseif ($planethaggle~portmaxinit >= 1294)
		setvar $planethaggle~mcic "-51"
		setvar $planethaggle~multiple 1268
	elseif ($planethaggle~portmaxinit >= 1287)
		setvar $planethaggle~mcic "-50"
		setvar $planethaggle~multiple 1262
	elseif ($planethaggle~portmaxinit >= 1279)
		setvar $planethaggle~mcic "-49"
		setvar $planethaggle~multiple 1254
	elseif ($planethaggle~portmaxinit >= 1272)
		setvar $planethaggle~mcic "-48"
		setvar $planethaggle~multiple 1247
	elseif ($planethaggle~portmaxinit >= 1265)
		setvar $planethaggle~mcic "-47"
		setvar $planethaggle~multiple 1246
	elseif ($planethaggle~portmaxinit >= 1258)
		setvar $planethaggle~mcic "-46"
		setvar $planethaggle~multiple 1241
	elseif ($planethaggle~portmaxinit >= 1251)
		setvar $planethaggle~mcic "-45"
		setvar $planethaggle~multiple 1235
	elseif ($planethaggle~portmaxinit >= 1243)
		setvar $planethaggle~mcic "-44"
		setvar $planethaggle~multiple 1229
	elseif ($planethaggle~portmaxinit >= 1236)
		setvar $planethaggle~mcic "-43"
		setvar $planethaggle~multiple 1224
	elseif ($planethaggle~portmaxinit >= 1229)
		setvar $planethaggle~mcic "-42"
		setvar $planethaggle~multiple 1218
	elseif ($planethaggle~portmaxinit >= 1221)
		setvar $planethaggle~mcic "-41"
		setvar $planethaggle~multiple 1213
	elseif ($planethaggle~portmaxinit >= 1214)
		setvar $planethaggle~mcic "-40"
		setvar $planethaggle~multiple 1208
	elseif ($planethaggle~portmaxinit >= 1206)
		setvar $planethaggle~mcic "-39"
		setvar $planethaggle~multiple 1201
	elseif ($planethaggle~portmaxinit >= 1199)
		setvar $planethaggle~mcic "-38"
		setvar $planethaggle~multiple 1196
	elseif ($planethaggle~portmaxinit >= 1192)
		setvar $planethaggle~mcic "-37"
		setvar $planethaggle~multiple 1190
	elseif ($planethaggle~portmaxinit >= 1184)
		setvar $planethaggle~mcic "-36"
		setvar $planethaggle~multiple 1185
	elseif ($planethaggle~portmaxinit >= 1177)
		setvar $planethaggle~mcic "-35"
		setvar $planethaggle~multiple 1180
	elseif ($planethaggle~portmaxinit >= 1169)
		setvar $planethaggle~mcic "-34"
		setvar $planethaggle~multiple 1174
	elseif ($planethaggle~portmaxinit >= 1162)
		setvar $planethaggle~mcic "-33"
		setvar $planethaggle~multiple 1169
	elseif ($planethaggle~portmaxinit >= 1154)
		setvar $planethaggle~mcic "-32"
		setvar $planethaggle~multiple 1164
	elseif ($planethaggle~portmaxinit >= 1147)
		setvar $planethaggle~mcic "-31"
		setvar $planethaggle~multiple 1158
	elseif ($planethaggle~portmaxinit >= 1139)
		setvar $planethaggle~mcic "-30"
		setvar $planethaggle~multiple 1152
	elseif ($planethaggle~portmaxinit >= 1132)
		setvar $planethaggle~mcic "-29"
		setvar $planethaggle~multiple 1149
	elseif ($planethaggle~portmaxinit >= 1124)
		setvar $planethaggle~mcic "-28"
		setvar $planethaggle~multiple 1144
	elseif ($planethaggle~portmaxinit >= 1116)
		setvar $planethaggle~mcic "-27"
		setvar $planethaggle~multiple 1136
	elseif ($planethaggle~portmaxinit >= 1109)
		setvar $planethaggle~mcic "-26"
		setvar $planethaggle~multiple 1132
	elseif ($planethaggle~portmaxinit >= 1101)
		setvar $planethaggle~mcic "-25"
		setvar $planethaggle~multiple 1126
	elseif ($planethaggle~portmaxinit >= 1093)
		setvar $planethaggle~mcic "-24"
		setvar $planethaggle~multiple 1122
	elseif ($planethaggle~portmaxinit >= 1086)
		setvar $planethaggle~mcic "-23"
		setvar $planethaggle~multiple 1117
	elseif ($planethaggle~portmaxinit >= 1078)
		setvar $planethaggle~mcic "-22"
		setvar $planethaggle~multiple 1110
	elseif ($planethaggle~portmaxinit >= 1071)
		setvar $planethaggle~mcic "-21"
		setvar $planethaggle~multiple 1105
	elseif ($planethaggle~portmaxinit >= 1063)
		setvar $planethaggle~mcic "-20"
		setvar $planethaggle~multiple 1102
	else
		setvar $planethaggle~mcic 0
		setvar $planethaggle~multiple 1102
	end
end
setvar $planethaggle~counter $planethaggle~offer
divide $planethaggle~counter 10
multiply $planethaggle~counter $planethaggle~multiple
divide $planethaggle~counter 100
send "az"&$planethaggle~counter&"*"
setvar $planethaggle~midhaggles 0

:planethaggle~sellofferloop
settextlinetrigger sellprice :sellprice "We'll buy them for"
settextlinetrigger sellfinaloffer :sellfinaloffer "Our final offer"
settextlinetrigger sellexperience :sellexperience "experience point(s)"
settextlinetrigger sellyouhave :sellyouhave "You have"
settextlinetrigger sellscrewup1 :sellscrewup "Get real ion-brain, make me a real offer."
settextlinetrigger sellscrewup2 :sellscrewup "This is the big leagues Jr.  Make a real offer."
settextlinetrigger sellscrewup3 :sellscrewup "My patience grows short with you."
settextlinetrigger sellscrewup4 :sellscrewup "I have much better things to do than waste my time.  Try again."
settextlinetrigger sellscrewup5 :sellscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
settextlinetrigger sellscrewup6 :sellscrewup "Quit playing around, you're wasting my time!"
settextlinetrigger sellscrewup7 :sellscrewup "Make a real offer or get the h"
settextlinetrigger sellscrewup8 :sellscrewup "WHAT?!@!? you must be crazy!"
settextlinetrigger sellscrewup9 :sellscrewup "So, you think I'm as stupid as you look? Make a real offer."
settextlinetrigger sellscrewup10 :sellscrewup "What do you take me for, a fool?  Make a real offer!"
settextlinetrigger sellscrewup11 :sellscrewup "Swine, go peddle your wares somewhere else, you make me sick."
settextlinetrigger sellscrewup12 :sellscrewup "I see you are as stupid as you look, get lost..."
settextlinetrigger sellscrewup13 :sellscrewup "HA!  You think me a fool?  Thats insane!  Get out of here!"
settextlinetrigger sellscrewup14 :sellscrewup "Get lost creep, that junk isn't worth half that much!"
settextlinetrigger sellscrewup15 :sellscrewup "I think you'd better leave if you value your life!"
pause
pause

:planethaggle~sellscrewup
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
killtrigger sellscrewup15
echo "*## PICKUP up sell fail"
goto :sellhagglefailed
echo "*### HSOULD NOT GET HERE NOW"
multiply $planethaggle~counter 98
divide $planethaggle~counter 100
send "az"&$planethaggle~counter&"*"
goto :sellofferloop

:planethaggle~sellprice
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
killtrigger sellscrewup15
add $planethaggle~midhaggles 1
setvar $planethaggle~old_offer $planethaggle~offer
setvar $planethaggle~old_counter $planethaggle~counter
getword currentline $planethaggle~offer 5
striptext $planethaggle~offer ","
setvar $planethaggle~offer_change $planethaggle~offer
subtract $planethaggle~offer_change $planethaggle~old_offer
if ($planethaggle~mcic > "-35")
	multiply $planethaggle~offer_change 75
	divide $planethaggle~offer_change 100
	subtract $planethaggle~counter $planethaggle~offer_change
	subtract $planethaggle~counter 25
elseif ($planethaggle~mcic > "-55")
	multiply $planethaggle~offer_change 65
	divide $planethaggle~offer_change 100
	subtract $planethaggle~counter $planethaggle~offer_change
	subtract $planethaggle~counter 25
else
	multiply $planethaggle~offer_change 60
	divide $planethaggle~offer_change 100
	subtract $planethaggle~counter $planethaggle~offer_change
	subtract $planethaggle~counter 10
end
send "az"&$planethaggle~counter&"*"
goto :sellofferloop

:planethaggle~sellfinaloffer
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
killtrigger sellscrewup15

if (($planethaggle~prodtosell = "ore") and (($planethaggle~mcic <= "-75") and (($planethaggle~portbuying >= 25000) and (($planethaggle~midhaggles < 1) and ($planethaggle~ore_sell_failures < 2)))))
	setvar $planethaggle~forcefail 1
	setvar $planethaggle~thisorefailed 1
elseif (($planethaggle~prodtosell = "org") and ((($planethaggle~mcic <= "-60") and ((($planethaggle~portbuying >= 25000) and ((($planethaggle~midhaggles < 2) and (($planethaggle~thisorefailed = 1) or ($planethaggle~org_sell_failures < 4)))))))))
	setvar $planethaggle~forcefail 1
	setvar $planethaggle~thisorgfailed 1
elseif (($planethaggle~prodtosell = "org") and ((($planethaggle~mcic <= "-60") and ((($planethaggle~portbuying >= 15000) and ((($planethaggle~midhaggles < 1) and (($planethaggle~thisorefailed = 1) or ($planethaggle~org_sell_failures < 2)))))))))
	setvar $planethaggle~forcefail 1
	setvar $planethaggle~thisorgfailed 1
elseif (($planethaggle~prodtosell = "equ") and ((($planethaggle~mcic <= "-55") and ((($planethaggle~portbuying >= 20000) and ((($planethaggle~midhaggles < 2) and (($planethaggle~thisorefailed = 1) or ($planethaggle~thisorgfailed = 1) or ($planethaggle~equ_sell_failures < 4)))))))))
	setvar $planethaggle~forcefail 1
	setvar $planethaggle~thisequfailed 1
elseif (($planethaggle~prodtosell = "equ") and ((($planethaggle~mcic <= "-55") and ((($planethaggle~portbuying >= 12000) and ((($planethaggle~midhaggles < 1) and (($planethaggle~thisorefailed = 1) or ($planethaggle~thisorgfailed = 1) or ($planethaggle~equ_sell_failures < 2)))))))))
	setvar $planethaggle~forcefail 1
	setvar $planethaggle~thisequfailed 1
else
	setvar $planethaggle~forcefail 0
end
if ($planethaggle~prodtosell = "ore")
	setsectorparameter $player~current_sector "OREMCIC" $planethaggle~mcic
elseif ($planethaggle~prodtosell = "org")
	setsectorparameter $player~current_sector "ORGMCIC" $planethaggle~mcic
elseif ($planethaggle~prodtosell = "equ")
	setsectorparameter $player~current_sector "EQUMCIC" $planethaggle~mcic
end
if ($planethaggle~forcefail = 0)
	setvar $planethaggle~old_offer $planethaggle~offer
	setvar $planethaggle~old_counter $planethaggle~counter
	getword currentline $planethaggle~offer 5
	striptext $planethaggle~offer ","
	setvar $planethaggle~offer_change $planethaggle~offer
	subtract $planethaggle~offer_change $planethaggle~old_offer
	if ($planethaggle~prodtosell = "ore")
		multiply $planethaggle~offer_change 30
	elseif ($planethaggle~prodtosell = "org")
		multiply $planethaggle~offer_change 27
	elseif ($planethaggle~prodtosell = "equ")
		multiply $planethaggle~offer_change 25
	end
	divide $planethaggle~offer_change 10
	subtract $planethaggle~counter $planethaggle~offer_change
	subtract $planethaggle~counter 10
	send "az"&$planethaggle~counter&"*"
else

	send "az"&$planethaggle~counter&"*"
end
goto :sellofferloop

:planethaggle~sellnotinterested
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
killtrigger sellscrewup15
goto :sellhagglefailed

:planethaggle~sellexperience
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
getword currentline $planethaggle~exp_bonus 7
add $planethaggle~experience $planethaggle~exp_bonus
goto :sellofferloop

:planethaggle~sellyouhave
killtrigger sellprice
killtrigger sellfinaloffer
killtrigger sellexperience
killtrigger sellyouhave
killtrigger sellscrewup1
killtrigger sellscrewup2
killtrigger sellscrewup3
killtrigger sellscrewup4
killtrigger sellscrewup5
killtrigger sellscrewup6
killtrigger sellscrewup7
killtrigger sellscrewup8
killtrigger sellscrewup9
killtrigger sellscrewup10
killtrigger sellscrewup11
killtrigger sellscrewup12
killtrigger sellscrewup13
killtrigger sellscrewup14
killtrigger sellscrewup15

setvar $planethaggle~oldcredits $player~credits
getword currentline $planethaggle~credits 3
striptext $planethaggle~credits ","

if ($planethaggle~oldcredits = $planethaggle~credits)
	setvar $planethaggle~currenthaggle "failed"
	goto :sellhagglefailed
else
	setvar $planethaggle~currenthaggle "succeeded"
	goto :sellhagglesucceeded
end

:planethaggle~sellhagglefailed
if ($planethaggle~prodtosell = "ore")
	add $planethaggle~ore_sell_failures 1
elseif ($planethaggle~prodtosell = "org")
	add $planethaggle~org_sell_failures 1
elseif ($planethaggle~prodtosell = "equ")
	add $planethaggle~equ_sell_failures 1
end
if ($planethaggle~selldelay > 99)
	setdelaytrigger selldelay :selldelay $planethaggle~selldelay
	pause

	:planethaggle~selldelay
end
return

:planethaggle~sellhagglesucceeded
setvar $planethaggle~sellhagglesucceeded true
add $planethaggle~profit $planethaggle~counter
setvar $planethaggle~perunit $planethaggle~counter
divide $planethaggle~perunit $planethaggle~portbuying
setvar $planethaggle~selloutput ""
setvar $planethaggle~selloutput $planethaggle~selloutput&$planethaggle~portbuying&" "&$planethaggle~prodtosell&" for "&$planethaggle~counter&" cr"
setvar $planethaggle~selloutput $planethaggle~selloutput&" - "
if ($planethaggle~prodtosell = "ore")
	setvar $planethaggle~selloutput $planethaggle~selloutput&$planethaggle~ore_sell_failures
elseif ($planethaggle~prodtosell = "org")
	setvar $planethaggle~selloutput $planethaggle~selloutput&$planethaggle~org_sell_failures
elseif ($planethaggle~prodtosell = "equ")
	setvar $planethaggle~selloutput $planethaggle~selloutput&$planethaggle~equ_sell_failures
end
setvar $planethaggle~selloutput $planethaggle~selloutput&" fails"
setvar $planethaggle~selloutput $planethaggle~selloutput&" - "&$planethaggle~perunit&"/unit"
setvar $planethaggle~selloutput $planethaggle~selloutput&" - MCIC "&$planethaggle~mcic
if ($planethaggle~prodtosell = "ore")
	setvar $planethaggle~selloutput $planethaggle~selloutput&"/-90*"
	setvar $planethaggle~oreselloutput $planethaggle~selloutput
	setvar $planethaggle~oreprofit $planethaggle~counter
elseif ($planethaggle~prodtosell = "org")
	setvar $planethaggle~selloutput $planethaggle~selloutput&"/-75*"
	setvar $planethaggle~orgselloutput $planethaggle~selloutput
	setvar $planethaggle~orgprofit $planethaggle~counter
elseif ($planethaggle~prodtosell = "equ")
	setvar $planethaggle~selloutput $planethaggle~selloutput&"/-65*"
	setvar $planethaggle~equselloutput $planethaggle~selloutput
	setvar $planethaggle~equprofit $planethaggle~counter
end
if ($planethaggle~selldelay > 99)
	setdelaytrigger selldelay :selldelay2 $planethaggle~selldelay
	pause
	pause

	:planethaggle~selldelay2
end
return

:planethaggle~msgs_off
setvar $planethaggle~msgs_off_first true

:planethaggle~msgs_off_again
settexttrigger planethaggle_msgs_off :planethaggle~msgs_off_confirmed "Silencing all messages."
settexttrigger planethaggle_msgs_on :planethaggle~msgs_off_was_on "Displaying all messages."
send "|"
pause

:planethaggle~msgs_off_was_on
killtrigger planethaggle_msgs_off
killtrigger planethaggle_msgs_on
if ($planethaggle~msgs_off_first = true)
	setvar $planethaggle~restore_messages false
	setvar $planethaggle~msgs_off_first false
end
goto :planethaggle~msgs_off_again

:planethaggle~msgs_off_confirmed
killtrigger planethaggle_msgs_off
killtrigger planethaggle_msgs_on
if ($planethaggle~msgs_off_first = true)
	setvar $planethaggle~restore_messages true
end
setvar $planethaggle~messages_silenced true
return

:planethaggle~msgs_on
settexttrigger planethaggle_msgs_on_done :planethaggle~msgs_on_confirmed "Displaying all messages."
settexttrigger planethaggle_msgs_on_off :planethaggle~msgs_on_was_off "Silencing all messages."
send "|"
pause

:planethaggle~msgs_on_was_off
killtrigger planethaggle_msgs_on_done
killtrigger planethaggle_msgs_on_off
goto :planethaggle~msgs_on

:planethaggle~msgs_on_confirmed
killtrigger planethaggle_msgs_on_done
killtrigger planethaggle_msgs_on_off
setvar $planethaggle~messages_silenced false
return

:planethaggle~negotiateland
if ($planethaggle~startinglocation = "Citadel")
	send "L "&$planet~planet&"* "
	gosub :planet~getplanetinfo
	send "c "
elseif ($planethaggle~startinglocation = "Planet")
	send "L "&$planet~planet&"* "
	gosub :planet~getplanetinfo
end
return

:planethaggle~exitneg
if (($planethaggle~restore_messages = true) and ($planethaggle~messages_silenced = true))
	gosub :planethaggle~msgs_on
end
#setvar $switchboard~message $planethaggle~exit_message & "*"
#gosub :switchboard~switchboard
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:planethaggle~buy
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $player~overhagglemultiple 147
setvar $player~cyclebuffer 1
setvar $player~cyclebufferlimit 20
setvar $player~buydown_restore_haggle 0
setvar $player~buydown_usenativehaggle 0

if (haggle)
	if ($player~buytype = "s")
		setvar $player~buydown_restore_haggle 1
		autohaggle off
	else
		setvar $player~buydown_usenativehaggle 1
	end
end

if ($player~buydown_usenativehaggle = 0)
	send "@"
	waiton "Average Interval Lag:"
end
gosub :player~quikstats
setvar $player~startinglocation $player~current_prompt

setvar $player~output ""
setvar $player~equiprounds 0
setvar $player~orgrounds 0
setvar $player~fuelrounds 0
if ($player~buydownroundsfromparam <= 0)
	setvar $player~buydownroundsfromparam 999999
end
if ($player~buytype = "w")
	setvar $player~buydown_mode 3
elseif ($player~buytype = "b")
	setvar $player~buydown_mode 2
else
	setvar $player~buydown_mode 1
end
if ($player~buyobject = "e")
	setvar $player~buydown_equiprounds $player~buydownroundsfromparam
	setvar $player~buydown_orgrounds 0
	setvar $player~buydown_fuelrounds 0
elseif ($player~buyobject = "o")
	setvar $player~buydown_equiprounds 0
	setvar $player~buydown_orgrounds $player~buydownroundsfromparam
	setvar $player~buydown_fuelrounds 0
elseif ($player~buyobject = "f")
	setvar $player~buydown_equiprounds 0
	setvar $player~buydown_orgrounds 0
	setvar $player~buydown_fuelrounds $player~buydownroundsfromparam
else
	setvar $player~exit_message "Please use format buy [type] {speed} {#cycles} {override}*"
	return

end
if ($player~startinglocation = "Citadel")
	send "Q"
end
send "t n l 1* t n l 2* t n l 3* s n l1*"
waiton "How many groups of Colonists do you want to leave"
gosub :planet~getplanetinfo
if ($player~startinglocation = "Citadel")
	send "C s* "
else
	send "Q D"
end
gosub :player~getinfo
if ($player~total_holds <> $player~empty_holds)
	if ($player~startinglocation <> "Citadel")
		gosub :planet~landingsub
	end
	setvar $switchboard~message "Planet full, cannot empty ship holds*"
	gosub :switchboard~switchboard
	goto :planethaggle~buyexit
end
gosub :sector~voidadjacent
setvar $port~startinglocation $player~startinglocation
gosub :port~getportinfo
if ($port~noport = 1)
	echo "*No valid port found*"
	if ($player~startinglocation <> "Citadel")
		gosub :planet~landingsub
	end
	gosub :sector~clearvoidadjacent
	goto :planethaggle~buyexit
end
if ($player~startinglocation = "Citadel")
	send "Q"
else
	send "L "&$planet~planet&"* "
end
setdelaytrigger planetbuyinitpause :planethaggle~buyinitpause 500
pause

:planethaggle~buyinitpause
:planethaggle~buygetinputs
#if ($player~buydown_usenativehaggle = 0)
#	echo "*Buying down product, please wait...*"
#	gosub :player~enter_menu_deaf
#end

setvar $player~turns_needed 0
setvar $player~turns_allowed $player~turns
subtract $player~turns_allowed 1

if ($player~buydown_fuelrounds > 0)
	setvar $player~fuelrounds 0
	setvar $player~planetfuelroom $planet~planet_fuel_max
	subtract $player~planetfuelroom $planet~planet_fuel
	setvar $player~maxfueltobuy 0
	if ($port~orebuying = "Selling")
		setvar $player~maxfueltobuy $port~oretrading
		if ($player~maxfueltobuy > $player~planetfuelroom)
			setvar $player~maxfueltobuy $player~planetfuelroom
		end
	end
	setvar $player~maxfuelrounds $player~maxfueltobuy
	divide $player~maxfuelrounds $player~total_holds
	if ($player~maxfuelrounds > $player~turns_allowed)
		setvar $player~maxfuelrounds $player~turns_allowed
	end
	if ($player~maxfuelrounds > $player~buydown_fuelrounds)
		setvar $player~maxfuelrounds $player~buydown_fuelrounds
	end
	if ($player~maxfuelrounds > 0)
		setvar $player~fuelrounds $player~maxfuelrounds
	end
	add $player~turns_needed $player~fuelrounds
	subtract $player~turns_allowed $player~fuelrounds
end

if ($player~buydown_orgrounds > 0)
	setvar $player~orgrounds 0
	setvar $player~planetorgroom $planet~planet_organics_max
	subtract $player~planetorgroom $planet~planet_organics
	setvar $player~maxorgtobuy 0
	if ($port~orgbuying = "Selling")
		setvar $player~maxorgtobuy $port~orgtrading
		if ($player~maxorgtobuy > $player~planetorgroom)
			setvar $player~maxorgtobuy $player~planetorgroom
		end
	end
	setvar $player~maxorgrounds $player~maxorgtobuy
	divide $player~maxorgrounds $player~total_holds
	if ($player~maxorgrounds > $player~turns_allowed)
		setvar $player~maxorgrounds $player~turns_allowed
	end
	if ($player~maxorgrounds > $player~buydown_orgrounds)
		setvar $player~maxorgrounds $player~buydown_orgrounds
	end
	if ($player~maxorgrounds > 0)
		setvar $player~orgrounds $player~maxorgrounds
	end
	add $player~turns_needed $player~orgrounds
	subtract $player~turns_allowed $player~orgrounds
end

if ($player~buydown_equiprounds > 0)
	setvar $player~equiprounds 0
	setvar $player~planetequiproom $planet~planet_equipment_max
	subtract $player~planetequiproom $planet~planet_equipment
	setvar $player~maxequiptobuy 0
	if ($port~equbuying = "Selling")
		setvar $player~maxequiptobuy $port~equtrading
		if ($player~maxequiptobuy > $player~planetequiproom)
			setvar $player~maxequiptobuy $player~planetequiproom
		end
	end
	setvar $player~maxequiprounds $player~maxequiptobuy
	divide $player~maxequiprounds $player~total_holds
	if ($player~maxequiprounds > $player~turns_allowed)
		setvar $player~maxequiprounds $player~turns_allowed
	end
	if ($player~maxequiprounds > $player~buydown_equiprounds)
		setvar $player~maxequiprounds $player~buydown_equiprounds
	end
	if ($player~maxequiprounds > 0)
		setvar $player~equiprounds $player~maxequiprounds
	end
	add $player~turns_needed $player~equiprounds
	subtract $player~turns_allowed $player~equiprounds
end
if (($player~fuelrounds = 0) and (($player~orgrounds = 0) and ($player~equiprounds = 0)))
	if ($player~startinglocation = "Citadel")
		send "C "
	else
		send "q "
	end
	echo "*Nothing to buy*"
	gosub :sector~clearvoidadjacent
	goto :planethaggle~buyexit
end

:planethaggle~buygetmode
if ($player~buydown_mode = 1)
	setvar $player~buydown_mode "Speedbuy"
elseif ($player~buydown_mode = 2)
	setvar $player~buydown_mode "Best Price"
elseif ($player~buydown_mode = 3)
	setvar $player~buydown_mode "Worst Price"
end
setvar $player~fuelroundsleft $player~fuelrounds
setvar $player~orgroundsleft $player~orgrounds
setvar $player~equiproundsleft $player~equiprounds
setvar $player~fuel_creds_needed 0
setvar $player~org_creds_needed 0
setvar $player~equip_creds_needed 0

if ($player~fuelrounds > 0)
	setvar $player~fuel_creds_needed $player~fuelrounds
	multiply $player~fuel_creds_needed $player~total_holds
	multiply $player~fuel_creds_needed 30
	if ($player~buydown_mode = "Worst Price")
		multiply $player~fuel_creds_needed 3
		divide $player~fuel_creds_needed 2
	end
end
if ($player~orgrounds > 0)
	setvar $player~org_creds_needed $player~orgrounds
	multiply $player~org_creds_needed $player~total_holds
	multiply $player~org_creds_needed 60
	if ($player~buydown_mode = "Worst Price")
		multiply $player~org_creds_needed 3
		divide $player~org_creds_needed 2
	end
end
if ($player~equiprounds > 0)
	setvar $player~equip_creds_needed $player~equiprounds
	multiply $player~equip_creds_needed $player~total_holds
	multiply $player~equip_creds_needed 100
	if ($player~buydown_mode = "Worst Price")
		multiply $player~equip_creds_needed 3
		divide $player~equip_creds_needed 2
	end
end
setvar $player~total_creds_needed 0
add $player~total_creds_needed $player~fuel_creds_needed
add $player~total_creds_needed $player~org_creds_needed
add $player~total_creds_needed $player~equip_creds_needed
setvar $player~startingcredits $player~credits
if ($player~total_creds_needed > $player~credits)
	setvar $player~cashonhand $planet~citadel_credits
	add $player~cashonhand $player~credits
	if ($player~cashonhand > $player~total_creds_needed)
		send "C"
		send "T T "&$player~credits&"* "
		send "T F "&$player~total_creds_needed&"* "
		setvar $player~credits $player~total_creds_needed
		send "Q"
	else
		if ($player~startinglocation = "Citadel")
			send "C "
		else
			send "q "
		end
		setvar $player~exit_message "Not enough cash onhand"
		gosub :sector~clearvoidadjacent
		goto :planethaggle~buyexit
	end
end
setvar $player~init_credits $player~credits

:planethaggle~buydownequip
if ($player~equiproundsleft > 0)
	send "Q P T  "
	if ($port~orebuying = "Selling")
		send "0* "
	end
	if ($port~orgbuying = "Selling")
		send "0*"
	end
	gosub :planethaggle~buychoosehaggle
	send "L "&$planet~planet&"* t n l 3* "
	subtract $player~equiproundsleft 1
	goto :planethaggle~buydownequip
end
if ($player~equiprounds > 0)
	if ($player~buydown_mode = "Worst Price")
		setvar $player~output $player~output&" - Equipment overhaggled at "&$player~overhagglemultiple&"*"
	end
end

:planethaggle~buydownorg
if ($player~orgroundsleft > 0)
	send "Q P T  "
	if ($port~orebuying = "Selling")
		send "0*"
	end
	gosub :planethaggle~buychoosehaggle
	send "0* L "&$planet~planet&"* t n l 2* "
	subtract $player~orgroundsleft 1
	goto :planethaggle~buydownorg
end
if ($player~orgrounds > 0)
	if ($player~buydown_mode = "Worst Price")
		setvar $player~output $player~output&" - Organics overhaggled at "&$player~overhagglemultiple&"*"
	end
end

:planethaggle~buydownfuel
if ($player~fuelroundsleft > 0)
	send "Q P T "
	gosub :planethaggle~buychoosehaggle
	send "0* 0* L "&$planet~planet&"* t n l 1* "
	subtract $player~fuelroundsleft 1
	goto :planethaggle~buydownfuel
end
if ($player~fuelrounds > 0)
	if ($player~buydown_mode = "Worst Price")
		setvar $player~output $player~output&" - Fuel Ore overhaggled at "&$player~overhagglemultiple&"*"
	end
end

:planethaggle~buydownfinish
#if ($player~buydown_usenativehaggle = 0)
#	gosub :player~exit_menu_deaf
#end
if ($player~startinglocation = "Citadel")
	send "C "
end
gosub :player~getinfo
setvar $player~credits_spent $player~init_credits
subtract $player~credits_spent $player~credits
gosub :sector~clearvoidadjacent
if ($player~startinglocation = "Planet")
	send "L "&$planet~planet&"* "
end
if ($player~credits > $player~startingcredits)
	if ($player~startinglocation = "Citadel")
		send "T T "&($player~credits - $player~startingcredits)&"* "
	end
end
setvar $player~exit_message "Normal Exit"

:planethaggle~buyexit
if ($player~buydown_restore_haggle = 1)
	autohaggle on
	setvar $player~buydown_restore_haggle 0
end
return

:planethaggle~buychoosehaggle
if ($player~buydown_usenativehaggle = 1)
	gosub :planethaggle~buynativehaggle
elseif ($player~buydown_mode = "Speedbuy")
	gosub :planethaggle~buynohaggle
else
	gosub :planethaggle~buyhaggle
end
return

:planethaggle~buynativehaggle
setvar $player~empty $player~total_holds
send "*"
settextlinetrigger planetbuyempty :planethaggle~buyempty "empty cargo holds"
settextlinetrigger planetbuynotinterested :planethaggle~buynotinterested "We're not interested."
settexttrigger planetbuynativedone :planethaggle~buyhagglesucceeded "Command [TL="
pause

:planethaggle~buyhaggle
killtrigger planetbuyfirstoffer
setvar $player~empty $player~total_holds
send "*"
settextlinetrigger planetbuyfirstoffer :planethaggle~buyfirstoffer "We'll sell them for"
pause

:planethaggle~buyfirstoffer
gosub :planethaggle~buykilltriggers
getword currentline $player~offer 5
striptext $player~offer ","
gosub :player~swathoff
if ($player~swathoff = 0)
	send "L "&$planet~planet&"* "
	if ($player~startinglocation = "Citadel")
		send "C "
	end
	setvar $player~exit_message $player~swathoffmessage
	if ($player~buydown_return_on_abort = true)
		setvar $player~buydown_aborted true
		return
	end
	goto :planethaggle~buyexit
end

setvar $player~counter $player~offer
if ($player~buydown_mode = "Best Price")
	multiply $player~counter 92
	divide $player~counter 100
elseif ($player~buydown_mode = "Worst Price")
	multiply $player~counter $player~overhagglemultiple
	divide $player~counter 100
end
send $player~counter&"*"

:planethaggle~buyofferloop
settextlinetrigger planetbuyprice :planethaggle~buyprice "We'll sell them for"
settextlinetrigger planetbuyfinaloffer :planethaggle~buyfinaloffer "Our final offer"
settextlinetrigger planetbuynotinterested :planethaggle~buynotinterested "We're not interested."
settextlinetrigger planetbuyexperience :planethaggle~buyexperience "experience point(s)"
settextlinetrigger planetbuyempty :planethaggle~buyempty "empty cargo holds"
settextlinetrigger planetbuyscrewup1 :planethaggle~buyscrewup "Get real ion-brain, make me a real offer."
settextlinetrigger planetbuyscrewup2 :planethaggle~buyscrewup "This is the big leagues Jr.  Make a real offer."
settextlinetrigger planetbuyscrewup3 :planethaggle~buyscrewup "My patience grows short with you."
settextlinetrigger planetbuyscrewup4 :planethaggle~buyscrewup "I have much better things to do than waste my time.  Try again."
settextlinetrigger planetbuyscrewup5 :planethaggle~buyscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
settextlinetrigger planetbuyscrewup6 :planethaggle~buyscrewup "Quit playing around, you're wasting my time!"
settextlinetrigger planetbuyscrewup7 :planethaggle~buyscrewup "Make a real offer or get the "
settextlinetrigger planetbuyscrewup8 :planethaggle~buyscrewup "WHAT?!@!? you must be crazy!"
settextlinetrigger planetbuyscrewup9 :planethaggle~buyscrewup "So, you think I'm as stupid as you look? Make a real offer."
settextlinetrigger planetbuyscrewup10 :planethaggle~buyscrewup "What do you take me for, a fool?  Make a real offer!"
pause
pause

:planethaggle~buyscrewup
gosub :planethaggle~buykilltriggers
if ($player~buydown_mode = "Best Price")
	multiply $player~counter 102
	divide $player~counter 100
elseif ($player~buydown_mode = "Worst Price")
	subtract $player~overhagglemultiple 1
	setvar $player~counter $player~offer
	multiply $player~counter $player~overhagglemultiple
	divide $player~counter 100
end
send $player~counter&"*"
goto :planethaggle~buyofferloop

:planethaggle~buyprice
gosub :planethaggle~buykilltriggers
setvar $player~old_offer $player~offer
setvar $player~old_counter $player~counter
getword currentline $player~offer 5
striptext $player~offer ","
setvar $player~offer_pct $player~offer
multiply $player~offer_pct 1000
divide $player~offer_pct $player~old_offer
if ($player~offer_pct > 990)
	setvar $player~offer_pct 990
end
multiply $player~counter 1000
divide $player~counter $player~offer_pct
if ($player~counter <= $player~old_counter)
	add $player~counter 1
end
send $player~counter&"*"
goto :planethaggle~buyofferloop

:planethaggle~buyfinaloffer
gosub :planethaggle~buykilltriggers
setvar $player~old_offer $player~offer
setvar $player~old_counter $player~counter
getword currentline $player~offer 5
striptext $player~offer ","
setvar $player~offer_change $player~offer
subtract $player~offer_change $player~old_offer
subtract $player~offer_change 1
multiply $player~offer_change 25
divide $player~offer_change 10
subtract $player~counter $player~offer_change
if ($player~counter = $player~old_counter)
	add $player~counter 1
end
add $player~counter 1
send $player~counter&"*"
goto :planethaggle~buyofferloop

:planethaggle~buynotinterested
gosub :planethaggle~buykilltriggers
send "0* "
send "0* "
goto :planethaggle~buyhagglefailed

:planethaggle~buyexperience
gosub :planethaggle~buykilltriggers
getword currentline $player~exp_bonus 7
add $player~exp $player~exp_bonus
add $player~jetbonus $player~exp_bonus
goto :planethaggle~buyofferloop

:planethaggle~buyempty
gosub :planethaggle~buykilltriggers
getword currentline $player~credits 3
striptext $player~credits ","
setvar $player~oldempty $player~empty
getword currentline $player~empty 6
if ($player~oldempty = $player~empty)
	goto :planethaggle~buyhagglefailed
else
	goto :planethaggle~buyhagglesucceeded
end

:planethaggle~buyhagglefailed
setvar $player~buyhaggle 0
return

:planethaggle~buyhagglesucceeded
setvar $player~buyhaggle 1
return

:planethaggle~buynohaggle
if ($player~swathoff = 0)

	waiton "How many holds of"
	send "*"
	gosub :player~swathoff
	send "*"
else
	send "**"
end
setvar $player~cyclebufferlimit 20
add $player~cyclebuffer 1
if ($player~cyclebuffer = $player~cyclebufferlimit)
	setvar $player~cyclebuffer 1
	send "/"
	waiton " Sect "
end
return

:planethaggle~buykilltriggers
killtrigger planetbuyprice
killtrigger planetbuyfinaloffer
killtrigger planetbuynotinterested
killtrigger planetbuyexperience
killtrigger planetbuyempty
killtrigger planetbuynativedone
killtrigger planetbuyscrewup1
killtrigger planetbuyscrewup2
killtrigger planetbuyscrewup3
killtrigger planetbuyscrewup4
killtrigger planetbuyscrewup5
killtrigger planetbuyscrewup6
killtrigger planetbuyscrewup7
killtrigger planetbuyscrewup8
killtrigger planetbuyscrewup9
killtrigger planetbuyscrewup10
return

include "source\include\player"
include "source\include\planet"
include "source\include\port"
include "source\include\switchboard"
