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

# SUB:       Land
# Triggered: Sector command prompt
# Purpose:   Lands on first planet in sector, regardless of situation
# Passed:    $Planet - "Q" if to execute quick landing, otherwise will do it slowly
# Returned:  $Planet - "Q" if was able to execute a quick landing, otherwise planet
#                      ID landed on.

:Land
  # sys_check
  
  send "l"
  
  if ($Planet = "Q")
    return
  end
  
  setVar $Planet "Q"
  
  # check for quick landing
  setTextLineTrigger Land_SlowLanding :Land_SlowLanding "Registry#"
  setTextLineTrigger Land_Landed :Land_Landing "Landing sequence engaged..."
  pause
  
  :Land_SlowLanding
  setTextLineTrigger Land_GetID :Land_GetID "<"
  pause
  
  :Land_GetID
  setVar $Land_line CURRENTLINE
  stripText $Land_line "<"
  stripText $Land_line ">"
  getWord $Land_line $Planet 1
  send $Planet "*"
  
  :Land_Landing
  killTrigger Land_SlowLanding
  killTrigger Land_Landed
  
  return


