## OZ pwarp anticipation photon - for those pesky chargers
#Improved by Rincrast, version 3.2, allows calling from Rinbot
# see if we can run here...

loadVar $rinbotActivated
setVar $oz_foton_version "OZ-PWarp Fast Foton 3.2"
setVar $figfile "_ck_"&GAMENAME&".figs"

cutText CURRENTLINE $location 1 7
striptext $location " "
if ($location = "Citadel")
	goto :start_info
else
	echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
	echo ANSI_12 "OZ Fast Foton: Need to be at Citadel Prompt...*"
	echo ANSI_12 "OZ Fast Foton: Powering Down...*"
	send "'Not at the Citadel prompt; photon script halting.*"
	halt
end

:start_info
if ($rinbotActivated)
	setVar $continuous "ON"
	setVar $autobuy "OFF"
	setVar $auto_return "ON"
	goto :menu_run
end
loadVar $OzfotonSaved

if ($ozfotonSaved)
	loadVar $foton_continuous
	loadVar $foton_autobuy
	loadVar $foton_return
	loadVar $continuous
	loadVar $autobuy
	loadVar $auto_return
else 
	setVar $continuous "OFF"
	setVar $foton_continuous 0
	saveVar $foton_continuous
	setVar $autobuy "OFF"
	setVar $foton_autobuy 0
	saveVar $foton_autobuy
	setVar $auto_return "OFF"
	setVar $foton_return 0
	saveVar $foton_return
	setVar $ozfotonSaved 1
	saveVar $ozfotonSaved
end

addMenu "" "OZ-PWarp Fast Foton" "OZ-PWarp Fast Foton Settings" "." "" "Main" FALSE
addMenu "OZ-PWarp Fast Foton" "Run" "Run Script." "Z" :Menu_Run "" TRUE
addMenu "OZ-PWarp Fast Foton" "Continuous"  "Continuous" "C" :Menu_Continuous "" FALSE
addMenu "OZ-PWarp Fast Foton" "Auto-Buy"  "Auto-Buy" "B" :Menu_Buy "" FALSE
addMenu "OZ-PWarp Fast Foton" "Auto-Return"  "Auto-Return" "R" :Menu_Return "" FALSE


setMenuHelp "Run" "This Option Activates the PWarp Fast Photon."
setMenuHelp "Auto-Return" "This Option Toggles the Return Home After Photon."
setMenuHelp "Continuous" "This Option Toggles the Continual Run Mode."
setMenuHelp "Auto-Buy" "This Option Toggles the Photon Auto-Buy."

:start_menu
gosub :sub_setMenu
gosub :ozHeader
openMenu "OZ-PWarp Fast Foton"



:ozHeader
ECHO ANSI_2 "*----------------------------------------*"
ECHO ANSI_10 "    " $oz_foton_version "       "
ECHO ANSI_2 "*----------------------------------------*"
return

:Menu_Buy
add $foton_autobuy 1
	if ($foton_autobuy = 1)
		setVar $autobuy "ON"
	elseif ($foton_autobuy = 0) 
		setVar $foton_autobuy 0
		setVar $autobuy "OFF"
	else
		setVar $foton_autobuy 0
		setVar $autobuy "OFF"
	end
saveVar $foton_autobuy
saveVar $autobuy
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ-PWarp Fast Foton"

:Menu_Continuous
add $foton_Continuous 1
	if ($foton_Continuous = 1)
		setVar $continuous "ON"
	elseif ($foton_Continuous = 0) 
		setVar $foton_continuous 0
		setVar $continuous "OFF"
	else
		setVar $foton_continuous 0
		setVar $continuous "OFF"
	end
saveVar $foton_continuous
saveVar $continuous
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ-PWarp Fast Foton"

:Menu_Return
add $foton_return 1
	if ($foton_return = 1)
		setVar $auto_return "ON"
	elseif ($foton_return = 0) 
		setVar $foton_return 0
		setVar $auto_return "OFF"
	else
		setVar $foton_return 0
		setVar $auto_return "OFF"
	end
saveVar $foton_return
saveVar $auto_return
gosub :sub_setMenu
gosub :ozheader
openMenu "OZ-PWarp Fast Foton"

:sub_setMenu
	setMenuValue "Continuous" $continuous
	setMenuValue "Auto-Buy" $autobuy
	setMenuValue "Auto-Return" $auto_return
return

:menu_run
:mode5

send "' Activating OZ Improved Fast Foton*"
send "|"
waitFor "(?="
gosub :quikstats
setVar $myCount 0
setVar $homesec $quikstats[$h[1]]
setVar $ptorps $quikstats[$h[11]]
if ($ptorps = 0)
	echo ANSI_12 "**No Photons!!!**"
	send "|"
	send "'I have no photons; script terminated.*"
	setVar $photonMode 0
	saveVar $photonMode
	halt
end
send "q"
:getplanetnum
send "D"
setTextLineTrigger pnum :pnum "Planet #"
pause

:pnum
getWord CURRENTLINE $planet 2
stripText $planet "#"
send "c"


:letswait
:glist
fileExists $exists $figfile
	if ($exists = 0)
		setVar $nofile 1
		send "'OZ Fast Foton - No fig data found - refreshing*"
		gosub :refresh_figs
	else
		gosub :get_da_figs
	end
waitFor "Citadel command (?="
send "|"
setVar $run "on"
:hoho5
echo ansi_9 "* -=-=-=-=-=-=-=-=-=-=- OZ Improved Fast Foton -=-=-=-=-=-=-=-=-=-=- *"
echo ansi_9 " *For help - Type 'foton help' on subspace"
echo ansi_9 "*Mode        - " 
if ($run = "on")
	echo ansi_9 "Active"
elseif ($run = "off")
	echo ansi_9 "Passive"
end
echo ansi_9 "*Continuous  - " $continuous
echo ansi_9 "*Auto-Buy    - " $autobuy
echo ansi_9 "*Auto-Return - " $auto_return "**"
:inac
send "'Oz Improved Fast Foton running from planet " & $planet & ".*"
:hehe5
killAllTriggers
setTextLineTrigger inactivitywarning :inac "INACTIVITY WARNING:"
setTextLineTrigger disrupt :minesDisrupt "of your mines in"
setTextLineTrigger refresh :trig_figs "'foton figs"
setTextLineTrigger help :fot_help "'foton help"
setTextLineTrigger mines :pwparmid "Your mines in"
setTextLineTrigger limp :pwplimp "Limpet mine in"
setTextLineTrigger fighit :pwpfig "Deployed Fighters Report Sector"
if ($run = "off")
	setTextLineTrigger on :turn_on "'foton on"
elseif ($run = "on")
	setTextLineTrigger off :turn_off "'foton off"
end
if ($continuous = "ON")
	setTextLineTrigger cont_off :cont_off "'foton cont off"
elseif ($continuous = "OFF")
	setTextLineTrigger cont_on :cont_on "'foton cont on"
end
if ($autobuy = "ON")
	setTextLineTrigger buy_off :buy_off "'foton buy off"
elseif ($autobuy = "OFF")
	setTextLineTrigger buy_on :buy_on "'foton buy on"
end
if ($auto_return = "ON")
	setTextLineTrigger return_off :return_off "'foton return off"
elseif ($auto_return = "OFF")
	setTextLineTrigger return_on :return_on "'foton return on"
end

pause

:cont_off
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $continuous "OFF"
	goto :hoho5

:cont_on
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $continuous "ON"
	goto :hoho5

:buy_off
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $autobuy "OFF"
	goto :hoho5

:buy_on
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $autobuy "ON"
	goto :hoho5

:return_off
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $auto_return "OFF"
	goto :hoho5

:return_on
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $auto_return "ON"
	goto :hoho5



:fot_help
killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	echo ansi_9 "* -=-=-=-=-=-=-=-=-=-=- OZ Fast Foton -=-=-=-=-=-=-=-=-=-=- *"
	echo ansi_9 "* Modes switched by the following subspace commands..."
	echo ansi_9 "* Mode        - foton on/off"
	echo ansi_9 "* Continuous  - foton cont on/off"
	echo ansi_9 "* Auto-Buy    - foton buy on/off"
	echo ansi_9 "* Auto-Return - foton return on/off"
	echo ansi_9 "* Refresh Figs- foton figs"
	send "*"
	goto :hehe5

:trig_figs
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	goto :refresh_figs


:turn_off
	killAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	setVar $run "off"
	send "'OZ Fast Foton - switching to passive mode.*"
	goto :hoho5

:turn_on
	KillAllTriggers
	cutText CURRENTLINE $ck 1 1
	if ($ck <> "'")
		goto :hehe5
	end
	gosub :quikstats
	setVar $ptorps $quikstats[$h[11]]
	if ($ptorps = 0)
		send "'OZ Fast Foton - no photons - remaining in passive mode.*"
		setVar $run "off"
		goto :hoho5
	end
	waitFor "(?="
	getWord CURRENTLINE $citter 1
	if ($citter <> "Citadel")
		send "'OZ Fast Foton - not at cit prompt - switching to passive mode.*"
		setVar $run "off"
		goto :hoho5
	end
	setVar $run "on"
	send "'OZ Fast Foton - switching to active mode.*"
	goto :hoho5

:pwplimp
	killAllTriggers
	gosub :limphit
	goto :pwp_go
:pwparmid
	killAllTriggers
	gosub :minehit
	goto :pwp_go
:minesDisrupt
	killAllTriggers
	setVar $disrupted CURRENTLINE
	gosub :disruptThis
	goto :pwp_go
	
:pwpfig
	killAllTriggers
	setVar $m 1
	gosub :fighit
:pwp_id_check

:pwp_go
	gosub :get_adj
	send "p" $adjsec "*y  c  p  y  " $sector "**q" 
	setTextLineTrigger wrong :wrong "That is not an adjacent sector"
	setTextLineTrigger gotem :gotem "Photon Missile launched into sector"
	pause

:wrong
	killAllTriggers
	goto :hehe5
:gotem
	killAllTriggers
	subtract $ptorps 1
	send "' OZ Improved Fast Foton Fired - Sector -> " $sector "!*"
	waitFor "Photon Wave Duration has ended in sector"
	if ($auto_return = "ON")
		gosub :subno5
	end
	if ($ptorps = 0) and ($autobuy = "ON") and ($continuous = "ON")
		goto :buy_photons
	elseif ($ptorps = 0) and ($autobuy = "OFF")
		send "'OZ Fast Foton - out of P-Missles - switching to passive mode.*"
		setVar $run "off"
		goto :hoho5
	end
	if ($continuous = "ON")
		goto :hehe5
	else
		send "'OZ Fast Foton - switching to passive mode.*"
		setVar $run "off"
		goto :hoho5
	end
	




:subno5
	send "p" $homesec "*y"
	SetTextLineTrigger homelock :homelock5 "Locating beam pinpointed"
	setTextLineTrigger nohomelock :nohomelock5 "Your own fighters must be"
	setTextLineTrigger home_now :homelock5 "You are already in that sector!"
	pause

:nohomelock5
	killAllTriggers
	send "'OZ Fast Foton - PWarp Lock Failed - switching to pasive mode.*"
	setVar $run "off"
	goto :hoho5
	

:homelock5
	KillAllTriggers
	return





# -=-=-=-=-=-=- get adjacent sector subroutine -=-=-=-=-=-=-=-
:get_adj
getSector $sector $adjinf
setVar $i 1
:act
if ($adjinf.warp[$i] = 0) 
	goto :hehe5
end
if ($figlist[$adjinf.warp[$i]] = 1) 
	setVar $adjsec $adjinf.warp[$i]
else 
	add $i 1
	goto :act
end
return	

#-=-=-=-=-=-Mine Disruption Subroutine -=-=-=-=-=-=-
:disruptThis
killAllTriggers
if ($thisWarp > 2)
	setVar $thisWarp 0
end
getWord CURRENTLINE $ck 1
if ($ck <> F) AND ($ck <> R) AND ($ck <> P)
	getWordPos $disrupted $inPos "in"
	setVar $inPos $inPos + 8
	cutText $disrupted $sector $inPos 999
	if (SECTOR.WARPCOUNT[$sector] < 4)
		add $thisWarp 1
		if ($thisWarp > SECTOR.WARPCOUNT[$sector])
			setVar $thisWarp SECTOR.WARPCOUNT[$sector]
		end
		setVar $sector SECTOR.WARPS[$sector][$thisWarp]
	else
		goto :hehe5
	end
else
	goto :hehe5
end
return


# -=-=-=-=-=- Limpet hit subroutine -=-=-=-=-=-=-=-
:limphit
killAllTriggers
getWord CURRENTLINE $ck 1
if ($ck <> "Limpet")
	goto :hehe5
end
getWord CURRENTLINE $sector 4
if ($run = "off")
	goto :hehe5
end
return

# -=-=-=-=-=- Armid hit subroutine -=-=-=-=-=-=-=-
:minehit
killAllTriggers
getWord CURRENTLINE $ck 1
if ($ck <> "Your")
	goto :hehe5
end
getWord CURRENTLINE $sector 4
if ($run = "off")
	goto :hehe5
end
return

# -=-=-=-=-=-=-fig hit subroutine -=-=-=-=-=-=-=-=-=
:fighit
KillAllTriggers
getWord CURRENTLINE $ck 1
if ($ck <> "Deployed")
	goto :hehe5
end
getWord CURRENTLINE $sector 5
stripText $sector ":"
setVar $figlist[$sector] 0
if ($run = "off")
	goto :hehe5
end
return

# -=-=-=-=-=-=-quickstats=-=-=-=-=-=-=-=-=-=-=-==-=-
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

# -=-=-=-=-=-=-=-=-- refresh figs =-=-=-=-=-=-=-=-=-=-=-=-=-=
:refresh_figs
	killAllTriggers
	waitfor "(?="
	getWord CURRENTLINE $location 1
	if ($location = "Citadel")
		send "qd"
		waitFor "Planet #"
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
		send "q"
		goto :refresh
	elseif ($location = "Command")
		goto :refresh
	else
		send "'OZ Fast Foton - Fig Refresh must be run from Citadel or Command Prompt*"
		if ($nofile = 1)
			killAllTriggers
			send "'OZ Fast Foton - Refresh Error - Halting.*"
			halt	
		end
		goto :hehe5
	end
		
:refresh
	send "'OZ Fast Foton - Refreshing figs - one moment please...*"
	send "g"
	setArray $figlist SECTORS
	setVar $figgies "."
	setVar $fig_count 0
	setVar $fig_sec 0
	waitFor "==========================="
:get_figs
	getWord CURRENTLINE $sector 1
	getWord CURRENTLINE $stopper 2
	isNumber $secnum $sector
:addin
	if ($stopper = "Total")
		killTrigger abort
		goto :doneglist
	end
	if ($secnum = 1)
		add $fig_count 1
		setVar $figlist[$sector] 1
	end
	setTextLineTrigger grab :get_figs
	pause


:doneglist
	gosub :parse_array
	delete $figfile
	write $figfile $figgies
	setVar $total_figs $fig_count
	multiply $fig_count 100
	divide $fig_count SECTORS
	send "'OZ Fast Foton - Fig Count - " $total_figs " sector(s) - " $fig_count "%*"
	waitFor "Message sent on sub-space channel"
	killAllTriggers
	send "l" $planet "*c"
	setTextTrigger on_planet :on_planet "Citadel command"
	setDelayTrigger no_planet :no_planet 1000
	pause

:no_planet
	killAllTriggers
	send "'OZ Fast Foton - Landing Error - Halting.*"
	halt

:on_planet
	killAllTriggers
	if ($nofile = 1)
		goto :get_da_figs
	end
	goto :hoho5


# -=-=-=-=-
:parse_array
	setVar $array_count 0
:start_parse
	add $array_count 1
	if ($array_count < SECTORS) and ($figlist[$array_count] = 0)
		replaceText $figgies "." "0 ."
		goto :start_parse
	elseif ($array_count < SECTORS) and ($figlist[$array_count] = 1)
		replaceText $figgies "." $array_count&" ."
		goto :start_parse
	elseif ($array_count = SECTORS) and ($figlist[$array_count] = 0)
		replaceText $figgies "." "0"
	elseif ($array_count = SECTORS) and ($figlist[$array_count] = 1)
		replaceText $figgies "." $array_count
	end

:get_da_figs
	setVar $read_count 0
	setVar $merge_count 1
:read
	add $read_count 1
	read $figfile $read[$read_count] $read_count
	if ($read[$read_count] = "EOF")
		goto :done_read_figs
	end
	if ($read_count > 1)
		mergeText $read[1] $read[$read_count] $read[1]
	end
	goto :read

:done_read_figs
:set_fig_array
	setArray $figlist SECTORS
	setVar $fig_array_count 0
:make_array
	add $fig_array_count 1
	if ($fig_array_count > SECTORS)
		goto :done_fig_array
	end
	getWord $read[1] $fig_check $fig_array_count
	if ($fig_check <> 0)
		setVar $figlist[$fig_array_count] 1
	end
	goto :make_array

:done_fig_array
return

# -=-=-=-=-=- photon buy =-=-=-=-=-=-=--=-=-=-=-=-=-=-
:buy_photons
	killAllTriggers
	gosub :quikstats
	cutText $quikstats[$h[25]] $ck 1 1
	if ($ck = "-")
		goto :cant_buy
	end
	if ($quikstats[$h[25]] < 1000)
		goto :cant_buy
	end
	if ($quikstats[$h[26]] > 999)
		goto :cant_buy
	end
	if ($quikstats[$h[3]] < 40000)
		goto :cant_buy
	end
	gosub :subno5
	send "qtnt1*c"
	setDelayTrigger waitabit :waitabit 1000
	pause
	:waitabit
	gosub :quikstats
	getDistance $distance1 STARDOCK $homesec
	getDistance $distance2 $homesec STARDOCK
	send "D"
	waitFor "Citadel command (?=help)"
	send "b" STARDOCK "*"
	setTextLineTrigger no_beamer :no_beamer "This Citadel does not have a Transporter installed."
	setTextLineTrigger no_range :no_range "This planetary transporter does not have the range."
	setTextLineTrigger ok_beam :ok_beam "Federation beacon acknowledged, coordinates cleared for beaming."
	pause

:ok_beam
	killAllTriggers
	multiply $distance1 3
	if ($quikstats[$h[7]] > $distance1)
		send "y"
		goto :port_sd
	else
		send "'OZ Fast Foton - No ore to reload photons - switching to passive mode.*"
		setVar $run "off"
		goto :hoho5
	end

:no_range
	killAllTriggers
	send "qq"
	goto :twarp_sd

:no_beamer
	killAllTriggers
	send "qq"
	goto :twarp_sd

:twarp_sd
	add $distance1 $distance2
	multiply $distance1 3
	if ($distance1 > $quikstats[$h[7]])
		send "'OZ Fast Foton - No ore to reload photons - switching to passive mode.*"
		setVar $run "off"
		goto :hoho5
	end
	send "m" STARDOCK "*"
	setTextTrigger no_twarp :no_twarp "The shortest path"
	setTextTrigger yes_twarp :yes_twarp "Do you want to engage the TransWarp drive?"
	pause

:no_twarp
	killAllTriggers
	send "znl" $planet "*c"
	send "'OZ Fast Foton - No twarp to reload photons - switching to passive mode.*"
	setVar $run "off"
	goto :hoho5
	
:yes_Twarp
	killAllTriggers
	send "y"	
	setTextTrigger fed_lock :fed_lock "Federation beacon acknowledged, coordinates cleared for beaming."
	setDelaytrigger no_fedlock :no_fedlock 2000
	pause

:no_fedlock
	killAllTriggers
	send "'OZ Fast Foton - No Fed beacon to reload photons - switching to passive mode.*"
	setVar $run "off"
	goto :hoho5

:fed_lock
	killAllTriggers
	send "y"
	goto :port_sd

:port_sd
	send "ps"
	setTextTrigger limp :have_limp "A port official runs up to you as you dock and informs you that"
	setTextTrigger no_limp :dont_limp "<StarDock> Where to?"
	pause

:have_limp
	killAllTriggers
	send "y"
:dont_limp
	killAllTriggers
	send "hp"
	waitFor "How many Photon Missiles do you want"
	getText CURRENTLINE $phots_buy "(Max " ")"
	send $phots_buy "*qq"
	send "m" $homesec "*y"
	setTextTrigger twarp_home_lock :twarp_home_lock "Locating beam pinpointed, TransWarp Locked."
	setTextTrigger no_twarp_home :no_twarp_home "You do not have any fighters in Sector"
	pause

:no_twarp_home
	KillAllTriggers
	send "n"
	send "'OZ Fast Foton - No twarp beacon at base - switching to passive mode.*"
	setVar $run "off"
	goto :hoho5

:twarp_home_lock
	KillAllTriggers
	send "y"
	send "l" $planet "*tnt1*c"
	if ($phots_buy = 0)
		send "'OZ Fast Foton - out of photons - switching to passive mode*"
		setVar $run "off"
		goto :hoho5
	end
	waitFor "Citadel command (?"
	gosub :quikstats
	setVar $ptorps $quikstats[$h[11]]
	if ($quikstats[$h[2]] < 50)
		send "'OZ Fast Foton - less then 50 turns - switching to passive mode.*"
		setVar $run "off"
	end
	goto :hoho5
:cant_buy
	send "'OZ Fast Foton - algn/xp conflict or no credits - switching to passive mode.*"
	setVar $run "off"
	goto :hoho5
