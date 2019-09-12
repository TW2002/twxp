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

# SUB:       StripCorp
# Passed:    $Player - Player name with corp
# Triggered: Anywhere
# Returned:  $Player - Player name without corp

:StripCorp
  # sys_check
  
  getLength $Player $Len
  
  if ($Len < 3)
    return
  end
  
  cutText $Player $CorpData $Len 1
  
  if ($CorpData = "]")
    subtract $Len 3
    cutText $Player $CorpData $Len 99
    getWord $CorpData $CorpData 1
    StripText $Player " " & $CorpData
    StripText $CorpData "["
    StripText $CorpData "]"
  end
  
  return

