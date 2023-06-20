#gosub :nearfig_inc~fig_List

:dest
if ($fileline = 0)
	setVar $fileline 1
end
setVar $movecount 0
if ($precidence = 0)
	setVar $precidence 1
end
read $sectorlistfile $dest $fileline
if ($dest <> "EOF")
	if ($precidence = 1)
		setVar $ship1dest $dest
	else
		setVar $ship2dest $dest
	end
	add $fileline 1
	read $sectorlistfile $dest $fileline
	if ($dest <> "EOF")
		if ($precidence = 1)
			setVar $ship2dest $dest
		else
			setVar $ship1dest $dest
		end
	else
		if ($precidence = 1)
			setVar $ship2dest "range"
		else
			setVar $ship1dest "range"
		end
	end
else
	echo "**Done"
	return
end

:plotcourse
setVar $movecount 0
setVar $avoids 0
setVar $coursecount 0
setVar $courselength 0
if ($precidence = 1)
	:newplot
	setVar $courselenth 0
	send "cf" $ship1sec "*" $ship1dest "*"
	gosub :coursearray
	if ($voided = 0)
		gosub :checkcoursearray
		if ($coursecheck = 1)
			gosub :clearvoids
			goto :primaryShipNext
		else
			send "cv" $avoid "*q"
			add $avoids 1
			setVar $numavoids[$avoids] $avoid
			goto :newplot
		end
	else
		setVar $precidence 2
		echo "* Cannot get to target sector, moving on"
		add $fileline 1
		read $sectorlistfile $dest $fileline
		setVar $ship1dest $dest
		gosub :clearvoids
		return
	end
else
	:newplot2
	setVar $courselenth 0
	send "cf" $ship2sec "*" $ship2dest "*"
	gosub :coursearray
	if ($voided = 0)
		gosub :checkcoursearray
		if ($coursecheck = 1)
			gosub :clearvoids
			goto :primaryShipNext
		else
			send "cv" $avoid "*q"
			add $avoids 1
			setVar $numavoids[$avoids] $avoid
			goto :newplot2
		end
	else
		echo "* Cannot get to target sector, moving on"
		add $fileline 1
		read $sectorlistfile $dest $fileline
		setVar $ship2dest $dest
		setVar $precidence 1
		gosub :clearvoids
		return
	end
end


:primaryShipNext
if ($precidence = 1)
	add $coursecount 1
	setVar $ship1next $prec[$coursecount]
	gosub :moveship1
	setVar $nearfig_inc~figlist[$ship1next] 1
	setVar $ship1sec $ship1next
	if ($ship1sec = $ship1dest)
		setVar $precidence 2
		getDistance $dist $ship1sec $ship2sec
		if ($dist >= $ship1xportrng) OR ($dist >= $ship2xportrng)
			getCourse $course $ship1sec $ship2sec
			setVar $looper 0
			:milked
			if ($looper < $course)
				add $looper 1
				getDistance $dist $course[$looper] $ship2sec
				if ($dist < $ship1xportrng)
					setVar $ship1next $course[$looper]
					gosub :moveship1
					setVar $nearfig_figlist[$ship1next] 1
					setVar $ship1sec $ship1next
				else
					goto :milked
				end
			end
		end
		add $fileline 1
		read $sectorlistfile $dest $fileline
		if ($dest <> "EOF")
			setVar $ship1dest $dest
			
		else
			if ($ship2dest = "range")
				echo "*Done"
				halt
			else
				setVar $ship1dest "range"
				
			end
		end
		return
	end
else
	add $coursecount 1
	setVar $ship2next $prec[$coursecount]
	gosub :moveship2
	setVar $nearfig_inc~figlist[$ship2next] 1
	setVar $ship2sec $ship2next
	if ($ship2sec = $ship2dest)
		setVar $precidence 1
		getDistance $dist $ship2sec $ship1sec
		if ($dist >= $ship1xportrng) OR ($dist >= $ship2xportrng)
			getCourse $course $ship2sec $ship1sec
			setVar $looper 0
			:milked2
			if ($looper < $course)
				add $looper 1
				getDistance $dist $course[$looper] $ship1sec
				if ($dist < $ship2xportrng)
					setVar $ship2next $course[$looper]
					gosub :moveship2
					setVar $nearfig_figlist[$ship2next] 1
					setVar $ship2sec $ship2next
				else
					goto :milked2
				end
			end
		end
		add $fileline 1
		read $sectorlistfile $dest $fileline
		if ($dest <> "EOF")
			setVar $ship2dest $dest
			
		else
			if ($ship1dest = "range")
				echo "*Done"
				halt
			else
				setVar $ship2dest "range"
				
			end
		end
		return
	end
end

:secondaryShipNext
setVar $looper 0
if ($precidence = 1)
	if ($ship2dest <> "range")
		getCourse $ship2course $ship2sec $ship2dest
		getDistance $distThere $ship2course[2] $ship1sec
		getDistance $distBack $ship1sec $ship2course[2]
		if ($distThere < $ship2xportrng) AND ($distBack < $ship1xportrng) AND ($ship2course[2] > 10) AND ($ship2course[2] <> STARDOCK)
			setVar $ship2next $ship2course[2]
			gosub :moveship2
			setVar $nearfig_inc~figlist[$ship2next] 1
			setVar $ship2sec $ship2course[2]
			if ($ship2sec = $ship2dest)
				add $fileline 1
				read $sectorlistfile $dest $fileline
				if ($dest <> "EOF")
					setVar $ship2dest $dest
				else
					setVar $ship2dest "range"
				end	
			end
			goto :primaryShipNext
		end
	end
	:looper
	if ($looper < SECTOR.WARPCOUNT[$ship2sec])
		add $looper 1
		if ($figList[SECTOR.WARPS[$ship2sec][$looper]] = 0) AND (SECTOR.WARPS[$ship2sec][$looper] > 10) AND (SECTOR.WARPS[$ship2sec][$looper] <> STARDOCK)
			getDistance $distThere SECTOR.WARPS[$ship2sec][$looper] $ship1sec
			getDistance $distBack $ship1sec SECTOR.WARPS[$ship2sec][$looper]
			if ($distThere < $ship2xportrng) AND ($distBack < $ship1xportrng)
				setVar $ship2next SECTOR.WARPS[$ship2sec][$looper]
				gosub :moveship2
				setVar $nearfig_inc~figlist[$ship2next] 1
				setVar $ship2sec $ship2next
				goto :primaryShipNext
			end
		end
		goto :looper
	end
	getCourse $holdingCourse $ship2sec $ship1sec
	setVar $courseLoop 1
	:courseLoop
	if ($courseLoop < $holdingCourse)
		add $courseLoop 1
		getDistance $distThere $holdingCourse[$courseLoop] $ship1sec
		getDistance $distBack $ship1sec $holdingCourse[$courseLoop]
		if ($distThere < $ship2xportrng) AND ($distBack < $ship1xportrng) AND ($holdingCourse[$courseLoop] > 10) AND ($holdingCourse[$courseLoop] <> STARDOCK)
			setVar $ship2next $holdingCourse[$courseLoop]
			gosub :moveship2
			setVar $nearfig_inc~figlist[$ship2next] 1
			setVar $ship2sec $ship2next
			goto :primaryShipNext
		end
		goto :courseLoop
	end
else
	if ($ship1dest <> "range")
		getCourse $ship1course $ship1sec $ship1dest
		getDistance $distThere $ship1course[2] $ship2sec
		getDistance $distBack $ship2sec $ship1course[2]
		if ($distThere < $ship1xportrng) AND ($distBack < $ship2xportrng) AND ($ship1course[2] > 10) AND ($ship1course[2] <> STARDOCK)
			setVar $ship1next $ship1course[2]
			gosub :moveship1
			setVar $nearfig_inc~figlist[$ship1next] 1
			setVar $ship1sec $ship1course[2]
			if ($ship1sec = $ship1dest)
				add $fileline 1
				read $sectorlistfile $dest $fileline
				if ($dest <> "EOF")
					setVar $ship1dest $dest
				else
					setVar $ship1dest "range"
				end	
			end
			goto :primaryShipNext
		end
	end
	:looper2
	if ($looper < SECTOR.WARPCOUNT[$ship1sec])
		add $looper 1
		if ($figList[SECTOR.WARPS[$ship1sec][$looper]] = 0) AND (SECTOR.WARPS[$ship1sec][$looper] > 10) AND (SECTOR.WARPS[$ship1sec][$looper] <> STARDOCK)
			getDistance $distThere SECTOR.WARPS[$ship1sec][$looper] $ship2sec
			getDistance $distBack $ship2sec SECTOR.WARPS[$ship1sec][$looper]
			if ($distThere <= $ship1xportrng) AND ($distBack <= $ship2xportrng)
				setVar $ship1next SECTOR.WARPS[$ship1sec][$looper]
				gosub :moveship1
				setVar $nearfig_inc~figlist[$ship1next] 1
				setVar $ship1sec $ship1next
				goto :primaryShipNext
			end
		end
		goto :looper2
	end
	getCourse $holdingCourse $ship1sec $ship2sec
	setVar $courseLoop 1
	:courseLoop2
	if ($courseLoop < $holdingCourse)
		add $courseLoop 1
		getDistance $distThere $holdingCourse[$courseLoop] $ship2sec
		getDistance $distBack $ship2sec $holdingCourse[$courseLoop]
		if ($distThere < $ship1xportrng) AND ($distBack < $ship2xportrng) AND ($holdingCourse[$courseLoop] > 10) AND ($holdingCourse[$courseLoop] <> STARDOCK)
			setVar $ship1next $holdingCourse[$courseLoop]
			gosub :moveship1
			setVar $nearfig_inc~figlist[$ship1next] 1
			setVar $ship1sec $ship1next
			goto :primaryShipNext
		end
		goto :courseLoop2
	end
end
goto :primaryShipNext

:moveship1
add $movecount 1
setVar $move[$moveCount] 1 & " " & $ship1next
setVar $ship1sec $ship1next
getDistance $dist $ship1sec $ship2sec
return

:moveship2
add $movecount 1
setVar $move[$moveCount] 2 & " " & $ship2next
setVar $ship2sec $ship2next
getDistance $dist $ship2sec $ship1sec
return


:coursearray
setVar $init 1
setVar $voided 0
setVar $cnterarray 0
setTextTrigger path :getPath "The shortest path"
setTextTrigger voided :voided "No route within"
pause

:getpath
killtrigger voided
setTextLineTrigger path :path2
pause
:path2
setVar $line CURRENTLINE
if ($line = "")
	send "Q"
	return
end
stripText $line ">"
stripText $line "("
stripText $line ")"
if ($init = 1)
	setVar $cnter 2
	setVar $init 0
else
	setVar $cnter 1
end
:cnter
getWord $line $sector $cnter
if ($sector <> 0)
	add $cnterarray 1
	setVar $prec[$cnterarray] $sector
	add $cnter 1
	goto :cnter
end
goto :getpath

:voided
killtrigger path
setVar $voided 1
return

:checkcoursearray
setVar $coursecheck 1
if ($precidence = 1)
	setVar $previous $ship1sec
else
	setVar $previous $ship2sec
end
setVar $chkcourseloop 0
:chkcourseloop
if ($chkcourseloop < $cnterarray)
	add $chkcourseloop 1
	if (SECTOR.BACKDOORCOUNT[$prec[$chkcourseloop]] > 0)
		getDistance $dist $prec[$chkcourseloop] $previous
		if ($dist > 1)
			echo "* This course has a oneway"
			setVar $avoid $prec[$chkcourseloop]
			setVar $coursecheck 0
			return
		end
		setVar $previous $prec[$chkcourseloop]
	end
	goto :chkcourseloop
end
return

:clearvoids
setVar $hrm 0
:hrm
if ($hrm < $avoids)
	add $hrm 1
	send "cv0*yn" $numavoids[$hrm] "*q"
	goto :hrm
end
return