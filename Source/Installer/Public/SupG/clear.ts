getInput $turns "Run how many turns?"
getInput $dscan "Dscan?"
setVar $sd STARDOCK
echo $sd
gosub :nearfig_inc~fig_list

send "i"
setTextLineTrigger tpw :tpw "Turns to Warp  :"
pause

:tpw
getWord CURRENTLINE $tpw 5
waitfor "Command [TL="
gosub :gameinfo_inc~quikstats
if ($gameinfo_inc~quikstats[TWARP] <> "No")
	setvAr $twarp 1
	setVar $numholds $gameinfo_inc~quikstats[HLDS]
	setVar $fuel $gameinfo_inc~quikstats[ORE]
	if ($gameinfo_inc~quikstats[ORG] > 0) OR ($gameinfo_inc~quikstats[EQU] > 0) OR ($gameinfo_inc~quikstats[COL] > 0)
		send "jy"
		setVar $fuel 0
	end
end

:go
setTextLineTrigger sector :sector "Sector  :"
send "D"
pause

:sector
getWord CURRENTLINE $cursec 3
setVar $nearfig_inc~figList[$cursec] 1
setvar $cnt 0
:cnt
if ($cnt < 10)
	add $cnt 1
	setVar $nearfig_inc~figList[$cnt] 1
	goto :cnt
end
setVar $nearfig_inc~figList[$sd] 1
setVar $send ""
waitfor "Command [TL"
:start
setVar $string 0
:chker

setVar $lp 0
:chkadj
if ($lp < SECTOR.WARPCOUNT[$cursec])
	add $lp 1
	setVar $adj SECTOR.WARPS[$cursec][$lp]
	if ($nearfig_inc~figList[$adj] = 0) AND (SECTOR.WARPCOUNT[$adj] > 1)
		add $string 1
		setVar $send $send & "m" & $adj & "*  "
		if ($adj > 10) and (PORT.CLASS[$adj] <> 9)
			if (PORT.BUYFUEL[$adj] = 0) AND ($fuel <> $numholds) AND ($twarp = 1) AND (PORT.CLASS[$adj] > 0)
				setVar $send $send & "za9999**  ft1*zcd*  p  t  ***  "
				add $heh 1
				setVAr $fuel $numholds
			else
				setVar $send $send & "za9999**  ft1*zcd*  "
			end
			if ($dscan = 1)
				setVar $send $send & "sd"
			end
		end
		setVar $nearfig_inc~figList[$adj] 1
		setVAr $cursec $adj
		goto :nxt
	end
	goto :chkadj
end
setVar $nearfig_inc~origsec $cursec
setVar $nearfig_inc~command "nofig"
gosub :nearfig_inc~closefig

if ($nearfig_inc~result > 0)
	setVar $cf $nearfig_inc~result
	getDistance $cfdist $cursec $cf
	if ($cfdist > 2) AND ($twarp = 1)
		setVar $nearfig_inc~origsec $cf
		setVar $nearfig_inc~command 0
		gosub :nearfig_inc~closefig
		setVAr $twarpto $nearfig_inc~result
		getdistance $distcf $cursec $twarpto
		setVar $fuelNeeded ($distcf * 3)
		if ($fuel < $fuelNeeded) OR ($twarpto < 11) OR ($twarpto = STARDOCK)
			goto :runCourse
		else
			setVAr $send $send & "m" & $twarpto & "*yy  *  *  "
			subtract $fuel $fuelNeeded
			add $string 1
			setVar $cursec $twarpto
			goto :chker
		end
	end
	:runCourse	
	getCourse $cflane $cursec $cf
	setVar $cfcourse 1
	:course
	if ($cfcourse < $cflane)
		add $cfcourse 1
		setVar $send $send & "m" & $cflane[$cfcourse] & "*  " 
		if ($cflane[$cfcourse] > 10) and (PORT.CLASS[$cflane[$cfcourse]] <> 9)
			if (PORT.BUYFUEL[$cflane[$cfcourse]] = 0) AND ($fuel <> $numholds) AND ($twarp = 1) AND (PORT.CLASS[$cflane[$cfcourse]] > 0)
				echo ANSI_12 "CFCOURSE"
				setVar $send $send & "za9999**  ft1*zcd*  p  t  ***  "
				add $heh 1
				setVAr $fuel $numholds
			else
				setVar $send $send & "za9999**  ft1*zcd*  "
			end
			if ($dscan = 1)
				setVar $send $send & "sd"
			end
		end		
		setVar $nearfig_inc~figList[$cflane[$cfcourse]] 1
		add $string 1
		goto :course
	else
		add $string 1
		setVar $send $send & "m" & $cf & "*  " 
		if ($cf > 10) and (PORT.CLASS[$cf] <> 9)
			if (PORT.BUYFUEL[$cf] = 0) AND ($fuel <> $numholds) AND ($twarp = 1) AND (PORT.CLASS[$cf] > 0)
				echo ANSI_12 "CF"
				setVar $send $send & "za9999**  ft1*zcd*  p  t  ***  "
				add $heh 1
				setVar $fuel $numholds
			else
				setVar $send $send & "za9999**  ft1*zcd*  "
			end
			if ($dscan = 1)
				setVar $send $send & "sd"
			end
		end
		setVar $nearfig_inc~figList[$cf] 1
		setVar $cursec $cf
	end
else
	send $send
	waitfor "[" & $cursec & "]"
	ClientMessage "Known universe is completely figged, If it is not you may need to ZTM more."
	halt
end

:nxt
 if ($string >= 10)
	send $send	
	multiply $string $tpw
	add $heh $string
	if ($heh >= $turns)
		clientmessage "done"
		halt
	end
	waitfor "[" & $cursec & "]" 
	goto :go
else
	goto :chker
end

halt
include "supginclude\gameinfo_inc"
include "supginclude\nearfig_inc"
