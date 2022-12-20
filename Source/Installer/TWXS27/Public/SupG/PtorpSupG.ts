#Script Name 		: SupGAllInOnePhoton TWX V2
#Script Author		: SupG
#Date Completed/Updated : 11/15/03 
#Start Prompt 		: Command or Citadel prompt (of planet you wish to use)
#Script Description 	: Multipurpose Photon script, triggers 
#			  off fighter or limpet hits.
#WARNINGS		: If you start dscan mode from a cit, it will automatically
#			  blast you off the planet to begin dscanning.  Be
#			  sure you run these modes in safe areas.  In
#			  multiple firing mode, the script will wait for the
#			  photon duration of the first photon to complete before
#			  trying to fire another one.
#				
#					SupG
#					www.scripterstavern.com
	       	

cutText CURRENTLINE $location 1 7
if ($location <> "Command") and ($location <> "Citadel")
	clientMessage "This Script must be run from either the Command or Citadel prompt"
	halt
end

gosub :gameinfo_inc~quikstats
setVar $cur_sec $gameinfo_inc~quikstats[SECT]
setVar $poh $gameinfo_inc~quikstats[PHOT]

if ($poh = 0)
	clientMessage "This script requires photons to run."
	halt
end

loadVar $ptorpSaved
if ($ptorpSaved)
	loadVar $phot_mode
	loadVar $phot_sshot
	loadVar $phot_ss
	loadVar $phot_ant
	setVar $mode $phot_mode
	setVar $sshot $phot_sshot
	setVar $ss $phot_ss
	setVar $ant $phot_ant
else
	setVar $mode "Adjacent"
	setVar $sshot "Single"
	setVar $ss 1
	setVar $ant "No"
	setVar $phot_mode $mode
	setVar $phot_sshot $sshot
	setVar $phot_ss $ss
	setVar $phot_ant $ant
end
gosub :save
:main
killAllTriggers
echo "[2J"
:menu
setVar $signature_inc~scriptName "SupGPhoton"
setVAr $signature_inc~version "1.c"
setVar $signature_inc~date "11/15/03"
gosub :signature_inc~signature

#=-=-=-=--=-
echo ANSI_15 "SupGPhoton Settings for " GAMENAME "*"
echo ANSI_14 "1." ANSI_15 " Mode              " ANSI_10 "["
echo ANSI_6 $mode
echo ANSI_10 "]*"
echo ANSI_14 "2." ANSI_15 " Single/Multi Shot " ANSI_10 "["
echo ANSI_6 $sshot
echo ANSI_10 "]*"
echo ANSI_14 "3." ANSI_15 " Anticipation      " ANSI_10 "["
echo ANSI_6 $ant
echo ANSI_10 "]*"
echo ANSI_14 "C  " ANSI_15 "Continue*"
echo ANSI_5 "*Press the number of the option you*wish to change, or press" ANSI_14 " C" ANSI_5 " to run*the script.*"
getConsoleInput $choice singlekey
if ($choice = 1)
	if ($mode = "Adjacent")
		setVar $mode "Twarp"
	elseif ($mode = "Twarp")
		setVar $mode "Bwarp"
	elseif ($mode = "Bwarp")
		setVar $mode "Pwarp"
	elseif ($mode = "Pwarp")
		setVar $mode "DScan"
		setVar $ant "No"
	else
		setVar $mode "Adjacent"
	end
	echo "[2J"
	goto :menu
elseif ($choice = 2)
	if ($sshot = "Single")
		setVar $ss 0
		setVar $sshot "Multiple"
	else
		setVar $ss 1
		setVar $sshot "Single"
	end
	echo "[2J"
	goto :menu
elseif ($choice = 3)
	if ($ant = "No") AND ($mode <> "DScan")
		setVar $ant "Yes"
	else
		setVar $ant "No"
	end
	echo "[2J"
	goto :menu
elseif ($choice = "c") or ($choice = "C")
	gosub :save
	if ($mode <> "Adjacent") AND ($mode <> "DScan")	
:sdh
		if ($mode = "Bwarp") AND ($sshot = "Multiple")
			setVar $sdh "h"
		else
			Echo ansi_12 "**H" ansi_15 "ome or " ansi_12 "S" ansi_15 "tay after photon*"
			getConsoleinput $sdh singlekey
			lowercase $choice
			if ($sdh <> "h") and ($sdh <> "s")
				goto :sdh
			end
		end
	end
	goto :proceed
else
	echo "[2J"
	goto :menu
end
#=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

:proceed
if ($mode = "DScan")
	goto :dscan
else
	gosub :list
end

send "'*(SupGPhoton): Script Started... Running In " $mode " Mode.*"
send "              Options: Anticipation - " $ant ", " $sshot " shot.**"

	
:wait
if ($poh = 0)
	send "'(SupGPhoton): Script Halted... Out of Photons.*"
	halt
end
killalltriggers
setTextLineTrigger limpet :limpet "Limpet mine in"
setTextLineTrigger fighter :fighter "Deployed Fighters Report Sector"
pause

:limpet
killTrigger fighter
getWord CURRENTLINE $hit_sec 4
getWord CURRENTLINE $fi 1
goto :check

:fighter
killTrigger limpet
getWord CURRENTLINE $hit_sec 5
stripText $hit_sec ":"
getWord CURRENTLINE $fi 1

:check 
if ($fi <> "Deployed") AND ($fi <> "Limpet")
	goto :wait
end
if ($mode <> "Adjacent") and ($mode <> "DScan")
	setVar $nearfig_inc~figList[$hit_sec] 0
	setVar $nearfig_inc~sector $hit_sec
	gosub :nearfig_inc~adj_fig
	if ($ant = "Yes") and ($nearfig_inc~adj = 1)
		setVar $pp $nearfig_inc~adj_fig
		setVar $nearfig_inc~sector $pp
		gosub :nearfig_inc~adj_fig
		setVar $hit_sec $pp
		setVar $nearfig_inc~sector $pp
		setVar $jump $nearfig_inc~adj_fig
		goto :move
	elseif ($nearfig_inc~adj = 0)
		goto :wait
	else
		setVAr $jump $nearfig_inc~adj_fig
		goto :move
	end
elseif ($mode = "Adjacent")
	getDistance $dist $cur_sec $hit_sec
	if ($dist = 1) OR (($ant = "Yes") AND ($dist = 2))
		if ($dist = 2)
			getCourse $course $cur_sec $hit_sec
			setVar $hit_sec $course[2]
		end
		goto :hit
	end
	goto :wait
end

:move
if ($nearfig_inc~adj = 0)
	goto :wait
end
if ($jump = $cur_sec)
	goto :hit
end
if ($mode = "Bwarp")
	send "b" $jump "*"
	setTextTrigger safe :safe "All Systems Ready, shall we engage?"
	setTextTrigger nofig :nofig "Do you want to make this transport blind?"
	pause
elseif ($mode = "Twarp")
	getDistance $dist $cur_sec $jump
	send "m" $jump "*"
	if ($dist = 1)
		send "**"
		goto :hit
	else
		send "y"
	end
	setTextTrigger noore :noore "You do not have enough"
	setTextTrigger safe :safe "All Systems Ready, shall we engage?"
	setTextTrigger nofig :nofig "Do you want to make this jump blind?"
	pause
elseif ($mode = "Pwarp")
	send "p" $jump "*y"
	goto :hit
end	
killalltriggers
goto :wait

:nofig
killAllTriggers
setVar $nearfig_inc~figList[$jump] 0
send "n"
goto :wait

:noore
killalltriggers
send "'(SupGPtorp): Not enough fuel to warp, shutting down...*"
halt
	
:safe
killAllTriggers
send "y"

:hit
send "cpy" $hit_sec "*q"
setTextLineTrigger fired :fired "Photon Wave Duration"
setTextTrigger nofire :nofire "That is not an adjacent sector"
pause

:nofire
killtrigger fired
goto :wait

:fired
killtrigger nofire
killtrigger home
killtrigger fired
subtract $poh 1
if ($mode = "Bwarp") or ($mode = "Twarp")
	if ($sdh = "h") 
		setVar $ship_inc~twarpto $cur_sec
		if ($jump <> $cur_sec)
			gosub :ship_inc~twarp
		end
		if ($ship_inc~twarpto > 0)
			if ($mode = "Bwarp")
				send "l" $pn "*c"
			end		
		elseif ($ship_inc~twarpto = "-1")
			send "'(SupGPhoton): Unable to transwarp, I don't have a transwarp drive... Cannot return home, script halting...*"
			halt
		elseif ($ship_inc~twarpto = "-2")
			send "'(SupGPhoton): Unable to transwarp, I'm being held by an IG. May need assistance. Script Halting...*"
			halt
		elseif ($ship_inc~twarpto = "-3")
			send "'(SupGPhoton): Unable to transwarp, I don't have enough fuel. Script Halting...*"
			halt
		elseif ($ship_inc~twarpto = "-4")
			send "'(SupGPhoton): Unable to transwarp, no jump point fighter. Cannot blind warp... Continuing with ptorp, changing to stay after photon mode...*"
			setVar $sdh "s"
			if ($mode = "Bwarp")
				send "'(SupGPhoton): Cannot run bwarp photon without a known planet to run from, shutting down...*"
				halt
			end
		end		
	else
		setVar $cur_sec $jump
	end
elseif ($mode = "Pwarp")
	if ($sdh = "h") and ($jump <> $cur_sec)
		send "p" $cur_sec "*y"
	else
		setVar $cur_sec $jump
	end
end

if ($mode = "Adjacent") OR ($mode = "Density")
	setVar $jump $cur_sec
end

send "'(SupGPhoton): Shot Fired From : " $jump " Into : " $hit_sec "*"

if ($ss = 0)
	waitfor "Photon Wave Duration has ended in sector"
else
	send "'(SupGPhoton): Shot Fired... Shutting down...*"
	halt
end
goto :wait

#-----------------------------------------------------------
:list
if ($mode <> "DScan") and ($mode <> "Adjacent") or (($ant = "Yes") AND ($mode <> "Adjacent"))
	if ($location = "Command") AND ($mode <> "Adjacent") AND ($mode <> "Twarp")
		echo "**"
		getInput $pn "Planet Number?"
	end
	if ($location = "Citadel")
		send "qd"
		setTextLineTrigger pnum :pnum "Planet #"
		pause

		:pnum
		getWord CURRENTLINE $pn 2
		stripText $pn "#"
		setVar $figfile GAMENAME & "_FIGLIST.txt"
		fileExists $figlchk $figfile
		if ($figlchk = 1)
			read $figFile $lastrefresh 1
			echo ANSI_15 "*Fighter list was last refreshed : " $lastrefresh ", would you like to refresh the list?"
			getConsoleInput $flu singlekey
			lowercase $flu
			setVAr $nearfig_inc~figfile GAMENAME & "_FIGLIST.txt"
			if ($flu = "y")
				send "q"
				setVAr $location "Command"
				gosub :nearfig_inc~figrefresh
			else
				if ($mode = "Twarp")
					send "q"
				else
					send "c"
				end
				clientmessage "Reading fighter list"
				gosub :nearfig_inc~readfigfile
			end
		else
			send "q"
			setVAr $location "Command"
			gosub :nearfig_inc~fig_list
		end
	else
		gosub :nearfig_inc~fig_list
	end
end

if ($mode <> "Twarp") AND ($mode <> "Adjacent") AND ($location <> "Citadel")
	send "l" $pn "*c"
	setVar $location "Citadel"
end
return


#-------------------------------------------------------
:dscan
if ($location = "Citadel")
	send "qq"
end
send "i"
setTextLineTrigger scan :scan "LongRange Scan :"
setTextLineTrigger noscan :noscan "Credits        :"
pause

:noscan
clientMessage "You need at least a density scanner to run in dscan mode."
halt

:scan 
killtrigger noscan
getWord CURRENTLINE $sct 4

setTextOutTrigger mainmenu :return "~"
:init
if ($poh = 0)
	send "'(SupGPhoton): Script Halted... Out of Photons.*"
	halt
end	
send "s"
waitfor "Long Range Scan"
if ($sct = "Holographic")
	send "d"
end
waitfor "(?=Help)? :"
setVar $initloop 0
:initloop
if ($initloop < SECTOR.WARPCOUNT[$cur_sec])
	add $initloop 1
	setVar $adjdens SECTOR.WARPS[$cur_sec][$initloop]
	setVar $dens[$initloop] SECTOR.DENSITY[$adjdens]
	goto :initloop
end
:dscanloop

send "s"
waitfor "Long Range Scan"
if ($sct = "Holographic")
	send "d"
end
waitfor "(?=Help)? :"
setVar $dscanchk 0
:dscanchk
if ($dscanchk < SECTOR.WARPCOUNT[$cur_sec])
	add $dscanchk 1
	setVar $adjdens SECTOR.WARPS[$cur_sec][$dscanchk]
	if ($dens[$dscanchk] <> SECTOR.DENSITY[$adjdens])
		send "cpy" $adjdens "*q"
		subtract $poh 1
		if ($ss = 1)
			halt
		else
			waitfor "Photon Wave Duration has ended in sector"
			goto :init
		end
	else
		goto :dscanchk
	end
end
goto :dscanloop

:return
waitfor "Command [TL="
send "*"
goto :main

:save
setVar $phot_mode $mode
setVar $phot_sshot $sshot
setVar $phot_ss $ss
setVar $phot_ant $ant
saveVar $phot_mode
saveVar $phot_sshot
saveVar $phot_ss
saveVar $phot_ant

setVar $ptorpSaved 1
saveVar $ptorpSaved
return

include "supginclude\gameinfo_inc"
include "supginclude\ship_inc"
include "supginclude\nearfig_inc"
include "supginclude\signature_inc"

#=-=-=-=-=-=-  Variable definitions  =-=-=-=-=-=-
#$cur_sec 	- Sector where script was started.
#$adj_sec    	- Sector hit by enemy player.
#$fi	     	- Fedcomm/Subspace/Page Filter. (security)
#$mode	    	- Determines mode of script. (adj, pdrop, twarp, bwarp, dscan)	
#$ss	     	- Determines whether script is in single or multishot mode.
#		  $ss = 1 - Script in single shot mode
#		  $ss = 0 - Script in multi shot mode
#$poh	     	- Photons on hand
#$ant		- Boolean value for anticipation
#		  $ant = 1 - Anticipation mode on
#		  $ant = 0 - Anticipation mode off	
