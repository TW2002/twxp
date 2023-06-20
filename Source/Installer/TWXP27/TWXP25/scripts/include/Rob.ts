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

# SUB:       Rob
# Passed:    $experience - player experience
#            $robFactor
# Triggered: Sector command prompt
# Returned:  $success - "2" if nothing on port, "1" if success, "0" if busted
#            $experience - updated player experience (on success)
#            $holdsLost - holds lost if busted

:Rob
  # sys_check
  
  send "pr*r"
  
  # check for fake bust
  setTextLineTrigger Fakebust :Bust "Suddenly you're Busted!"
  setTextLineTrigger GetCash :GetCash "The Trade Journals estimate this port"
  pause
  
  :Bust
  killTrigger GetCash
  killTrigger Success
  setTextLineTrigger GetLost :GetLost "He arrives shortly"
  pause
  :GetLost
  getWord CURRENTLINE $holdsLost 7
  if ($holdsLost > 0)
    # no cbys here
  end
  setVar $success 0
  return
  
  :GetCash
  killTrigger Fakebust
  getWord CURRENTLINE $PortCash 11
  stripText $PortCash ","
  multiply $PortCash 10
  divide $PortCash 9
  subtract $PortCash 1
  
  if ($PortCash <= 0)
    # port is cleared
    setVar $success 2
    send "0*"
    return
  end
  
  # calculate the amount we can rob
  setVar $RobCash $experience
  multiply $RobCash $robFactor
  
  if ($RobCash > $PortCash)
    setVar $RobCash $PortCash
  end
  
  send $RobCash "*"
  
  # check for bust/success
  setTextLineTrigger Bust :Bust "Suddenly you're Busted!"
  setTextLineTrigger Success :Success "Success!"
  pause
  
  :Success
  killTrigger Bust
  
  setTextLineTrigger GetExp :GetExp "and you receive"
  setTextTrigger NoExp :NoExp "Command [TL="
  pause
  
  :GetExp
  getWord CURRENTLINE $expGain 4
  add $experience $expGain
  
  :NoExp
  killTrigger GetExp
  killTrigger NoExp
  setVar $success 1
  return

