# Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.


#set values for starters 
#if at dock/terra send info
#write




	reqRecording
	logging off
	gosub :BOT~loadVars
				
	
	
	setVar $BOT~help[1] $BOT~tab&" sentinel {cim} {clv} {cycletime}"
	setVar $BOT~help[2] $BOT~tab&" Sentinel - Originally written by Xide"
	setVar $BOT~help[3] $BOT~tab&" Options:"
	setVar $BOT~help[4] $BOT~tab&"    - {cim}    - does cim hunting - Default off"
	setVar $BOT~help[5] $BOT~tab&"    - {clv}    - checks clv for changes - Default off"
	setVar $BOT~help[6] $BOT~tab&"    - {cycletime}    - How long between cycles; def 30secs"
	
	gosub :bot~helpfile

	setVar $BOT~script_title "Sentinel"
	gosub :BOT~banner

# get defaults
#loadVar $SentinelSaved


setVar $sentinel_PerformCIM 0
setVar $sentinel_PerformCLV 1
setVar $sentinel_PerformOnline 1
setVar $sentinel_BroadcastSS 1
setVar $sentinel_CLVDetail 1
setVar $sentinel_CLVCorp 0
setVar $sentinel_Inactivity 0
setVar $sentinel_CycleTime 30000
setVar $sentinel_LogFile GAMENAME & "_SENTINAL.txt"

if ($bot~parm1 = "")
	setVar $SWITCHBOARD~message "Must at least select CLV*"
	gosub :SWITCHBOARD~switchboard
	halt
end
if (($bot~parm1 = "cim") or ($bot~parm2 = "cim") or ($bot~parm3 = "cim"))
	setVar $sentinel_PerformCIM 1
end
if (($bot~parm1 = "clv") or ($bot~parm2 = "clv") or ($bot~parm3 = "clv"))
	setVar $sentinel_PerformCLV 1
end

setvar $cycleerror 0
isNumber $test $bot~parm1
IF (($test) and ($bot~parm1 <> 0))
	if ($bot~parm1 > 5)
		setVar $sentinel_CycleTime (1000 * $bot~parm1)
	else
		setvar $cycleerror 1
	end
END

isNumber $test $bot~parm2
IF (($test) and ($bot~parm2 <> 0))
	if ($bot~parm2 > 5)
		setVar $sentinel_CycleTime (1000 * $bot~parm2)
	else
		setvar $cycleerror 1
	end

END

 isNumber $test $bot~parm3
IF (($test) and ($bot~parm3 <> 0))

	if ($bot~parm3 > 5)
		setVar $sentinel_CycleTime (1000 * $bot~parm3)
	else
		setvar $cycleerror 1
	end

END

if ($cycleerror = 1)
	setVar $SWITCHBOARD~message "Cycle Time should be a number 5 or greater.*"
	gosub :SWITCHBOARD~switchboard
	halt	
end

setVar $s "Starting Sentinel with: "
if ($sentinel_PerformCLV = 1)
	setVar $s $s & "CLV Check "
end
if ($sentinel_PerformCIM = 1)
	setVar $s $s & "CIM Check "
end
setVar $d ($sentinel_CycleTime/1000)
setVar $s $s & " Every "  & $d & " Seconds."


if (CONNECTED = 0)
  # jump to inactivity mode
  clientMessage "No connection detected - jumping to inactivity mode with last used settings"
  goto :Inactivity
end

	setVar $SWITCHBOARD~message  $s & "*"
	gosub :SWITCHBOARD~switchboard
	

if ($sentinel_LogFile = "")
  setVar $sentinel_LogFile "0"
end

if ($sentinel_Inactivity)
  :inactivityReset
  killTrigger cycleDelay
  setTextLineTrigger inactivity :inactivity "INACTIVITY WARNING"
  pause
  
  :inactivity
  getWord CURRENTLINE $test 1
  if ($test <> "INACTIVITY")
    goto :inactivityReset
  end
  
  setTextOutTrigger inactivityTextOut :inactivityTextOut
  goto :activate
  
  :inactivityTextOut
  getOutText $text 
  processOut $text
  goto :inactivityReset
end


:activate

if ($sentinel_PerformCLV)
  # check if we're at the command prompt or in a citadel
  getWord CURRENTLINE $test 1
  
  if ($test = "Command") or ($test = "Citadel")
    setVar $CheckCLVLogFile $sentinel_LogFile
    setVar $CheckCLVBroadcast $sentinel_BroadcastSS
    setVar $CheckCLVDetail $sentinel_CLVDetail
    setVar $CheckCLVFigCorp $sentinel_CLVCorp
    send "clvq"
    gosub :CheckCLV
  end
end

if ($sentinel_PerformOnline)
  setVar $CheckOnlineLogFile $sentinel_LogFile
  setVar $CheckOnlineBroadcast $sentinel_BroadcastSS
  gosub :CheckOnline
end

if ($sentinel_PerformCIM)
  setVar $CheckCIMLogFile $sentinel_LogFile
  setVar $CheckCIMBroadcast $sentinel_BroadcastSS
  gosub :CheckCIM
end

setDelayTrigger cycleDelay :activate $sentinel_CycleTime
pause


:sub_SetMenu
  if ($sentinel_PerformCIM)
    setMenuValue "PerformCIM" YES
  else
    setMenuValue "PerformCIM" NO
  end
  
  if ($sentinel_PerformCLV)
    setMenuValue "PerformCLV" YES
  else
    setMenuValue "PerformCLV" NO
  end
  
  if ($sentinel_PerformOnline)
    setMenuValue "PerformOnline" YES
  else
    setMenuValue "PerformOnline" NO
  end
  
  if ($sentinel_BroadcastSS)
    setMenuValue "BroadcastSS" YES
  else
    setMenuValue "BroadcastSS" NO
  end
  
  if ($sentinel_CLVDetail = 0)
    setMenuValue "CLVDetail" LOW
  elseif ($sentinel_CLVDetail = 2)
    setMenuValue "CLVDetail" MEDIUM
  else
    setMenuValue "CLVDetail" HIGH
  end
  
  if ($sentinel_Inactivity)
    setMenuValue "Inactivity" ON
  else
    setMenuValue "Inactivity" OFF
  end
  
  setMenuValue "CLVCorp" $sentinel_CLVCorp
  setMenuValue "LogFile" $sentinel_LogFile
  setMenuValue "CycleTime" $sentinel_CycleTime
  
  return


# includes:


:CheckCLV
  # sys_check
  
  getDate $date
  getTime $time
  setVar $date $date & " "
  
  if ($CheckCLVPod = "0")
    setVar $CheckCLVPod #42 & #42 & #42 & " Escape Pod " & #42 & #42 & #42
  end
  
  setVar $CLVFigsHit 0
  
  setTextLineTrigger CLVBeginCheck :CLVBeginCheck "--- ---------------------"
  pause
  
  :CLVBeginCheck
  setTextLineTrigger CLVCheck :CLVCheck
  pause
  
  :CLVCheck
  getLength CURRENTLINE $CLVLen
  
  if ($CLVLen >= 61)
    cutText CURRENTLINE $CLVPlyr 30 31
      
    # shave the spaces off the name
    setVar $CLVPlayer ""
    setVar $CLVWord 1
    :CLVWord
    getWord $CLVPlyr $CLVPWord $CLVWord
    if ($CLVPWord <> 0)
      if ($CLVWord = 1)
        setVar $CLVPlayer $CLVPWord
      else
        setVar $CLVPlayer $CLVPlayer & " " & $CLVPWord
      end
      add $CLVWord 1
      goto :CLVWord
    end
      
    setVar $CLVLRank[$CLVPlayer] $CLVRank[$CLVPlayer]
    setVar $CLVLAlign[$CLVPlayer] $CLVAlign[$CLVPlayer]
    setVar $CLVLCorp[$CLVPlayer] $CLVCorp[$CLVPlayer]
    setVar $CLVLShip[$CLVPlayer] $CLVShip[$CLVPlayer]
      
    getWord CURRENTLINE $CLVRank[$CLVPlayer] 2
    getWord CURRENTLINE $CLVAlign[$CLVPlayer] 3
    getWord CURRENTLINE $CLVCorp[$CLVPlayer] 4
    cutText CURRENTLINE $CLVShip[$CLVPlayer] 61 999
    
    stripText $CLVRank[$CLVPlayer] ","
    stripText $CLVAlign[$CLVPlayer] ","
    
    if ($CLVCorp[$CLVPlayer] <> #42 & #42)
      add $CLVCorpNum[$CLVCorp[$CLVPlayer]] 1

      add $CLVCorpBaseAlign[$CLVCorp[$CLVPlayer]] $CLVAlign[$CLVPlayer]
    
      if ($CLVCorp[$CLVPlayer] > $CLVHighestCorp)
        setVar $CLVHighestCorp $CLVCorp[$CLVPlayer]
      end
    end
    
    setVar $CLVRawName $CLVPlayer & "(" & $CLVCorp[$CLVPlayer] & ")"
    
    if ($Colour = "1")
      if ($CLVAlign[$CLVPlayer] < 0)
        setVar $CLVClr #3 & "4" & $CLVPlayer & #3 & "6(" & $CLVCorp[$CLVPlayer] & ")"
      else
        setVar $CLVClr #3 & "12" & $CLVPlayer & #3 & "6(" & $CLVCorp[$CLVPlayer] & ")"
      end
    else
      setVar $CLVClr $CLVRawName
    end
      
    if ($CLVInit = 0)
      # first check pass, don't report - just save stuff
      setVar $CLV[$CLVCount] $CLVPlayer
      add $CLVCount 1
    else
      # check pass - compare and report
      
      if ($CLVShip[$CLVPlayer] <> $CLVLShip[$CLVPlayer])
        # ship has changed
        if ($CheckCLVLogFile <> "0")
          write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " is now in " & $CLVShip[$CLVPlayer]
        end
        if ($CheckCLVBroadcast = "1")
          send "'CLV: " & $CLVRawName & " is now in " & $CLVShip[$CLVPlayer] & "*"
        end
      end
      if ($CLVCorp[$CLVPlayer] <> $CLVLCorp[$CLVPlayer])
        # corp has changed
        if ($CheckCLVLogFile <> "0")
          write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " has jumped from corp " & $CLVLCorp[$CLVPlayer]
        end
        if ($CheckCLVBroadcast = "1")
          send "'CLV: " & $CLVRawName & " has jumped from corp " & $CLVLCorp[$CLVPlayer] & "*"
        end
      end
      if ($CLVRank[$CLVPlayer] <> $CLVLRank[$CLVPlayer]) or ($CLVAlign[$CLVPlayer] <> $CLVLAlign[$CLVPlayer])
        if ($CLVRank[$CLVPlayer] < $CLVLRank[$CLVPlayer]) and ($CLVLAlign[$CLVPlayer] < "-100") and ($CLVShip[$CLVPlayer] <> "# Ship Destroyed #") and ($CLVShip[$CLVPlayer] <> $pod)
          # player busted
          if ($CheckCLVDetail = "1")
            if ($CheckCLVLogFile <> "0")
              write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " has busted"
            end
            if ($CheckCLVBroadcast = "1")
              send "'CLV: " & $CLVRawName & " has busted" & "*"
            end
          end
        else
          setVar $CLVCashing 0
          
          if ($CLVRank[$CLVPlayer] > $CLVLRank[$CLVPlayer]) and ($CLVAlign[$CLVPlayer] < $CLVLAlign[$CLVPlayer]) and ($CLVLAlign[$CLVPlayer] < "-100")
            setVar $CLVRChange $CLVRank[$CLVPlayer]
            subtract $CLVRChange $CLVLRank[$CLVPlayer]
            setVar $CLVChange $CLVAlign[$CLVPlayer]
            subtract $CLVChange $CLVLAlign[$CLVPlayer]
            
            # player is cashing
            setVar $CLVCashing 1
            if ($CheckCLVDetail = "1")
              if ($CheckCLVLogFile <> "0")
                write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " is cashing (+" & $CLVRChange & " xp, " & $CLVChange & " algn)"
              end
              if ($CheckCLVBroadcast = "1")
                send "'CLV: " & $CLVRawName & " is cashing (+" & $CLVRChange & " xp, " & $CLVChange & " algn)*"
              end
            end
          end
          
          if ($CLVRank[$CLVPlayer] <> $CLVLRank[$CLVPlayer]) and ($CLVCashing = 0)
            # experience has changed
            setVar $CLVChange $CLVRank[$CLVPlayer]
            subtract $CLVChange $CLVLRank[$CLVPlayer]
            if (($CheckCLVDetail = "1") or (($CheckCLVDetail = "2") and (($CLVChange >= "25") or ($CLVChange <= "-25"))))
              if ($CLVChange > 0)
                setVar $CLVChange "+" & $CLVChange
              end
              if ($CheckCLVLogFile <> "0")
                write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " has changed experience (" & $CLVChange & ")"
              end
              if ($CheckCLVBroadcast = "1")
                send "'CLV: " & $CLVRawName & " has changed experience (" & $CLVChange & ")*"
              end
            end
          end
          if ($CLVAlign[$CLVPlayer] <> $CLVLAlign[$CLVPlayer]) and ($CLVCashing = 0)
            # align has changed
            setVar $CLVChange $CLVAlign[$CLVPlayer]
            subtract $CLVChange $CLVLAlign[$CLVPlayer]
            
            setVar $CLVFigCorp 0
            
            if ($CheckCLVFigCorp > 0) and ($CLVCorpAlign[$CheckCLVFigCorp] > 0)
              # find an alignment match with corp figs
              setVar $CLVX $CLVChange
              multiply $CLVX 100
              divide $CLVX $CLVCorpAlign[$CheckCLVFigCorp]
              setVar $CLVZ $CLVX
              divide $CLVZ 100
              multiply $CLVZ 100
              subtract $CLVX $CLVZ
            
              if ($CLVX < 0)
                multiply $CLVX "-1"
              end
            
              if (($CLVX <= 1) or ($CLVX >= 99)) and ((($CLVCorpAlign[6] < 0) and ($CLVChange < 0)) or (($CLVCorpAlign[6] > 0) and ($CLVChange > 0))) and ($CLVZ > 0)
                setVar $CLVFigCorp 1
              end
            end
            
            if ($CLVFigCorp = 0)
              if (($CheckCLVDetail = "1") or (($CheckCLVDetail = "2") and (($CLVChange >= "25") or ($CLVChange <= "-25"))))
                if ($CLVChange > 0)
                  setVar $CLVChange "+" & $CLVChange
                end
            
                if ($CheckCLVLogFile <> "0")
                  write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " has shifted alignment (" & $CLVChange & ")"
                end
                if ($CheckCLVBroadcast = "1")
                  send "'CLV: " & $CLVRawName & " has shifted alignment (" & $CLVChange & ")*"
                end
              end
            else
              setVar $FigsHit 1
              
              if ($CLVChange > 0)
                setVar $CLVChange "+" & $CLVChange
              end
              
              if ($CheckCLVLogFile <> "0")
                write $CheckCLVLogFile $date & $time & " - CLV: " & $CLVClr & " may be shooting our figs (" & $CLVChange & " align)"
              end
              if ($CheckCLVBroadcast = "1")
                send "'CLV: " & $CLVRawName & " may be shooting corp " & $CheckCLVFigCorp & " figs (" & $CLVChange & " align)"
              end
            end
          end
        end
      end
    end
  else
    getWord CURRENTLINE $CLVTest 1
    if ($CLVTest = "==--") or ($CLVTest = "Computer")
      setVar $CLVCorp $CLVHighestCorp
      :CLVNextCorp
      if ($CLVCorp > 0)
        if ($CLVCorpNum[$CLVCorp] > 0)
          divide $CLVCorpBaseAlign[$CLVCorp] $CLVCorpNum[$CLVCorp]
          setVar $CLVCorpAlign[$CLVCorp] $CLVCorpBaseAlign[$CLVCorp]
          divide $CLVCorpAlign[$CLVCorp] 10000
          multiply $CLVCorpAlign[$CLVCorp] "-1"
          setVar $CLVCorpBaseAlign[$CLVCorp] 0
          setVar $CLVCorpNum[$CLVCorp] 0
        end
        subtract $CLVCorp 1
        goto :CLVNextCorp
      end
      
      setVar $CLVInit 1
      return
    end
  end

  goto :CLVBeginCheck

# SUB:       ClearData
# Purpose:   Clears all CLV data for a clean re-check

:ClearData
  # sys_check
  
  setVar $count 1
  :next
  if ($LastPlayer[$count] <> 0)
    setVar $LastPlayer[$count] 0
    add $count 1
    goto :next
  end
  return



  # Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.

# SUB:       CheckOnline (template)
# Passed:    $CheckOnlineLogFile - Name of file to log changes to ("0" for no logging)
#            $CheckOnlineBroadcast - "1" to broadcast changes on sub-space
#            $CheckOnlineInit - "0" if CheckOnline subroutine has not been run, or is to be cleared
# Triggered: Anywhere the "#" global will work

:CheckOnline
  # sys_check
  
  send "#"
  setTextLineTrigger pause5 :pause5 "     Who's Playing     "
  pause
  :pause5
  killTrigger checkFailed
  setVar $Count 1
  setTextLineTrigger GetPlayer :GetPlayer
  pause
  
  :GetPlayer
  
  if (CURRENTLINE = "")
    if ($Count = 1)
      setTextLineTrigger GetPlayer :GetPlayer
      pause
    else
      goto :GotPlayers
    end
  end
  
  setVar $StripRankPlayer CURRENTLINE
  gosub :StripRank
  
  setVar $StripCorpPlayer $StripRankPlayer
  gosub :StripCorp
  
  setVar $Player $StripCorpPlayer
  
  # see if the player exists
  setVar $I 1
  setVar $Found 0
  :NextPlayer
  if ($LastPlayers[$I] <> 0)
    if ($LastPlayers[$I] = $Player)
      setVar $Found 1
    end
    add $I 1
    goto :NextPlayer
  end
  
  if ($Found = 0) and ($CheckOnlineInit = 1)
    getDate $date
    getTime $time
    
    if ($CheckOnlineBroadcast = "1")
      send "'ONLINEUPDATE: " $Player " has entered the game*"
    end
    if ($CheckOnlineLogFile <> "0")
      write $CheckOnlineLogFile $date & " " & $time & " - " & "#: " & $Player & " has entered the game"
    end
  end
  
  setVar $Players[$Count] $Player
  add $Count 1
  setTextLineTrigger GetPlayer :GetPlayer
  pause
  
  :GotPlayers
  setVar $Players[$Count] 0

  # check for missing players
  setVar $Count 1
  
  :CheckNextPlayer
  if ($LastPlayers[$Count] <> 0)
    setVar $I 1
    setVar $Found 0
    
    :CheckNextPlayer2
    if ($Players[$I] <> 0)
      if ($Players[$I] = $LastPlayers[$Count])
        setVar $Found 1
      end
      add $I 1
      goto :CheckNextPlayer2
    end
    
    if ($Found = 0)
      getDate $date
      getTime $time
      
      if ($CheckOnlineBroadcast = "1")
        send "'ONLINEUPDATE: " $LastPlayers[$Count] " has left the game*"
      end
      if ($CheckOnlineLogFile <> "0")
        write $CheckOnlineLogFile $date & " " & $time & " - " & "#: " & $LastPlayers[$Count] & " has left the game"
      end
    end
    
    add $Count 1
    goto :CheckNextPlayer
  end
  
  # copy old new list over old one
  setVar $Count 1
  
  :GetNextPlayer
  if ($Players[$Count] <> 0)
    setVar $LastPlayers[$Count] $Players[$Count]
    add $Count 1
    goto :GetNextPlayer
  end
  
  setVar $LastPlayers[$Count] 0
  setVar $CheckOnlineInit 1
  return

:StripRank
  # sys_check
  
  cutText $StripRankPlayer $Rank 1 6 
  if ($Rank = "Robber")
    cutText $StripRankPlayer $StripRankPlayer 8 999
    return
  end
  if ($Rank = "Pirate")
    cutText $StripRankPlayer $StripRankPlayer 8 999
    return
  end
  if ($Rank = "Ensign")
    cutText $StripRankPlayer $StripRankPlayer 8 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 7 
  if ($Rank = "Captain")
    cutText $StripRankPlayer $StripRankPlayer 9 999
    return
  end
  if ($Rank = "Admiral")
    cutText $StripRankPlayer $StripRankPlayer 9 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 8
  if ($Rank = "Civilian")
    cutText $StripRankPlayer $StripRankPlayer 10 999
    return
  end
  if ($Rank = "Corporal")
    cutText $StripRankPlayer $StripRankPlayer 10 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 9 
  if ($Rank = "Annoyance")
    cutText $StripRankPlayer $StripRankPlayer 11 999
    return
  end
  cutText $StripRankPlayer $Rank 1 9 
  if ($Rank = "Terrorist")
    cutText $StripRankPlayer $StripRankPlayer 11 999
    return
  end
  if ($Rank = "Commander")
    cutText $StripRankPlayer $StripRankPlayer 11 999
    return
  end
  if ($Rank = "Commodore")
    cutText $StripRankPlayer $StripRankPlayer 11 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 10 
  if ($Rank = "Prime Evil")
    cutText $StripRankPlayer $StripRankPlayer 12 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 12
  if ($Rank = "1st Sergeant")
    cutText $StripRankPlayer $StripRankPlayer 14 999
    return
  end
  if ($Rank = "Rear Admiral")
    cutText $StripRankPlayer $StripRankPlayer 14 999
    return
  end
  if ($Rank = "Vice Admiral")
    cutText $StripRankPlayer $StripRankPlayer 14 999
    return
  end
  if ($Rank = "Dread Pirate")
    cutText $StripRankPlayer $StripRankPlayer 14 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 13 
  if ($Rank = "Fleet Admiral")
    cutText $StripRankPlayer $StripRankPlayer 15 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 14
  if ($Rank = "Lance Corporal")
    cutText $StripRankPlayer $StripRankPlayer 16 999
    return
  end
  if ($Rank = "Sergeant Major")
    cutText $StripRankPlayer $StripRankPlayer 16 999
    return
  end
  if ($Rank = "Staff Sergeant")
    cutText $StripRankPlayer $StripRankPlayer 16 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 15
  if ($Rank = "Warrant Officer")
    cutText $StripRankPlayer $StripRankPlayer 17 999
    return
  end
  if ($Rank = "Lieutenant J.G.")
    cutText $StripRankPlayer $StripRankPlayer 17 999
    return
  end
  if ($Rank = "Smuggler Savant")
    cutText $StripRankPlayer $StripRankPlayer 17 999
    return
  end
  if ($Rank = "Infamous Pirate")
    cutText $StripRankPlayer $StripRankPlayer 17 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 16
  if ($Rank = "Gunnery Sergeant")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Menace 3rd Class")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Menace 2nd Class")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Menace 1st Class")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Notorious Pirate")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Galactic Scourge")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  if ($Rank = "Heinous Overlord")
    cutText $StripRankPlayer $StripRankPlayer 18 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 17
  if ($Rank = "Private 1st Class")
    cutText $StripRankPlayer $StripRankPlayer 19 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 18 
  if ($Rank = "Nuisance 3rd Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Nuisance 2nd Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Nuisance 1st Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Smuggler 3rd Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Smuggler 2nd Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Smuggler 1st Class")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Enemy of the State")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  if ($Rank = "Enemy of Humankind")
    cutText $StripRankPlayer $StripRankPlayer 20 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 19 
  if ($Rank = "Enemy of the People")
    cutText $StripRankPlayer $StripRankPlayer 21 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 20 
  if ($Rank = "Lieutenant Commander")
    cutText $StripRankPlayer $StripRankPlayer 22 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 21
  if ($Rank = "Chief Warrant Officer")
    cutText $StripRankPlayer $StripRankPlayer 23 999
    return
  end
  
  cutText $StripRankPlayer $Rank 1 7
  if ($Rank = "Private")
    cutText $StripRankPlayer $StripRankPlayer 9 999
    return
  end
  cutText $StripRankPlayer $Rank 1 8
  if ($Rank = "Sergeant")
    cutText $StripRankPlayer $StripRankPlayer 10 999
    return
  end
  cutText $StripRankPlayer $Rank 1 10 
  if ($Rank = "Lieutenant")
    cutText $StripRankPlayer $StripRankPlayer 12 999
    return
  end
  
  return

:StripCorp
  # sys_check
  
  getLength $StripRankPlayer $Len
  
  if ($Len < 3)
    return
  end
  
  cutText $StripRankPlayer $player~corpData $Len 1
  
  if ($player~corpData = "]")
    subtract $Len 3
    cutText $StripRankPlayer $player~corpData $Len 99
    getWord $player~corpData $player~corpData 1
    StripText $StripRankPlayer " " & $player~corpData
    StripText $player~corpData "["
    StripText $player~corpData "]"
  end
  
  return

# Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.

# SUB:       CheckCIM
# Passed:    $CheckCIMLogFile - Name of file to log changes to ("0" for no logging)
#            $CheckCIMCIMLogFile - Name of file to write CIM to
#            $CheckCIMBroadcast - "1" to broadcast changes on sub-space
#            $Init - "0" if first check
# Triggered: Anywhere the "^" global will work
# Returned:  $FoundChange - "1" if change found

:CheckCIM
  # sys_check
  
  send "^rq"
  setVar $i 1
  setVar $FoundChange 0
  :redoPause
  setTextTrigger pause2 :pause2 ": "
  pause
  :pause2
  getWord CURRENTLINE $test 1
  if ($test <> ":")
    goto :redoPause
  end
  setTextLineTrigger savePort :savePort "%"
  pause
  :savePort
  setVar $line CURRENTLINE
  stripText $line "-"
  stripText $line "%"
  getWord $line $sector 1
  getWord $line $product1 3
  getWord $line $product2 5
  getWord $line $product3 7
  setVar $line $sector & " " & $product1 & " " & $product2 & " " & $product3
  write $CheckCIMCIMLogFile $line
  getDate $date
  getTime $time
  
  if ($Init = 1)
    read "_" & $CheckCIMCIMLogFile $oldPort $i
    getWord $oldPort $oldSector 1
    getWord $oldPort $oldProduct1 2
    getWord $oldPort $oldProduct2 3
    getWord $oldPort $oldProduct3 4
    setVar $line ""
    
    setVar $repSector $sector

    if ($oldSector <> $sector) and ($oldSector <> "EOF")
      # someones dropped or picked up a fig
      setVar $sound 1
      if ($oldSector > $sector)
        # someone picked up a fig
        setVar $line "CIM: Port query opened to " & $sector
        setVar $FoundChange 1
        subtract $i 1
      else
        # someone put down a fig
        setVar $line "CIM: Port query closed to " & $oldSector
        setVar $repSector $oldSector
        setVar $FoundChange 1
        add $i 1
      end
      
      goto :add
    end

    if ($product1 < $oldProduct1)
      setVar $line "CIM: Fuel ore reduced from " & $oldProduct1 & " to " & $product1 & " in " & $sector
      setVar $sound 1
    end
    if ($product2 < $oldProduct2)
      setVar $line "CIM: Organics reduced from " & $oldProduct2 & " to " & $product2 & " in " & $sector
      setVar $sound 1
    end
    if ($product3 < $oldProduct3)
      setVar $line "CIM: Equipment reduced from " & $oldProduct3 & " to " & $product3 & " in " & $sector
      setVar $sound 1
    end

    :add
    
    if ($line <> "")
      if (PORT.BUYFUEL[$repSector])
        setVar $line $line & " (B"
      else
        setVar $line $line & " (S"
      end
    
      if (PORT.BUYORG[$repSector])
        setVar $line $line & "B"
      else
        setVar $line $line & "S"
      end
    
      if (PORT.BUYEQUIP[$repSector])
        setVar $line $line & "B)"
      else
        setVar $line $line & "S)"
      end
    
      if ($CheckCIMBroadcast = "1")
        send "'" $line "*"
      end
      if ($CheckCIMLogFile <> "0")
        write $CheckCIMLogFile $date & " " & $time & " - " & $line
      end

      setVar $FoundChange 1
    end
    
    add $i 1
  end
  
  killTrigger portsSaved
  setTextLineTrigger savePort :savePort "%"
  setTextTrigger portsSaved :portsSaved ": "
  pause

  :portsSaved
  killTrigger checkFailed
  killTrigger savePort
  
  if ($sound = 1)
    sound BASEUSE.wav
  end
  
  setVar $Init 1
  setVar $sound 0
  delete "_" & $CheckCIMCIMLogFile
  rename $CheckCIMCIMLogFile "_" & $CheckCIMCIMLogFile
  return

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\bot\banner\bot"
