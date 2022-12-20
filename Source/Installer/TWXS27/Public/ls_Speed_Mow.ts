# LoneStar's LawnMow - Inspired in Part By Mind Dagger
#
# Flips CN9, doesn't lay figs, tracks fig Loss along mow Path
#
# More To do
goto :_START_
:INN
getWord CURRENTLINE $IDX 5
setTextLineTrigger	INN		:INN	"To which Sector ?"
pause
:LOST
add $L 1
getWord CURRENTLINE $LOST[$IDX] 3
setTextLineTrigger	LOST	:LOST	"You lost"
pause
:HAZ
setTextLineTrigger	HAZ		:HAZ	"Collision Damage! Asteroids/Debris"
setVar $LOST[$IDX][1] ($LOST[$IDX][1] & " HAZ ")
pause
:MINE
setTextLineTrigger	MINE	:MINE	"Mined Sector: Do you wish to Avoid this sector in the future"
setVar $LOST[$IDX][1] ($LOST[$IDX][1] & " MINE ")
pause
:PLANET_LEFT
setVar $LOST[$IDX][1] ($LOST[$IDX][1] & " PLANET-LEFT ")
setTextLineTrigger	P_GONE	:PLANET_LEFT	"is no longer in this sector!"
pause

:_START_
getWord CURRENTLINE $PROMPT 1
if ($PROMPT <> "Command")
	Echo ANSI_12 & "*Run from Command Prompt*"
	halt
end
setArray $LOST SECTORS 1
Echo ANSI_15 "*Mow To" ANSI_14
getConsoleInput $selection
uppercase $selection
isNumber $tst $selection
if ($tst = 0)
Echo ANSI_12 & "**HALTED*"
halt
end
if ($selection < 1) or ($selection > SECTORS)
Echo ANSI_12 & "*Invalid Sector*"
halt
end
send "/"
waiton #179 & "Turns"
gettext CURRENTLINE $CS "Sect" (#179 & "Turns")
StripText $CS " "
if ($selection = $cs)
Echo ANSI_12 & "*Mow Completed Smarty Pants*"
halt
end
getText CURRENTLINE $FIGS_START "Figs" #179
stripText $FIGS_START " "
stripText $FIGS_START ","
waiton #179 & "Phot"
getText CURRENTLINE $PHOTON (#179 & "Phot") (#179 & "Armd")
stripText $PHOTON " "
if ($PHOTON <> 0)
Echo ANSI_12 & "**Mow with Photons? Are You Like Crazy?*"
halt
end
waiton "Command ["
setVar $From $CS
setvar $To $selection
gosub :getCourse
setVar $i 1
setVar $MAC ""
while ($i <= $courseLength)
	setVar $MAC ($MAC & "m" & $COURSE[$i] & "*")
	if ($COURSE[$i] > 10) AND ($COURSE[$i] <> STARDOCK)
		setVar $MAC ($MAC & "za1000**")
	end
	add $i 1
end

send "cn"
setTextLineTrigger	CN9_1	:CN9_1	"Abort display on keys    - SPACE"
setTextLineTrigger	CN9_2	:CN9_2	"Abort display on keys    - ALL KEYS"
pause
:CN9_1
killAllTriggers
send "9"
:CN9_2
killAllTriggers
send "qq"
setVar $L 0
setTextLineTrigger	INN		:INN	"To which Sector ?"
setTextLineTrigger	LOST		:LOST	"You lost"
setTextLineTrigger	HAZ		:HAZ	"Collision Damage! Asteroids/Debris"
setTextLineTrigger	MINE		:MINE	"Mined Sector: Do you wish to Avoid this sector in the future"
setTextLineTrigger	P_GONE	:PLANET_LEFT	"is no longer in this sector!"
send "'[MOW] " & $FROM & " -> " & $TO & "*"
waitfor "Message sent on sub-space channel"
if ($TO > 10) AND ($TO <> STARDOCK)
	send $MAC & "*fz1*zcd*"
else
	send $MAC
end
send "*cn9qq/"
waiton #179 & "Figs"
getText CURRENTLINE $FIGS_END "Figs" #179
stripText $FIGS_END " "
stripText $FIGS_END ","
getText CURRENTLINE $ARRIVED_AT "Sect" #179
stripText $ARRIVED_AT " "
stripText $ARRIVED_AT ","
waiton "Command ["

if ($ARRIVED_AT <> $TO)
	setVar $SAVEME " * R * "
	if ($ARRIVED_AT > 10) AND ($ARRIVED_AT <> STARDOCK)
		setVar $SAVEME ($SAVEME & "f  z  1*  z  c  d  *  ")
	end
	if ($ARRIVED_AT < 10)
		setVar $ARRIVED_AT "0000" & $ARRIVED_AT
	elseif ($ARRIVED_AT < 100)
		setVar $ARRIVED_AT "000" & $ARRIVED_AT
	elseif ($ARRIVED_AT < 1000)
		setVar $ARRIVED_AT "00" & $ARRIVED_AT
	elseif ($ARRIVED_AT < 10000)
		setVar $ARRIVED_AT "0" & $ARRIVED_AT
	end

	send $SAVEME & "'"
	waiton "Sub-space radio"
	send ($ARRIVED_AT & "=saveme*")

    setTextLineTrigger	friendlytwarp	:friendlytwarp "appears in a brilliant flash of warp energies!"
    setTextLineTrigger	friendlyplanet	:friendlyplanet "Saveme script activated - Planet "
    setDelayTrigger 	timeout 		:timeout 30000
    pause
    :timeout
	killalltriggers
	send "'30 seconds after save call, script halted.*"
	goto :SAVE_END

    :friendlytwarp
	killalltriggers
    send "F"
    setTextLineTrigger nocontrol 	:nocontrol 		"These fighters are not under your control."
    setTextLineTrigger abletodeploy :abletodeploy 	"fighters available."
    pause
	    :nocontrol
        killalltriggers
        send "'We don't control the figs in this sector!*"
        waiton "Message sent on sub-space channel"
        goto :SAVE_END

	    :abletodeploy
        killalltriggers
        getWord CURRENTLINE $figsavailable 3
        striptext $figsavailable ","
		send $figsavailable "* z c d * "
		goto :SAVE_END
    :friendlyplanet
	killalltriggers
	getText CURRENTLINE $planet "Saveme script activated - Planet " " to "
	send "L " & $planet & "* C 'I landed on planet " & $planet & "*"

	:SAVE_END
end

send "  **  "
Echo "**" & ANSI_15 & "Mow Results:*"
Echo ANSI_7 & "===================="
setVar $i 1
setVar $TALLY 0
setVar $SPAM ""
while ($i <= $courseLength)
	setVar $PAD ""
	setVar $P 1
	getlength $COURSE[$i] $Len
	while ($P <= (5 - $LEN))
		setVar $PAD ($PAD & " ")
		add $p 1
	end
	Echo ANSI_15 & "*Sector: " & ANSI_14 & $PAD & $COURSE[$i] & ANSI_15 & " Lost " & ANSI_14 & $LOST[$COURSE[$i]] & " figs,"
	setVar $SPAM ($SPAM & "Sector: " & $PAD & $COURSE[$i] & " Lost " & $LOST[$COURSE[$i]] & " figs,")
	Echo " " & ANSI_6 & SECTOR.WARPCOUNT[$COURSE[$i]] & " Warps"

	setVar $SPAM ($SPAM & " " & SECTOR.WARPCOUNT[$COURSE[$i]] & " Warps")

	getWordPos $LOST[$COURSE[$i]][1] $POS "HAZ"
	if ($POS <> 0)
		Echo " " & ANSI_12 & "HAZ"
		setVar $SPAM ($SPAM & " HAZ")
	end
	getWordPos $LOST[$COURSE[$i]][1] $POS "MINE"
	if ($POS <> 0)
		Echo " " & ANSI_1 & "ENEMY MINES"
		setVar $SPAM ($SPAM & " ENEMY MINES")
	end
	add $TALLY $LOST[$COURSE[$i]]
	add $i 1
	setVar $SPAM ($SPAM & " *")
end

if ($TO > 10) AND ($TO <> STARDOCK)
#this accounts for the fig dropped in destination sector
add $TALLY 1
end
Echo "**" & ANSI_15 & "Figters Start/End " & ANSI_14 & $FIGS_START & ANSI_7 & "/" & ANSI_14 & $FIGS_END
Echo ANSI_7 & "+" & ANSI_14 & $TALLY & ANSI_7 " = "


if (($FIGS_END + $TALLY) = $FIGS_START)
	Echo ANSI_9 & ($FIGS_END + $TALLY)
else
	Echo ANSI_12 & ($FIGS_END + $TALLY) & " !!ATTACKED!!"
end
Echo "**"
send "'*"
waiton "Type sub-space message"
send "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"
send $SPAM
send "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*"
send "*"
waiton "Sub-space comm-link terminated"
halt

:getCourse
	killalltriggers
	setVar $sectors ""
	setTextLineTrigger sectorlinetrig :sectorsline " > "
	send "^f"&$From&"*"&$To&"*nq"
	pause
:sectorsline
	killAllTriggers
	setVar $line CURRENTLINE
	replacetext $line ">" " "
	striptext $line "("
	striptext $line ")"
	setVar $line $line&" "
	getWordPos $line $pos "So what's the point?"
	getWordPos $line $pos2 ": ENDINTERROG"
	getWordPos $line $pos3 "*** Error"

	if (($pos > 0) OR ($pos2 > 0))
		setVar $courseLength 0
		return
	end
	getWordPos $line $pos " sector "
	getWordPos $line $pos2 "TO"
	if (($pos <= 0) AND ($pos2 <= 0))
		setVar $sectors $sectors & " " & $line
	end
	getWordPos $line $pos " "&$To&" "
	getWordPos $line $pos2 "("&$To&")"
	getWordPos $line $pos3 "TO"
	if ((($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
		goto :gotSectors
	else
		setTextLineTrigger sectorlinetrig :sectorsline " > "
		setTextLineTrigger sectorlinetrig2 :sectorsline " "&$To&" "
		setTextLineTrigger sectorlinetrig3 :sectorsline " "&$To
		setTextLineTrigger sectorlinetrig4 :sectorsline "("&$To&")"
		setTextLineTrigger donePath :sectorsline "So what's the point?"
		setTextLineTrigger donePath2 :sectorsline ": ENDINTERROG"
	end
	pause

:gotSectors
	killAllTriggers
	setVar $COURSE 0
	setVar $sectors $sectors&" :::"
	setVar $courseLength 0
	setVar $index 1
	:keepGoing
	if ($sectors = " FM     :::")
		return
	end
	getWord $sectors $TEMPO $index
	while ($TEMPO <> ":::")
		if ($TEMPO <> "FM") AND ($TEMPO <> $From)
			add $courseLength 1
			setVar $COURSE[$courseLength] $TEMPO
		end
		add $index 1
		getWord $sectors $TEMPO $index
	end
	return

