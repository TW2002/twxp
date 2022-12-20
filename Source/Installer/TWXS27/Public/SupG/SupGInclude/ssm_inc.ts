#=-=-=-=-=-=-= SSM  =-=-=-=-=-=-=-=-=-=-=-
:ssm
setVar $noexp 0
setVar $sec $port1
gosub :quikstats
setVar $exp $quikstats[EXP]
setVar $thold $quikstats[HLDS]

:steal
setVar $maxhold $exp
divide $maxhold $stdiv
if ($maxhold > $thold)
	setVar $maxhold $thold
end
:sport
send "pr*sz"
setTextTrigger fake :fbusted "Do you want instructions (Y/N)"
setTextTrigger good :cont "Which product?"
pause

:cont
killtrigger fake
setTextTrigger success :success "Success!"
setTextTrigger busted :busted "Suddenly you're Busted"
setTextTrigger upgrade :upgrade "There aren't that many holds"
send "3" $maxhold "*"
pause

:upgrade
killtrigger success
killtrigger busted
setVar $upgrade (($maxhold / 10) + 1)
setVar $upg_amnt $upgrade
setVAr $upg_prod 3
gosub :upgradePort
if ($upg_amnt = "-1")
	send "'SSM - Could not upgrade port, it's either maxed or I don't have enough money*"
	halt
end
goto :sport

:success
killtrigger busted
killtrigger upgrade
setVar $addexp $maxhold
multiply $addexp 90
if ($addexp < 1000)
	goto :norec
end
divide $addexp 1000
add $exp $addexp
:rhag
send "pt*"
setVar $multiplier (100 + $haggle)
if ($hag = 1) and ($multiplier <> 100)
	waitFor "How many holds of"
	setVar $ni 0
	gosub :haggle
	if ($ni = 1)
		goto :rhag
	end
else
	send "*"
end
if (PORT.BUYFUEL[$sec] = 0)
	send "0*"
end
if (PORT.BUYORG[$sec] = 0)
	send "0*"
end
if ($sec = $port1)
	setVar $sec $port2
else
	setVar $sec $port1
end
send "m" $sec "**  "
goto :steal
:fbusted
killtrigger good
send "*"
:busted
killtrigger success
killtrigger upgrade
setVar $busted $sec
return

:norec
echo "*Not enough experience*"
setVar $noexp 1
return

#/\/\ Variable Definitions /\/\
#$sec		- Current sector
#$port1		- Port number 1
#$port2		- Port number 2
#$exp		- Current experience
#$stdiv		- Steal divisor
#$maxhold	- Max holds to steal
#$thold		- Total holds on ship
#$upgrade	- Amount to upgrade port (if needed)
#$addexp	- Experience to add upon successful steal
#$haggle	- Haggle factor
#$multiplier	- Multiplier to haggle with 
#$ni		- Boolean value for trading
#		1 - Port did not accept your offer
#		0 - Port bought/sold your/you product
#$busted	- Sector you busted at
#$noexp		- Boolean value for experience
#		1 - You are not gaining experience
#		0 - You are gaining experience
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
	
#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

###########################################
:upgradePort
send "o" $upg_prod
setTextTrigger maxupg :maxupg "to quit)"
pause

:maxupg
getWord CURRENTLINE $upg_maxupg 9
striptext $upg_maxupg "("

if ($upg_maxupg < $upg_amnt)
	setVar $upg_amnt "-1"
else
	send $upg_amnt "*q"
end
return

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