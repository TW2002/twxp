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

# SUB:       CheckCLV
# Passed:    $CLVPod - String for escape pod, "0" for default
#            $LogFile - Filename of file to log changes to, "0" for no logging
#            $Broadcast - "1" to broadcast changes on sub-space
#            $Colour - "1" to write IRC colour codes to log file
#            $Detail - "1" to broadcast/log details (i.e. exp, align changes)
#                      "2" to broadcast/log details of align/exp changes >= 25 only
#            $FigCorp - Corp number to monitor alignment for fig hits (0 to disable align monitor)
# Returned:  $FigHit - "1" if a fig belonging to $FigCorp was hit
# Triggered: Beginning of CLV/HighScore display

:CheckCLV
  # sys_check
  
  getDate $date
  getTime $time
  setVar $date $date & " "
  
  if ($CLVPod = "0")
    setVar $CLVPod #42 & #42 & #42 & " Escape Pod " & #42 & #42 & #42
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
        if ($LogFile <> "0")
          write $LogFile $date & $time & " - CLV: " & $CLVClr & " is now in " & $CLVShip[$CLVPlayer]
        end
        if ($BroadCast = "1")
          send "'CLV: " & $CLVRawName & " is now in " & $CLVShip[$CLVPlayer] & "*"
        end
      end
      if ($CLVCorp[$CLVPlayer] <> $CLVLCorp[$CLVPlayer])
        # corp has changed
        if ($LogFile <> "0")
          write $LogFile $date & $time & " - CLV: " & $CLVClr & " has jumped from corp " & $CLVLCorp[$CLVPlayer]
        end
        if ($BroadCast = "1")
          send "'CLV: " & $CLVRawName & " has jumped from corp " & $CLVLCorp[$CLVPlayer] & "*"
        end
      end
      if ($CLVRank[$CLVPlayer] <> $CLVLRank[$CLVPlayer]) or ($CLVAlign[$CLVPlayer] <> $CLVLAlign[$CLVPlayer])
        if ($CLVRank[$CLVPlayer] < $CLVLRank[$CLVPlayer]) and ($CLVLAlign[$CLVPlayer] < "-100") and ($CLVShip[$CLVPlayer] <> "# Ship Destroyed #") and ($CLVShip[$CLVPlayer] <> $pod)
          # player busted
          if ($Detail = "1")
            if ($LogFile <> "0")
              write $LogFile $date & $time & " - CLV: " & $CLVClr & " has busted"
            end
            if ($BroadCast = "1")
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
            if ($Detail = "1")
              if ($LogFile <> "0")
                write $LogFile $date & $time & " - CLV: " & $CLVClr & " is cashing (+" & $CLVRChange & " xp, " & $CLVChange & " algn)"
              end
              if ($BroadCast = "1")
                send "'CLV: " & $CLVRawName & " is cashing (+" & $CLVRChange & " xp, " & $CLVChange & " algn)*"
              end
            end
          end
          
          if ($CLVRank[$CLVPlayer] <> $CLVLRank[$CLVPlayer]) and ($CLVCashing = 0)
            # experience has changed
            setVar $CLVChange $CLVRank[$CLVPlayer]
            subtract $CLVChange $CLVLRank[$CLVPlayer]
            if (($Detail = "1") or (($Detail = "2") and (($CLVChange >= "25") or ($CLVChange <= "-25"))))
              if ($CLVChange > 0)
                setVar $CLVChange "+" & $CLVChange
              end
              if ($LogFile <> "0")
                write $LogFile $date & $time & " - CLV: " & $CLVClr & " has changed experience (" & $CLVChange & ")"
              end
              if ($BroadCast = "1")
                send "'CLV: " & $CLVRawName & " has changed experience (" & $CLVChange & ")*"
              end
            end
          end
          if ($CLVAlign[$CLVPlayer] <> $CLVLAlign[$CLVPlayer]) and ($CLVCashing = 0)
            # align has changed
            setVar $CLVChange $CLVAlign[$CLVPlayer]
            subtract $CLVChange $CLVLAlign[$CLVPlayer]
            
            setVar $CLVFigCorp 0
            
            if ($FigCorp > 0) and ($CLVCorpAlign[$FigCorp] > 0)
              # find an alignment match with corp figs
              setVar $CLVX $CLVChange
              multiply $CLVX 100
              divide $CLVX $CLVCorpAlign[$FigCorp]
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
              if (($Detail = "1") or (($Detail = "2") and (($CLVChange >= "25") or ($CLVChange <= "-25"))))
                if ($CLVChange > 0)
                  setVar $CLVChange "+" & $CLVChange
                end
            
                if ($LogFile <> "0")
                  write $LogFile $date & $time & " - CLV: " & $CLVClr & " has shifted alignment (" & $CLVChange & ")"
                end
                if ($BroadCast = "1")
                  send "'CLV: " & $CLVRawName & " has shifted alignment (" & $CLVChange & ")*"
                end
              end
            else
              setVar $FigsHit 1
              
              if ($CLVChange > 0)
                setVar $CLVChange "+" & $CLVChange
              end
              
              if ($LogFile <> "0")
                write $LogFile $date & $time & " - CLV: " & $CLVClr & " may be shooting our figs (" & $CLVChange & " align)"
              end
              if ($BroadCast = "1")
                send "'CLV: " & $CLVRawName & " may be shooting corp " & $FigCorp & " figs (" & $CLVChange & " align)"
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