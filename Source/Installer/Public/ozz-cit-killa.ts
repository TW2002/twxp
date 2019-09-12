:start
# check if we can run it from here
cutText CURRENTLINE $location 1 7

if ($location <> "Citadel")
        echo ansi_12 "**This script must be run from the Citadel Prompt"
        halt
end
# send "'OZ - Cit Killa - Powering Up!*"

:stats
# send "szn* "
gosub :quickstats
send "c;q"
waitFor "Figs Per Attack:"
getWord CURRENTLINE $figs 5
send "qdc "
waitFor "Planet #"
getWord CURRENTLINE $planet 2
stripText $planet "#"

:warning
send "'OZ - Cit Killa - Running on Planet " $planet "*"

:main
killAllTriggers
setDelayTrigger warning_trigger :warning 1200000
setTextLineTrigger limp :scanit "Limpet mine in"
setTextLineTrigger deffig :scanit "Deployed Fighters Report Sector "
setTextLineTrigger ig :scanit "Shipboard Computers The Interdictor Generator on"
setTextLineTrigger secgun :scanit "Quasar Cannon on"
setTextLineTrigger warps :scanit "warps into the sector."
setTextLineTrigger lifts :scanit "lifts off from"
setTextLineTrigger power :scanit "is powering up weapons systems!"
setTextLineTrigger scan_sec :scan_started "<Scan Sector>"
# setTextLineTrigger ss :scanit 
pause

:scanit
killAllTriggers
# send "/"
# waitFor "Sect "
# getWord CURRENTLINE $sector 2
# stripText $sector #179
# stripText $sector "Turns"
# getSector $sector $sec
# send "sr n * "
send " s* "
waitFor "<Scan Sector>"
:scan_started
waitFor "Sector  :"
getWord CURRENTLINE $sector 3
waitFor "Citadel command"
getSector $sector $sec
# echo ansi_12 "*ships = " $sec.ships "*"
# echo "*" SECTOR.TRADERS[$sector][1] "*"
# echo "*" SECTOR.TRADERS[$sector][2] "*"
if (SECTOR.TRADERCOUNT[$sector] > 0)
	goto :startkill
end
goto :halt

:startkill
setVar $mac 0
setVar $nos $sec.ships
setVar $trader_count 0
:addin
if ($trader_count = $sec.traders)
	goto :halt
end
add $trader_count 1
setVar $line $sec.trader[$trader_count].NAME
getText $line $ck "[" "]"
if ($ck = $corp)
	add $nos 1
	goto :addin
end

:macro
# pause
add $mac 1
if ($mac = 5)
	goto :scanit
end
send "q mnt*  q  "
send "a"
setVar $no_count 0
:no_count
if ($no_count = $nos)
	goto :popem
else
	send "n"
	add $no_count 1
	goto :no_count
end
:popem

# Experimental shipcap stuff
setVar $figs ($figs * 100)
setVar $figs ($figs / 143)
if ($figs < 1)
     setVar $figs 1
end

send "y  " $figs "*  *  l  " $planet "*  c  "
waitFor "<Preparing ship to land on planet surface>"
goto :macro


:halt
setDelayTrigger final :final 10
pause
:final
# echo ansi_12 "*NO Targets*"
goto :main



:quickstats
setVar $pos2 2
send "/"
waitFor "Hlds"
setTextLineTrigger corp :corp "Corp"
pause

:corp
getWordPos CURRENTLINE $pos "Corp"
add $pos 4
cutText CURRENTLINE $corp $pos $pos2
isNumber $number $corp
if ($number = 0)
	subtract $pos2 1
	cutText CURRENTLINE $corp $pos $pos2
end
stripText $corp " "
return
	


