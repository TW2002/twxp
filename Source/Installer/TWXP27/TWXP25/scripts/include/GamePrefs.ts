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

# SUB:       SetGamePrefs
# Passed:    $Bank - Unique ID used to restore game prefs
#            $ANSI[$Bank] - "ON" or "OFF" for ANSI requirement
#            $Animation[$Bank] - "ON" or "OFF" for Animation settings
#            $PageMessages[$Bank] - "ON" or "OFF" for Page messages
#            $SubSpace[$Bank] - Subspace channel
#            $FedCom[$Bank] - "ON" or "OFF" for Federation comm-link
#            $Hails[$Bank] - "ON" or "OFF" for private hails
#            $SilenceMessages[$Bank] - "ON" or "OFF" for message silence
#            $AbortDisplayAll[$Bank] - "ON" for abort on all keys or "OFF" for space only
#            $MessageDisplayLong[$Bank] - "ON" for long message display or "OFF" for compact
#            $ScreenPauses[$Bank] - "ON" or "OFF" for screen pauses
#            $AutoFlee[$Bank] - "ON" or "OFF" for online auto flee preference
# Returned:  $ANSI[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $Animation[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $PageMessages[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $SubSpace[$Bank] - Subspace channel before change ("0" for not changed)
#            $FedCom[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $Hails[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $SilenceMessages[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $AbortDisplayAll[$Bank] - Value before change: "ON" or "OFF" or "0" (not changed)
#            $MessageDisplayLong - Value before change: "ON" or "OFF" or "0" (not changed)
#            $ScreenPauses - Value before change: "ON" or "OFF" or "0" (not changed)
#            $AutoFlee - Value before change: "ON" or "OFF" or "0" (not changed)
# Triggered: Sector command prompt

:SetGamePrefs
  # sys_check
  
  # get current game settings
  send "cn"
  waitOn "<Set ANSI and misc settings>"
  setTextLineTrigger ANSI :ANSI "ANSI graphics"
  setTextLineTrigger Animation :Animation "Animation display"
  setTextLineTrigger PageMessages :PageMessages "Page on messages"
  setTextLineTrigger SubSpace :SubSpace "Sub-space radio channel"
  setTextLineTrigger FedCom :FedCom "Federation comm-link"
  setTextLineTrigger Hails :Hails "Receive private hails"
  setTextLineTrigger SilenceMessages :SilenceMessages "Silence ALL messages"
  setTextLineTrigger AbortDisplayAll :AbortDisplayAll "Abort display on keys"
  setTextLineTrigger MessageDisplayLong :MessageDisplayLong "Message Display Mode"
  setTextLineTrigger ScreenPauses :ScreenPauses "Screen Pauses"
  setTextLineTrigger AutoFlee :AutoFlee "Online Auto Flee"
  setTextTrigger displayDone :displayDone "Settings command (?=Help)"
  pause
  
  :ANSI
  getWord CURRENTLINE $OldAnsi 5
  upperCase $OldAnsi
  pause
  
  :Animation
  getWord CURRENTLINE $OldAnimation 5
  upperCase $OldAnimation
  pause
  
  :PageMessages
  getWord CURRENTLINE $OldPageMessages 6
  upperCase $OldPageMessages
  pause
  
  :SubSpace
  getWord CURRENTLINE $OldSubSpace 6
  pause
  
  :FedCom
  getWord CURRENTLINE $OldFedCom 5
  upperCase $OldFedCom
  pause
  
  :Hails
  getWord CURRENTLINE $OldHails 6
  upperCase $OldHails
  pause
  
  :SilenceMessages
  getWord CURRENTLINE $OldSilenceMessages 6
  if ($OldSilenceMessages = "No")
    setVar $OldSilenceMessages "OFF"
  else
    setVar $OldSilenceMessages "ON"
  end
  pause
  
  :AbortDisplayAll
  getWord CURRENTLINE $OldAbortDisplayAll 7
  if ($OldAbortDisplayAll = "SPACE")
    setVar $OldAbortDisplayAll "OFF"
  else
    setVar $OldAbortDisplayAll "ON"
  end
  pause
  
  :MessageDisplayLong
  getWord CURRENTLINE $OldMessageDisplayLong 6
  if ($OldMessageDisplayLong = "Compact")
    setVar $OldMessageDisplayLong "OFF"
  else
    setVar $OldMessageDisplayLong "ON"
  end
  pause
  
  :ScreenPauses
  getWord CURRENTLINE $OldScreenPauses 5
  if ($OldScreenPauses = "No")
    setVar $OldScreenPauses "OFF"
  else

    setVar $OldScreenPauses "ON"
  end
  pause
  
  :AutoFlee
  getWord CURRENTLINE $OldAutoFlee 6
  if ($OldAutoFlee = "No")
    setVar $OldAutoFlee "OFF"
  else
    setVar $OldAutoFlee "ON"
  end
  pause
  
  :displayDone
  killTrigger ANSI
  killTrigger Animation
  killTrigger PageMessages 
  killTrigger SubSpace 
  killTrigger FedCom 
  killTrigger Hails 
  killTrigger SilenceMessages 
  killTrigger AbortDisplayAll 
  killTrigger MessageDisplayLong 
  killTrigger ScreenPauses 
  killTrigger AutoFlee 

  # compare current game settings with new ones - and apply changes
  
  setVar $send ""
  
  if ($ANSI[$Bank] <> $OldANSI) and ($ANSI[$Bank] <> 0)
    setVar $send $send & "1  "
    setVar $ANSI[$Bank] $OldANSI
  end
  if ($Animation[$Bank] <> $OldAnimation) and ($Animation[$Bank] <> 0)
    setVar $send $send & "2  "
    setVar $Animation[$Bank] $OldAnimation
  end
  if ($PageMessages[$Bank] <> $OldPageMessages) and ($PageMessages[$Bank] <> 0)
    setVar $send $send & "3  "
    setVar $PageMessages[$Bank] $OldPageMessages
  end
  if ($SubSpace[$Bank] <> $OldSubSpace) and ($SubSpace[$Bank] <> 0)
    setVar $send $send & "4" & $SubSpace[$Bank] & "*"
    setVar $SubSpace[$Bank] $OldSubSpace
  end
  if ($FedCom[$Bank] <> $OldFedCom) and ($FedCom[$Bank] <> 0)
    setVar $send $send & "5  "
    setVar $FedCom[$Bank] $OldFedCom
  end
  if ($Hails[$Bank] <> $OldHails) and ($Hails[$Bank] <> 0)
    setVar $send $send & "6  "
    setVar $Hails[$Bank] $OldHails
  end
  if ($SilenceMessages[$Bank] <> $OldSilenceMessages) and ($SilenceMessages[$Bank] <> 0)
    setVar $send $send & "7  "
    setVar $SilenceMessages[$Bank] $OldSilenceMessages
  end
  if ($AbortDisplayAll[$Bank] <> $OldAbortDisplayAll) and ($AbortDisplayAll[$Bank] <> 0)
    setVar $send $send & "9  "
    setVar $AbortDisplayAll[$Bank] $OldAbortDisplayAll
  end
  if ($MessageDisplayLong[$Bank] <> $OldMessageDisplayLong) and ($MessageDisplayLong[$Bank] <> 0)
    setVar $send $send & "a  "
    setVar $MessageDisplayLong[$Bank] $OldMessageDisplayLong
  end
  if ($ScreenPauses[$Bank] <> $OldScreenPauses) and ($ScreenPauses[$Bank] <> 0)
    setVar $send $send & "b  "
    setVar $ScreenPauses[$Bank] $OldScreenPauses
  end
  if ($AutoFlee[$Bank] <> $OldAutoFlee) and ($AutoFlee[$Bank] <> 0)
    setVar $send $send & "c  "
    setVar $AutoFlee[$Bank] $OldAutoFlee
  end
  
  send $send "qq"
  return
