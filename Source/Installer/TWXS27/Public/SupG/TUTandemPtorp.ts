getWord CURRENTLINE $prompt 1
if ($prompt <> "Command") AND ($prompt <> "Citadel")
	clientmessage "This script must be run from the Command or Citadel prompt."
	halt
end
gosub :gameinfo_inc~quikstats
if ($gameinfo_inc~quikstats[PHOT] = 0)
	clientMessage "This script requires photons to run."
	halt
end
setVar $ptorps $gameinfo_inc~quikstats[PHOT]
if ($prompt = "Command")
	:reenter
	getInput $pnum "Planet Number?"
	isNumber $hum $pnum
	if ($hum = 0) OR ($pnum < 2)
		goto :reenter
	end
else
	send "qd"
	setTextLineTrigger pnum :pnum "Planet #"
	pause

	:pnum
	getText CURRENTLINE $pnum "#" " in"
	send "C"
	waitFor "Citadel treasury contains"
end

setVar $nearfig_inc~figfile GAMENAME & "_FIGLIST.txt"
fileExists $figlchk $nearfig_inc~figfile
if ($figlchk = 1)
	read $nearfig_inc~figFile $lastrefresh 1
	echo ANSI_15 "**Fighter list was last refreshed : " $lastrefresh ", would you like to refresh the list?"
	getConsoleInput $flu singlekey
	lowercase $flu
	if ($flu = "y")
		if ($prompt = "Citadel")
			send "qq"
		end
		gosub :nearfig_inc~figrefresh
		send "l  " $pnum "*  c"
		setVar $prompt "Citadel"
	else
		clientmessage "Reading fighter list"
		gosub :nearfig_inc~readfigfile
	end
else
	if ($prompt = "Citadel")
		send "qq"
	end
	gosub :nearfig_inc~figrefresh
	send "l  " $pnum "*  c"
	setVar $prompt "Citadel"
end
if ($prompt = "Command")
	send "l  " $pnum "*  c"
end
waitFor "We have"
:pickaroad
echo ANSI_15 "*Are you taking the (" ANSI_12 "H" ANSI_15 ")igh road, or the (" ANSI_12 "L" ANSI_15 ")ow road?*"
getConsoleInput $road SINGLEKEY
lowerCase $road
if ($road <> "h") AND ($road <> "l")
	goto :pickaroad
end
send "'Tandem Photon running, taking the "
if ($road = "l")
	send "low "
else
	send "high "
end
send "road.*"
:wait
setTextLineTrigger limpet :limpet "Limpet mine in"
setTextLineTrigger fighter :fighter "Deployed Fighters Report Sector"
pause

:fighter
killtrigger limpet
getWord CURRENTLINE $spoof 1
gosub :spoofcheck
if ($spoof = 1)
	 goto :wait
end
getWord CURRENTLINE $sechit 5
stripText $sechit ":"
setVar $nearfig_inc~figlist[$sechit] 0
if (SECTOR.WARPCOUNT[$sechit] = 3) OR ((SECTOR.WARPCOUNT[$sechit] = 2) AND ($road = "l"))
	if (SECTOR.WARPCOUNT[$sechit] = 2)
		setVar $warpchk 0
		:warpchk
		if ($warpchk < 2)
			add $warpchk 1
			if ($nearfig_inc~figlist[SECTOR.WARPS[$sechit][$warpchk]] = 1)
				setVar $potTarget SECTOR.WARPS[$sechit][$warpchk]
				setVar $nearfig_inc~sector $potTarget
				gosub :nearfig_inc~adj_fig
				if ($nearfig_inc~adj = 1)
					setVAr $jump $nearfig_inc~adj_fig
					setVar $target $potTarget
					goto :fire
				end
			end
			goto :warpchk
		end
	else
		setVar $3loop 0
		setVar $figged 0
		:3loop
		if ($3loop < 3)
			add $3loop 1
			if ($nearfig_inc~figlist[SECTOR.WARPS[$sechit][$3loop]] = 1)
				add $figged 1
				setVar $targets[$figged] SECTOR.WARPS[$sechit][$3loop]
				if ($figged = 2)
					goto :chkfire
				end
			end
			goto :3loop
		end
		:chkfire
		if ($figged = 1) AND ($road = "l")
			setVar $nearfig_inc~sector $targets[1]
			gosub :nearfig_inc~adj_fig
			if ($nearfig_inc~adj = 1)
				setVAr $jump $nearfig_inc~adj_fig
				setVar $target $targets[1]
				goto :fire
			end
		elseif ($figged > 1)
			if ($road = "l")
				setVar $potTarget $targets[1]
				setVar $nearfig_inc~sector $targets[1]
			else
				setVar $potTarget $targets[2]
				setVar $nearfig_inc~sector $targets[2]
			end
			gosub :nearfig_inc~adj_fig
			if ($nearfig_inc~adj = 1)
				setVAr $jump $nearfig_inc~adj_fig
				setVar $target $potTarget
				goto :fire
			end
		end
	end
end
goto :wait

:fire
send "p" $jump "*ycpy" $target "*q"
setTextTrigger fired :fired "Photon Wave Duration"
setTextTrigger nofire :nofire "That is not an adjacent sector"
pause

:fired
killtrigger nofire
send "'Tandem photon fired into " $target " from " $jump ".*"
halt

:nofire
setVar $nearfig_inc~figList[$jump] 0
send "qq"
goto :wait

:spoofcheck
getWord CURRENTLINE $hrm 1
if ($hrm <> "Deployed")
	setVAr $spoof 1
else
	setVar $spoof 0
end
return
			
				
include "supginclude\nearfig_inc"
include "supginclude\gameinfo_inc"