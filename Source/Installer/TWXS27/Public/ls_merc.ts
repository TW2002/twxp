#
#    This is for users of the Mind-Over-Matter BOT.
#
#    A simple script that utilizes the MOMBot Modules to MERCH ORG & EQU from
#    planets in a sector.
#
#Name Of MOMBot you're controlling
setVar $BOT "fre"
#If you want MERCH to buydown ORE from ports change the FALSE, to TRUE
setVar $BUYFUEL true
#Do Port CIM Update
setVar $DO_CIM true
#Bank Planet where funds are deposited. **MUST Be in same sector**
setVar $BANK_PLANET 4
#Minimum product amount for the Merch cmd
setVar $PROUCT_AMOUNT 40000

setVar $PLANETS_SECT 6
setArray $PLANETS $PLANETS_SECT
#List of Planets in Current Sector. $BANK_PLANET, must be in the sector as well.
setVar $PLANETS[1] 4
setVar $PLANETS[2] 5
setVar $PLANETS[3] 6
setVar $PLANETS[4] 7
setVar $PLANETS[5] 8
setVar $PLANETS[6] 9

#Get to Command Prompt
send " q q q z n *  *   /"
waiton (#179 & "Turns")
if ($DO_CIM)
#Update Port-CIM. Only really needs to be done once per session
setEventTrigger		CIM_DETECT		:CIM_DETECT "SCRIPT STOPPED" "scripts\MomBot\Commands\Data\cim.cts"
setEventTrigger		CIM_TIMEOUT		:CIM_TIMEOUT 300000
send "'" & $BOT & " cim*"
waiton "Message sent on sub-space channel"
pause
:CIM_TIMEOUT
killAllTriggers
Echo "***CIM Timed Out (5mins expired)***"
halt
:CIM_DETECT
killAllTriggers
end
setVar $PLANETS_IDX 1
while ($PLANETS_IDX <= $PLANETS_SECT)
if ($PLANETS[$PLANETS_IDX] <> 0)
setVar $P $PLANETS[$PLANETS_IDX]
gosub :GOGO
if ($FINI)
goto :EndGame
end
end
add $PLANETS_IDX 1
end

:EndGame
send "'"&$BOT&" land "&$BANK_PLANET&"*"
setTextLineTrigger	iLANDED	:iLANDED	"- In Cit - Planet"
pause
:iLANDED
killAllTriggers
#Tries to Return Planet 'Home' but if the MOMBot "H" Var isn't set
#then this will do nothing
send "'"&$BOT&" pwarp h*"
waiton "Message sent on sub-space channel"
halt
#-------------------------------------------------------------------------

:GOGO
send "'"&$BOT&" land "&$P&"*"
setTextLineTrigger	LANDED	:LANDED	"- In Cit - Planet"
pause
:LANDED
killAllTriggers
setVar $FINI FALSE
if ($BUYFUEL)
send "'"&$BOT&" merch "&$PROUCT_AMOUNT&" o e neg skipcim buyfuel*"
else
send "'"&$BOT&" merch "&$PROUCT_AMOUNT&" o e neg skipcim*"
end
waiton "Message sent on sub-space channel"
setTextLineTrigger	DONE_MERCH	:DONE_MERCH	"{"&$BOT&"} - Planet Merchant completed."
setTextLineTrigger	DONE_DONE	:DONE_DONE	"Can't find a route to any other ports."
pause
:DONE_DONE
setVar $FINI TRUE
pause
:DONE_MERCH
killAllTriggers
send "'"&$BOT&" with*"
waiton "Message sent on sub-space channel"
setTextLineTrigger WITH	:WITH	"credits taken from citadel."
pause
:WITH
send "'"&$BOT&" figmove s*"
waiton "Message sent on sub-space channel"
setTextLineTrigger	MOVED	:MOVED	"{"&$BOT&"} - fighters moved"
pause
:MOVED
killAllTriggers
send "q q q z n * l "&$BANK_PLANET&"* c '"&$BOT&" dep*"
waiton "Message sent on sub-space channel"
setTextLineTrigger DEP	:DEP	"credits deposited into citadel."
pause
:DEP
killAllTriggers
send "q q q z n ** "
waiton "Warps to Sector(s) :"
return