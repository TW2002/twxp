# Beam File

loadVar $switchboard~bot_name
gosub :BOT~loadVars
	
setVar $BOT~help[1]  $BOT~tab&"   Beam Data to Corp Mate"
setVar $BOT~help[2]  $BOT~tab&"   "
setVar $BOT~help[3]  $BOT~tab&"   beam [file/param] [filename.txt/param] [botname] "
setVar $BOT~help[4]  $BOT~tab&"                                 {override} {delete}"
setVar $BOT~help[5]  $BOT~tab&"   File should be in mombot game directory"
setVar $BOT~help[6]  $BOT~tab&"   "
setVar $BOT~help[7]  $BOT~tab&"   {override} - copy over their existing file "
setVar $BOT~help[8]  $BOT~tab&"   {delete}   - delete their existing params "
setVar $BOT~help[9]  $BOT~tab&"   "
setVar $BOT~help[10]  $BOT~tab&"   >beam file ports.txt ham"
setVar $BOT~help[11]  $BOT~tab&"   "
setVar $BOT~help[12]  $BOT~tab&"   >beam param targets ham"

gosub :bot~helpfile



setVar $recbot ""
if ($bot~parm1 = "receive")
	setVar $filerec $bot~parm2
	setVar $fullfile $BOT~FOLDER&"/"&$bot~parm2
	if (($filerec <> "0") and ($filerec <> ""))
		setVar $testFile $filerec

		gosub :testTxtFile
		fileExists $exists $fullfile
		if (($exists) and ($bot~parm3 <> "override")) 
			setVar $SWITCHBOARD~message "File Exists " & $filerec & ", please include override.*"
			gosub :SWITCHBOARD~switchboard
			halt
		elseif ($exists)
			delete $fullfile
		end
		setVar $SWITCHBOARD~message "Ready to Receive " & $filerec & ". BEAMFILE*"
		gosub :SWITCHBOARD~switchboard

		goto :receiveFile
		halt
	end
elseif ($bot~parm1 = "setparam")
	setVar $paramname $bot~parm2
	if ($bot~parm3 = "delete")
		setVar $scrubparams 1
	end
	uppercase $paramname
	if (($paramname <> "0") and ($paramname <> ""))

		setVar $SWITCHBOARD~message "Ready to Receive " & $paramname & ". BEAMPARAM*"
		gosub :SWITCHBOARD~switchboard

		goto :receiveParam
		halt
	end
elseif ($bot~parm1 = "file")
	if ($bot~parm2 = "0")
		setVar $SWITCHBOARD~message "Please specify file to send.*"
		gosub :SWITCHBOARD~switchboard
		halt
	else
		setVar $sendfile $BOT~FOLDER&"/"&$bot~parm2
		setVar $sendName $bot~parm2
		setVar $testFile $bot~parm2
		goSub :testTxtFile
		fileExists $exists $sendfile
		if ($exists)
			if ($bot~parm3 <> "")
				goSub :checkOtherBot
			else
				setVar $SWITCHBOARD~message "Please specify the bot name receiving file.*"
				gosub :SWITCHBOARD~switchboard
				halt
			end
		else
			setVar $SWITCHBOARD~message "Can not find file: " & $sendfile & "*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
	end
	goto :doFileBeam
elseif ($bot~parm1 = "param")

	if ($bot~parm2 = "0")
		setVar $SWITCHBOARD~message "Please specify param to send.*"
		gosub :SWITCHBOARD~switchboard
		halt
	else
		setVar $paramname $bot~parm2
		uppercase $paramname
		setVar $parampairs 0
		setVar $numparams 0
	
		gosub :getparampairs
	
		if ($numparams = 0)
			setVar $SWITCHBOARD~message "You have nothing matching this parameter: " & $paramname & ".*"
			gosub :SWITCHBOARD~switchboard
			halt
		else
			setVar $SWITCHBOARD~message "Found " & $numparams &" sectors Param: " & $paramname & ".*"
			gosub :SWITCHBOARD~switchboard
		end
		if ($bot~parm3 <> "")
			goSub :checkOtherBot
		else
			setVar $SWITCHBOARD~message "Please specify the bot name receiving params.*"
			gosub :SWITCHBOARD~switchboard
			halt
		end
		
	end
	if ($bot~parm4 = "delete")
		setVar $scrubparams 1
	end
	goto :doParamBeam
end

halt

:checkOtherBot
	send "'" $bot~parm3 " qss*"
	setTextLineTrigger botfound :botfound "[General] {" & $bot~parm3 & "}"
	setDelayTrigger     timeout1 :timeout1 		8000
	pause
	:timeout1
		killalltriggers
		setVar $SWITCHBOARD~message "Receive Bot Not Found.*"
		gosub :SWITCHBOARD~switchboard
		halt
	:botfound
	killalltriggers
		setTextLineTrigger genFound :genFound "Bot Mode :General"
		setDelayTrigger     timeout2 :timeout2 		8000
		pause
		:timeout2
			killalltriggers
			setVar $SWITCHBOARD~message "Receive Bot Needs to be in General Mode.*"
			gosub :SWITCHBOARD~switchboard
			halt
		:genFound
			killalltriggers
			setVar $recbot $bot~parm3
return



:doParamBeam

	if ($scrubparams = 1)
		send "'" $recbot " beam setparam " $paramname " delete*"
	else
		send "'" $recbot " beam setparam " $paramname " *"
	end
	setTextLineTrigger beamready1 :beamready1 "BEAMPARAM"
	setDelayTrigger timeoutbeam1 :timeoutbeam1 8000
	pause
	 :timeoutbeam1
	 killalltriggers
		setVar $SWITCHBOARD~message "Failed to get beam start response.*"
		gosub :SWITCHBOARD~switchboard
		halt
	 :beamready1
		killalltriggers
		goSub :sendParams
		setVar $SWITCHBOARD~message "Param Transfer Complete.*"
		gosub :SWITCHBOARD~switchboard

	halt
return

:doFileBeam

	if ($bot~parm4 = "override")
		send "'" $recbot " beam receive " $sendName " override*"
	else
		send "'" $recbot " beam receive " $sendName " *"
	end


	setTextLineTrigger beamready :beamready "BEAMFILE"
	setDelayTrigger timeoutbeam :timeoutbeam 8000
	pause
	 :timeoutbeam
	 killalltriggers
		setVar $SWITCHBOARD~message "Failed to get beam start response.*"
		gosub :SWITCHBOARD~switchboard
		halt
	 :beamready
		killalltriggers
		goSub :sendFile
		setVar $SWITCHBOARD~message "File Transfer Complete.*"
		gosub :SWITCHBOARD~switchboard

	halt
return


:sendParams
	
	setVar $maxRow 10
	setVar $beamendNeeded 0
	setVar $rowc 1
	setVar $i 1

	while ($i <= $numparams)
		setVar $line $parampairs[$i]
		setVar $beamendNeeded 1
		if ($rowc = 1)
			send "'*[BEAMSTART]*"
		end
		if ($line <> "")
			send "[BSOL]" $line "[BEOL]*"
			add $rowc 1
		end
		
		if ($rowc = $maxRow)
			send "[BEAMEND]**"
			setVar $rowc 1
			
			setTextLineTrigger beammore2 :beammore2 "[BEAMMORE]"
			setDelayTrigger     timeout5 :timeout5 		8000
			pause
			:timeout5
				killalltriggers
				setVar $SWITCHBOARD~message "Timed out beaming? uh oh.*"
				gosub :SWITCHBOARD~switchboard
				halt
			:beammore2
				killalltriggers
			setVar $beamendNeeded 0
		end
		add $i 1
	end

	if ($beamendNeeded = 1)
		send "[BEAMEND]**"
	end
	
	send "'[BEAMOVER]*"

return

:sendFile
	
	setVar $maxRow 10
	setVar $beamendNeeded 0
	setVar $rowc 1
	setVar $i 1
	
	read $sendfile $line $i
	while ($line <> EOF)
		setVar $beamendNeeded 1
		if ($rowc = 1)
			send "'*[BEAMSTART]*"
		end
		if ($line <> "")
			send "[BSOL]" $line "[BEOL]*"
			add $rowc 1
		end
		add $i 1
		if ($rowc = $maxRow)
			send "[BEAMEND]**"
			setVar $rowc 1
			
			setTextLineTrigger beammore :beammore "[BEAMMORE]"
			setDelayTrigger     timeout3 :timeout3 		8000
			pause
			:timeout3
				killalltriggers
				setVar $SWITCHBOARD~message "Timed out beaming? uh oh.*"
				gosub :SWITCHBOARD~switchboard
				halt
			:beammore
				killalltriggers
			setVar $beamendNeeded 0
		end
		read $sendfile $line $i
	end
	if ($beamendNeeded = 1)
		send "[BEAMEND]**"
	end
	
	send "'[BEAMOVER]*"

return

:receiveParam
	setVar $paramStore 0
	setVar $parami 0

	:keepbeaming2
	setTextLineTrigger beamstart2 :beamstart2 "[BEAMSTART]"
	setTextLineTrigger beameol2 :beameol2 "[BEOL]"
	setTextLineTrigger beamend2 :beamend2 "[BEAMEND]"
	setTextLineTrigger beamover2 :beamover2 "[BEAMOVER]"
	setDelayTrigger     timeout6 :timeout6 	8000
	pause
	:beamstart2
		killalltriggers
		goto :keepbeaming2
	
	:beameol2
		killalltriggers
		getText CURRENTLINE $stuff "[BSOL]" "[BEOL]"
		add $parami 1
		setVar $paramStore[$parami] $stuff
		
		goto :keepbeaming2
	:beamend2
		killalltriggers
		send "'[BEAMMORE]*"
		goto :keepbeaming2
	:beamover2
		killalltriggers
		setVar $SWITCHBOARD~message "Processing Params...*"
		gosub :SWITCHBOARD~switchboard
		
		if ($scrubparams = 1)
			setVar $i 1
			while ($i <= SECTORS)
				setSectorParameter $i $paramname ""
				add $i 1
			end
		end
		setVar $i 1
		while ($i <= $parami)
			setVar $w $paramStore[$i]
			
			replaceText $w ":" " "
			getWord $w $sec 1
			getWord $w $p 2
	
			setSectorParameter $sec $paramname $p
			add $i 1
		end
		setVar $SWITCHBOARD~message "You've left me beaming! Thanks for the params.*"
		gosub :SWITCHBOARD~switchboard
		halt


	:timeout6
		killalltriggers
		setVar $SWITCHBOARD~message "Timed out beaming? uh oh.*"
		gosub :SWITCHBOARD~switchboard
		halt

return

:receiveFile

	:keepbeaming
	setTextLineTrigger beamstart :beamstart "[BEAMSTART]"
	setTextLineTrigger beameol :beameol "[BEOL]"
	setTextLineTrigger beamend :beamend "[BEAMEND]"
	setTextLineTrigger beamover :beamover "[BEAMOVER]"
	setDelayTrigger     timeout4 :timeout4 	8000
	pause
	:beamstart
		killalltriggers
		goto :keepbeaming
	
	:beameol
		killalltriggers
		getText CURRENTLINE $stuff "[BSOL]" "[BEOL]"
		write $fullfile $stuff & "*"
		goto :keepbeaming
	:beamend
		killalltriggers
		send "'[BEAMMORE]*"
		goto :keepbeaming
	:beamover
		killalltriggers
		setVar $SWITCHBOARD~message "You've left me beaming! Thanks for the file.*"
		gosub :SWITCHBOARD~switchboard
		halt

	:timeout4
		killalltriggers
		setVar $SWITCHBOARD~message "Timed out beaming? uh oh.*"
		gosub :SWITCHBOARD~switchboard
		halt

return

:testTxtFile
	replaceText $testFile "." " "
	getWord $testFile $testword 2
	if ($testword <> "txt")
		setVar $SWITCHBOARD~message "Please only send .txt files.*"
		gosub :SWITCHBOARD~switchboard
		halt
	end

return

:getparampairs
	setVar $i 1
	setVar $parampairs 0
	setVar $numparams 0
	while ($i <= SECTORS)
		getSectorParameter $i $paramname $p
		if ($p <> "")
			add $numparams 1
			setVar $parampairs[$numparams] $i &":" & $p
		end
		add $i 1
	end
	

return
# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
