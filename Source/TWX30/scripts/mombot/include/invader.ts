#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:invader~invader
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
gosub :loadvars~loadvars

setvar $valid_commands " pe ped pel pelk pex pxe pxed pxedx pxel pxelk pxex "
getwordpos $valid_commands $pos " "&$command&" "
if ($pos <= 0)
	setvar $switchboard~message "Invader must be called through one of: pe ped pel pelk pex pxe pxed pxedx pxel pxelk pxex.*"
	gosub :switchboard~switchboard
	halt
end

killalltriggers
if (($command = "") or ($command = 0))
	setvar $command $bot~command_typed
	if (($command = "") or ($command = 0))
		setvar $command $bot~command
	end
	lowercase $command
end

setarray $scan_array 1000
gosub :player~quikstats
setvar $bot~startinglocation $player~current_prompt
setvar $bot~validprompts "Citadel Command"
gosub :player~checkstartingprompt
setvar $player~startinglocation $player~current_prompt
setvar $starting_ship $player~ship_number

if ($ship~ship_max_attack <= 0)
	gosub :ship~getshipstats
end

if ($player~photons <= 0)
	setvar $switchboard~message "This command requires a photon*"
	gosub :switchboard~switchboard
	halt
end

isnumber $test $bot~parm2
if ((($test = false) or ($bot~parm2 = 0)) and (($command <> "pe") and ($command <> "ped")))
	setvar $switchboard~message "Parameter 2 invalid*"
	gosub :switchboard~switchboard
	halt
end

isnumber $test $bot~parm3
if (($test = false) or ($bot~parm3 = 0))
	if ($command = "pxex")
		setvar $bot~parm3 $player~ship_number
	elseif (($command = "pxel") or ($command = "pxelk"))
		setvar $switchboard~message "Planet Parameter in-valid*"
		gosub :switchboard~switchboard
		halt
	end
end

isnumber $test $bot~parm1
if ($test = false)
	setvar $switchboard~message "Sector Parameter invalid*"
	gosub :switchboard~switchboard
	halt
end
if (($bot~parm1 > 10) and (($bot~parm1 <= sectors) and ($bot~parm1 <> $map~stardock)))
else
	setvar $switchboard~message "Invalid attack sector entered*"
	gosub :switchboard~switchboard
	halt
end

setvar $i 1
setvar $isfound false
while (sector.warps[$player~current_sector][$i] > 0)
	if (sector.warps[$player~current_sector][$i] = $bot~parm1)
		setvar $isfound true
	end
	add $i 1
end
if ($isfound = false)
	setvar $switchboard~message "Cannot continue.  Sector not Adjacent, aborting..*"
	gosub :switchboard~switchboard
	halt
end
getwordpos " "&$bot~user_command_line&" " $pos "speed"
if ($pos > 0)
	setvar $speed true
else
	setvar $speed false
end

send " c v * y * "&$bot~parm1&"*  "

if ($player~startinglocation = "Citadel")
	if ($player~credits > 0)
		send "t t"&$player~credits&"* "
	end
	send " q  q"
	gosub :planet~getplanetinfo
	send "  C C  "
end
setvar $enter "m  "&$bot~parm1&"*"
setvar $xport "x   "&$bot~parm2&"*  q  z  n  "
setvar $xport_back "x   "&$starting_ship&"*  q  z  n  "
setvar $photon "  p y"&$bot~parm1&"*  q  "

setvar $xport_commands " pxe pxed pxedx pxel pxelk pxex "
getwordpos $xport_commands $pos " "&$command&" "
if ($pos > 0)
	setvar $speed_invade_macro $xport&$enter&"       * "
	setvar $normal_invade_macro $xport&$enter&"** "
else
	setvar $speed_invade_macro $enter&"     *  "
	setvar $normal_invade_macro $enter&"*            "
end

if ($player~startinglocation = "Citadel")
	setvar $mac_starting $photon&"q  q  "
else
	setvar $mac_starting $photon&"  "
end
if ($command = "pxex")
	setvar $mac_ending "x   "&$bot~parm3&"*  q  q  z  n"
	setvar $ends_in_sector true
elseif ($command = "pex")
	setvar $mac_ending "x    "&$bot~parm2&"*  q  q  *  z  n  *  "
	setvar $ends_in_sector true
elseif ($command = "pel")
	setvar $mac_ending "l "&$bot~parm2&"*  *"
	setvar $ends_in_sector false
elseif ($command = "pxel")
	setvar $mac_ending "l "&$bot~parm3&"*  *  "
	setvar $ends_in_sector false
elseif ($command = "pxelk")
	setvar $mac_ending "l "&$bot~parm3&"*  *  a"&$ship~ship_max_attack&"*"
	setvar $ends_in_sector false
elseif ($command = "pelk")
	setvar $mac_ending "l "&$bot~parm2&"*  *  a"&$ship~ship_max_attack&"*"
	setvar $ends_in_sector false
elseif (($command = "pxed") or ($command = "ped"))
	setvar $mac_ending "u  y  n  . *  j  c  *  "
	setvar $ends_in_sector false
elseif (($command = "pxedx") or ($command = "pedx"))
	setvar $mac_ending "u  y  n  . *  j  c  *  "&$xport_back
	setvar $ends_in_sector true
else
	setvar $mac_ending ""
	setvar $ends_in_sector false
end
if (($player~startinglocation = "Citadel") and ($ends_in_sector = true))
	setvar $mac_ending $mac_ending&"l "&$planet~planet&" * c"
end
setvar $mac_ending $mac_ending&"@"

send "  t"
waitfor ", 2"
getword currentline $inittime 1

:photon_attack_timer
send "  t"
waitfor ", 2"
getword currentline $currenttime 1
waitfor "Computer"
if ($inittime <> $currenttime)
	if ($speed = true)
		send $mac_starting&$speed_invade_macro&$mac_ending
	else
		send $mac_starting&$normal_invade_macro&$mac_ending
	end
else
	goto :photon_attack_timer
end

if ($speed = false)
	setvar $i 1
	settextlinetrigger damage :invader~collect_damage "The console reports damages of "
	settextlinetrigger damage_done :invader~damage_done "Average Interval Lag:"
	settextlinetrigger damage_pod :invader~collect_pod "You rush to an escape pod and abandon"
	settextlinetrigger death :invader~collect_death "You will have to start"
	pause

	:invader~collect_damage
	setvar $scan_array[$i] currentline
	add $i 1
	settextlinetrigger damage :invader~collect_damage "The console reports damages of "
	pause

	:invader~collect_pod
	setvar $scan_array[$i] currentline
	add $i 1

	:invader~damage_done
	killalltriggers
	if ($i > 1)
		setvar $j 1
		send "'*"
		settextlinetrigger comm :invader~continuedamage "Comm-link open on sub-space band"
		pause

		:invader~continuedamage
		while ($j < $i)
			send $scan_array[$j]&"*"
			add $j 1
		end
		send "*"
		settextlinetrigger comm2 :invader~continuedamage2 "Sub-space comm-link terminated"
		pause

		:invader~continuedamage2
	end

	:invader~collect_death
	killalltriggers
	halt
end
halt

# includes:
include "source\include\planet"
include "source\include\ship"
include "source\include\loadvars"
include "source\include\switchboard.ts"
