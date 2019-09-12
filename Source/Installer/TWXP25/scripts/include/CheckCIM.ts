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
# Passed:    $LogFile - Name of file to log changes to ("0" for no logging)
#            $CIMLogFile - Name of file to write CIM to
#            $Broadcast - "1" to broadcast changes on sub-space
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
  write $CIMLogFile $line
  getDate $date
  getTime $time
  
  if ($Init = 1)
    read "_" & $CIMLogFile $oldPort $i
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
    
      if ($Broadcast = "1")
        send "'" $line "*"
      end
      if ($LogFile <> "0")
        write $LogFile $date & " " & $time & " - " & $line
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
  delete "_" & $CIMLogFile
  rename $CIMLogFile "_" & $CIMLogFile
  return
