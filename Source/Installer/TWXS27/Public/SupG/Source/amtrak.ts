gosub :nearfig_inc~fig_list
setVar $class0s[1] 1
setVar $class0s[2] STARDOCK
setVar $os 2
setVar $looper 10
setVar $totalcourse 4
:looper
if ($looper < SECTORS)
	add $looper 1
	if (PORT.CLASS[$looper] = 0)
		add $os 1
		setVar $class0s[$os] $looper
		if ($os = 4)
			goto :cont
		end
	end
	goto :looper
end
if ($os < 4)
	setVar $smokeyou 0
	waitFor "Command ["
	echo ANSI_15 "*Not enough class 0s to run script, I have : "
	:smokeyou
	if ($smokeyou < $os)
		add $smokeyou 1
		echo ANSI_15 $class0s[$smokeyou] " "
		goto :smokeyou
	end
	echo ANSI_15 "*Would you like to enter the remaining class 0s?"
	getConsoleInput $choice singlekey
	lowercase $choice
	if ($choice = "y")
		:enterc0
		getInput $sect "Enter Class 0"
		isNumber $num $sect
		if ($num)
			if ($sect > 0) AND ($sect <= SECTORS)
				add $os 1
				setVar $class0s[$os] $sect
			else
				echo "Invalid sector number.."
			end
			if ($os < 4)
				goto :enterc0
			end
		else
			echo "Invalid sector number.."
			goto :enterc0
		end
	else
		halt
	end		
end
:cont
setVar $coursesectors[1] $class0s[1]
setVar $picked[$class0s[1]] 1
setVar $coursesectors[2] $class0s[2]
setVar $picked[$class0s[2]] 1
setVar $coursesectors[3] $class0s[3]
setVar $picked[$class0s[3]] 1
setVar $coursesectors[4] $class0s[4]
setVar $picked[$class0s[4]] 1

getCourse $course $class0s[1] $class0s[2]
gosub :chkcourse
getCourse $course $class0s[2] $class0s[1]
gosub :chkcourse
getCourse $course $class0s[2] $class0s[3]
gosub :chkcourse
getCourse $course $class0s[3] $class0s[2]
gosub :chkcourse
getCourse $course $class0s[2] $class0s[4]
gosub :chkcourse
getCourse $course $class0s[4] $class0s[2]
gosub :chkcourse
getCourse $course $class0s[3] $class0s[4]
gosub :chkcourse
getCourse $course $class0s[4] $class0s[3]
gosub :chkcourse

setVar $lastloop 0
setVar $need 0
:lastloop
if ($lastloop < $totalCourse)
	add $lastloop 1
	setVar $midloop 0
	:midloop
	if ($midloop < SECTOR.WARPCOUNT[$coursesectors[$lastloop]])
		add $midloop 1
		if (SECTOR.WARPS[$coursesectors[$lastloop]][$midloop] > 10) AND ($picked[SECTOR.WARPS[$coursesectors[$lastloop]][$midloop]] = 0)
			add $need 1
			setVar $needfigs[$need] SECTOR.WARPS[$coursesectors[$lastloop]][$midloop]
			setVAr $picked[SECTOR.WARPS[$coursesectors[$lastloop]][$midloop]] 1
		end
		goto :midloop
	end
	goto :lastloop
end
setVAr $getfigs 0
setVar $chkfigs 0
echo ANSI_2 "**Sectors needing to be figged for Amtrak :*"
:chkfigs
if ($chkfigs < $need)
	add $chkfigs 1
	if ($nearfig_inc~figlist[$needfigs[$chkfigs]] <> 1)
		add $getfigs 1
		echo ANSI_15 $needfigs[$chkfigs] " "
		setVar $getem[$getfigs] $needfigs[$chkfigs]
	end
	goto :chkfigs
end
echo ANSI_2 "*Done"

halt

:chkcourse
setVar $courseloop 0
:courseloop
if ($courseloop < $course)
	add $courseloop 1
	if ($picked[$course[$courseloop]] = 0)		
		add $totalcourse 1
		setVar $coursesectors[$totalcourse] $course[$courseloop]
		setVar $picked[$course[$courseloop]] 1
	end
	goto :courseloop
end
return
		

include "supginclude\nearfig_inc"