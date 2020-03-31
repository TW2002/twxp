	gosub :BOT~loadVars
		
	setVar $BOT~help[1] $BOT~tab&"Shows course path to sectors"
	setVar $BOT~help[2] $BOT~tab&"   course {start sector} {end sector}"
	setVar $BOT~help[3] $BOT~tab&"   course {end sector}"
	gosub :bot~helpfile

# =============================== START COURSE DISPLAY ===============================
:course
	killalltriggers
	clearAllAvoids
	gosub :PLAYER~quikstats
	isNumber $test $bot~parm1
	if (($bot~parm1 = "") OR ($test = FALSE))
		setVar $SWITCHBOARD~message "Sectors entered not valid.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	isNumber $test $bot~parm2
	if (($test = FALSE) OR ($bot~parm2 = ""))
		setVar $destination $bot~parm1
		setVar $start $PLAYER~CURRENT_SECTOR
	else
		if ($bot~parm2 > 0)
			setVar $start $bot~parm1
			setVar $destination $bot~parm2
		else
			setVar $SWITCHBOARD~message "Sectors entered not valid.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	end
	send "^f"&$start&"*"&$destination&"*q "
	waitOn ": ENDINTERROG"
	getCourse $course $start $destination   
	setVar $i 1
	setVar $directions ""
	while ($i <= $course)
		getSectorParameter $course[$i] "FIGSEC" $isFigged
		if ($isFigged = "")
			setvar $isFigged false
		end
		if ($isFigged)
			setVar $directions $directions&"["&$course[$i]&"]"
		else
			setVar $directions $directions&$course[$i]  
		end
		setVar $directions $directions&" > "
		add $i 1
	end
	getSectorParameter $course[$i] "FIGSEC" $isFigged
	if ($isFigged = "")
		setvar $isFigged false
	end
	if ($isFigged)
		setVar $directions $directions&"["&$destination&"]"
	else
		setVar $directions $directions&$destination  
	end
	setVar $SWITCHBOARD~message "Path from "&$start&" to "&$destination&": "&$directions&"*"
	gosub :SWITCHBOARD~switchboard
	halt
#================================== END COURSE DISPLAY ==============================





# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
