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

# SUB:       Refurb
# Passed:    $HoldsLost - Number of cargo holds to buy from class 0/9 (0 to refurb to max)
#            $RefurbPort - Sector number of class 0/9 port to refurb at
#            $BuyFigs - "1" to buy figs when credits are above $CreditLimit
#            $BuyShield - "1" to buy shield when credits are above $CreditLimit
#            $CreditLimit - Minimum amount of onhand credits before buying figs/shield
#            $Method - "E" for express warp
#                      "T" for twarp
#                      "F" for figwarp
# Returned:  $Failed - "0" if refurb successful
#                      "1" if refurb failed due to insufficient cash
# Triggered: Sector command prompt (deep space)

:Refurb
  # sys_check
  
  setVar $Failed "0"

  if ($Method = 0)
    setVar $Method E
  end
    
  setVar $Warp~Dest $RefurbPort
  setVar $Warp~Method $Method
  gosub :Warp~Warp
  
  if (PORT.CLASS[$RefurbPort] = 9)
    # refurb from stardock
    send "ps  gygqs  p"
  else
    # refurb from class 0
    send "pty"
  end
  
  # get prices
  waitOn "Commerce report for:"
  setTextLineTrigger Cargo :Cargo "A  Cargo holds  "
  setTextLineTrigger Fighters :Fighters "B  Fighters  "
  setTextLineTrigger Shield :Shield "C  Shield Points  "
  pause
  
  :Cargo
  getWord CURRENTLINE $CanBuyCargo 10
  pause
  
  :Fighters
  getWord CURRENTLINE $FigPrice 4
  getWord CURRENTLINE $CanBuyFigs 8
  pause
  
  :Shield
  getWord CURRENTLINE $ShieldPrice 5
  getWord CURRENTLINE $CanBuyShield 9
  
  if ($CanBuyCargo < $HoldsLost)
    setVar $Failed "1"
    goto :ExitPort
  end
  
  send "a" $CanBuyCargo "*y"  
  waitOn "Installing your next Cargo"
  setTextLineTrigger Credits :Credits "You have "
  pause
  
  :Credits
  getWord CURRENTLINE $Credits 3
  stripText $Credits ","
  
  if ($BuyFigs = "1")
    # calculate how many figs we should buy
    setVar $x ($Credits - $CreditLimit)
    
    if ($x > 0)
      divide $x ($FigPrice * 2)
      subtract $x 1
      
      if ($x > 0)
        send "b" $x "*"
        subtract $Credits ($x * $FigPrice)
      end
    end
  end
  
  if ($BuyShield = "1")
    # calculate how much shield we should buy
    setVar $x ($Credits - $CreditLimit)
    
    if ($x > 0)
      divide $x $ShieldPrice
      subtract $x 1
      
      if ($x > 0)
        send "c" $x "*"
      end
    end
  end
  
  :ExitPort
  if (PORT.CLASS[$RefurbPort] = 9)
    send "qqq"
  else
    send "q"
  end
  
  return

  
# SUB:       Menu
# Purpose:   Creates subroutine setup submenu
# Passed:    $Menu - Name of parent menu

:Menu
  addMenu $Menu "Refurb" "Refurb Settings" "R" "" "Refurb" FALSE
  addMenu "Refurb" "RefurbPort" "Refurb port (class 0/9)" "P" :Menu_RefurbPort "" FALSE
  addMenu "Refurb" "BuyFigs" "Buy fighters" "F" :Menu_BuyFigs "" FALSE
  addMenu "Refurb" "BuyShield" "Buy shield" "S" :Menu_BuyShield "" FALSE
  addMenu "Refurb" "CreditLimit" "Fig/shield credit limit" "C" :Menu_CreditLimit "" FALSE
  
  setMenuHelp "RefurbPort" "This option sets the port that the script will use for refurbs.  You may enter the sector number of any class 0/9 port that is not fortified by another player."
  setMenuHelp "BuyFigs" "If this option is enabled, the script will buy fighters when it refurbs."
  setMenuHelp "BuyShield" "If this option is enabled, the script will buy shield when it refurbs."
  setMenuHelp "CreditLimit" "This option determines the amount of credits the script will always try to keep onhand when it refurbs.  The script will not buy fighters or shield in such a way that credits fall below this level.  At least 200k credits is strongly recommended."
  
  gosub :sub_SetMenu
  return
  
  :Menu_RefurbPort
  getInput $value "Enter class 0/9 port to refurb at"  
  isNumber $test $value
  if ($test = 0)
    echo ANSI_15 "**Value must be a number*"
    goto :Menu_RefurbPort
  end
  if ($value > SECTORS) or ($value < 1)
    echo ANSI_15 "**Bad sector number*"
    goto :Menu_RefurbPort
  end
  setVar $RefurbPort $value
  saveVar $RefurbPort
  gosub :sub_SetMenu
  openMenu "Refurb"
  
  :Menu_BuyFigs
  if ($BuyFigs)
    setVar $BuyFigs 0
  else
    setVar $BuyFigs 1
  end
  saveVar $BuyFigs
  gosub :sub_SetMenu
  openMenu "Refurb"
 
  :Menu_BuyShield
  if ($BuyShield)
    setVar $BuyShield 0
  else
    setVar $BuyShield 1
  end
  saveVar $BuyShield
  gosub :sub_SetMenu
  openMenu "Refurb"
 
  :Menu_CreditLimit
  getInput $value "Enter credit limit when buying figs/shield"  
  isNumber $test $value
  if ($test = 0)
    echo ANSI_15 "**Value must be a number*"
    goto :Menu_CreditLimit
  end
  setVar $CreditLimit $value
  saveVar $CreditLimit
  gosub :sub_SetMenu
  openMenu "Refurb"
  
  :sub_SetMenu
  setMenuValue "RefurbPort" $RefurbPort
  setMenuValue "CreditLimit" $CreditLimit
  
  if ($BuyFigs)
    setMenuValue "BuyFigs" "ON"
  else
    setMenuValue "BuyFigs" "OFF"
  end
  
  if ($BuyShield)
    setMenuValue "BuyShield" "ON"
  else
    setMenuValue "BuyShield" "OFF"
  end
  
  return  

  
# includes:

include "include\warp"