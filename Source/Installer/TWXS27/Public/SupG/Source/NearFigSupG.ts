#Script Name 		: SupGNearFig TWX V2
#Script Author		: SupG
#Date Completed/Updated : 12/22/02 
#Start Prompt 		: Command
#Script Requirements 	: info_inc.ts required in the 
#  			  same directory as this file.
#Script Description 	: Script that uses TWX database and the "G" fig list to 
#			  find closest fighters/ports to given sectors when asked
#			  via a subspace command
#Directions		: This script is activated via subspace commands and/or a local
#			  user command.  The subspace commands are as follows and can
#			  be used by anyone on the same subspace frequency as the script
#			  runner, with the exception of the script runner:
#
#			  ;<sector>  - Finds the closest fighter to <sector>
#			  ;port <sector> <type> -Closest <type> port to <sector>
#			  ;fport <sector> <type> -Closest figged <type> port to <sector>
#			  ;refresh - Refreshes "G" fig list
#			  ;? or ;help - shows the help screen
#
#			  The script runner can access all of the above commands by pressing
#			  the ">" key. This will ask you to enter a command or sector number.
#			  You can use all the same commands as above without the ! signs.
#
#			  Port types are as follows:
#			  s - sell
#			  b - buy
#			  x - wildcard (either sell or buy)
#			  example - a type sxb port would be a port selling fuel, buying
#			  equipment, and either selling or buying organics. So if you 
#			  were looking for a figged port selling fuel close to sector
#			  123 you would enter:
#			  ;fport 123 sxx - in sub-space non-script runner
#				or
#			  >fport 123 sxx - if you are the script runner.
#
#Warnings		: This script may not always get you an answer. If the script
#			  returns "Request could not be calculated" you either do not 
#			  have sufficient mapping data, or have not explored enough.
#
#Credits (help/ideas)	: Thanks to the reverend for port searching idea, and inclusion of warp course
#			  to the printout.
#				
#					SupG
#					www.scripterstavern.com
systemscript

setVar $signature_inc~scriptName "SupGNearFig"
setVar $signature_inc~version "2.final"
setVar $signature_inc~date "09/26/03"
gosub :signature_inc~signature

gosub :nearfig_inc~fig_list

:begin
if ($refresh = 1)
	send "'Fig list refreshed*"
	setVar $refresh 0
end
:help
send "'*SupGNearFig -=- Script Running... Command Listing: -=-*"
send "   ;(sectornumber)      - for closest fig to sectornumber.*"
send "   ;refresh             - to refresh the fighter list.*"
send "   ;watch <on/off>      - turn closest fig to fig hit on/off.*"
send "   ;port <sec> <type>   - finds nearest port of <type> to <sec>.*"
send "   ;fport <sec> <type>  - finds nearest figged port of <type> to*"
send "                          <sec>.*"
send "                          bxs port type options, where x is wildcard*"
send "                          b is buy, s is sell in appropriate position*"
send "   ;? or help           - shows list of commands.**"

:top
setVar $command 0
killalltriggers
setTextOutTrigger check :cfcheck ">"
setTextLineTrigger checksec :calculate ";"
setTextLineTrigger fighit :fighit "Deployed Fighters Report Sector"
pause

:calculate
killalltriggers
getWord CURRENTLINE $tester 1
if ($tester = "R")
	cuttext CURRENTLINE $origsec 9 999
	getWord $figcheck $origsecnum 1
	stripText $origsec ";"
	goto :chkorig
else
	goto :top
end

:cfcheck
killalltriggers
getInput $origsec "Enter your command, or a sector number to find a fig nearby."
:chkorig
isNumber $in $origsec
if ($in = 1)
	stripText $origsec " "
	if ($origsec > 0) and ($origsec <= SECTORS)
		setVar $nearfig_inc~origsec $origsec
		setVar $nearfig_inc~command 0
		gosub :nearfig_inc~closefig
		goto :print_result
	else
		goto :top
	end
else
	getWord $origsec $command 1
	if ($command = "refresh")
		send "/"
		waitFor "(?="
		cutText CURRENTLINE $location 1 12
		if ($location <> "Command [TL=")
   		     	send "'Cannot update fig list, incorrect prompt*"
        		goto :top
		else
			setVar $refresh 1
			gosub :nearfig_inc~figrefresh
			goto :begin
		end
	elseif ($command = "watch")
		getWord $origsec $onoff 2
		if ($onoff = "off")	
			setVar $watch "OFF"
			send "'Nearest Fig hit watch is off*"
		elseif ($onoff = "on")
			setVar $watch "ON"
			send "'Nearest Fig hit watch is on*"
		end
	elseif ($command = "?") or ($command = "help")
		goto :help
	elseif ($command = "port") or ($command = "fport")
		getWord $origsec $cfsector 2
		getWord $origsec $cptype 3
		if ($cptype = 0)
			send "'Invalid port type*"
			goto :top
		end
		cutText $cptype $cpfuel 1 1
		if ($cpfuel <> "s") and ($cpfuel <> "b") and ($cpfuel <> "x")
			send "'Invalid port type*"
			goto :top
		end
		cutText $cptype $cporg 2 1
		if ($cporg <> "s") and ($cporg <> "b") and ($cporg <> "x")
			send "'Invalid port type*"
			goto :top
		end
		cutText $cptype $cpequip 3 1
		if ($cpequip <> "s") and ($cpequip <> "b") and ($cpequip <> "x")
			send "'Invalid port type*"
			goto :top
		end
		setVar $origsec $cfsector
		setVar $nearfig_inc~cpfuel $cpfuel
		setVar $nearfig_inc~cporg $cporg
		setVar $nearfig_inc~cpequip $cpequip
		setVar $nearfig_inc~origsec $cfsector
		setVar $nearfig_inc~command $command
		gosub :nearfig_inc~closefig
		goto :print_result
	end
	goto :top
end

:print_result
if ($nearfig_inc~result > 0)	
	if ($command = 0)
		getDistance $cfdist $nearfig_inc~result $origsec
		getCourse $cflane $nearfig_inc~result $origsec
		send "'Closest fig to " $origsec  " : " $nearfig_inc~result " - Distance : " $cfdist " hops*"
	elseif ($command = "fport")
		getDistance $cfdist $origsec $nearfig_inc~result
		getCourse $cflane $origsec $nearfig_inc~result
		send "'Closest figged " $cptype " port to " $origsec " : " $nearfig_inc~result " - Distance : " $cfdist " hops*"
	elseif ($command = "port")
		getDistance $cfdist $origsec $nearfig_inc~result
		getCourse $cflane $origsec $nearfig_inc~result
		send "'Closest " $cptype " port to " $origsec " : " $nearfig_inc~result " - Distance : " $cfdist " hops*"
	end
	if ($fhit = 0) and ($cfdist > 0)
		setVar $cfcourse 0
		send "'*Warp Course : "
		:course
		if ($cfcourse < $cflane)
			add $cfcourse 1
			send $cflane[$cfcourse]
			if (PORT.CLASS[$cflane[$cfcourse]] <> "-1")
				setVar $port_inc~classchk PORT.CLASS[$cflane[$cfcourse]]
				gosub :port_inc~chkclass
				send "(" $port_inc~class ")"
			end
			send " > "
			goto :course
		end
		if ($command = 0)
			send $origsec
			if (PORT.CLASS[$origsec] <> "-1")
				setVar $port_inc~classchk PORT.CLASS[$origsec]
				gosub :port_inc~chkclass
				send "(" $port_inc~class ")"
			end
			send "**"
		else
			send $nearfig_inc~result
			if (PORT.CLASS[$nearfig_inc~result] <> "-1")
				setVar $port_inc~classchk PORT.CLASS[$nearfig_inc~result]
				gosub :port_inc~chkclass
				send "(" $port_inc~class ")"
			end
			send "**"
		end
	end
else
	send "'Request could not be calculated*"
end
goto :top

:fighit
getWord CURRENTLINE $fedfilter 1
getWord CURRENTLINE $sechit 5
stripText $sechit ":"
if ($fedfilter = "Deployed")
	setVar $nearfig_inc~figList[$sechit] 0
	if ($watch = "ON")
		setVar $origsec $sechit
		setVar $fhit 1
		goto :chkorig
	end
end
goto :top

halt
include "supginclude\nearfig_inc"
include "supginclude\port_inc"
include "supginclude\signature_inc"