#=-=-=-=-=-=-=-=-=----=-=-=-=-=-=-=
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
###################################################
#################################
:update_cim
send "^r"
:cim_trig
setTextLineTrigger next :next
pause

:next
setVar $info CURRENTLINE
getWord $info $end_test 1
if ($end_test = "0")
	goto :done
end
goto :cim_trig

:done
send "Q"
return


#=-=-=-= Change CN Settings =-=-=-=-
:cn
setTextLineTrigger cn1 :cn1 "(1) ANSI graphics"
setTextLineTrigger cn2 :cn2 "(2) Animation display"
setTextLineTrigger cn3 :cn3 "(3) Page on messages"
setTextLineTrigger cn4 :cn4 "(4) Sub-space radio channel"
setTextLineTrigger cn5 :cn5 "(5) Federation comm-link"
setTextLineTrigger cn6 :cn6 "(6) Receive private hails"
setTextLineTrigger cn7 :cn7 "(7) Silence ALL messages"
setTextLineTrigger cn9 :cn9 "(9) Abort display on keys"
setTextLineTrigger cna :cna "(A) Message Display Mode"
setTextLineTrigger cnb :cnb "(B) Screen Pauses"
setTextLineTrigger cnc :cnc "(C) Online Auto Flee"
send "cn"
pause

:cn1
getWord CURRENTLINE $set1 5
pause
:cn2
getWord CURRENTLINE $set2 5
pause
:cn3
getWord CURRENTLINE $set3 6 
pause
:cn4
getWord CURRENTLINE $set4 6
pause
:cn5
getWord CURRENTLINE $set5 5
pause
:cn6
getWord CURRENTLINE $set6 6
pause
:cn7
getWord CURRENTLINE $set7 6
pause
:cn9
getWord CURRENTLINE $set9 7
pause
:cna
getWord CURRENTLINE $seta 6
pause
:cnb
getWord CURRENTLINE $setb 5
pause
:cnc
getWord CURRENTLINE $setc 6



if ($cn1 <> 0)
	if ($set1 <> $cn1)
		setVar $cn1change 1
		send "1"
	end
end
if ($cn2 <> 0)
	if ($set2 <> $cn2)
		setVar $cn2change 1
		send "2"
	end
end
if ($cn3 <> 0)
	if ($set3 <> $cn3)
		setVar $cn3change 1
		send "3"
	end
end
if ($cn4 <> 0)
	if ($set4 <> $cn4)
		setVar $cn4change 1
		send "4" $cn4 "*"
	end
end
if ($cn5 <> 0)
	if ($set5 <> $cn5)
		setVar $cn5change 1
		send "5"
	end
end
if ($cn6 <> 0)
	if ($set6 <> $cn6)
		setVar $cn6change 1
		send "6"
	end
end
if ($cn7 <> 0)
	if ($set7 <> $cn7)
		setVar $cn7change 1
		send "7"
	end
end
if ($cn9 <> 0)
	setVar $cn9change 0
	if ($set9 <> $cn9)
		setVar $cn9change 1
		send "9"
	end
end
if ($cna <> 0)
	if ($seta <> $cna)
		setVar $cnachange 1
		send "a"
	end
end
if ($cnb <> 0)
	if ($setb <> $cnb)
		setVar $cnbchange 1
		send "b"
	end
end
if ($cnc <> 0)
	if ($setc <> $cnc)
		setVar $cncchange 1
		send "c"
	end
end
send "qq"
return

#/\/\ Variable Definitions /\/\
#$set*		- Current setting of the CN*
#$cn*		- Requested setting for CN*
#$cn*change	- Boolean value for change
#		1 - Value was changed from its original value
#		0 - Value was not changed, already at requested value. 
#/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
	
