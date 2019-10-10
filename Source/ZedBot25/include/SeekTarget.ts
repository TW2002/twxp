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

# SUB:       SeekTarget
# Purpose:   Holoscans and checks all adjacents for a target trader
# Passed:    $Name - Target Name
# Triggered: Sector command prompt
# Returned:  $Sector - Sector of target ("0" if not found")

:SeekTarget
  send "sh"
  waitFor "Long Range Scan"
  
  setTextLineTrigger Sector :Sector "Sector  : "
  setTextTrigger NoTarget :NoTarget "Command [TL="
  pause
  
  :Sector
  # remember sector
  getWord CURRENTLINE $Sector 3
  killTrigger Target
  killTrigger Trader
  setTextLineTrigger Sector :Sector "Sector  : "
  setTextLineTrigger Trader :Trader "Traders : "
  pause
  
  :Trader
  # begin trader checks
  getWordPos CURRENTLINE $Test $Name
  if ($Test > 0)
    goto :Target
  end
  setTextLineTrigger Target :Target $Name
  pause
  
  :Target
  # target in sector
  killTrigger Sector
  killTrigger Trader
  killTrigger Target
  killTrigger NoTarget
  return
  
  :NoTarget
  # target not found  
  killTrigger Sector
  killTrigger Trader
  killTrigger Target
  killTrigger NoTarget
  setVar $Sector 0
  return
