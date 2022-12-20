    #=--------                                                                       -------=#
     #=--------------------------      LoneStar's CIM Hunter      -------------------------=#
    #=--------                                                                       -------=#
	#		Incep Date	:	May 20, 2007 - Version 2.0
	#		Author		:	LoneStar
	#		TWX			:	Should Work with TWX 2.04b, or 2.04 Final
	#		Credits		:	Mind Daggers modified version of Singularity's quikstats
	#                       XIDE For the inspiration found in their 2_sentinel.ts script
	#
	#		To Run		:	You will Need the following addressed
	#                                    - Start While Connected
	#                                    - BOT of some sort to perform reconnect
	#
	#		Fixes		:	Removed Lingering Debugging Code
	#						Tweaked Reading FIGSEC; and problem with updates to the _DIM array
	#
	#		Description	:	Perform Repeated CIM (Computer Interrogation Mode), Port Reports
	#                       compares results looking for blocked/opened ports, port value changes
	#                       and reports via SubSpace. Also maintains a Log-file.
	#
	#                       Upon inital run, or a 'reset' a master file is created and loaded at
	#                       whenever the script restarts. Script will handle a Disconnect during a
	#                       CIM update and continue normally
	#
	#                       See the :cim_help routine for a list of basic commands
	#
	:MASTER_RESET_Jmp_Point
	setVar		$Current_Version		"2.0"
	setVar		$TagLine				"[LSCIM HUNTv"&$Current_Version&"]"
	setVar		$TagLineB				"[LSCIM HUNT]"

	setArray	$_CIM SECTORS 3
	setArray	$_DIM SECTORS 3

	setVar		$_CIMcnt				0
	setVar		$UpDateInSeconds		120
	setVar		$FName					"LS_CIMeIN_" & GAMENAME & ".txt"
	setVar		$LName					"LS_CIMeIN_" & GAMENAME & ".log"
	setVar		$MAX_RESULTS			100

    getTime $LOG_STAMP "h:nna/p - d/m/yyy"
    write $LName (" --- SESSION STARTED --- " & $LOG_STAMP)

	setVar $idx 11
	while ($idx <= SECTORS)
		getSectorParameter $idx "FIGSEC" $flag
		isNumber $tst $flag
		if ($tst = 0)
			setVar $flag 0
			setSectorParameter $idx "FIGSEC" FALSE
		end
		setVar $_CIM[$idx] $flag
		add $idx 1
	end

	getLength $TagLine $tst
	setVar $Buf ""
	setVar $i 1
	while ($i <= $tst)
		setVar $Buf ($Buf & " ")
		add $i 1
	end

	fileExists $tst $FName

	if ($tst = 0)
		send ("'"&$TagLine&" DownLoading Port Records To Master File...*^rq")
		setTextLineTrigger	ALLDone		:ALLDone	": ENDINTERROG"
		setTextLineTrigger		Data	:Data		"%"
		pause
		:Data
			setVar $Port	CURRENTLINE
			stripText	$Port	"-"
			stripText	$Port	"%"
			getWord $Port	$Sect	1
			getWord $Port	$Fuel	2
			getWord $Port	$Org	4
			getWord $Port	$Equ	6

			SetVar $_CIM[$Sect][1] $Fuel
			SetVar $_CIM[$Sect][2] $Org
			SetVar $_CIM[$Sect][3] $Equ
			add $_CIMcnt 1
			setTextLineTrigger		Data	:Data		"%"
			pause

		:ALLDone
			killTrigger ALLDone
			killTrigger Data

			Echo "**" & ANSI_14 & $TagLine & ANSI_15 & " - Writing Data To File...**"
			getTime $STAMP "h:nna/p - d/m/yyy"
			write $FName $STAMP
			setVar $i 1
			while ($i <= SECTORS)
				if (($_CIM[$i][1] <> 0) AND ($_CIM[$i][2] <> 0) AND ($_CIM[$i][3] <> 0))
					setVar $Line ($i & " " & $_CIM[$i][1] & " " & $_CIM[$i][2] & " " & $_CIM[$i][3])
		        	write $FName $Line
		        end
	        	add $i 1
			end
			setVar $CashAmount $_CIMcnt
        	GoSub :CommaSize
			send ("'" & $TagLine & " Master File Created : " & $CashAmount & " Entries*")
	else
		send ("'"&$TagLine&" Loading Port Records From Master File...*")
		waitfor "Message sent on sub-space channel"

		setVar $i 1
		setVar $_CIMcnt 0

		ReadToArray $FName $Temp

		setVar $STAMP $Temp[$i]

		add $i 1

		while ($i <= $Temp)
			getWord $Temp[$i]	$Sect	1
			isNumber $tst $Sect
			if ($tst = 0)
				setVar $Sect 0
			end
			getWord $Temp[$i]	$Fuel	2
			isNumber $tst $Fuel
			if ($tst = 0)
				setVar $Fuel 0
			end
			getWord $Temp[$i]	$Org	3
			isNumber $tst $Org
			if ($tst = 0)
				setVar $Org 0
			end
			getWord $Temp[$i]	$Equ	4
			isNumber $tst $Equ
			if ($tst = 0)
				setVar $Equ 0
			end

			if (($Sect <> 0) AND ($Fuel <> 0) AND ($Org <> 0) AND ($Equ <> 0))
				SetVar $_CIM[$Sect][1] $Fuel
				SetVar $_CIM[$Sect][2] $Org
				SetVar $_CIM[$Sect][3] $Equ
               	add $_CIMcnt 1
			end
			add $i 1
   		end

		setVar $CashAmount $_CIMcnt
       	GoSub :CommaSize
		send ("'" & $TagLine & " Master File Loaded : " & $CashAmount & " Entries*")
	end
	send ("'" & $Buf & " Data Last Updated  : " & $STAMP & "*")
	send ("'" & $Buf & " Update Interval    : " & $UpDateInSeconds & ", seconds*")
	send ("'" & $Buf & " Maximum Results    : " & $MAX_RESULTS & "*")
	send ("'" & $Buf & " List Of Commands   : cim_help*/")
	waitfor "Message sent on sub-space channel"
	waitfor #179

   	setArray $Results 	$MAX_RESULTS

	:Loop_De_Lou
	killAllTriggers
	send #27
	SetEventTrigger 	Discod1 	:Discod     	"CONNECTION LOST"
	SetEventTrigger		Discod2		:Discod     	"Connections have been temporarily disabled."
	setTextLineTrigger	inac		:Loop_De_Lou	"Session termination is imminent."

	setDelayTrigger		UpdateDelay		:UpdateDelay	($UpDateInSeconds * 1000)
	setTextLineTrigger	cim_delay		:cim_delay		"cim_delay="
	setTextLineTrigger	cim_commit		:cim_commit		"cim_commit"
	setTextLineTrigger	cim_nfigs		:cim_nfigs		"cim_nfigs"
	setTextLineTrigger	cim_rdis		:cim_rdis		"cim_rdis"
	setTextLineTrigger	cim_update		:cim_update		"cim_update"
	setTextLineTrigger	cim_reset		:cim_reset		"cim_reset"
	setTextLineTrigger	cim_pause		:cim_pause		"cim_pause"
	setTextLineTrigger	cim_help		:cim_help		"cim_help"

	pause
	:cim_help
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
			send "'*" & $TagLine & "  CIM Hunter Scans Port Listing for*"
			send "                Enemy Port/Passive-Grid activity.*"
			send "    *"
			send "    cim_update  - Bypass Interval-Timer and force an update*"
			send "    cim_rdis    - Redisplay most recent Results*"
			send "    cim_commit  - Write Most Recent Data To Master-File*"
			send "    cim_delay   - Adjust Delay-Interval Timer (Range: 3 to*"
			send "                  300, Seconds)*"
			send "    cim_reset   - Delete Master File and restart as if first time*"
			send "    cim_pause   - Pauses Script until 'cim_go' command is given*"
			send "    *"
			send "    CIM Data Logged To: " & $LName & "*"
			send "    **"
			waitfor "Sub-space comm-link terminated"
		end
	:cim_pause
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
	    	:Remind_Jmp_Point
			send ("'" & $TagLineB & " Paused. Use 'cim_go' Command to Restart Scan.*/")
			waitfor "Message sent on sub-space channel"
			waitfor #179
			setTextLineTrigger	cim_go	:cim_go	"cim_go"
			setDelayTrigger		remind	:remind 180000
			pause
			:remind
				killTrigger cim_go
				killTrigger remind
				goto :Remind_Jmp_Point
			:cim_go
				killTrigger cim_go
				killTrigger remind
				send ("'" & $TagLineB & " Restarted.*")
		end
		goto :Loop_De_Lou
	:cim_reset
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
	    	send ("'" & $TagLineB & " Reset Initiated...*")
	    	waitfor ($TagLineB & " Reset Initiated...")
	    	echo ("**"&ANSI_14&$TagLineB&ANSI_15&" - Deleting Files, and Resetting Arrays...**")
			DELETE $FName
			setDelayTrigger		Reset_Delay :Reset_Delay 2000
			pause
			:Reset_Delay
				killTrigger Reset_Delay
				goto :MASTER_RESET_Jmp_Point
		end
		goto :Loop_De_Lou
	:cim_update
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
			goto :UpdateDelay
		end
		goto :Loop_De_Lou
	:cim_rdis
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
			setVar $idx 1
			if ($Results[$idx] <> 0)
				send ("'*" & $TagLineB & "----------------------------------[REDiSPLAY]")
				while ($Results[$idx] <> 0)
                	send ("*" & $Results[$idx])
   	            	add $idx 1
				end
           	    send ("*" & $TagLineB & "------------------------------------[" & ($idx - 1) & " Lines]")
               	send "**"
			else
            	send ("'" & $TagLine & " - No Change.*")
			end
		end
		goto :Loop_De_Lou
	:cim_commit
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if (($chk = "'") OR ($pos = 4))
			DELETE $FName
			Echo "**" & ANSI_14 & $TagLine & ANSI_15 & " - Writing Data To File...**"
			getTime $STAMP "h:nna/p - d/m/yyy"
			write $FName $STAMP

			setVar $i 1
			while ($i <= SECTORS)
				if (($_CIM[$i][1] <> 0) AND ($_CIM[$i][2] <> 0) AND ($_CIM[$i][3] <> 0))
					setVar $Line ($i & " " & $_CIM[$i][1] & " " & $_CIM[$i][2] & " " & $_CIM[$i][3])
		        	write $FName $Line
		        end
	        	add $i 1
			end
			fileExists $tst $FName

			if ($tst = 0)
				send ("'" & $TagLineB & " Error Occured During File Write - Halting!*")
				halt
			end
			send ("'" & $TagLineB & " Master List Has Been Updated*")
		end
		goto :Loop_De_Lou
	:cim_delay
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help
	    setVar $temp CURRENTLINE
	    setVar $tempp CURRENTANSILINE
	    cutText $temp $chk 1 1
		getWordPos $tempp $pos "[36mR"
	    if ($chk = "'")
		    stripText $temp "'cim_delay="
		    stripText $temp " "
		    isNumber $tst $temp
		    if ($tst = 1)
				if ($temp < 3)
					setVar $temp 3
				end
				if ($temp > 300)
					setVar $temp 300
				end
			    setVar $UpDateInSeconds $temp
		    	send ("'" & $TagLineB & " Update Interval Now: " & $UpDateInSeconds & ", seconds*")
		    else
		    	send ("'" & $TagLineB & " Update Interval    : Syntax Error*")
		    end
		elseif ($pos = 4)
			setVar $temp ($temp & "@@^^%%")
			getText $temp $temp "cim_delay=" "@@^^%%"
			stripText $temp " "
		    isNumber $tst $temp
		    if ($tst = 1)
				if ($temp < 3)
					setVar $temp 3
				end
				if ($temp > 300)
					setVar $temp 300
				end
			    setVar $UpDateInSeconds $temp
			    send ("'" & $TagLineB & " Update Interval Now: " & $UpDateInSeconds & ", seconds*")
		    else
		    	send ("'" & $TagLineB & " Update Interval    : Syntax Error*")
			end
		end
		goto :Loop_De_Lou


    :UpdateDelay
		killTrigger UpdateDelay
		killTrigger cim_delay
		killTrigger cim_commit
		killTrigger cim_nfigs
		killTrigger cim_rdis
		killTrigger cim_update
		killTrigger cim_reset
		killTrigger cim_pause
		killTrigger cim_help

    	setVar $Result_ptr	0
		setVar $Lines		0
		setArray	$_DIM SECTORS 3
    	send ("'" & $TagLineB & " Processing...*")
		send "^RQ"
		setTextLineTrigger	UpdateDone		:UpdateDone		": ENDINTERROG"
		setTextLineTrigger	NewData			:NewData		"%"
		pause

		:NewData
			setVar $Line CURRENTLINE
			stripText $Line "-"
			stripText $Line "%"
			getWord $Line	$Sect	1
			getWord $Line	$Fuel	2
			getWord $Line	$Org	4
			getWord $Line	$Equ	6

			setVar $_DIM[$Sect][1]	$Fuel
			setVar $_DIM[$Sect][2]	$Org
			setVar $_DIM[$Sect][3]	$Equ
			add $Lines 1
			setTextLineTrigger	NewData			:NewData		"%"
			pause

		:UpdateDone
			killTrigger UpDateDone
			killTrigger NewData
			setVar $idx		1

			delete "C:\123.txt"

			while (($idx <= SECTORS) AND ($Result_ptr < $MAX_RESULTS))
		 			#setVar $S "$_DIM["&$idx&"][1] " &  $_DIM[$idx][1] & " " & $_DIM[$idx][2] & " " & $_DIM[$idx][3]
					#setVar $T "$_CIM["&$idx&"][1] " &  $_DIM[$idx][1] & " " & $_DIM[$idx][2] & " " & $_DIM[$idx][3]
					#write "C:\123.txt" $S & #9 & $T

					if (($_DIM[$idx][1] = 0) AND ($_CIM[$idx][1] <> 0))
						#Someone Covered A Port
						add $Result_ptr	1
						gosub :BUILD_SSS_Str
						setVar $Sector $idx
						gosub :PadSector
						setVar $str ($Port_Type & " " & $Sector & "  BLOCKED")
						if ($idx = STARDOCK)
							setVar $str ($str & " (STARDOCK Possibly Blown-up)")
						elseif ($idx = RYLOS)
							setVar $str ($str & " (RYLOS Possibly Blown-up)")
						elseif ($idx = ALPHACENTAURI)
							setVar $str ($str & " (ALPHA Possibly Blown-up)")
						end

						setVar $_CIM[$idx] 0
						setVar $_TA $idx
						gosub :Nearest_FIG
						setVar $str ($str & $Nearest_FIG_Result)

				    	setVar $Results[$Result_ptr] $str
						write $LName $str

				    	setVar $_CIM[$idx][1] 0
				    	setVar $_CIM[$idx][2] 0
				    	setVar $_CIM[$idx][3] 0
					elseif (($_DIM[$idx][1] <> 0) AND ($_CIM[$idx][1] = 0))
						#Someone Pickedup A Fig
						add $Result_ptr	1
						gosub :BUILD_SSS_Str
						setVar $Sector $idx
						gosub :PadSector

						setVar $str ($Port_Type & " " & $Sector & "  UnCovered")
						if ($idx = STARDOCK)
							setVar $str ($str & " (STARDOCK Regenerated)")
						elseif ($idx = RYLOS)
							setVar $str ($str & " (RYLOS Regenerated)")
						elseif ($idx = ALPHACENTAURI)
							setVar $str ($str & " (ALPHA Regenerated)")
						end

						setVar $_CIM[$idx] 0
						setVar $_TA $idx
						gosub :Nearest_FIG
						setVar $str ($str & $Nearest_FIG_Result)

				    	setVar $Results[$Result_ptr] $str

						write $LName $str

				    	setVar $_CIM[$idx][1] $_DIM[$idx][1]
				    	setVar $_CIM[$idx][2] $_DIM[$idx][2]
				    	setVar $_CIM[$idx][3] $_DIM[$idx][3]
					elseif (($_DIM[$idx][1] <> 0) AND ($_CIM[$idx][1] <> 0))
						#NoChange, but, did someone Trade at port?
						setVar $Bought ""

						if ($_DIM[$idx][1] < $_CIM[$idx][1])
							setVar $tst ($_CIM[$idx][1] - $_DIM[$idx][1])
							setVar $Bought ($tst & " ORE")
						elseif ($_DIM[$idx][1] > $_CIM[$idx][1])
							setVar $tst ($_CIM[$idx][1] - $_DIM[$idx][1])
							if ($tst > 500)
								setVar $Bought ("ORE Up'd " &$tst)
							end
						end

						if ($_DIM[$idx][2] < $_CIM[$idx][2])
							setVar $tst ($_CIM[$idx][2] - $_DIM[$idx][2])
							if ($Bought<> "")
								setVar $Bought ($Bought & ", " & $tst & " ORG")
							else
								setVar $Bought ($tst & " ORG")
							end
						end

						if ($_DIM[$idx][3] < $_CIM[$idx][3])
							setVar $tst ($_CIM[$idx][3] - $_DIM[$idx][3])
							if ($Bought<> "")
								setVar $Bought ($Bought & ", " & $tst & " EQU")
							else
								setVar $Bought ($tst & " EQU")
							end
						end

						if ($Bought <> "")
							add $Result_ptr	1
							gosub :BUILD_SSS_Str
							setVar $Sector $idx
							gosub :PadSector
							setVar $str ($Port_Type & " " & $Sector & "  " & $Bought & " ")
							if ($idx = STARDOCK)
								setVar $str ($str & " (STARDOCK)")
							elseif ($idx = RYLOS)
								setVar $str ($str & " (RYLOS)")
							elseif ($idx = ALPHACENTAURI)
								setVar $str ($str & " (ALPHA)")
							end

							if ($_CIM[$idx] <> 0)
								setVar $str ($str & " (Fig'd)")
							else
								setVar $_TA $idx
								gosub :Nearest_FIG
								setVar $str ($str & $Nearest_FIG_Result)
							end
					    	setVar $Results[$Result_ptr] $str

                            write $LName $str

					    	setVar $_CIM[$idx][1] $_DIM[$idx][1]
					    	setVar $_CIM[$idx][2] $_DIM[$idx][2]
					    	setVar $_CIM[$idx][3] $_DIM[$idx][3]
						end
					end
				add $idx 1
			end

			if ($Result_ptr <> 0)
				setVar $idx 1
				send ("'*" & $TagLineB & "------------------------------------------")
				while ($idx <= $Result_ptr)
                	send ("*" & $Results[$idx])
                	add $idx 1
                end
                send ("*-------------------------[" & ($idx - 1) & " LinesListed][" & $Lines & " Scanned]")
                send "**"

                #Erase Remainder of Array
                while ($idx <= $MAX_RESULTS)
                	setVar $Results[$idx] 0
                	add $idx 1
                end
            else
            	send ("'" & $TagLine & " - No Changes Detected.*")
			end

	goto :Loop_De_Lou

:BUILD_SSS_Str
	setVar $Port_Type ""
	if (PORT.BUYFUEL[$idx])
		setVar $Port_Type ($Port_Type & "(B")
	else
		setVar $Port_Type ($Port_Type & "(S")
	end

	if (PORT.BUYORG[$idx])
		setVar $Port_Type ($Port_Type & "B")
	else
		setVar $Port_Type ($Port_Type & "S")
	end

	if (PORT.BUYEQUIP[$idx])
		setVar $Port_Type ($Port_Type & "B)")
	else
		setvar $Port_Type ($Port_Type & "S)")
	end
	return

:CommaSize
	if ($CashAmount < 1000)
		#do nothing
	elseif ($CashAmount < 1000000)
    	getLength $CashAmount $len
		setVar $len ($len - 3)
		cutText $CashAmount $tmp 1 $len
		cutText $CashAMount $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $CashAmount $tmp
	elseif ($CashAmount <= 999999999)
		getLength $CashAmount $len
		setVar $len ($len - 6)
		cutText $CashAmount $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $CashAmount $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $CashAmount $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $CashAmount $tmp
	end
	return
:PadSector
	if ($Sector < 10)
		setVar $Sector ("    "&$Sector)
	elseif ($Sector < 100)
		setVar $Sector ("   "&$Sector)
	elseif ($Sector < 1000)
		setVar $Sector ("  "&$Sector)
	elseif ($Sector < 10000)
		setVar $Sector (" "&$Sector)
	end
	return

:Nearest_FIG
	setVar $Nearest_FIG_Result " (No Fig Data)"
	getNearestWarps $Lst_Of_Sectors $_TA
	setVar $Nearest_FIG_i 1
	while ($Nearest_FIG_i <= $Lst_Of_Sectors)
		setVar $focus $Lst_Of_Sectors[$Nearest_FIG_i]
		getSectorParameter $focus "FIGSEC" $isFigged

		if (($isFigged <> 0) AND ($focus <> $_TA))
			getDistance $Dist $_TA $focus
			if ($Dist < 1)
				setVar $Nearest_FIG_Result (" (Fig: " & $focus & ", N/A Hops)")
			elseif ($Dist = 1)
				setVar $Nearest_FIG_Result (" (Fig: " & $focus & ", " & $Dist & " Hop)")
			else
				setVar $Nearest_FIG_Result (" (Fig: " & $focus & ", " & $Dist & " Hops)")
			end
			return
		end
    	add $Nearest_FIG_i 1
	end
	return

:Discod
		killAllTriggers
	    getTime $LOG_STAMP "h:nna/p - d/m/yyy"
	    write $LName ("CONNECTION LOST                         " & $LOG_STAMP)
	   	Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Disconnected **"
	   	:Disco_Test
		if (CONNECTED <> TRUE)
			setDelayTrigger		Emancipate_CPU		:Emancipate_CPU 4000
			Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Auto Resume Initiated - Awaiting Connection!**"
			pause
			:Emancipate_CPU
			goto :Disco_Test
		end
		waitfor "(?="
		setDelayTrigger		WaitingABit		:WaitingABit	3000
		Echo "**" & ANSI_14 & $TagLineB & ANSI_15 & " Connected - Waiting 3 Seconds For Valid Prompt!**"
		pause
		:WaitingABit
		killAllTriggers
		gosub :quikstats
		if ($CURRENT_PROMPT <> "Undefined")
			send ("'" & $TagLineB & " Restarting...*")
		    waitfor "Message sent on sub-space channel"
		    setDelayTrigger	RestartDelay	:RestartDelay	3000
	        getTime $LOG_STAMP "h:nna/p - d/m/yyy"
    	    write $LName ("CONNECTION ESTABLISHED - Restarting " & $LOG_STAMP)
	   		goto :Loop_De_Lou
	   	else
	   		send (" p d 0* 0* 0* * *Q* *** * c q q q q q z 2 2 c q * z * *** * * '" & $TagLineB & "Attempting to Reach Correct Prompt...*")
			setTextLineTrigger	EMQ_COMPLETE	:EMQ_DELAY "Attempting to Reach Correct Prompt..."
			setDelayTrigger 	EMQ_DELAY		:EMQ_DELAY 3000
			pause
			:EMQ_DELAY
			killAllTriggers
			goto :Disco_Test
		end


:quikstats
	SetVar $CURRENT_PROMPT 		"Undefined"
	killtrigger noprompt
	killtrigger prompt1
	killtrigger prompt2
	killtrigger prompt3
	killtrigger prompt4
	killtrigger statlinetrig
	killtrigger getLine2
	setTextTrigger 		prompt1 	:allPrompts 		"(?="
	setTextLineTrigger 	prompt2 	:secondaryPrompts 	"(?)"
	setTextLineTrigger 	statlinetrig 	:statStart 		#179
	setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
	setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
	send "^Q/"
	pause

	:allPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt1 :allPrompts "(?="
		pause
	:secondaryPrompts
		getWord currentansiline $checkPrompt 1
		getWord currentline $tempPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT $tempPrompt
		end
		setTextLineTrigger prompt2 :secondaryPrompts "(?)"
		pause
	:terraPrompts
		killtrigger prompt3
		killtrigger prompt4
		getWord currentansiline $checkPrompt 1
		getWordPos $checkPrompt $pos "[35m"
		if ($pos > 0)
			SetVar $CURRENT_PROMPT "Terra"
		end
		setTextTrigger		prompt3         :terraPrompts		"Do you wish to (L)eave or (T)ake Colonists?"
		setTextTrigger		prompt4         :terraPrompts		"How many groups of Colonists do you want to take ("
		pause
	:statStart
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger noprompt
		SetVar $stats ""
		SetVar $wordy ""
	:statsline
		killtrigger statlinetrig
		killtrigger getLine2
		SetVar $line2 CURRENTLINE
		replacetext $line2 #179 " "
		striptext $line2 ","
		SetVar $stats $stats & $line2
		getWordPos $line2 $pos "Ship"
		if ($pos > 0)
			goto :gotStats
		else
			setTextLineTrigger getLine2 :statsline
			pause
		end

	:gotStats
		SetVar $stats $stats & " @@@"

		SetVar $current_word 0
		while ($wordy <> "@@@")
			if ($wordy = "Sect")
				getWord $stats $CURRENT_SECTOR   	($current_word + 1)
			elseif ($wordy = "Turns")
				getWord $stats $TURNS  				($current_word + 1)
			elseif ($wordy = "Creds")
				getWord $stats $CREDITS  			($current_word + 1)
			elseif ($wordy = "Figs")
				getWord $stats $FIGHTERS   			($current_word + 1)
			elseif ($wordy = "Shlds")
				getWord $stats $SHIELDS  			($current_word + 1)
			elseif ($wordy = "Hlds")
				getWord $stats $TOTAL_HOLDS   		($current_word + 1)
			elseif ($wordy = "Ore")
				getWord $stats $ORE_HOLDS    		($current_word + 1)
			elseif ($wordy = "Org")
				getWord $stats $ORGANIC_HOLDS    	($current_word + 1)
			elseif ($wordy = "Equ")
				getWord $stats $EQUIPMENT_HOLDS    	($current_word + 1)
			elseif ($wordy = "Col")
				getWord $stats $COLONIST_HOLDS    	($current_word + 1)
			elseif ($wordy = "Phot")
				getWord $stats $PHOTONS   			($current_word + 1)
			elseif ($wordy = "Armd")
				getWord $stats $ARMIDS   			($current_word + 1)
			elseif ($wordy = "Lmpt")
				getWord $stats $LIMPETS   			($current_word + 1)
			elseif ($wordy = "GTorp")
				getWord $stats $GENESIS 	 		($current_word + 1)
			elseif ($wordy = "TWarp")
				getWord $stats $TWARP_TYPE  		($current_word + 1)
			elseif ($wordy = "Clks")
				getWord $stats $CLOAKS   			($current_word + 1)
			elseif ($wordy = "Beacns")
				getWord $stats $BEACONS 			($current_word + 1)
			elseif ($wordy = "AtmDt")
				getWord $stats $ATOMIC  			($current_word + 1)
			elseif ($wordy = "Corbo")
				getWord $stats $CORBO   			($current_word + 1)
			elseif ($wordy = "EPrb")
				getWord $stats $EPROBES 	  		($current_word + 1)
			elseif ($wordy = "MDis")
				getWord $stats $MINE_DISRUPTORS   	($current_word + 1)
			elseif ($wordy = "PsPrb")
				getWord $stats $PSYCHIC_PROBE  		($current_word + 1)
			elseif ($wordy = "PlScn")
				getWord $stats $PLANET_SCANNER  	($current_word + 1)
			elseif ($wordy = "LRS")
				getWord $stats $SCAN_TYPE    		($current_word + 1)
			elseif ($wordy = "Aln")
				getWord $stats $ALIGNMENT    		($current_word + 1)
			elseif ($wordy = "Exp")
				getWord $stats $EXPERIENCE    		($current_word + 1)
			elseif ($wordy = "Corp")
				getWord $stats $CORP  	 			($current_word + 1)
			elseif ($wordy = "Ship")
				getWord $stats $SHIP_NUMBER   		($current_word + 1)
			end
			add $current_word 1
			getWord $stats $wordy $current_word
		end
	:doneQuikstats
		killtrigger prompt1
		killtrigger prompt2
		killtrigger prompt3
		killtrigger prompt4
		killtrigger statlinetrig
		killtrigger getLine2
	return
