# check if we can run it from here
processin 1 "SUPGSCRIPT_AUTO_OFF"
processin 1 "SUPGSCRIPT_BWARP_OFF"
cutText CURRENTLINE $location 1 12
getText CURRENTLINE $strtsec "]:[" "] ("
if ($location <> "Command [TL=") OR ($strtsec <> STARDOCK)
        clientMessage "This script must be run from the command menu at StarDock"
        halt
end
loadVar $furbSaved
if ($furbSaved)
	loadVar $furb_porl
	loadVar $furb_fuelsec
	loadVar $furb_Per
	loadVar $furb_Trigger
	loadVar $furb_Ship
	loadVar $furb_startHolds
	loadVar $furb_tpw
	loadVar $furb_pnum
	loadVar $furb_name
	loadVar $furb_fakeShip
	loadVar $furb_fakeStartHolds
	loadVar $furb_fakeTpw
	loadVar $furb_fakeTrigger
	loadVar $furb_fakeName
else
	gosub :shipinfo_inc~furbFinder
	setVar $furb_Ship $shipinfo_inc~bestShip
	setVar $furb_startHolds $shipinfo_inc~bestStartHolds
	setVar $furb_tpw $shipinfo_inc~bestTPW
	setVar $furb_fakeShip $shipinfo_inc~bestFakeShip
	setVar $furb_fakeStartHolds $shipinfo_inc~bestFakestartholds
	setVar $furb_faketpw $shipinfo_inc~bestfaketpw
	setVar $furb_Trigger "furb my ta"
	setVar $furb_Per 5
	setVar $furb_fuelsec 0
	setVar $furb_porl "Port"
	setVar $furb_pnum 0
	setVAr $furb_name "SupGFurbie"
	setVar $furb_fakeTrigger "fake my ta"
	setVar $furb_fakeName "SupGFakeFurbie"
end

gosub :save

:menu
echo "[2J"
:errmenu
setVar $signature_inc~scriptName "SupGFurb"
setVar $signature_inc~version "1.d"
setVar $signature_inc~date "03/03/04"
gosub :signature_inc~signature
echo ANSI_14 "1." ANSI_15 " Furbs per request " ANSI_10 "["
echo ANSI_6 $furb_Per
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Fuel Sector       " ANSI_10 "["
echo ANSI_6 $furb_fuelsec " - " $furb_porl
if ($furb_porl = "Planet")
	echo " - " $furb_pnum
end
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Trigger Phrase    " ANSI_10 "["
echo ANSI_6 $furb_Trigger
echo ANSI_10 "]*"
echo ANSI_14 "4." ANSI_15 " Fake Bust Trigger " ANSI_10 "["
echo ANSI_6 $furb_fakeTrigger
echo ANSI_10 "]*"
echo ANSI_14 "5." ANSI_15 " Furb Names        " ANSI_10 "["
echo ANSI_6 $furb_name
echo ANSI_10 "]*"
echo ANSI_14 "6." ANSI_15 " Fake Furb Names   " ANSI_10 "["
echo ANSI_6 $furb_fakename
echo ANSI_10 "]*"
echo ANSI_14 "C  " ANSI_15 "Continue*"
echo ANSI_10 "**Furb Ship : " ANSI_15 $furb_Ship "*"
echo ANSI_10 "Fake Furb Ship : " ANSI_15 $furb_fakeShip "*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to run*the script.*"
getConsoleInput $choice singlekey

if ($choice = 1)
	getInput $per "How many furbs to bring out each request?"
	isNumber $chk $per
	if ($chk) AND ($furb_per > 0)
		setVar $furb_per $per
	end
elseif ($choice = 2)
	:enterfuelsec
	GetInput $ore "Which sector do u wish to buy ORE in?"
	isNumber $num $ore
	if ($num)
		if ($ore > 1) and ($ore < SECTORS)
			setVar $furb_fuelsec $ore
		end
	else
		goto :enterfuelsec
	end
:fueltype
	echo ansi_13 "*P" ANSI_7 "ort or P" ANSI_13 "l" ANSI_7 "anet"
	getconsoleinput $porl singlekey
	lowercase $porl
	setVar $porlinit $porl
	if ($porl <> "p") and ($porl <> "l")
		goto :fueltype
	end
	if ($porl = "l")
		setVar $furb_porl "Planet"
		getinput $furb_pnum "Planet Number"
	end
	if ($porl = "p")
		setVar $furb_porl "Port"
	end
elseif ($choice = 3)
	getinput $trigger "Trigger Text (what should your reds say in SS to get a furb?)"
	if ($trigger = $furb_fakeTrigger)
		echo ANSI_15 "*Triggers for MEGA furbs and regular furb cannot be the same*"
		goto :errmenu
	else
		setVar $furb_Trigger $trigger
	end
elseif ($choice = 4)
	getinput $trigger "Fake Bust Trigger Text (what should your reds say in SS to get a MEGA furb?)"
	if ($trigger = $furb_Trigger)
		echo ANSI_15 "*Triggers for MEGA furbs and regular furb cannot be the same*"
		goto :errmenu
	else
		setVar $furb_fakeTrigger $trigger
	end
elseif ($choice = 5)
	getinput $name "What do you want to name your furbs?"
	if ($name = $furb_fakeName)
		echo ANSI_15 "*MEGA furbs cannot have the same name as regular furbs*"
		goto :errmenu
	else
		setVar $furb_Name $name
	end
elseif ($choice = 6)
	getinput $name "What do you want to name your MEGA furbs?"
	if ($name = $furb_Name)
		echo ANSI_15 "*MEGA furbs cannot have the same name as regular furbs*"
		goto :errmenu
	else
		setVar $furb_fakeName $name
	end
elseif ($choice = "c")
	if ($furb_fuelSec < 2) or ($furb_fuelSec > SECTORS)
		echo ANSI_15 "*Invalid Fuel Sector*"
		goto :errmenu
	end
	getLength $furb_trigger $triggerlength
	gosub :save
	goto :top
else
	goto :menu
end
goto :menu

:top
setVar $init 1
gosub :gameinfo_inc~quikstats
setVar $shipnum $gameinfo_inc~quikstats[SHIP]
setVar $stardock STARDOCK
setVar $total_holds $gameinfo_inc~quikstats[HLDS]
if ($gameinfo_inc~quikstats[ALN] < 1000)
	echo ANSI_15 "**You must be commissioned to run this script.**"
	halt
end

send "'*-=- SupGFurb script running type '" $furb_trigger "' in subspace to*receive your furbs (22 Holds), or type '" $furb_fakeTrigger "' in ss to*receive a MEGA furb (50 holds)-=-**"
waitFor "Sub-space comm-link terminated"

:sendfurb
setVar $furbsent 0
setVar $loc "stardock"
setTextLineTrigger lock :realbust $furb_trigger
setTextLineTrigger fakebust :fakebust $furb_fakeTrigger
setTextLineTrigger fighit :fighit "Deployed Fighters Report Sector"
setTextLineTrigger limpet :trip_limpet "Limpet mine in"
pause

:realbust
killtrigger fakebust
setVar $buytill 63
setVar $namefurb $furb_name
setVAr $furb_type 1
setVAr $furbInv 0
setVAr $triggerfurb $furb_trigger
goto :traderta

:fakebust
killtrigger lock
setVar $buytill 147
setVAr $furbsent ($furb_Per - 1)
setVar $namefurb $furb_fakename
setVAr $furb_type 2
setVar $furbInv $furbsent
setVar $triggerfurb $furb_fakeTrigger


:traderta
killtrigger fighit
killtrigger limpet
cutText CURRENTLINE $test 10 $triggerlength
if ($test <> $triggerfurb)
	goto :sendfurb
end
getText CURRENTLINE $user "R " " " & $triggerfurb
setVar $trim_inc~word $user
gosub :trim_inc~trim
setVar $user $trim_inc~word
waitFor "Command [TL="
send "ta"
waitfor "-------------------"
setTextLineTrigger user :user $user
setTextTrigger nouser :nouser "Corporate command"
pause

:nouser
killtrigger user
goto :sendfurb

:user
killtrigger nouser
CutText CURRENTLINE $secnum 40 6
stripText $secnum " "
send "q"

:lockon
if ($furbsent >= $furb_Per)
	goto :sendfurb
end

send "wn"
waitFor "----------------------------------"
:chkfurb
setTextLineTrigger furbchk :furbchk $namefurb
setTextTrigger none :buyfurbs "You do not own any other ships in this sector!"
setTextTrigger nofurbs :buyfurbs "Choose which ship to tow"
pause

:furbchk
killtrigger nofurbs
killtrigger none
getWord CURRENTLINE $furbnum 1
send $furbnum "*"
goto :deliver

:buyfurbs
killtrigger nofurbs
killtrigger none
killtrigger furbchk
Send "q*ps"
SetTextTrigger limpet :nolimp "<StarDock> Where to?"
SetTextLineTrigger nolimp :limpet "and removal?"
pause
 

:limpet
killtrigger limpet
Send "y"

:nolimp
killtrigger nolimp
send "sbny"

if ($init = 1)
	send "?"
	setVAr $page 0
	:init
	if ($shipFound = 0)
		setTextLineTrigger ship :shipLetter $furb_ship
	end
	if ($fakeshipFound = 0)
		setTextLineTrigger fakeship :fakeshipLetter $furb_fakeShip
	end
	setTextTrigger nxtpage :nxtPage "<+>"
	setTextTrigger notthere :notthere "<Q>"
	pause

	:nxtPage
	killtrigger ship
	killtrigger nothere
	killtrigger fakeship
	add $page 1
	send "+"
	goto :init
	
	:notthere
	killtrigger ship
	killtrigger nxtpage
	killtrigger fakeship
	echo ANSI_15 "**Unable to locate furbing ship, script halting.  Send ship list with this error to SupG at supg@charter.net**"
	halt

	:shipLetter
	killtrigger nxtpage
	killtrigger notthere
	killtrigger fakeship
	getWord CURRENTLINE $shipLetter 1
	stripText $shipLetter "<"
	stripText $shipLetter ">"
	setVar $shipFound 1
	setVar $shipPage $page
	if ($fakeshipFound = 1)
		setVar $init 0		
		goto :buy
	else
		goto :init
	end

	:fakeshipLetter
	killtrigger nxtpage
	killtrigger notthere
	killtrigger ship
	getWord CURRENTLINE $fakeshipLetter 1
	stripText $fakeshipLetter "<"
	stripText $fakeshipLetter ">"
	setVar $fakeshipFound 1
	setVar $fakePage $page
	if ($shipFound = 1)
		setVar $init 0
		goto :buy
	else
		goto :init
	end
else
	if ($furb_type = 1)
		setVar $page $shipPage
	else
		setVar $page $fakePage
	end
	if ($page > 0)
		setVar $cnter 0
		:pgcnter
		if ($cnter < $page)
			send "+"
			goto :pgcnter
			add $cnter 1
		end
	end
end

:buy
if ($furb_type = 1)
	send $shipLetter 
else
	send $fakeshipLetter
end
setTextTrigger nocash :nocash "You can not afford it!"
setTextTrigger buyit :buyit "Want to buy it?"
pause

:buyit
killtrigger nocash
send "y"

setTextTrigger claim :claim "Should this be a"
setTextTrigger name :nameit "What do you want to name"
pause

:claim
send "p"
pause

:nameit
killtrigger claim
send $namefurb "***q"
add $furbinv 1
if ($furbinv < $furb_Per)
	goto :nolimp
else
	send "s"
	gosub :loadships
end
goto :lockon 


:loadships
send "s"
waitFor "--------------------"
setVar $nums 0
:shipnumtrigs
setTextLineTrigger shipnums :getShipNums $namefurb
setTextTrigger done :addholds "Choose which ship to sell ("
pause

:getShipNums
killtrigger done
add $nums 1
getWord CURRENTLINE $load[$nums] 1
goto :shipnumtrigs

:addholds
killtrigger shipnums
send "qqq"
setVar $numscnt 0
killtrigger furb
:loadem
if ($numscnt < $nums)
	add $numscnt 1
	if ($furb_Type = 1)
		setVar $buyHolds ($buytill - $furb_startHolds)
	else
		setVar $buyHolds ($buytill - $furb_fakestartHolds)
	end
	if ($buyHolds > 0)
		setVar $ship_inc~xportto $load[$numscnt]
		gosub :ship_inc~xport
		if ($ship_inc~xportto < 1)
			goto :loadem
		end
		setVar $stardock_inc~dock "shipyard"
		gosub :stardock_inc~stardock
		send "p"
		waitfor "Commerce report for:"
		setTextLineTrigger maxholdsbuy :maxbuyable "A  Cargo holds"
		pause

		:maxbuyable
		send "a"
		getWord CURRENTLINE $maxbuyable 10
		if ($maxbuyable < $buyHolds)
			send "'(SupGFurb) - I don't have enough credits to buy anymore furbs, Script Halting...*"
			send "0*qqq"
			halt
		else
			send $buyHolds "*yqqq"
		end
	end
	goto :loadem
end
setVar $ship_inc~xportto $shipnum
gosub :ship_inc~xport
if ($ship_inc~xportto < 1)
	send "' (SupGFurb) - I cannot get back in my ship, script halting...*"
	halt
end
return

:deliver
setVAr $ship_inc~twarpto $secnum
gosub :ship_inc~twarp
if ($ship_inc~twarpto > 0)
	setVar $loc "furbsec"
	send "w"
elseif ($ship_inc~twarpto = "-3")
	send "'(SupGFurb) - Unable to transwarp, I don't have enough fuel.*w"
	halt
elseif ($ship_inc~twarpto = "-4")
	send "'(SupGFurb) - Unable to transwarp, no jump point fighter. Cannot blind warp.*w"
	goto :sendfurb
end

:getore
waitfor "You shut off your Tractor Beam."
send "tc"
waitfor "(?=Help)? C"
:getCreds
setVar $person 0
setTextTrigger choose :choose "(Y/N) [N]?"
setTextTrigger nochoice :non "Corporate command [TL="
setTextLineTrigger nocorpie :non "Your Associate must be in the same sector to conduct transfers!"
pause

:choose
killalltriggers
setVar $line CURRENTLINE
getWordPos $line $person $user
if ($person > 0)
	send "yf"
	setTextLineTrigger creds :getem "credits, and"
	pause
	:getem
	getText CURRENTLINE $gotcreds " has " "."
	stripText $gotcreds ","
	setVar $take $gotcreds
	subtract $take 300000
	if ($take > 0)
		send $take "*"
	else
		send "*"
	end
else
	send "n"
	goto :getCreds
end

:non
killalltriggers
send "q"
if ($furb_fuelsec = $secnum)
	goto :fuelsec
else
	if (PORT.CLASS[$secnum] > 0) and (PORT.BUYFUEL[$secnum] = 0)
		goto :port
	end
	setVar $ship_inc~twarpto $furb_fuelsec
	gosub :ship_inc~twarp
	if ($ship_inc~twarpto = "-2")
		send "'(SupGFurb) - Unable to transwarp, I'm being held by an IG. May need assistance.*"
		halt
	elseif ($ship_inc~twarpto = "-3")
		send "'(SupGFurb) - Unable to transwarp, I don't have enough fuel.*"
		halt
	elseif ($ship_inc~twarpto = "-4")
		send "'(SupGFurb) - Unable to transwarp, no jump point fighter. Cannot blind warp.*"
		halt
	end
end



:fuelsec
setVar $loc "fuelsec"
killtrigger mine
if ($furb_porl = "Port")
:port
	send "pt"
	setTextLineTrigger fuelore :portfuelore "Fuel Ore   Selling"
	Pause
elseif ($furb_porl = "Planet")
	send "l" $furb_pnum "*"
	setTextLineTrigger planetore :planetfuelore "Fuel Ore"
	pause
end

 
:portfuelore
send "**"
getWord CURRENTLINE $fuel_amount 4
getWord CURRENTLINE $ship_amount 6
goto :chkholds

:planetfuelore
send "tnt1*q"
getWord CURRENTLINE $fuel_amount 6
getWord CURRENTLINE $ship_amount 7
stripText $fuel_amount ","
striptext $ship_amount ","

:chkholds
setVar $empty_holds $total_holds
subtract $empty_holds $ship_amount
if ($empty_holds > $fuel_amount)
	if ($furb_porl = "Port")
		gosub :upgrade
		goto :fuelsec
	else
		send "'(SupGFurb) - Need fuel on planet " $furb_pnum ", say 'fuel ready' when fuel is on planet.*"
		waitfor "Message sent on sub-space channel"
		waitfor "fuel ready"
		goto :fuelsec
	end
end
subtract $fuel_amount $empty_holds
if ($fuel_amount < $total_holds)
	if ($furb_porl = "Port")
		gosub :upgrade
	else
		send "'(SupGFurb) - Planet " $furb_pnum " will need fuel after next furb*"
	end
end
	
:dock
setVar $ship_inc~twarpto $stardock
gosub :ship_inc~twarp
if ($ship_inc~twarpto > 0)
	add $furbsent 1
	goto :lockon
elseif ($ship_inc~twarpto = "-2")
	send "'(SupGFurb) - Unable to transwarp, I'm being held by an IG. May need assistance.*"
	halt
elseif ($ship_inc~twarpto = "-3")
	send "'(SupGFurb) - Unable to transwarp, I don't have enough fuel.*"
	halt
elseif ($ship_inc~twarpto = "-4")
	send "'(SupGFurb) - Unable to transwarp, no jump point fighter. Cannot blind warp.*"
	halt
end



:upgrade
setVar $port_inc~upg_amnt 9
setVar $port_inc~upg_prod 1
gosub :port_inc~upgradePort
if ($port_inc~upg_amnt > 0)
	gosub :port_inc~upgradePort
end
return


:fighit
killtrigger lock
killtrigger limpet
killtrigger fakebust
getWord CURRENTLINE $activated_sector 5
stripText $activated_sector ":"
isNumber $test $activated_sector
if ($test = 0)
	goto :sendfurb
end
getWord CURRENTLINE $hitter 6
striptext $person "^M" 
striptext $person "'s"
:dist
getDistance $hops $activated_sector $furb_fuelsec
if ($hops > 1)
	waitfor "(?="
	send "'(SupGFurb) - " $hitter " tripped " $hops " hops from cashing area.*"
end
if ($hops < 4)
	send "'(SupGFurb) - WARNING: CLOSE FIG HIT, RETREAT TO SAFE AREAS*"
	sound message.wav
end
goto :sendfurb

:limpet
killtrigger lock
killtrigger fighit
killtrigger fakebust
getWord CURRENTLINE $activated_sector 4
getWord CURRENTLINE $filter 1

stripText $sector ":"
if ($filter <> "Limpet")
	goto :sendfurb
else
	setVar $hitter "Limpet"
	goto :dist
end

:save
saveVar $furb_porl
saveVar $furb_fuelsec
saveVar $furb_Per
savevar $furb_Trigger
saveVar $furb_Ship
saveVar $furb_startHolds
saveVar $furb_tpw
saveVar $furb_pnum
saveVar $furb_name
saveVar $furb_fakeShip
saveVar $furb_fakeStartHolds
saveVar $furb_fakeTpw
saveVar $furb_fakeTrigger
saveVar $furb_fakeName

setVar $furbSaved 1
saveVar $furbSaved
return

halt
include "supginclude\signature_inc"
include "supginclude\gameinfo_inc"
include "supginclude\port_inc"
include "supginclude\ship_inc"
include "supginclude\stardock_inc"
include "supginclude\shipinfo_inc"
include "supginclude\trim_inc"