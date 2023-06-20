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

# SUB:       GetTarget
# Passed:    $Target - Target name or partial name
# Triggered: Sector command prompt
# Returned:  $Ship - Target ship type
#            $Figs - Target figs
#            $Index - Number of Ns to hit target (or "" if not found)

:GetTarget
  # sys_check
  
  # find the target index
  send "d"
  waitFor "Sector  : "
  setVar $Index 0
  setVar $Found 0
  setTextLineTrigger AddIndex :AddIndex " ftrs,"
  setTextLineTrigger BeginAttack :BeginAttack "Warps to Sector(s)"
  pause

  :AddIndex
  getWord CURRENTLINE $Word 1
  if ($Word = "Federals:")
    setVar $Pos "federals"
  elseif ($Word = "Traders") or ($Word = "Aliens")
    setVar $Pos "traders"
  elseif ($Word = "Ships")
    setVar $Pos "ships"
  end

  if ($Pos = "federals") or ($Pos = "ships")
    add $Index 1
  elseif ($Pos = "traders")
    getWordPos CURRENTLINE $isTarget $Target
    if ($isTarget <> 0)
      setVar $Pos "none"
      setVar $Found 1

      # find out how many figs they have
      getWordPos CURRENTLINE $Start ", w/ "
      getWordPos CURRENTLINE $Length " ftrs,"
      add $Start 5
      subtract $Length $Start
      cutText CURRENTLINE $Figs $Start $Length
      stripText $Figs ","

      # get their ship type
      setTextLineTrigger getShip :getShip " in "
      pause
      :getShip
      getWordPos CURRENTLINE $Start " ("
      getWordPos CURRENTLINE $Length ")"
      add $Start 2
      subtract $Length $Start
      cutText CURRENTLINE $Ship $Start $Length
    else
      add $Index 1
    end
  end
  
  setTextLineTrigger AddIndex :AddIndex " ftrs,"
  pause

  :BeginAttack
  killTrigger AddIndex
  if ($Found = 0)
    setVar $Index ""
  end
  
  return
