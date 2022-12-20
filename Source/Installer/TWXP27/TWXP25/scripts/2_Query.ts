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

setVar $Header~Script "Query"
gosub :Header~Pack2Header

loadVar $QuerySaved

if ($QuerySaved)
  loadVar $Query_Filename
else
  setVar $Query_Filename ""
  saveVar $Query_Filename
  
  setVar $QuerySaved 1
  saveVar $QuerySaved
end

# create setup menu
addMenu "" "Query" "Query Settings" "." "" "Main" FALSE
addMenu "Query" "Filename" "Write to file" "F" :Menu_Filename "" FALSE
addMenu "Query" "GO" "GO!" "G" :Menu_Go "" TRUE

setMenuHelp "Filename" "This option lets you set the name of a text file to output the query results to.  If a file already exists under this name, it will be replaced.  If no file name is specified, then the query will not write to file."

setVar $TestSector~Menu "Query"
setVar $TestSector~Title "Define sectors to list"
gosub :TestSector~SetMenuDefaults
gosub :TestSector~Menu

setMenuHelp "TestSector" "This menu will let you set a blueprint for the sectors that you want to be pulled out by the query."

gosub :sub_SetMenu

# open config menu
openMenu "Query"

:Menu_Filename
getInput $Query_Filename "Enter a file name to save query output to"
saveVar $Query_Filename
gosub :sub_SetMenu
openMenu "Query"

:sub_SetMenu
  setMenuValue "Filename" $Query_Filename
  return
  
:Menu_Go
closeMenu

# loop through all sectors - report the ones that match our query
setVar $i 1
setVar $total 0

echo ANSI_7 "**"

if ($Query_Filename <> "")
  # clear out query output file
  delete $Query_Filename
end

while ($i <= SECTORS)
  setVar $TestSector~Sector $i
  gosub :TestSector~TestSector
  
  if ($TestSector~Match)
    add $total 1
    
    if (PORT.BUYORE[$i])
      setVar $port ANSI_2 & "B"
    else
      setVar $port ANSI_11 & "S"
    end
    
    if (PORT.BUYORG[$i])
      setVar $port $port & ANSI_2 & "B"
    else
      setVar $port $port & ANSI_11 & "S"
    end
    
    if (PORT.BUYEQUIP[$i])
      setVar $port $port & ANSI_2 & "B"
    else
      setVar $port $port & ANSI_11 & "S"
    end
    
    echo ANSI_7 $i ", " $port ANSI_7 ", " SECTOR.DENSITY[$i] " density, " SECTOR.WARPCOUNT[$i] " warp(s) out*"
    
    if ($Query_Filename <> "")
      write $Query_Filename $i
    end
  end

  add $i 1
end

clientMessage "Total sectors found: " & $total
halt 



# includes:
include "include\header"
include "include\testSector"
