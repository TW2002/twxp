#=-=-=-=  Haggle  =-=-==-=-=-=-=-=-=-=
:haggle
setVar $ni 0
setVar $midhag "-1"
setVar $nocred 0
killtrigger 1
killtrigger 0
killtrigger donehaggling
setTextTrigger donehag :done_haggle "Command [TL="
SetTextTrigger donehaggling :done_haggle "empty cargo holds."
SetTextTrigger offerme :offerme "Your offer"
pause

:offerme
getWord CURRENTLINE $offer 3
stripText $offer "["
stripText $offer "]"
stripText $offer ","
stripText $offer "?"
setVar $orig_offer $offer

:rehaggle
killtrigger 0
killtrigger 2
killtrigger 3
setVar $offer (($orig_offer * $multiplier) / 100)
send $offer "*"
add $midhag 1
waitFor $offer
if ($multiplier > 100)
	subtract $multiplier 1
else
	add $multiplier 1
end
setTextTrigger 0 :done_haggle "How many holds of"
setTextTrigger 1 :rehaggle "Your offer"
setTextTrigger 2 :donehag "We're not interested."
setTextTrigger 3 :nocreds "You only have"
pause

:nocreds
setVAr $nocred 1
send "0*0*"
goto :done_haggle

:donehag
setVar $ni 1

:done_haggle
killtrigger donehag
killtrigger 0
killtrigger 1
killtrigger 2
killtrigger 3
killtrigger rehaggle
killtrigger donehaggling
killtrigger offerme
return
#/\/\ Variable Definitions /\/\
#$ni		- Boolean value for trading
#		1 - Port did not accept your offer
#		0 - Port bought/sold your/you product
#$offer		- Ports current offer and/or your offer
#$orig_offer	- Ports original offer
#$multiplier	- Multiplier for haggling
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

#-=-=-=-=-=-=-=-  PPT  =-=-=-=-=-=-=-=-
:ppt

setVar $sec $port1
setVar $other $port2
setVar $stopper 0

gosub :quikstats
setVar $maxholds $quikstats[HLDS]
setVAr $finholds $quikstats[ORE]
setVar $oinholds $quikstats[ORG]
setVar $einholds $quikstats[EQU]
setVar $totalinholds ($finholds + $oinholds + $einholds)
if ($totalinholds = $maxholds)
	if (PORT.BUYORE[$sec] = 1)
		setVar $finholds 0
	end
	if (PORT.BUYORG[$sec] = 1)
		setVar $oinholds 0
	end
	if (PORT.BUYEQUIP[$sec] = 1)
		setVar $einholds 0
	end
	setVar $totalinholds ($finholds + $oinholds + $einholds)
	if ($totalinholds = $maxholds)
		goto :nxtport
	end
end
:supg_PPT
killtrigger sell
killtrigger buy
killtrigger offport
send "pt"
waitfor "<Port>"
setTextTrigger nomore :nomore "You don't have anything they want,"
setTextLineTrigger fuel :fuelamt "Fuel Ore"
setTextLineTrigger orgs :orgsamt "Organics"
setTextLineTrigger equip :equipamt "Equipment"
setTextTrigger moretrade :traders "You have"
pause

:nomore
killtrigger fuel
killtrigger orgs
killtrigger equip
killtrigger moretrade
return

:fuelamt
getWord CURRENTLINE $fuelamt 5
stripText $fuelamt "%"
pause

:orgsamt
getWord CURRENTLINE $orgamt 4
stripText $orgamt "%"
pause

:equipamt
getWord CURRENTLINE $equipamt 4
stripText $equipamt "%"
pause

:traders
killtrigger nomore
setTextTrigger sellorbuy :sellorbuy "]?"
setTextTrigger offport :offport "Command [TL="
pause

:sellorbuy
getText CURRENTLINE $slloby "to " " ["
if ($slloby = "sell")
	goto :sell
else
	goto :buy
end

:sell
killtrigger offport
getWord CURRENTLINE $product 5
send "*"
setVar $multiplier (100 + $haggle)
gosub :haggle
if ($ni = 1)
	goto :supg_PPT
end
gosub :stopper
setTextTrigger sellorbuy :sellorbuy "]?"
pause

:buy
killtrigger offport
killtrigger sellorbuy
getWord CURRENTLINE $product 5
if ($product = "Fuel")
	if ((PORT.BUYEQUIP[$sec] = 0) AND (PORT.BUYEQUIP[$other] = 1)) OR ((PORT.BUYORG[$sec] = 0) AND (PORT.BUYORG[$other] = 1)) or (PORT.BUYFUEL[$other] = 0)
		send "0*"
		gosub :stopper
		goto :traders
	else
		gosub :buyit
	end
elseif ($product = "Organics")
	if ((PORT.BUYEQUIP[$sec] = 0) AND (PORT.BUYEQUIP[$other] = 1)) or (PORT.BUYORG[$other] = 0)
		send "0*"
		gosub :stopper
		goto :traders
	else
		gosub :buyit
	end
else
	if (PORT.BUYEQUIP[$other] = 0)
		send "0*"
	else
		gosub :buyit
	end
end
if ($ni = 1)
	goto :supg_PPT
end
:offport
killtrigger sellorbuy
gosub :stopper

:nxtport
if ($stopper = 0)
	setVar $other $sec
	if ($sec = $port1)
		setVar $sec $port2
	else
		setVar $sec $port1
	end
	send "m" $sec "**  "
	goto :supg_PPT
else
	killtrigger sell
	killtrigger buy
	return
end

:stopper
if ($product = "Fuel")
	if ($fuelamt <= $stopperc)
		if ((PORT.BUYEQUIP[$sec] = 0) AND (PORT.BUYEQUIP[$other] = 1)) OR ((PORT.BUYEQUIP[$sec] = 1) AND (PORT.BUYEQUIP[$other] = 0)) OR ((PORT.BUYORG[$sec] = 0) AND (PORT.BUYORG[$other] = 1)) OR ((PORT.BUYORG[$sec] = 1) AND (PORT.BUYORG[$other] = 0))
			if ($fuelamt = 0)
				setVar $stopper 1
			else
				setVar $stopper 0
			end
		else
			setVar $stopper 1
		end
	end
elseif ($product = "Organics")
	if ($orgamt <= $stopperc)
		if ((PORT.BUYEQUIP[$sec] = 0) AND (PORT.BUYEQUIP[$other] = 1)) OR ((PORT.BUYEQUIP[$sec] = 1) AND (PORT.BUYEQUIP[$other] = 0))
			if ($orgamt = 0)
				setVar $stopper 1
			else
				setVar $stopper 0
			end
		else
			setVar $stopper 1
		end
	end
elseif ($product = "Equipment")
	if ($equipamt <= $stopperc)
		setVar $stopper 1
	end
end
return

:buyit
send "*"
setVar $multiplier (100 - $haggle)
gosub :haggle
return

#/\/\ Variable Definitions /\/\
#$sec		- Current sector
#$port1		- Port number 1
#$port2		- Port number 2
#$haggle	- Haggle factor
#$multiplier	- Multiplier to haggle with
#$stopperc	- Percent to stop script when most profitable product gets to or below it.
#$ni		- Boolean value for trading
#		1 - Port did not accept your offer
#		0 - Port bought/sold your/you product
#$other		- Opposite sector of your current sector
#$stopper	- Boolean value to stop PPT
#		1 - Done PPT
#		0 - Not done PPT
#$fuelamt	- Amount of fuel on port
#$orgamt	- Amount of orgs on port
#$equipamt	- Amount of equip on port
#$product	- Product name currently being offered
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


#=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=
:quikstats
setVar $h[1] "Sect"
setVar $h[2] "Turns"
setVar $h[3] "Creds"
setVar $h[4] "Figs"
setVar $h[5] "Shlds"
setVar $h[6] "Hlds"
setVar $h[7] "Ore"
setVar $h[8] "Org"
setVar $h[9] "Equ"
setVar $h[10] "Col"  
setVar $h[11] "Phot"
setVar $h[12] "Armd"
setVar $h[13] "Lmpt"
setVar $h[14] "GTorp"
setVar $h[15] "TWarp"
setVar $h[16] "Clks"
setVar $h[17] "Beacns"
setVar $h[18] "AtmDt"
setVar $h[19] "Crbo"
setVar $h[20] "EPrb"
setVar $h[21] "MDis"
setVar $h[22] "PsPrb"
setVar $h[23] "PlScn"
setVar $h[24] "LRS"
setVar $h[25] "Aln"
setVar $h[26] "Exp"
setVar $h[27] "Ship"
setVar $cnt 0
send "/"
:chk
setTextLineTrigger getLine :getLine
pause

:getLine
killtrigger done
add $cnt 1
setVar $culine CURRENTLINE
replaceText $culine #179 " " & #179 & " "
setVar $line[$cnt] $culine
getWordPos $culine $pos " Ship "
if ($pos > 0)
	goto :done_read
end
goto :chk

:done_read
killtrigger getLine
setVar $hcount 0
:hcount
if ($hcount < 27)
	add $hcount 1
	setVar $lncount 1
	:lncount
	if ($lncount < $cnt)
		add $lncount 1
		getWordPos $line[$lncount] $pos $h[$hcount]
		if ($pos > 0)
			setVar $work $line[$lncount]
			cutText $work $work $pos 9999
			upperCase $h[$hcount]
			getWord $work $quikstats[$h[$hcount]] 2
			stripText $quikstats[$h[$hcount]] ","
		else
			goto :lncount
		end
	end
	goto :hcount
end
return
###################################################