loadvar $BOT_NAME
setvar $bot $BOT_NAME
loadvar $PTRADESETTING
setvar $Ptrade $PTRADESETTING
setvar $meet 0
loadvar $MAX_PLANETS_PER_SECTOR
setvar $gameMaxPlan $MAX_PLANETS_PER_SECTOR
setvar $bluebot "None"

#lsd [1-atomics] [2-beacons] [3-corbo] [4-cloaks] [5-probes] <6-pscan> [7-limps] [8-mines] 
#[9-photons] <10-lrscan> [11-disr] [12-torps] <13-twarp> [14-holds] [15-figs] [16-shields] <17-tow>
#lsd 0@0@0@0@0@N@0@0@0@N@0@M@N@0@100@0@0@0@0@0 buys max torps and 100 figs.

#R ed     SECT = 4349       |HLDS = 120|FIGS = 1035   |ARMD = 0    |TWARP = 1
#R ed     TURNS = 1243      |ORE = 72  |SHLDS = 0     |LMPT = 0    |PLSCN = No
#R ed     CREDS = 167518    |ORG = 0   |PHOT = 0      |GTORP = 8   |LRS = Dens
#R ed     ALN = 1446        |EQU = 0   |CRBO = 0      |ATMDT = 0   |PSPRB = No
#R ed     EXP = 3648        |COL = 0   |MDIS = 0      |BEACNS = 0  |EPRB = 0
#R ed     SHIP = 2

#R zep    Shiptype    = Imperial StarShip
#R zep    Sect 5233 |Turn 2063 |Cred 2200000 |Figs 500 |Shld 0
#R zep    Hlds 140 |Gas 140 |Org 0 |Eq 0 |Colo 0 |Phot 0 |Armd 0
#R zep    Lmpt 0 |Gtrp 0 |Twrp 2 |Clks 0 |Bcns 0 |AtmD 0 |Corb 0
#R zep    Eprb 0 |Pcan YES |Lscn HOLO |MDis 0 |Algn 1000
#R zep    Exp 0 |Ship 7

:menu
loadVar $GopopSaved
if ($GopopSaved)
loadVar $Gopop_Refresh
loadVar $Gopop_BlueBot
loadVar $GoPop_SitShip
loadVar $GoPop_SecMax
loadVar $GoPop_CleanUp
else

setvar $Gopop_Refresh "No"
setvar $Gopop_BlueBot "None"
setvar $Gopop_SitShip "0"
setvar $GoPop_SecMax "no"
setvar $GoPop_CleanUp "no"
savevar $Gopop_Refresh
savevar $Gopop_BlueBot
savevar $Gopop_SitShip
savevar $GoPop_SecMax
savevar $GoPop_CleanUp
setvar $GopopSaved 1
savevar $GopopSaved
end

addmenu "" "Gopop" "Go pop planets for CASH" "." "" "Main" FALSE
addmenu "Gopop" "Start" "Start Gopop" "S" :Menu_Start "" TRUE
addmenu "Gopop" "Refresh" "Refresh Fig List" "1" :Menu_Refresh "" FALSE
addmenu "Gopop" "BlueBot" "BlueBot Name (or 'none')" "2" :Menu_BlueBot "" FALSE
addmenu "Gopop" "SitShip" "Sitter Ship" "3" :Menu_SitShip "" FALSE
addmenu "Gopop" "SecMax" "Blow Overload Planet" "4" :Menu_SecMax "" FALSE
addmenu "Gopop" "CleanUp" "Blow all Planets" "5" :Menu_CleanUp "" FALSE
setMenuHelp "Start" "Pressing 'S' will Start up Gopop."
setMenuHelp "Refresh" "If enabled, this will automatically refresh the Fig List."
setMenuHelp "BlueBot" "Enter none for no blue bot furb"
setMenuHelp "SitShip" "If using a blue furber, you must have a sitter ship."
setMenuHelp "SecMax" "Will blow a planet made after sector maximum is reached to pop next planet with 10% navhaz and overload."


gosub :setmenu
openmenu "Gopop"

:Menu_Refresh
getinput $Gopop_Refresh "Refresh figs? yes/no "
if (($Gopop_Refresh = "yes") or ($Gopop_Refresh = "Yes"))
setVar $Refresh 1
else
setVar $Refresh 0
end
saveVar $Gopop_Refresh
saveVar $Refresh
gosub :SetMenu
openMenu "Gopop"

:Menu_BlueBot
getInput $Gopop_BlueBot "Enter Blue Furber Bot Name "
saveVar $Gopop_BlueBot
setVar $BlueBot $Gopop_BlueBot
gosub :SetMenu
openMenu "Gopop"

:Menu_SitShip
getInput $Gopop_SitShip "Enter Sitter Ship Number "
saveVar $Gopop_SitShip
setVar $sitship $Gopop_SitShip
gosub :SetMenu
openMenu "Gopop"

:Menu_SecMax
getinput $Gopop_SecMax "Blow overload planet before popping another? yes/no "
if (($Gopop_SecMax = "yes") or ($Gopop_SecMax = "Yes"))
setVar $secmax 1
else
setVar $secmax 0
end
savevar $Gopop_SecMax
gosub :SetMenu
openMenu "Gopop"

:Menu_CleanUp
getinput $Gopop_CleanUp "Blow all planets before leaving sector? yes/no "
if (($Gopop_Cleanup = "yes") or ($Gopop_Cleanup = "Yes"))
setVar $Clean_Up 1
else
setVar $Clean_Up 0
end
gosub :SetMenu
openMenu "Gopop"


:SetMenu
if (($Gopop_Refresh = "yes") or ($Gopop_Refresh = "Yes"))
setMenuValue "Refresh" "yes"
setVar $Refresh 1
else
setMenuValue "Refresh" "no"
setVar $Refresh 0
end

if ($Gopop_BlueBot = "None") or ($Gopop_BlueBot = "") or ($Gopop_BlueBot = "none")
setMenuValue "BlueBot" "None"
setvar $self_furb 1
elseif ($Gopop_BlueBot <> 0)
setVar $bluebot $Gopop_BlueBot
setvar $self_furb 0
setMenuValue "BlueBot" $bluebot
end

if ($Gopop_SitShip = 0)
setMenuValue "SitShip" 0
elseif ($Gopop_SitShip > 0)
setVar $sitship $Gopop_SitShip
setMenuValue "SitShip" $sitship
end

if (($Gopop_SecMax = "yes") or ($Gopop_SecMax = "Yes"))
setMenuValue "SecMax" "yes"	
setVar $secmax 1
saveVar $Gopop_SecMax	
else
setMenuValue "SecMax" "no"	
saveVar $Gopop_SecMax	
setVar $secmax 0
end

if (($Gopop_Cleanup = "yes") or ($Gopop_Cleanup = "Yes"))
setMenuValue "CleanUp" "yes"
setVar $Clean_Up 1

else
setMenuValue "CleanUp" "no"	
setVar $Clean_Up 0
end
savevar $Gopop_Cleanup

return

:Menu_Start
if ($Refresh = 1)
send "'" $Bot " figs*"
waiton "Sub-space comm-link terminated"
waiton $Location
end


send "'You botname is " $bot "*"
send "'Blue furb is " $bluebot "*"
send "'$self_furb is " $self_furb "*"
send "'Sitter ship is " $sitship "*"

if $self_furb
	goto :self_furb
end

waiton "Command [TL"
send "x"
waiton " " & $sitship & " "
getword currentline $sitsec 2
waiton "Choose which ship to beam to"
send "q"
waiton "Command [TL"
send "'Sit sector is " $sitsec "*"

killalltriggers
settexttrigger mom :mom "SECT = "
settexttrigger kbot :kbot "Shiptype"
send "'" $bluebot " qss*"
pause

:mom
killalltriggers
setvar $bottype "mom"
gettext currentline $bfsec "SECT = " "   "
waiton "SHIP"
gettext currentline $blueship "SHIP = " ""
waiton "Command [TL"
send "'Blue furber is running mombot, in ship " $blueship " in sector " $bfsec "*"
goto :botdone

:kbot
killalltriggers
setvar $bottype "kbot"
waiton "Sect"
gettext currentline $bfsec "Sect " " "
waiton "Ship"
gettext currentline $blueship "Ship " ""
waiton "Command [TL"
send "'Blue furber is running kbot, in ship " $blueship " in sector " $bfsec "*"

:botdone
waiton "Command [TL"
#if ($doc <> STARDOCK)
#send "'He's not at stardock.  Stopping.*"
#halt
#end

send "'" $bot " qss*"
waiton "SECT"
gettext currentline $here "SECT = " "   "
waiton "SHIP"
gettext currentline $mtship "SHIP = " ""
waiton "Command [TL"
send "'I'm in ship " $mtship " in sector " $here "*"
waiton "Command [TL"

send "c;"
settextlinetrigger xrange :xrange "Transport Range:"
pause

:xrange
getword currentline $xrange 6
send "q"
waiton "Command [TL="
if $self_furb = 0
send "x*"
waitfor "<Transport to Ship>"
waitfor "Command [TL"
#echo "**" $bluebot "**"
	
getDistance $bluetobfsec $sitsec $bfsec
getDistance $bluefrombfsec $bfsec $sitsec

if ($bluetobfsec > $xrange) or ($bluefrombfsec > $xrange)
send "'Gotta move the blue furber*"
waiton "Message sent on sub"
send "'" $bluebot " t " $sitsec "*"

waiton $bluebot & "} - T-warp completed"
waiton "Command [TL="
setvar $bfsec $sitsec
end

end	

cutText CURRENTLINE $location 1 7

if ($location <> "Command")
        clientMessage "This script must be run from the game command menu"
        halt
end

:self_furb

# lets find out what sort of scanner this ship has
gosub :doarrays

send "i"
setTextLineTrigger 1 :getScanner "LongRange Scan :"
waitFor "Credits      "
clientMessage "No long range scanner detected!"
halt
:getScanner
getWord CURRENTLINE $scanType 4

# away we go!
:sub_Scan
  send "s"

  if ($scanType = "Holographic")
    send "d"
  end
  
  waitFor "Relative Density Scan"

  # clear all the old warp info
  setVar $i 1
  :clearNext
  setVar $warp[$i] 0
  setVar $warpCount[$i] 0
  setVar $density[$i] "-1"
  setVar $weight[$i] 9999
  setVar $anom[$i] "No"
  setVar $explored[$i] 1
  if ($i = 6)
    goto :warpsCleared
  else
    add $i 1
    goto :clearNext
  end
  :warpsCleared

  # now we retrieve new warp info
  setVar $i 1
  setTextLineTrigger 1 :getWarp "Sector "
  setTextTrigger 2 :gotWarps "Command [TL="
  pause
  :getWarp
  setVar $line CURRENTLINE
  stripText $line "("
  getWord $line $warp 2
  getWord $line $density 4
  getWord $line $warpCount 7
  getWord $line $anom 13
  getLength $warp $length
  cutText $warp $explored $length 1
  if ($explored = ")")
    setVar $explored 0
  else
    setVar $explored 1
  end
  stripText $warp ")"
  stripText $density ","
  setVar $warp[$i] $warp
setVar $density[$i] $density
  setVar $warpCount[$i] $warpCount
  setVar $anom[$i] $anom
  setVar $explored[$i] $explored
  add $i 1
  setTextLineTrigger 1 :getWarp "Sector "
  pause
  :gotWarps
  killTrigger 1
  killTrigger 2

  # ok - now that we've got all our warp info, we need
  # to use a weighting system with the sectors to determine
  # which would be the best to warp into

  setVar $i 1
  setVar $bestWarp 1
  setVar $holo 0
  :weightWarp
  if ($warp[$i] > 0)
		setVar $weight[$i] 0
		if ($figs[$warp[$i]] <> 0)
			setVar $density[$i] 0
		end
		
	
		if ($figs[$warp[$i]] = 0) and (($density[$i] - 100) > 1)
			add $weight[$i] 1000
		end
	
		if ($density[$i] > 0) and ($density[$i] <> 100)
		# very bad! don't warp into non 0 or 100 sector!
			add $weight[$i] 1000
		end
		
			
		if ($density[$i] = 100) and (SECTOR.EXPLORED[$warp[$i]] = "DENSITY") 
			if  ($scanType = "Holographic")
			#Some turds like to drop 20 figs so lets holo that pretty little "port" if we can.
			send "sh*"
			waitfor "Long Range Scan"
			waitFor "Command [TL="
			end
		end
		
		
		
		if ($anom[$i] <> "No") and ($figs[$warp[$i]] = 0)
			# avoid sectors with anomoly as much as possible
			add $weight[$i] 1000
		end
		
		if ($explored[$i] = 1)
			# try and avoid explored sectors
			add $weight[$i] 10
		end
		
		if ($warp[$i] = $lastWarp)
			# avoid going backwards
			add $weight[$i] 20
		end
		
		if ($density[$i] = 0) 
			#we really want ports instead of empty sectors
			add $weight[$i] 1
		end
		
		if  ($scanType = "Holographic")
			if (($density[$i] = 100) and (SECTOR.EXPLORED[$warp[$i]] <> "YES") and (PORT.EXISTS[$warp[$i]] = 0))
				add $weight[$i] 1000
			end		
		end			
		if ($density[$i] = 100) and (SECTOR.EXPLORED[$warp[$i]] = "YES") and (PORT.EXISTS[$warp[$i]] = 1) and (PORT.BUYEQUIP[$warp[$i]] = 0)
			add $weight[$i] 3
		end
		
	
	
		
	
	


		# high amount of warps = higher chance of us going there!
		setVar $x 6
		subtract $x $warpCount[$i]
		
		# make sure we have some random in there to stop it from
		# getting stuck
		getRnd $rand 1 10
		add $weight[$i] $rand
		
		# find the best warp
		if ($weight[$bestWarp] > $weight[$i])
			setVar $bestWarp $i
		end
		add $i 1
		goto :weightWarp
  end

  # now we know our best warp, lets see if its a safe one
  if ($weight[$bestWarp] > 100)
    # looks unsafe, better to stop and wait for the user.
    clientMessage "Script walled in!  Halted."
    halt
  end

  
  # lets move
  send $warp[$bestWarp] "*z*"
  setVar $lastWarp $thisWarp
  setVar $thisWarp $warp[$bestWarp]
  waitFor "Sector  : "
  waitFor "Command [TL="
  getSector $warp[$bestWarp] $s
  

  # dock at a port if theres one here
  
send "fz1*cqd *"
setvar $figs[$thisWarp] 1
setSectorParameter $thisWarp "FIGSEC" 1
			waitfor "<Re-Display>"
			waitfor "Command [TL="
  if (PORT.EXISTS[$thisWarp] = 0) or ($thisWarp = STARDOCK) or ($thisWarp < 11) or (PORT.BUYEQUIP[$thisWarp] = 0)
	  goto :skipit
  end
  send "cr*q"
  waitFor "Computer command [TL"
  waitFor "Command [TL="
  if ((PORT.BUYEQUIP[$thisWarp] = 1) and (PORT.EQUIP[$thisWarp] > 500))

:getmore
  
  gosub :dopopbf
  
  end
  
  :skipit
  

  goto :sub_Scan


:doarrays
setArray $figs SECTORS
setVar $idx 10
while ($idx < SECTORS)
add $idx 1
getSectorParameter $idx "FIGSEC" $Flag
isNumber $tn $Flag
	if ($tn)
		if ($FLag <> 0)
		setVar $figs[$idx] 1
		end
	end
end

setArray $limps SECTORS
setVar $il 10
while ($il < SECTORS)
add $il 1
getSectorParameter $il "LIMPSEC" $Flag
isNumber $tn $Flag
	if ($tn)
		if ($FLag <> 0)
		setVar $limps[$il] 1
		end
	end
end

setvar $sec 0
setarray $adj SECTORS

:check
while ($sec < sectors)
add $sec 1
	#if ($figs[$sec] or $limps[$sec])
	setvar $warp_cnt 0
		while ($warp_cnt < sector.warpincount[$sec])
		add $warp_cnt 1
			if ($figs[sector.warpsin[$sec][$warp_cnt]] > 0)
			setvar $adj[$sec] sector.warpsin[$sec][$warp_cnt]
			goto :check
			end
		end
	#end
setvar $adj[$sec] 1
end

return

:dopopbf

loadvar $MAX_PLANETS_PER_SECTOR
setvar $gameMaxPlan $MAX_PLANETS_PER_SECTOR
setvar $pname "Mayhem "
gosub :quikstats
setvar $popcount 0
if ($CURRENT_SECTOR <> STARDOCK) or ($CURRENT_SECTOR > 11)
	send "fz1*cd*"
end


:main
send "q q * cr*q *"
waitfor "<Re-Display>"
waitfor "Command [TL="

if (PORT.EXISTS[$CURRENT_SECTOR] = 0) or ((PORT.BUYEQUIP[$CURRENT_SECTOR] = 0) and (PORT.BUYORG[$CURRENT_SECTOR] = 0) and (PORT.BUYFUEL[$CURRENT_SECTOR] = 0)) 
:wrap
		if $clean_up = 1
		#getinput $whatever "prompt?"
			gosub :cleanup
		end
		
	send "'sector complete.*"
	return
end


if ((PORT.EQUIP[$CURRENT_SECTOR] > 500) and (PORT.BUYEQUIP[$CURRENT_SECTOR] = 1))  or ((PORT.ORG[$CURRENT_SECTOR] > 500) and (PORT.BUYORG[$CURRENT_SECTOR] = 1))

#	or ((PORT.FUEL[$CURRENT_SECTOR] > 500) and (PORT.BUYFUEL[$CURRENT_SECTOR] = 1))
			gosub :POP_PLANET
			send "l"
			setTextTrigger gotnum :gotnum $IDX
			setTextTrigger nopscanner :noPScan "Landing sequence engaged..."
			pause
			
			:gotnum 
			killalltriggers	
			gettext CURRENTLINE $currentPlanet "<" ">"
			send $currentPlanet & "*"
			
			
			
			:noPScan
			killalltriggers
			
			
			gosub :SCAN_PLANET
			
			if  ($FREE_ORG > 100) or ($FREE_EQUIP > 100) or ($FREE_ORE > 100)
					send "tnt1*"					
					gosub :BeginPlanetSell	
					setvar $didone 1										
			end
			
			gosub :quikstats
			
			
			If ($secmax = 1)
					If sector.planetcount[$CURRENT_SECTOR] > $MAX_PLANETS_PER_SECTOR 
						send "l" & $currentPlanet & "* "
						goto :reloaded	
					end
			end
			send "q q * "
			goto :Kaboom
			
			:reloaded
					send "  Z  D  Y  "
						setTextLineTrigger NoDets	:NoDets "You do not have any Atomic Detonators!"
						setTextTrigger KaBoom		:KaBoom "Command [TL="
						pause
					
					:NoDets
							killalltriggers
							gosub :furby
							send "l" & $currentPlanet & "*"
							goto :reloaded
			
			
			
			:Kaboom
					killAllTriggers
					add $popcount 1
					if $popcount = 15
					send "q q * "
						goto :wrap
					end
					
					if $didone
						setvar $popcount 0
						setvar $didone 0
						#if $cleanup
							#gosub :cleanup
						#end
					end
			goto :main
end 
:donepop
goto :wrap



:cleanup
setvar $blowcount sector.planetcount[$CURRENT_SECTOR]

#while $blowcount > ($gameMaxPlan - 1)
while $blowcount > 0
		:reblow		
			killAllTriggers
			send "l"
			settexttrigger goblow :goblow $pname
			setTExtTrigger clean :clean "to abort> ?"
			setTExtLineTrigger clean2 :clean "There isn't a planet in this sector."
			pause
		
		:clean
			killalltriggers
			send "*"
			waitfor "Command [TL="
			return
		:goblow 
			killalltriggers	
			gettext CURRENTLINE $currentBlowPlanet "<" ">"
			send $currentBlowPlanet & "* "
	
			send "  Z  D  Y  "
			setTextLineTrigger nope	:Nope "You do not have any Atomic Detonators!"
			setTextTrigger yep		:yep "Command [TL="
			pause
		
		:Nope
			killalltriggers
			gosub :furby
			goto :reblow
		
		:Yep
			killalltriggers
			subtract $blowcount 1
			send "* d "
			waitfor "<Re-Display>"
			#getinput $whatever $blowcount
			
end
send "'cleanup complete*"
return


:furby
gosub :quikstats
send "q q * "
setvar $last $CURRENT_SECTOR


if ($self_furb = 1) and ($TWARP_TYPE = "No")
	
		send "'" $bot " m s 1 p*"
		waitfor $bot & "} - Mow completed."
		settexttrigger genprompt :genprompt "How many"
			send "t"
			pause
		
		:genprompt
		killalltriggers
		setvar $line CURRENTLINE
		getword  $line  $mygens 9
		striptext $mygens ")"
		
		send $mygens & "*"
		send "q"
		waitfor "<StarDock>"
		send "'"  $bot " m " $last " 1*"
		waitfor $bot & "} - Mow completed."
		gosub :quikstats
		if ($GENESIS = 0) 
			Echo "**" & ANSI_15 & "FURB FAILED**"
			halt
		end
		if ($CURRENT_SECTOR <> $last)
			Echo "**" & ANSI_15 & "Failed to reach return destination.**"
			halt
		end
	return
end

if 	($self_furb = 1) and ($TWARP_TYPE > 0)
			if ($clean_up = 1) or ($secmax = 1)
				send "'" & $bot & " lsd M@0@0@0@0@N@0@0@0@N@0@M@N@0@100@0@0@0@0@0*"
			else 
				send "'" & $bot & " lsd 0@0@0@0@0@N@0@0@0@N@0@M@N@0@100@0@0@0@0@0*"
			end
			waiton "Completed - Spent"
			gosub :quikstats
			if ($GENESIS = 0) 
				Echo "**" & ANSI_15 & "FURB FAILED**"
				halt
			end
	return
end

send "d"
waiton "Sector  :"
getword currentline $here 3

 getDistance $tobfsec $here $bfsec
 getDistance $frombfsec $bfsec $here

waiton "Command [TL="

if ($tobfsec > $xrange) or ($frombfsec > $xrange)
send "'Gotta move*"
waiton "Message sent on sub"
goto :twarp
end

 getDistance $tositsec $here $sitsec
 getDistance $fromsitsec $sitsec $here

if ($tositsec > $xrange) or ($fromsitsec > $xrange)
send "'No problem, I'm gonna twarp to sitter ship sector*"
waiton "Message sent on sub"
goto :twarp
end

:furb
send "'" $bot " x " $sitship "*"
waiton "Xport complete"
waiton "Command [TL"
send "'" $bluebot " x " $mtship "*"
waiton "Xport complete"

if $meet
send "t c"
settexttrigger give :give "Exchange with"
settexttrigger nobody :quit "Your Associate must be in the same sector to conduct transfers!"
pause

:give
killalltriggers
send "y t"
waiton "You have"
getword currentline $Creds 3
striptext $creds ","
if ($creds < 101000)
waiton "How much to transfer?"
send "0*"
waiton "Corporate command [TL"
goto :quit
end
setvar $pass ($creds - 100000)
waiton "How much to transfer?"
send $pass "*"
waiton "Corporate command [TL"

:quit
killalltriggers
send "q"
waiton "Command [TL="
setvar $meet 0
end

if ($bottype = "kbot")
	waiton "Shipinfo Loaded"
end


if ($clean_up = 1) or ($secmax = 1)
				send "'" $bluebot " lsd M@0@0@0@0@N@0@0@0@N@0@M@N@0@0@0@0@0@0@0*"
			else 
				send "'" $bluebot " lsd 0@0@0@0@0@N@0@0@0@N@0@M@N@0@0@0@0@0@0@0*"
			end

waiton "Completed - Spent:"

if ($bottype = "kbot")
	send "'" $bluebot " mac q *"
waitfor "I'm at the Command prompt"
end

send "'" $bluebot " x " $blueship "*"
waiton "Xport complete"
send "'" $bot " x " $mtship "*"
waiton "Xport complete"
waiton "Command [TL="
goto :goback

:twarp
send "'" $bot " t " $sitsec "*"
waiton "T-warp completed"
send "p***"
waiton "Command [TL="
setvar $meet 1
goto :furb

:goback
send "d"
waiton "Sector  :"
getword currentline $now 3
if ($now = $here)
goto :back
end
waiton "Command [TL="
send "p***"
waiton "Command [TL="
send "'" $bot " t " $here "*"
settexttrigger already :back "Already in that sector"
settexttrigger twarp :back "T-warp completed"
settexttrigger walk :back "just plain warping"
pause

:back
killalltriggers
waiton "Command [TL="
send "'I'm back and furbed*"
waiton "Message sent on sub"
waiton "Command [TL="



return


:troubles
echo  "**"
echo $FREE_ORE & "*"
echo $FREE_ORG & "*"
echo $FREE_EQU & "*"
echo port.fuel[$CURRENT_SECTOR] & "*"
echo port.org[$CURRENT_SECTOR] & "*"
echo port.equip[$CURRENT_SECTOR] & "*"
echo $CURRENT_SECTOR


:p_array
setvar $planet_array_counter 1
setarray $planet_array 1000
setvar $startnum SECTOR.PLANETCOUNT[$CURRENT_SECTOR] 
send "lq*"
setTExtLineTrigger noplanhere :moveon "There isn't a planet in this sector."
setTExtLineTrigger nopscan :nopscan "in sector"
waitfor "-----------------------------"

killalltriggers
:retrig	

settexttrigger moveon :moveon "Land"
settexttrigger repeat :repeat $pname
pause

:repeat
	killalltriggers	
	gettext CURRENTLINE $planet_array[$planet_array_counter] "<" ">"
	add $planet_array_counter 1
	goto :retrig

:moveon
killalltriggers
waitfor "Command [TL"
return

:nopscan
killAllTriggers 
setvar $thisline CURRENTLINE
getword $thisline $planet_array[$planet_array_counter] 5
striptext $planet_array[$planet_array_counter] ":"
add $planet_array_counter 1
waitfor "Command [TL"
return






:SCAN_PLANET
	waitfor "Planet #"
	setvar $line CURRENTLINE
	gettext CURRENTLINE $NegPlanet "Planet #" " in sector"
	setvar $FREE_ORE 0
	setvar $FREE_EQU 0
	setvar $FREE_ORG 0
	waiton "Item    Colonists  Colonists    Daily     Planet"
	setTextlinetrigger	PLANET_ORE	:PLANET_ORE		"Fuel Ore          0"
	setTextlinetrigger	PLANET_ORG	:PLANET_ORG		"Organics          0"
	setTextLineTrigger	PLANET_EQU	:PLANET_EQU		"Equipment         0"
	setTextLineTrigger	PLANET_DNE	:PLANET_DNE		"Fighters"
	pause

	:PLANET_ORE
		setvar $TEMP CURRENTLINE
		getWord $TEMP $FREE_ORE 6
		striptext $FREE_ORE ","
		pause
	:PLANET_ORG
		setvar $temp currentline
		getword $temp $FREE_ORG 5
		striptext $FREE_ORG ","
		pause
	:PLANET_EQU
		setvar $temp currentline
		getword $temp $FREE_EQU 5
		striptext $FREE_EQU ","
		pause
	:PLANET_DNE
		killalltriggers
		return


:POP_PLANET
	getrnd $IDX 1000 9999
	
	send "u y "
	setTextLineTrigger NoOverLoad	:NoOverload 	"What do you want to name this planet?"
	setTextLineTrigger Yikes		:Yikes 			"I'm sorry, but not enough free matter exists."
	setTExtLineTrigger NeedGenTs	:NeedGenTs 		"You don't have any Genesis Torpedoes to launch!"
	setTextTrigger OverLoad 		:Overload 		"Do you wish to abort?"
	pause
	:NeedGenTs
		killAllTriggers
		gosub :furby
	goto :POP_PLANET
		
		
	:Yikes
			killAllTriggers
		Echo "**Bad News - Game Maximum Planets Reached.**"
		halt
	:Overload
		killTrigger Overload
		send "n "
		pause
	:NoOverload
		killAllTriggers
		
		send ($pname & $IDX & "*")

		setTextTrigger MakingItCorp	:MakingItCorp "Should this be a (C)orporate planet or (P)ersonal planet? "
		setTextTrigger LetsGo			:LetsGo "Command [TL="
		pause
		:MakingItCorp
			killTrigger MakingItCorp
			send "P"
			pause
		:LetsGo
			killAllTriggers
			send "cr*q *"
			waitfor "<Re-Display>"
			waitfor "Command [TL="
			#add $last_planet 1
			return
			
					
			:quikstats
	setVar $CURRENT_PROMPT		"Undefined"
	setVar $PSYCHIC_PROBE		"NO"
	setVar $PLANET_SCANNER		"NO"
	setVar $SCAN_TYPE			"NONE"
	setVar $CURRENT_SECTOR		0
	setVar $TURNS   			0
	setVar $CREDITS 			0
	setVar $FIGHTERS			0
	setVar $SHIELDS				0
	setVar $TOTAL_HOLDS			0
	setVar $ORE_HOLDS			0
	setVar $ORGANIC_HOLDS		0
	setVar $EQUIPMENT_HOLDS		0
	setVar $COLONIST_HOLDS		0
	setVar $PHOTONS				0
	setVar $ARMIDS				0
	setVar $LIMPETS				0
	setVar $GENESIS				0
	setVar $TWARP_TYPE			0
	setVar $CLOAKS				0
	setVar $BEACONS				0
	setVar $ATOMIC				0
	setVar $CORBO				0
	setVar $EPROBES				0
	setVar $MINE_DISRUPTORS		0
	setVar $ALIGNMENT			0
	setVar $EXPERIENCE			0
	setVar $CORP				0
	setVar $SHIP_NUMBER			0
	setVar $TURNS_PER_WARP		0
	setVar $COMMAND_PROMPT		"Command"
	setVar $COMPUTER_PROMPT		"Computer"
	setVar $CITADEL_PROMPT		"Citadel"
	setVar $PLANET_PROMPT		"Planet"
	setVar $CORPORATE_PROMPT	"Corporate"
	setVar $STARDOCK_PROMPT		"<Stardock>"
	setVar $HARDWARE_PROMPT		"<Hardware"
	setVar $SHIPYARD_PROMPT		"<Shipyard>"
	setVar $TERRA_PROMPT		"Terra"
	SetVar $CURRENT_PROMPT		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 		:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 		:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 			#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
		SetVar $stats ""
		SetVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		SetVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		SetVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
				if ($UNLIM)
					SetVar $TURNS 68536
				end
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2
	return

	
	
	
	############################Planet Neg Routine#####################################
:BeginPlanetSell
setvar $SellFuel 1
setvar $SellOrg 1
setvar $SellEquip 1


KillAllTriggers
send "Q "
waitfor "Command [TL="

send "P N " & $NegPlanet & "*"
WaitFor "You have"

:ProductDetect
KillAllTriggers
SetTextTrigger SellFuelTrigger :SellFuel "How many units of Fuel Ore"
SetTextTrigger SellOrgTrigger :SellOrg "How many units of Organics"
SetTextTrigger SellEquipTrigger :SellEquip "How many units of Equipment"
SetTextTrigger SellendTrigger :FinishedSellOff "Command [TL="
SetDelayTrigger SellEndTrigger2 :FinishedSellOff 1000
pause

:SellFuel
KillAllTriggers
if ($SellFuel <> 1)
	Send "0*"
        Goto :ProductDetect
end
SetVar $Type "Fuel"
Send "*"
WaitFor "Agreed,"
GetWord CURRENTLINE $PortBuyingAmount 2
Striptext $PortBuyingAmount ","
SetTextLineTrigger SellFirstOfferTrigger :HandleFirstOfferFuel "We'll buy them for"
pause

:SellOrg
KillAllTriggers
if ($SellOrg <> 1)
	Send "0*"
        Goto :ProductDetect
end
Send "*"
SetVar $Type "Org"
WaitFor "Agreed,"
GetWord CURRENTLINE $PortBuyingAmount 2
Striptext $PortBuyingAmount ","
SetTextLineTrigger SellFirstOfferTrigger :HandleFirstOfferOrg "We'll buy them for"
pause

:SellEquip
KillAllTriggers
if ($SellEquip <> 1)
	Send "0*"
        Goto :ProductDetect
end
Send "*"
SetVar $Type "Equip"
WaitFor "Agreed,"
GetWord CURRENTLINE $PortBuyingAmount 2
Striptext $PortBuyingAmount ","
SetTextLineTrigger SellFirstOfferTrigger :HandleFirstOfferEquip "We'll buy them for"
pause

    :SellOfferLoop
        SetTextLineTrigger SellPriceTrigger :SellPrice "We'll buy them for"
        SetTextLineTrigger SellFinalOfferTrigger :SellFinalOffer "Our final offer"
        SetTextLineTrigger SellNotInterestedTrigger :SellNotInterested "We're not interested."
        SetTextLineTrigger SellExperienceTrigger :SellExperience "experience point(s)"
        SetTextLineTrigger SellYouHaveTrigger :SellYouHave "You have"

        SetTextLineTrigger SS1 :SellTooHigh "Get real ion-brain, make me a real offer."
        SetTextLineTrigger SS2 :SellTooHigh "This is the big leagues Jr.  Make a real offer."
        SetTextLineTrigger SS3 :SellTooHigh "My patience grows short with you."
        SetTextLineTrigger SS4 :SellTooHigh "I have much better things to do than waste my time.  Try again."
        SetTextLineTrigger SS5 :SellTooHigh "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
        SetTextLineTrigger SS6 :SellTooHigh "Quit playing around, you're wasting my time!"
        SetTextLineTrigger SS7 :SellTooHigh "Make a real offer or get"
        SetTextLineTrigger SS8 :SellTooHigh "WHAT?!@!? you must be crazy!"
        SetTextLineTrigger SS9 :SellTooHigh "So, you think I'm as stupid as you look? Make a real offer."
        SetTextLineTrigger SS10 :SellTooHigh "What do you take me for, a fool?  Make a real offer!"
        pause
    :SellTooHigh
        KillAllTriggers
        Multiply $CounterOffer 98
        Divide $CounterOffer 100
        Send $CounterOffer & "*"
        Goto :SellOfferLoop
    :sellprice
        KillAllTriggers
        SetVar $OldOffer $Offer
        SetVar $OldCounterOffer $CounterOffer
        GetWord CURRENTLINE $Offer 5
        Striptext $Offer ","
        SetVar $OfferChange $Offer
        Subtract $OfferChange $OldOffer
        Multiply $OfferChange 6
        Divide $OfferChange 10
        Subtract $CounterOffer $OfferChange
        Subtract $CounterOffer 3
        Send $CounterOffer & "*"
        goto :SellOfferLoop
    :SellFinalOffer
        KillAllTriggers
        SetVar $OldOffer $Offer
        SetVar $OldCounterOffer $CounterOffer
        GetWord CURRENTLINE $Offer 5
        Striptext $Offer ","
        SetVar $OfferChange $Offer
        Subtract $OfferChange $OldOffer
	if ($Type = "Org")
	        Multiply $OfferChange 28
	else
	        Multiply $OfferChange 25
	end
        Divide $OfferChange 10
        Subtract $CounterOffer $OfferChange
        Subtract $CounterOffer 3
        Send $CounterOffer & "*"
        Goto :SellOfferLoop
    :SellNotInterested
        KillAllTriggers
        goto :SellHaggleFailed
    :SellExperience
        KillAllTriggers
        goto :SellOfferLoop
    :SellYouHave
        KillAllTriggers
        SetVar $OldCredits $InitialCredits
        GetWord CURRENTLINE $Credits 3
        StripText $Credits ","
	SetVar $InitialCredits $Credits
        if ($OldCredits = $Credits)
            Goto :SellHaggleFailed
        else
            Goto :SellHaggleSucceeded
        end
    :SellHaggleFailed
        Add $SellFailure 1
        If ($SellFailure >= 20)
            send "'Problems with port, continueing to next*"
            send "0* 0* "
	    SetVar $UnableToGoTo[$FailIndex][1] $Sector
	    SetVar $UnableToGoTo[$FailIndex][2] $NextAction
	    SetVar $UnableToGoTo[$FailIndex][3] "Couldn't Nego"
	    SetVar $WriteLine $UnableToGoTo[$FailIndex][1] & " ("  & $UnableToGoTo[$FailIndex][2] & ") " & $UnableToGoTo[$FailIndex][3]
	    write $FailedFile $WriteLine         
            goto :FinishedSellOff
        end
        KillAllTriggers
        Send "0* 0* L " $NegPlanet "*"
        SetDelayTrigger DT1 :BeginPlanetSell 300
	pause
    :SellHaggleSucceeded
    	Add $ProfitThisRun $CounterOffer
        goto :ProductDetect


:HandleFirstOfferEquip
KillAllTriggers
GetWord CURRENTLINE $Offer 5
StripText $Offer ","
gosub :CheckSwath_Sub

If ($PortEquipPercent > 30)
	SetVar $PerUnitInitOffer $Offer
	Multiply $PerUnitInitOffer 100
	Divide $PerUnitInitOffer $PortBuyingAmount
	SetVar $MaxInit $PerUnitInitOffer
	Subtract $MaxInit 9000
	SetVar $Percent $PortEquipPercent
	Subtract $Percent 10
	Multiply $MaxInit 100
	Divide $MaxInit $Percent
	Multiply $MaxInit 90
	Divide $MaxInit 100
	Divide $MaxInit 100
	Divide $PerUnitInitOffer 100
	Add $MaxInit 90
Else
	SetVar $MaxInit 100
end
#echo "**" $MaxInit "**"
Multiply $MaxInit 100
Divide $MaxInit $Ptrade        



If ($MaxInit >= 139)
	setVar $MaxInit 139
        setVar $MultipleOffset (0-5)
Elseif ($MaxInit >= 133)
	setVar $MultipleOffset (0-4)
Elseif ($MaxInit >= 127)
	setVar $MultipleOffset (0-3)
Elseif ($MaxInit >= 125)
	setVar $MultipleOffset (0-2)
Elseif ($MaxInit >= 121)
	setVar $MultipleOffset (0-1)
Elseif ($MaxInit >= 117)
	setVar $MultipleOffset 0
Elseif ($MaxInit >= 114)
	setVar $MultipleOffset 1
Elseif ($MaxInit >= 110)
	setVar $MultipleOffset 2
Elseif ($MaxInit >= 107)
	setVar $MultipleOffset 3
Elseif ($MaxInit >= 106)
	setVar $MultipleOffset 4
Else
	setVar $MultipleOffset 4
end

SetVar $Multiple $MaxInit
Add $Multiple $MultipleOffset
Subtract $Multiple $SellFailure
SetVar $CounterOffer $Offer
Multiply $CounterOffer $Multiple
Divide $CounterOffer 100
Send $CounterOffer & "*"
goto :SellOfferLoop


:HandleFirstOfferOrg
KillAllTriggers
GetWord CURRENTLINE $Offer 5
StripText $Offer ","
gosub :CheckSwath_Sub

If ($PortOrgPercent > 40)
	SetVar $PerUnitInitOffer $Offer
	Multiply $PerUnitInitOffer 100
	Divide $PerUnitInitOffer $PortBuyingAmount
	SetVar $MaxInit $PerUnitInitOffer
	Subtract $MaxInit 5000
	SetVar $Percent $PortOrgPercent
	Subtract $Percent 12
	Multiply $MaxInit 100
	Divide $MaxInit $Percent
	Multiply $MaxInit 89
	Divide $MaxInit 100
	Divide $MaxInit 100
	Divide $PerUnitInitOffer 100
	Add $MaxInit 50
Else
	SetVar $MaxInit 60
end
#echo "**" $MaxInit "**"
Multiply $MaxInit 100
Divide $MaxInit $Ptrade        


If ($MaxInit >= 81)
        setVar $MultipleOffset 56
Elseif ($MaxInit >= 80)
	setVar $MultipleOffset 56
Elseif ($MaxInit >= 78)
	setVar $MultipleOffset 55
Elseif ($MaxInit >= 76)
	setVar $MultipleOffset 54
Elseif ($MaxInit >= 74)
	setVar $MultipleOffset 54
Elseif ($MaxInit >= 71)
	setVar $MultipleOffset 53
Elseif ($MaxInit >= 69)
	setVar $MultipleOffset 52
Elseif ($MaxInit >= 66)
	setVar $MultipleOffset 51
Else
	setVar $MultipleOffset 45
end


SetVar $Multiple $MaxInit
Add $Multiple $MultipleOffset
Subtract $Multiple $SellFailure
SetVar $CounterOffer $Offer
Multiply $CounterOffer $Multiple
Divide $CounterOffer 100
Send $CounterOffer & "*"
goto :SellOfferLoop

:HandleFirstOfferFuel
KillAllTriggers
GetWord CURRENTLINE $Offer 5
StripText $Offer ","
gosub :CheckSwath_Sub

If ($PortFuelPercent > 30)
	SetVar $PerUnitInitOffer $Offer
	Multiply $PerUnitInitOffer 100
	Divide $PerUnitInitOffer $PortBuyingAmount
	SetVar $MaxInit $PerUnitInitOffer
	Subtract $MaxInit 2500
	SetVar $Percent $PortFuelPercent
	Subtract $Percent 11
	Multiply $MaxInit 100
	Divide $MaxInit $Percent
	Multiply $MaxInit 89
	Divide $MaxInit 100
	Divide $MaxInit 100
	Divide $PerUnitInitOffer 100
	Add $MaxInit 15
Else
	SetVar $MaxInit 28
end
#echo "**" $MaxInit "**"
Multiply $MaxInit 100
Divide $MaxInit $Ptrade        


If ($MaxInit >= 43)
        setVar $MultipleOffset 105
Elseif ($MaxInit >= 42)
	setVar $MultipleOffset 103
Elseif ($MaxInit >= 41)
	setVar $MultipleOffset 101
Elseif ($MaxInit >= 40)
	setVar $MultipleOffset 99
Elseif ($MaxInit >= 39)
	setVar $MultipleOffset 97
Elseif ($MaxInit >= 38)
	setVar $MultipleOffset 95
Elseif ($MaxInit >= 37)
	setVar $MultipleOffset 93
Elseif ($MaxInit >= 36)
	setVar $MultipleOffset 91
Elseif ($MaxInit >= 35)
	setVar $MultipleOffset 89
Else
	setVar $MultipleOffset 85
end

SetVar $Multiple $MaxInit
Add $Multiple $MultipleOffset
Subtract $Multiple $SellFailure
SetVar $CounterOffer $Offer
Multiply $CounterOffer $Multiple
Divide $CounterOffer 100
Send $CounterOffer & "*"
goto :SellOfferLoop

:FinishedSellOff
KillAllTriggers
return


############################Swath Check Functions##################################
:CheckSwath_Sub
if ($SwathEnabled = 1)
	SetTextLineTrigger SwathTrigger :SwathOn "Command [TL="
	SetDelayTrigger SwathOffTrigger :SwathOff 2000
	pause
end
return

:SwathOn
KillAllTriggers
echo "Autodetected SWATH Autohaggle - Halting Script*"
halt

:SwathOff
KillAllTriggers
#echo "SWATH Autohaggle not enabled, will not check again.*"
setVar $SwathEnabled 0
return
