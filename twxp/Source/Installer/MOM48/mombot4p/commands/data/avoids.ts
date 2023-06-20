	gosub :BOT~loadVars


	 setVar $BOT~help[1] $BOT~tab&"Set, clear, or display avoids"
	 setVar $BOT~help[2] $BOT~tab&"Using the avoids command without a parameter will display"
	 setVar $BOT~help[3] $BOT~tab&"current avoids over subspace. "
	 setVar $BOT~help[4] $BOT~tab&"       "
	 setVar $BOT~help[5] $BOT~tab&"Options:"
	 setVar $BOT~help[6] $BOT~tab&"        {set} -  Will set an avoid "
	 setVar $BOT~help[7] $BOT~tab&"                                        "
	 setVar $BOT~help[8] $BOT~tab&"      {clear} -  Will clear an avoid if a sector number"
	 setVar $BOT~help[9] $BOT~tab&"                 is provided, otherwise 'clear' by itself"
	setVar $BOT~help[10] $BOT~tab&"                 will clear all avoids."
	setVar $BOT~help[11] $BOT~tab&"       "
	setVar $BOT~help[12] $BOT~tab&"Usage: "
	setVar $BOT~help[13] $BOT~tab&"       >avoids set 45"
	setVar $BOT~help[14] $BOT~tab&"       >avoids clear 45"
	setVar $BOT~help[15] $BOT~tab&"       >avoids clear"
	gosub :bot~helpfile


	setVar $AVOIDS		" "
	setVar $Temp		""
	setVar $Void_CNT	0
	gosub :PLAYER~quikstats

	if ($PLAYER~CURRENT_PROMPT = "Command") OR ($PLAYER~CURRENT_PROMPT = "Citadel")
		if ($bot~parm1 = "clear")
			isNumber $tst $bot~parm2
			if (($tst) or ($bot~parm2 = ""))
				if ($bot~parm2 = "")
					send "cv0*yyq"
					clearAllAvoids
					setVar $SWITCHBOARD~message "All Avoids Cleared*"
					gosub :SWITCHBOARD~switchboard
					halt
				else
					clearAvoid $bot~parm2
					send "cv0*yn" & $bot~parm2 & "*q"
					setTextLineTrigger	Cleared		:Cleared	"has been cleared and will be used in future plots."
					setTextLineTrigger	NoClear		:NoClear	"Invalid sector number"
					pause
					:NoClear
					killAllTriggers
					setVar $SWITCHBOARD~message "Invalid sector number*"
					gosub :SWITCHBOARD~switchboard
					halt
					:Cleared
					killAllTriggers
					getWord CURRENTLINE $bot~parm2 1
					isNumber $tst $bot~parm2
					if ($tst = 0)
						setVar $bot~parm2 0
					end
					setVar $SWITCHBOARD~message $bot~parm2&" has been cleared and will be used in future plots.*"
					gosub :SWITCHBOARD~switchboard
					halt
				end
			else
				setVar $SWITCHBOARD~message "Syntax Error*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
		elseif ($bot~parm1 = "set")
			isnumber $tst $bot~parm2
			if ($tst)
            	if ($bot~parm2 > 0) and ($bot~parm2 <= sectors)
            		send "cv"&$bot~parm2&"*q"
					setTextLineTrigger		Setted		:Setted		"will now be avoided in future navigation calculations."
					setTextTrigger			NotSet		:NotSet		"Do you wish to clear some avoids?"
					pause
					:NotSet
					killAllTriggers
					send "nq"
					setVar $SWITCHBOARD~message $bot~parm2&" Is Not a Valid Sector Number*"
					gosub :SWITCHBOARD~switchboard
					halt
					:Setted
					killAllTriggers
					getWord CURRENTLINE	$bot~parm2 2
					isNumber $tst $bot~parm2
					if ($tst = 0)
						setVar $bot~parm2 0
					end
					setVar $SWITCHBOARD~message $bot~parm2&" will now be avoided in future navigation calculations.*"
					gosub :SWITCHBOARD~switchboard
					halt
				end
			else
				setVar $SWITCHBOARD~message "Syntax error*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
		end
		send "cxq"
	else
		setVar $SWITCHBOARD~message "Must be started from the Command or Citadel Prompt*"
		gosub :SWITCHBOARD~switchboard
		halt
	end
	waitfor "<List Avoided Sectors>"
	setTextLineTrigger		NoAvoid	:NoAvoid	"No Sectors are currently being avoided."
	setTextLineTrigger		Done	:Done		"Computer command"
	setTextLineTrigger		Line	:Line
	pause
	:Line
    	if ((CURRENTLINE <> "") AND (CURRENTLINE <> "0"))
			setVar $Temp (" " & CURRENTLINE & " +++ ")
			While ($Temp <> "+++")
				getWord $Temp $Avoided 1
				isNumber $tst $Avoided
				if ($tst <> 0)
					setVar $AVOIDS ($AVOIDS & $Avoided & " ")
					replacetext $Temp (" " & $Avoided & " ") ""
					add $Void_CNT 1
				else
					setVar $Temp "+++"
				end
			end
		end
		setTextLineTrigger		Line	:Line
		pause
	:NoAvoid
		killAlltriggers
		setVar $SWITCHBOARD~message "No Sectors are currently being avoided.*"
		gosub :SWITCHBOARD~switchboard
		halt
	:Done
		killAllTriggers
		if ($SWITCHBOARD~self_command = FALSE)
			setVar $SWITCHBOARD~self_command 2
		end

		setVar $SWITCHBOARD~message $Void_CNT & " Avoids Found:*  *"&$AVOIDS & "*"
		gosub :SWITCHBOARD~switchboard
		halt


include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
