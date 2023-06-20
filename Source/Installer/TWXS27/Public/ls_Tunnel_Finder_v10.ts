	setVar $CURENT_VERSION "1.0"
	setVar $FName			"LS_" & GAMENAME & ".MAJ"
	setArray $Sects			SECTORS
	setVar $TICKER 			1
    setVar $ztm_count 		1
	setVar $_SLOT1 			ANSI_1
	setVar $_SLOT2 			ANSI_1
	setVar $_SLOT3 			ANSI_1
	setVar $_SLOT4 			ANSI_1
	setVar $_SLOT5 			ANSI_1
	setVar $_SLOT6 			ANSI_1
	setVar $_SLOT7 			ANSI_1
	setVar $_SLOT8 			ANSI_1
	setVar $_SLOT9 			ANSI_1
	setVar $_SLOT0 			ANSI_1

	if (CONNECTED)
		gosub :MSGS_OFF
	end


	echo #27 & "[2J"
	echo "***"
	echo "       " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	echo ANSI_14 & "*             LoneStar's Tunnel Finder"
	echo ANSI_15 & "*                      --/--            "
	echo ANSI_8 & "*                   Version " & $CURENT_VERSION & "*"
	echo "       " & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-" & ANSI_8 & "=" & ANSI_15 & #42 & ANSI_8 & "=" & ANSI_7 & "-"
	Echo "*"
	setVar $CashAmount SECTORS
	gosub :CommaSize
	Echo "       " & ANSI_14 & "Game" & ANSI_6 & ": " & ANSI_15 & GAMENAME & ANSI_14 & ",  Sectors" & ANSI_6 & ": " & ANSI_15 & $CashAmount & "**"
	Echo "       " & ANSI_14 & "Z.T.M. Check Running" & ANSI_15 & " - Press Q at any time to Halt, Z to Skip ZTM Check*"
#	setTextOutTrigger Abort1	:Abort "q"
#	setTextOutTrigger Abort2	:Abort "Q"
#	setTextOutTrigger Abort3	:ZTMStop "Z"
#	setTextOutTrigger Abort4	:ZTMStop "z"

	While ($ztm_count <= SECTORS)
		setVar $warps SECTOR.WARPCOUNT[$ztm_count]
		if ($warps = 0)
			echo "*Sector " $ztm_count " has no warps leading out*"
			goto :bad_ztm
		end

		if (SECTOR.WARPINCOUNT[$ztm_count] = 0)
			echo "*Sector " $ztm_count " has no warps leading in*"
			goto :bad_ztm
		end

#        setDelayTrigger ZTMCheck		:ZTMCheck 1
#        pause

#        :ZTMCheck
#        killTrigger ZTMCheck
		setVar $scratch $ztm_count
		gosub :Ticker_Tape

		if ($TICKER >= 200)
			setVar $TICKER 1
		else
			add $TICKER 1
		end
		add $ztm_count 1
	end

	echo #27 & "[1A" & #27 & "[1A" & #27 & "[2K"
	echo "*"& ANSI_14 "       Z.T.M. Passed" & ANSI_15 & " - Proceeding With Tunnel Search...                       *"
	goto :SkipOverZTMAbort

#    :ZTMStop
#    	killTrigger ZTMCheck
#    	killTrigger Abort3
#    	killTrigger Abort4
		echo #27 & "[1A" & #27 & "[1A" & #27 & "[2K"
		echo "*"& ANSI_14 "       Z.T.M. Check Skipped" & ANSI_15 & " - Proceeding With Tunnel Search...                *"

	:SkipOverZTMAbort
	setVar $TICKER 		1
	setVar $cur_sect	11
	setVar $Corruption	0

	while ($cur_sect <= SECTORS)
		getCourse $Course 1 $cur_sect

		if ($Course < 1)
    		add $Corruption 1
		else
			setVar $i 1
			while ($i <= $Course)
				setVar $ptr $Course[$i]
				add $Sects[$ptr] 1
            	add $i 1

			end
		end

#        setDelayTrigger FREQCheckZ		:FREQCheckZ 1
#        pause

#        :FREQCheckZ
#		killTrigger FREQCheckZ

  		setVar $scratch $cur_sect
#  		gosub :Ticker_Tape

		if ($TICKER >= 200)
			setVar $TICKER 1
		else
			add $TICKER 1
		end
		add $cur_sect 1
	end

	echo #27 & "[1A" & #27 & "[1A" & #27 & "[2K"
	echo "*"& ANSI_14 "       Course Plots Complete" & ANSI_15 & " - Parsing Data & Writing To File..               *"

	if ($Corruption <> 0)
		echo "                               " & $Corruption & ", Unsuccesful Course Plots.*"
	end

	setVar $TICKER 		1
	setVar $HEADERLine	"      -----=[SECTOR][HOPS F/TERRA][FREQ]=-----"
	setVar $LinePtr		50
	setVar $LineCount 	3
	setVar $Focus 		1

	DELETE $FName

	write $FName "    -/-   LoneStar's Tunnel Finder - Version " & $CURENT_VERSION & "   -/-"
	write $FName "       "
	write $FName $HEADERLine

	while ($Focus <= SECTORS)
		if (($Sects[$Focus] > 0) AND ($Sects[$Focus] < 10))
			getDistance $dist 1 $Focus
			if ($dist > 10)
				if ((SECTOR.WARPCOUNT[$Focus] = 2) AND (SECTOR.WARPINCOUNT[$Focus] = 2))
					setVar $i 1
					while (SECTOR.WARPSIN[$Focus][$i] > 0)
                    	setVar $Focus_Adj1 SECTOR.WARPSIN[$Focus][$i]
						if ((SECTOR.WARPCOUNT[$Focus_Adj1] <> 2) AND (SECTOR.WARPINCOUNT[$Focus_Adj1] <> 2))
							goto :NextSectorPlease
						end
                    	add $i 1
					end
					setVar $2BPadded $Focus
        			gosub :padsectcnt
					if ($dist < 10)
						setVar $dist "  " & $dist
					elseif ($dist < 100)
						setVar $dist " " & $dist
					else
					end

					if ($Sects[$Focus] < 10)
						setVar $Freq "  " & $Sects[$Focus]
					elseif ($Sects[$Focus] < 100)
						setVar $Freq " " & $Sects[$Focus]
					else
						setVar $Freq $Sects[$Focus]
					end

					if ($LineCount >= $LinePtr)
						add $LinePtr 50
						add $LineCount 1
						write $FName $HEADERLine
					end

					write $FName "               " & $Padded & "      " & $dist & "    " & "  " & $Freq

					add $LineCount 1
				end
			end

        end
        :NextSectorPlease

#        setDelayTrigger FileWrite		:FileWrite 1
#        pause

#        :FileWrite
#		killTrigger FileWrite

  		setVar $scratch $Focus
#   		gosub :Ticker_Tape

		if ($TICKER >= 200)
			setVar $TICKER 1
		else
			add $TICKER 1
		end

    	add $Focus 1
	end

	echo #27 & "[1A" & #27 & "[1A" & #27 & "[2K"
	echo "*"& ANSI_14 "       Tunnel Finder Complete" & ANSI_15 & " - Data File Created: " & ANSI_6 & $FName  "                    "
	echo "***"
	if (CONNECTED)
		gosub :MSGS_ON
	end
	halt


	:Abort
		echo "*" & #27 & "[1A" & #27 & "[2K"
		echo "*" & ANSI_12 "       Script Halted          " & ANSI_15 & "***"
		if (CONNECTED)
			gosub :MSGS_ON
		end
		halt
	:bad_ztm
		echo "*" & #27 & "[1A" & #27 & "[2K"
		echo "*" & ANSI_12 "       Z.T.M. Failed!!       " & ANSI_15 & "***"
		if (CONNECTED)
			gosub :MSGS_ON
		end
		halt

#=--------------------------------------------------------------------------------------------
:padsectcnt
	if ($2BPadded < 10)
		setVar $Padded "    " & $2BPadded
	elseif ($2BPadded < 100)
		setVar $Padded "   " & $2BPadded
	elseif ($2BPadded < 1000)
		setVar $Padded "  " & $2BPadded
	elseif ($2BPadded < 10000)
		setVar $Padded " " & $2BPadded
	else
		setVar $Padded $2BPadded
	end
	return

:Ticker_Tape
	if ($TICKER = 10)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_15
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 20)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_3
		setVar $_SLOT2 ANSI_15
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 30)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_13
		setVar $_SLOT2 ANSI_3
		setVar $_SLOT3 ANSI_15
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 40)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_9
		setVar $_SLOT2 ANSI_13
		setVar $_SLOT3 ANSI_3
		setVar $_SLOT4 ANSI_15
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 50)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_9
		setVar $_SLOT3 ANSI_13
		setVar $_SLOT4 ANSI_3
		setVar $_SLOT5 ANSI_15
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 60)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_9
		setVar $_SLOT4 ANSI_13
		setVar $_SLOT5 ANSI_3
		setVar $_SLOT6 ANSI_15
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 70)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_9
		setVar $_SLOT5 ANSI_13
		setVar $_SLOT6 ANSI_3
		setVar $_SLOT7 ANSI_15
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 80)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_9
		setVar $_SLOT6 ANSI_13
		setVar $_SLOT7 ANSI_3
		setVar $_SLOT8 ANSI_15
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 90)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_9
		setVar $_SLOT7 ANSI_13
		setVar $_SLOT8 ANSI_3
		setVar $_SLOT9 ANSI_15
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 100)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_9
		setVar $_SLOT8 ANSI_13
		setVar $_SLOT9 ANSI_3
		setVar $_SLOT0 ANSI_15
	elseif ($TICKER = 110)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_9
		setVar $_SLOT8 ANSI_13
		setVar $_SLOT9 ANSI_15
		setVar $_SLOT0 ANSI_3
	elseif ($TICKER = 120)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_15
		setVar $_SLOT9 ANSI_3
		setVar $_SLOT0 ANSI_13
	elseif ($TICKER = 130)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_15
		setVar $_SLOT8 ANSI_3
		setVar $_SLOT9 ANSI_13
		setVar $_SLOT0 ANSI_9
	elseif ($TICKER = 140)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_15
		setVar $_SLOT7 ANSI_3
		setVar $_SLOT8 ANSI_13
		setVar $_SLOT9 ANSI_9
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 150)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_15
		setVar $_SLOT6 ANSI_3
		setVar $_SLOT7 ANSI_13
		setVar $_SLOT8 ANSI_9
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 160)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_1
		setVar $_SLOT4 ANSI_15
		setVar $_SLOT5 ANSI_3
		setVar $_SLOT6 ANSI_13
		setVar $_SLOT7 ANSI_9
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 170)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_1
		setVar $_SLOT3 ANSI_15
		setVar $_SLOT4 ANSI_3
		setVar $_SLOT5 ANSI_13
		setVar $_SLOT6 ANSI_9
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 180)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_1
		setVar $_SLOT2 ANSI_15
		setVar $_SLOT3 ANSI_3
		setVar $_SLOT4 ANSI_13
		setVar $_SLOT5 ANSI_9
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 190)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_15
		setVar $_SLOT2 ANSI_3
		setVar $_SLOT3 ANSI_13
		setVar $_SLOT4 ANSI_9
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	elseif ($TICKER = 200)
		setVar $DO_DRAW TRUE
		setVar $_SLOT1 ANSI_15
		setVar $_SLOT2 ANSI_13
		setVar $_SLOT3 ANSI_9
		setVar $_SLOT4 ANSI_1
		setVar $_SLOT5 ANSI_1
		setVar $_SLOT6 ANSI_1
		setVar $_SLOT7 ANSI_1
		setVar $_SLOT8 ANSI_1
		setVar $_SLOT9 ANSI_1
		setVar $_SLOT0 ANSI_1
	end

	if  ($DO_DRAW)
		setVar $CashAmount $scratch
		gosub :CommaSize
		Echo ANSI_0 & "*         " & $_SLOT1 & "°" & $_SLOT2 & "°"  & $_SLOT3 & "°"  & $_SLOT4 & "°"  & $_SLOT5 & "°"  & $_SLOT6 & "°"  & $_SLOT7 & "°"  & $_SLOT8 & "°"  & $_SLOT9 & "°"  & $_SLOT0 & "°" & "  " & ANSI_14 & $CashAmount & "    " & ANSI_0 & #27 & "[1A" & #27 & "[K"
		setVar $DO_DRAW FALSE
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

:MSGS_ON
    :ON_AGAIN
    setTextTrigger onMSGS_ON  :onMSGS_ON "Displaying all messages."
    setTextTrigger onMSGS_OFF :onMSGS_OFF "Silencing all messages."
    send "|"
    pause
    :onMSGS_OFF
    killAllTriggers
    goto :ON_AGAIN
    :onMSGS_ON
    killAllTriggers
    return
:MSGS_OFF
    :OFF_AGAIN
    setTextTrigger offMSGS_OFF :offMSGS_OFF "Silencing all messages."
    setTextTrigger offMSGS_ON  :offMSGS_ON "Displaying all messages."
    send "|"
    pause
    :offMSGS_ON
    killAllTriggers
    goto :OFF_AGAIN
    :offMSGS_OFF
    killAllTriggers
    return
